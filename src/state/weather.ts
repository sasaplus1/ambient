import { effect, signal, untracked } from '@preact/signals';

import { logger } from '../lib/logger';
import { loadRecord, saveRecord } from '../lib/storage';
import { fetchCurrentWeather, type CurrentWeather } from '../lib/weather';
import {
  LOCATION_KEY,
  parseLocation,
  parseWeather,
  SCHEMA_VERSION,
  WEATHER_KEY,
  type StoredLocation,
} from '../lib/weatherSchema';

import { settings } from './settings';

/** Refetch once the reading is older than this. */
const MAX_AGE_MS = 30 * 60 * 1000;

/** How often to reconsider whether the reading has gone stale. */
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export type WeatherStatus = 'idle' | 'loading' | 'ready' | 'error';

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
