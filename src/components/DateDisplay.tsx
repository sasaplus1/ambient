import { useNow } from '../hooks/useNow';
import type { Locale } from '../lib/i18n';
import { locale } from '../state/locale';

import './DateDisplay.css';

const formatters = new Map<Locale, Intl.DateTimeFormat>();

function dateFormatter(tag: Locale): Intl.DateTimeFormat {
  const existing = formatters.get(tag);

  if (existing) {
    return existing;
  }

  const created = new Intl.DateTimeFormat(tag, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  formatters.set(tag, created);

  return created;
}

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
      {dateFormatter(locale.value).format(now)}
    </time>
  );
}
