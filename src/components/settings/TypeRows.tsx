import {
  FONT_FAMILIES,
  TEXT_SCALES,
  type FontFamily,
  type FontTarget,
  type TextScale,
} from '../../lib/typography';
import { t } from '../../state/locale';
import { settings, updateSettings } from '../../state/settings';

import { OptionRow, type Option } from './OptionRow';

function scaleOptions(): readonly Option<TextScale>[] {
  return TEXT_SCALES.map((value) => ({
    value,
    label: t(`textScale.${value}`),
  }));
}

function fontOptions(): readonly Option<FontFamily>[] {
  return FONT_FAMILIES.map((value) => ({
    value,
    label: t(`font.${value}`),
  }));
}

/**
 * How one widget's type looks.
 *
 * Its own component because two sections want it: the ones with a single
 * on-and-off switch, and weather, which has two things to switch and one
 * typeface between them.
 */
export function TypeRows({ target }: { target: FontTarget }) {
  const { scales, fonts } = settings.value;

  return (
    <>
      <OptionRow
        label={t('type.size')}
        options={scaleOptions()}
        selected={scales[target]}
        onChange={(scale) =>
          updateSettings({ scales: { ...scales, [target]: scale } })
        }
      />
      <OptionRow
        label={t('type.face')}
        options={fontOptions()}
        selected={fonts[target]}
        onChange={(family) =>
          updateSettings({ fonts: { ...fonts, [target]: family } })
        }
      />
    </>
  );
}
