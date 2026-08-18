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
import {
  FONT_FAMILIES,
  FONT_TARGETS,
  TEXT_SCALES,
  type FontFamily,
  type TextScale,
} from '../../lib/typography';
import { locale, t } from '../../state/locale';
import { resetSettings, settings, updateSettings } from '../../state/settings';
import type { AnalogNumerals, ClockType, SecondHand } from '../../types';

import { BackgroundRow } from './BackgroundRow';
import { LocationRow } from './LocationRow';
import { OptionRow, type Option } from './OptionRow';
import { ToggleRow } from './ToggleRow';

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

function fontOptions(): readonly Option<FontFamily>[] {
  return FONT_FAMILIES.map((value) => ({
    value,
    label: t(`font.${value}`),
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
 * Every setting sits on one scrolling page.
 *
 * Options that only apply to the clock you are not using are left out rather
 * than shown inert, which keeps the list about as short as a second level would
 * have without hiding anything behind a tap.
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
        <section class="settings-section">
          <h2 class="settings-section__title">{t('section.display')}</h2>
          <div class="settings-section__items">
            <ToggleRow
              label={t('widget.clock')}
              checked={current.showClock}
              onChange={(showClock) => updateSettings({ showClock })}
            />
            <ToggleRow
              label={t('widget.date')}
              checked={current.showDate}
              onChange={(showDate) => updateSettings({ showDate })}
            />
            <ToggleRow
              label={t('widget.weather')}
              checked={current.showWeather}
              onChange={(showWeather) => updateSettings({ showWeather })}
            />
            <ToggleRow
              label={t('widget.calendar')}
              checked={current.showCalendar}
              onChange={(showCalendar) => updateSettings({ showCalendar })}
            />
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{t('section.clock')}</h2>
          <div class="settings-section__items">
            <OptionRow
              label={t('clock.type')}
              options={clockTypeOptions()}
              selected={current.clockType}
              onChange={(clockType) => updateSettings({ clockType })}
            />

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
                  onChange={(analogNumerals) =>
                    updateSettings({ analogNumerals })
                  }
                />
              </>
            )}
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{t('section.date')}</h2>
          <div class="settings-section__items">
            <OptionRow
              label={t('date.format')}
              options={dateFormatOptions(new Date())}
              selected={current.dateFormat}
              onChange={(dateFormat) => updateSettings({ dateFormat })}
            />
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{t('section.weather')}</h2>
          <div class="settings-section__items">
            <LocationRow />
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{t('section.calendar')}</h2>
          <div class="settings-section__items">
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
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{t('section.theme')}</h2>
          <div class="settings-section__items">
            <OptionRow
              label={t('theme.palette')}
              options={themeOptions()}
              selected={current.theme}
              onChange={(theme) => updateSettings({ theme })}
            />
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{t('section.typography')}</h2>
          <div class="settings-section__items">
            <OptionRow
              label={t('type.scale')}
              options={textScaleOptions()}
              selected={current.textScale}
              onChange={(textScale) => updateSettings({ textScale })}
            />
            {FONT_TARGETS.map((target) => (
              <OptionRow
                key={`scale-${target}`}
                label={t(`type.scale.${target}`)}
                options={textScaleOptions()}
                selected={current.scales[target]}
                onChange={(scale) =>
                  updateSettings({
                    scales: { ...current.scales, [target]: scale },
                  })
                }
              />
            ))}
            {FONT_TARGETS.map((target) => (
              <OptionRow
                key={`font-${target}`}
                label={t(`type.font.${target}`)}
                options={fontOptions()}
                selected={current.fonts[target]}
                onChange={(family) =>
                  updateSettings({
                    fonts: { ...current.fonts, [target]: family },
                  })
                }
              />
            ))}
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
