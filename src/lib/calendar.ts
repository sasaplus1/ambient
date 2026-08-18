export const WEEK_STARTS = ['sunday', 'monday'] as const;
export type WeekStart = (typeof WEEK_STARTS)[number];

export const ADJACENT_DAYS = ['hidden', 'dimmed'] as const;
export type AdjacentDays = (typeof ADJACENT_DAYS)[number];

export function isWeekStart(value: unknown): value is WeekStart {
  return (
    typeof value === 'string' && (WEEK_STARTS as readonly string[]).includes(value)
  );
}

export function isAdjacentDays(value: unknown): value is AdjacentDays {
  return (
    typeof value === 'string' &&
    (ADJACENT_DAYS as readonly string[]).includes(value)
  );
}

/** Day index the week starts on, matching Date#getDay. */
export function weekStartIndex(weekStart: WeekStart): 0 | 1 {
  return weekStart === 'monday' ? 1 : 0;
}

export type CalendarCell = {
  date: Date;
  /** Day of the month, for display. */
  day: number;
  /** False for the days either side that only fill out the grid. */
  inMonth: boolean;
  isToday: boolean;
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Builds a six-week grid covering the month `today` falls in.
 *
 * The height is fixed at six weeks so the layout does not jump between months.
 * Days from the neighbouring months fill the gaps; the caller decides whether
 * to show or hide them.
 */
export function monthGrid(today: Date, weekStart: WeekStart): CalendarCell[] {
  const firstOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  );

  // How many days of the previous month lead up to the first of this one
  const lead =
    (firstOfMonth.getDay() - weekStartIndex(weekStart) + 7) % 7;

  const start = new Date(firstOfMonth);

  start.setDate(firstOfMonth.getDate() - lead);

  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + index,
    );

    cells.push({
      date,
      day: date.getDate(),
      inMonth: date.getMonth() === today.getMonth(),
      isToday: isSameDay(date, today),
    });
  }

  return cells;
}

/**
 * Weekday headings in the locale's own short form, ordered from weekStart.
 *
 * 2024-01-07 is a Sunday, so adding the day index walks a full week without
 * having to hardcode names for either language.
 */
export function weekdayLabels(locale: string, weekStart: WeekStart): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  const knownSunday = new Date(2024, 0, 7);
  const offset = weekStartIndex(weekStart);

  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(
      new Date(2024, 0, knownSunday.getDate() + ((index + offset) % 7)),
    ),
  );
}

