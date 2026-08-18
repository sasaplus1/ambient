import type { AdjacentDays, WeekStart } from './lib/calendar';
import type { DateFormat } from './lib/dateFormat';
import type { LocaleSetting } from './lib/i18n';
import type { LogLevel } from './lib/logger';
import type { FontFamily, FontTarget, TextScale } from './lib/typography';
import type { Theme } from './lib/theme';

export const CLOCK_TYPES = ['digital', 'analog'] as const;
export type ClockType = (typeof CLOCK_TYPES)[number];

export const SECOND_HANDS = ['none', 'step', 'sweep'] as const;
export type SecondHand = (typeof SECOND_HANDS)[number];

export const ANALOG_NUMERALS = ['none', 'ticks', 'arabic', 'roman'] as const;
export type AnalogNumerals = (typeof ANALOG_NUMERALS)[number];

export const BACKGROUND_FITS = ['cover', 'contain', 'fill'] as const;
export type BackgroundFit = (typeof BACKGROUND_FITS)[number];

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

  showCalendar: boolean;
  /** Which day the calendar's week begins on */
  weekStart: WeekStart;
  /** Whether the days either side of the month are dimmed or hidden */
  adjacentDays: AdjacentDays;

  clockType: ClockType;

  /** Digital clock: use 12-hour notation */
  hour12: boolean;
  /** Digital clock: show seconds */
  showSeconds: boolean;

  /** Analog clock: how the second hand moves */
  secondHand: SecondHand;
  /** Analog clock: ticks and numerals on the dial */
  analogNumerals: AnalogNumerals;

  theme: Theme;

  /** Multiplier applied to every widget's type size */
  textScale: TextScale;
  /** Typeface per widget, so the clock can differ from the rest */
  fonts: Record<FontTarget, FontFamily>;

  /** How the background image fills the screen */
  backgroundFit: BackgroundFit;
  /** Background image opacity, 0-100. Lower it to keep the clock readable. */
  backgroundOpacity: number;

  /** 'auto' follows the browser's language settings */
  locale: LocaleSetting;

  /** Overlays the log HUD on the running dashboard */
  showDebug: boolean;
  /** Lowest level the HUD shows */
  debugLevel: LogLevel;
};
