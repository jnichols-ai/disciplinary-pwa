// Bump this string on any future change to this file so the browser's
// byte-comparison update check reliably detects a new service worker and
// old caches get cleaned up in `activate` below.
const CACHE_NAME = "disciplinary-form-v2";
const ASSETS = ["/", "/manifest.json", "/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
});

// Drop any caches from a previous version as soon as this worker activates,
// so stale assets can't be served even if something falls through to cache.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

// Lets the page tell a waiting worker to take over immediately instead of
// waiting for every tab to close — see RegisterSW.tsx's update banner.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// Network-first: always try to fetch the latest version first so a manager
// opening the form sees the current code. Only fall back to the cache when
// the network request fails (offline), and opportunistically refresh the
// cache with whatever the network just returned.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
