import { describe, expect, it } from 'vitest';

import { createNearSilentWav } from './silentAudio';

const tagAt = (view: DataView, offset: number, length: number) =>
  Array.from({ length }, (_, index) =>
    String.fromCharCode(view.getUint8(offset + index)),
  ).join('');

describe('createNearSilentWav', () => {
  const seconds = 2;
  const buffer = createNearSilentWav(seconds);
  const view = new DataView(buffer);
  const dataBytes = 8000 * 2 * seconds;

  it('is a header of exactly 44 bytes followed by the samples', () => {
    expect(buffer.byteLength).toBe(44 + dataBytes);
  });

  it.each([
    ['RIFF', 0, 4],
    ['WAVE', 8, 4],
    ['fmt ', 12, 4],
    ['data', 36, 4],
  ])('carries the %s tag at offset %i', (tag, offset, length) => {
    expect(tagAt(view, offset, length)).toBe(tag);
  });

  it.each([
    ['riff size', 4, 36 + dataBytes],
    ['fmt chunk size', 16, 16],
    ['sample rate', 24, 8000],
    ['byte rate', 28, 16000],
    ['data size', 40, dataBytes],
  ])('writes the %s little endian', (_label, offset, expected) => {
    expect(view.getUint32(offset, true)).toBe(expected);
  });

  it.each([
    ['format', 20, 1],
    ['channels', 22, 1],
    ['block align', 32, 2],
    ['bits per sample', 34, 16],
  ])('writes the %s little endian', (_label, offset, expected) => {
    expect(view.getUint16(offset, true)).toBe(expected);
  });

  it('never exceeds one unit of amplitude', () => {
    for (let offset = 44; offset < buffer.byteLength; offset += 2) {
      expect(Math.abs(view.getInt16(offset, true))).toBeLessThanOrEqual(1);
    }
  });

  it('is not pure silence, which a decoder may discard', () => {
    const samples = Array.from({ length: dataBytes / 2 }, (_, index) =>
      view.getInt16(44 + index * 2, true),
    );

    expect(samples.some((sample) => sample > 0)).toBe(true);
    expect(samples.some((sample) => sample < 0)).toBe(true);
  });

  it('starts the samples at offset 44', () => {
    expect(view.getInt16(44, true)).toBe(1);
  });
});
