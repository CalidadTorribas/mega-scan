const CACHE_NAME = 'infoscan-v1.0.0';
const STATIC_CACHE_NAME = 'infoscan-static-v1.0.0';

// Recursos estáticos que siempre se cachean
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.4/umd/zxing-browser.min.js'
];

// Recursos dinámicos que se cachean bajo demanda
const DYNAMIC_CACHE_WHITELIST = [
  'fonts.gstatic.com',
  'fonts.googleapis.com'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando recursos estáticos');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Instalación completada');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Error durante la instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Eliminar caches antiguos
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Service Worker: Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activación completada');
        return self.clients.claim();
      })
  );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Solo manejar solicitudes GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Estrategia Cache First para recursos estáticos
  if (isStaticResource(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Estrategia Network First para recursos dinámicos
  if (isDynamicResource(url.hostname)) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Estrategia Network First para el resto
  event.respondWith(networkFirst(request));
});

// Verificar si es un recurso estático
function isStaticResource(url) {
  return STATIC_RESOURCES.some(resource => url.includes(resource));
}

// Verificar si es un recurso dinámico cacheable
function isDynamicResource(hostname) {
  return DYNAMIC_CACHE_WHITELIST.some(domain => hostname.includes(domain));
}

// Estrategia Cache First
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache First fallido:', error);
    
    // Fallback para páginas HTML
    if (request.headers.get('accept').includes('text/html')) {
      const fallbackResponse = await caches.match('/');
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }
    
    // Respuesta de error genérica
    return new Response('Contenido no disponible sin conexión', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Estrategia Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Network First fallido:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback específico para diferentes tipos de contenido
    if (request.headers.get('accept').includes('text/html')) {
      const fallbackResponse = await caches.match('/');
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }
    
    if (request.url.includes('.jpg') || request.url.includes('.png') || request.url.includes('.svg')) {
      return new Response('', {
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'Content-Type': 'image/svg+xml'
        })
      });
    }
    
    return new Response('Recurso no disponible sin conexión', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Registrado correctamente');