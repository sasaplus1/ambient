import { signal } from '@preact/signals';

import { logger } from '../lib/logger';

export const online = signal(navigator.onLine);
export const startedAt = signal(Date.now());

/**
 * Wire the global signals worth watching on a device left running for days.
 * Call once at startup, before the first render, so nothing is missed.
 */
export function startDiagnostics(): void {
  logger.info('app', `started commit=${__COMMIT_SHA__}`);

  addEventListener('error', (event) => {
    logger.error('window', event.message || 'unknown error');
  });

  addEventListener('unhandledrejection', (event) => {
    logger.error('promise', String(event.reason));
  });

  addEventListener('online', () => {
    online.value = true;
    logger.info('network', 'online');
  });

  addEventListener('offline', () => {
    online.value = false;
    logger.warn('network', 'offline');
  });

  document.addEventListener('visibilitychange', () => {
    logger.debug('visibility', document.visibilityState);
  });
}

export function formatUptime(now: number, since: number): string {
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 0) {
    return `${days}d${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h${minutes}m`;
  }

  return `${minutes}m`;
}
