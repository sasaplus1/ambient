import { useNow } from '../hooks/useNow';
import { formatDate } from '../lib/dateFormat';
import { locale } from '../state/locale';
import { settings } from '../state/settings';

import './DateDisplay.css';

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function DateDisplay() {
  // The date only needs to change at midnight
  const now = useNow('day');

  return (
    <time class="date-display" dateTime={toIsoDate(now)}>
      {formatDate(locale.value, settings.value.dateFormat, now)}
    </time>
  );
}
