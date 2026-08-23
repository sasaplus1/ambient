export type ClockRates = {
  /** Device pixels per CSS pixel the dial is actually drawn at. */
  ratio: number;
  /** What the device asked for, which may be more than it was given. */
  offered: number;
  /**
   * Animation frames delivered per second, drawn or not. While a hand is
   * sweeping this is also the display's refresh rate, since every frame the
   * browser offers is taken.
   */
  fps: number;
  /** Repaints per second. */
  draws: number;
};

/*
 * Counters for the analog clock's draw loop.
 *
 * Plain mutable numbers rather than signals, deliberately. These are written on
 * every animation frame, and a signal there would re-render every subscriber
 * sixty times a second - which is the very cost this exists to measure. Nothing
 * reads them until the debug overlay comes round on its own slow timer.
 *
 * Two clocks can be drawing at once, because the settings panel previews one of
 * its own, and their frames land in the same counters. That is left alone: the
 * panel is a dialog covering the dashboard, so nobody is reading the overlay
 * while the two of them overlap.
 */
let live = 0;
let frames = 0;
let draws = 0;
let since = 0;
let ratio = 0;
let offered = 0;

export function countFrame(): void {
  frames += 1;
}

export function countDraw(): void {
  draws += 1;
}

/**
 * A clock canvas has been sized, which is also when it first appears.
 *
 * `askedFor` is what the device offered, so that a ratio held down to a cap can
 * be told apart from a device that never asked for more than the cap allows.
 */
export function noteCanvas(drawnAt: number, askedFor: number): void {
  live += 1;
  ratio = drawnAt;
  offered = askedFor;
  frames = 0;
  draws = 0;
  since = Date.now();
}

/**
 * Counted down rather than cleared, so that closing the settings panel - which
 * takes its preview clock with it - does not read as the dashboard's own clock
 * having stopped.
 */
export function forgetCanvas(): void {
  live = Math.max(live - 1, 0);
}

/**
 * The rates since this was last asked, or nothing while no clock is drawing.
 * Asking resets the window, so the reading describes the interval just passed
 * rather than the whole run.
 */
export function takeClockRates(now: number): ClockRates | undefined {
  const elapsed = now - since;

  if (live === 0 || elapsed <= 0) {
    return undefined;
  }

  const rates: ClockRates = {
    ratio,
    offered,
    fps: (frames * 1000) / elapsed,
    draws: (draws * 1000) / elapsed,
  };

  frames = 0;
  draws = 0;
  since = now;

  return rates;
}

/** Trimmed rather than padded: 2.75 keeps its digits, 2 does not grow any. */
function ratioText(value: number): string {
  return String(Number(value.toFixed(2)));
}

/*
 * A rate below ten is shown to a decimal place. Stepping and hidden hands
 * repaint once a second and once a minute, and rounded to whole numbers those
 * two would read as 1 and 0 - the second of which is what a stopped clock reads
 * as too.
 */
function rateText(value: number): string {
  return value < 10 ? value.toFixed(1) : String(Math.round(value));
}

/** One line for the debug overlay. */
export function formatClockRates(rates: ClockRates): string {
  const ratio =
    rates.offered > rates.ratio
      ? `${ratioText(rates.offered)}>${ratioText(rates.ratio)}`
      : ratioText(rates.ratio);

  return [
    `DPR ${ratio}`,
    `FPS ${rateText(rates.fps)}`,
    `DRAW ${rateText(rates.draws)}`,
  ].join(' | ');
}
