import { describe, expect, it } from 'vitest';

import { type ClockRates, formatClockRates } from './clockMetrics';

/**
 * This line is read off a screen across a room, on a device that cannot be
 * attached to a profiler, and it is the only account of what the clock's draw
 * loop is doing. So the two things it has to get across are whether the pixel
 * ratio was held down to the cap, and whether a hand that repaints slowly is
 * repainting at all - which whole numbers alone would report as nought, the
 * same as a clock that had stopped.
 */
describe('formatClockRates', () => {
  function rates(patch: Partial<ClockRates>): ClockRates {
    return { ratio: 2, offered: 2, fps: 60, draws: 30, ...patch };
  }

  it('shows both numbers when the ratio was capped', () => {
    expect(formatClockRates(rates({ ratio: 2, offered: 2.75 }))).toContain(
      'DPR 2.75>2',
    );
  });

  it('shows one number when the device asked for no more than it got', () => {
    // What an Echo Show 5 reports, which is under the cap and so untouched
    expect(formatClockRates(rates({ ratio: 1.22, offered: 1.22 }))).toContain(
      'DPR 1.22',
    );
    expect(formatClockRates(rates({ ratio: 1.22, offered: 1.22 }))).not.toContain(
      '>',
    );
  });

  it.each([
    [2, '2'],
    [1.5, '1.5'],
    [2.75, '2.75'],
  ])('writes a ratio of %o as %s, without padding it out', (ratio, expected) => {
    expect(formatClockRates(rates({ ratio, offered: ratio }))).toContain(
      `DPR ${expected}`,
    );
  });

  it('keeps a decimal on the rates that fall below ten', () => {
    const stepping = formatClockRates(rates({ fps: 0, draws: 1 }));

    expect(stepping).toContain('FPS 0.0');
    expect(stepping).toContain('DRAW 1.0');
  });

  it('rounds the rates that do not', () => {
    const sweeping = formatClockRates(rates({ fps: 59.4, draws: 29.7 }));

    expect(sweeping).toContain('FPS 59');
    expect(sweeping).toContain('DRAW 30');
  });
});
