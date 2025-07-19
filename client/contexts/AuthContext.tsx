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
import { auth, db, safeFirebaseOperation } from "@/lib/enhancedFirebase";
import { EmergencyKeyService } from "@/services/emergencyKeyService";
import { enhancedFirebaseService } from "@/services/enhancedFirebaseService";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { voiceCommandService } from "@/services/voiceCommandService";
import { notifications } from "@/services/enhancedNotificationService";

interface GuardianUser extends User {
  guardianKey?: string;
}

interface AuthContextType {
  currentUser: GuardianUser | null;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  loading: boolean;
  userProfile: UserProfile | null;
  isOnline: boolean;
  lastSyncTime: Date | null;
  signInAnonymously: () => Promise<void>;
  enableRealtimeFeatures: () => Promise<void>;
  disableRealtimeFeatures: () => void;
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
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  priority: number;
  guardianKey?: string;
  isVerified: boolean;
  canShareLocation: boolean;
  lastContacted?: Date;
  addedAt?: Date;
  isActive?: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

// Guardian key generation is now handled by EmergencyKeyService

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<GuardianUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authAction, setAuthAction] = useState<string>("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [realtimeFeaturesEnabled, setRealtimeFeaturesEnabled] = useState(false);

  async function signup(email: string, password: string, name: string) {
    try {
      setAuthAction("Creating your account...");

      // Add timeout wrapper for Firebase auth calls
      const userCredential = (await Promise.race([
        createUserWithEmailAndPassword(auth, email, password),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("auth/network-request-failed")),
            15000,
          ),
        ),
      ])) as any;
      const user = userCredential.user;

      setAuthAction("Setting up your profile...");

      // Update the user's display name
      await updateFirebaseProfile(user, { displayName: name });

      setAuthAction("Generating your Guardian key...");

      // Generate unique guardian key using EmergencyKeyService
      const keyResult = await EmergencyKeyService.createGuardianKey(
        user.uid,
        name,
        user.email!,
      );

      const guardianKey = keyResult.guardianKey || "TEMP-KEY";

      setAuthAction("Finalizing setup...");

      // Create user profile in Firestore with error handling
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: name,
        guardianKey,
        emergencyContacts: [],
        createdAt: new Date(),
        lastActive: new Date(),
      };

      await safeFirebaseOperation(
        async () => {
          await setDoc(doc(db, "users", user.uid), userProfile);
          setUserProfile(userProfile);
        },
        () => {
          // Fallback: Set profile locally if Firestore write fails
          console.warn("Using local profile fallback");
          setUserProfile(userProfile);
          // Store profile in localStorage as backup
          localStorage.setItem(
            `guardian_profile_${user.uid}`,
            JSON.stringify(userProfile),
          );
        },
        "Create user profile",
      );

      setAuthAction("");
    } catch (signupError) {
      console.error("Signup error:", signupError);
      setAuthAction("");
      throw signupError;
    }
  }

  async function login(email: string, password: string) {
    try {
      setAuthAction("Signing you in...");

      // Add timeout wrapper for Firebase auth calls
      const userCredential = (await Promise.race([
        signInWithEmailAndPassword(auth, email, password),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("auth/network-request-failed")),
            15000,
          ),
        ),
      ])) as any;

      setAuthAction("Loading your profile...");
      try {
        await loadUserProfile(userCredential.user.uid);
      } catch (profileError) {
        console.warn("Failed to load profile during login:", profileError);
        // Continue with login even if profile loading fails
      }
      setAuthAction("");
    } catch (loginError) {
      console.error("Login error:", loginError);
      setAuthAction("");
      throw loginError;
    }
  }

  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  async function updateProfile(data: Partial<UserProfile>) {
    if (!currentUser || !userProfile) return;

    try {
      const updatedProfile = { ...userProfile, ...data };

      // Filter out undefined values before sending to Firestore
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(
          ([_, value]) => value !== undefined && value !== null,
        ),
      );

      // Update in Firestore only if there's valid data
      if (Object.keys(filteredData).length > 0) {
        await safeFirebaseOperation(
          async () => {
            await updateDoc(doc(db, "users", currentUser.uid), filteredData);
            console.log("Profile updated in Firestore");
          },
          () => {
            console.warn(
              "Firestore update failed, using localStorage fallback",
            );
          },
          "Update user profile",
        );
      } else {
        console.log("No valid data to update in Firestore");
      }

      // Update localStorage as fallback
      localStorage.setItem(
        `guardian_profile_${currentUser.uid}`,
        JSON.stringify(updatedProfile),
      );

      // Update local state
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  async function loadUserProfile(uid: string) {
    // Skip Firebase calls if offline
    if (!isOnline) {
      console.log("Offline mode: Loading profile from localStorage only");
      const localProfile = localStorage.getItem(`guardian_profile_${uid}`);
      if (localProfile) {
        const profile = JSON.parse(localProfile) as UserProfile;
        profile.createdAt = new Date(profile.createdAt);
        profile.lastActive = new Date(profile.lastActive);
        setUserProfile(profile);
      }
      return;
    }

    try {
      // Add timeout and better error handling for Firebase calls
      const userDoc = (await Promise.race([
        getDoc(doc(db, "users", uid)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Firebase timeout")), 8000),
        ),
      ])) as any;
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        // Convert Firestore timestamps to Date objects
        profile.createdAt =
          profile.createdAt instanceof Date
            ? profile.createdAt
            : new Date(profile.createdAt);
        profile.lastActive =
          profile.lastActive instanceof Date
            ? profile.lastActive
            : new Date(profile.lastActive);

        // Merge emergency contacts from localStorage if they exist
        const localContacts = JSON.parse(
          localStorage.getItem(`guardian_contacts_${uid}`) || "[]",
        );
        if (localContacts.length > 0) {
          // Convert dates and merge unique contacts
          const existingIds = new Set(
            profile.emergencyContacts?.map((c) => c.id) || [],
          );
          const uniqueLocalContacts = localContacts
            .map((contact: any) => ({
              ...contact,
              addedAt: new Date(contact.addedAt),
            }))
            .filter(
              (contact: EmergencyContact) => !existingIds.has(contact.id),
            );

          profile.emergencyContacts = [
            ...(profile.emergencyContacts || []),
            ...uniqueLocalContacts,
          ];
        }

        setUserProfile(profile);

        // Update last active timestamp (ignore errors)
        try {
          await updateDoc(doc(db, "users", uid), {
            lastActive: new Date(),
          });
        } catch (updateError) {
          console.warn("Failed to update last active timestamp:", updateError);
        }
      } else {
        // Try to load from localStorage as fallback
        const localProfile = localStorage.getItem(`guardian_profile_${uid}`);
        if (localProfile) {
          console.log("Loading profile from localStorage");
          const profile = JSON.parse(localProfile) as UserProfile;
          profile.createdAt = new Date(profile.createdAt);
          profile.lastActive = new Date(profile.lastActive);
          setUserProfile(profile);
        }
      }
    } catch (firestoreError) {
      console.warn(
        "Firestore read failed, trying localStorage:",
        firestoreError,
      );

      // Fallback to localStorage
      const localProfile = localStorage.getItem(`guardian_profile_${uid}`);
      if (localProfile) {
        const profile = JSON.parse(localProfile) as UserProfile;
        profile.createdAt = new Date(profile.createdAt);
        profile.lastActive = new Date(profile.lastActive);
        setUserProfile(profile);
      } else {
        // Create a minimal profile if nothing exists
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Try to create guardian key, fallback to temporary key if fails
          const keyResult = await EmergencyKeyService.createGuardianKey(
            currentUser.uid,
            currentUser.displayName || "Guardian User",
            currentUser.email || "",
          );

          const fallbackProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || "Guardian User",
            guardianKey: keyResult.guardianKey || "TEMP-KEY",
            emergencyContacts: [],
            createdAt: new Date(),
            lastActive: new Date(),
          };
          setUserProfile(fallbackProfile);
          localStorage.setItem(
            `guardian_profile_${uid}`,
            JSON.stringify(fallbackProfile),
          );
        }
      }
    }
  }

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const guardianUser = user as GuardianUser;
          setCurrentUser(guardianUser);
          try {
            await loadUserProfile(user.uid);
          } catch (profileError) {
            console.warn(
              "Failed to load user profile, continuing with auth:",
              profileError,
            );
            // Continue with basic auth even if profile loading fails
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (authError) {
        console.warn("Auth state change error:", authError);
        // Continue with default state
        setCurrentUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function refreshProfile(): Promise<void> {
    if (currentUser) {
      await loadUserProfile(currentUser.uid);
    }
  }

  async function signInAnonymously(): Promise<void> {
    try {
      setAuthAction("Signing in anonymously...");
      await enhancedFirebaseService.signInAnonymously();

      notifications.success({
        title: "Anonymous Sign-In",
        description: "You can now use emergency features without an account",
        vibrate: true,
      });
    } catch (error) {
      console.error("Anonymous sign-in failed:", error);
      notifications.error({
        title: "Sign-In Failed",
        description: "Unable to sign in anonymously",
      });
      throw error;
    } finally {
      setAuthAction("");
    }
  }

  async function enableRealtimeFeatures(): Promise<void> {
    try {
      if (!currentUser) {
        await signInAnonymously();
      }

      // Start location tracking
      await enhancedLocationService.startTracking();

      // Enable voice commands if supported
      if (voiceCommandService.isSupported) {
        await voiceCommandService.enableVoiceCommands();
      }

      setRealtimeFeaturesEnabled(true);
      setLastSyncTime(new Date());

      // Real-time features toast removed - silent operation
    } catch (error) {
      console.error("Failed to enable real-time features:", error);
      notifications.error({
        title: "Real-time Features Failed",
        description: "Some features may not be available",
      });
    }
  }

  function disableRealtimeFeatures(): void {
    enhancedLocationService.stopTracking();
    voiceCommandService.disableVoiceCommands();
    setRealtimeFeaturesEnabled(false);

    // Real-time features disabled toast removed - silent operation
  }

  // Monitor connection status and sync when online
  useEffect(() => {
    if (isOnline && currentUser && !lastSyncTime) {
      setLastSyncTime(new Date());
    }
  }, [isOnline, currentUser]);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    updateProfile,
    refreshProfile,
    loading,
    userProfile,
    isOnline,
    lastSyncTime,
    signInAnonymously,
    enableRealtimeFeatures,
    disableRealtimeFeatures,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export type { UserProfile, EmergencyContact };
