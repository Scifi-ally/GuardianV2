import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { EmergencyKeyService } from "@/services/emergencyKeyService";

interface GuardianUser extends User {
  guardianKey?: string;
}

interface UnifiedAuthContextType {
  currentUser: GuardianUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authMode: "firebase" | "demo";
  // Firebase methods
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  // Demo methods
  setDemoUser: () => void;
  // Mode switching
  switchToFirebase: () => void;
  switchToDemo: () => void;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  guardianKey: string;
  emergencyContacts: EmergencyContact[];
  createdAt: Date;
  lastActive: Date;
  phone?: string;
  location?: string;
  bio?: string;
  photoURL?: string;
}

interface EmergencyContact {
  id: string;
  guardianKey: string;
  name: string;
  phone?: string;
  priority: number;
  addedAt: Date;
  isActive: boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType>(
  {} as UnifiedAuthContextType,
);

export function useUnifiedAuth() {
  return useContext(UnifiedAuthContext);
}

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<GuardianUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"firebase" | "demo">("demo"); // Default to demo
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Debug logging
  useEffect(() => {
    console.log("🔍 UnifiedAuth State:", {
      currentUser: currentUser?.displayName,
      userProfile: userProfile?.displayName,
      loading,
      authMode,
      isOnline,
    });
  }, [currentUser, userProfile, loading, authMode, isOnline]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize auth mode based on localStorage and online status
  useEffect(() => {
    console.log("🔄 Initializing auth mode...", { isOnline });
    const savedMode = localStorage.getItem("auth_mode") as "firebase" | "demo";
    console.log("📱 Saved auth mode:", savedMode);

    if (savedMode && isOnline && savedMode === "firebase") {
      console.log("🔥 Switching to Firebase mode");
      setAuthMode("firebase");
    } else {
      console.log("🎭 Switching to demo mode");
      setAuthMode("demo");
      initializeDemoMode();
    }
  }, [isOnline]);

  // Firebase auth state listener
  useEffect(() => {
    if (authMode !== "firebase") return;

    console.log("🔥 Setting up Firebase auth listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const guardianUser = user as GuardianUser;
          setCurrentUser(guardianUser);
          try {
            await loadUserProfile(user.uid);
          } catch (profileError) {
            console.warn("Failed to load user profile:", profileError);
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (authError) {
        console.warn("Auth state change error:", authError);
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [authMode]);

  // Demo mode initialization
  const initializeDemoMode = () => {
    console.log("🎭 Initializing demo mode");
    setLoading(true);

    try {
      const savedUser = localStorage.getItem("demo_user");
      const savedProfile = localStorage.getItem("demo_profile");

      if (savedUser && savedProfile) {
        console.log("📱 Found saved demo user, loading...");
        const user = JSON.parse(savedUser);
        const profile = JSON.parse(savedProfile);
        setCurrentUser(user);
        setUserProfile(profile);
        console.log("✅ Loaded demo user from localStorage:", user.displayName);
      } else {
        console.log("🆕 No saved demo user, creating new one...");
        setDemoUser();
      }
    } catch (error) {
      console.error("❌ Error loading demo user:", error);
      console.log("🔄 Falling back to new demo user creation...");
      setDemoUser();
    } finally {
      console.log("✅ Demo mode initialization complete");
      setLoading(false);
    }
  };

  // Firebase methods
  async function signup(email: string, password: string, name: string) {
    if (authMode !== "firebase") {
      throw new Error("Firebase signup not available in demo mode");
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await updateFirebaseProfile(user, { displayName: name });

      const keyResult = await EmergencyKeyService.createGuardianKey(
        user.uid,
        name,
        user.email!,
      );

      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: name,
        guardianKey: keyResult.guardianKey || "TEMP-KEY",
        emergencyContacts: [],
        createdAt: new Date(),
        lastActive: new Date(),
      };

      try {
        await setDoc(doc(db, "users", user.uid), userProfile);
        setUserProfile(userProfile);
      } catch (firestoreError) {
        console.warn("Firestore write failed:", firestoreError);
        setUserProfile(userProfile);
        localStorage.setItem(
          `guardian_profile_${user.uid}`,
          JSON.stringify(userProfile),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    if (authMode !== "firebase") {
      throw new Error("Firebase login not available in demo mode");
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await loadUserProfile(userCredential.user.uid);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    if (authMode === "firebase") {
      await signOut(auth);
    } else {
      setCurrentUser(null);
      setUserProfile(null);
      localStorage.removeItem("demo_user");
      localStorage.removeItem("demo_profile");
    }
    console.log("✅ Logged out successfully");
  }

  async function updateProfile(data: Partial<UserProfile>) {
    if (!currentUser || !userProfile) return;

    const updatedProfile = { ...userProfile, ...data };

    if (authMode === "firebase") {
      try {
        await updateDoc(doc(db, "users", currentUser.uid), data);
      } catch (firestoreError) {
        console.warn("Firestore update failed:", firestoreError);
      }
    }

    // Always update localStorage as fallback
    localStorage.setItem(
      authMode === "firebase"
        ? `guardian_profile_${currentUser.uid}`
        : "demo_profile",
      JSON.stringify(updatedProfile),
    );

    setUserProfile(updatedProfile);
  }

  async function loadUserProfile(uid: string) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        profile.createdAt = new Date(profile.createdAt);
        profile.lastActive = new Date(profile.lastActive);
        setUserProfile(profile);

        await updateDoc(doc(db, "users", uid), { lastActive: new Date() });
      } else {
        const localProfile = localStorage.getItem(`guardian_profile_${uid}`);
        if (localProfile) {
          const profile = JSON.parse(localProfile) as UserProfile;
          profile.createdAt = new Date(profile.createdAt);
          profile.lastActive = new Date(profile.lastActive);
          setUserProfile(profile);
        }
      }
    } catch (error) {
      console.warn("Failed to load user profile:", error);
      const localProfile = localStorage.getItem(`guardian_profile_${uid}`);
      if (localProfile) {
        const profile = JSON.parse(localProfile) as UserProfile;
        profile.createdAt = new Date(profile.createdAt);
        profile.lastActive = new Date(profile.lastActive);
        setUserProfile(profile);
      }
    }
  }

  // Demo methods
  const setDemoUser = () => {
    console.log("🎭 Creating new demo user");

    const demoUser: GuardianUser = {
      uid: "demo-user-123",
      email: "demo@guardian.app",
      displayName: "Demo User",
      guardianKey: "DEMO-GUARD",
    } as GuardianUser;

    const demoProfile: UserProfile = {
      uid: demoUser.uid,
      email: demoUser.email!,
      displayName: demoUser.displayName!,
      guardianKey: demoUser.guardianKey!,
      emergencyContacts: [
        {
          id: "contact-1",
          guardianKey: "GUARD-001",
          name: "Emergency Contact 1",
          phone: "+1-555-0123",
          priority: 1,
          addedAt: new Date(),
          isActive: true,
        },
        {
          id: "contact-2",
          guardianKey: "GUARD-002",
          name: "Emergency Contact 2",
          phone: "+1-555-0456",
          priority: 2,
          addedAt: new Date(),
          isActive: true,
        },
      ],
      createdAt: new Date(),
      lastActive: new Date(),
      phone: "+1-555-DEMO",
      location: "Demo City",
      bio: "Demo user for testing Guardian app features",
    };

    console.log("👤 Setting user state:", demoUser.displayName);
    setCurrentUser(demoUser);
    setUserProfile(demoProfile);

    console.log("💾 Saving to localStorage...");
    localStorage.setItem("demo_user", JSON.stringify(demoUser));
    localStorage.setItem("demo_profile", JSON.stringify(demoProfile));

    console.log("✅ Demo user created successfully:", demoUser.displayName);
  };

  // Mode switching
  const switchToFirebase = () => {
    if (!isOnline) {
      console.warn("Cannot switch to Firebase mode while offline");
      return;
    }
    console.log("🔥 Switching to Firebase auth mode");
    setAuthMode("firebase");
    localStorage.setItem("auth_mode", "firebase");
    setCurrentUser(null);
    setUserProfile(null);
    setLoading(true);
  };

  const switchToDemo = () => {
    console.log("🎭 Switching to demo auth mode");
    setAuthMode("demo");
    localStorage.setItem("auth_mode", "demo");
    if (authMode === "firebase") {
      signOut(auth).catch(console.warn);
    }
    initializeDemoMode();
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    authMode,
    signup,
    login,
    logout,
    updateProfile,
    setDemoUser,
    switchToFirebase,
    switchToDemo,
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

export type { UserProfile, EmergencyContact };
export { useUnifiedAuth as useAuth }; // Export as useAuth for compatibility
