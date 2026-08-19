import { useNow } from '../hooks/useNow';
import { monthGrid, weekdayLabels } from '../lib/calendar';
import { fontClass, scaleStyle } from '../state/typography';
import { locale } from '../state/locale';
import { settings } from '../state/settings';

import './Calendar.css';

export function Calendar() {
  // Only the day matters here, so this recomputes at midnight rather than
  // every second like the clock does.
  const today = useNow('day');

  const { weekStart, adjacentDays } = settings.value;
  const tag = locale.value;

  const cells = monthGrid(today, weekStart);

  return (
    <div
      class={`calendar ${fontClass('calendar')}`}
      style={scaleStyle('calendar')}
    >
      {/*
        No month heading: the grid is only ever the current month, and the date
        widget already says which one it is.
      */}
      {/*
        No grid roles. They were here, and they were wrong: an ARIA grid is made
        of rows, and this is a CSS grid of forty-two cells with no rows in it at
        all. A malformed structure is worse to land in than none, and there is
        nothing to land on either way - nothing here is interactive. What is
        left is the reading order, which is the one thing that was ever true,
        and the marker on today.
      */}
      <div class="calendar__grid">
        {weekdayLabels(tag, weekStart).map((label, index) => (
          <div key={`weekday-${index}`} class="calendar__weekday">
            {label}
          </div>
        ))}

        {cells.map((cell) => (
          <div
            key={cell.date.getTime()}
            class="calendar__day"
            data-in-month={cell.inMonth}
            data-today={cell.isToday}
            data-hidden={!cell.inMonth && adjacentDays === 'hidden'}
            aria-current={cell.isToday ? 'date' : undefined}
          >
            {cell.day}
          </div>
        ))}
      </div>
    </div>
  );
}
