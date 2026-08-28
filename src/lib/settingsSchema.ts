/**
 * Validating the shape of settings as they come out of localStorage.
 *
 * What was stored may have been written by an older version of this app, not
 * the one running now, so checking it field by field is a concern of its own
 * - separate from managing the settings signal, and one that holds regardless
 * of how long that signal has been alive.
 */

import { isAdjacentDays, isWeekStart } from './calendar';
import { DEFAULT_DATE_FORMAT, isDateFormat } from './dateFormat';
import { isLocaleSetting } from './i18n';
import { isLogLevel } from './logger';
import { isPixelShiftInterval, isPixelShiftStrength } from './pixelShift';
import { TIME_BANDS, type TimeBand } from './schedule';
import { isTemperatureUnitSetting } from './temperature';
import {
  FONT_TARGETS,
  isFontFamily,
  isTextScale,
  type FontFamily,
  type FontTarget,
  type TextScale,
} from './typography';
import { DEFAULT_THEME, isThemeId } from './theme';
import {
  ANALOG_NUMERALS,
  BACKGROUND_FITS,
  CLOCK_TYPES,
  THEME_MODES,
  SECOND_HANDS,
  type AnalogNumerals,
  type BackgroundFit,
  type ClockType,
  type SecondHand,
  type ThemeMode,
  type Settings,
} from '../types';

export const STORAGE_KEY = 'ambient:settings';

/**
 * Bump only when an existing field changes meaning, which discards everything
 * stored. Adding a field needs no bump: parseSettings validates field by field
 * and supplies the default for anything absent.
 */
export const SCHEMA_VERSION = 2;

export const DEFAULT_SETTINGS: Settings = {
  showClock: true,
  showDate: false,
  dateFormat: DEFAULT_DATE_FORMAT,
  showWeather: false,
  temperatureUnit: 'auto',
  showForecast: false,
  showCalendar: true,
  weekStart: 'sunday',
  adjacentDays: 'dimmed',
  clockType: 'analog',
  hour12: false,
  showSeconds: false,
  secondHand: 'sweep',
  analogNumerals: 'ticks',
  themeMode: 'fixed',
  theme: DEFAULT_THEME,
  schedule: {
    morning: 'sakura',
    day: 'mist',
    evening: 'dawn',
    night: 'midnight',
    lateNight: 'abyss',
  },
  scales: {
    clock: 'm',
    date: 's',
    weather: 'm',
    calendar: 'l',
  },
  fonts: {
    clock: 'sans',
    date: 'sans',
    weather: 'sans',
    calendar: 'sans',
  },
  backgroundFit: 'cover',
  backgroundDim: 30,
  pixelShift: false,
  pixelShiftStrength: 'medium',
  pixelShiftInterval: 30,
  locale: 'auto',
  settingsLocale: 'auto',
  controlsSeen: false,
  previewOpen: true,
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

function widgetRecord(
  raw: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const stored = raw[key];

  return typeof stored === 'object' && stored !== null
    ? (stored as Record<string, unknown>)
    : {};
}

/** Per-widget, so one bad entry does not cost the others their setting. */
function pickFonts(raw: Record<string, unknown>): Record<FontTarget, FontFamily> {
  const record = widgetRecord(raw, 'fonts');

  return Object.fromEntries(
    FONT_TARGETS.map((target) => [
      target,
      isFontFamily(record[target])
        ? record[target]
        : DEFAULT_SETTINGS.fonts[target],
    ]),
  ) as Record<FontTarget, FontFamily>;
}

function pickScales(raw: Record<string, unknown>): Record<FontTarget, TextScale> {
  const record = widgetRecord(raw, 'scales');

  return Object.fromEntries(
    FONT_TARGETS.map((target) => [
      target,
      isTextScale(record[target])
        ? record[target]
        : DEFAULT_SETTINGS.scales[target],
    ]),
  ) as Record<FontTarget, TextScale>;
}

function pickSchedule(raw: Record<string, unknown>): Record<TimeBand, string> {
  const record = widgetRecord(raw, 'schedule');

  return Object.fromEntries(
    TIME_BANDS.map((band) => [
      band,
      isThemeId(record[band]) ? record[band] : DEFAULT_SETTINGS.schedule[band],
    ]),
  ) as Record<TimeBand, string>;
}

/**
 * Never trust what was stored. Validate field by field and fall back to the
 * default for anything invalid, so partial corruption keeps the rest usable.
 */
export function parseSettings(
  raw: Record<string, unknown> | undefined,
): Settings {
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
    temperatureUnit: isTemperatureUnitSetting(raw['temperatureUnit'])
      ? raw['temperatureUnit']
      : DEFAULT_SETTINGS.temperatureUnit,
    showForecast: pickBoolean(raw, 'showForecast', DEFAULT_SETTINGS.showForecast),
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
    themeMode: pickUnion<ThemeMode>(
      raw,
      'themeMode',
      THEME_MODES,
      DEFAULT_SETTINGS.themeMode,
    ),
    theme: isThemeId(raw['theme']) ? raw['theme'] : DEFAULT_SETTINGS.theme,
    schedule: pickSchedule(raw),
    scales: pickScales(raw),
    fonts: pickFonts(raw),
    backgroundFit: pickUnion<BackgroundFit>(
      raw,
      'backgroundFit',
      BACKGROUND_FITS,
      DEFAULT_SETTINGS.backgroundFit,
    ),
    backgroundDim: pickNumber(
      raw,
      'backgroundDim',
      DEFAULT_SETTINGS.backgroundDim,
      0,
      90,
    ),
    pixelShift: pickBoolean(raw, 'pixelShift', DEFAULT_SETTINGS.pixelShift),
    pixelShiftStrength: isPixelShiftStrength(raw['pixelShiftStrength'])
      ? raw['pixelShiftStrength']
      : DEFAULT_SETTINGS.pixelShiftStrength,
    pixelShiftInterval: isPixelShiftInterval(raw['pixelShiftInterval'])
      ? raw['pixelShiftInterval']
      : DEFAULT_SETTINGS.pixelShiftInterval,
    locale: isLocaleSetting(raw['locale'])
      ? raw['locale']
      : DEFAULT_SETTINGS.locale,
    /*
     * Absent from anything stored before this existed, and the default is what
     * it should be then: follow the browser, as the one language used to.
     */
    settingsLocale: isLocaleSetting(raw['settingsLocale'])
      ? raw['settingsLocale']
      : DEFAULT_SETTINGS.settingsLocale,
    controlsSeen: pickBoolean(
      raw,
      'controlsSeen',
      DEFAULT_SETTINGS.controlsSeen,
    ),
    previewOpen: pickBoolean(raw, 'previewOpen', DEFAULT_SETTINGS.previewOpen),
    showDebug: pickBoolean(raw, 'showDebug', DEFAULT_SETTINGS.showDebug),
    debugLevel: isLogLevel(raw['debugLevel'])
      ? raw['debugLevel']
      : DEFAULT_SETTINGS.debugLevel,
  };
}
