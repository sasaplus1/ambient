import { useNow } from '../hooks/useNow';

import './DateDisplay.css';

// Follows the device locale.
const dateFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

export function DateDisplay() {
  // The date only needs to change at midnight
  const now = useNow('day');

  return (
    <time class="date-display" dateTime={toIsoDate(now)}>
      {dateFormat.format(now)}
    </time>
  );
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}
