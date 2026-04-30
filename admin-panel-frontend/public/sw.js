const CACHE_VERSION = 'v4';
const APP_CACHE = `smd-vital-app-${CACHE_VERSION}`;
const RUNTIME_CACHE = `smd-vital-runtime-${CACHE_VERSION}`;

const APP_SHELL = [
  '/',
  '/login',
  '/offline.html',
  '/manifest.webmanifest',
  '/pwa-icon.svg',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![APP_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnlyApi(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkOnlyApi(request) {
  try {
    return await fetch(request);
  } catch (_error) {
    return new Response(
      JSON.stringify({
        success: false,
        offline: true,
        message: 'Sin conexion. La app conserva la interfaz instalada, pero las acciones clinicas requieren red.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_error) {
    const cached = await caches.match(request);
    return cached || await caches.match('/offline.html') || offlineHtmlResponse();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetched = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || fallbackAssetResponse(request));

  return cached || fetched;
}

function fallbackAssetResponse(request) {
  if (request.destination === 'document') {
    return offlineHtmlResponse();
  }

  return new Response('', {
    status: 504,
    statusText: 'Offline',
  });
}

function offlineHtmlResponse() {
  return new Response(
    '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>SMD Vital sin conexion</title></head><body><h1>Sin conexion</h1><p>Vuelve a intentarlo cuando recuperes la red.</p></body></html>',
    {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}
