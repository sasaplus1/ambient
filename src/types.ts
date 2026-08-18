import type { LocaleSetting } from './lib/i18n';
import type { Theme } from './lib/theme';

export const CLOCK_TYPES = ['digital', 'analog'] as const;
export type ClockType = (typeof CLOCK_TYPES)[number];

export const SECOND_HANDS = ['none', 'step', 'sweep'] as const;
export type SecondHand = (typeof SECOND_HANDS)[number];

export const ANALOG_NUMERALS = ['none', 'ticks', 'arabic', 'roman'] as const;
export type AnalogNumerals = (typeof ANALOG_NUMERALS)[number];

/**
 * Per-device display settings, persisted to localStorage as a whole.
 * Weather, calendar and background image extend this type with more fields.
 */
export type Settings = {
  showClock: boolean;
  showDate: boolean;

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

  /** 'auto' follows the browser's language settings */
  locale: LocaleSetting;
};
