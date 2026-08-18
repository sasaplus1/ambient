import { useRef, useState } from 'preact/hooks';

import { backgroundUrl, removeBackground, setBackground } from '../../state/background';
import { t } from '../../state/locale';
import { settings, updateSettings } from '../../state/settings';
import { BACKGROUND_FITS, type BackgroundFit } from '../../types';

import { OptionRow, type Option } from './OptionRow';

function fitOptions(): readonly Option<BackgroundFit>[] {
  return BACKGROUND_FITS.map((value) => ({
    value,
    label: t(`backgroundFit.${value}`),
  }));
}

/**
 * Choosing a picture to sit behind the dashboard.
 *
 * The file never leaves the device: static hosting has nowhere to upload to,
 * so the blob goes straight into IndexedDB.
 */
export function BackgroundRow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [failed, setFailed] = useState(false);

  const hasImage = backgroundUrl.value !== null;
  const { backgroundFit, backgroundDim } = settings.value;

  const choose = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setFailed(!(await setBackground(file)));
  };

  return (
    <>
      <div class="setting-actions">
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

      {failed && <p class="setting-message">{t('background.failed')}</p>}

      {hasImage && (
        <>
          <OptionRow
            label={t('background.fit')}
            options={fitOptions()}
            selected={backgroundFit}
            onChange={(fit) => updateSettings({ backgroundFit: fit })}
          />

          <div class="setting-slider">
            <label class="setting-slider__field">
              <span class="setting-slider__label">
                {`${t('background.dim')} ${backgroundDim}%`}
              </span>
              <input
                class="setting-slider__input"
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
        </>
      )}
    </>
  );
}
