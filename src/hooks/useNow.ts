import { useEffect, useState } from 'preact/hooks';

import { msUntilNextTick, type TickUnit } from '../lib/clockSchedule';

/**
 * Returns the current time, updated exactly on the boundary of the given unit.
 *
 * setInterval is avoided because drift accumulates over days of uptime and the
 * display slides away from the boundary; the wait is measured afresh each time.
 *
 * Timers are throttled in the background, so this also resynchronises the
 * moment visibilitychange brings the page back.
 */
export function useNow(unit: TickUnit): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: number | undefined;

    const schedule = () => {
      const current = new Date();

      setNow(current);

      timer = window.setTimeout(schedule, msUntilNextTick(current, unit));
    };

    const resync = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      window.clearTimeout(timer);
      schedule();
    };

    schedule();
    document.addEventListener('visibilitychange', resync);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', resync);
    };
  }, [unit]);

  return now;
}
