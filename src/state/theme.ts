import { computed, effect, signal } from '@preact/signals';

import { bandFor, msUntilNextBand, type TimeBand } from '../lib/schedule';
import { applyTheme } from '../lib/theme';

import { settings } from './settings';

/**
 * Which part of the day it is now.
 *
 * A signal rather than a call, so that crossing a boundary propagates through
 * the computed value below without anything having to poll it.
 */
const currentBand = signal<TimeBand>(bandFor(new Date()));

/** The theme actually in effect, whether chosen outright or by the clock. */
export const activeTheme = computed(() => {
  const { themeMode, theme, schedule } = settings.value;

  return themeMode === 'schedule' ? schedule[currentBand.value] : theme;
});

/**
 * Apply the theme, and keep it in step with the time of day.
 * Call once at startup.
 */
export function startThemeSync(): void {
  effect(() => {
    applyTheme(activeTheme.value);
  });

  let timer: number | undefined;

  const schedule = () => {
    const now = new Date();

    currentBand.value = bandFor(now);

    // A floor stops a rounding error just short of the boundary spinning at 0ms
    timer = window.setTimeout(schedule, Math.max(msUntilNextBand(now), 1_000));
  };

  schedule();

  // Timers are throttled in the background, so a device that was asleep across
  // a boundary catches up the moment it is looked at again.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      window.clearTimeout(timer);
      schedule();
    }
  });
}
