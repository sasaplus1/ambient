import { useEffect, useState } from 'preact/hooks';

import { t } from '../../state/locale';
import { previewHour } from '../../state/theme';

/**
 * How long each hour lasts while the day plays.
 *
 * Longer than the theme fade, so the shortest band - evening, three hours -
 * still finishes crossing before the next boundary starts another.
 */
const HOUR_STEP_MS = 500;

/**
 * Moves the miniature through the day.
 *
 * The slider is for looking at one hour; playing runs the whole cycle so the
 * changes themselves can be watched. Only five of the twenty-four steps change
 * anything, since a theme covers a whole band - which is also why the fade is
 * left on: dragging within a band moves nothing to lag behind.
 */
export function SchedulePreviewRow() {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) {
      return;
    }

    const timer = window.setInterval(() => {
      previewHour.value = ((previewHour.value ?? new Date().getHours()) + 1) % 24;
    }, HOUR_STEP_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [playing]);

  const hour = previewHour.value;

  return (
    <div class="setting-slider">
      <label class="setting-slider__field">
        <span class="setting-slider__label">
          {`${t('theme.previewHour')} ${
            hour === null ? t('theme.previewNow') : `${hour}:00`
          }`}
        </span>
        <input
          class="setting-slider__input"
          type="range"
          min={0}
          max={23}
          step={1}
          value={hour ?? new Date().getHours()}
          onInput={(event) => {
            setPlaying(false);
            previewHour.value = Number(event.currentTarget.value);
          }}
        />
      </label>

      <div class="setting-actions setting-actions--inline">
        <button
          type="button"
          class="setting-options__choice"
          aria-pressed={playing}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? t('theme.previewStop') : t('theme.previewPlay')}
        </button>
      </div>
    </div>
  );
}
