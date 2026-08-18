import { settings } from '../state/settings';

import { Clock } from './clock/Clock';
import { DateDisplay } from './DateDisplay';

export function Dashboard() {
  const { showClock, showDate } = settings.value;

  return (
    <div class="dashboard">
      <div class="dashboard__widgets">
        {showClock && <Clock />}
        {showDate && <DateDisplay />}
      </div>
    </div>
  );
}
