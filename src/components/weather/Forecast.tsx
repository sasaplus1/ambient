import {
  convertTemperature,
  resolveTemperatureUnit,
} from '../../lib/temperature';
import { conditionFor, iconFor, type DailyForecast } from '../../lib/weather';
import { locale, t } from '../../state/locale';
import { settings } from '../../state/settings';
import { fontClass, scaleStyle } from '../../state/typography';
import { weather } from '../../state/weather';

import { WeatherIcon } from './WeatherIcon';

import './Forecast.css';

/**
 * Built from the parts rather than from Date.parse.
 *
 * `2026-08-20` parsed as a date string is midnight UTC, which formatted east or
 * west of the meridian is liable to come out as the day before or the day
 * after. The API already gave us the local calendar date, so the only honest
 * reading of it is a local one.
 */
function localDate(date: string): Date | null {
  const parts = date.split('-').map(Number);
  const [year, month, day] = parts;

  if (parts.length !== 3 || !year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

/**
 * A day ahead, in a column: what day it is, what it will be like, how warm.
 *
 * Only one temperature unit here even when the setting asks for both. Five
 * columns of two readings apiece is a table, and this is meant to be taken in
 * at a glance from across a room.
 */
function Day({ day, index }: { day: DailyForecast; index: number }) {
  const when = localDate(day.date);
  const unit = resolveTemperatureUnit(settings.value.temperatureUnit);
  const only = unit === 'both' ? 'celsius' : unit;

  const round = (value: number) =>
    new Intl.NumberFormat(locale.value, { maximumFractionDigits: 0 }).format(
      convertTemperature(value, only),
    );

  // The first column is today, which is worth saying rather than dating
  const label =
    index === 0
      ? t('forecast.today')
      : when
        ? new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(
            when,
          )
        : '';

  return (
    <div class="forecast__day" title={t(`condition.${conditionFor(day.weatherCode)}`)}>
      <span class="forecast__weekday">{label}</span>
      {/* Daylight: nobody reads a whole day as night, whatever hour it is now */}
      <WeatherIcon name={iconFor(day.weatherCode, true)} />
      <span class="forecast__range">
        <span class="forecast__max">{round(day.max)}</span>
        <span class="forecast__min">{round(day.min)}</span>
      </span>
    </div>
  );
}

/**
 * The days ahead, under the current reading.
 *
 * Nothing at all when there is no forecast to show. The temperature above it
 * stands on its own, and a row of empty columns would only ask what is wrong.
 */
export function Forecast() {
  const reading = weather.value;

  if (!settings.value.showForecast || !reading || reading.daily.length === 0) {
    return null;
  }

  return (
    <div
      class={`forecast ${fontClass('weather')}`}
      style={scaleStyle('weather')}
    >
      {reading.daily.map((day, index) => (
        <Day key={day.date} day={day} index={index} />
      ))}
    </div>
  );
}
