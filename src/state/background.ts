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

/**
 * Restore the stored background. Call once at startup.
 *
 * Nothing is revoked on the way out. There used to be a pagehide handler here
 * that dropped the URL, on the reasoning that a page going away should tidy up
 * after itself - but object URLs belong to the document and go with it, so
 * there was nothing for it to save.
 *
 * What it did instead was break the image. pagehide fires whenever the page is
 * hidden rather than only when it is destroyed, which on an Android PWA is
 * every trip to the home screen. The document survives, the URL it was still
 * pointing at does not, and the background is gone until the app is restarted.
 */
export function startBackgroundSync(): void {
  void loadBackground().then((blob) => {
    if (blob) {
      replaceUrl(URL.createObjectURL(blob));
    }
  });
}
