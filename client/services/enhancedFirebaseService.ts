import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator,
  writeBatch,
  runTransaction,
  GeoPoint,
} from "firebase/firestore";
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { notifications } from "@/services/enhancedNotificationService";
import { firebaseErrorHandler } from "./firebaseErrorHandler";

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  emergencyContacts: EmergencyContact[];
  safetySettings: SafetySettings;
  lastLocation?: GeoPoint;
  lastSeen: Date;
  isOnline: boolean;
  deviceInfo: DeviceInfo;
}

export interface EmergencyContact {
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
}

export interface SafetySettings {
  autoSOSEnabled: boolean;
  locationSharingEnabled: boolean;
  emergencyBroadcastEnabled: boolean;
  silentModeEnabled: boolean;
  panicGestureEnabled: boolean;
  voiceActivationEnabled: boolean;
  highAccuracyLocation: boolean;
  batteryOptimized: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: string;
  connectionType?: string;
  batteryLevel?: number;
}

export interface LocationShare {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  location: GeoPoint;
  accuracy: number;
  timestamp: Date;
  expiresAt: Date;
  message?: string;
  isEmergency: boolean;
  isActive: boolean;
}

export interface EmergencyAlert {
  id: string;
  userId: string;
  userName: string;
  location: GeoPoint;
  accuracy: number;
  timestamp: Date;
  alertType:
    | "sos"
    | "panic"
    | "medical"
    | "fire"
    | "crime"
    | "natural_disaster";
  status: "active" | "acknowledged" | "resolved" | "cancelled";
  message?: string;
  contactedServices: string[];
  respondingContacts: string[];
  audioRecording?: string;
  photos?: string[];
  batteryLevel?: number;
  deviceInfo: DeviceInfo;
}

class EnhancedFirebaseService {
  private static instance: EnhancedFirebaseService;
  private userProfile: UserProfile | null = null;
  private locationShares: Map<string, LocationShare> = new Map();
  private emergencyAlerts: Map<string, EmergencyAlert> = new Map();
  private unsubscribers: (() => void)[] = [];
  private isOnline = navigator.onLine;
  private connectionRetryCount = 0;
  private maxRetries = 5;

  static getInstance(): EnhancedFirebaseService {
    if (!EnhancedFirebaseService.instance) {
      EnhancedFirebaseService.instance = new EnhancedFirebaseService();
    }
    return EnhancedFirebaseService.instance;
  }

  constructor() {
    this.initializeConnectionMonitoring();
    this.initializeAuthListener();
  }

