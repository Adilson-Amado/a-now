const CACHE_NAME = 'focusflow-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: data.actions || [],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle specific action clicks
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Handle default notification click
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  // Track notification dismissals if needed
  console.log('Notification closed:', event.notification);
});

// Handle notification actions
function handleNotificationAction(action, data) {
  switch (action) {
    case 'view-tasks':
      clients.openWindow('/tasks');
      break;
    case 'view-goals':
      clients.openWindow('/goals');
      break;
    case 'start-break':
      clients.openWindow('/pomodoro?break=true');
      break;
    case 'skip-break':
      clients.openWindow('/pomodoro?skip=true');
      break;
    default:
      clients.openWindow(data?.url || '/');
  }
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle background sync tasks
  try {
    // Sync offline data, send queued notifications, etc.
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
