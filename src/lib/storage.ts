/**
 * Reading and writing localStorage.
 *
 * On an always-on device the display has to keep working even when storage is
 * unavailable or holds a corrupted value, so every failure is swallowed and
 * undefined is returned to the caller.
 */

type Envelope = {
  schemaVersion: number;
  value: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function loadRecord(
  key: string,
  schemaVersion: number,
): Record<string, unknown> | undefined {
  let raw: string | null;

  try {
    raw = localStorage.getItem(key);
  } catch {
    // localStorage itself is unavailable, e.g. in private browsing
    return undefined;
  }

  if (raw === null) {
    return undefined;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (!isRecord(parsed)) {
    return undefined;
  }

  // On a schema change, fall back to the defaults rather than migrating
  if (parsed['schemaVersion'] !== schemaVersion) {
    return undefined;
  }

  if (!isRecord(parsed['value'])) {
    return undefined;
  }

  return parsed['value'];
}

export function saveRecord(
  key: string,
  schemaVersion: number,
  value: Record<string, unknown>,
): void {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ schemaVersion, value } satisfies Envelope),
    );
  } catch {
    // Keep displaying even if the value cannot be saved
  }
}
