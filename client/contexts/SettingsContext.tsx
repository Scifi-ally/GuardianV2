import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { settingsService, UserSettings } from "@/services/settingsService";
import { toast } from "sonner";

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => Promise<void>;
  resetSettings: () => Promise<void>;
  saveAllSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  // Real-time status indicators
  isLocationTrackingActive: boolean;
  isPushNotificationsActive: boolean;
  isSessionTimeoutActive: boolean;
  isAutoLockActive: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocationTrackingActive, setIsLocationTrackingActive] =
    useState(false);
  const [isPushNotificationsActive, setIsPushNotificationsActive] =
    useState(false);
  const [isSessionTimeoutActive, setIsSessionTimeoutActive] = useState(false);
  const [isAutoLockActive, setIsAutoLockActive] = useState(false);

  // Initialize settings when user changes
  useEffect(() => {
    if (currentUser) {
      // Small delay to ensure Firebase auth is fully initialized
      const timer = setTimeout(() => {
        initializeUserSettings();
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setSettings(null);
      setLoading(false);

      // Cleanup previous user's settings
      if ((window as any).settingsUnsubscribe) {
        (window as any).settingsUnsubscribe();
        (window as any).settingsUnsubscribe = null;
      }
    }
  }, [currentUser]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      settingsService.destroy();
      if ((window as any).settingsUnsubscribe) {
        (window as any).settingsUnsubscribe();
      }
    };
  }, []);

  // Monitor browser APIs for real-time status
  useEffect(() => {
    if (!settings) return;

    // Check push notification status
    checkPushNotificationStatus();

    // Check location tracking status
    checkLocationTrackingStatus();

    // Monitor session timeout
    setIsSessionTimeoutActive(settings.sessionTimeout > 0);

    // Monitor auto lock
    setIsAutoLockActive(settings.autoLock);

    // Set up event listeners for real-time updates
    const handleLocationUpdate = () => {
      setIsLocationTrackingActive(true);
    };

    const handleSessionTimeout = () => {
      toast.warning("Session timed out. Please sign in again.");
      setIsSessionTimeoutActive(false);
    };

    const handleAutoLock = () => {
      toast.info("App locked due to inactivity");
      // Implement lock screen logic here
    };

    window.addEventListener("locationUpdate", handleLocationUpdate);
    window.addEventListener("sessionTimeout", handleSessionTimeout);
    window.addEventListener("autoLock", handleAutoLock);

    return () => {
      window.removeEventListener("locationUpdate", handleLocationUpdate);
      window.removeEventListener("sessionTimeout", handleSessionTimeout);
      window.removeEventListener("autoLock", handleAutoLock);
    };
  }, [settings]);

  const initializeUserSettings = async () => {
    if (!currentUser) {
      console.log("No current user, skipping settings initialization");
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Add delay to ensure Firebase Auth is fully ready
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      console.log("🔧 Initializing settings for user:", currentUser.uid);

      // Initialize settings with retry logic
      let retries = 3;
      let initialSettings = null;

      while (retries > 0 && !initialSettings) {
        try {
          initialSettings = await settingsService.initializeSettings(
            currentUser.uid,
          );
          break;
        } catch (error) {
          retries--;
          console.warn(
            `Settings initialization attempt failed, ${retries} retries left:`,
            error,
          );

          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      if (!initialSettings) {
        throw new Error(
          "Failed to initialize settings after multiple attempts",
        );
      }

      setSettings(initialSettings);

      // Subscribe to settings changes
      const unsubscribe = settingsService.subscribe((newSettings) => {
        setSettings(newSettings);
        console.log("Settings updated in real-time:", newSettings);
      });

      // Store unsubscribe function for cleanup
      (window as any).settingsUnsubscribe = unsubscribe;

      console.log("✅ Settings initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize settings:", error);

      // Show different error messages based on error type
      if (
        error.message?.includes("permission") ||
        error.code === "permission-denied"
      ) {
        console.warn("🔒 Firebase permissions denied, using local settings");
        toast.warning(
          "Settings syncing offline. Changes will sync when connection is restored.",
          {
            duration: 5000,
          },
        );
      } else if (
        error.message?.includes("unavailable") ||
        error.code === "unavailable"
      ) {
        console.warn("🌐 Firebase unavailable, using local settings");
        toast.info("Using offline mode. Settings will sync when online.", {
          duration: 4000,
        });
      } else {
        console.warn("⚠️ Settings initialization failed, using defaults");
        toast.error("Failed to load settings. Using defaults.", {
          action: {
            label: "Retry",
            onClick: () => {
              setTimeout(() => initializeUserSettings(), 2000);
            },
          },
        });
      }

      // Always provide fallback settings
      const defaultSettings = settingsService.getCurrentSettings();
      setSettings(defaultSettings);

      // Try to load from localStorage as additional fallback
      try {
        const localSettings = localStorage.getItem(
          `userSettings_${currentUser.uid}`,
        );
        if (localSettings) {
          const parsedSettings = JSON.parse(localSettings);
          setSettings({ ...defaultSettings, ...parsedSettings });
          console.log("📱 Loaded settings from localStorage");
        }
      } catch (localError) {
        console.warn("Failed to load from localStorage:", localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkPushNotificationStatus = async () => {
    try {
      if ("Notification" in window) {
        const permission = Notification.permission;
        setIsPushNotificationsActive(
          permission === "granted" && settings?.pushNotifications === true,
        );
      }
    } catch (error) {
      console.error("Failed to check push notification status:", error);
    }
  };

  const checkLocationTrackingStatus = async () => {
    try {
      if ("geolocation" in navigator && "permissions" in navigator) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        setIsLocationTrackingActive(
          permission.state === "granted" && settings?.locationTracking === true,
        );
      }
    } catch (error) {
      console.error("Failed to check location tracking status:", error);
    }
  };

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    if (!currentUser) {
      toast.error("Please log in to update settings");
      return;
    }

    if (!settings) {
      toast.error("Settings not loaded yet");
      return;
    }

    try {
      console.log(`🔄 Updating ${key} to:`, value);

      // Show immediate feedback with loading state
      const optimisticSettings = { ...settings, [key]: value };
      setSettings(optimisticSettings);
      setLoading(true);

      // Update in backend with better error handling
      await settingsService.updateSetting(currentUser.uid, key, value);

      // Show success feedback for all settings
      const settingName = key.replace(/([A-Z])/g, " $1").toLowerCase();
      toast.success(`✅ ${settingName} updated successfully`, {
        duration: 2000,
      });

      // Update real-time status indicators
      setTimeout(async () => {
        if (key === "pushNotifications") {
          await checkPushNotificationStatus();
        } else if (key === "locationTracking") {
          await checkLocationTrackingStatus();
        } else if (key === "sessionTimeout") {
          setIsSessionTimeoutActive((value as number) > 0);
        } else if (key === "autoLock") {
          setIsAutoLockActive(value as boolean);
        }
      }, 500);
    } catch (error) {
      console.error(`❌ Failed to update ${key}:`, error);

      // Revert optimistic update on error
      setSettings(settings);

      // Show specific error message
      let errorMessage = `Failed to update ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`;

      if (error.message?.includes("permission")) {
        errorMessage = "Permission denied. Please check your login status.";
      } else if (error.message?.includes("authentication")) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.message?.includes("Network")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
      }

      toast.error(errorMessage, {
        duration: 4000,
        action: {
          label: "Retry",
          onClick: () => updateSetting(key, value),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAllSettings = async (newSettings: Partial<UserSettings>) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      await settingsService.saveSettings(currentUser.uid, newSettings);
      toast.success("All settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      await settingsService.resetToDefaults(currentUser.uid);
      toast.success("Settings reset to defaults");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("Failed to reset settings");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: SettingsContextType = {
    settings,
    loading,
    updateSetting,
    resetSettings,
    saveAllSettings,
    isLocationTrackingActive,
    isPushNotificationsActive,
    isSessionTimeoutActive,
    isAutoLockActive,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook for checking specific setting status
export function useSettingStatus(settingKey: keyof UserSettings) {
  const { settings } = useSettings();
  return settings?.[settingKey];
}

// Hook for watching specific setting changes
export function useSettingWatch<K extends keyof UserSettings>(
  settingKey: K,
  callback: (value: UserSettings[K]) => void,
) {
  const { settings } = useSettings();

  useEffect(() => {
    if (settings && settings[settingKey] !== undefined) {
      callback(settings[settingKey]);
    }
  }, [settings, settingKey, callback]);
}
