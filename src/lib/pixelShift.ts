/*
 * Pixel shift: the dashboard is nudged a few pixels every so often, so that a
 * clock left on for days does not burn itself into an OLED panel.
 *
 * Changing the theme with the time of day already keeps the background moving,
 * but the clock, the calendar and the weather sit on the same pixels whatever
 * colour is behind them. This is what moves those.
 *
 * The travel is meant to go unnoticed. It is a protection, not an effect.
 */

export const PIXEL_SHIFT_STRENGTHS = ['low', 'medium', 'high'] as const;
export type PixelShiftStrength = (typeof PIXEL_SHIFT_STRENGTHS)[number];

/** How far the dashboard may stand from centre, in CSS pixels. */
export const PIXEL_SHIFT_RANGE: Record<PixelShiftStrength, number> = {
  low: 2,
  medium: 4,
  high: 8,
};

/** Minutes between moves. Longer is calmer, shorter spreads the wear wider. */
export const PIXEL_SHIFT_INTERVALS = [15, 30, 60] as const;
export type PixelShiftInterval = (typeof PIXEL_SHIFT_INTERVALS)[number];

export function isPixelShiftStrength(
  value: unknown,
): value is PixelShiftStrength {
  return (
    typeof value === 'string' &&
    (PIXEL_SHIFT_STRENGTHS as readonly string[]).includes(value)
  );
}

export function isPixelShiftInterval(
  value: unknown,
): value is PixelShiftInterval {
  return (
    typeof value === 'number' &&
    (PIXEL_SHIFT_INTERVALS as readonly number[]).includes(value)
  );
}

export type Shift = {
  x: number;
  y: number;
};

/** Dead centre, which is where the dashboard sits with the shift turned off. */
export const NO_SHIFT: Shift = { x: 0, y: 0 };

function randomOffset(range: number): number {
  return Math.floor(Math.random() * (range * 2 + 1)) - range;
}

/**
 * A position within ±range, never the one already in use.
 *
 * Drawing the same position twice would leave those pixels lit for two turns
 * instead of one, which is the single thing the interval was chosen to avoid.
 */
export function nextShift(previous: Shift, range: number): Shift {
  // With no range there is only one position, so asking for another never ends
  if (range <= 0) {
    return NO_SHIFT;
  }

  let next: Shift;

  do {
    next = { x: randomOffset(range), y: randomOffset(range) };
  } while (next.x === previous.x && next.y === previous.y);

  return next;
}

/** Signed both ways, so the debug readout reads as a direction: `+2,-3`. */
export function formatShift(shift: Shift): string {
  const signed = (value: number) => (value < 0 ? `${value}` : `+${value}`);

  return `${signed(shift.x)},${signed(shift.y)}`;
}
