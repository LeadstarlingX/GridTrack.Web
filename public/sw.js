'use strict';

// ── Cache names ────────────────────────────────────────────────────────────────
// Bump the version suffix to bust all caches on next SW update.
const TILE_CACHE  = 'gridtrack-tiles-v1';
const GLYPH_CACHE = 'gridtrack-glyphs-v1';

// ── Tile origin filters ────────────────────────────────────────────────────────
const ESRI_IMAGERY_BASE  = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';
const ESRI_REFERENCE_BASE = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile';
const CARTO_GLYPH_BASE   = 'https://tiles.basemaps.cartocdn.com/fonts';

// ── Damascus pre-cache tile grid ───────────────────────────────────────────────
// Damascus center: lat=33.5138, lng=36.2765
// Tile coords at each zoom (Esri scheme: tile/{z}/{y}/{x}):
//   z10 → (x=615, y=410)
//   z11 → (x=1230, y=821)
//   z12 → (x=2460, y=1643)
//
// Pre-caching a 5×5 grid around the center at each zoom covers:
//   z10 → ~72 km radius around city (overview)
//   z11 → ~36 km (district level)
//   z12 → ~18 km (street level, default zoom)
//
// At ~50–80 KB/tile: ~150 tiles × 65 KB avg ≈ 10 MB one-time download.
// After that, the map loads from cache with zero network requests for Damascus.

function buildPreCacheTileUrls() {
    const urls = [];
    const grids = [
        { z: 10, cx: 615,  cy: 410,  radius: 2 }, // 5×5 = 25 tiles per source
        { z: 11, cx: 1230, cy: 821,  radius: 2 },
        { z: 12, cx: 2460, cy: 1643, radius: 2 },
    ];

    for (const { z, cx, cy, radius } of grids) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const x = cx + dx;
                const y = cy + dy;
                // Esri uses {z}/{y}/{x} — note y before x
                urls.push(`${ESRI_IMAGERY_BASE}/${z}/${y}/${x}`);
                urls.push(`${ESRI_REFERENCE_BASE}/${z}/${y}/${x}`);
            }
        }
    }
    return urls;
}

// Glyphs needed for district badge number rendering (digits 0-9 are in range 0-255)
const PRECACHE_GLYPHS = [
    `${CARTO_GLYPH_BASE}/Open Sans Bold/0-255.pbf`,
    `${CARTO_GLYPH_BASE}/Arial Unicode MS Bold/0-255.pbf`,
];

// ── Install: pre-cache Damascus tiles + essential glyphs ──────────────────────
self.addEventListener('install', (event) => {
    const tilesToPrecache = buildPreCacheTileUrls();

    event.waitUntil(
        Promise.all([
            // Tile cache
            caches.open(TILE_CACHE).then((cache) =>
                // allSettled: one failed tile (e.g. offline at first boot) doesn't abort the whole install
                Promise.allSettled(
                    tilesToPrecache.map((url) =>
                        cache.add(new Request(url, { credentials: 'omit' })).catch(() => null)
                    )
                )
            ),
            // Glyph cache
            caches.open(GLYPH_CACHE).then((cache) =>
                Promise.allSettled(
                    PRECACHE_GLYPHS.map((url) =>
                        cache.add(new Request(url, { credentials: 'omit' })).catch(() => null)
                    )
                )
            ),
        ]).then(() => self.skipWaiting())
    );
});

// ── Activate: delete stale cache versions ─────────────────────────────────────
self.addEventListener('activate', (event) => {
    const LIVE_CACHES = new Set([TILE_CACHE, GLYPH_CACHE]);
    event.waitUntil(
        caches.keys()
            .then((names) =>
                Promise.all(
                    names
                        .filter((name) => !LIVE_CACHES.has(name))
                        .map((name) => caches.delete(name))
                )
            )
            .then(() => self.clients.claim())
    );
});

// ── Fetch: cache-first for tiles and glyphs ───────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { url } = event.request;

    const isEsriTile   = url.startsWith('https://server.arcgisonline.com');
    const isCartoGlyph = url.startsWith('https://tiles.basemaps.cartocdn.com/fonts');

    // Only intercept map tile and glyph requests — everything else (API, SignalR, etc.) passes through.
    if (!isEsriTile && !isCartoGlyph) return;

    const cacheName = isCartoGlyph ? GLYPH_CACHE : TILE_CACHE;

    event.respondWith(
        caches.open(cacheName).then((cache) =>
            cache.match(event.request).then((cached) => {
                // Cache hit: serve immediately, no network.
                if (cached) return cached;

                // Cache miss: fetch, store, return.
                return fetch(event.request, { credentials: 'omit' })
                    .then((response) => {
                        // Only cache successful, non-opaque responses.
                        if (response.ok && response.status === 200) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    })
                    .catch(() => {
                        // Network failed and not in cache (offline + uncached tile).
                        // Return a minimal 503 — MapLibre renders missing tiles as grey and moves on.
                        return new Response('Tile unavailable offline', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: { 'Content-Type': 'text/plain' },
                        });
                    });
            })
        )
    );
});