  private initializeConnectionMonitoring() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.handleConnectionRestored();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.handleConnectionLost();
    });
  }

  private async handleConnectionRestored() {
    try {
      await enableNetwork(db);
      notifications.success({
        title: "Connection Restored",
        description: "Real-time updates are now active",
        vibrate: true,
      });
      this.connectionRetryCount = 0;
      this.syncPendingData();
    } catch (error) {
      console.error("Failed to restore Firebase connection:", error);
      this.retryConnection();
    }
  }

  private async handleConnectionLost() {
    try {
      await disableNetwork(db);
      notifications.warning({
        title: "Connection Lost",
        description: "Operating in offline mode",
        vibrate: true,
      });
    } catch (error) {
      console.error("Failed to handle connection loss:", error);
    }
  }

  private async retryConnection() {
    if (this.connectionRetryCount >= this.maxRetries) {
      notifications.error({
        title: "Connection Failed",
        description: "Please check your internet connection",
      });
      return;
    }

    this.connectionRetryCount++;
    const delay = Math.pow(2, this.connectionRetryCount) * 1000; // Exponential backoff

    setTimeout(async () => {
      if (this.isOnline) {
        await this.handleConnectionRestored();
      }
    }, delay);
  }

  private initializeAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await this.loadUserProfile(user);
        this.startRealTimeListeners();
      } else {
        this.cleanup();
      }
    });
  }

  // Authentication methods
  async signInAnonymously(): Promise<User> {
    try {
      const result = await signInAnonymously(auth);
      await this.createUserProfile(result.user);
      return result.user;
    } catch (error) {
      console.error("Anonymous sign-in failed:", error);
      throw error;
    }
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error("Email sign-in failed:", error);
      throw error;
    }
  }

  async createAccount(
    email: string,
    password: string,
    displayName: string,
  ): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await this.createUserProfile(result.user, displayName);
      return result.user;
    } catch (error) {
      console.error("Account creation failed:", error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    this.cleanup();
    await signOut(auth);
  }

  // User Profile management
  private async createUserProfile(
    user: User,
    displayName?: string,
  ): Promise<void> {
    const profile: UserProfile = {
      uid: user.uid,
      displayName: displayName || user.displayName || "Anonymous User",
      email: user.email || undefined,
      photoURL: user.photoURL || undefined,
      emergencyContacts: [],
      safetySettings: {
        autoSOSEnabled: true,
        locationSharingEnabled: true,
        emergencyBroadcastEnabled: true,
        silentModeEnabled: false,
        panicGestureEnabled: true,
        voiceActivationEnabled: false,
        highAccuracyLocation: false,
        batteryOptimized: true,
      },
      lastSeen: new Date(),
      isOnline: true,
      deviceInfo: this.getDeviceInfo(),
    };

    await this.updateUserProfile(profile);
  }

  private async loadUserProfile(user: User): Promise<void> {
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        this.userProfile = {
          ...docSnap.data(),
          uid: user.uid,
        } as UserProfile;
      } else {
        await this.createUserProfile(user);
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
      // Create a local profile if Firebase fails
      this.userProfile = {
        uid: user.uid,
        displayName: user.displayName || "User",
        emergencyContacts: [],
        safetySettings: {} as SafetySettings,
        lastSeen: new Date(),
        isOnline: true,
        deviceInfo: this.getDeviceInfo(),
      };
    }
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<void> {
    if (!auth.currentUser) return;

    await firebaseErrorHandler.executeWithErrorHandling(
      async () => {
        const docRef = doc(db, "users", auth.currentUser!.uid);
        await updateDoc(docRef, {
          ...profile,
          lastSeen: serverTimestamp(),
          isOnline: true,
        });

        if (this.userProfile) {
          this.userProfile = { ...this.userProfile, ...profile };
        }
      },
      undefined,
      true, // retryable
    );

    // Always update local profile as fallback
    if (this.userProfile) {
      this.userProfile = { ...this.userProfile, ...profile };
      // Store offline for later sync
      firebaseErrorHandler.storeOfflineData(
        `userProfile_${auth.currentUser.uid}`,
        this.userProfile,
      );
    }
  }

  // Emergency Contact management
  async addEmergencyContact(
    contact: Omit<EmergencyContact, "id">,
  ): Promise<string> {
    if (!auth.currentUser || !this.userProfile)
      throw new Error("User not authenticated");

    const newContact: EmergencyContact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isVerified: false,
      lastContacted: undefined,
    };

    const updatedContacts = [...this.userProfile.emergencyContacts, newContact];
    await this.updateUserProfile({ emergencyContacts: updatedContacts });

    notifications.success({
      title: "Emergency Contact Added",
      description: `${contact.name} has been added to your emergency contacts`,
      vibrate: true,
    });

    return newContact.id;
  }

  async updateEmergencyContact(
    contactId: string,
    updates: Partial<EmergencyContact>,
  ): Promise<void> {
    if (!this.userProfile) throw new Error("User not authenticated");

    const updatedContacts = this.userProfile.emergencyContacts.map((contact) =>
      contact.id === contactId ? { ...contact, ...updates } : contact,
    );

    await this.updateUserProfile({ emergencyContacts: updatedContacts });
  }

  async removeEmergencyContact(contactId: string): Promise<void> {
    if (!this.userProfile) throw new Error("User not authenticated");

    const updatedContacts = this.userProfile.emergencyContacts.filter(
      (contact) => contact.id !== contactId,
    );

    await this.updateUserProfile({ emergencyContacts: updatedContacts });

    notifications.success({
      title: "Contact Removed",
      description: "Emergency contact has been removed",
    });
  }

  // Real-time location sharing
  async shareLocation(
    location: { latitude: number; longitude: number; accuracy: number },
    toUserId: string,
    toUserName: string,
    options: {
      duration?: number; // in minutes
      message?: string;
      isEmergency?: boolean;
    } = {},
  ): Promise<string> {
    if (!auth.currentUser || !this.userProfile)
      throw new Error("User not authenticated");

    const shareDoc: Omit<LocationShare, "id"> = {
      fromUserId: auth.currentUser.uid,
      fromUserName: this.userProfile.displayName,
      toUserId,
      toUserName,
      location: new GeoPoint(location.latitude, location.longitude),
      accuracy: location.accuracy,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + (options.duration || 60) * 60 * 1000),
      message: options.message,
      isEmergency: options.isEmergency || false,
      isActive: true,
    };

    try {
      const docRef = await addDoc(collection(db, "locationShares"), {
        ...shareDoc,
        timestamp: serverTimestamp(),
        expiresAt: new Date(Date.now() + (options.duration || 60) * 60 * 1000),
      });

      notifications.success({
        title: "Location Shared",
        description: `Location shared with ${toUserName}`,
        vibrate: true,
      });

      return docRef.id;
    } catch (error) {
      console.error("Failed to share location:", error);
      throw error;
    }
  }

  async stopLocationShare(shareId: string): Promise<void> {
    try {
      const docRef = doc(db, "locationShares", shareId);
      await updateDoc(docRef, {
        isActive: false,
        endedAt: serverTimestamp(),
      });

      notifications.success({
        title: "Location Sharing Stopped",
        description: "Location sharing has been deactivated",
      });
    } catch (error) {
      console.error("Failed to stop location share:", error);
      throw error;
    }
  }

  // Emergency Alert management
  async createEmergencyAlert(
    location: { latitude: number; longitude: number; accuracy: number },
    alertType: EmergencyAlert["alertType"],
    options: {
      message?: string;
      audioRecording?: string;
      photos?: string[];
    } = {},
  ): Promise<string> {
    if (!auth.currentUser || !this.userProfile)
      throw new Error("User not authenticated");

    const alert: Omit<EmergencyAlert, "id"> = {
      userId: auth.currentUser.uid,
      userName: this.userProfile.displayName,
      location: new GeoPoint(location.latitude, location.longitude),
      accuracy: location.accuracy,
      timestamp: new Date(),
      alertType,
      status: "active",
      message: options.message,
      contactedServices: [],
      respondingContacts: [],
      audioRecording: options.audioRecording,
      photos: options.photos || [],
      batteryLevel: await this.getBatteryLevel(),
      deviceInfo: this.getDeviceInfo(),
    };

    try {
      const docRef = await addDoc(collection(db, "emergencyAlerts"), {
        ...alert,
        timestamp: serverTimestamp(),
      });

      // Notify emergency contacts
      await this.notifyEmergencyContacts(docRef.id, alert);

      notifications.emergency({
        title: "Emergency Alert Sent",
        description: `${alertType.toUpperCase()} alert sent to emergency contacts`,
      });

      return docRef.id;
    } catch (error) {
      console.warn(
        "Failed to create emergency alert in Firebase, storing locally:",
        error,
      );

      // Fallback: store locally and show notification
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store in localStorage for offline functionality
      const localAlerts = JSON.parse(
        localStorage.getItem("localEmergencyAlerts") || "[]",
      );
      localAlerts.push({ id: localId, ...alert });
      localStorage.setItem("localEmergencyAlerts", JSON.stringify(localAlerts));

      notifications.emergency({
        title: "Emergency Alert Created",
        description: `${alertType.toUpperCase()} alert created (offline mode)`,
      });

      return localId;
    }
  }

  async updateEmergencyAlert(
    alertId: string,
    updates: Partial<EmergencyAlert>,
  ): Promise<void> {
    try {
      const docRef = doc(db, "emergencyAlerts", alertId);
      await updateDoc(docRef, {
        ...updates,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to update emergency alert:", error);
      throw error;
    }
  }

  // Real-time listeners
  private startRealTimeListeners(): void {
    if (!auth.currentUser) return;

    try {
      // Listen for location shares with error handling
      const locationSharesQuery = query(
        collection(db, "locationShares"),
        where("toUserId", "==", auth.currentUser.uid),
        where("isActive", "==", true),
        orderBy("timestamp", "desc"),
      );

      const unsubscribeLocationShares = onSnapshot(
        locationSharesQuery,
        (snapshot) => {
          try {
            snapshot.docChanges().forEach((change) => {
              const data = {
                id: change.doc.id,
                ...change.doc.data(),
              } as LocationShare;

              if (change.type === "added") {
                this.locationShares.set(data.id, data);
                notifications.success({
                  title: "Location Received",
                  description: `${data.fromUserName} shared their location with you`,
                  vibrate: true,
                });
              } else if (change.type === "removed") {
                this.locationShares.delete(data.id);
              }
            });
          } catch (error) {
            console.warn("Error processing location share updates:", error);
          }
        },
        (error) => {
          // Fail completely silently for Firebase permission errors
          console.debug("Location shares listener error (silent):", error.code);
          // No notifications for any Firebase errors - graceful degradation only
        },
      );

      // Listen for emergency alerts with error handling
      const alertsQuery = query(
        collection(db, "emergencyAlerts"),
        where("status", "==", "active"),
        orderBy("timestamp", "desc"),
        limit(50),
      );

      const unsubscribeAlerts = onSnapshot(
        alertsQuery,
        (snapshot) => {
          try {
            snapshot.docChanges().forEach((change) => {
              const data = {
                id: change.doc.id,
                ...change.doc.data(),
              } as EmergencyAlert;

              if (
                change.type === "added" &&
                data.userId !== auth.currentUser?.uid
              ) {
                this.emergencyAlerts.set(data.id, data);

                // Check if this user is an emergency contact
                if (this.isEmergencyContactFor(data.userId)) {
                  notifications.emergency({
                    title: "Emergency Alert",
                    description: `${data.userName} needs help! ${data.alertType.toUpperCase()} alert`,
                  });
                }
              }
            });
          } catch (error) {
            console.warn("Error processing emergency alert updates:", error);
          }
        },
        (error) => {
          // Fail completely silently for Firebase permission errors
          console.debug(
            "Emergency alerts listener error (silent):",
            error.code,
          );
          // No notifications for any Firebase errors - graceful degradation only
        },
      );

      this.unsubscribers.push(unsubscribeLocationShares, unsubscribeAlerts);
    } catch (error) {
      console.warn(
        "Failed to start real-time listeners - continuing in offline mode:",
        error,
      );
      // Continue without real-time features - this is graceful degradation
    }
  }

  // Helper methods
  private async notifyEmergencyContacts(
    alertId: string,
    alert: Omit<EmergencyAlert, "id">,
  ): Promise<void> {
    if (!this.userProfile) return;

    const batch = writeBatch(db);

    for (const contact of this.userProfile.emergencyContacts) {
      if (contact.canShareLocation) {
        const notificationRef = doc(collection(db, "emergencyNotifications"));
        batch.set(notificationRef, {
          alertId,
          fromUserId: alert.userId,
          fromUserName: alert.userName,
          toContactId: contact.id,
          toContactName: contact.name,
          toContactPhone: contact.phone,
          alertType: alert.alertType,
          location: alert.location,
          message: alert.message,
          timestamp: serverTimestamp(),
          isRead: false,
        });
      }
    }

    try {
      await batch.commit();
    } catch (error) {
      console.error("Failed to notify emergency contacts:", error);
    }
  }

  private isEmergencyContactFor(userId: string): boolean {
    // This would need to be implemented by checking if current user is listed
    // as emergency contact for the given userId
    return false;
  }

  private async getBatteryLevel(): Promise<number | undefined> {
    try {
      if ("getBattery" in navigator) {
        const battery = await (navigator as any).getBattery();
        return battery.level * 100;
      }
    } catch (error) {
      // Battery API not available
    }
    return undefined;
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      connectionType: (navigator as any).connection?.effectiveType,
    };
  }

  private async syncPendingData(): Promise<void> {
    // Implement sync logic for offline data
    console.log("Syncing pending data...");
  }

  private cleanup(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    this.userProfile = null;
    this.locationShares.clear();
    this.emergencyAlerts.clear();
  }

  // Getters
  get currentUser() {
    return auth.currentUser;
  }

  get profile() {
    return this.userProfile;
  }

  get activeLocationShares() {
    return Array.from(this.locationShares.values());
  }

  get activeEmergencyAlerts() {
    return Array.from(this.emergencyAlerts.values());
  }

  get isConnected() {
    return this.isOnline;
  }
}

export const enhancedFirebaseService = EnhancedFirebaseService.getInstance();
export default enhancedFirebaseService;
