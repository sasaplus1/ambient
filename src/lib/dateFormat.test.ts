import { describe, expect, it } from 'vitest';

import { DATE_FORMATS, formatDate, isDateFormat } from './dateFormat';

/**
 * These lean on Intl, so the exact wording belongs to the platform rather than
 * to this project and is not worth pinning. What is worth pinning is that every
 * preset produces something, that they differ from one another, and the one
 * detail this project does impose: fullwidth parentheses in Japanese.
 */
describe('formatDate', () => {
  // 2026-08-18 is a Tuesday
  const tuesday = new Date(2026, 7, 18);

  it.each(DATE_FORMATS)('gives something for %s', (format) => {
    expect(formatDate('ja', format, tuesday)).not.toBe('');
    expect(formatDate('en', format, tuesday)).not.toBe('');
  });

  it('gives a different reading for each preset', () => {
    const readings = DATE_FORMATS.map((format) =>
      formatDate('ja', format, tuesday),
    );

    expect(new Set(readings).size).toBe(DATE_FORMATS.length);
  });

  it('says the same day in both languages', () => {
    expect(formatDate('ja', 'numeric', tuesday)).toContain('18');
    expect(formatDate('en', 'numeric', tuesday)).toContain('18');
    expect(formatDate('ja', 'full', tuesday)).toContain('2026');
    expect(formatDate('en', 'full', tuesday)).toContain('2026');
  });

  /*
   * Intl writes the weekday in ASCII parentheses, which sit on the baseline and
   * drop the character inside them low against the kanji either side.
   */
  it('uses fullwidth parentheses in japanese', () => {
    const reading = formatDate('ja', 'monthDayWeekday', tuesday);

    expect(reading).toContain('（');
    expect(reading).toContain('）');
    expect(reading).not.toContain('(');
    expect(reading).not.toContain(')');
  });

  it('leaves the english parentheses alone', () => {
    expect(formatDate('en', 'monthDayWeekday', tuesday)).not.toContain('（');
  });
});

describe('isDateFormat', () => {
  it.each(DATE_FORMATS)('accepts %s', (format) => {
    expect(isDateFormat(format)).toBe(true);
  });

  it.each(['iso', '', null, 0, {}])('refuses %o', (value) => {
    expect(isDateFormat(value)).toBe(false);
  });
});
