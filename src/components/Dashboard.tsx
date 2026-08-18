import { useState } from 'preact/hooks';

import { settings } from '../state/settings';

import { AmbientModeButton } from './AmbientModeButton';
import { Calendar } from './Calendar';
import { Clock } from './clock/Clock';
import { DateDisplay } from './DateDisplay';
import { SettingsButton } from './settings/SettingsButton';
import { SettingsOverlay } from './settings/SettingsOverlay';
import { Weather } from './weather/Weather';

export function Dashboard() {
  const { showClock, showDate, showWeather, showCalendar } = settings.value;
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div class="dashboard">
      <div class="dashboard__widgets">
        <div class="dashboard__primary">
          {showClock && <Clock />}
          {showDate && <DateDisplay />}
          {showWeather && <Weather />}
        </div>
        {showCalendar && <Calendar />}
      </div>

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
