// Emergency Safety App - Service Worker
// Provides offline functionality and emergency caching

const CACHE_NAME = "emergency-safety-v1";
const EMERGENCY_CACHE = "emergency-cache-v1";
const LOCATION_CACHE = "location-cache-v1";

// Critical resources for emergency functionality
const EMERGENCY_RESOURCES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/offline.html",
  // CSS and fonts for emergency UI
  "/assets/index.css",
  // Emergency service data
  "/emergency-services.json",
  "/safe-zones.json",
];

// Resources needed for location services
const LOCATION_RESOURCES = ["/location-worker.js"];

// Install event - cache critical resources
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...");

  event.waitUntil(
    Promise.all([
      // Cache emergency resources
      caches.open(EMERGENCY_CACHE).then((cache) => {
        console.log("📦 Caching emergency resources");
        return cache
          .addAll(EMERGENCY_RESOURCES.filter((url) => url !== "/offline.html"))
          .catch((err) => {
            console.warn("Failed to cache some emergency resources:", err);
          });
      }),

      // Cache location resources
      caches.open(LOCATION_CACHE).then((cache) => {
        console.log("📍 Caching location resources");
        return cache.addAll(LOCATION_RESOURCES).catch((err) => {
          console.warn("Failed to cache location resources:", err);
        });
      }),

      // Cache main app resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log("🏠 Caching main app resources");
        return cache.add("/").catch((err) => {
          console.warn("Failed to cache main app:", err);
        });
      }),
    ]),
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== EMERGENCY_CACHE &&
              cacheName !== LOCATION_CACHE
            ) {
              console.log("🗑️ Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),

      // Take control of all clients
      self.clients.claim(),
    ]),
  );
});

// Fetch event - handle requests with emergency priority
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Handle emergency API requests
  if (
    url.pathname.includes("/api/emergency") ||
    url.pathname.includes("/emergency-services")
  ) {
    event.respondWith(handleEmergencyRequest(request));
    return;
  }

  // Handle location requests
  if (
    url.pathname.includes("/api/location") ||
    url.pathname.includes("/location")
  ) {
    event.respondWith(handleLocationRequest(request));
    return;
  }

  // Handle navigation requests (app shell)
  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle asset requests
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image"
  ) {
    event.respondWith(handleAssetRequest(request));
    return;
  }

  // Default cache-first strategy
  event.respondWith(handleDefaultRequest(request));
});

// Emergency request handler - network first with emergency fallback
async function handleEmergencyRequest(request) {
  try {
    // Try network first for emergency data
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful emergency responses
      const cache = await caches.open(EMERGENCY_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error("Network response not ok");
  } catch (error) {
    console.warn("🚨 Emergency network request failed, using cache:", error);

    // Try cache
    const cache = await caches.open(EMERGENCY_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Emergency fallback data
    return new Response(
      JSON.stringify({
        emergency: true,
        offline: true,
        services: [
          { name: "Emergency Services", phone: "911", type: "emergency" },
          { name: "Police", phone: "911", type: "police" },
          { name: "Fire Department", phone: "911", type: "fire" },
          { name: "Ambulance", phone: "911", type: "medical" },
        ],
        message: "Offline emergency mode - call 911 for immediate assistance",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  }
}

// Location request handler - cache first for performance
async function handleLocationRequest(request) {
  try {
    // Check cache first for location data
    const cache = await caches.open(LOCATION_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Update in background
      fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        })
        .catch(() => {});

      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error("Network response not ok");
  } catch (error) {
    console.warn("📍 Location request failed:", error);

    // Fallback location response
    return new Response(
      JSON.stringify({
        offline: true,
        message: "Location services unavailable offline",
        fallback: true,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  }
}

// Navigation request handler - app shell with offline fallback
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      return networkResponse;
    }

    throw new Error("Network response not ok");
  } catch (error) {
    console.warn("🧭 Navigation request failed, serving app shell:", error);

    // Try cached app shell
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match("/");

    if (cachedResponse) {
      return cachedResponse;
    }

    // Create minimal offline emergency page
    return new Response(
      `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Emergency Safety - Offline</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            text-align: center; 
            padding: 2rem; 
            background: #fee; 
            color: #d00;
        }
        .emergency { 
            background: #d00; 
            color: white; 
            padding: 1rem 2rem; 
            border: none; 
            border-radius: 8px; 
            font-size: 1.5rem; 
            margin: 1rem; 
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .emergency:hover { background: #a00; }
    </style>
</head>
<body>
    <h1>🚨 Emergency Safety - Offline Mode</h1>
    <p>The app is currently offline, but emergency services are still available.</p>
    <a href="tel:911" class="emergency">📞 Call 911</a>
    <br>
    <a href="sms:?body=Emergency! Please send help." class="emergency">📱 Send Emergency SMS</a>
    <p><small>Please connect to the internet to access full safety features.</small></p>
    <script>
        // Try to reload when back online
        window.addEventListener('online', () => {
            window.location.reload();
        });
    </script>
</body>
</html>
    `,
      {
        headers: { "Content-Type": "text/html" },
        status: 200,
      },
    );
  }
}

// Asset request handler - cache first with network fallback
async function handleAssetRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn("Asset request failed:", error);

    // Return empty response for failed assets
    return new Response("", { status: 404 });
  }
}

// Default request handler
async function handleDefaultRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return await fetch(request);
  } catch (error) {
    console.warn("Default request failed:", error);
    return new Response("Service Unavailable", { status: 503 });
  }
}

// Background sync for emergency data
self.addEventListener("sync", (event) => {
  if (event.tag === "emergency-sync") {
    event.waitUntil(syncEmergencyData());
  }
});

// Sync emergency data in background
async function syncEmergencyData() {
  try {
    console.log("🔄 Syncing emergency data...");

    // Update emergency services cache
    const emergencyResponse = await fetch("/api/emergency-services");
    if (emergencyResponse.ok) {
      const cache = await caches.open(EMERGENCY_CACHE);
      cache.put("/api/emergency-services", emergencyResponse);
    }

    console.log("✅ Emergency data synced");
  } catch (error) {
    console.warn("Failed to sync emergency data:", error);
  }
}

// Push notification handler for emergency alerts
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    if (data.type === "emergency") {
      event.waitUntil(
        self.registration.showNotification("🚨 Emergency Alert", {
          body: data.message || "Emergency alert received",
          icon: "/icon-emergency.png",
          badge: "/badge-emergency.png",
          tag: "emergency-alert",
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
          actions: [
            { action: "call", title: "Call 911" },
            { action: "view", title: "View Details" },
          ],
        }),
      );
    }
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "call") {
    // Open phone dialer
    event.waitUntil(clients.openWindow("tel:911"));
  } else {
    // Open app
    event.waitUntil(clients.openWindow("/"));
  }
});

// Message handler for communication with main app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_EMERGENCY_DATA") {
    event.waitUntil(
      caches.open(EMERGENCY_CACHE).then((cache) => {
        cache.put(
          "/emergency-data",
          new Response(JSON.stringify(event.data.data)),
        );
      }),
    );
  }
});

console.log("🛡️ Emergency Safety Service Worker loaded");
