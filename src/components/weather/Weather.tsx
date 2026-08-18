import { conditionFor, iconFor } from '../../lib/weather';
import { fontClass } from '../../state/fonts';
import { locale, t } from '../../state/locale';
import { location, weather, weatherStatus } from '../../state/weather';

import { WeatherIcon } from './WeatherIcon';

import './Weather.css';

/** Older than this and the reading is shown faded rather than as current. */
const STALE_AFTER_MS = 90 * 60 * 1000;

export function Weather() {
  const reading = weather.value;
  const status = weatherStatus.value;

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
  const condition = t(`condition.${conditionFor(reading.weatherCode)}`);

  return (
    <div
      class={`weather ${fontClass('weather')}`}
      data-stale={stale}
      title={condition}
    >
      <WeatherIcon name={iconFor(reading.weatherCode, reading.isDay)} />
      <span class="weather__temperature">
        {new Intl.NumberFormat(locale.value, {
          maximumFractionDigits: 0,
        }).format(reading.temperature)}
        °C
      </span>
    </div>
  );
}
