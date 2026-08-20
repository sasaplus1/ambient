import { computed, effect, signal } from '@preact/signals';

import {
  detectLocale,
  translate,
  type Locale,
  type LocaleSetting,
  type MessageKey,
} from '../lib/i18n';

import { settings } from './settings';

/**
 * What the browser currently prefers.
 *
 * Held as a signal rather than read on demand so that a languagechange event
 * propagates through the computed values below.
 */
const browserLocale = signal<Locale>(detectLocale());

function resolve(setting: LocaleSetting): Locale {
  return setting === 'auto' ? browserLocale.value : setting;
}

/**
 * Two languages, because the dashboard and the settings are read by the same
 * person in two different situations.
 *
 * One hangs on a wall and is looked at from across the room; the other is held
 * at arm's length and operated. Someone can reasonably want the first in a
 * language they like the look of and the second in the one they think in.
 */
export const displayLocale = computed<Locale>(() =>
  resolve(settings.value.locale),
);

export const settingsLocale = computed<Locale>(() =>
  resolve(settings.value.settingsLocale),
);

/**
 * Two functions rather than one with a default, and neither of them called
 * `t`.
 *
 * A bare `t` says nothing about which of the two languages it means, and with
 * two of them in the same file that is exactly what the reader needs to know.
 * It also has no safe default to fall back on: whichever way round it went,
 * somebody adding a string later would silently get the wrong one.
 */
export function displayText(key: MessageKey): string {
  return translate(displayLocale.value, key);
}

export function settingsText(key: MessageKey): string {
  return translate(settingsLocale.value, key);
}

/**
 * Track the browser's language settings and keep the document's lang attribute
 * in step. Call once at startup.
 *
 * The document's language is the dashboard's. It describes the page's own
 * content, and the settings panel says so for itself with a lang of its own on
 * the element that holds it.
 */
export function startLocaleSync(): void {
  window.addEventListener('languagechange', () => {
    browserLocale.value = detectLocale();
  });

  effect(() => {
    document.documentElement.lang = displayLocale.value;
  });
}
