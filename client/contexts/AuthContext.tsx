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
  updateProfile,
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

function generateGuardianKey(): string {
  // Generate a unique 8-character alphanumeric key
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<GuardianUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authAction, setAuthAction] = useState<string>("");

  async function signup(email: string, password: string, name: string) {
    setAuthAction("Creating your account...");

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    setAuthAction("Setting up your profile...");

    // Update the user's display name
    await updateProfile(user, { displayName: name });

    setAuthAction("Generating your Guardian key...");

    // Generate unique guardian key
    const guardianKey = generateGuardianKey();

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
  }

  async function login(email: string, password: string) {
    setAuthAction("Signing you in...");

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    setAuthAction("Loading your profile...");
    await loadUserProfile(userCredential.user.uid);
    setAuthAction("");
  }

  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  async function loadUserProfile(uid: string) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
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
          const fallbackProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || "Guardian User",
            guardianKey: generateGuardianKey(),
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const guardianUser = user as GuardianUser;
        setCurrentUser(guardianUser);
        await loadUserProfile(user.uid);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
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
