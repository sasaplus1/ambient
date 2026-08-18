import type { FontTarget } from '../lib/typography';

import { settings } from './settings';

/**
 * Class name carrying the face chosen for a widget.
 *
 * Reading settings here subscribes the calling component, so a change to one
 * widget's font repaints only that widget.
 */
export function fontClass(target: FontTarget): string {
  return `font-${settings.value.fonts[target]}`;
}
