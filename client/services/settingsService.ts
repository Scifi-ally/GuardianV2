import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";

export interface UserSettings {
  // Privacy Settings
  profileVisibility: "public" | "contacts" | "private";
  locationTracking: boolean;

  // Notification Settings
  pushNotifications: boolean;
  emergencyAlerts: boolean;

  // Security Settings
  sessionTimeout: number; // minutes
  autoLock: boolean;

  // Emergency Settings
  emergencyTimeout: number; // seconds
  autoShareLocation: boolean;

  // Metadata
  lastUpdated: Date;
  version: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  profileVisibility: "contacts",
  locationTracking: true,
  pushNotifications: true,
  emergencyAlerts: true,
  sessionTimeout: 30,
  autoLock: true,
  emergencyTimeout: 5,
  autoShareLocation: true,
  lastUpdated: new Date(),
  version: "1.0.0",
};

class SettingsService {
  private listeners: Map<string, (settings: UserSettings) => void> = new Map();
  private currentSettings: UserSettings = { ...DEFAULT_SETTINGS };
  private unsubscribeFirestore: (() => void) | null = null;

  // Initialize settings for user
  async initializeSettings(userId: string): Promise<UserSettings> {
    if (!userId) {
      console.warn("No userId provided for settings initialization");
      return DEFAULT_SETTINGS;
    }

    try {
      // Wait for authentication to be ready
      await new Promise<void>((resolve) => {
        if (auth.currentUser && auth.currentUser.uid === userId) {
          resolve();
          return;
        }

        const unsubscribe = auth.onAuthStateChanged((user) => {
          if (user && user.uid === userId) {
            unsubscribe();
            resolve();
          }
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 5000);
      });

      // Check if user is authenticated
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        console.warn(
          "User not authenticated or user ID mismatch, using default settings",
        );
        this.currentSettings = { ...DEFAULT_SETTINGS };
        return this.currentSettings;
      }

      console.log("Initializing settings for user:", userId);

      // Ensure Firestore is ready
      if (!db) {
        throw new Error("Firestore database not initialized");
      }

      // Get settings from Firestore
      const settingsDoc = await getDoc(doc(db, "userSettings", userId));

      if (settingsDoc.exists()) {
        const firestoreSettings = settingsDoc.data() as UserSettings;
        this.currentSettings = {
          ...DEFAULT_SETTINGS,
          ...firestoreSettings,
          lastUpdated: firestoreSettings.lastUpdated?.toDate?.() || new Date(),
        };
        console.log("✅ Settings loaded from Firestore");
      } else {
        console.log("No settings found, creating default settings");
        // Create default settings with better error handling
        try {
          await setDoc(doc(db, "userSettings", userId), DEFAULT_SETTINGS);
          console.log("✅ Default settings created successfully");
        } catch (createError) {
          console.warn(
            "Failed to create settings in Firestore, using local defaults:",
            createError,
          );
        }
        this.currentSettings = { ...DEFAULT_SETTINGS };
      }

      // Set up real-time listener
      this.setupRealtimeListener(userId);

      // Apply settings to browser/device
      await this.applySettings(this.currentSettings);

      return this.currentSettings;
    } catch (error) {
      console.error("Failed to initialize settings:", error);

      // Check if it's a permissions error
      if (error.code === "permission-denied") {
        console.warn(
          "Permission denied for settings. Using default settings and retrying...",
        );

        // Try to apply local settings without Firestore
        this.currentSettings = { ...DEFAULT_SETTINGS };
        await this.applySettings(this.currentSettings);

        // Set up a retry mechanism
        setTimeout(() => {
          if (auth.currentUser) {
            console.log("Retrying settings initialization...");
            this.initializeSettings(userId).catch(console.warn);
          }
        }, 2000);
      }

      return DEFAULT_SETTINGS;
    }
  }

  // Set up real-time Firestore listener
  private setupRealtimeListener(userId: string) {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }

