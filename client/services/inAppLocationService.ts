import { useAuth } from "@/contexts/AuthContext";

interface LocationUpdate {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  isSharing: boolean;
}

interface ShareSession {
  id: string;
  userId: string;
  userName: string;
  startTime: Date;
  duration: number; // in minutes
  contactIds: string[];
  isActive: boolean;
}

class InAppLocationService {
  private static instance: InAppLocationService;
  private locationUpdates: Map<string, LocationUpdate> = new Map();
  private shareSessions: Map<string, ShareSession> = new Map();
  private listeners: Map<string, (updates: LocationUpdate[]) => void> =
    new Map();
  private trackingInterval: NodeJS.Timeout | null = null;

  static getInstance() {
    if (!InAppLocationService.instance) {
      InAppLocationService.instance = new InAppLocationService();
    }
    return InAppLocationService.instance;
  }

  // Start sharing location
  startLocationSharing(
    userId: string,
    userName: string,
    duration: number,
    contactIds: string[],
  ): string {
    const sessionId = `session_${Date.now()}_${userId}`;

    const session: ShareSession = {
      id: sessionId,
      userId,
      userName,
      startTime: new Date(),
      duration,
      contactIds,
      isActive: true,
    };

    this.shareSessions.set(sessionId, session);

    // Start location tracking
    this.startLocationTracking(userId, userName);

    // Auto-stop after duration
    setTimeout(
      () => {
        this.stopLocationSharing(sessionId);
      },
      duration * 60 * 1000,
    );

    return sessionId;
  }

  // Stop sharing location
  stopLocationSharing(sessionId: string) {
    const session = this.shareSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.shareSessions.set(sessionId, session);

      // Stop tracking if no other active sessions for this user
      const userActiveSessions = Array.from(this.shareSessions.values()).filter(
        (s) => s.userId === session.userId && s.isActive,
      );

      if (userActiveSessions.length === 0) {
        this.stopLocationTracking(session.userId);
      }
    }
  }

  // Start location tracking for a user
  private startLocationTracking(userId: string, userName: string) {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    const updateLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const update: LocationUpdate = {
              userId,
              userName,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(),
              isSharing: true,
            };

            this.locationUpdates.set(userId, update);
            this.notifyListeners();
          },
          (error) => {
            console.warn("Location tracking error:", error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 30000,
          },
        );
      }
    };

    // Initial update
    updateLocation();

    // Update every 30 seconds
    this.trackingInterval = setInterval(updateLocation, 30000);
  }

  // Stop location tracking
  private stopLocationTracking(userId: string) {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    // Mark as not sharing
    const update = this.locationUpdates.get(userId);
    if (update) {
      update.isSharing = false;
      this.locationUpdates.set(userId, update);
      this.notifyListeners();
    }
  }

  // Subscribe to location updates
  subscribeToLocationUpdates(
    listenerId: string,
    callback: (updates: LocationUpdate[]) => void,
  ) {
    this.listeners.set(listenerId, callback);

    // Send current updates
    const updates = Array.from(this.locationUpdates.values()).filter(
      (update) => update.isSharing,
    );
    callback(updates);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listenerId);
    };
  }

  // Get location updates for specific contacts
  getLocationUpdatesForContacts(contactIds: string[]): LocationUpdate[] {
    return Array.from(this.locationUpdates.values()).filter(
      (update) => update.isSharing && contactIds.includes(update.userId),
    );
  }

  // Get active share sessions for a user
  getActiveSessionsForUser(userId: string): ShareSession[] {
    return Array.from(this.shareSessions.values()).filter(
      (session) =>
        session.userId === userId &&
        session.isActive &&
        new Date().getTime() - session.startTime.getTime() <
          session.duration * 60 * 1000,
    );
  }

  // Get who is tracking a user
  getWhoIsTrackingUser(userId: string): ShareSession[] {
    return Array.from(this.shareSessions.values()).filter(
      (session) =>
        session.contactIds.includes(userId) &&
        session.isActive &&
        new Date().getTime() - session.startTime.getTime() <
          session.duration * 60 * 1000,
    );
  }

  // Notify all listeners of updates
  private notifyListeners() {
    const updates = Array.from(this.locationUpdates.values()).filter(
      (update) => update.isSharing,
    );

    this.listeners.forEach((callback) => callback(updates));
  }

  // Live tracking for current user location
  startLiveTracking(userId: string, userName: string) {
    return this.startLocationSharing(userId, userName, 60, []); // 1 hour default
  }

  // Share current location once
  shareCurrentLocation(): Promise<LocationUpdate | null> {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const update: LocationUpdate = {
              userId: "guest",
              userName: "Current User",
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(),
              isSharing: false,
            };
            resolve(update);
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 60000,
          },
        );
      } else {
        reject(new Error("Geolocation not supported"));
      }
    });
  }
}

export const inAppLocationService = InAppLocationService.getInstance();
export type { LocationUpdate, ShareSession };
