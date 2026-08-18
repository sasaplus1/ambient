import { scaleFactor, type FontTarget } from '../lib/typography';

import { settings } from './settings';

/**
 * Class name carrying the face chosen for a widget.
 *
 * Reading settings here subscribes the calling component, so a change to one
 * widget's type repaints only that widget.
 */
export function fontClass(target: FontTarget): string {
  return `font-${settings.value.fonts[target]}`;
}

/** The family chosen for a widget, as the setting's own value. */
export function fontFamilyOf(target: FontTarget): string {
  return settings.value.fonts[target];
}

/**
 * Inline custom property the widget's own sizes multiply by.
 *
 * This is per-widget and stacks with the master --text-scale on the root: the
 * master fits the dashboard to the screen, this balances the widgets against
 * each other. Wanting a large calendar next to a smaller clock needs both.
 */
export function scaleStyle(target: FontTarget): Record<string, string> {
  return { '--widget-scale': String(scaleFactor(settings.value.scales[target])) };
}
