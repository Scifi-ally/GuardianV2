import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCXYW5NmxOb5oUonMXwAsv9hsOvPG-A5-E",
  authDomain: "guardian-e8427.firebaseapp.com",
  projectId: "guardian-e8427",
  storageBucket: "guardian-e8427.firebasestorage.app",
  messagingSenderId: "426043954292",
  appId: "1:426043954292:web:bac909b132dd1c32476d21",
  measurementId: "G-52Q14EBP7C",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize messaging only if supported
export const getMessagingInstance = async () => {
  if (await isSupported()) {
    return getMessaging(app);
  }
  return null;
};

export default app;
