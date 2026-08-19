import type { ComponentChildren } from 'preact';

import type { FontTarget } from '../../lib/typography';
import { t } from '../../state/locale';

import { ToggleRow } from './ToggleRow';
import { TypeRows } from './TypeRows';

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
            <TypeRows target={target} />
          </>
        )}
      </div>
    </section>
  );
}
