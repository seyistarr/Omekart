self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open('omekart-cache-v1').then((cache) => {
      return cache.addAll(['/','/manifest.webmanifest','/onboarding/logo.jpg'])
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== 'omekart-cache-v1').map((key) => caches.delete(key))
      )
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request)
    })
  )
})
