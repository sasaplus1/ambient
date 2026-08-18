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

export type CurrentWeather = {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
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

export async function fetchCurrentWeather(
  coordinates: Coordinates,
  signal?: AbortSignal,
): Promise<CurrentWeather> {
  const url = new URL(FORECAST_ENDPOINT);

  url.searchParams.set('latitude', coordinates.latitude.toFixed(4));
  url.searchParams.set('longitude', coordinates.longitude.toFixed(4));
  url.searchParams.set('current', 'temperature_2m,weather_code,is_day');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url, signal ? { signal } : {});

  if (!response.ok) {
    throw new Error(`weather request failed: ${response.status}`);
  }

  const body: unknown = await response.json();
  const current =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)['current']
      : undefined;

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
