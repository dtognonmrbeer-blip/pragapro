const CACHE_STATIC = 'agromapa-static-v3';
const CACHE_TILES  = 'agromapa-tiles-v1';
const CACHE_FAZ    = 'agromapa-fazendas-v1';

const STATIC_FILES = [
  '/', '/index.html', '/manifest.json',
  '/fazendas_go.geojson',
  '/icons/icon-192.png', '/icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(c => c.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== CACHE_STATIC && k !== CACHE_TILES && k !== CACHE_FAZ)
        .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Tiles OSM
  if (url.hostname.endsWith('.tile.openstreetmap.org')) {
    event.respondWith(tileStrategy(event.request));
    return;
  }

  // Arquivos de fazenda (INDEX + JSONs)
  if (url.pathname.includes('/fazendas/')) {
    event.respondWith(fazStrategy(event.request));
    return;
  }

  event.respondWith(staticStrategy(event.request));
});

async function fazStrategy(req) {
  const cache = await caches.open(CACHE_FAZ);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return new Response('{"error":"offline"}', {headers:{'Content-Type':'application/json'}});
  }
}

async function tileStrategy(req) {
  const cache = await caches.open(CACHE_TILES);
  const cached = await cache.match(req);
  if (cached) {
    if (navigator.onLine) fetch(req).then(r => { if(r&&r.ok) cache.put(req,r.clone()); }).catch(()=>{});
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res && res.ok) { cache.put(req, res.clone()); limitCache(cache, 3000); }
    return res;
  } catch {
    return new Response(grayTile(), { headers: {'Content-Type':'image/svg+xml'} });
  }
}

async function staticStrategy(req) {
  if (req.method !== 'GET') return fetch(req);
  const cache = await caches.open(CACHE_STATIC);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok && req.url.startsWith('http')) cache.put(req, res.clone());
    return res;
  } catch {
    const fb = await cache.match('/index.html');
    return fb || new Response('Offline', {status:503});
  }
}

async function limitCache(cache, max) {
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
}

function grayTile() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e8e8e0"/><text x="128" y="128" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="11" fill="#aaa">Sem sinal</text></svg>`;
}
