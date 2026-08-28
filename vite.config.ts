import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

import preact from '@preact/preset-vite';
import { defineConfig, type Plugin } from 'vite';

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

/**
 * Produce the small, versioned service worker that keeps one complete app shell
 * available. The runtime stays readable as ordinary JavaScript while this build
 * hook supplies the generated asset names and version without a PWA dependency.
 */
function serviceWorker(): Plugin {
  return {
    name: 'ambient-service-worker',
    apply: 'build',
    // Vite emits transformed HTML late in its build pipeline. Run afterward so
    // index.html is present alongside the hashed JavaScript and CSS entries.
    enforce: 'post',
    generateBundle(_options, bundle) {
      // Vite gives generated entries to this hook, while public/ is copied
      // separately. Join both sets so install either caches a complete shell or
      // fails without leaving a partial offline build behind.
      const emitted = Object.keys(bundle);
      const copied = readdirSync('public', {
        recursive: true,
        withFileTypes: true,
      })
        .filter((entry) => !entry.isDirectory())
        .map((entry) => {
          const relativeParent = entry.parentPath
            .replaceAll('\\', '/')
            .replace(/^public\/?/, '');

          return relativeParent
            ? `${relativeParent}/${entry.name}`
            : entry.name;
        })
        .sort();
      const version = commitSha();
      const shell = [...emitted, ...copied];
      const source = [
        `const VERSION = ${JSON.stringify(version)};`,
        `const SHELL = ${JSON.stringify(shell, null, 2)};`,
        '',
        readFileSync('src/service-worker.js', 'utf8'),
      ].join('\n');

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source,
      });
    },
  };
}

// GitHub Pages serves from a subpath, so every generated URL must be relative
export default defineConfig({
  base: './',
  plugins: [preact(), serviceWorker()],
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha()),
  },
});
