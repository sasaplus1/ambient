import { describe, expect, it } from 'vitest';

import { parseLocation, parseStoredDaily, parseWeather } from './weather';

/**
 * The stored side of the same distrust. What comes back from localStorage was
 * written by an older version of this app as readily as by the current one, so
 * a reading from before the forecast existed has to parse into a reading with
 * no forecast rather than into nothing at all.
 */
describe('parseWeather', () => {
  const stored = {
    temperature: 32.2,
    weatherCode: 2,
    isDay: true,
    fetchedAt: 1_755_000_000_000,
    daily: [{ date: '2026-08-19', weatherCode: 2, max: 32.2, min: 23.6 }],
  };

  it('reads back what was written', () => {
    expect(parseWeather(stored)).toEqual(stored);
  });

  it('keeps a reading that predates the forecast', () => {
    const { daily, ...withoutDaily } = stored;
    const parsed = parseWeather(withoutDaily);

    expect(parsed?.temperature).toBe(32.2);
    expect(parsed?.daily).toEqual([]);
  });

  it('treats a missing day as day', () => {
    const { isDay, ...withoutIsDay } = stored;

    expect(parseWeather(withoutIsDay)?.isDay).toBe(true);
    expect(parseWeather({ ...stored, isDay: false })?.isDay).toBe(false);
  });

  it.each([
    ['nothing at all', undefined],
    ['no temperature', { weatherCode: 2, fetchedAt: 1 }],
    ['a temperature that is not a number', { ...stored, temperature: '32' }],
    ['no timestamp', { temperature: 1, weatherCode: 2 }],
    ['an infinite temperature', { ...stored, temperature: Infinity }],
  ])('refuses a reading with %s', (_label, input) => {
    expect(parseWeather(input as Record<string, unknown> | undefined)).toBeNull();
  });
});

describe('parseStoredDaily', () => {
  const day = { date: '2026-08-19', weatherCode: 2, max: 32.2, min: 23.6 };

  it('reads back a forecast', () => {
    expect(parseStoredDaily([day])).toEqual([day]);
  });

  it.each([
    ['not an array', { day }],
    ['undefined', undefined],
    ['holding something that is not an object', [day, 'tuesday']],
    ['missing a field', [day, { date: '2026-08-20', weatherCode: 1 }]],
    ['holding a date that is not a string', [{ ...day, date: 20_260_819 }]],
  ])('drops the whole forecast when it is %s', (_label, input) => {
    expect(parseStoredDaily(input)).toEqual([]);
  });
});

describe('parseLocation', () => {
  it('reads back a place', () => {
    expect(
      parseLocation({ latitude: 35.4437, longitude: 139.638, label: 'Yokohama' }),
    ).toEqual({ latitude: 35.4437, longitude: 139.638, label: 'Yokohama' });
  });

  it('accepts a place with no name', () => {
    expect(parseLocation({ latitude: 1, longitude: 2 })?.label).toBe('');
  });

  it.each([
    ['nothing at all', undefined],
    ['no latitude', { longitude: 2 }],
    ['coordinates as strings', { latitude: '1', longitude: '2' }],
  ])('refuses a place with %s', (_label, input) => {
    expect(
      parseLocation(input as Record<string, unknown> | undefined),
    ).toBeNull();
  });
});
