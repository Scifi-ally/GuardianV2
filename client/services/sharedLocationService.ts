import { EventEmitter } from "@/lib/eventEmitter";

export interface SharedLocation {
  id: string;
  userId: string;
  name?: string; // Support for emergency contact names
  userName?: string;
  userAvatar?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  isLiveTracking: boolean;
  lastUpdated?: Date;
  status: "active" | "inactive" | "emergency";
  isEmergencyContact?: boolean; // Flag for emergency contacts
  batteryLevel?: number; // Battery level of the contact's device
}

export interface LocationShareSession {
  id: string;
  ownerId: string;
  participants: string[];
  startTime: Date;
  expiryTime?: Date;
  isActive: boolean;
  type: "temporary" | "live_tracking" | "emergency";
}

class SharedLocationService extends EventEmitter {
  private sharedLocations: Map<string, SharedLocation> = new Map();
  private activeSessions: Map<string, LocationShareSession> = new Map();
  private updateInterval: number | null = null;
  private isTracking = false;

  // Start sharing your location
  public startLocationSharing(
    userId: string,
    userName: string,
    userAvatar?: string,
  ): string {
    const sessionId = `session_${Date.now()}_${userId}`;
    const session: LocationShareSession = {
      id: sessionId,
      ownerId: userId,
      participants: [userId],
      startTime: new Date(),
      isActive: true,
      type: "temporary",
    };

    this.activeSessions.set(sessionId, session);
    this.emit("sessionStarted", session);

    // Start periodic location updates
    this.startLocationUpdates(userId, userName, userAvatar);

    return sessionId;
  }

  // Start live tracking (more frequent updates)
  public startLiveTracking(
    userId: string,
    userName: string,
    userAvatar?: string,
  ): string {
    const sessionId = `live_${Date.now()}_${userId}`;
    const session: LocationShareSession = {
      id: sessionId,
      ownerId: userId,
      participants: [userId],
      startTime: new Date(),
      isActive: true,
      type: "live_tracking",
    };

    this.activeSessions.set(sessionId, session);
    this.emit("sessionStarted", session);

    // Start more frequent location updates for live tracking
    this.startLocationUpdates(userId, userName, userAvatar, true);

    return sessionId;
  }

  // Update location for a user
  public updateUserLocation(
    userId: string,
    userName: string,
    latitude: number,
    longitude: number,
    accuracy: number,
    userAvatar?: string,
    isLiveTracking = false,
  ): void {
    const location: SharedLocation = {
      id: `location_${userId}`,
      userId,
      userName,
      userAvatar,
      latitude,
      longitude,
      accuracy,
      timestamp: Date.now(),
      isLiveTracking,
      lastUpdated: new Date(),
      status: "active",
    };

    this.sharedLocations.set(userId, location);
    this.emit("locationUpdated", location);

    // Also emit to specific session participants
    for (const session of this.activeSessions.values()) {
      if (session.participants.includes(userId) && session.isActive) {
        this.emit(`sessionLocationUpdate_${session.id}`, location);
      }
    }
  }

  // Add a person to track (for multi-person tracking)
  public addPersonToTrack(
    sessionId: string,
    userId: string,
    userName: string,
    latitude: number,
    longitude: number,
    userAvatar?: string,
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (session && !session.participants.includes(userId)) {
      session.participants.push(userId);
      this.activeSessions.set(sessionId, session);

      // Add their location
      this.updateUserLocation(
        userId,
        userName,
        latitude,
        longitude,
        100, // default accuracy
        userAvatar,
        session.type === "live_tracking",
      );

      this.emit("participantAdded", { sessionId, userId, userName });
    }
  }

  // Get all shared locations
  public getSharedLocations(): SharedLocation[] {
    return Array.from(this.sharedLocations.values()).filter(
      (loc) => Date.now() - loc.timestamp < 10 * 60 * 1000, // 10 minutes max age
    );
  }

  // Get locations for a specific session
  public getSessionLocations(sessionId: string): SharedLocation[] {
    const session = this.activeSessions.get(sessionId);
    if (!session) return [];

    return session.participants
      .map((userId) => this.sharedLocations.get(userId))
      .filter((loc): loc is SharedLocation => loc !== undefined);
  }

  // Stop location sharing
  public stopLocationSharing(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.set(sessionId, session);

      // Remove locations for this session's participants
      session.participants.forEach((userId) => {
        this.sharedLocations.delete(userId);
      });

      this.emit("sessionEnded", session);
    }

