import { settings } from '../state/settings';

import { Clock } from './clock/Clock';

export function Dashboard() {
  const { showClock } = settings.value;

  return (
    <div class="dashboard">
      <div class="dashboard__widgets">{showClock && <Clock />}</div>
    </div>
  );
}
