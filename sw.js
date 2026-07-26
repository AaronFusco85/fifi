// Pull in WINES_CSV_URL / FLASHCARDS_CSV_URL / GOOGLE_MAPS_API_KEY so this
// worker knows which cross-origin Sheets URLs are safe (and worth) caching.
// config.js sets these on `self`, which works both in page context and here.
try {
  importScripts('js/config.js');
} catch (err) {
  console.warn('[sw] Could not load config.js', err);
}

const CACHE_NAME = 'chez-fifi-cache-v9';

function sheetsUrlsConfigured() {
  return self.WINES_CSV_URL && !self.WINES_CSV_URL.startsWith('PASTE_')
    && self.FLASHCARDS_CSV_URL && !self.FLASHCARDS_CSV_URL.startsWith('PASTE_');
}

// Pages and data that don't change URL when the site is updated (no cache-
// busting query string) — safe to precache eagerly on install. Everything
// else (versioned CSS/JS) gets cached automatically the first time it's
// fetched, via the fetch handler below. The local data/*.json files stay
// listed here as the offline fallback content source, even once Sheets is
// live — see data-source.js.
const PRECACHE_URLS = [
  'index.html',
  'menu.html',
  'food-menu.html',
  'flashcards.html',
  'maps.html',
  'team-quiz.html',
  'data/menu.json',
  'data/food.json',
  'data/flashcards.json',
  'data/regions.json',
  'resources/pdfs/BTG_Complete_Packet.pdf',
  'favicon.svg',
  'favicon-32.png',
  'favicon-192.png',
  'apple-touch-icon.png',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const urls = PRECACHE_URLS.slice();
      // Also warm the cache with the live Sheets data on first install, so
      // offline works from the very first visit rather than only after a
      // page has been opened once online.
      if (sheetsUrlsConfigured()) {
        urls.push(self.WINES_CSV_URL, self.FLASHCARDS_CSV_URL);
      }

      // Cache each file independently — cache.addAll() is all-or-nothing,
      // so a single missing/failed file would otherwise silently prevent
      // EVERYTHING from being cached. This way one bad file just gets
      // skipped (and logged) instead of breaking offline support entirely.
      return Promise.all(
        urls.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((response) => {
              if (response && response.ok) {
                return cache.put(url, response);
              }
              console.warn('[sw] Skipped precaching (bad response):', url, response && response.status);
            })
            .catch((err) => console.warn('[sw] Skipped precaching (fetch failed):', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSheetsRequest = sheetsUrlsConfigured()
    && (event.request.url === self.WINES_CSV_URL || event.request.url === self.FLASHCARDS_CSV_URL);
  // Bottle photo links can point anywhere (producer sites, retailers,
  // etc.) — cache image requests opportunistically regardless of domain,
  // same idea as the Sheets data, so photos you've already viewed once
  // keep showing up offline.
  const isImageRequest = event.request.destination === 'image';

  // Same-origin GETs, the two specific Sheets CSV endpoints, and image
  // requests from any origin. Everything else cross-origin — Google Maps
  // tiles/scripts, Google Fonts, etc. — passes through untouched; those
  // can't meaningfully work offline anyway.
  if (event.request.method !== 'GET' || (url.origin !== self.location.origin && !isSheetsRequest && !isImageRequest)) {
    return;
  }

  // Stale-while-revalidate: if a cached copy exists, return it IMMEDIATELY
  // (this is what makes the Sheets data feel instant on repeat visits)
  // while fetching a fresh copy in the background to update the cache for
  // next time. Only the very first visit ever (nothing cached yet) has to
  // wait on the network — after that, every load is fast, with content
  // freshness lagging by about one visit, which is a fine tradeoff for a
  // reference tool like this.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
