import { useEffect, useState } from 'preact/hooks';

import {
  ADJACENT_DAYS,
  WEEK_STARTS,
  type AdjacentDays,
  type WeekStart,
} from '../../lib/calendar';
import {
  DATE_FORMATS,
  formatDate,
  type DateFormat,
} from '../../lib/dateFormat';
import { LOCALE_SETTINGS, type LocaleSetting } from '../../lib/i18n';
import { clearLogs, LOG_LEVELS, type LogLevel } from '../../lib/logger';
import {
  PIXEL_SHIFT_INTERVALS,
  PIXEL_SHIFT_RANGE,
  PIXEL_SHIFT_STRENGTHS,
  type PixelShiftInterval,
  type PixelShiftStrength,
} from '../../lib/pixelShift';
import { TIME_BANDS, bandStartHour, type TimeBand } from '../../lib/schedule';
import {
  TEMPERATURE_UNITS,
  type TemperatureUnitSetting,
} from '../../lib/temperature';
import { THEMES } from '../../lib/theme';
import {
  displayLocale,
  settingsLocale,
  settingsText,
} from '../../state/locale';
import { previewHour } from '../../state/theme';
import { resetSettings, settings, updateSettings } from '../../state/settings';
import {
  THEME_MODES,
  type AnalogNumerals,
  type ClockType,
  type SecondHand,
  type ThemeMode,
} from '../../types';

import { AboutRow } from './AboutRow';
import { BackgroundRow } from './BackgroundRow';
import { LocationRow } from './LocationRow';
import { OptionRow, type Option } from './OptionRow';
import { SchedulePreviewRow } from './SchedulePreviewRow';
import { SettingsPreview } from './SettingsPreview';
import { ToggleRow } from './ToggleRow';
import { TypeRows } from './TypeRows';
import { WidgetSection } from './WidgetSection';

import './settings.css';

/**
 * Option lists are built per render rather than hoisted, because their labels
 * depend on the locale in effect.
 */
function clockTypeOptions(): readonly Option<ClockType>[] {
  return [
    { value: 'digital', label: settingsText('clock.digital') },
    { value: 'analog', label: settingsText('clock.analog') },
  ];
}

function secondHandOptions(): readonly Option<SecondHand>[] {
  return [
    { value: 'none', label: settingsText('secondHand.none') },
    { value: 'step', label: settingsText('secondHand.step') },
    { value: 'sweep', label: settingsText('secondHand.sweep') },
  ];
}

function numeralsOptions(): readonly Option<AnalogNumerals>[] {
  return [
    { value: 'none', label: settingsText('numerals.none') },
    { value: 'ticks', label: settingsText('numerals.ticks') },
    { value: 'arabic', label: settingsText('numerals.arabic') },
    { value: 'roman', label: settingsText('numerals.roman') },
  ];
}

/**
 * Each preset is labelled with today's date as it would actually appear, which
 * says more than a name for the format ever could.
 *
 * In the dashboard's language, not this panel's - the sample is a promise
 * about what the wall will say. Reading the options in Japanese and then being
 * handed "August 20, 2026" would be the panel breaking its own promise.
 */
function dateFormatOptions(today: Date): readonly Option<DateFormat>[] {
  return DATE_FORMATS.map((value) => ({
    value,
    label: formatDate(displayLocale.value, value, today),
  }));
}

function weekStartOptions(): readonly Option<WeekStart>[] {
  return WEEK_STARTS.map((value) => ({
    value,
    label: settingsText(`weekStart.${value}`),
  }));
}

function adjacentDaysOptions(): readonly Option<AdjacentDays>[] {
  return ADJACENT_DAYS.map((value) => ({
    value,
    label: settingsText(`adjacentDays.${value}`),
  }));
}

function themeModeOptions(): readonly Option<ThemeMode>[] {
  return THEME_MODES.map((value) => ({
    value,
    label: settingsText(`themeMode.${value}`),
  }));
}

