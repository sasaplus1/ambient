import { describe, expect, it } from 'vitest';

import { isPaintDue, msUntilNextTick, SWEEP_TARGET_HZ } from './clockSchedule';

/**
 * Both clocks aim at the boundary rather than counting a fixed interval from
 * the last tick, because a device left running for days would otherwise slide
 * away from the second it is displaying. The cases worth pinning are the two
 * ends: sitting exactly on a boundary must wait a whole interval rather than
 * none, and sitting a hair before one must not ask for a wait of nearly zero.
 */
describe('msUntilNextTick', () => {
  // Epoch milliseconds, so the answers do not depend on the machine's timezone
  const onTheBoundary = new Date(1_800_000_000_000);
  const partWayThrough = new Date(1_800_000_000_200);
  const almostThere = new Date(1_800_000_000_995);

  it('waits out the rest of the second', () => {
    expect(msUntilNextTick(partWayThrough, 'second')).toBe(800);
  });

  it('waits out the rest of the minute', () => {
    expect(msUntilNextTick(partWayThrough, 'minute')).toBe(59_800);
  });

  /*
   * Nought would be the arithmetic answer, and a timer given it would fire,
   * find the boundary still ahead of it, and ask for nought again.
   */
  it('waits a whole interval when it is already on the boundary', () => {
    expect(msUntilNextTick(onTheBoundary, 'second')).toBe(1_000);
    expect(msUntilNextTick(onTheBoundary, 'minute')).toBe(60_000);
  });

  it('keeps a floor under the wait just short of the boundary', () => {
    expect(msUntilNextTick(almostThere, 'second')).toBe(16);
  });

  /*
   * A day is asked of the date rather than divided out of the epoch, so that it
   * lands on local midnight and survives a timezone that is not a whole number
   * of hours from UTC.
   */
  it('waits until local midnight for a day', () => {
    expect(msUntilNextTick(new Date(2026, 7, 18, 0, 0, 0, 0), 'day')).toBe(
      86_400_000,
    );
    expect(msUntilNextTick(new Date(2026, 7, 18, 23, 59, 59, 0), 'day')).toBe(
      1_000,
    );
    expect(msUntilNextTick(new Date(2026, 7, 18, 23, 59, 59, 995), 'day')).toBe(
      16,
    );
  });
});

/**
 * One frame in isolation says very little, so these run whole displays past the
 * gate instead. The promise being tested is the one the code cannot state for
 * itself: that a refresh rate this project has never seen still ends up drawing
 * the hand at about the target, evenly spaced, without anyone naming it.
 */
describe('isPaintDue', () => {
  /*
   * A second of one display's frames. This keeps exactly the state a real loop
   * keeps: when it last painted, and when the frame before this one arrived.
   */
  function paintsInOneSecond(hz: number): number[] {
    const frameMs = 1000 / hz;
    const painted: number[] = [];
    let lastPaintAt = 0;
    let previousFrameAt = 0;

    for (let frame = 1; frame <= hz; frame += 1) {
      const timestamp = frame * frameMs;

      if (
        isPaintDue(
          timestamp - lastPaintAt,
          timestamp - previousFrameAt,
          SWEEP_TARGET_HZ,
        )
      ) {
        lastPaintAt = timestamp;
        painted.push(timestamp);
      }

      previousFrameAt = timestamp;
    }

    return painted;
  }

  function gapsBetween(painted: number[]): number[] {
    return painted.slice(1).map((at, index) => at - (painted[index] ?? 0));
  }

  /** Rounded, so that float noise does not read as a difference in spacing. */
  function distinctGaps(painted: number[]): Set<number> {
    return new Set(gapsBetween(painted).map((gap) => Math.round(gap * 100)));
  }

  it.each([60, 90, 120, 240])(
    'draws a %i-hertz display at the target exactly',
    (hz) => {
      expect(paintsInOneSecond(hz)).toHaveLength(SWEEP_TARGET_HZ);
    },
  );

  it.each([60, 90, 120, 144, 240])(
    'spaces the paints evenly on a %i-hertz display',
    (hz) => {
      expect(distinctGaps(paintsInOneSecond(hz)).size).toBe(1);
    },
  );

  /*
   * 165Hz is five and a half frames to the target's one, so the deadline lands
   * squarely between two of them every time and the pattern alternates five
   * frames and six. Nothing chooses better than that; what matters is that the
   * wobble is one frame wide rather than free to grow.
   */
  it('wobbles by no more than a frame where the rates do not divide', () => {
    for (let hz = SWEEP_TARGET_HZ; hz <= 240; hz += 1) {
      const gaps = gapsBetween(paintsInOneSecond(hz));

      expect(distinctGaps(paintsInOneSecond(hz)).size).toBeLessThanOrEqual(2);

      for (const gap of gaps) {
        expect(Math.abs(gap - 1000 / SWEEP_TARGET_HZ)).toBeLessThanOrEqual(
          1000 / hz,
        );
      }
    }
  });

  it.each([30, 24, 15])(
    'draws every frame of a %i-hertz display, having none to spare',
    (hz) => {
      expect(paintsInOneSecond(hz)).toHaveLength(hz);
    },
  );

  /*
   * Whole frames are the only currency, so the rate is quantised, and coarsest
   * just above the target where the choice is between every frame and every
   * other one. Worth stating the width of that: never so slow that the hand
   * steps visibly, never so fast that it does half again the asked-for work.
   */
  it('stays inside the band whole frames allow, on any refresh rate', () => {
    for (let hz = SWEEP_TARGET_HZ; hz <= 240; hz += 1) {
      const rate = paintsInOneSecond(hz).length;

      expect(rate).toBeGreaterThanOrEqual(SWEEP_TARGET_HZ * 0.7);
      expect(rate).toBeLessThanOrEqual(SWEEP_TARGET_HZ * 1.5);
    }
  });

  /*
   * A display that changes its refresh rate under a running page is ordinary on
   * Android, and nothing tells the page it happened.
   */
  it('follows a display that changes its refresh rate', () => {
    const before = paintsInOneSecond(90).length;
    const after = paintsInOneSecond(60).length;

    expect(before).toBe(SWEEP_TARGET_HZ);
    expect(after).toBe(SWEEP_TARGET_HZ);
  });

  it('draws at once after the main thread has held the frames up', () => {
    expect(isPaintDue(500, 16.7, SWEEP_TARGET_HZ)).toBe(true);
  });

  /*
   * With no frame to have measured, the deadline is all there is to go on, which
   * is the behaviour of a plain time budget rather than anything worse.
   */
  it.each([0, -1, Number.NaN])(
    'falls back to the deadline alone when the frame reads %o',
    (frameMs) => {
      expect(isPaintDue(34, frameMs, SWEEP_TARGET_HZ)).toBe(true);
      expect(isPaintDue(20, frameMs, SWEEP_TARGET_HZ)).toBe(false);
    },
  );
});
