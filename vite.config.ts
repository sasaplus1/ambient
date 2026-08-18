import { execSync } from 'node:child_process';

import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

/**
 * The commit the bundle was built from, so a device can say which version it is
 * running without being plugged into anything.
 */
function commitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    // Building from a tarball, or without git available
    return 'unknown';
  }
}

// GitHub Pages serves from a subpath, so every generated URL must be relative
export default defineConfig({
  base: './',
  plugins: [preact()],
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha()),
  },
});