    // Stop location updates if no active sessions
    if (Array.from(this.activeSessions.values()).every((s) => !s.isActive)) {
      this.stopLocationUpdates();
    }
  }

  // Emergency mode - broadcast location to all emergency contacts
  public activateEmergencySharing(
    userId: string,
    userName: string,
    latitude: number,
    longitude: number,
    userAvatar?: string,
  ): string {
    const sessionId = `emergency_${Date.now()}_${userId}`;
    const session: LocationShareSession = {
      id: sessionId,
      ownerId: userId,
      participants: [userId],
      startTime: new Date(),
      isActive: true,
      type: "emergency",
    };

    this.activeSessions.set(sessionId, session);

    // Mark user location as emergency
    const location: SharedLocation = {
      id: `location_${userId}`,
      userId,
      userName,
      userAvatar,
      latitude,
      longitude,
      accuracy: 100,
      timestamp: Date.now(),
      isLiveTracking: true,
      lastUpdated: new Date(),
      status: "emergency",
    };

    this.sharedLocations.set(userId, location);
    this.emit("emergencyLocationActivated", { session, location });

    // Start emergency tracking (very frequent updates)
    this.startLocationUpdates(userId, userName, userAvatar, true, true);

    return sessionId;
  }

  // Get active sessions
  public getActiveSessions(): LocationShareSession[] {
    return Array.from(this.activeSessions.values()).filter((s) => s.isActive);
  }

  // Private methods
  private startLocationUpdates(
    userId: string,
    userName: string,
    userAvatar?: string,
    isLiveTracking = false,
    isEmergency = false,
  ): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.isTracking = true;

    // Determine update frequency
    const updateFrequency = isEmergency
      ? 30 * 1000 // 30 seconds for emergency
      : isLiveTracking
        ? 2 * 60 * 1000 // 2 minutes for live tracking
        : 5 * 60 * 1000; // 5 minutes for regular sharing

    this.updateInterval = setInterval(() => {
      // In a real app, this would get actual location
      // For now, simulate location updates
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.updateUserLocation(
              userId,
              userName,
              position.coords.latitude,
              position.coords.longitude,
              position.coords.accuracy,
              userAvatar,
              isLiveTracking,
            );
          },
          (error) => {
            console.warn("Location update failed:", error.message);
            // Use last known location with slight variation for demo
            const lastLocation = this.sharedLocations.get(userId);
            if (lastLocation) {
              this.updateUserLocation(
                userId,
                userName,
                lastLocation.latitude + (Math.random() - 0.5) * 0.0001,
                lastLocation.longitude + (Math.random() - 0.5) * 0.0001,
                lastLocation.accuracy,
                userAvatar,
                isLiveTracking,
              );
            }
          },
          {
            enableHighAccuracy: isEmergency || isLiveTracking,
            maximumAge: updateFrequency / 2,
            timeout: 10000,
          },
        );
      }
    }, updateFrequency);
  }

  private stopLocationUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isTracking = false;
  }

  // Clean up expired locations and sessions
  public cleanup(): void {
    const now = Date.now();
    const maxAge = 15 * 60 * 1000; // 15 minutes

    // Remove old locations
    for (const [userId, location] of this.sharedLocations.entries()) {
      if (now - location.timestamp > maxAge) {
        this.sharedLocations.delete(userId);
        this.emit("locationExpired", location);
      }
    }

    // Remove expired sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (
        session.expiryTime &&
        session.expiryTime.getTime() < now &&
        session.isActive
      ) {
        this.stopLocationSharing(sessionId);
      }
    }
  }

  public isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Auto-populate shared locations from emergency contacts
   * This simulates emergency contacts sharing their location with the user
   */
  public autoPopulateEmergencyContactLocations(
    userLocation: { latitude: number; longitude: number },
    emergencyContacts: Array<{ id: string; name: string; phone: string }>,
  ): void {
    // Clear any existing auto-populated locations
    this.sharedLocations.clear();

    // Create shared locations for each emergency contact
    emergencyContacts.forEach((contact, index) => {
      // Create realistic nearby locations (within 1-5 km of user)
      const distance = 0.01 + Math.random() * 0.04; // 1-5km roughly
      const angle = Math.random() * 2 * Math.PI;

      const location: SharedLocation = {
        id: `emergency_contact_${contact.id}`,
        userId: contact.id,
        name: contact.name,
        latitude: userLocation.latitude + Math.cos(angle) * distance,
        longitude: userLocation.longitude + Math.sin(angle) * distance,
        accuracy: 20 + Math.random() * 30, // 20-50m accuracy
        timestamp: Date.now() - Math.random() * 300000, // Updated in last 5 minutes
        isEmergencyContact: true,
        isLiveTracking: Math.random() > 0.5, // 50% chance of live tracking
        status: "active",
        batteryLevel: 30 + Math.random() * 70, // 30-100% battery
      };

      this.sharedLocations.set(contact.id, location);
    });

    // Emit update to notify components
    this.emit("emergencyContactsUpdated", this.getSharedLocations());
    console.log(
      `📍 Auto-populated ${emergencyContacts.length} emergency contact locations`,
    );
  }

  /**
   * Start simulating movement for emergency contacts
   */
  public startEmergencyContactSimulation(): void {
    setInterval(() => {
      const locations = Array.from(this.sharedLocations.values()).filter(
        (loc) => loc.isEmergencyContact,
      );

      locations.forEach((location) => {
        // Small random movement (simulating normal movement)
        const movement = 0.0001; // Very small movement
        location.latitude += (Math.random() - 0.5) * movement;
        location.longitude += (Math.random() - 0.5) * movement;
        location.timestamp = Date.now();

        // Update in map
        this.sharedLocations.set(location.userId, location);
      });

      if (locations.length > 0) {
        this.emit("locationUpdated", locations[0]); // Trigger update
      }
    }, 30000); // Update every 30 seconds
  }
}

// Create singleton instance
export const sharedLocationService = new SharedLocationService();

// Start cleanup interval
setInterval(
  () => {
    sharedLocationService.cleanup();
  },
  5 * 60 * 1000,
); // Clean up every 5 minutes
