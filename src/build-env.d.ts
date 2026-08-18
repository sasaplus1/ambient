/**
 * Injected by vite.config.ts, so a device can report which build it is running
 * without being plugged into anything.
 */
declare const __COMMIT_SHA__: string;

/**
 * The build config touches one Node API. Declaring just that much keeps
 * @types/node - several megabytes for a single call - out of the tree.
 */
declare module 'node:child_process' {
  export function execSync(
    command: string,
    options: { encoding: 'utf8'; stdio: readonly ['ignore', 'pipe', 'ignore'] },
  ): string;
}
