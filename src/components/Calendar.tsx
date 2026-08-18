import { useNow } from '../hooks/useNow';
import { monthGrid, weekdayLabels } from '../lib/calendar';
import { kanjiNumber } from '../lib/kanjiNumber';
import { fontClass, scaleStyle } from '../state/typography';
import { locale } from '../state/locale';
import { settings } from '../state/settings';

import './Calendar.css';

export function Calendar() {
  // Only the day matters here, so this recomputes at midnight rather than
  // every second like the clock does.
  const today = useNow('day');

  const { weekStart, adjacentDays, dayNumerals } = settings.value;
  const tag = locale.value;

  const cells = monthGrid(today, weekStart);

  return (
    <div
      class={`calendar ${fontClass('calendar')}`}
      style={scaleStyle('calendar')}
      data-numerals={dayNumerals}
    >
      {/*
        No month heading: the grid is only ever the current month, and the date
        widget already says which one it is.
      */}
      <div class="calendar__grid" role="grid">
        {weekdayLabels(tag, weekStart).map((label, index) => (
          <div key={`weekday-${index}`} class="calendar__weekday" role="columnheader">
            {label}
          </div>
        ))}

        {cells.map((cell) => (
          <div
            key={cell.date.getTime()}
            class="calendar__day"
            role="gridcell"
            data-in-month={cell.inMonth}
            data-today={cell.isToday}
            data-hidden={!cell.inMonth && adjacentDays === 'hidden'}
            aria-current={cell.isToday ? 'date' : undefined}
          >
            {dayNumerals === 'kanji' ? kanjiNumber(cell.day) : cell.day}
          </div>
        ))}
      </div>
    </div>
  );
}
