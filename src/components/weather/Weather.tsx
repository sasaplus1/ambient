import {
  convertTemperature,
  resolveTemperatureUnit,
  temperatureSymbol,
} from '../../lib/temperature';
import { conditionFor, iconFor } from '../../lib/weather';
import { locale, t } from '../../state/locale';
import { settings } from '../../state/settings';
import { fontClass, scaleStyle } from '../../state/typography';
import { location, weather, weatherStatus } from '../../state/weather';

import { WeatherIcon } from './WeatherIcon';

import './Weather.css';

/** Older than this and the reading is shown faded rather than as current. */
const STALE_AFTER_MS = 90 * 60 * 1000;

export function Weather() {
  const reading = weather.value;
  const status = weatherStatus.value;
  const unit = resolveTemperatureUnit(settings.value.temperatureUnit);

  if (!location.value) {
    return <p class="weather__placeholder">{t('weather.noLocation')}</p>;
  }

  if (!reading) {
    return (
      <p class="weather__placeholder">
        {status === 'error' ? t('weather.failed') : t('weather.loading')}
      </p>
    );
  }

  const stale = Date.now() - reading.fetchedAt > STALE_AFTER_MS;

  const format = (value: number) =>
    new Intl.NumberFormat(locale.value, { maximumFractionDigits: 0 }).format(
      value,
    );
  const show = (only: 'celsius' | 'fahrenheit') =>
    `${format(convertTemperature(reading.temperature, only))}${temperatureSymbol(only)}`;

  const temperatureText =
    unit === 'both'
      ? `${show('celsius')} / ${show('fahrenheit')}`
      : show(unit);
  const condition = t(`condition.${conditionFor(reading.weatherCode)}`);

  return (
    <div
      class={`weather ${fontClass('weather')}`}
      style={scaleStyle('weather')}
      data-stale={stale}
      title={condition}
    >
      <WeatherIcon name={iconFor(reading.weatherCode, reading.isDay)} />
      <span class="weather__temperature">{temperatureText}</span>
    </div>
  );
}