/** Swatch grid of every theme, used for the fixed choice and for each band. */
function ThemeGrid({
  label,
  selected,
  onChange,
}: {
  label: string;
  selected: string;
  onChange: (id: string) => void;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: as in OptionRow - buttons in a labelled group, not fields in a fieldset
    <div class="setting-options" role="group" aria-label={label}>
      <span class="setting-options__label">{label}</span>
      {/*
        Each swatch shows the theme's own background and text together, which is
        the pairing the theme exists to guarantee.
      */}
      <div class="theme-grid">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            class="theme-swatch"
            style={{
              backgroundColor: theme.colors.bg,
              backgroundImage: theme.colors.gradient ?? 'none',
              color: theme.colors.fg,
            }}
            aria-pressed={theme.id === selected}
            onClick={() => onChange(theme.id)}
          >
            {theme.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function bandLabel(band: TimeBand): string {
  return `${settingsText(`timeBand.${band}`)} ${bandStartHour(band)}:00-`;
}

function temperatureUnitOptions(): readonly Option<TemperatureUnitSetting>[] {
  return TEMPERATURE_UNITS.map((value) => ({
    value,
    label: settingsText(`temperatureUnit.${value}`),
  }));
}

/**
 * Labelled with the distance as well as the word: 'Medium' says nothing on its
 * own, and the whole point is that the number should be a small one.
 */
function pixelShiftStrengthOptions(): readonly Option<PixelShiftStrength>[] {
  return PIXEL_SHIFT_STRENGTHS.map((value) => ({
    value,
    label: `${settingsText(`pixelShiftStrength.${value}`)} ±${PIXEL_SHIFT_RANGE[value]}px`,
  }));
}

function pixelShiftIntervalOptions(): readonly Option<PixelShiftInterval>[] {
  return PIXEL_SHIFT_INTERVALS.map((value) => ({
    value,
    label: `${value} ${settingsText('burnIn.minutes')}`,
  }));
}

function logLevelOptions(): readonly Option<LogLevel>[] {
  return LOG_LEVELS.map((value) => ({
    value,
    label: settingsText(`logLevel.${value}`),
  }));
}

function localeOptions(): readonly Option<LocaleSetting>[] {
  return LOCALE_SETTINGS.map((value) => ({
    value,
    label: settingsText(`language.${value}`),
  }));
}

type SettingsOverlayProps = {
  /** Fading out. It is still on screen, and is about to report that it is not */
  closing: boolean;
  onClose: () => void;
  /** The fade has finished and there is nothing left to keep on screen */
  onClosed: () => void;
};

/**
 * Every setting sits on one scrolling page, grouped by what it affects.
 *
 * Each widget owns its whole section - whether it shows, how it behaves, and
 * how its type looks - so there is one place to go per widget rather than the
 * same widget appearing under several headings.
 */
export function SettingsOverlay({
  closing,
  onClose,
  onClosed,
}: SettingsOverlayProps) {
  const current = settings.value;

  /**
   * Whether the reset has been asked about, and whether it has happened.
   *
   * Three states rather than a flag, because there is something to say
   * afterwards as well as before.
   */
  const [reset, setReset] = useState<'idle' | 'asking' | 'done'>('idle');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      /*
       * Escape answers the question in front of it before it closes anything.
       * Someone who has just been asked whether to throw their settings away
       * and reaches for Escape means no, not "and also put the panel away".
       */
      if (reset === 'asking') {
        setReset('idle');

        return;
      }

      onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, reset]);

  /*
   * Leave the miniature standing in the present for next time.
   *
   * On its own, and with no dependencies, because it belongs to the lifetime of
   * this panel and nothing else. Sharing the effect above meant it also ran
   * whenever onClose arrived as a new function - which is every render of the
   * dashboard behind it, four seconds after the last touch among them. Playing
   * the day would drop back to the current hour partway through.
   */
  useEffect(
    () => () => {
      previewHour.value = null;
    },
    [],
  );

  return (
    <div
      class="settings-overlay"
      /*
       * The document's lang is the dashboard's, so this panel has to say its
       * own - it can be written in a different language from the page it
       * covers, and a screen reader has no other way to know.
       */
      lang={settingsLocale.value}
      role="dialog"
      aria-modal="true"
      aria-label={settingsText('settings.title')}
      data-closing={closing}
      /*
       * By name, because the panel holds plenty of other things that animate
       * and every one of them ends here as well. Reduced motion cuts the
       * duration to nothing rather than removing the animation, so this still
       * arrives - immediately, which is the point.
       */
      onAnimationEnd={(event) => {
        if (event.animationName === 'settings-overlay-out') {
          onClosed();
        }
      }}
    >
      <header class="settings-overlay__header">
        <button
          type="button"
          class="settings-overlay__action"
          aria-expanded={reset === 'asking'}
          onClick={() => setReset(reset === 'asking' ? 'idle' : 'asking')}
        >
          {settingsText('settings.reset')}
        </button>

        <h1 class="settings-overlay__title">{settingsText('settings.title')}</h1>

        <button type="button" class="settings-overlay__action" onClick={onClose}>
          {settingsText('settings.close')}
        </button>
      </header>

      {/*
        Asked here rather than through confirm(). A native dialog is not the
        theme's, cannot be styled into it, and blocks the thread it is called
        on - which on a screen carrying a sweeping second hand is a stall
        anyone would see. This is also the panel's own idiom, used already for
        anything it has to say.

        The button that does it is deliberately not where the finger just was.
        Every other control here is a preference that can be set back; this one
        cannot, and the whole reason for asking is that the two were
        indistinguishable to a mis-tap.
      */}
      {reset === 'asking' && (
        <div class="settings-confirm" role="alertdialog" aria-label={settingsText('settings.reset')}>
          <p class="settings-confirm__question">
            {settingsText('settings.resetAsk')}
          </p>
          <div class="settings-confirm__actions">
            <button
              type="button"
              class="setting-options__choice"
              onClick={() => setReset('idle')}
            >
              {settingsText('settings.resetCancel')}
            </button>
            <button
              type="button"
              class="setting-options__choice settings-confirm__destructive"
              onClick={() => {
                resetSettings();
                setReset('done');
              }}
            >
              {settingsText('settings.resetConfirm')}
            </button>
          </div>
        </div>
      )}

      {/*
        Every widget goes back to its default at once, and on a screen where
        most of them were already off by choice the result can look like
        nothing happened. Saying so costs a line.
      */}
      {reset === 'done' && (
        <p class="setting-message settings-confirm__done">
          {settingsText('settings.resetDone')}
        </p>
      )}

      <div class="settings-overlay__body">
        <SettingsPreview />

        <section class="settings-section">
          <h2 class="settings-section__title">{settingsText('section.language')}</h2>
          <div class="settings-section__items">
            {/*
              This panel's own language first. It is the one the reader is
              already looking at, and someone who has landed here in a language
              they cannot read needs that row before any other.
            */}
            <OptionRow
              label={settingsText('language.settings')}
              options={localeOptions()}
              selected={current.settingsLocale}
              onChange={(settingsLocale) => updateSettings({ settingsLocale })}
            />
            <OptionRow
              label={settingsText('language.display')}
              options={localeOptions()}
              selected={current.locale}
              onChange={(locale) => updateSettings({ locale })}
            />
          </div>
        </section>

        <WidgetSection
          target="clock"
          title={settingsText('section.clock')}
          visible={current.showClock}
          onVisibleChange={(showClock) => updateSettings({ showClock })}
        >
          <OptionRow
            label={settingsText('clock.type')}
            options={clockTypeOptions()}
            selected={current.clockType}
            onChange={(clockType) => updateSettings({ clockType })}
          />

          {/* Only the options that apply to the clock actually in use */}
          {current.clockType === 'digital' ? (
            <>
              <ToggleRow
                label={settingsText('clock.hour12')}
                checked={current.hour12}
                onChange={(hour12) => updateSettings({ hour12 })}
              />
              <ToggleRow
                label={settingsText('clock.showSeconds')}
                checked={current.showSeconds}
                onChange={(showSeconds) => updateSettings({ showSeconds })}
              />
            </>
          ) : (
            <>
              <OptionRow
                label={settingsText('clock.secondHand')}
                options={secondHandOptions()}
                selected={current.secondHand}
                onChange={(secondHand) => updateSettings({ secondHand })}
              />
              <OptionRow
                label={settingsText('clock.dial')}
                options={numeralsOptions()}
                selected={current.analogNumerals}
                onChange={(analogNumerals) => updateSettings({ analogNumerals })}
              />
            </>
          )}
        </WidgetSection>

        <WidgetSection
          target="date"
          title={settingsText('section.date')}
          visible={current.showDate}
          onVisibleChange={(showDate) => updateSettings({ showDate })}
        >
          <OptionRow
            label={settingsText('date.format')}
            options={dateFormatOptions(new Date())}
            selected={current.dateFormat}
            onChange={(dateFormat) => updateSettings({ dateFormat })}
          />
        </WidgetSection>

        {/*
          Not a WidgetSection: that one has a single switch and hides everything
          beneath it, and this has two things to switch. They share a place and
          a typeface, so they share a section - but either can be shown without
          the other, and neither may take the other's settings out of reach.
        */}
        <section class="settings-section">
          <h2 class="settings-section__title">{settingsText('section.weather')}</h2>
          <div class="settings-section__items">
            <ToggleRow
              label={settingsText('weather.today')}
              checked={current.showWeather}
              onChange={(showWeather) => updateSettings({ showWeather })}
            />
            <ToggleRow
              label={settingsText('weather.forecast')}
              checked={current.showForecast}
              onChange={(showForecast) => updateSettings({ showForecast })}
            />

            {(current.showWeather || current.showForecast) && (
              <>
                <LocationRow />
                <OptionRow
                  label={settingsText('weather.unit')}
                  options={temperatureUnitOptions()}
                  selected={current.temperatureUnit}
                  onChange={(temperatureUnit) =>
                    updateSettings({ temperatureUnit })
                  }
                />
                <TypeRows target="weather" />
              </>
            )}
          </div>
        </section>

        <WidgetSection
          target="calendar"
          title={settingsText('section.calendar')}
          visible={current.showCalendar}
          onVisibleChange={(showCalendar) => updateSettings({ showCalendar })}
        >
          <OptionRow
            label={settingsText('calendar.weekStart')}
            options={weekStartOptions()}
            selected={current.weekStart}
            onChange={(weekStart) => updateSettings({ weekStart })}
          />
          <OptionRow
            label={settingsText('calendar.adjacentDays')}
            options={adjacentDaysOptions()}
            selected={current.adjacentDays}
            onChange={(adjacentDays) => updateSettings({ adjacentDays })}
          />
        </WidgetSection>

        <section class="settings-section">
          <h2 class="settings-section__title">{settingsText('section.theme')}</h2>
          <div class="settings-section__items">
            <OptionRow
              label={settingsText('theme.mode')}
              options={themeModeOptions()}
              selected={current.themeMode}
              onChange={(themeMode) => updateSettings({ themeMode })}
            />

            {current.themeMode === 'schedule' && <SchedulePreviewRow />}

            {current.themeMode === 'fixed' ? (
              <ThemeGrid
                label={settingsText('theme.palette')}
                selected={current.theme}
                onChange={(theme) => updateSettings({ theme })}
              />
            ) : (
              TIME_BANDS.map((band) => (
                <ThemeGrid
                  key={band}
                  label={bandLabel(band)}
                  selected={current.schedule[band]}
                  onChange={(id) =>
                    updateSettings({
                      schedule: { ...current.schedule, [band]: id },
                    })
                  }
                />
              ))
            )}
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{settingsText('section.background')}</h2>
          <div class="settings-section__items">
            <BackgroundRow />
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{settingsText('section.burnIn')}</h2>
          <div class="settings-section__items">
            <ToggleRow
              label={settingsText('burnIn.pixelShift')}
              checked={current.pixelShift}
              onChange={(pixelShift) => updateSettings({ pixelShift })}
            />

            {/*
              The one setting on this page whose name gives away nothing about
              what it is for, or who would want it.
            */}
            <p class="setting-message">{settingsText('burnIn.hint')}</p>

            {current.pixelShift && (
              <>
                <OptionRow
                  label={settingsText('burnIn.distance')}
                  options={pixelShiftStrengthOptions()}
                  selected={current.pixelShiftStrength}
                  onChange={(pixelShiftStrength) =>
                    updateSettings({ pixelShiftStrength })
                  }
                />
                <OptionRow
                  label={settingsText('burnIn.interval')}
                  options={pixelShiftIntervalOptions()}
                  selected={current.pixelShiftInterval}
                  onChange={(pixelShiftInterval) =>
                    updateSettings({ pixelShiftInterval })
                  }
                />
              </>
            )}
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{settingsText('section.debug')}</h2>
          <div class="settings-section__items">
            <ToggleRow
              label={settingsText('debug.overlay')}
              checked={current.showDebug}
              onChange={(showDebug) => updateSettings({ showDebug })}
            />
            {current.showDebug && (
              <>
                <OptionRow
                  label={settingsText('debug.level')}
                  options={logLevelOptions()}
                  selected={current.debugLevel}
                  onChange={(debugLevel) => updateSettings({ debugLevel })}
                />
                <button
                  type="button"
                  class="setting-row"
                  onClick={() => clearLogs()}
                >
                  <span class="setting-row__label">{settingsText('debug.clear')}</span>
                </button>
              </>
            )}
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{settingsText('section.about')}</h2>
          <div class="settings-section__items">
            <AboutRow />
          </div>
        </section>
      </div>
    </div>
  );
}
