const CACHE = `ambient-${VERSION}`;

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
        // Preview and some static hosts vary responses by Origin even though
        // this shell is same-origin and versioned. Match its exact URL without
        // letting that transport header force an offline network fallback.
        .then((cache) => cache.match(index, { ignoreVary: true }))
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
      .then((cache) => cache.match(request, { ignoreVary: true }))
      .then((cached) => cached ?? fetch(request)),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'skipWaiting') {
    self.skipWaiting();
  }
});
