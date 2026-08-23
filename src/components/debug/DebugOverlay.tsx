import { useEffect, useState } from 'preact/hooks';

import { atLeast, errorCount, formatTime, logs } from '../../lib/logger';
import { formatShift } from '../../lib/pixelShift';
import {
  type ClockRates,
  formatClockRates,
  takeClockRates,
} from '../../state/clockMetrics';
import { formatUptime, online, startedAt } from '../../state/diagnostics';
import { shift } from '../../state/pixelShift';
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
  const [rates, setRates] = useState<ClockRates | undefined>(undefined);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const at = Date.now();

      setNow(at);
      // Read on the timer, not in render: asking closes the window it measured
      setRates(takeClockRates(at));
    }, STATUS_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const minimum = settings.value.debugLevel;
  const reading = weather.value;

  const parts = [
    `UP ${formatUptime(now, startedAt.value)}`,
    `NET ${online.value ? 'OK' : 'OFF'}`,
    reading
      ? `WX ${ageInMinutes(reading.fetchedAt, now)}m`
      : `WX ${weatherStatus.value}`,
    `ERR ${errorCount.value}`,
  ];

  // Only while it is moving. Left in, it would read +0,+0 for good
  if (settings.value.pixelShift) {
    parts.push(`SHIFT ${formatShift(shift.value)}`);
  }

  parts.push(__COMMIT_SHA__);

  const status = parts.join(' | ');

  const visible = logs.value
    .filter((entry) => atLeast(entry.level, minimum))
    .slice(-VISIBLE_LINES);

  return (
    <div class="debug-overlay">
      <div class="debug-overlay__status">{status}</div>
      {/* Its own line: four readings on the end of the first one would wrap */}
      {rates && (
        <div class="debug-overlay__status">{formatClockRates(rates)}</div>
      )}
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
