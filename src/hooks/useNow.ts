import { useEffect, useState } from 'preact/hooks';

export type TickUnit = 'second' | 'minute' | 'day';

const UNIT_MS: Record<TickUnit, number> = {
  second: 1_000,
  minute: 60_000,
  day: 86_400_000,
};

/**
 * Milliseconds remaining until the next boundary.
 * 'day' is computed separately because it must account for the timezone offset.
 */
function msUntilNextTick(now: Date, unit: TickUnit): number {
  if (unit === 'day') {
    const nextMidnight = new Date(now);

    nextMidnight.setHours(24, 0, 0, 0);

    return nextMidnight.getTime() - now.getTime();
  }

  const interval = UNIT_MS[unit];

  return interval - (now.getTime() % interval);
}

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

      timer = window.setTimeout(
        schedule,
        // A floor stops a rounding error just short of the boundary spinning at 0ms
        Math.max(msUntilNextTick(current, unit), 16),
      );
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
