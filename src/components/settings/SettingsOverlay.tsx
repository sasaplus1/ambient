import { useEffect } from 'preact/hooks';

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
import { THEMES, themeLabel, type Theme } from '../../lib/theme';
import { TEXT_SCALES, type TextScale } from '../../lib/typography';
import { locale, t } from '../../state/locale';
import { resetSettings, settings, updateSettings } from '../../state/settings';
import type { AnalogNumerals, ClockType, SecondHand } from '../../types';

import { BackgroundRow } from './BackgroundRow';
import { LocationRow } from './LocationRow';
import { OptionRow, type Option } from './OptionRow';
import { ToggleRow } from './ToggleRow';
import { WidgetSection } from './WidgetSection';

import './settings.css';

/**
 * Option lists are built per render rather than hoisted, because their labels
 * depend on the locale in effect.
 */
function clockTypeOptions(): readonly Option<ClockType>[] {
  return [
    { value: 'digital', label: t('clock.digital') },
    { value: 'analog', label: t('clock.analog') },
  ];
}

function secondHandOptions(): readonly Option<SecondHand>[] {
  return [
    { value: 'none', label: t('secondHand.none') },
    { value: 'step', label: t('secondHand.step') },
    { value: 'sweep', label: t('secondHand.sweep') },
  ];
}

function numeralsOptions(): readonly Option<AnalogNumerals>[] {
  return [
    { value: 'none', label: t('numerals.none') },
    { value: 'ticks', label: t('numerals.ticks') },
    { value: 'arabic', label: t('numerals.arabic') },
    { value: 'roman', label: t('numerals.roman') },
  ];
}

/**
 * Each preset is labelled with today's date as it would actually appear, which
 * says more than a name for the format ever could.
 */
function dateFormatOptions(today: Date): readonly Option<DateFormat>[] {
  return DATE_FORMATS.map((value) => ({
    value,
    label: formatDate(locale.value, value, today),
  }));
}

function weekStartOptions(): readonly Option<WeekStart>[] {
  return WEEK_STARTS.map((value) => ({
    value,
    label: t(`weekStart.${value}`),
  }));
}

function adjacentDaysOptions(): readonly Option<AdjacentDays>[] {
  return ADJACENT_DAYS.map((value) => ({
    value,
    label: t(`adjacentDays.${value}`),
  }));
}

function themeOptions(): readonly Option<Theme>[] {
  return THEMES.map((theme) => ({ value: theme, label: themeLabel(theme) }));
}

function textScaleOptions(): readonly Option<TextScale>[] {
  return TEXT_SCALES.map((value) => ({
    value,
    label: t(`textScale.${value}`),
  }));
}

function logLevelOptions(): readonly Option<LogLevel>[] {
  return LOG_LEVELS.map((value) => ({
    value,
    label: t(`logLevel.${value}`),
  }));
}

function localeOptions(): readonly Option<LocaleSetting>[] {
  return LOCALE_SETTINGS.map((value) => ({
    value,
    label: t(`language.${value}`),
  }));
}

type SettingsOverlayProps = {
  onClose: () => void;
};

/**
 * Every setting sits on one scrolling page, grouped by what it affects.
 *
 * Each widget owns its whole section - whether it shows, how it behaves, and
 * how its type looks - so there is one place to go per widget rather than the
 * same widget appearing under several headings.
 */
