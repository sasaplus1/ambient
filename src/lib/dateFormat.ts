import type { Locale } from './i18n';

export const DATE_FORMATS = [
  'full',
  'long',
  'monthDayWeekday',
  'monthDay',
  'numeric',
  'weekday',
] as const;

export type DateFormat = (typeof DATE_FORMATS)[number];

export const DEFAULT_DATE_FORMAT: DateFormat = 'full';

/**
 * Presets rather than a format string: the point is that the same choice reads
 * correctly in every locale, which a hand-written pattern cannot promise.
 *
 * For 2026-08-18, a Tuesday:
 *
 *   full             2026年8月18日火曜日   Tuesday, August 18, 2026
 *   long             2026年8月18日         August 18, 2026
 *   monthDayWeekday  8月18日(火)           Tue, August 18
 *   monthDay         8月18日               August 18
 *   numeric          2026/08/18            08/18/2026
 *   weekday          火曜日                Tuesday
 */
const OPTIONS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  long: { year: 'numeric', month: 'long', day: 'numeric' },
  monthDayWeekday: { month: 'long', day: 'numeric', weekday: 'short' },
  monthDay: { month: 'long', day: 'numeric' },
  numeric: { year: 'numeric', month: '2-digit', day: '2-digit' },
  weekday: { weekday: 'long' },
};

export function isDateFormat(value: unknown): value is DateFormat {
  return (
    typeof value === 'string' &&
    (DATE_FORMATS as readonly string[]).includes(value)
  );
}

// Constructing an Intl.DateTimeFormat is not cheap, and the settings screen
// formats every preset at once to label its options.
const formatters = new Map<string, Intl.DateTimeFormat>();

export function formatDate(
  locale: Locale,
  format: DateFormat,
  date: Date,
): string {
  const key = `${locale}:${format}`;
  const existing = formatters.get(key);

  if (existing) {
    return existing.format(date);
  }

  const created = new Intl.DateTimeFormat(locale, OPTIONS[format]);

  formatters.set(key, created);

  return created.format(date);
}
