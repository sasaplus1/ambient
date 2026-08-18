import { settings } from '../../state/settings';

import { AnalogClock } from './AnalogClock';
import { DigitalClock } from './DigitalClock';

export function Clock() {
  const {
    clockType,
    hour12,
    showSeconds,
    secondHand,
    analogNumerals,
    theme,
  } = settings.value;

  if (clockType === 'analog') {
    return (
      <AnalogClock
        secondHand={secondHand}
        numerals={analogNumerals}
        theme={theme}
      />
    );
  }

  return <DigitalClock hour12={hour12} showSeconds={showSeconds} />;
}
