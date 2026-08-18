import { settings } from '../../state/settings';
import { activeTheme } from '../../state/theme';

import { AnalogClock } from './AnalogClock';
import { DigitalClock } from './DigitalClock';

export function Clock() {
  const {
    clockType,
    hour12,
    showSeconds,
    secondHand,
    analogNumerals,
  } = settings.value;

  if (clockType === 'analog') {
    return (
      <AnalogClock
        secondHand={secondHand}
        numerals={analogNumerals}
        theme={activeTheme.value}
      />
    );
  }

  return <DigitalClock hour12={hour12} showSeconds={showSeconds} />;
}
