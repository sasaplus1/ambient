import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  conditionFor,
  fetchCurrentWeather,
  iconFor,
  localDate,
  type DailyForecast,
} from './weather';

const stubFetch = (daily: unknown) => {
  const body = {
    current: { temperature_2m: 30, weather_code: 2, is_day: 1 },
    daily,
  };

  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => body,
    })),
  );
};

const fetchDaily = async () =>
  (await fetchCurrentWeather({ latitude: 35.4437, longitude: 139.638 })).daily;

/**
 * Open-Meteo answers with four arrays side by side rather than a list of
 * days. Everything here is about what happens when they stop agreeing with
 * each other, because that is the shape of the bug this guards against: a
 * Tuesday paired with Wednesday's high is worse than no forecast at all.
 *
 * Going through `fetchCurrentWeather` rather than a bare parser also keeps
 * the request itself honest, since a stubbed `fetch` is the only place that
 * can see the URL that goes out.
 */
describe('fetchCurrentWeather', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const wellFormed = {
    time: ['2026-08-19', '2026-08-20'],
    weather_code: [2, 61],
    temperature_2m_max: [32.2, 31],
    temperature_2m_min: [23.6, 24.6],
  };

  it('pairs the arrays up by position', async () => {
    stubFetch(wellFormed);

    expect(await fetchDaily()).toEqual<DailyForecast[]>([
      { date: '2026-08-19', weatherCode: 2, max: 32.2, min: 23.6 },
      { date: '2026-08-20', weatherCode: 61, max: 31, min: 24.6 },
    ]);
  });

  it('drops everything when one array is short', async () => {
    stubFetch({ ...wellFormed, temperature_2m_min: [23.6] });

    expect(await fetchDaily()).toEqual([]);
  });

  it('drops everything when one value is not a number', async () => {
    stubFetch({ ...wellFormed, temperature_2m_max: [32.2, null] });

    expect(await fetchDaily()).toEqual([]);
  });

  it('drops everything when a date is not a string', async () => {
    stubFetch({ ...wellFormed, time: ['2026-08-19', 20260820] });

    expect(await fetchDaily()).toEqual([]);
  });

  it.each([
    ['no daily block', undefined],
    ['daily is null', null],
    ['daily is not an object', 'tomorrow'],
    ['an array is missing', { time: ['2026-08-19'] }],
    ['an array is not an array', { ...wellFormed, weather_code: 2 }],
  ])('returns nothing for %s', async (_label, daily) => {
    stubFetch(daily);

    expect(await fetchDaily()).toEqual([]);
  });

  it('accepts an empty forecast without complaint', async () => {
    stubFetch({
      time: [],
      weather_code: [],
      temperature_2m_max: [],
      temperature_2m_min: [],
    });

    expect(await fetchDaily()).toEqual([]);
  });

  it('asks for the daily and current fields the row needs, for five days, in local time', async () => {
    stubFetch(wellFormed);

    await fetchCurrentWeather({ latitude: 35.4437, longitude: 139.638 });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const [url] = fetchMock.mock.calls[0] as [URL];

    expect(url.searchParams.get('daily')).toBe(
      'weather_code,temperature_2m_max,temperature_2m_min',
    );
    expect(url.searchParams.get('forecast_days')).toBe('5');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('current')).toBe(
      'temperature_2m,weather_code,is_day',
    );
  });
});

/**
 * The date arrives as a local calendar date and has to stay one. Date.parse
 * would read it as midnight UTC, which is the day before or the day after
 * depending on which side of the meridian the device is on.
 */
describe('localDate', () => {
  it('reads the parts as local time, not as UTC', () => {
    const date = localDate('2026-08-20');

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(7);
    expect(date?.getDate()).toBe(20);
    expect(date?.getHours()).toBe(0);
  });

  it('lands on the weekday the calendar says', () => {
    // 2026-08-19 is a Wednesday
    expect(localDate('2026-08-19')?.getDay()).toBe(3);
    expect(localDate('2026-08-23')?.getDay()).toBe(0);
  });

  it.each(['', '2026-08', '2026-08-20-01', 'tomorrow', '2026-00-20', '2026-08-00'])(
    'returns null for %o',
    (input) => {
      expect(localDate(input)).toBeNull();
    },
  );
});

/**
 * WMO codes come in runs, and every boundary here is a place where one
 * condition becomes another.
 */
describe('iconFor', () => {
  it.each([
    [0, 'clear-day', 'clear-night'],
    [1, 'partly-day', 'partly-night'],
    [2, 'partly-day', 'partly-night'],
  ])('follows day and night for code %i', (code, day, night) => {
    expect(iconFor(code, true)).toBe(day);
    expect(iconFor(code, false)).toBe(night);
  });

  it.each([
    [3, 'cloudy'],
    [45, 'fog'],
    [48, 'fog'],
    [51, 'drizzle'],
    [57, 'drizzle'],
    [61, 'rain'],
    [67, 'rain'],
    [71, 'snow'],
    [77, 'snow'],
    [80, 'rain'],
    [82, 'rain'],
    [85, 'snow'],
    [86, 'snow'],
    [95, 'thunder'],
    [99, 'thunder'],
  ])('maps code %i to %s whatever the hour', (code, expected) => {
    expect(iconFor(code, true)).toBe(expected);
    expect(iconFor(code, false)).toBe(expected);
  });

  it('falls back to cloudy for a code it does not know', () => {
    expect(iconFor(4, true)).toBe('cloudy');
    expect(iconFor(-1, true)).toBe('cloudy');
  });
});

describe('conditionFor', () => {
  it.each([
    [0, 'clear'],
    [1, 'mostlyClear'],
    [2, 'partlyCloudy'],
    [3, 'overcast'],
    [45, 'fog'],
    [51, 'drizzle'],
    [57, 'drizzle'],
    [61, 'rain'],
    [67, 'rain'],
    [71, 'snow'],
    [80, 'showers'],
    [82, 'showers'],
    [85, 'snow'],
    [95, 'thunder'],
  ])('names code %i as %s', (code, expected) => {
    expect(conditionFor(code)).toBe(expected);
  });
});
