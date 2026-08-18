/**
 * The background image lives in IndexedDB rather than localStorage, which only
 * holds strings and would mean base64 inflating every photo by a third.
 *
 * A single record in a single store: there is only ever one background.
 */

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

function runTransaction<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = work(transaction.objectStore(STORE));

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error ?? new Error('indexeddb request failed'));
        };

        transaction.oncomplete = () => {
          db.close();
        };
      }),
  );
}

export async function loadBackground(): Promise<Blob | null> {
  try {
    const stored = await runTransaction<unknown>('readonly', (store) =>
      store.get(BACKGROUND_KEY),
    );

    return stored instanceof Blob ? stored : null;
  } catch {
    // A device with IndexedDB blocked still shows everything else
    return null;
  }
}

export async function saveBackground(blob: Blob): Promise<boolean> {
  try {
    await runTransaction('readwrite', (store) =>
      store.put(blob, BACKGROUND_KEY),
    );

    return true;
  } catch {
    return false;
  }
}

export async function clearBackground(): Promise<void> {
  try {
    await runTransaction('readwrite', (store) => store.delete(BACKGROUND_KEY));
  } catch {
    // Nothing to do; the caller drops its reference either way
  }
}
