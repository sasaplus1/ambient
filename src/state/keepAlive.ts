/* Technique from https://gitlab.com/DaGammla/keep-silk-open */

import { logger } from '../lib/logger';
import { createNearSilentWav } from '../lib/silentAudio';

const SECONDS = 15;

let audio: HTMLAudioElement | null = null;
let blob: Blob | null = null;
let objectUrl: string | null = null;
let onEnded: (() => void) | null = null;

export function isSilk(userAgent: string): boolean {
  return userAgent.toLowerCase().includes('silk');
}

function releaseUrl(): void {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
}

function mintUrl(source: Blob): string {
  releaseUrl();
  objectUrl = URL.createObjectURL(source);

  return objectUrl;
}

function attempt(element: HTMLAudioElement): void {
  void element.play().catch((error: unknown) => {
    logger.error('keep-alive', `play failed: ${String(error)}`);
    stopKeepAlive();
  });
}

export function startKeepAlive(): void {
  if (audio || !isSilk(navigator.userAgent)) {
    return;
  }

  blob = new Blob([createNearSilentWav(SECONDS)], { type: 'audio/wav' });

  const element = new Audio();

  element.src = mintUrl(blob);

  onEnded = () => {
    if (!audio || !blob) {
      return;
    }

    audio.src = mintUrl(blob);
    audio.currentTime = 0;
    attempt(audio);
  };

  element.addEventListener('ended', onEnded);

  audio = element;
  logger.info('keep-alive', 'started');

  attempt(element);
}

export function stopKeepAlive(): void {
  const element = audio;

  audio = null;
  blob = null;

  if (!element) {
    releaseUrl();

    return;
  }

  if (onEnded) {
    element.removeEventListener('ended', onEnded);
    onEnded = null;
  }

  element.pause();
  element.removeAttribute('src');
  element.load();

  releaseUrl();
  logger.info('keep-alive', 'stopped');
}