export function SettingsOverlay({ onClose }: SettingsOverlayProps) {
  const current = settings.value;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      class="settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('settings.title')}
    >
      <header class="settings-overlay__header">
        <button
          type="button"
          class="settings-overlay__action"
          onClick={() => resetSettings()}
        >
          {t('settings.reset')}
        </button>

        <h1 class="settings-overlay__title">{t('settings.title')}</h1>

        <button type="button" class="settings-overlay__action" onClick={onClose}>
          {t('settings.close')}
        </button>
      </header>

      <div class="settings-overlay__body">
        <WidgetSection
          target="clock"
          title={t('section.clock')}
          visible={current.showClock}
          onVisibleChange={(showClock) => updateSettings({ showClock })}
        >
          <OptionRow
            label={t('clock.type')}
            options={clockTypeOptions()}
            selected={current.clockType}
            onChange={(clockType) => updateSettings({ clockType })}
          />

          {/* Only the options that apply to the clock actually in use */}
          {current.clockType === 'digital' ? (
            <>
              <ToggleRow
                label={t('clock.hour12')}
                checked={current.hour12}
                onChange={(hour12) => updateSettings({ hour12 })}
              />
              <ToggleRow
                label={t('clock.showSeconds')}
                checked={current.showSeconds}
                onChange={(showSeconds) => updateSettings({ showSeconds })}
              />
            </>
          ) : (
            <>
              <OptionRow
                label={t('clock.secondHand')}
                options={secondHandOptions()}
                selected={current.secondHand}
                onChange={(secondHand) => updateSettings({ secondHand })}
              />
              <OptionRow
                label={t('clock.dial')}
                options={numeralsOptions()}
                selected={current.analogNumerals}
                onChange={(analogNumerals) => updateSettings({ analogNumerals })}
              />
            </>
          )}
        </WidgetSection>

        <WidgetSection
          target="date"
          title={t('section.date')}
          visible={current.showDate}
          onVisibleChange={(showDate) => updateSettings({ showDate })}
        >
          <OptionRow
            label={t('date.format')}
            options={dateFormatOptions(new Date())}
            selected={current.dateFormat}
            onChange={(dateFormat) => updateSettings({ dateFormat })}
          />
        </WidgetSection>

        <WidgetSection
          target="weather"
          title={t('section.weather')}
          visible={current.showWeather}
          onVisibleChange={(showWeather) => updateSettings({ showWeather })}
        >
          <LocationRow />
        </WidgetSection>

        <WidgetSection
          target="calendar"
          title={t('section.calendar')}
          visible={current.showCalendar}
          onVisibleChange={(showCalendar) => updateSettings({ showCalendar })}
        >
          <OptionRow
            label={t('calendar.weekStart')}
            options={weekStartOptions()}
            selected={current.weekStart}
            onChange={(weekStart) => updateSettings({ weekStart })}
          />
          <OptionRow
            label={t('calendar.adjacentDays')}
            options={adjacentDaysOptions()}
            selected={current.adjacentDays}
            onChange={(adjacentDays) => updateSettings({ adjacentDays })}
          />
        </WidgetSection>

        <section class="settings-section">
          <h2 class="settings-section__title">{t('section.theme')}</h2>
          <div class="settings-section__items">
            <OptionRow
              label={t('theme.palette')}
              options={themeOptions()}
              selected={current.theme}
              onChange={(theme) => updateSettings({ theme })}
            />
            {/* Scales the whole dashboard; the per-widget sizes stack on top */}
            <OptionRow
              label={t('type.scale')}
              options={textScaleOptions()}
              selected={current.textScale}
              onChange={(textScale) => updateSettings({ textScale })}
            />
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{t('section.background')}</h2>
          <div class="settings-section__items">
            <BackgroundRow />
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{t('section.language')}</h2>
          <div class="settings-section__items">
            <OptionRow
              label={t('language.label')}
              options={localeOptions()}
              selected={current.locale}
              onChange={(locale) => updateSettings({ locale })}
            />
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{t('section.debug')}</h2>
          <div class="settings-section__items">
            <ToggleRow
              label={t('debug.overlay')}
              checked={current.showDebug}
              onChange={(showDebug) => updateSettings({ showDebug })}
            />
            {current.showDebug && (
              <>
                <OptionRow
                  label={t('debug.level')}
                  options={logLevelOptions()}
                  selected={current.debugLevel}
                  onChange={(debugLevel) => updateSettings({ debugLevel })}
                />
                <button
                  type="button"
                  class="setting-row"
                  onClick={() => clearLogs()}
                >
                  <span class="setting-row__label">{t('debug.clear')}</span>
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
