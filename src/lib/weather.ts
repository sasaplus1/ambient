const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';

export type WeatherIconName =
  | 'clear-day'
  | 'clear-night'
  | 'partly-day'
  | 'partly-night'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder';

/** One day ahead, as the forecast row shows it. */
export type DailyForecast = {
  /** Local calendar date, `YYYY-MM-DD`, as the API returned it */
  date: string;
  weatherCode: number;
  max: number;
  min: number;
};

/** How many days the row shows, today included. */
export const FORECAST_DAYS = 5;

export type CurrentWeather = {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  /**
   * The days ahead, today first. Empty if the response had nothing usable,
   * which the row treats as nothing to show rather than as a failure - the
   * temperature is worth having on its own.
   */
  daily: readonly DailyForecast[];
  /** When we fetched it, in epoch milliseconds. Used for the stale check. */
  fetchedAt: number;
};

export type Place = {
  name: string;
  /** Region and country, for telling identically named places apart. */
  detail: string;
  latitude: number;
  longitude: number;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * A calendar date from the API, read as a local one.
 *
 * Built from the parts rather than handed to Date.parse. `2026-08-20` parsed as
 * a date string is midnight UTC, which formatted east or west of the meridian
 * is liable to come out as the day before or the day after. The API already
 * gave us the local calendar date, so the only honest reading of it is a local
 * one.
 *
 * Null for anything that is not three numbers, which is also how a zero gets
 * turned away: there is no month 0 and no day 0.
 */
export function localDate(date: string): Date | null {
  const parts = date.split('-').map(Number);
  const [year, month, day] = parts;

  if (parts.length !== 3 || !year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

/**
 * WMO weather interpretation codes, grouped into the handful of conditions
 * worth distinguishing on a display glanced at from across a room.
 */
export function iconFor(code: number, isDay: boolean): WeatherIconName {
  if (code === 0) {
    return isDay ? 'clear-day' : 'clear-night';
  }

  if (code === 1 || code === 2) {
    return isDay ? 'partly-day' : 'partly-night';
  }

  if (code === 3) {
    return 'cloudy';
  }

  if (code === 45 || code === 48) {
    return 'fog';
  }

  if (code >= 51 && code <= 57) {
    return 'drizzle';
  }

  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return 'rain';
  }

  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return 'snow';
  }

  if (code >= 95) {
    return 'thunder';
  }

  return 'cloudy';
}

export type ConditionKey =
  | 'clear'
  | 'mostlyClear'
  | 'partlyCloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'showers'
  | 'thunder';

export function conditionFor(code: number): ConditionKey {
  if (code === 0) return 'clear';
  if (code === 1) return 'mostlyClear';
  if (code === 2) return 'partlyCloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 95) return 'thunder';

  return 'overcast';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * The days ahead, out of the same response the temperature came from.
 *
 * Open-Meteo answers in parallel arrays rather than a list of days, so the
 * lengths are the thing to distrust: a short one would pair a Tuesday with
 * Wednesday's high. Anything that does not line up is dropped entirely, and the
 * row simply does not appear - a wrong forecast is worse than no forecast.
 *
 * timezone=auto means the dates are already the local ones, so there is no
 * boundary to work out here.
 */
export function parseDaily(body: Record<string, unknown>): DailyForecast[] {
  const daily = body['daily'];

  if (typeof daily !== 'object' || daily === null) {
    return [];
  }

  const record = daily as Record<string, unknown>;
  const dates = record['time'];
  const codes = record['weather_code'];
  const highs = record['temperature_2m_max'];
  const lows = record['temperature_2m_min'];

  if (
    !Array.isArray(dates) ||
    !Array.isArray(codes) ||
    !Array.isArray(highs) ||
    !Array.isArray(lows)
  ) {
    return [];
  }

  const days: DailyForecast[] = [];

  for (let index = 0; index < dates.length; index += 1) {
    const date = dates[index];
    const weatherCode = codes[index];
    const max = highs[index];
    const min = lows[index];

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

export async function fetchCurrentWeather(
  coordinates: Coordinates,
  signal?: AbortSignal,
): Promise<CurrentWeather> {
  const url = new URL(FORECAST_ENDPOINT);

  url.searchParams.set('latitude', coordinates.latitude.toFixed(4));
  url.searchParams.set('longitude', coordinates.longitude.toFixed(4));
  url.searchParams.set('current', 'temperature_2m,weather_code,is_day');

  // Along for the ride: the same request answers both, at no extra call
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min',
  );
  url.searchParams.set('forecast_days', String(FORECAST_DAYS));
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url, signal ? { signal } : {});

  if (!response.ok) {
    throw new Error(`weather request failed: ${response.status}`);
  }

  const body: unknown = await response.json();
  const envelope =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {};
  const current = envelope['current'];

  if (typeof current !== 'object' || current === null) {
    throw new Error('weather response had no current block');
  }

  const record = current as Record<string, unknown>;
  const temperature = record['temperature_2m'];
  const weatherCode = record['weather_code'];

  if (!isFiniteNumber(temperature) || !isFiniteNumber(weatherCode)) {
    throw new Error('weather response was missing fields');
  }

  return {
    temperature,
    weatherCode,
    isDay: record['is_day'] !== 0,
    daily: parseDaily(envelope),
    fetchedAt: Date.now(),
  };
}

export async function searchPlaces(
  query: string,
  language: string,
  signal?: AbortSignal,
): Promise<Place[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const url = new URL(GEOCODING_ENDPOINT);

  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', language);
  url.searchParams.set('format', 'json');

  const response = await fetch(url, signal ? { signal } : {});

  if (!response.ok) {
    throw new Error(`geocoding request failed: ${response.status}`);
  }

  const body: unknown = await response.json();
  const results =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)['results']
      : undefined;

  if (!Array.isArray(results)) {
    // Open-Meteo omits `results` entirely when nothing matched
    return [];
  }

  return results.flatMap((entry): Place[] => {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const name = record['name'];
    const latitude = record['latitude'];
    const longitude = record['longitude'];

    if (
      typeof name !== 'string' ||
      !isFiniteNumber(latitude) ||
      !isFiniteNumber(longitude)
    ) {
      return [];
    }

    const detail = [record['admin1'], record['country']]
      .filter((part): part is string => typeof part === 'string')
      .join(', ');

    return [{ name, detail, latitude, longitude }];
  });
}

/**
 * Wraps the callback-style Geolocation API in a promise.
 * Rejects on unsupported devices too, so the caller has one failure path.
 */
export function requestPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('geolocation unsupported'));

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`geolocation failed: ${error.message}`));
      },
      { timeout: 15_000, maximumAge: 600_000 },
    );
  });
}
