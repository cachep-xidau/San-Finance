const CACHE_NAME = 's-group-dashboard-v1'
const OFFLINE_URL = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([OFFLINE_URL])
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const requestUrl = new URL(event.request.url)

  if (requestUrl.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request).catch(async () => {
      if (event.request.mode === 'navigate') {
        const cache = await caches.open(CACHE_NAME)
        const offlineResponse = await cache.match(OFFLINE_URL)
        if (offlineResponse) return offlineResponse
      }
      return caches.match(event.request)
    })
  )
})
