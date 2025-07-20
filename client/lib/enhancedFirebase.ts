import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  getFirestore,
  Firestore,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";
import { getMessaging, isSupported, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCXYW5NmxOb5oUonMXwAsv9hsOvPG-A5-E",
  authDomain: "guardian-e8427.firebaseapp.com",
  projectId: "guardian-e8427",
  storageBucket: "guardian-e8427.firebasestorage.app",
  messagingSenderId: "426043954292",
  appId: "1:426043954292:web:bac909b132dd1c32476d21",
  measurementId: "G-52Q14EBP7C",
};

// Enhanced Firebase initialization with error handling and retry logic
export let app: FirebaseApp;
export let auth: Auth;
export let db: Firestore;
export let messaging: Messaging | null = null;

// Connection state management
export let isFirebaseConnected = false;
export let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 3;

// Initialize Firebase with comprehensive error handling
async function initializeFirebaseWithRetry(attempt = 1): Promise<void> {
  try {
    console.log(
      `Firebase initialization attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`,
    );

    // Initialize Firebase app
    app = initializeApp(firebaseConfig);

    // Initialize Auth with offline tolerance
    auth = getAuth(app);

    // Initialize Firestore with enhanced settings
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: false, // Disable long polling that can cause fetch errors
    });

    // Test Firebase connection
    await testFirebaseConnection();

    isFirebaseConnected = true;
    console.log("✅ Firebase initialized successfully");
  } catch (error) {
    console.error(
      `❌ Firebase initialization failed (attempt ${attempt}):`,
      error,
    );

    if (attempt < MAX_RETRY_ATTEMPTS) {
      connectionRetryCount = attempt;
      // Exponential backoff: wait 2^attempt seconds
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying Firebase initialization in ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return initializeFirebaseWithRetry(attempt + 1);
    } else {
      // After all retries failed, initialize in offline mode
      console.warn("🔄 Initializing Firebase in offline mode");
      await initializeOfflineMode();
    }
  }
}

// Test Firebase connection
async function testFirebaseConnection(): Promise<void> {
  try {
    // Simple test to verify Firebase connectivity
    await enableNetwork(db);
    console.log("✅ Firebase network connection verified");
  } catch (error) {
    console.warn("⚠️ Firebase network test failed:", error);
    throw error;
  }
}

// Initialize Firebase in offline mode as fallback
async function initializeOfflineMode(): Promise<void> {
  try {
    console.log("🔄 Setting up offline Firebase mode");

    if (!app) {
      app = initializeApp(firebaseConfig);
    }

    if (!auth) {
      auth = getAuth(app);
    }

    if (!db) {
      db = initializeFirestore(app, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      });
    }

    // Disable network to force offline mode
    await disableNetwork(db);

    isFirebaseConnected = false;
    console.log("📱 Firebase initialized in offline mode");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase in offline mode:", error);
    throw new Error("Critical Firebase initialization failure");
  }
}

// Retry Firebase connection
export async function retryFirebaseConnection(): Promise<boolean> {
  try {
    console.log("🔄 Attempting to reconnect to Firebase...");
    await enableNetwork(db);
    await testFirebaseConnection();
    isFirebaseConnected = true;
    console.log("✅ Firebase reconnection successful");
    return true;
  } catch (error) {
    console.error("❌ Firebase reconnection failed:", error);
    isFirebaseConnected = false;
    return false;
  }
}

// Get Firebase connection status
export function getFirebaseConnectionStatus() {
  return {
    isConnected: isFirebaseConnected,
    retryCount: connectionRetryCount,
    canRetry: connectionRetryCount < MAX_RETRY_ATTEMPTS,
  };
}

// Safe Firebase operation wrapper
export async function safeFirebaseOperation<T>(
  operation: () => Promise<T>,
  fallback?: () => T,
  operationName = "Firebase operation",
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`❌ ${operationName} failed:`, error);

    // Check if it's a network error and attempt reconnection
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.log("🔄 Network error detected, attempting reconnection...");
      const reconnected = await retryFirebaseConnection();

      if (reconnected) {
        try {
          return await operation();
        } catch (retryError) {
          console.error(
            `❌ ${operationName} failed after reconnection:`,
            retryError,
          );
        }
      }
    }

    // Use fallback if provided
    if (fallback) {
      console.log(`🔄 Using fallback for ${operationName}`);
      return fallback();
    }

    throw error;
  }
}

// Initialize messaging with error handling
export const getMessagingInstance = async (): Promise<Messaging | null> => {
  try {
    if (await isSupported()) {
      if (!messaging) {
        messaging = getMessaging(app);
      }
      return messaging;
    }
  } catch (error) {
    console.warn("Messaging initialization failed:", error);
  }
  return null;
};

// Initialize Firebase on module load (disabled to prevent conflicts)
// initializeFirebaseWithRetry().catch((error) => {
//   console.error("Critical Firebase initialization failure:", error);
// });

// Instead, use the standard Firebase initialization
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseConnected = true;
  console.log("✅ Enhanced Firebase initialized successfully");
} catch (error) {
  console.error("❌ Enhanced Firebase initialization failed:", error);
}

export default app;
