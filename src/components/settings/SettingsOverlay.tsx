import { useEffect, useState } from 'preact/hooks';

import { THEMES, themeLabel, type Theme } from '../../lib/theme';
import { resetSettings, settings, updateSettings } from '../../state/settings';
import type { AnalogNumerals, ClockType, SecondHand } from '../../types';

import { OptionRow, type Option } from './OptionRow';
import { ToggleRow } from './ToggleRow';

import './settings.css';

type Page = 'main' | 'clock';

const CLOCK_TYPE_OPTIONS: readonly Option<ClockType>[] = [
  { value: 'digital', label: 'デジタル' },
  { value: 'analog', label: 'アナログ' },
];

const SECOND_HAND_OPTIONS: readonly Option<SecondHand>[] = [
  { value: 'none', label: 'なし' },
  { value: 'step', label: 'ステップ' },
  { value: 'sweep', label: 'スイープ' },
];

const NUMERALS_OPTIONS: readonly Option<AnalogNumerals>[] = [
  { value: 'none', label: 'なし' },
  { value: 'ticks', label: '目盛り' },
  { value: 'arabic', label: '数字' },
  { value: 'roman', label: 'ローマ数字' },
];

const THEME_OPTIONS: readonly Option<Theme>[] = THEMES.map((theme) => ({
  value: theme,
  label: themeLabel(theme),
}));

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
    <div class="settings-overlay" role="dialog" aria-modal="true" aria-label="設定">
      <header class="settings-overlay__header">
        {page === 'main' ? (
          <button
            type="button"
            class="settings-overlay__action"
            onClick={() => resetSettings()}
          >
            初期化
          </button>
        ) : (
          <button
            type="button"
            class="settings-overlay__action"
            onClick={() => setPage('main')}
          >
            ← 戻る
          </button>
        )}

        <h1 class="settings-overlay__title">
          {page === 'main' ? '設定' : '時計の詳細'}
        </h1>

        <button type="button" class="settings-overlay__action" onClick={onClose}>
          閉じる
        </button>
      </header>

      <div class="settings-overlay__body">
        {page === 'main' ? (
          <>
            <section class="settings-section">
              <h2 class="settings-section__title">表示</h2>
              <div class="settings-section__items">
                <ToggleRow
                  label="時計"
                  checked={current.showClock}
                  onChange={(showClock) => updateSettings({ showClock })}
                />
                <ToggleRow
                  label="日付"
                  checked={current.showDate}
                  onChange={(showDate) => updateSettings({ showDate })}
                />
              </div>
            </section>

            <section class="settings-section">
              <h2 class="settings-section__title">時計</h2>
              <div class="settings-section__items">
                <OptionRow
                  label="種類"
                  options={CLOCK_TYPE_OPTIONS}
                  selected={current.clockType}
                  onChange={(clockType) => updateSettings({ clockType })}
                />
                <button
                  type="button"
                  class="setting-row"
                  onClick={() => setPage('clock')}
                >
                  <span class="setting-row__label">詳細設定</span>
                  <span class="setting-row__value" aria-hidden="true">
                    ›
                  </span>
                </button>
              </div>
            </section>

            <section class="settings-section">
              <h2 class="settings-section__title">テーマ</h2>
              <div class="settings-section__items">
                <OptionRow
                  label="配色"
                  options={THEME_OPTIONS}
                  selected={current.theme}
                  onChange={(theme) => updateSettings({ theme })}
                />
              </div>
            </section>
          </>
        ) : (
          <>
            <section class="settings-section">
              <h2 class="settings-section__title">デジタル時計</h2>
              <div class="settings-section__items">
                <ToggleRow
                  label="12 時間表記"
                  checked={current.hour12}
                  onChange={(hour12) => updateSettings({ hour12 })}
                />
                <ToggleRow
                  label="秒を表示"
                  checked={current.showSeconds}
                  onChange={(showSeconds) => updateSettings({ showSeconds })}
                />
              </div>
            </section>

            <section class="settings-section">
              <h2 class="settings-section__title">アナログ時計</h2>
              <div class="settings-section__items">
                <OptionRow
                  label="秒針"
                  options={SECOND_HAND_OPTIONS}
                  selected={current.secondHand}
                  onChange={(secondHand) => updateSettings({ secondHand })}
                />
                <OptionRow
                  label="文字盤"
                  options={NUMERALS_OPTIONS}
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
