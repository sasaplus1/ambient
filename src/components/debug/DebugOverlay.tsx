import { useEffect, useState } from 'preact/hooks';

import { atLeast, errorCount, formatTime, logs } from '../../lib/logger';
import { formatUptime, online, startedAt } from '../../state/diagnostics';
import { settings } from '../../state/settings';
import { weather, weatherStatus } from '../../state/weather';

import './DebugOverlay.css';

/** How many lines fit without the overlay swallowing the dashboard. */
const VISIBLE_LINES = 12;

/**
 * How often the status line recomputes. Deliberately coarse: uptime and
 * weather age move slowly, and a per-second re-render here would be exactly
 * the kind of overhead this overlay exists to catch.
 */
const STATUS_INTERVAL_MS = 10_000;

function ageInMinutes(fetchedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - fetchedAt) / 60_000));
}

export function DebugOverlay() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, STATUS_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const minimum = settings.value.debugLevel;
  const reading = weather.value;

  const status = [
    `UP ${formatUptime(now, startedAt.value)}`,
    `NET ${online.value ? 'OK' : 'OFF'}`,
    reading
      ? `WX ${ageInMinutes(reading.fetchedAt, now)}m`
      : `WX ${weatherStatus.value}`,
    `ERR ${errorCount.value}`,
    __COMMIT_SHA__,
  ].join(' | ');

  const visible = logs.value
    .filter((entry) => atLeast(entry.level, minimum))
    .slice(-VISIBLE_LINES);

  return (
    <div class="debug-overlay">
      <div class="debug-overlay__status">{status}</div>
      <div class="debug-overlay__log">
        {visible.map((entry) => (
          <div
            key={entry.id}
            class="debug-overlay__entry"
            data-level={entry.level}
          >
            {`${formatTime(entry.timestamp)} ${entry.level.toUpperCase().padEnd(5)} ${entry.category.padEnd(8)} ${entry.message}`}
          </div>
        ))}
      </div>
    </div>
  );
}
