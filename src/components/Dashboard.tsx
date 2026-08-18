import { useState } from 'preact/hooks';

import { settings } from '../state/settings';

import { AmbientModeButton } from './AmbientModeButton';
import { Background } from './Background';
import { Calendar } from './Calendar';
import { Clock } from './clock/Clock';
import { DateDisplay } from './DateDisplay';
import { DebugOverlay } from './debug/DebugOverlay';
import { SettingsButton } from './settings/SettingsButton';
import { SettingsOverlay } from './settings/SettingsOverlay';
import { Weather } from './weather/Weather';

export function Dashboard() {
  const { showClock, showDate, showWeather, showCalendar, showDebug, clockType } =
    settings.value;
  const [settingsOpen, setSettingsOpen] = useState(false);

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

      {showDebug && <DebugOverlay />}

      {settingsOpen ? (
        <SettingsOverlay onClose={() => setSettingsOpen(false)} />
      ) : (
        <>
          <AmbientModeButton />
          <SettingsButton onClick={() => setSettingsOpen(true)} />
        </>
      )}
    </div>
  );
}
