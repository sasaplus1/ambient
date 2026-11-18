import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearLogs, errorCount } from '../lib/logger';
import { isSilk, startKeepAlive, stopKeepAlive } from './keepAlive';

const SILK_UA =
  'Mozilla/5.0 (Linux; Android 9) Silk/98.4.3 like Chrome/98.0.4758.136';

class FakeAudio {
  static instances: FakeAudio[] = [];
  static refusePlay = false;

  src = '';
  currentTime = 0;
  play = vi.fn(async () => {
    if (FakeAudio.refusePlay) {
      throw new Error('NotAllowedError');
    }
  });
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn(() => {
    this.src = '';
  });

  listeners = new Map<string, Set<() => void>>();

  constructor() {
    FakeAudio.instances.push(this);
  }

  addEventListener(type: string, listener: () => void): void {
    const set = this.listeners.get(type) ?? new Set();

    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener();
    }
  }

  countFor(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }
}

let createObjectURL: ReturnType<typeof vi.fn>;
let revokeObjectURL: ReturnType<typeof vi.fn>;
let minted = 0;

const only = () => {
  expect(FakeAudio.instances).toHaveLength(1);

  return FakeAudio.instances[0] as FakeAudio;
};

const setUserAgent = (userAgent: string) => {
  vi.stubGlobal('navigator', { userAgent });
};

beforeEach(() => {
  minted = 0;
  FakeAudio.instances = [];
  FakeAudio.refusePlay = false;
  createObjectURL = vi.fn(() => {
    minted += 1;

    return `blob:fake/${minted}`;
  });
  revokeObjectURL = vi.fn();

  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  setUserAgent(SILK_UA);
  clearLogs();
});

afterEach(() => {
  stopKeepAlive();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('isSilk', () => {
  it.each([
    [SILK_UA, true],
    ['Mozilla/5.0 SILK/98.4.3', true],
    ['mozilla/5.0 silk/98.4.3', true],
    ['Mozilla/5.0 (Macintosh) Chrome/140.0.0.0 Safari/537.36', false],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Version/18.0 Safari/605.1', false],
    ['', false],
  ])('answers %s with %s', (userAgent, expected) => {
    expect(isSilk(userAgent)).toBe(expected);
  });
});

describe('startKeepAlive', () => {
  it('creates nothing at all away from Silk', () => {
    setUserAgent('Mozilla/5.0 (Macintosh) Chrome/140.0.0.0 Safari/537.36');

    startKeepAlive();

    expect(FakeAudio.instances).toHaveLength(0);
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('plays once from a blob url on Silk', () => {
    startKeepAlive();

    const audio = only();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(audio.src).toBe('blob:fake/1');
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('ignores a second start rather than doubling up', () => {
    startKeepAlive();
    startKeepAlive();

    expect(FakeAudio.instances).toHaveLength(1);
    expect(only().play).toHaveBeenCalledTimes(1);
  });

  it('hands the blob a mime type, the only hint a blob url carries', () => {
    const blobs: Blob[] = [];
    const seen = createObjectURL.mockImplementation((blob: Blob) => {
      blobs.push(blob);

      return 'blob:fake/typed';
    });

    startKeepAlive();

    expect(seen).toHaveBeenCalledTimes(1);
    expect(blobs[0]?.type).toBe('audio/wav');
  });
});

describe('the ended handler', () => {
  it('revokes the old url, mints a new one and replays from the start', async () => {
    startKeepAlive();

    const audio = only();

    audio.currentTime = 12;
    audio.emit('ended');

    await vi.waitFor(() => {
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake/1');
    });
    expect(audio.src).toBe('blob:fake/2');
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(2);
  });

  it('keeps minting a fresh url on every cycle', async () => {
    startKeepAlive();

    const audio = only();

    audio.emit('ended');
    audio.emit('ended');
    audio.emit('ended');

    expect(audio.src).toBe('blob:fake/4');
    await vi.waitFor(() => {
      expect(revokeObjectURL).toHaveBeenCalledTimes(3);
    });
    expect(audio.play).toHaveBeenCalledTimes(4);
  });
});

describe('stopKeepAlive', () => {
  it('pauses, detaches the source and revokes the url', () => {
    startKeepAlive();

    const audio = only();

    stopKeepAlive();

    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.removeAttribute).toHaveBeenCalledWith('src');
    expect(audio.load).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake/1');
    expect(audio.countFor('ended')).toBe(0);
  });

  it('leaves a stopped element alone when the ended event arrives late', () => {
    startKeepAlive();

    const audio = only();

    stopKeepAlive();
    audio.emit('ended');

    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('can be called without a start', () => {
    expect(() => {
      stopKeepAlive();
    }).not.toThrow();
  });

  it('allows a later start to take over', () => {
    startKeepAlive();
    stopKeepAlive();
    startKeepAlive();

    expect(FakeAudio.instances).toHaveLength(2);
  });
});

describe('a refused play', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeAudio.refusePlay = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('logs it and keeps the element alive', async () => {
    startKeepAlive();

    const audio = only();

    await vi.advanceTimersByTimeAsync(0);

    expect(errorCount.value).toBe(1);
    expect(audio.pause).not.toHaveBeenCalled();
  });

  it('retries with a fresh url after five seconds', async () => {
    startKeepAlive();

    const audio = only();

    await vi.advanceTimersByTimeAsync(4999);
    expect(audio.play).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(audio.src).toBe('blob:fake/2');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake/1');
  });

  it('keeps retrying until play succeeds, then cycles on ended', async () => {
    startKeepAlive();

    const audio = only();

    await vi.advanceTimersByTimeAsync(10000);
    expect(audio.play).toHaveBeenCalledTimes(3);

    FakeAudio.refusePlay = false;
    await vi.advanceTimersByTimeAsync(5000);
    expect(audio.play).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(60000);
    expect(audio.play).toHaveBeenCalledTimes(4);

    audio.emit('ended');
    expect(audio.play).toHaveBeenCalledTimes(5);
  });

  it('stops retrying once stopped', async () => {
    startKeepAlive();

    const audio = only();

    await vi.advanceTimersByTimeAsync(0);
    stopKeepAlive();
    await vi.advanceTimersByTimeAsync(60000);

    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('does not retry a failure that lands after a stop', async () => {
    startKeepAlive();

    const audio = only();

    stopKeepAlive();
    await vi.advanceTimersByTimeAsync(60000);

    expect(audio.play).toHaveBeenCalledTimes(1);
  });
});
