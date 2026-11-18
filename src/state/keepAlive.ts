/* Technique from https://gitlab.com/DaGammla/keep-silk-open */

import { logger } from '../lib/logger';
import { createNearSilentWav } from '../lib/silentAudio';

const SECONDS = 15;
const RETRY_MS = 5000;

let audio: HTMLAudioElement | null = null;
let objectUrl: string | null = null;
let onEnded: (() => void) | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

export function isSilk(userAgent: string): boolean {
  return userAgent.toLowerCase().includes('silk');
}

function cancelRetry(): void {
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

async function cycle(element: HTMLAudioElement, source: Blob): Promise<void> {
  const previous = objectUrl;

  objectUrl = URL.createObjectURL(source);
  element.src = objectUrl;
  element.currentTime = 0;

  try {
    await element.play();
  } catch (error: unknown) {
    logger.error('keep-alive', `play failed: ${String(error)}`);

    if (audio === element) {
      cancelRetry();
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void cycle(element, source);
      }, RETRY_MS);
    }
  } finally {
    if (previous) {
      URL.revokeObjectURL(previous);
    }
  }
}

export function startKeepAlive(): void {
  if (audio || !isSilk(navigator.userAgent)) {
    return;
  }

  const source = new Blob([createNearSilentWav(SECONDS)], {
    type: 'audio/wav',
  });
  const element = new Audio();

  onEnded = () => {
    if (audio === element) {
      void cycle(element, source);
    }
  };

  element.addEventListener('ended', onEnded);

  audio = element;
  logger.info('keep-alive', 'started');

  void cycle(element, source);
}

export function stopKeepAlive(): void {
  const element = audio;

  audio = null;
  cancelRetry();

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }

  if (!element) {
    return;
  }

  if (onEnded) {
    element.removeEventListener('ended', onEnded);
    onEnded = null;
  }

  element.pause();
  element.removeAttribute('src');
  element.load();

  logger.info('keep-alive', 'stopped');
}
