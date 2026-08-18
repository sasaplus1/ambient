export const TEMPERATURE_UNITS = [
  'auto',
  'celsius',
  'fahrenheit',
  'both',
] as const;
export type TemperatureUnitSetting = (typeof TEMPERATURE_UNITS)[number];

export type TemperatureUnit = 'celsius' | 'fahrenheit' | 'both';

export function isTemperatureUnitSetting(
  value: unknown,
): value is TemperatureUnitSetting {
  return (
    typeof value === 'string' &&
    (TEMPERATURE_UNITS as readonly string[]).includes(value)
  );
}

/**
 * Regions that use Fahrenheit day to day.
 *
 * Intl has no answer for this yet - the locale info proposal that would give it
 * is not implemented - so it is a list. The United States and its territories,
 * plus the handful of countries that kept the unit.
 */
const FAHRENHEIT_REGIONS = new Set([
  'US', 'AS', 'GU', 'MP', 'PR', 'VI',
  'BS', 'BZ', 'FM', 'KY', 'LR', 'MH', 'PW',
]);

/**
 * The unit the browser's own region would expect.
 *
 * maximize() fills in a region the tag left out, so a bare 'en' resolves to US
 * and reads as Fahrenheit, which is what someone with that setting expects.
 */
export function detectTemperatureUnit(): TemperatureUnit {
  for (const tag of navigator.languages ?? [navigator.language]) {
    try {
      const region = new Intl.Locale(tag).maximize().region;

      if (region) {
        return FAHRENHEIT_REGIONS.has(region) ? 'fahrenheit' : 'celsius';
      }
    } catch {
      // Malformed tag; try the next one
    }
  }

  return 'celsius';
}

export function resolveTemperatureUnit(
  setting: TemperatureUnitSetting,
): TemperatureUnit {
  return setting === 'auto' ? detectTemperatureUnit() : setting;
}

/** Readings are stored in Celsius, so only the display converts. */
export function convertTemperature(
  celsius: number,
  unit: TemperatureUnit,
): number {
  return unit === 'fahrenheit' ? celsius * 1.8 + 32 : celsius;
}

export function temperatureSymbol(unit: TemperatureUnit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}
