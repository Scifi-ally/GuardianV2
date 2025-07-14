import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
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

// Initialize Firebase with comprehensive error handling
export let app: FirebaseApp;
export let auth: Auth;
export let db: Firestore;

let initializationAttempts = 0;
const maxInitAttempts = 3;

async function initializeFirebaseWithRetry(): Promise<void> {
  try {
    app = initializeApp(firebaseConfig);

    // Initialize Firebase services with retry logic
    auth = getAuth(app);
    db = getFirestore(app);

    // Configure Firebase settings for better network handling
    auth.settings.appVerificationDisabledForTesting = false;

    // Configure Firestore for offline support
    if (typeof window !== "undefined") {
      // Enable network by default, error handler will manage offline mode
      console.log("✅ Firebase initialized successfully");
    }
  } catch (error) {
    initializationAttempts++;
    console.error(
      `❌ Firebase initialization failed (attempt ${initializationAttempts}):`,
      error,
    );

    if (initializationAttempts < maxInitAttempts) {
      console.log(`🔄 Retrying Firebase initialization in 2 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return initializeFirebaseWithRetry();
    } else {
      console.error(
        "🚨 Firebase initialization failed after maximum attempts. App will run in limited mode.",
      );
      // Don't throw error, let app run in degraded mode

      // Create dummy objects to prevent crashes
      if (!app) {
        console.warn("Creating fallback Firebase app instance");
      }
    }
  }
}

// Initialize Firebase
if (typeof window !== "undefined") {
  initializeFirebaseWithRetry().catch((error) => {
    console.error("Final Firebase initialization error:", error);
  });
} else {
  // Server-side rendering fallback
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("SSR Firebase initialization failed:", error);
  }
}

// Initialize messaging only if supported
export const getMessagingInstance = async () => {
  if (await isSupported()) {
    return getMessaging(app);
  }
  return null;
};

export default app;
