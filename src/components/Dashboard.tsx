import { settings } from '../state/settings';

import { DigitalClock } from './clock/DigitalClock';

export function Dashboard() {
  const { showClock, hour12, showSeconds } = settings.value;

  return (
    <div class="dashboard">
      <div class="dashboard__widgets">
        {showClock && (
          <DigitalClock hour12={hour12} showSeconds={showSeconds} />
        )}
      </div>
    </div>
  );
}
