import { computed, effect, signal } from '@preact/signals';

import {
  detectLocale,
  translate,
  type Locale,
  type MessageKey,
} from '../lib/i18n';

import { settings } from './settings';

/**
 * What the browser currently prefers.
 *
 * Held as a signal rather than read on demand so that a languagechange event
 * propagates through the computed value below.
 */
const browserLocale = signal<Locale>(detectLocale());

export const locale = computed<Locale>(() =>
  settings.value.locale === 'auto' ? browserLocale.value : settings.value.locale,
);

/** Looks up a message in the locale in effect. */
export function t(key: MessageKey): string {
  return translate(locale.value, key);
}

/**
 * Track the browser's language settings and keep the document's lang attribute
 * in step. Call once at startup.
 */
export function startLocaleSync(): void {
  window.addEventListener('languagechange', () => {
    browserLocale.value = detectLocale();
  });

  effect(() => {
    document.documentElement.lang = locale.value;
  });
}
