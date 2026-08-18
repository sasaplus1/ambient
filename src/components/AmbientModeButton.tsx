import { useEffect } from 'preact/hooks';

import { useFullscreen } from '../hooks/useFullscreen';
import { useWakeLock } from '../hooks/useWakeLock';
import { t } from '../state/locale';

import './AmbientModeButton.css';

/** Whether the app was installed as a PWA and launched without browser UI */
function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

/**
 * Starts and stops the always-on mode.
 *
 * requestFullscreen must originate from a user gesture, so this button enters
 * fullscreen and acquires the wake lock together. Launched as a PWA the display
 * is already fullscreen, so only the wake lock is acquired.
 */
export function AmbientModeButton() {
  const fullscreen = useFullscreen();
  const wakeLock = useWakeLock();

  const { request: requestWakeLock } = wakeLock;

  useEffect(() => {
    if (isStandaloneDisplay()) {
      void requestWakeLock();
    }
  }, [requestWakeLock]);

  // Nothing would happen on a device supporting neither, so do not offer it
  if (!fullscreen.supported && !wakeLock.supported) {
    return null;
  }

  const active = fullscreen.active || wakeLock.active;

  const toggle = () => {
    if (active) {
      void fullscreen.exit();
      void wakeLock.release();

      return;
    }

    void fullscreen.enter();
    void wakeLock.request();
  };

  return (
    <button
      type="button"
      class="ambient-button"
      aria-label={active ? t('ambient.stop') : t('ambient.start')}
      aria-pressed={active}
      onClick={toggle}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        {active ? (
          <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
        ) : (
          <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
        )}
      </svg>
    </button>
  );
}
