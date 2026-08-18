import { useEffect, useState } from 'preact/hooks';

import {
  DATE_FORMATS,
  formatDate,
  type DateFormat,
} from '../../lib/dateFormat';
import { LOCALE_SETTINGS, type LocaleSetting } from '../../lib/i18n';
import { THEMES, themeLabel, type Theme } from '../../lib/theme';
import { locale, t } from '../../state/locale';
import { resetSettings, settings, updateSettings } from '../../state/settings';
import type { AnalogNumerals, ClockType, SecondHand } from '../../types';

import { OptionRow, type Option } from './OptionRow';
import { ToggleRow } from './ToggleRow';

import './settings.css';

type Page = 'main' | 'clock';

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

function themeOptions(): readonly Option<Theme>[] {
  return THEMES.map((theme) => ({ value: theme, label: themeLabel(theme) }));
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

export function SettingsOverlay({ onClose }: SettingsOverlayProps) {
  const [page, setPage] = useState<Page>('main');
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
        {page === 'main' ? (
          <button
            type="button"
            class="settings-overlay__action"
            onClick={() => resetSettings()}
          >
            {t('settings.reset')}
          </button>
        ) : (
          <button
            type="button"
            class="settings-overlay__action"
            onClick={() => setPage('main')}
          >
            {`← ${t('settings.back')}`}
          </button>
        )}

        <h1 class="settings-overlay__title">
          {page === 'main' ? t('settings.title') : t('clock.details')}
        </h1>

        <button type="button" class="settings-overlay__action" onClick={onClose}>
          {t('settings.close')}
        </button>
      </header>

      <div class="settings-overlay__body">
        {page === 'main' ? (
          <>
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
                <button
                  type="button"
                  class="setting-row"
                  onClick={() => setPage('clock')}
                >
                  <span class="setting-row__label">
                    {t('clock.detailsRow')}
                  </span>
                  <span class="setting-row__value" aria-hidden="true">
                    ›
                  </span>
                </button>
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
          </>
        ) : (
          <>
            <section class="settings-section">
              <h2 class="settings-section__title">
                {t('section.digitalClock')}
              </h2>
              <div class="settings-section__items">
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
              </div>
            </section>

            <section class="settings-section">
              <h2 class="settings-section__title">
                {t('section.analogClock')}
              </h2>
              <div class="settings-section__items">
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
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
