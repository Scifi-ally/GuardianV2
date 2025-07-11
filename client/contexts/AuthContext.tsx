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

interface AuthContextType {
  currentUser: GuardianUser | null;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  loading: boolean;
  userProfile: UserProfile | null;
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

  async function signup(email: string, password: string, name: string) {
    try {
      setAuthAction("Creating your account...");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
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

      try {
        await setDoc(doc(db, "users", user.uid), userProfile);
        setUserProfile(userProfile);
      } catch (firestoreError) {
        console.warn(
          "Firestore write failed, using local profile:",
          firestoreError,
        );
        // Fallback: Set profile locally even if Firestore write fails
        // This allows the user to continue using the app
        setUserProfile(userProfile);

        // Store profile in localStorage as backup
        localStorage.setItem(
          `guardian_profile_${user.uid}`,
          JSON.stringify(userProfile),
        );
      }

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

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

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

      // Update in Firestore
      try {
        await updateDoc(doc(db, "users", currentUser.uid), data);
        console.log("Profile updated in Firestore");
      } catch (firestoreError) {
        console.warn(
          "Firestore update failed, using localStorage:",
          firestoreError,
        );
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

  const value = {
    currentUser,
    signup,
    login,
    logout,
    updateProfile,
    refreshProfile,
    loading,
    userProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export type { UserProfile, EmergencyContact };
