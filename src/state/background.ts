import { signal } from '@preact/signals';

import {
  clearBackground,
  loadBackground,
  saveBackground,
} from '../lib/imageStore';
import { logger } from '../lib/logger';

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

/**
 * Why a picture was not taken, so the panel can say something more useful than
 * that it did not work.
 */
export type BackgroundRefusal = 'unreadable' | 'save-failed';

/**
 * Whether the browser can actually turn these bytes into an image.
 *
 * Nothing before this point checks. createObjectURL succeeds on any blob at
 * all, an <img> accepts the URL, and the first thing that tries to read the
 * bytes is the decoder - by which point the picture is stored, the setting
 * says there is a background, and what the user gets is the broken-image mark.
 *
 * Two ways in, both of them ordinary. Android's picker can return a file that
 * is only in the cloud and not on the device, as a File of zero bytes; and
 * accept="image/*" offers HEIC, which phones are happy to record in and which
 * no browser can decode.
 *
 * createImageBitmap rejects for either, which is the whole reason to use it
 * over reading a header ourselves.
 */
/**
 * The bytes themselves, held by us rather than by whatever handed them over.
 *
 * A File chosen on Android is a window onto a content:// provider, not a copy
 * of anything. The window can close: the provider is free to stop answering,
 * and on a Xiaomi with the picture coming from Google Photos it does. Reading
 * it once works, so the decode check passes, and the write afterwards fails
 * with `DataError: Failed to write blobs (InvalidBlob)` - IndexedDB going back
 * for the bytes it was promised and finding nobody there.
 *
 * Observed on a Redmi 12 5G, which is what sent us looking.
 *
 * So the bytes are pulled into memory once, up front, and everything after
 * this point - the decode, the write, the URL the <img> is given - works from
 * that copy. Nothing downstream depends on the provider still being willing.
 */
async function readBytes(blob: Blob): Promise<Blob | null> {
  try {
    return new Blob([await blob.arrayBuffer()], { type: blob.type });
  } catch (error) {
    logger.error('background', `cannot read: ${String(error)}`);

    return null;
  }
}

async function canDecode(blob: Blob): Promise<boolean> {
  try {
    const bitmap = await createImageBitmap(blob);

    // Decoded only to find out whether it could be; the pixels are not wanted
    bitmap.close();

    return true;
  } catch (error) {
    logger.error('background', `cannot decode: ${String(error)}`);

    return false;
  }
}

export async function setBackground(blob: Blob): Promise<BackgroundRefusal | null> {
  /*
   * Recorded before anything is attempted. Name, type and size are what tell
   * the ways this goes wrong apart from one another, and they are worth having
   * in the log of a device that is across the room from whoever is trying to
   * work out what happened.
   */
  const name = blob instanceof File ? blob.name : '(blob)';

  logger.info(
    'background',
    `chose ${name} type=${blob.type || '(none)'} size=${blob.size}`,
  );

  const bytes = await readBytes(blob);

  if (!bytes) {
    return 'unreadable';
  }

  if (!(await canDecode(bytes))) {
    return 'unreadable';
  }

  if (!(await saveBackground(bytes))) {
    return 'save-failed';
  }

  replaceUrl(URL.createObjectURL(bytes));

  return null;
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
