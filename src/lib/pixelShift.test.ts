import { describe, expect, it } from 'vitest';

import {
  formatShift,
  isPixelShiftInterval,
  isPixelShiftStrength,
  nextShift,
  NO_SHIFT,
  PIXEL_SHIFT_RANGE,
} from './pixelShift';

/**
 * The one thing this has to promise is that it never hands back the position it
 * was given: repeating one would leave those pixels lit for two turns instead
 * of one, which is the whole of what the interval was chosen to avoid. It is
 * random, so it is worth asking many times rather than once.
 */
describe('nextShift', () => {
  const range = PIXEL_SHIFT_RANGE.medium;

  it('never repeats the position it was handed', () => {
    let previous = { x: 0, y: 0 };

    for (let attempt = 0; attempt < 500; attempt += 1) {
      const next = nextShift(previous, range);

      expect(next).not.toEqual(previous);
      previous = next;
    }
  });

  it('stays inside the range, and reaches both ends of it', () => {
    const seen = new Set<number>();
    let previous = NO_SHIFT;

    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const next = nextShift(previous, range);

      expect(next.x).toBeGreaterThanOrEqual(-range);
      expect(next.x).toBeLessThanOrEqual(range);
      expect(next.y).toBeGreaterThanOrEqual(-range);
      expect(next.y).toBeLessThanOrEqual(range);

      seen.add(next.x);
      seen.add(next.y);
      previous = next;
    }

    expect(seen.has(-range)).toBe(true);
    expect(seen.has(range)).toBe(true);
  });

  it('deals in whole pixels', () => {
    let previous = NO_SHIFT;

    for (let attempt = 0; attempt < 200; attempt += 1) {
      previous = nextShift(previous, range);

      expect(Number.isInteger(previous.x)).toBe(true);
      expect(Number.isInteger(previous.y)).toBe(true);
    }
  });

  /*
   * A range of zero has exactly one position, so asking for a different one
   * would never return. It sits still instead.
   */
  it('sits still rather than spinning when there is nowhere to go', () => {
    expect(nextShift({ x: 0, y: 0 }, 0)).toEqual(NO_SHIFT);
    expect(nextShift({ x: 3, y: 3 }, -1)).toEqual(NO_SHIFT);
  });
});

describe('formatShift', () => {
  it.each([
    [{ x: 2, y: -3 }, '+2,-3'],
    [{ x: 0, y: 0 }, '+0,+0'],
    [{ x: -8, y: 8 }, '-8,+8'],
  ])('writes %o as %s', (shift, expected) => {
    expect(formatShift(shift)).toBe(expected);
  });
});

describe('the guards', () => {
  it.each([
    ['low', true],
    ['medium', true],
    ['high', true],
    ['LOW', false],
    ['', false],
    [4, false],
    [null, false],
  ])('isPixelShiftStrength(%o) is %s', (value, expected) => {
    expect(isPixelShiftStrength(value)).toBe(expected);
  });

  it.each([
    [15, true],
    [30, true],
    [60, true],
    [45, false],
    ['30', false],
    [Number.NaN, false],
  ])('isPixelShiftInterval(%o) is %s', (value, expected) => {
    expect(isPixelShiftInterval(value)).toBe(expected);
  });
});
