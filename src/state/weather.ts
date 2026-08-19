import { effect, signal, untracked } from '@preact/signals';

import { logger } from '../lib/logger';
import { loadRecord, saveRecord } from '../lib/storage';
import {
  fetchCurrentWeather,
  type CurrentWeather,
  type Coordinates,
  type DailyForecast,
} from '../lib/weather';

import { settings } from './settings';

const LOCATION_KEY = 'ambient:location';
const WEATHER_KEY = 'ambient:weather';
const SCHEMA_VERSION = 1;

/** Refetch once the reading is older than this. */
const MAX_AGE_MS = 30 * 60 * 1000;

/** How often to reconsider whether the reading has gone stale. */
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export type StoredLocation = Coordinates & {
  /** Shown in settings so it is clear which place is in use. */
  label: string;
};

export type WeatherStatus = 'idle' | 'loading' | 'ready' | 'error';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseLocation(
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
function parseDaily(stored: unknown): DailyForecast[] {
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

function parseWeather(
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
    daily: parseDaily(raw['daily']),
    fetchedAt,
  };
}

export const location = signal<StoredLocation | null>(
  parseLocation(loadRecord(LOCATION_KEY, SCHEMA_VERSION)),
);

/**
 * The last reading we have. Kept across restarts so a device that wakes up
 * without a network still shows something rather than an empty slot.
 */
export const weather = signal<CurrentWeather | null>(
  parseWeather(loadRecord(WEATHER_KEY, SCHEMA_VERSION)),
);

export const weatherStatus = signal<WeatherStatus>('idle');

export function setLocation(next: StoredLocation | null): void {
  location.value = next;

  // The previous reading belongs to the previous place
  weather.value = null;
  weatherStatus.value = 'idle';

  void refreshWeather();
}

function isStale(reading: CurrentWeather | null): boolean {
  return !reading || Date.now() - reading.fetchedAt > MAX_AGE_MS;
}

let inFlight: AbortController | null = null;

export async function refreshWeather(force = false): Promise<void> {
  const place = location.value;

  if (!place) {
    return;
  }

  if (!force && !isStale(weather.value)) {
    return;
  }

  inFlight?.abort();

  const controller = new AbortController();

  inFlight = controller;
  weatherStatus.value = 'loading';

  try {
    const reading = await fetchCurrentWeather(place, controller.signal);

    weather.value = reading;
    weatherStatus.value = 'ready';
    logger.info('weather', `updated ${reading.temperature}C code=${reading.weatherCode}`);
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }

    // Keep whatever we last had on screen; only the status reflects the failure
    weatherStatus.value = 'error';
    logger.error('weather', `fetch failed: ${String(error)}`);
  } finally {
    if (inFlight === controller) {
      inFlight = null;
    }
  }
}

/**
 * Persist the location and the last reading, and keep the reading fresh.
 * Call once at startup.
 */
export function startWeatherSync(): void {
  effect(() => {
    const place = location.value;

    if (place) {
      saveRecord(LOCATION_KEY, SCHEMA_VERSION, { ...place });
    }
  });

  effect(() => {
    const reading = weather.value;

    if (reading) {
      saveRecord(WEATHER_KEY, SCHEMA_VERSION, { ...reading });
    }
  });

  /*
   * Fetch again when the forecast is wanted and the reading we are holding has
   * none.
   *
   * A reading saved before the forecast existed is a perfectly good
   * temperature, so the staleness check leaves it alone for its full half hour
   * - during which turning the row on shows nothing and explains nothing.
   *
   * Once per session, and no more. If the answer comes back without a forecast
   * again, that is the answer, and asking every five minutes for the rest of
   * the day would not change it.
   */
  let askedForDaily = false;

  effect(() => {
    const wanted = settings.value.showForecast;
    const missing = (weather.value?.daily.length ?? 0) === 0;

    untracked(() => {
      if (!wanted || !missing || askedForDaily || !location.value) {
        return;
      }

      askedForDaily = true;
      void refreshWeather(true);
    });
  });

  const check = () => {
    void refreshWeather();
  };

  check();
  window.setInterval(check, CHECK_INTERVAL_MS);

  // A device left running can be offline for hours; retry as soon as it is
  // back, and whenever the display is looked at again.
  window.addEventListener('online', check);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      check();
    }
  });
}
