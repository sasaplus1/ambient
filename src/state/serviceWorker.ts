import { signal } from '@preact/signals';

import { logger } from '../lib/logger';

export type ServiceWorkerStatus =
  | 'unsupported'
  | 'none'
  | 'installing'
  | 'ready'
  | 'waiting';

export const swStatus = signal<ServiceWorkerStatus>('unsupported');

const UPDATE_INTERVAL_MS = 6 * 60 * 60 * 1_000;

let reloading = false;

function setStatus(status: ServiceWorkerStatus): void {
  if (swStatus.value === status) {
    return;
  }

  swStatus.value = status;
  logger.info('sw', `status ${status}`);
}

function applyWaiting(registration: ServiceWorkerRegistration): void {
  if (!document.hidden || !registration.waiting) {
    return;
  }

  // The page, rather than install, chooses this moment so the dashboard never
  // disappears while somebody is looking at it.
  registration.waiting.postMessage({ type: 'skipWaiting' });
}

function watchInstallation(registration: ServiceWorkerRegistration): void {
  const worker = registration.installing;
  if (!worker) {
    return;
  }

  if (!navigator.serviceWorker.controller) {
    setStatus('installing');
  }

  worker.addEventListener('statechange', () => {
    if (
      worker.state === 'installed' &&
      navigator.serviceWorker.controller
    ) {
      setStatus('waiting');
      applyWaiting(registration);
    }
  });
}

function updateRegistration(registration: ServiceWorkerRegistration): void {
  registration.update().catch((error: unknown) => {
    // Being offline is expected for this app, so a failed periodic check is a
    // warning rather than an application error.
    logger.warn('sw', `update failed: ${String(error)}`);
  });
}

/**
 * Register the production worker and coordinate updates with page visibility.
 * Call once after diagnostics so every state transition is visible in the HUD.
 */
export function startServiceWorker(): void {
  if (!import.meta.env.PROD) {
    setStatus('none');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    logger.info('sw', 'status unsupported');
    return;
  }

  setStatus('none');

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // A single controller transition can surface more than once around reload;
    // only the first one may replace this page.
    if (reloading) {
      return;
    }

    reloading = true;
    location.reload();
  });

  navigator.serviceWorker
    .register(new URL('sw.js', location.href))
    .then((registration) => {
      registration.addEventListener('updatefound', () => {
        watchInstallation(registration);
      });

      // A waiting worker can predate this page, so check it separately from
      // updatefound rather than relying on an event that already happened.
      if (registration.waiting) {
        setStatus('waiting');
        applyWaiting(registration);
      } else if (registration.installing) {
        watchInstallation(registration);
      } else if (navigator.serviceWorker.controller) {
        setStatus('ready');
      }

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          applyWaiting(registration);
        } else {
          updateRegistration(registration);
        }
      });

      window.setInterval(() => {
        updateRegistration(registration);
      }, UPDATE_INTERVAL_MS);
    })
    .catch((error: unknown) => {
      setStatus('none');
      logger.error('sw', `registration failed: ${String(error)}`);
    });
}
