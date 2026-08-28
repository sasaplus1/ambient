import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

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
 * available. Keeping this here lets the worker know both the generated asset
 * names and the build version without adding a PWA build dependency.
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

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const VERSION = ${JSON.stringify(version)};
const CACHE = \`ambient-\${VERSION}\`;
const SHELL = ${JSON.stringify(shell, null, 2)};

self.addEventListener('install', (event) => {
  // Resolve every entry against the registration scope: production lives
  // under /ambient/, not at the origin root.
  const urls = SHELL.map((path) => new URL(path, self.registration.scope));
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(urls)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (names) => {
      // Asset names are content-hashed, so removing every previous build keeps
      // storage bounded to exactly one app shell.
      await Promise.all(
        names.filter((name) => name !== CACHE).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    }),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // In particular, weather requests stay entirely outside this worker.
    return;
  }

  if (request.mode === 'navigate') {
    // Cache first avoids turning a slow or absent connection into a blank
    // screen. A network fallback still permits recovery from an empty cache.
    const index = new URL('index.html', self.registration.scope);
    event.respondWith(
      caches
        .open(CACHE)
        .then((cache) => cache.match(index))
        .then((cached) => cached ?? fetch(request)),
    );
    return;
  }

  // Only precached shell entries can be returned here. Network responses are
  // deliberately never inserted. Looking only in this worker's version also
  // prevents a waiting build from mixing its files into the active page.
  event.respondWith(
    caches
      .open(CACHE)
      .then((cache) => cache.match(request))
      .then((cached) => cached ?? fetch(request)),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'skipWaiting') {
    self.skipWaiting();
  }
});
`,
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
