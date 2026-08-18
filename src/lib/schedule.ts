export const TIME_BANDS = [
  'morning',
  'day',
  'evening',
  'night',
  'lateNight',
] as const;

export type TimeBand = (typeof TIME_BANDS)[number];

export function isTimeBand(value: unknown): value is TimeBand {
  return (
    typeof value === 'string' && (TIME_BANDS as readonly string[]).includes(value)
  );
}

/**
 * Hour each band begins, in local time.
 *
 * Fixed hours rather than sunrise and sunset: the weather location is optional,
 * and a dashboard that changed appearance only for people who had set one would
 * be a strange thing to explain.
 */
const BAND_START_HOUR: Record<TimeBand, number> = {
  morning: 5,
  day: 9,
  evening: 16,
  night: 19,
  lateNight: 23,
};

export function bandStartHour(band: TimeBand): number {
  return BAND_START_HOUR[band];
}

export function bandForHour(hour: number): TimeBand {
  if (hour >= BAND_START_HOUR.lateNight || hour < BAND_START_HOUR.morning) {
    return 'lateNight';
  }

  if (hour >= BAND_START_HOUR.night) {
    return 'night';
  }

  if (hour >= BAND_START_HOUR.evening) {
    return 'evening';
  }

  if (hour >= BAND_START_HOUR.day) {
    return 'day';
  }

  return 'morning';
}

export function bandFor(date: Date): TimeBand {
  return bandForHour(date.getHours());
}

/**
 * Milliseconds until the next band begins.
 *
 * Measured afresh each time rather than run on an interval, so a device left on
 * for days does not drift away from the boundary it is meant to change on.
 */
export function msUntilNextBand(now: Date): number {
  const hours = Object.values(BAND_START_HOUR).sort((a, b) => a - b);
  const next = new Date(now);

  for (const hour of hours) {
    next.setHours(hour, 0, 0, 0);

    if (next.getTime() > now.getTime()) {
      return next.getTime() - now.getTime();
    }
  }

  // Past the last boundary of the day, so the next one is tomorrow morning
  next.setHours(24 + (hours[0] ?? 0), 0, 0, 0);

  return next.getTime() - now.getTime();
}
