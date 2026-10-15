const cacheName = 'web-app-offline'
const offline = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.add(offline)))
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open(cacheName)
      return (await cache.match(offline)) || new Response('Offline', { status: 503 })
    }),
  )
})
