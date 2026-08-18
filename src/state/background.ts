import { signal } from '@preact/signals';

import {
  clearBackground,
  loadBackground,
  saveBackground,
} from '../lib/imageStore';

/**
 * Object URL for the stored background, or null when there is none.
 *
 * Every URL handed out here is revoked before the next one replaces it. On a
 * device left running for days, leaking one per change would pin whole images
 * in memory for the lifetime of the document.
 */
export const backgroundUrl = signal<string | null>(null);

function replaceUrl(next: string | null): void {
  const previous = backgroundUrl.value;

  backgroundUrl.value = next;

  if (previous) {
    URL.revokeObjectURL(previous);
  }
}

export async function setBackground(blob: Blob): Promise<boolean> {
  const saved = await saveBackground(blob);

  if (!saved) {
    return false;
  }

  replaceUrl(URL.createObjectURL(blob));

  return true;
}

export async function removeBackground(): Promise<void> {
  await clearBackground();
  replaceUrl(null);
}

/** Restore the stored background. Call once at startup. */
export function startBackgroundSync(): void {
  void loadBackground().then((blob) => {
    if (blob) {
      replaceUrl(URL.createObjectURL(blob));
    }
  });

  // pagehide rather than unload: it also fires when the page goes into the
  // back/forward cache, and unload is unreliable on mobile.
  addEventListener('pagehide', () => {
    replaceUrl(null);
  });
}
