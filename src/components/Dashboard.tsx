import { useState } from 'preact/hooks';

import { useRecentActivity } from '../hooks/useRecentActivity';
import { settings, updateSettings } from '../state/settings';

import { AmbientModeButton } from './AmbientModeButton';
import { Background } from './Background';
import { Calendar } from './Calendar';
import { Clock } from './clock/Clock';
import { DateDisplay } from './DateDisplay';
import { DebugOverlay } from './debug/DebugOverlay';
import { SettingsButton } from './settings/SettingsButton';
import { SettingsOverlay } from './settings/SettingsOverlay';
import { ThemeBackdrop } from './ThemeBackdrop';
import { Weather } from './weather/Weather';

/** How long the controls stay up after the screen is touched. */
const CONTROLS_IDLE_MS = 4_000;

export function Dashboard() {
  const {
    showClock,
    showDate,
    showWeather,
    showCalendar,
    showDebug,
    clockType,
    controlsSeen,
  } = settings.value;
  const [settingsOpen, setSettingsOpen] = useState(false);

  /*
   * The corner controls rest almost invisible, which suits a screen that is
   * looked at rather than used - but a first visitor would never find them. So
   * they stay up until they have been used once, and after that only come back
   * when someone reaches for them.
   */
  const recentlyTouched = useRecentActivity(CONTROLS_IDLE_MS);
  const controlsVisible = !controlsSeen || recentlyTouched;

  const date = showDate && <DateDisplay />;
  const weather = showWeather && <Weather />;
  const calendar = showCalendar && <Calendar />;
  const clock = showClock && <Clock />;

  /*
   * Which block the clock belongs to depends on what kind of clock it is.
   *
   * A digital clock is type, so it reads as one column with the date above and
   * the weather below. An analog face is a drawing, and putting text either side
   * of it only competes with it - so it stands on its own and the calendar takes
   * the middle of the text column instead.
   */
  const stack =
    clockType === 'analog' ? (
      <div class="dashboard__stack">
        {date}
        {calendar}
        {weather}
      </div>
    ) : (
      <div class="dashboard__stack">
        {date}
        {clock}
        {weather}
      </div>
    );

  return (
    <div class="dashboard">
      <ThemeBackdrop />
      <Background />

      {/*
        The pixel shift moves a layer of its own rather than .dashboard itself.
        The backdrops behind it are fixed, and a transform on their ancestor
        would make them the thing that moves - taking the edge of the screen
        with them. A layer of its own also leaves the transform free for a
        future rotation to take, without the two overwriting each other.
      */}
      <div class="pixel-shift">
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

      {/* Hidden while the settings are open: it would cover the rows behind it */}
      {showDebug && !settingsOpen && <DebugOverlay />}

      {settingsOpen ? (
        <SettingsOverlay onClose={() => setSettingsOpen(false)} />
      ) : (
        <div class="dashboard__controls" data-visible={controlsVisible}>
          <AmbientModeButton />
          <SettingsButton
            onClick={() => {
              setSettingsOpen(true);
              updateSettings({ controlsSeen: true });
            }}
          />
        </div>
      )}
    </div>
  );
}
