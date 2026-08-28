/**
 * Validating the shape of a location and a weather reading as they come out
 * of localStorage.
 *
 * What was stored may have been written by an older version of this app, not
 * the one running now, so checking it field by field is a concern of its own
 * - separate from managing the weather signals, and one that holds regardless
 * of how long those signals have been alive.
 */

import type { CurrentWeather, Coordinates, DailyForecast } from './weather';

export const LOCATION_KEY = 'ambient:location';
export const WEATHER_KEY = 'ambient:weather';
export const SCHEMA_VERSION = 1;

export type StoredLocation = Coordinates & {
  /** Shown in settings so it is clear which place is in use. */
  label: string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function parseLocation(
  raw: Record<string, unknown> | undefined,
): StoredLocation | null {
  if (!raw) {
    return null;
  }

  const latitude = raw['latitude'];
  const longitude = raw['longitude'];
  const label = raw['label'];

  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    label: typeof label === 'string' ? label : '',
  };
}

/**
 * The stored forecast, distrusted the same way everything else here is.
 *
 * A day missing a field takes the whole row with it rather than leaving a gap
 * in the middle of the week. There is nothing to lose by it: the next fetch is
 * along within the half hour, and the temperature above the row is unaffected.
 */
export function parseStoredDaily(stored: unknown): DailyForecast[] {
  if (!Array.isArray(stored)) {
    return [];
  }

  const days: DailyForecast[] = [];

  for (const entry of stored) {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const date = record['date'];
    const weatherCode = record['weatherCode'];
    const max = record['max'];
    const min = record['min'];

    if (
      typeof date !== 'string' ||
      !isFiniteNumber(weatherCode) ||
      !isFiniteNumber(max) ||
      !isFiniteNumber(min)
    ) {
      return [];
    }

    days.push({ date, weatherCode, max, min });
  }

  return days;
}

export function parseWeather(
  raw: Record<string, unknown> | undefined,
): CurrentWeather | null {
  if (!raw) {
    return null;
  }

  const temperature = raw['temperature'];
  const weatherCode = raw['weatherCode'];
  const fetchedAt = raw['fetchedAt'];

  if (
    !isFiniteNumber(temperature) ||
    !isFiniteNumber(weatherCode) ||
    !isFiniteNumber(fetchedAt)
  ) {
    return null;
  }

  return {
    temperature,
    weatherCode,
    isDay: raw['isDay'] !== false,
    daily: parseStoredDaily(raw['daily']),
    fetchedAt,
  };
}
