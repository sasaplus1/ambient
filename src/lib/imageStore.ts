/**
 * The background image lives in IndexedDB rather than localStorage, which only
 * holds strings and would mean base64 inflating every photo by a third.
 *
 * A single record in a single store: there is only ever one background.
 */

import { logger } from './logger';

const DB_NAME = 'ambient';
const DB_VERSION = 1;
const STORE = 'images';
const BACKGROUND_KEY = 'background';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('indexeddb open failed'));
    };
  });
}

/**
 * Runs one request and waits for the transaction around it, not for the
 * request.
 *
 * The difference only shows when something goes wrong, and then it shows
 * badly. Under readwrite a successful request means the write was accepted,
 * not that it was kept: the commit comes afterwards and can still fail - a
 * device out of space is the ordinary way - by which point a promise settled
 * on the request has already reported success. Waiting for oncomplete means
 * the answer is about what is on disk.
 *
 * onabort matters for the opposite reason. A transaction can be aborted
 * without any request erroring, and with only the two handlers this had, the
 * promise was then never settled at all: the caller's await simply never
 * returned, with nothing logged and nothing shown.
 */
function runTransaction<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = work(transaction.objectStore(STORE));

        transaction.oncomplete = () => {
          db.close();
          resolve(request.result);
        };

        /*
         * A request that errors and is left unhandled aborts its transaction,
         * so both of these can arrive for one failure. Whichever is first
         * settles the promise and the other is ignored; closing twice is
         * harmless.
         */
        const fail = (fallback: string) => {
          db.close();
          reject(transaction.error ?? request.error ?? new Error(fallback));
        };

        transaction.onerror = () => {
          fail('indexeddb transaction failed');
        };

        transaction.onabort = () => {
          fail('indexeddb transaction aborted');
        };
      }),
  );
}

/*
 * Every failure here is caught, because none of them is worth taking the
 * dashboard down for - a device with IndexedDB blocked should still show the
 * clock. But caught is not the same as unrecorded. These used to discard the
 * reason as well, which left the debug overlay with nothing to say at the one
 * moment someone would go looking at it.
 */

export async function loadBackground(): Promise<Blob | null> {
  try {
    const stored = await runTransaction<unknown>('readonly', (store) =>
      store.get(BACKGROUND_KEY),
    );

    return stored instanceof Blob ? stored : null;
  } catch (error) {
    logger.error('background', `load failed: ${String(error)}`);

    return null;
  }
}

export async function saveBackground(blob: Blob): Promise<boolean> {
  try {
    await runTransaction('readwrite', (store) =>
      store.put(blob, BACKGROUND_KEY),
    );

    return true;
  } catch (error) {
    logger.error('background', `save failed: ${String(error)}`);

    return false;
  }
}

export async function clearBackground(): Promise<void> {
  try {
    await runTransaction('readwrite', (store) => store.delete(BACKGROUND_KEY));
  } catch (error) {
    // The caller drops its reference either way, so this is only worth saying
    logger.error('background', `clear failed: ${String(error)}`);
  }
}
