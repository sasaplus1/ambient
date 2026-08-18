import { computed, effect, signal } from '@preact/signals';

import { isAdjacentDays, isWeekStart } from '../lib/calendar';
import { DEFAULT_DATE_FORMAT, isDateFormat } from '../lib/dateFormat';
import { isLocaleSetting } from '../lib/i18n';
import { isLogLevel } from '../lib/logger';
import { loadRecord, saveRecord } from '../lib/storage';
import { applyTheme, DEFAULT_THEME, isTheme } from '../lib/theme';
import {
  ANALOG_NUMERALS,
  BACKGROUND_FITS,
  CLOCK_TYPES,
  SECOND_HANDS,
  type AnalogNumerals,
  type BackgroundFit,
  type ClockType,
  type SecondHand,
  type Settings,
} from '../types';

const STORAGE_KEY = 'ambient:settings';

/**
 * Bump only when an existing field changes meaning, which discards everything
 * stored. Adding a field needs no bump: parseSettings validates field by field
 * and supplies the default for anything absent.
 */
const SCHEMA_VERSION = 2;

export const DEFAULT_SETTINGS: Settings = {
  showClock: true,
  showDate: true,
  dateFormat: DEFAULT_DATE_FORMAT,
  showWeather: false,
  showCalendar: false,
  weekStart: 'sunday',
  adjacentDays: 'dimmed',
  clockType: 'analog',
  hour12: false,
  showSeconds: false,
  secondHand: 'sweep',
  analogNumerals: 'ticks',
  theme: DEFAULT_THEME,
  backgroundFit: 'cover',
  backgroundOpacity: 100,
  locale: 'auto',
  showDebug: false,
  debugLevel: 'info',
};

function pickNumber(
  raw: Record<string, unknown>,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = raw[key];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(Math.round(value), min), max);
}

function pickBoolean(
  raw: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = raw[key];

  return typeof value === 'boolean' ? value : fallback;
}

function pickUnion<T extends string>(
  raw: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = raw[key];

  return typeof value === 'string' &&
    (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * Never trust what was stored. Validate field by field and fall back to the
 * default for anything invalid, so partial corruption keeps the rest usable.
 */
function parseSettings(raw: Record<string, unknown> | undefined): Settings {
  if (!raw) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    showClock: pickBoolean(raw, 'showClock', DEFAULT_SETTINGS.showClock),
    showDate: pickBoolean(raw, 'showDate', DEFAULT_SETTINGS.showDate),
    dateFormat: isDateFormat(raw['dateFormat'])
      ? raw['dateFormat']
      : DEFAULT_SETTINGS.dateFormat,
    showWeather: pickBoolean(raw, 'showWeather', DEFAULT_SETTINGS.showWeather),
    showCalendar: pickBoolean(
      raw,
      'showCalendar',
      DEFAULT_SETTINGS.showCalendar,
    ),
    weekStart: isWeekStart(raw['weekStart'])
      ? raw['weekStart']
      : DEFAULT_SETTINGS.weekStart,
    adjacentDays: isAdjacentDays(raw['adjacentDays'])
      ? raw['adjacentDays']
      : DEFAULT_SETTINGS.adjacentDays,
    clockType: pickUnion<ClockType>(
      raw,
      'clockType',
      CLOCK_TYPES,
      DEFAULT_SETTINGS.clockType,
    ),
    hour12: pickBoolean(raw, 'hour12', DEFAULT_SETTINGS.hour12),
    showSeconds: pickBoolean(raw, 'showSeconds', DEFAULT_SETTINGS.showSeconds),
    secondHand: pickUnion<SecondHand>(
      raw,
      'secondHand',
      SECOND_HANDS,
      DEFAULT_SETTINGS.secondHand,
    ),
    analogNumerals: pickUnion<AnalogNumerals>(
      raw,
      'analogNumerals',
      ANALOG_NUMERALS,
      DEFAULT_SETTINGS.analogNumerals,
    ),
    theme: isTheme(raw['theme']) ? raw['theme'] : DEFAULT_SETTINGS.theme,
    backgroundFit: pickUnion<BackgroundFit>(
      raw,
      'backgroundFit',
      BACKGROUND_FITS,
      DEFAULT_SETTINGS.backgroundFit,
    ),
    backgroundOpacity: pickNumber(
      raw,
      'backgroundOpacity',
      DEFAULT_SETTINGS.backgroundOpacity,
      10,
      100,
    ),
    locale: isLocaleSetting(raw['locale'])
      ? raw['locale']
      : DEFAULT_SETTINGS.locale,
    showDebug: pickBoolean(raw, 'showDebug', DEFAULT_SETTINGS.showDebug),
    debugLevel: isLogLevel(raw['debugLevel'])
      ? raw['debugLevel']
      : DEFAULT_SETTINGS.debugLevel,
  };
}

export const settings = signal<Settings>(
  parseSettings(loadRecord(STORAGE_KEY, SCHEMA_VERSION)),
);

export function updateSettings(patch: Partial<Settings>): void {
  settings.value = { ...settings.value, ...patch };
}

export function resetSettings(): void {
  settings.value = { ...DEFAULT_SETTINGS };
}

/** Derived value watching only the theme, so other changes do not reapply it. */
const theme = computed(() => settings.value.theme);

/**
 * Start persisting settings and applying the theme. Call once at startup.
 */
export function startSettingsSync(): void {
  effect(() => {
    saveRecord(STORAGE_KEY, SCHEMA_VERSION, settings.value);
  });

  effect(() => {
    applyTheme(theme.value);
  });
}
