import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { logger } from '../lib/logger';

export type WakeLock = {
  supported: boolean;
  active: boolean;
  request: () => Promise<void>;
  release: () => Promise<void>;
};

/**
 * A wrapper around the Screen Wake Lock API.
 *
 * The OS may drop a wake lock at will, and hiding the tab always releases it.
 * So whether the lock is wanted is tracked here, and it is re-acquired when
 * visibilitychange brings the page back.
 *
 * On unsupported devices - a LineageOS Echo Show 5, say - this does nothing.
 * The always-on display works without a wake lock.
 */
export function useWakeLock(): WakeLock {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const desiredRef = useRef(false);
  const [active, setActive] = useState(false);

  const supported = 'wakeLock' in navigator;

  const acquire = useCallback(async () => {
    if (!supported || sentinelRef.current) {
      return;
    }

    // Requesting while hidden always fails
    if (document.visibilityState !== 'visible') {
      return;
    }

    try {
      const sentinel = await navigator.wakeLock.request('screen');

      sentinelRef.current = sentinel;
      setActive(true);
      logger.info('wake-lock', 'acquired');

      sentinel.addEventListener('release', () => {
        sentinelRef.current = null;
        setActive(false);
        logger.warn('wake-lock', 'released by the system');
      });
    } catch (error) {
      setActive(false);
      logger.error('wake-lock', `failed: ${String(error)}`);
    }
  }, [supported]);

  const request = useCallback(async () => {
    desiredRef.current = true;
    await acquire();
  }, [acquire]);

  const release = useCallback(async () => {
    desiredRef.current = false;

    const sentinel = sentinelRef.current;

    sentinelRef.current = null;
    setActive(false);

    if (!sentinel) {
      return;
    }

    try {
      await sentinel.release();
    } catch {
      // Already released is fine
    }
  }, []);

  useEffect(() => {
    const reacquire = () => {
      if (document.visibilityState === 'visible' && desiredRef.current) {
        void acquire();
      }
    };

    document.addEventListener('visibilitychange', reacquire);

    return () => {
      document.removeEventListener('visibilitychange', reacquire);
    };
  }, [acquire]);

  return { supported, active, request, release };
}
