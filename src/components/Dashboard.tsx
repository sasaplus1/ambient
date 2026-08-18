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
  const { showClock, showDate, showWeather, showCalendar, showDebug } =
    settings.value;
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div class="dashboard">
      <Background />

      {/*
        data-split rather than :has(), which old Android browsers may not
        support. With only one block there is nothing to spread apart.
      */}
      <div class="dashboard__widgets" data-split={showCalendar}>
        <div class="dashboard__clock-group">
          {showDate && <DateDisplay />}
          {showClock && <Clock />}
          {showWeather && <Weather />}
        </div>

        {showCalendar && <Calendar />}
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
