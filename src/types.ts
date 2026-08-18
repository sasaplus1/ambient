import type { AdjacentDays, DayNumerals, WeekStart } from './lib/calendar';
import type { DateFormat } from './lib/dateFormat';
import type { LocaleSetting } from './lib/i18n';
import type { LogLevel } from './lib/logger';
import type { TemperatureUnitSetting } from './lib/temperature';
import type { TimeBand } from './lib/schedule';
import type { FontFamily, FontTarget, TextScale } from './lib/typography';

export const CLOCK_TYPES = ['digital', 'analog'] as const;
export type ClockType = (typeof CLOCK_TYPES)[number];

export const SECOND_HANDS = ['none', 'step', 'sweep'] as const;
export type SecondHand = (typeof SECOND_HANDS)[number];

export const ANALOG_NUMERALS = [
  'none',
  'ticks',
  'arabic',
  'roman',
  'kanji',
] as const;
export type AnalogNumerals = (typeof ANALOG_NUMERALS)[number];

export const BACKGROUND_FITS = ['cover', 'contain', 'fill'] as const;
export type BackgroundFit = (typeof BACKGROUND_FITS)[number];

export const THEME_MODES = ['fixed', 'schedule'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];


/**
 * Per-device display settings, persisted to localStorage as a whole.
 * Weather, calendar and background image extend this type with more fields.
 */
export type Settings = {
  showClock: boolean;
  showDate: boolean;

  /** How the date is written out; see lib/dateFormat for the presets */
  dateFormat: DateFormat;

  showWeather: boolean;
  /** 'auto' follows the browser's region */
  temperatureUnit: TemperatureUnitSetting;

  showCalendar: boolean;
  /** Which day the calendar's week begins on */
  weekStart: WeekStart;
  /** Whether the days either side of the month are dimmed or hidden */
  adjacentDays: AdjacentDays;
  /** Which numerals the calendar's days are written in */
  dayNumerals: DayNumerals;

  clockType: ClockType;

  /** Digital clock: use 12-hour notation */
  hour12: boolean;
  /** Digital clock: show seconds */
  showSeconds: boolean;

  /** Analog clock: how the second hand moves */
  secondHand: SecondHand;
  /** Analog clock: ticks and numerals on the dial */
  analogNumerals: AnalogNumerals;

  /** How the theme is decided */
  themeMode: ThemeMode;
  /** Theme id used when themeMode is 'fixed'; see lib/theme */
  theme: string;
  /** Theme id per part of the day, used when themeMode is 'schedule' */
  schedule: Record<TimeBand, string>;

  /** Size multiplier per widget */
  scales: Record<FontTarget, TextScale>;
  /** Typeface per widget, so the clock can differ from the rest */
  fonts: Record<FontTarget, FontFamily>;

  /** How the background image fills the screen */
  backgroundFit: BackgroundFit;
  /**
   * How far the background is dimmed towards the theme colour, 0-90.
   * A busy photo can swallow the clock; this is what wins it back.
   */
  backgroundDim: number;

  /** 'auto' follows the browser's language settings */
  locale: LocaleSetting;

  /**
   * Whether the corner controls have been used yet. Until they have, they stay
   * fully visible so a first visitor cannot miss them.
   */
  controlsSeen: boolean;

  /** Whether the settings screen shows its live miniature */
  previewOpen: boolean;

  /** Overlays the log HUD on the running dashboard */
  showDebug: boolean;
  /** Lowest level the HUD shows */
  debugLevel: LogLevel;
};
