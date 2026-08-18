import { useEffect, useState } from 'preact/hooks';

const WAKING_EVENTS = ['pointerdown', 'pointermove', 'keydown'] as const;

/**
 * Whether the screen has been touched in the last `idleMs`.
 *
 * Used to bring the corner controls up when someone reaches for them and let
 * them settle back afterwards. A dashboard is looked at far more than it is
 * used, so the resting state is the one that matters.
 */
export function useRecentActivity(idleMs: number): boolean {
  const [active, setActive] = useState(true);

  useEffect(() => {
    let timer: number | undefined;

    const wake = () => {
      setActive(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setActive(false), idleMs);
    };

    wake();

    for (const event of WAKING_EVENTS) {
      window.addEventListener(event, wake, { passive: true });
    }

    return () => {
      window.clearTimeout(timer);

      for (const event of WAKING_EVENTS) {
        window.removeEventListener(event, wake);
      }
    };
  }, [idleMs]);

  return active;
}
