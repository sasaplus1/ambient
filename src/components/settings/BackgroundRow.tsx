import { useRef, useState } from 'preact/hooks';

import { GRADIENTS } from '../../lib/gradients';
import { backgroundUrl, removeBackground, setBackground } from '../../state/background';
import { t } from '../../state/locale';
import { settings, updateSettings } from '../../state/settings';
import {
  BACKGROUND_FITS,
  BACKGROUND_KINDS,
  type BackgroundFit,
  type BackgroundKind,
} from '../../types';

import { OptionRow, type Option } from './OptionRow';

function kindOptions(): readonly Option<BackgroundKind>[] {
  return BACKGROUND_KINDS.map((value) => ({
    value,
    label: t(`backgroundKind.${value}`),
  }));
}

function fitOptions(): readonly Option<BackgroundFit>[] {
  return BACKGROUND_FITS.map((value) => ({
    value,
    label: t(`backgroundFit.${value}`),
  }));
}

/**
 * Choosing what sits behind the dashboard.
 *
 * An uploaded file never leaves the device: static hosting has nowhere to
 * upload to, so the blob goes straight into IndexedDB.
 */
export function BackgroundRow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [failed, setFailed] = useState(false);

  const hasImage = backgroundUrl.value !== null;
  const { backgroundKind, backgroundGradient, backgroundFit, backgroundDim } =
    settings.value;

  const choose = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setFailed(!(await setBackground(file)));
  };

  return (
    <>
      <OptionRow
        label={t('background.kind')}
        options={kindOptions()}
        selected={backgroundKind}
        onChange={(kind) => updateSettings({ backgroundKind: kind })}
      />

      {backgroundKind === 'gradient' && (
        <div class="setting-options" role="group" aria-label={t('background.gradient')}>
          <span class="setting-options__label">{t('background.gradient')}</span>
          {/* Swatches rather than names: the point is what it looks like */}
          <div class="gradient-grid">
            {GRADIENTS.map((gradient) => (
              <button
                key={gradient.id}
                type="button"
                class="gradient-swatch"
                style={{ backgroundImage: gradient.css }}
                aria-label={gradient.label}
                aria-pressed={gradient.id === backgroundGradient}
                onClick={() =>
                  updateSettings({ backgroundGradient: gradient.id })
                }
              />
            ))}
          </div>
        </div>
      )}

      {backgroundKind === 'image' && (
        <div class="location">
          <div class="location__actions">
            <button
              type="button"
              class="setting-options__choice"
              onClick={() => inputRef.current?.click()}
            >
              {hasImage ? t('background.replace') : t('background.choose')}
            </button>
            {hasImage && (
              <button
                type="button"
                class="setting-options__choice"
                onClick={() => void removeBackground()}
              >
                {t('background.remove')}
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                void choose(event.currentTarget.files?.[0]);
                // Allow picking the same file again after removing it
                event.currentTarget.value = '';
              }}
            />
          </div>

          {failed && <p class="location__message">{t('background.failed')}</p>}
        </div>
      )}

      {backgroundKind === 'image' && hasImage && (
        <OptionRow
          label={t('background.fit')}
          options={fitOptions()}
          selected={backgroundFit}
          onChange={(fit) => updateSettings({ backgroundFit: fit })}
        />
      )}

      {backgroundKind !== 'none' && (
        <div class="location">
          <label class="location__field">
            <span class="location__field-label">
              {`${t('background.dim')} ${backgroundDim}%`}
            </span>
            <input
              class="background__slider"
              type="range"
              min={0}
              max={90}
              step={5}
              value={backgroundDim}
              onInput={(event) =>
                updateSettings({
                  backgroundDim: Number(event.currentTarget.value),
                })
              }
            />
          </label>
        </div>
      )}
    </>
  );
}
