import { useState } from 'preact/hooks';

import { settings } from '../state/settings';

import { Clock } from './clock/Clock';
import { DateDisplay } from './DateDisplay';
import { SettingsButton } from './settings/SettingsButton';
import { SettingsOverlay } from './settings/SettingsOverlay';

export function Dashboard() {
  const { showClock, showDate } = settings.value;
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div class="dashboard">
      <div class="dashboard__widgets">
        {showClock && <Clock />}
        {showDate && <DateDisplay />}
      </div>

      {settingsOpen ? (
        <SettingsOverlay onClose={() => setSettingsOpen(false)} />
      ) : (
        <SettingsButton onClick={() => setSettingsOpen(true)} />
      )}
    </div>
  );
}
