import { computed, effect, signal } from '@preact/signals';

import {
  bandFor,
  bandForHour,
  msUntilNextBand,
  type TimeBand,
} from '../lib/schedule';
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
 * Hour the settings preview is standing in, or null for the real one.
 *
 * Only the miniature follows it. Moving a slider should not repaint the device
 * you are looking past it at.
 */
export const previewHour = signal<number | null>(null);

/** What the miniature shows: the previewed hour if set, otherwise reality. */
export const previewTheme = computed(() => {
  const hour = previewHour.value;
  const { themeMode, schedule } = settings.value;

  if (hour === null || themeMode !== 'schedule') {
    return activeTheme.value;
  }

  return schedule[bandForHour(hour)];
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
