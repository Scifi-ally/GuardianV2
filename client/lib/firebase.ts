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

// Initialize Firebase with error handling
export let app: FirebaseApp;
export let auth: Auth;
export let db: Firestore;

try {
  app = initializeApp(firebaseConfig);

  // Initialize Firebase services with retry logic
  auth = getAuth(app);
  db = getFirestore(app);

  // Configure Firebase settings for better network handling
  auth.settings.appVerificationDisabledForTesting = false;

  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error);
  throw new Error(
    "Failed to initialize Firebase. Please check your configuration.",
  );
}

// Initialize messaging only if supported
export const getMessagingInstance = async () => {
  if (await isSupported()) {
    return getMessaging(app);
  }
  return null;
};

export default app;
