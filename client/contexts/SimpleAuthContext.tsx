import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface User {
  uid: string;
  email: string;
  displayName: string;
  guardianKey?: string;
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

interface SimpleAuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  setDemoUser: () => void;
  logout: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType>(
  {} as SimpleAuthContextType,
);

export function useSimpleAuth() {
  return useContext(SimpleAuthContext);
}

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Start as loading

  // Debug logging
  useEffect(() => {
    console.log("🔍 SimpleAuth State:", {
      currentUser: currentUser?.displayName,
      userProfile: userProfile?.displayName,
      loading,
    });
  }, [currentUser, userProfile, loading]);

  const setDemoUser = () => {
    console.log("🎭 Setting demo user for offline functionality");
    setLoading(true);

    const demoUser: User = {
      uid: "demo-user-123",
      email: "demo@guardian.app",
      displayName: "Demo User",
      guardianKey: "DEMO-GUARDIAN-2024",
    };

    const demoProfile: UserProfile = {
      uid: demoUser.uid,
      email: demoUser.email,
      displayName: demoUser.displayName,
      guardianKey: demoUser.guardianKey!,
      emergencyContacts: [
        {
          id: "contact-1",
          guardianKey: "GUARD-CONTACT-1",
          name: "Emergency Contact 1",
          phone: "+1-555-0123",
          priority: 1,
          addedAt: new Date(),
          isActive: true,
        },
        {
          id: "contact-2",
          guardianKey: "GUARD-CONTACT-2",
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
      bio: "Demo user for testing the Guardian safety app",
    };

    setCurrentUser(demoUser);
    setUserProfile(demoProfile);

    // Store in localStorage for persistence
    localStorage.setItem("demo_user", JSON.stringify(demoUser));
    localStorage.setItem("demo_profile", JSON.stringify(demoProfile));

    setLoading(false);
    console.log("✅ Demo user set and loading completed");
  };

  const logout = () => {
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem("demo_user");
    localStorage.removeItem("demo_profile");
  };

  // Load demo user from localStorage on startup
  useEffect(() => {
    console.log("🔄 Initializing SimpleAuth...");
    try {
      const savedUser = localStorage.getItem("demo_user");
      const savedProfile = localStorage.getItem("demo_profile");

      if (savedUser && savedProfile) {
        setCurrentUser(JSON.parse(savedUser));
        setUserProfile(JSON.parse(savedProfile));
        setLoading(false);
        console.log("✅ Loaded demo user from localStorage");
      } else {
        // Auto-set demo user for immediate functionality
        console.log("🔄 No saved user, creating demo user...");
        setDemoUser();
      }
    } catch (error) {
      console.error("Error loading demo user:", error);
      // Fallback to fresh demo user
      setDemoUser();
    }
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    setDemoUser,
    logout,
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export default SimpleAuthProvider;
