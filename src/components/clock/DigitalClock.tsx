import { useNow } from '../../hooks/useNow';

import './DigitalClock.css';

type DigitalClockProps = {
  hour12: boolean;
  showSeconds: boolean;
};

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatHours(hours: number, hour12: boolean): string {
  if (!hour12) {
    return pad2(hours);
  }

  const shortHours = hours % 12;

  return String(shortHours === 0 ? 12 : shortHours);
}

export function DigitalClock({ hour12, showSeconds }: DigitalClockProps) {
  // Without seconds, update only once a minute
  const now = useNow(showSeconds ? 'second' : 'minute');

  const hours = now.getHours();

  return (
    <div class="digital-clock">
      <span class="digital-clock__time">
        {formatHours(hours, hour12)}:{pad2(now.getMinutes())}
        {showSeconds && (
          <span class="digital-clock__seconds">:{pad2(now.getSeconds())}</span>
        )}
      </span>
      {hour12 && (
        <span class="digital-clock__period">{hours < 12 ? 'AM' : 'PM'}</span>
      )}
    </div>
  );
}
