import { computed, effect, signal, untracked } from '@preact/signals';

import { logger } from '../lib/logger';
import {
  formatShift,
  nextShift,
  NO_SHIFT,
  PIXEL_SHIFT_RANGE,
  type Shift,
} from '../lib/pixelShift';

import { settings } from './settings';

/** Where the dashboard is standing at the moment. */
export const shift = signal<Shift>(NO_SHIFT);

/*
 * One field at a time, rather than the settings object: that object is replaced
 * whenever anything at all is changed. A computed over a primitive only
 * notifies when its own value moves, so picking a theme does not restart the
 * timer and set the dashboard walking.
 */
const enabled = computed(() => settings.value.pixelShift);
const range = computed(
  () => PIXEL_SHIFT_RANGE[settings.value.pixelShiftStrength],
);
const intervalMs = computed(() => settings.value.pixelShiftInterval * 60_000);

/**
 * Move the dashboard from time to time, and keep the custom properties it is
 * positioned by up to date. Call once at startup.
 */
export function startPixelShift(): void {
  effect(() => {
    const { x, y } = shift.value;
    const root = document.documentElement;

    root.style.setProperty('--pixel-shift-x', `${x}px`);
    root.style.setProperty('--pixel-shift-y', `${y}px`);
  });

  effect(() => {
    const on = enabled.value;
    const distance = range.value;
    const period = intervalMs.value;

    /*
     * Only the three settings above are followed. The rest is untracked because
     * writing to the log reads the log - it is a signal like anything else here
     * - and an effect that subscribes to what it writes is a cycle.
     */
    return untracked(() => {
      if (!on) {
        shift.value = NO_SHIFT;

        return;
      }

      return run(distance, period);
    });
  });
}

/** Starts moving, and returns the way to stop again. */
function run(distance: number, period: number): () => void {
  let timer: number | undefined;

  // peek, not value: this reads the position only to avoid repeating it
  const move = () => {
    const next = nextShift(shift.peek(), distance);

    shift.value = next;
    logger.debug('display', `pixel-shift ${formatShift(next)}`);

    timer = window.setTimeout(move, period);
  };

  /*
   * Straight away rather than one interval from now, so that turning it on
   * shows what it does, and so a device restarted at the same time every day
   * does not always begin from the same position.
   */
  move();

  /*
   * Timers are throttled while the screen is off. Without this, a device that
   * has been asleep for hours would come back to the position it went away
   * with - the longest exposure of the lot.
   */
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      window.clearTimeout(timer);
      move();
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
