import { useCallback, useEffect, useState } from 'preact/hooks';

export type Fullscreen = {
  supported: boolean;
  active: boolean;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
};

/**
 * A wrapper around the Fullscreen API.
 *
 * requestFullscreen is rejected unless it originates from a user gesture, so
 * call enter() directly from a button's click handler.
 */
export function useFullscreen(): Fullscreen {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => {
      setActive(document.fullscreenElement !== null);
    };

    sync();
    document.addEventListener('fullscreenchange', sync);

    return () => {
      document.removeEventListener('fullscreenchange', sync);
    };
  }, []);

  const enter = useCallback(async () => {
    if (!document.documentElement.requestFullscreen) {
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Keep displaying even if the device or browser refuses
    }
  }, []);

  const exit = useCallback(async () => {
    if (document.fullscreenElement === null) {
      return;
    }

    try {
      await document.exitFullscreen();
    } catch {
      // As above
    }
  }, []);

  return {
    supported:
      typeof document.documentElement.requestFullscreen === 'function',
    active,
    enter,
    exit,
  };
}
