import type { ComponentChildren } from 'preact';

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
import { ToggleRow } from './ToggleRow';

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

type WidgetSectionProps = {
  target: FontTarget;
  title: string;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  /** Settings specific to this widget, shown between the toggle and the type. */
  children?: ComponentChildren;
};

/**
 * Everything about one widget in one place: whether it shows, how it behaves,
 * and how its type looks.
 *
 * Turning a widget off collapses the rest, since those settings then change
 * nothing on screen. The toggle itself always stays, so no setting can end up
 * out of reach - and a widget can be dialled in before being shown.
 */
export function WidgetSection({
  target,
  title,
  visible,
  onVisibleChange,
  children,
}: WidgetSectionProps) {
  const { scales, fonts } = settings.value;

  return (
    <section class="settings-section">
      <h2 class="settings-section__title">{title}</h2>
      <div class="settings-section__items">
        <ToggleRow
          label={t('widget.visible')}
          checked={visible}
          onChange={onVisibleChange}
        />

        {visible && (
          <>
            {children}

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
        )}
      </div>
    </section>
  );
}
