const CACHE_NAME = 'mega-scan-v2.0.0';
const STATIC_CACHE_NAME = 'mega-scan-static-v2.0.0';

// Recursos estáticos que siempre se cachean
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  // Scripts de la aplicación v2.0 - ORDEN CRÍTICO
  '/scanner-interfaces.js',
  '/barcode-detector-engine.js',
  '/zxing-wasm-engine.js',
  '/html5-qrcode-engine.js',
  '/scanner-factory.js',
  '/scanner-module.js',
  '/view-manager.js',
  // CDNs externos críticos
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// CDNs de motores de escaneo - Caché dinámica con prioridad
const SCANNER_ENGINES_CDNS = [
  // ZXing WASM - Motor principal para Safari/iOS
  'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/umd/zxing-browser.min.js',
  'https://unpkg.com/@zxing/browser@0.1.5/umd/zxing-browser.min.js',
  'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.4/umd/zxing-browser.min.js',
  
  // html5-qrcode - Fallback universal
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'
];

// Recursos dinámicos que se cachean bajo demanda
const DYNAMIC_CACHE_WHITELIST = [
  'fonts.gstatic.com',
  'fonts.googleapis.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker v2.0: Instalando...');
  
  event.waitUntil(
    Promise.all([
      // Cachear recursos estáticos
      caches.open(STATIC_CACHE_NAME)
        .then(cache => {
          console.log('📦 Service Worker: Cacheando recursos estáticos v2.0');
          return cache.addAll(STATIC_RESOURCES);
        }),
      
      // Pre-cachear motores de escaneo críticos
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('⚡ Service Worker: Pre-cacheando motores de escaneo');
          // Cachear solo los primeros CDNs de cada motor (más confiables)
          const priorityCDNs = [
            SCANNER_ENGINES_CDNS[0], // ZXing principal
            SCANNER_ENGINES_CDNS[3]  // html5-qrcode principal
          ];
          return Promise.allSettled(
            priorityCDNs.map(url => 
              fetch(url)
                .then(response => response.ok ? cache.put(url, response) : null)
                .catch(error => console.warn(`⚠️ Pre-caché fallido: ${url}`, error))
            )
          );
        })
    ])
    .then(() => {
      console.log('✅ Service Worker v2.0: Instalación completada');
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('❌ Service Worker: Error durante la instalación:', error);
    })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker v2.0: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Eliminar caches antiguos (mantener solo v2.0)
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                !cacheName.includes('v2.0')) {
              console.log('🧹 Service Worker: Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker v2.0: Activación completada');
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
  
  // Estrategia específica para motores de escaneo
  if (isScannerEngine(request.url)) {
    event.respondWith(scannerEngineStrategy(request));
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
  return STATIC_RESOURCES.some(resource => url.includes(resource.replace('/', '')));
}

// Verificar si es un motor de escaneo
function isScannerEngine(url) {
  return SCANNER_ENGINES_CDNS.some(cdn => url.includes(cdn.split('/').pop().split('@')[0]));
}

// Verificar si es un recurso dinámico cacheable
function isDynamicResource(hostname) {
  return DYNAMIC_CACHE_WHITELIST.some(domain => hostname.includes(domain));
}

// Estrategia específica para motores de escaneo
async function scannerEngineStrategy(request) {
  try {
    // Intentar caché primero (para funcionamiento offline)
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Motor de escaneo servido desde caché:', request.url);
      return cachedResponse;
    }
    
    // Si no está en caché, obtener de red
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear para futuras referencias
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      console.log('⚡ Motor de escaneo cacheado:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Error cargando motor de escaneo:', error);
    
    // Fallback: intentar desde caché aunque sea una versión anterior
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('🔄 Usando motor de escaneo desde caché como fallback');
      return cachedResponse;
    }
    
    // Último recurso: respuesta de error específica para motores
    return new Response(
      `// Motor de escaneo no disponible offline\nconsole.error('Motor de escaneo no disponible: ${request.url}');`,
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/javascript'
        })
      }
    );
  }
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
    if (request.headers.get('accept')?.includes('text/html')) {
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
    if (request.headers.get('accept')?.includes('text/html')) {
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
  
  // Nuevo: Comando para pre-cargar motores específicos
  if (event.data && event.data.type === 'PRELOAD_ENGINE') {
    preloadEngine(event.data.engine);
  }
  
  // Nuevo: Limpiar caché de motores antiguos
  if (event.data && event.data.type === 'CLEAR_ENGINE_CACHE') {
    clearEngineCache();
  }
});

// Pre-cargar motor específico
async function preloadEngine(engineType) {
  try {
    const cache = await caches.open(CACHE_NAME);
    let urlsToPreload = [];
    
    switch (engineType) {
      case 'wasm':
        urlsToPreload = SCANNER_ENGINES_CDNS.filter(url => url.includes('zxing'));
        break;
      case 'javascript':
        urlsToPreload = SCANNER_ENGINES_CDNS.filter(url => url.includes('html5-qrcode'));
        break;
      default:
        console.warn('Motor desconocido para pre-carga:', engineType);
        return;
    }
    
    console.log(`🚀 Pre-cargando motor ${engineType}...`);
    
    for (const url of urlsToPreload) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log(`✅ Motor ${engineType} pre-cargado desde: ${url}`);
          break; // Solo necesitamos uno exitoso
        }
      } catch (error) {
        console.warn(`⚠️ Error pre-cargando desde ${url}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error en pre-carga de motor:', error);
  }
}

// Limpiar caché de motores
async function clearEngineCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    for (const request of keys) {
      if (isScannerEngine(request.url)) {
        await cache.delete(request);
        console.log('🧹 Motor eliminado del caché:', request.url);
      }
    }
    
    console.log('✅ Caché de motores limpiado');
  } catch (error) {
    console.error('❌ Error limpiando caché de motores:', error);
  }
}

// Estadísticas de uso para analytics
self.addEventListener('fetch', event => {
  // Solo para recursos de motores de escaneo
  if (isScannerEngine(event.request.url)) {
    // Enviar estadística al cliente
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'ENGINE_LOADED',
          engine: getEngineType(event.request.url),
          url: event.request.url,
          timestamp: Date.now()
        });
      });
    });
  }
});

// Determinar tipo de motor por URL
function getEngineType(url) {
  if (url.includes('zxing')) return 'wasm';
  if (url.includes('html5-qrcode')) return 'javascript';
  return 'unknown';
}

// Evento de actualización disponible
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Verificar si hay una nueva versión disponible
    caches.keys().then(cacheNames => {
      const hasNewerVersion = cacheNames.some(name => 
        name.includes('v2.1') || name.includes('v3.0')
      );
      
      event.ports[0].postMessage({
        type: 'UPDATE_STATUS',
        hasUpdate: hasNewerVersion
      });
    });
  }
});

console.log('✅ Service Worker v2.0 registrado correctamente');