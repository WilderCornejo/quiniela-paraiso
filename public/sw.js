// Service Worker de la Quiniela — estrategia "red primero".
// SIEMPRE intenta traer la versión más nueva de internet; el caché
// solo se usa si no hay conexión. Así nadie se queda con una app vieja.
const CACHE = 'quiniela-pwa-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  // Solo manejamos nuestros propios archivos y las banderas.
  // La base de datos (Supabase) NUNCA se cachea: siempre datos frescos.
  const esNuestro = url.origin === self.location.origin
  const esBandera = url.hostname === 'flagcdn.com'
  if (!esNuestro && !esBandera) return

  e.respondWith(
    fetch(req)
      .then(res => {
        const copia = res.clone()
        caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {})
        return res
      })
      .catch(() => caches.match(req))
  )
})
