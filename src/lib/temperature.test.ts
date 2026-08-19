import { describe, expect, it } from 'vitest';

import {
  convertTemperature,
  isTemperatureUnitSetting,
  resolveTemperatureUnit,
  temperatureSymbol,
} from './temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [37, 98.6],
  ])('reads %i celsius as %d fahrenheit', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBeCloseTo(fahrenheit, 5);
  });

  it('leaves celsius alone', () => {
    expect(convertTemperature(21.5, 'celsius')).toBe(21.5);
  });
});

describe('temperatureSymbol', () => {
  it('marks which unit is being read', () => {
    expect(temperatureSymbol('celsius')).not.toBe(
      temperatureSymbol('fahrenheit'),
    );
    expect(temperatureSymbol('celsius')).toContain('C');
    expect(temperatureSymbol('fahrenheit')).toContain('F');
  });
});

describe('resolveTemperatureUnit', () => {
  it('passes a chosen unit through untouched', () => {
    expect(resolveTemperatureUnit('celsius')).toBe('celsius');
    expect(resolveTemperatureUnit('fahrenheit')).toBe('fahrenheit');
    expect(resolveTemperatureUnit('both')).toBe('both');
  });

  /*
   * 'auto' asks the browser's region, which is not ours to fix in a test. What
   * can be promised is that it settles on a unit rather than on 'auto'.
   */
  it('turns auto into an actual unit', () => {
    expect(['celsius', 'fahrenheit', 'both']).toContain(
      resolveTemperatureUnit('auto'),
    );
  });
});

describe('isTemperatureUnitSetting', () => {
  it.each([
    ['auto', true],
    ['celsius', true],
    ['fahrenheit', true],
    ['both', true],
    ['kelvin', false],
    ['', false],
    [null, false],
    [0, false],
  ])('%o is %s', (value, expected) => {
    expect(isTemperatureUnitSetting(value)).toBe(expected);
  });
});
