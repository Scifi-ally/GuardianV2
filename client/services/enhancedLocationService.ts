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
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        const error: LocationError = {
          code: 1,
          message: "Geolocation is not supported by this browser",
          timestamp: Date.now(),
        };
        reject(error);
        return;
      }

      // Show loading state
      console.log("🔍 Getting your current location...");

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        maximumAge: 60000, // 1 minute cache
        ...options,
      };

      navigator.geolocation.getCurrentPosition(
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
          this.retryCount = 0; // Reset retry count on success

          console.log("✅ Location found:", {
            lat: locationData.latitude.toFixed(6),
            lng: locationData.longitude.toFixed(6),
            accuracy: Math.round(locationData.accuracy) + "m",
          });

          resolve(locationData);
        },
        (error) => {
          const locationError = this.createLocationError(error);
          console.error("❌ Location error:", locationError.message);

          // Auto-retry with progressive fallback
          if (this.retryCount < this.MAX_RETRIES) {
            this.retryCount++;
            const retryDelay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff

            console.log(
              `🔄 Retrying location (attempt ${this.retryCount}/${this.MAX_RETRIES}) in ${retryDelay / 1000}s...`,
            );

            setTimeout(() => {
              // Try with less accurate but faster settings on retry
              const fallbackOptions: PositionOptions = {
                enableHighAccuracy: this.retryCount < 2, // Only high accuracy on first retry
                maximumAge: 300000 + this.retryCount * 60000, // Allow older cache
              };

              this.getCurrentLocation(fallbackOptions)
                .then(resolve)
                .catch(reject);
            }, retryDelay);
          } else {
            // All retries failed
            this.errorCallbacks.forEach((callback) => callback(locationError));
            reject(locationError);
          }
        },
        defaultOptions,
      );
    });
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
    console.log("🎯 Starting location tracking...");

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 30000,
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

        // Notify all callbacks
        this.callbacks.forEach((callback) => callback(locationData));
      },
      (error) => {
        const locationError = this.createLocationError(error);
        console.warn("📍 Location tracking error:", locationError.message);

        // Auto-retry tracking with fallback options
        if (this.retryCount < this.MAX_RETRIES) {
          this.retryCount++;
          console.log(
            `🔄 Restarting tracking (attempt ${this.retryCount}/${this.MAX_RETRIES})...`,
          );

          // Stop current tracking and restart with fallback
          this.stopTracking();

          this.retryTimeout = setTimeout(
            () => {
              const fallbackOptions: PositionOptions = {
                enableHighAccuracy: this.retryCount < 2,
                maximumAge: 60000 + this.retryCount * 30000,
              };

              this.startTracking(fallbackOptions);
            },
            Math.pow(2, this.retryCount) * 1000,
          );
        } else {
          // All retries failed, stop tracking
          this.stopTracking();
          this.errorCallbacks.forEach((callback) => callback(locationError));
        }
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
