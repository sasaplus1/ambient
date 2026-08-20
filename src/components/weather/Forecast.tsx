import {
  convertTemperature,
  detectTemperatureUnit,
  resolveTemperatureUnit,
} from '../../lib/temperature';
import {
  conditionFor,
  iconFor,
  localDate,
  type DailyForecast,
} from '../../lib/weather';
import { displayLocale, displayText } from '../../state/locale';
import { settings } from '../../state/settings';
import { fontClass, scaleStyle } from '../../state/typography';
import { weather } from '../../state/weather';

import { WeatherIcon } from './WeatherIcon';

import './Forecast.css';

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

  /*
   * One unit per column, even when the setting asks for both: five columns of
   * two readings apiece is a table, and this is meant to be taken in at a
   * glance. Which one falls to the region rather than to celsius, which was
   * only ever the one that came first in the type.
   */
  const only: 'celsius' | 'fahrenheit' =
    unit === 'both'
      ? detectTemperatureUnit() === 'fahrenheit'
        ? 'fahrenheit'
        : 'celsius'
      : unit;

  const round = (value: number) =>
    new Intl.NumberFormat(displayLocale.value, { maximumFractionDigits: 0 }).format(
      convertTemperature(value, only),
    );

  // The first column is today, which is worth saying rather than dating
  const label =
    index === 0
      ? displayText('forecast.today')
      : when
        ? new Intl.DateTimeFormat(displayLocale.value, { weekday: 'short' }).format(
            when,
          )
        : '';

  return (
    <div class="forecast__day" title={displayText(`condition.${conditionFor(day.weatherCode)}`)}>
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
