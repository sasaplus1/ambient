import { useState } from 'preact/hooks';

import { requestPosition, searchPlaces, type Place } from '../../lib/weather';
import { locale, t } from '../../state/locale';
import { location, setLocation } from '../../state/weather';

type Phase = 'idle' | 'locating' | 'searching';

/**
 * Picking a place for the weather.
 *
 * Geolocation is offered first, but it is not assumed to work: devices without
 * GPS, a denied permission, or a LineageOS build with no location provider all
 * end up in the same place, so searching by name is a peer of it rather than a
 * hidden fallback.
 */
export function LocationRow() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const current = location.value;

  const useCurrentPosition = async () => {
    setPhase('locating');
    setMessage(null);
    setResults(null);

    try {
      const coordinates = await requestPosition();

      setLocation({ ...coordinates, label: '' });
      setQuery('');
    } catch {
      setMessage(t('weather.locateFailed'));
    } finally {
      setPhase('idle');
    }
  };

  const search = async () => {
    setPhase('searching');
    setMessage(null);

    try {
      const found = await searchPlaces(query, locale.value);

      setResults(found);

      if (found.length === 0) {
        setMessage(t('weather.noResults'));
      }
    } catch {
      setMessage(t('weather.noResults'));
    } finally {
      setPhase('idle');
    }
  };

  const choose = (place: Place) => {
    setLocation({
      latitude: place.latitude,
      longitude: place.longitude,
      label: place.detail ? `${place.name}, ${place.detail}` : place.name,
    });
    setResults(null);
    setQuery('');
  };

  return (
    <div class="location">
      <div class="location__current">
        <span class="setting-row__label">{t('weather.location')}</span>
        <span class="setting-row__value">
          {current
            ? current.label ||
              `${current.latitude.toFixed(2)}, ${current.longitude.toFixed(2)}`
            : t('weather.noLocation')}
        </span>
      </div>

      <div class="setting-actions">
        <button
          type="button"
          class="setting-options__choice"
          disabled={phase === 'locating'}
          onClick={() => void useCurrentPosition()}
        >
          {phase === 'locating' ? t('weather.locating') : t('weather.useCurrent')}
        </button>
        {current && (
          <button
            type="button"
            class="setting-options__choice"
            onClick={() => setLocation(null)}
          >
            {t('weather.clear')}
          </button>
        )}
      </div>

      <form
        class="location__search"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <label class="location__field">
          <span class="location__field-label">{t('weather.searchLabel')}</span>
          <input
            class="location__input"
            type="search"
            value={query}
            placeholder={t('weather.searchPlaceholder')}
            onInput={(event) => setQuery(event.currentTarget.value)}
          />
        </label>
        <button
          type="submit"
          class="setting-options__choice"
          disabled={phase === 'searching' || query.trim() === ''}
        >
          {t('weather.search')}
        </button>
      </form>

      {message && <p class="setting-message">{message}</p>}

      {results && results.length > 0 && (
        <ul class="location__results">
          {results.map((place) => (
            <li key={`${place.latitude},${place.longitude}`}>
              <button
                type="button"
                class="setting-row location__result"
                onClick={() => choose(place)}
              >
                <span class="setting-row__label">{place.name}</span>
                <span class="setting-row__value">{place.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
