import { settings } from '../../state/settings';
import { activeTheme } from '../../state/theme';

import { AnalogClock } from './AnalogClock';
import { DigitalClock } from './DigitalClock';

type ClockProps = {
  /** Theme to render against, when it differs from the one in effect. */
  themeId?: string;
};

export function Clock({ themeId }: ClockProps = {}) {
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
        theme={themeId ?? activeTheme.value}
      />
    );
  }

  return <DigitalClock hour12={hour12} showSeconds={showSeconds} />;
}
