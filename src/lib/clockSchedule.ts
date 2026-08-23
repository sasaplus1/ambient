export type TickUnit = 'second' | 'minute' | 'day';

/**
 * Not 'day': the length of one is a property of the calendar rather than a
 * count of milliseconds, so it is worked out from the date itself below.
 */
const UNIT_MS: Record<Exclude<TickUnit, 'day'>, number> = {
  second: 1_000,
  minute: 60_000,
};

/**
 * A floor under every wait. Landing a hair short of the boundary is possible,
 * and a timer asked for 0ms would fire, find itself still short, and ask for
 * 0ms again.
 */
const MINIMUM_WAIT_MS = 16;

/**
 * Milliseconds to wait before the tick that lands on the next boundary.
 *
 * The wait is measured from the time handed in, not from the moment this is
 * called, so a caller that has just spent time drawing still aims at the same
 * boundary it drew for. Measuring afresh from after the work would aim at the
 * boundary after that one, and the tick in between would never be shown.
 */
export function msUntilNextTick(now: Date, unit: TickUnit): number {
  if (unit === 'day') {
    const nextMidnight = new Date(now);

    nextMidnight.setHours(24, 0, 0, 0);

    return Math.max(nextMidnight.getTime() - now.getTime(), MINIMUM_WAIT_MS);
  }

  const interval = UNIT_MS[unit];

  return Math.max(interval - (now.getTime() % interval), MINIMUM_WAIT_MS);
}

/**
 * How often a sweeping second hand is drawn.
 *
 * The hand turns at six degrees a second, so its tip crosses well under a pixel
 * between frames at this rate on any dial that fits a phone or a smart display.
 * Past here the extra frames are spent on movement finer than the antialiasing.
 */
export const SWEEP_TARGET_HZ = 30;

/**
 * Whether this animation frame is one to draw on.
 *
 * Frames are all there is to spend, and how many of them a second holds is
 * neither knowable in advance nor fixed while the page is open: nothing on the
 * web will name the refresh rate, and Android displays change theirs underneath
 * a running page. So the choice is made one frame at a time, by drawing on
 * whichever frame falls nearest the moment the next paint is due.
 *
 * Nearest is what the tolerance buys, and it is half of the frame just
 * measured. Without it a deadline landing between two frames would always be
 * met by the later one, and asking for half the refresh rate would quietly
 * deliver a third of it. With it, a 60Hz display draws every second frame, a
 * 90Hz one every third and a 120Hz one every fourth, all of them evenly spaced,
 * and none of them told which they were.
 *
 * Whole frames are the only currency, so the rate that comes out is quantised.
 * It sits within a third either side of the target, and is coarsest just above
 * it, where the choice is between every frame and every other one.
 */
export function isPaintDue(
  sincePaintMs: number,
  frameMs: number,
  targetHz: number,
): boolean {
  const due = 1000 / targetHz;

  /*
   * No tolerance for a display slower than the target: every frame of it is
   * wanted, and the reading is not trusted before the second frame anyway,
   * where there is nothing yet to have measured a gap against.
   */
  const tolerance = frameMs > 0 && frameMs < due ? frameMs / 2 : 0;

  return sincePaintMs + tolerance >= due;
}
