const CACHE_NAME = 'kara_v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/parser.js',
  '/js/store.js',
  '/js/app.js',
  '/js/views/home.js',
  '/js/views/product.js',
  '/js/views/cart.js',
  '/manifest.json',
  '/images/icon-192.jpg'
  //'/images/icon-512.png'
];

// Instalación: cachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache First para assets, Network First para Sheets
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Ignorar requests externos (WhatsApp, Google Sheets)
  if (url.includes('wa.me') || url.includes('googleapis.com') || url.includes('sheets')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
            
            return response;
          });
      })
      .catch(() => {
        // Fallback a index.html para SPA
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      })
  );
});