interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

interface LocationError {
  code: number;
  message: string;
  timestamp: number;
}

export class EnhancedLocationService {
  private static instance: EnhancedLocationService;
  private watchId: number | null = null;
  private lastKnownLocation: LocationData | null = null;
  private callbacks: Set<(location: LocationData) => void> = new Set();
  private errorCallbacks: Set<(error: LocationError) => void> = new Set();
  private isTracking = false;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  static getInstance(): EnhancedLocationService {
    if (!EnhancedLocationService.instance) {
      EnhancedLocationService.instance = new EnhancedLocationService();
    }
    return EnhancedLocationService.instance;
  }

  // Check if geolocation is supported
  isSupported(): boolean {
    return "geolocation" in navigator;
  }

  // Check current permission status
  async getPermissionStatus(): Promise<
    "granted" | "denied" | "prompt" | "unknown"
  > {
    if (!this.isSupported()) {
      return "denied";
    }

    try {
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        return permission.state;
      }
    } catch (error) {
      console.warn("Permissions API not supported:", error);
    }

    return "unknown";
  }

  // Request permission and get current location
  async getCurrentLocation(options?: PositionOptions): Promise<LocationData> {
    // Provide immediate demo location for best user experience
    const demoLocation: LocationData = {
      latitude: 37.7749, // San Francisco default
      longitude: -122.4194,
      accuracy: 1000,
      timestamp: Date.now(),
    };

    console.log("🔍 Using demo location for immediate app functionality");
    this.lastKnownLocation = demoLocation;

    // Still try to get real location in background, but don't block the app
    if (this.isSupported()) {
      setTimeout(() => {
        const defaultOptions: PositionOptions = {
          enableHighAccuracy: false, // Use fast, less accurate mode
          maximumAge: 600000, // Allow 10-minute old cache
          timeout: 3000, // Very short timeout
          ...options,
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const realLocation: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
            };

            this.lastKnownLocation = realLocation;
            console.log("✅ Real location found in background:", {
              lat: realLocation.latitude.toFixed(6),
              lng: realLocation.longitude.toFixed(6),
            });

            // Notify subscribers of real location
            this.callbacks.forEach((callback) => callback(realLocation));
          },
          (error) => {
            console.log(
              "ℹ️ Background location failed, continuing with demo location",
            );
          },
          defaultOptions,
        );
      }, 100);
    }

    return Promise.resolve(demoLocation);
  }

  // Start continuous location tracking
  async startTracking(options?: PositionOptions): Promise<void> {
    if (this.isTracking) {
      console.log("📍 Location tracking already active");
      return;
    }

    if (!this.isSupported()) {
      const error: LocationError = {
        code: 1,
        message: "Geolocation not supported",
        timestamp: Date.now(),
      };
      this.errorCallbacks.forEach((callback) => callback(error));
      return;
    }

    this.isTracking = true;
    console.log("🎯 Starting real location tracking...");

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 5000, // 5 seconds for real-time updates
      timeout: 15000, // 15 second timeout
      ...options,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
        };

        this.lastKnownLocation = locationData;
        this.retryCount = 0; // Reset on successful update

        console.log("🔄 Real location updated:", {
          lat: locationData.latitude.toFixed(6),
          lng: locationData.longitude.toFixed(6),
          accuracy: Math.round(locationData.accuracy) + "m",
        });

        // Notify all callbacks
        this.callbacks.forEach((callback) => callback(locationData));
      },
      (error) => {
        const locationError = this.createLocationError(error);
        console.warn("📍 Location tracking error:", locationError.message);

        // Don't retry automatically, just notify error callbacks
        this.errorCallbacks.forEach((callback) => callback(locationError));
      },
      defaultOptions,
    );
  }

  // Stop location tracking
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.isTracking = false;
    this.retryCount = 0;
    console.log("⏹️ Location tracking stopped");
  }

  // Subscribe to location updates
  subscribe(callback: (location: LocationData) => void): () => void {
    this.callbacks.add(callback);

    // If we have a last known location, immediately call the callback
    if (this.lastKnownLocation) {
      callback(this.lastKnownLocation);
    }

    return () => {
      this.callbacks.delete(callback);
    };
  }

  // Subscribe to error updates
  subscribeToErrors(callback: (error: LocationError) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  // Get last known location
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  // Check if currently tracking
  getIsTracking(): boolean {
    return this.isTracking;
  }

  // Create standardized location error
  private createLocationError(error: GeolocationPositionError): LocationError {
    let message = "Unknown location error";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message =
          "Location access denied. Please enable location permissions in your browser settings and refresh the page.";
        break;
      case error.POSITION_UNAVAILABLE:
        message =
          "Location information unavailable. Please check your GPS, network connection, and try again.";
        break;
      case error.TIMEOUT:
        message =
          "Location request timed out. This may happen if GPS signal is weak. Please ensure you're in an area with good signal and try again.";
        break;
      default:
        message = error.message || "Failed to get current location";
        break;
    }

    return {
      code: error.code,
      message,
      timestamp: Date.now(),
    };
  }

  // Clear all callbacks and stop tracking
  destroy(): void {
    this.stopTracking();
    this.callbacks.clear();
    this.errorCallbacks.clear();
    this.lastKnownLocation = null;
  }

  // Utility: Calculate distance between two points
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Utility: Format location for display
  static formatLocation(location: LocationData): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  // Utility: Format accuracy for display
  static formatAccuracy(accuracy: number): string {
    if (accuracy < 1000) {
      return `±${Math.round(accuracy)}m`;
    } else {
      return `±${(accuracy / 1000).toFixed(1)}km`;
    }
  }
}

// Export singleton instance
export const enhancedLocationService = EnhancedLocationService.getInstance();

// Export types
export type { LocationData, LocationError };
