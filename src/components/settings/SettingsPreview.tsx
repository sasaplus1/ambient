import { useEffect, useRef } from 'preact/hooks';

import { applyThemeTo, DEFAULT_THEME, findTheme } from '../../lib/theme';
import { t } from '../../state/locale';
import { settings, updateSettings } from '../../state/settings';
import { Background } from '../Background';
import { Calendar } from '../Calendar';
import { Forecast } from '../weather/Forecast';
import { Clock } from '../clock/Clock';
import { DateDisplay } from '../DateDisplay';
import { previewTheme } from '../../state/theme';
import { ThemeBackdrop } from '../ThemeBackdrop';
import { Weather } from '../weather/Weather';

/**
 * A live miniature of the dashboard, pinned above the settings.
 *
 * The stage is the size of the viewport and scaled down, rather than the
 * widgets being rebuilt at some smaller size. Everything is sized in vmin, so
 * only a real-sized stage shows the proportions the screen will actually have -
 * and it is the real components, so what is shown cannot drift from what ships.
 *
 * It can be folded away, because on a 5-inch screen it would otherwise take a
 * third of the room the settings need. The choice is remembered.
 */
export function SettingsPreview() {
  const {
    showClock,
    showDate,
    showWeather,
    showCalendar,
    clockType,
    previewOpen,
  } = settings.value;

  const themeId = previewTheme.value;
  const stageRef = useRef<HTMLDivElement>(null);

  // The colours live on the root, so previewing a different theme means writing
  // that theme's properties onto the stage to shadow them.
  useEffect(() => {
    const stage = stageRef.current;
    const theme = findTheme(themeId) ?? findTheme(DEFAULT_THEME);

    if (stage && theme) {
      applyThemeTo(theme, stage);
    }
  }, [themeId, previewOpen]);

  const date = showDate && <DateDisplay />;
  const weather = showWeather && <Weather />;
  // Gates itself on the setting, and stands without today's reading beside it
  const forecast = <Forecast />;
  const calendar = showCalendar && <Calendar />;
  const clock = showClock && <Clock themeId={themeId} />;

  // Mirrors Dashboard: an analog face stands alone, a digital one joins the column
  const stack =
    clockType === 'analog' ? (
      <div class="dashboard__stack">
        {date}
        {calendar}
        {weather}
        {forecast}
      </div>
    ) : (
      <div class="dashboard__stack">
        {date}
        {clock}
        {weather}
        {forecast}
      </div>
    );

  return (
    <div class="settings-preview">
      {previewOpen && (
        <div class="settings-preview__frame" aria-hidden="true">
          <div class="settings-preview__stage" ref={stageRef}>
            <div class="dashboard">
              <ThemeBackdrop themeId={themeId} />
              {/*
                The scaled stage is the containing block for both backdrops, so
                the picture lands inside the miniature the same way the theme
                does - and choosing a fit or a dim can be judged where the
                choice is being made.
              */}
              <Background />
              <div class="dashboard__widgets">
                {clockType === 'analog' ? (
                  <>
                    {clock}
                    {stack}
                  </>
                ) : (
                  <>
                    {stack}
                    {calendar}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        class="settings-preview__toggle"
        aria-expanded={previewOpen}
        onClick={() => updateSettings({ previewOpen: !previewOpen })}
      >
        {previewOpen ? t('settings.previewHide') : t('settings.previewShow')}
      </button>
    </div>
  );
}
