'use strict';

const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

const FILES_TO_CACHE = [
  '/',
  '/empresa-pesquisar',
  '/static/js/bundle.js',
  '/static/js/0.chunk.js',
  '/static/js/1.chunk.js',
  '/static/js/main.chunk.js',
  '/static/js/main.chunk.js.map',
  '/manifest.json',
  '/favicon.ico',
  '/static/media/fa-solid-900.b15db15f.woff2',
  '/static/media/fa-solid-900.bea989e8.woff',
  '/static/media/fa-solid-900.1ab236ed.ttf',
  '/logo/icon-144x144.png'
];

const isLocalhost = Boolean(
  self.location.hostname === 'localhost' ||
  // [::1] is the IPv6 localhost address.
  self.location.hostname === '[::1]' ||
  // 127.0.0.0/8 are considered localhost for IPv4.
  self.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  // CODELAB: Precache static resources here.
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if ((key !== CACHE_NAME && key !== DATA_CACHE_NAME) /*|| isLocalhost*/) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  if (evt.request.url.includes('app.futurelegis.com.br/api')) {//TODO DATA CACHE
    console.log('[Service Worker] Fetch (data)', evt.request.url);
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(evt.request)
          .then((response) => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }
            return response;
          }).catch((err) => {
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request.url);
          });
      }));
    return;
  }
  else {
    console.log('[ServiceWorker] Fetch', evt.request.url);
    evt.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(evt.request)
          .then((response) => {
            return response || fetch(evt.request);
          });
      })
    );
  }

});
