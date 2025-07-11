// Service Worker for Guardian Safety App
const CACHE_NAME = "guardian-v1";
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
];

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    }),
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event (cache-first strategy)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    }),
  );
});

// Push event for notifications
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  const options = {
    body: event.data ? event.data.text() : "Emergency alert from Guardian",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Details",
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icon-192x192.png",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Guardian Safety Alert", options),
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);
  event.notification.close();

  if (event.action === "explore") {
    // Open the app
    event.waitUntil(clients.openWindow("/"));
  }
});

// Background sync for offline functionality
self.addEventListener("sync", (event) => {
  console.log("Background sync:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

// Background sync implementation
async function doBackgroundSync() {
  try {
    console.log("Performing background sync...");

    // Sync any pending data
    const pendingData = await getStoredData("pendingSync");
    if (pendingData && pendingData.length > 0) {
      for (const item of pendingData) {
        await syncDataItem(item);
      }
      await clearStoredData("pendingSync");
    }

    // Update location if tracking is enabled
    const settings = await getStoredData("userSettings");
    if (settings && settings.locationTracking) {
      await updateLocationInBackground();
    }

    console.log("Background sync completed");
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Helper functions
async function getStoredData(key) {
  try {
    const result = await new Promise((resolve) => {
      const request = indexedDB.open("GuardianDB", 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["data"], "readonly");
        const store = transaction.objectStore("data");
        const getRequest = store.get(key);
        getRequest.onsuccess = () => resolve(getRequest.result?.value);
      };
      request.onerror = () => resolve(null);
    });
    return result;
  } catch (error) {
    return null;
  }
}

async function clearStoredData(key) {
  try {
    await new Promise((resolve) => {
      const request = indexedDB.open("GuardianDB", 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["data"], "readwrite");
        const store = transaction.objectStore("data");
        store.delete(key);
        transaction.oncomplete = () => resolve();
      };
    });
  } catch (error) {
    console.error("Failed to clear stored data:", error);
  }
}

async function syncDataItem(item) {
  try {
    // Sync individual data items to server
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error("Sync failed");
    }

    console.log("Data item synced:", item.id);
  } catch (error) {
    console.error("Failed to sync data item:", error);
    throw error;
  }
}

async function updateLocationInBackground() {
  try {
    // Get current position
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      });
    });

    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString(),
    };

    // Store location for later sync
    await storeData("lastLocation", locationData);

    console.log("Location updated in background:", locationData);
  } catch (error) {
    console.error("Background location update failed:", error);
  }
}

async function storeData(key, value) {
  try {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("GuardianDB", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("data")) {
          db.createObjectStore("data", { keyPath: "key" });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["data"], "readwrite");
        const store = transaction.objectStore("data");
        store.put({ key, value });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to store data:", error);
  }
}

// Periodic background tasks
setInterval(
  () => {
    if (self.registration.active) {
      console.log("Service worker background task running...");
      // Perform periodic tasks here
    }
  },
  5 * 60 * 1000,
); // Every 5 minutes
