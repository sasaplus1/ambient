/**
 * Injected by vite.config.ts, so a device can report which build it is running
 * without being plugged into anything.
 */
declare const __COMMIT_SHA__: string;

/**
 * The build config touches only a few Node APIs. Declaring just those keeps
 * @types/node - several megabytes for a handful of calls - out of the tree.
 */
declare module 'node:child_process' {
  export function execSync(
    command: string,
    options: { encoding: 'utf8'; stdio: readonly ['ignore', 'pipe', 'ignore'] },
  ): string;
}

declare module 'node:fs' {
  type Dirent = {
    name: string;
    parentPath: string;
    isDirectory(): boolean;
  };

  export function readdirSync(
    path: string,
    options: { recursive: true; withFileTypes: true },
  ): Dirent[];
}
