// PragaPro Cbio — Service Worker v5
// Estratégia offline-first completa

const CACHE_APP   = 'pragapro-app-v5';
const CACHE_TILES = 'pragapro-tiles-v1';
const CACHE_CDN   = 'pragapro-cdn-v5';

// Arquivos do app que SEMPRE devem estar disponíveis offline
const APP_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Bibliotecas externas essenciais — cacheadas na instalação
const CDN_FILES = [
  'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js',
  'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
];

// ===================== INSTALL =====================
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cachear arquivos do app
      caches.open(CACHE_APP).then(cache => cache.addAll(APP_FILES)),
      // Cachear CDNs (ignora falha individual para não travar instalação)
      caches.open(CACHE_CDN).then(cache =>
        Promise.allSettled(CDN_FILES.map(url =>
          fetch(url, {mode:'cors'}).then(r => { if(r.ok) cache.put(url, r); }).catch(()=>{})
        ))
      ),
    ]).then(() => self.skipWaiting())
  );
});

// ===================== ACTIVATE =====================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => ![CACHE_APP, CACHE_TILES, CACHE_CDN].includes(k))
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ===================== FETCH =====================
self.addEventListener('fetch', event => {
  const url = event.request.url;
  const method = event.request.method;

  // Só intercepta GET
  if (method !== 'GET') return;

  // Tiles do Mapbox e OpenStreetMap — cache agressivo
  if (isTileRequest(url)) {
    event.respondWith(tileStrategy(event.request));
    return;
  }

  // Supabase API — sempre rede, sem cache (dados em tempo real)
  if (url.includes('supabase.co')) {
    event.respondWith(networkOnly(event.request));
    return;
  }

  // Mapbox GL JS / CSS e outras CDNs — cache-first
  if (isCDNRequest(url)) {
    event.respondWith(cacheFirst(event.request, CACHE_CDN));
    return;
  }

  // Arquivos do app — cache-first com fallback para index.html
  event.respondWith(appStrategy(event.request));
});

// ===================== ESTRATÉGIAS =====================

// Cache-first: serve do cache, atualiza em background
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // Atualiza em background se online
    if (navigator.onLine) {
      fetch(request).then(r => { if(r && r.ok) cache.put(request, r.clone()); }).catch(()=>{});
    }
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Recurso indisponível offline', { status: 503 });
  }
}

// App strategy: cache-first, fallback index.html para SPA
async function appStrategy(request) {
  const cache = await caches.open(CACHE_APP);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // Fallback para index.html (app funciona mesmo offline)
    const fallback = await cache.match('/index.html');
    return fallback || new Response('App offline', { status: 503 });
  }
}

// Network-only: tenta rede, sem cache
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Tiles: cache-first com limite de tamanho
async function tileStrategy(request) {
  const cache = await caches.open(CACHE_TILES);
  const cached = await cache.match(request);
  if (cached) {
    // Atualiza silenciosamente em background
    if (navigator.onLine) {
      fetch(request).then(r => { if(r && r.ok) cache.put(request, r.clone()); }).catch(()=>{});
    }
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
      limitCache(cache, 3000); // máx 3000 tiles (~1GB)
    }
    return response;
  } catch {
    // Tile cinza para áreas não visitadas
    return new Response(grayTile(), { headers: { 'Content-Type': 'image/svg+xml' } });
  }
}

async function limitCache(cache, max) {
  try {
    const keys = await cache.keys();
    if (keys.length > max) {
      await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
    }
  } catch {}
}

// ===================== HELPERS =====================
function isTileRequest(url) {
  return url.includes('.tile.openstreetmap.org') ||
         url.includes('api.mapbox.com/v4/') ||
         url.includes('events.mapbox.com') === false && url.includes('api.mapbox.com/styles') === false &&
         url.includes('api.mapbox.com/fonts') ||
         url.includes('api.mapbox.com/v4/') ||
         /api\.mapbox\.com\/v4\/.+\.png/.test(url) ||
         /api\.mapbox\.com\/v4\/.+\.pbf/.test(url);
}

function isCDNRequest(url) {
  return url.includes('api.mapbox.com/mapbox-gl-js') ||
         url.includes('cdn.jsdelivr.net') ||
         url.includes('unpkg.com');
}

function grayTile() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <rect width="256" height="256" fill="#2a3a2a"/>
    <text x="128" y="132" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#4a6a4a">sem sinal</text>
  </svg>`;
}

// ===================== SYNC OFFLINE =====================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pragas') {
    // Background sync quando voltar online (futuro)
    console.log('[SW] Background sync disparado');
  }
});
