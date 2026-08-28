import { effect, signal } from '@preact/signals';

import {
  DEFAULT_SETTINGS,
  parseSettings,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from '../lib/settingsSchema';
import { loadRecord, saveRecord } from '../lib/storage';
import type { Settings } from '../types';

export const settings = signal<Settings>(
  parseSettings(loadRecord(STORAGE_KEY, SCHEMA_VERSION)),
);

export function updateSettings(patch: Partial<Settings>): void {
  settings.value = { ...settings.value, ...patch };
}

export function resetSettings(): void {
  settings.value = { ...DEFAULT_SETTINGS };
}

/**
 * Start persisting settings and applying the theme. Call once at startup.
 */
export function startSettingsSync(): void {
  effect(() => {
    saveRecord(STORAGE_KEY, SCHEMA_VERSION, settings.value);
  });
}
