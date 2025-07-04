import { LocationService, type LocationData } from "./locationService";

export interface LocationUpdate {
  userId: string;
  location: LocationData;
  timestamp: Date;
  isEmergency: boolean;
}

export interface LocationTrackingOptions {
  interval: number; // in milliseconds (default: 30000 for 30 seconds)
  silentUpdates: boolean; // don't show notifications for updates
  emergencyMode: boolean; // more frequent updates in emergency
}

export class RealTimeLocationService {
  private static activeTrackers = new Map<
    string,
    {
      intervalId: number;
      watchId: number | null;
      options: LocationTrackingOptions;
      onUpdate: (location: LocationData) => void;
      onError?: (error: string) => void;
    }
  >();

  private static defaultOptions: LocationTrackingOptions = {
    interval: 30000, // 30 seconds
    silentUpdates: true,
    emergencyMode: false,
  };

  /**
   * Start real-time location tracking for a user
   */
  static startTracking(
    userId: string,
    onUpdate: (location: LocationData) => void,
    onError?: (error: string) => void,
    options: Partial<LocationTrackingOptions> = {},
  ): () => void {
    const trackingOptions = { ...this.defaultOptions, ...options };

    // Stop existing tracker if any
    this.stopTracking(userId);

    // Get initial location
    this.updateLocation(userId, onUpdate, onError);

    // Set up interval for regular updates
    const intervalId = window.setInterval(() => {
      this.updateLocation(userId, onUpdate, onError);
    }, trackingOptions.interval);

    // Set up watch position for more accurate tracking
    const watchId =
      navigator.geolocation?.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          if (!trackingOptions.silentUpdates) {
            console.log(`Location updated for ${userId}:`, locationData);
          }

          onUpdate(locationData);
        },
        (error) => {
          const errorMessage = this.getLocationErrorMessage(error);
          if (onError) {
            onError(errorMessage);
          } else if (!trackingOptions.silentUpdates) {
            console.warn(`Location error for ${userId}:`, errorMessage);
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: trackingOptions.interval / 2, // Half the interval
        },
      ) || null;

    // Store tracker info
    this.activeTrackers.set(userId, {
      intervalId,
      watchId,
      options: trackingOptions,
      onUpdate,
      onError,
    });

    // Return cleanup function
    return () => this.stopTracking(userId);
  }

  /**
   * Stop tracking for a specific user
   */
  static stopTracking(userId: string): void {
    const tracker = this.activeTrackers.get(userId);
    if (tracker) {
      // Clear interval
      clearInterval(tracker.intervalId);

      // Clear watch position
      if (tracker.watchId !== null) {
        navigator.geolocation?.clearWatch(tracker.watchId);
      }

      // Remove from active trackers
      this.activeTrackers.delete(userId);

      console.log(`Stopped location tracking for ${userId}`);
    }
  }

  /**
   * Stop all active tracking
   */
  static stopAllTracking(): void {
    for (const userId of this.activeTrackers.keys()) {
      this.stopTracking(userId);
    }
  }

  /**
   * Update tracking options for an active tracker
   */
  static updateTrackingOptions(
    userId: string,
    newOptions: Partial<LocationTrackingOptions>,
  ): boolean {
    const tracker = this.activeTrackers.get(userId);
    if (tracker) {
      const updatedOptions = { ...tracker.options, ...newOptions };

      // Restart tracking with new options
      this.stopTracking(userId);
      this.startTracking(
        userId,
        tracker.onUpdate,
        tracker.onError,
        updatedOptions,
      );

      return true;
    }
    return false;
  }

  /**
   * Enable emergency mode for faster updates
   */
  static enableEmergencyMode(userId: string): void {
    this.updateTrackingOptions(userId, {
      interval: 10000, // 10 seconds
      emergencyMode: true,
      silentUpdates: true, // Keep silent even in emergency
    });
  }

  /**
   * Disable emergency mode and return to normal tracking
   */
  static disableEmergencyMode(userId: string): void {
    this.updateTrackingOptions(userId, {
      interval: 30000, // Back to 30 seconds
      emergencyMode: false,
      silentUpdates: true,
    });
  }

  /**
   * Get current location once without starting tracking
   */
  static async getCurrentLocation(): Promise<LocationData> {
    return LocationService.getCurrentLocation();
  }

  /**
   * Check if a user is currently being tracked
   */
  static isTracking(userId: string): boolean {
    return this.activeTrackers.has(userId);
  }

  /**
   * Get tracking status for a user
   */
  static getTrackingStatus(userId: string): {
    isActive: boolean;
    options?: LocationTrackingOptions;
  } {
    const tracker = this.activeTrackers.get(userId);
    return {
      isActive: !!tracker,
      options: tracker?.options,
    };
  }

  /**
   * Share real-time location via map link
   */
  static shareLocation(
    location: LocationData,
    message?: string,
  ): Promise<void> {
    return LocationService.shareLocation(
      location.latitude,
      location.longitude,
      message,
    );
  }

  /**
   * Calculate distance between two locations
   */
  static calculateDistance(
    location1: LocationData,
    location2: LocationData,
  ): number {
    return LocationService.calculateDistance(
      location1.latitude,
      location1.longitude,
      location2.latitude,
      location2.longitude,
    );
  }

  /**
   * Format distance for display
   */
  static formatDistance(kilometers: number): string {
    return LocationService.formatDistance(kilometers);
  }

  /**
   * Navigate to a location using native maps
   */
  static navigateToLocation(
    targetLocation: LocationData,
    label?: string,
  ): void {
    LocationService.navigateToLocation(
      targetLocation.latitude,
      targetLocation.longitude,
      label,
    );
  }

  /**
   * Get directions URL for embedding in web view
   */
  static getDirectionsUrl(
    fromLocation: LocationData,
    toLocation: LocationData,
  ): string {
    return `https://www.google.com/maps/dir/${fromLocation.latitude},${fromLocation.longitude}/${toLocation.latitude},${toLocation.longitude}`;
  }

  /**
   * Private method to update location
   */
  private static async updateLocation(
    userId: string,
    onUpdate: (location: LocationData) => void,
    onError?: (error: string) => void,
  ): Promise<void> {
    try {
      const location = await this.getCurrentLocation();
      onUpdate(location);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown location error";
      if (onError) {
        onError(errorMessage);
      }
    }
  }

  /**
   * Convert GeolocationPositionError to user-friendly message
   */
  private static getLocationErrorMessage(
    error: GeolocationPositionError,
  ): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location access denied. Please enable location permissions.";
      case error.POSITION_UNAVAILABLE:
        return "Location information unavailable. Check your GPS and network connection.";
      default:
        return "Unable to retrieve location.";
    }
  }
}

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    RealTimeLocationService.stopAllTracking();
  });
}
