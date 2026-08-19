import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS, parseSettings } from './settings';

/**
 * Nothing stored is trusted. The promise is that one bad field costs only
 * itself: a device that has been running for months should not lose every
 * choice its owner made because one value went strange.
 */
describe('parseSettings', () => {
  it('gives the defaults when there is nothing stored', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps what is valid', () => {
    const parsed = parseSettings({
      showClock: false,
      clockType: 'digital',
      theme: 'mist',
      backgroundDim: 55,
      pixelShiftInterval: 60,
    });

    expect(parsed.showClock).toBe(false);
    expect(parsed.clockType).toBe('digital');
    expect(parsed.theme).toBe('mist');
    expect(parsed.backgroundDim).toBe(55);
    expect(parsed.pixelShiftInterval).toBe(60);
  });

  it('replaces only the field that is wrong', () => {
    const parsed = parseSettings({
      showClock: 'yes',
      clockType: 'sundial',
      showDate: true,
    });

    expect(parsed.showClock).toBe(DEFAULT_SETTINGS.showClock);
    expect(parsed.clockType).toBe(DEFAULT_SETTINGS.clockType);
    expect(parsed.showDate).toBe(true);
  });

  it('clamps a number rather than discarding it', () => {
    expect(parseSettings({ backgroundDim: 200 }).backgroundDim).toBe(90);
    expect(parseSettings({ backgroundDim: -40 }).backgroundDim).toBe(0);
    expect(parseSettings({ backgroundDim: 30.7 }).backgroundDim).toBe(31);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, '30', null])(
    'falls back for a dim of %o',
    (value) => {
      expect(parseSettings({ backgroundDim: value }).backgroundDim).toBe(
        DEFAULT_SETTINGS.backgroundDim,
      );
    },
  );

  /*
   * The per-widget records are the ones worth checking properly: they are
   * parsed entry by entry so that one unreadable widget does not take the
   * other three down with it.
   */
  it('keeps the widgets whose type survived', () => {
    const parsed = parseSettings({
      scales: { clock: 'xl', date: 'enormous', weather: 's' },
      fonts: { clock: 'serif', calendar: 'comic' },
    });

    expect(parsed.scales.clock).toBe('xl');
    expect(parsed.scales.date).toBe(DEFAULT_SETTINGS.scales.date);
    expect(parsed.scales.weather).toBe('s');
    expect(parsed.scales.calendar).toBe(DEFAULT_SETTINGS.scales.calendar);

    expect(parsed.fonts.clock).toBe('serif');
    expect(parsed.fonts.calendar).toBe(DEFAULT_SETTINGS.fonts.calendar);
  });

  it.each([null, 'sans', 42])('survives a fonts record of %o', (fonts) => {
    expect(parseSettings({ fonts }).fonts).toEqual(DEFAULT_SETTINGS.fonts);
  });

  it('keeps the bands of the schedule apart', () => {
    const parsed = parseSettings({
      schedule: { morning: 'abyss', day: 'not-a-theme' },
    });

    expect(parsed.schedule.morning).toBe('abyss');
    expect(parsed.schedule.day).toBe(DEFAULT_SETTINGS.schedule.day);
    expect(parsed.schedule.night).toBe(DEFAULT_SETTINGS.schedule.night);
  });

  it('returns every field the type promises, whatever it was given', () => {
    expect(Object.keys(parseSettings({ nonsense: true })).sort()).toEqual(
      Object.keys(DEFAULT_SETTINGS).sort(),
    );
  });

  it('does not carry across anything it was not asked for', () => {
    expect(parseSettings({ nonsense: true })).not.toHaveProperty('nonsense');
  });
});
