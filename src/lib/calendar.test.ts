import { describe, expect, it } from 'vitest';

import { monthGrid, weekStartIndex, weekdayLabels } from './calendar';

/**
 * Six weeks of seven days, always, so the calendar never changes height
 * partway through the year. What varies is where the month sits inside them.
 */
describe('monthGrid', () => {
  // 2026-08-19 is a Wednesday; August 2026 begins on a Saturday and has 31 days
  const august = new Date(2026, 7, 19);

  it('is always six weeks', () => {
    expect(monthGrid(august, 'sunday')).toHaveLength(42);
    expect(monthGrid(august, 'monday')).toHaveLength(42);
  });

  it('starts on the chosen day of the week', () => {
    expect(monthGrid(august, 'sunday')[0]?.date.getDay()).toBe(0);
    expect(monthGrid(august, 'monday')[0]?.date.getDay()).toBe(1);
  });

  it('leads in with the days of the previous month', () => {
    const cells = monthGrid(august, 'sunday');
    const lead = cells.filter((cell) => !cell.inMonth && cell.day > 20);

    // August 2026 opens on a Saturday, so a Sunday week shows six of July
    expect(lead).toHaveLength(6);
    expect(cells[0]?.day).toBe(26);
    expect(cells[6]?.day).toBe(1);
    expect(cells[6]?.inMonth).toBe(true);
  });

  it('marks every day of the month and nothing else', () => {
    const inMonth = monthGrid(august, 'sunday').filter((cell) => cell.inMonth);

    expect(inMonth).toHaveLength(31);
    expect(inMonth[0]?.day).toBe(1);
    expect(inMonth.at(-1)?.day).toBe(31);
  });

  it('marks exactly one day as today', () => {
    const today = monthGrid(august, 'sunday').filter((cell) => cell.isToday);

    expect(today).toHaveLength(1);
    expect(today[0]?.day).toBe(19);
  });

  it('runs in unbroken days across the month boundary', () => {
    const cells = monthGrid(august, 'sunday');

    for (let index = 1; index < cells.length; index += 1) {
      const previous = cells[index - 1]?.date.getTime() ?? 0;
      const current = cells[index]?.date.getTime() ?? 0;
      const days = Math.round((current - previous) / 86_400_000);

      expect(days).toBe(1);
    }
  });

  /*
   * February 2026 has 28 days and opens on a Sunday, so a Sunday week fits it
   * in four rows with no lead at all - the case where an off-by-one would show.
   */
  it('handles a month that opens on the first column', () => {
    const cells = monthGrid(new Date(2026, 1, 15), 'sunday');

    expect(cells[0]?.day).toBe(1);
    expect(cells[0]?.inMonth).toBe(true);
  });

  it('handles a leap day', () => {
    const cells = monthGrid(new Date(2028, 1, 10), 'sunday');
    const inMonth = cells.filter((cell) => cell.inMonth);

    expect(inMonth).toHaveLength(29);
  });
});

describe('weekStartIndex', () => {
  it('maps the name to the index Date uses', () => {
    expect(weekStartIndex('sunday')).toBe(0);
    expect(weekStartIndex('monday')).toBe(1);
  });
});

describe('weekdayLabels', () => {
  it('gives seven, ordered from the chosen start', () => {
    expect(weekdayLabels('ja', 'sunday')).toEqual([
      '日',
      '月',
      '火',
      '水',
      '木',
      '金',
      '土',
    ]);
    expect(weekdayLabels('ja', 'monday')[0]).toBe('月');
    expect(weekdayLabels('en', 'sunday')).toHaveLength(7);
  });
});