    this.unsubscribeFirestore = onSnapshot(
      doc(db, "userSettings", userId),
      (doc) => {
        if (doc.exists()) {
          const settings = doc.data() as UserSettings;
          this.currentSettings = {
            ...settings,
            lastUpdated: settings.lastUpdated?.toDate?.() || new Date(),
          };

          // Apply settings immediately
          this.applySettings(this.currentSettings);

          // Notify all listeners
          this.listeners.forEach((callback) => callback(this.currentSettings));
        }
      },
      (error) => {
        console.error("Settings listener error:", error);
      },
    );
  }

  // Save settings to Firestore
  async saveSettings(
    userId: string,
    settings: Partial<UserSettings>,
  ): Promise<void> {
    if (!userId || !auth.currentUser) {
      console.warn("Cannot save settings: user not authenticated");
      throw new Error("User not authenticated");
    }

    const updatedSettings = {
      ...this.currentSettings,
      ...settings,
      lastUpdated: new Date(),
    };

    // Always save to localStorage first as backup
    try {
      localStorage.setItem(
        `userSettings_${userId}`,
        JSON.stringify(updatedSettings),
      );
      console.log("💾 Settings backed up to localStorage");
    } catch (localError) {
      console.warn("Failed to backup settings to localStorage:", localError);
    }

    try {
      console.log("💾 Saving settings to Firestore for user:", userId);
      await setDoc(doc(db, "userSettings", userId), updatedSettings, {
        merge: true,
      });

      this.currentSettings = updatedSettings;
      console.log("✅ Settings saved successfully to Firestore");

      // Apply settings immediately
      await this.applySettings(updatedSettings);
    } catch (error) {
      console.error("❌ Failed to save settings to Firestore:", error);

      // Update local settings even if Firestore fails
      this.currentSettings = updatedSettings;
      await this.applySettings(updatedSettings);

      if (error.code === "permission-denied") {
        console.warn("🔒 Permission denied, settings saved locally only");
        // Don't throw error, continue with local settings
        return;
      }

      // For other errors, still don't throw to allow app to continue
      console.warn("⚠️ Settings saved locally only due to:", error.message);
    }
  }

  // Update specific setting
  async updateSetting<K extends keyof UserSettings>(
    userId: string,
    key: K,
    value: UserSettings[K],
  ): Promise<void> {
    if (!userId || !auth.currentUser) {
      console.warn("Cannot update setting: user not authenticated");
      throw new Error("User not authenticated");
    }

    try {
      const updates = { [key]: value, lastUpdated: new Date() };
      console.log(`Updating setting ${key} to:`, value);

      await updateDoc(doc(db, "userSettings", userId), updates);
      console.log(`✅ Setting ${key} updated successfully`);
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);

      if (error.code === "permission-denied") {
        throw new Error(
          `Permission denied when updating ${key}. Please make sure you are logged in.`,
        );
      }

      throw error;
    }
  }

  // Apply settings to browser/device APIs
  private async applySettings(settings: UserSettings): Promise<void> {
    try {
      // Apply notification settings
      if (settings.pushNotifications) {
        await this.enablePushNotifications();
      } else {
        this.disablePushNotifications();
      }

      // Apply location tracking
      if (settings.locationTracking) {
        await this.enableLocationTracking();
      } else {
        this.disableLocationTracking();
      }

      // Apply session timeout
      this.setSessionTimeout(settings.sessionTimeout);

      // Apply auto lock
      if (settings.autoLock) {
        this.enableAutoLock();
      } else {
        this.disableAutoLock();
      }

      console.log("✅ Settings applied successfully");
    } catch (error) {
      console.error("Failed to apply settings:", error);
    }
  }

  // Push notification implementation
  private async enablePushNotifications(): Promise<void> {
    try {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          console.log("✅ Push notifications enabled");

          // Register service worker for push notifications
          if ("serviceWorker" in navigator) {
            const registration =
              await navigator.serviceWorker.register("/sw.js");
            console.log("Service worker registered:", registration);
          }
        }
      }
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
    }
  }

  private disablePushNotifications(): void {
    console.log("🔕 Push notifications disabled");
  }

  // Location tracking implementation
  private async enableLocationTracking(): Promise<void> {
    try {
      if ("geolocation" in navigator) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        if (permission.state === "granted") {
          console.log("✅ Location tracking enabled");
          this.startLocationTracking();
        } else {
          // Request permission
          navigator.geolocation.getCurrentPosition(
            () => {
              console.log("✅ Location permission granted");
              this.startLocationTracking();
            },
            (error) => {
              console.warn("Location permission denied:", error);
            },
          );
        }
      }
    } catch (error) {
      console.error("Failed to enable location tracking:", error);
    }
  }

  private disableLocationTracking(): void {
    console.log("📍 Location tracking disabled");
    if ((window as any).locationWatchId) {
      navigator.geolocation.clearWatch((window as any).locationWatchId);
      (window as any).locationWatchId = null;
    }
  }

  private startLocationTracking(): void {
    if ("geolocation" in navigator) {
      (window as any).locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
          // Update location in background
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
          };

          // Store in localStorage for quick access
          localStorage.setItem(
            "lastKnownLocation",
            JSON.stringify(locationData),
          );

          // Dispatch custom event for real-time updates
          window.dispatchEvent(
            new CustomEvent("locationUpdate", {
              detail: locationData,
            }),
          );
        },
        (error) => {
          console.warn("Location tracking error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute
        },
      );
    }
  }

  // Session timeout implementation
  private setSessionTimeout(minutes: number): void {
    // Clear existing timeout
    if ((window as any).sessionTimeoutId) {
      clearTimeout((window as any).sessionTimeoutId);
    }

    // Set new timeout
    (window as any).sessionTimeoutId = setTimeout(
      () => {
        console.log("🔐 Session timed out");

        // Dispatch session timeout event
        window.dispatchEvent(new CustomEvent("sessionTimeout"));

        // Auto logout
        if (auth.currentUser) {
          auth.signOut();
        }
      },
      minutes * 60 * 1000,
    );

    console.log(`⏱️ Session timeout set to ${minutes} minutes`);
  }

  // Auto lock implementation
  private enableAutoLock(): void {
    let idleTimer: NodeJS.Timeout;
    const lockTimeout = 5 * 60 * 1000; // 5 minutes

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        console.log("🔒 Auto lock triggered");
        window.dispatchEvent(new CustomEvent("autoLock"));
      }, lockTimeout);
    };

    // Track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    // Store cleanup function
    (window as any).autoLockCleanup = () => {
      clearTimeout(idleTimer);
      events.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer, true);
      });
    };

    resetIdleTimer();
    console.log("🔒 Auto lock enabled");
  }

  private disableAutoLock(): void {
    if ((window as any).autoLockCleanup) {
      (window as any).autoLockCleanup();
      (window as any).autoLockCleanup = null;
    }
    console.log("🔓 Auto lock disabled");
  }

  // Subscribe to settings changes
  subscribe(callback: (settings: UserSettings) => void): () => void {
    const id = Math.random().toString(36);
    this.listeners.set(id, callback);

    // Immediately call with current settings
    callback(this.currentSettings);

    return () => {
      this.listeners.delete(id);
    };
  }

  // Get current settings
  getCurrentSettings(): UserSettings {
    return { ...this.currentSettings };
  }

  // Reset to defaults
  async resetToDefaults(userId: string): Promise<void> {
    await this.saveSettings(userId, DEFAULT_SETTINGS);
  }

  // Cleanup
  destroy(): void {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }
    this.listeners.clear();

    // Cleanup browser APIs
    if ((window as any).autoLockCleanup) {
      (window as any).autoLockCleanup();
    }
    if ((window as any).sessionTimeoutId) {
      clearTimeout((window as any).sessionTimeoutId);
    }
    if ((window as any).locationWatchId) {
      navigator.geolocation.clearWatch((window as any).locationWatchId);
    }
  }
}

export const settingsService = new SettingsService();
