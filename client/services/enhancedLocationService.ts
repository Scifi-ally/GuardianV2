interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  heading?: number;
  speed?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  quality: "excellent" | "good" | "fair" | "poor";
  source: "gps" | "network" | "passive";
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
  private locationHistory: LocationData[] = [];
  private readonly MAX_HISTORY = 50;
  private isHighAccuracyMode = false;
  private trackingInterval: number = 5000; // 5 seconds default
  private lastUpdateTime = 0;
  private readonly MIN_UPDATE_INTERVAL = 1000; // Minimum 1 second between updates

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
        // CRITICAL: Don't provide false location during emergencies
        const error = new Error(
          "Geolocation not supported. Please enable location services for emergency features. This is critical for your safety.",
        );
        console.error(
          "🚨 EMERGENCY SAFETY WARNING: Location services unavailable - emergency response may be severely impacted",
        );
        return reject(error);
      }

      // Try to get real location first
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const realLocation: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            quality: this.assessLocationQuality(position.coords.accuracy),
            source: this.determineLocationSource(position.coords.accuracy),
          };

          // Add to history and trigger quality analysis
          this.addToHistory(realLocation);

          console.log("✅ Real location obtained:", {
            lat: realLocation.latitude.toFixed(4),
            lng: realLocation.longitude.toFixed(4),
            accuracy: Math.round(realLocation.accuracy),
          });

          this.lastKnownLocation = realLocation;

          // Only call callbacks if enough time has passed (debounce)
          const now = Date.now();
          if (now - this.lastUpdateTime >= this.MIN_UPDATE_INTERVAL) {
            this.lastUpdateTime = now;
            this.callbacks.forEach((callback) => callback(realLocation));
          }

          resolve(realLocation);
        },
        (error) => {
          console.log("⚠️ Failed to get real location:", error.message);

          // Use last known location if available
          if (this.lastKnownLocation) {
            console.log("🔄 Using last known location");
            resolve(this.lastKnownLocation);
            return;
          }

          // CRITICAL: Never provide false coordinates during emergencies
          const error = new Error(
            "Location access denied. Emergency features require location permission. Please enable location access in your browser settings.",
          );
          console.error(
            "🚨 EMERGENCY SAFETY WARNING: Location permission denied - emergency responders will not be able to locate you",
          );
          reject(error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 300000, // 5 minutes
          timeout: 15000, // 15 seconds - reasonable timeout
          ...options,
        },
      );
    });
  }

  // Start continuous location tracking (optional, non-blocking)
  async startTracking(options?: PositionOptions): Promise<void> {
    if (this.isTracking) {
      console.log("📍 Location tracking already active");
      return;
    }

    if (!this.isSupported()) {
      console.log("📍 Geolocation not supported, skipping tracking");
      return;
    }

    this.isTracking = true;
    console.log("🎯 Starting optional location tracking...");

    const safeOptions: PositionOptions = {
      enableHighAccuracy: false, // Use network/wifi location for speed
      maximumAge: 60000, // Use 1-minute old cache
      timeout: 8000, // Short timeout to avoid hanging
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
        console.log("🔄 Optional location update received");
        this.callbacks.forEach((callback) => callback(locationData));
      },
      (error) => {
        // Silent handling - no user-facing errors
        console.log(
          `📍 Optional tracking failed (${this.getErrorName(error.code)}) - continuing normally`,
        );

        // Don't retry or show errors - just continue with last known location
        if (this.lastKnownLocation) {
          this.callbacks.forEach((callback) =>
            callback(this.lastKnownLocation!),
          );
        }
      },
      safeOptions,
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

  // Get human-readable error name
  private getErrorName(code: number): string {
    switch (code) {
      case 1:
        return "PERMISSION_DENIED";
      case 2:
        return "POSITION_UNAVAILABLE";
      case 3:
        return "TIMEOUT";
      default:
        return "UNKNOWN_ERROR";
    }
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
          "Location request timed out. This can happen indoors or in areas with poor GPS signal. Try moving to an area with better signal, or the app will continue with approximate location.";
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

  // Get comprehensive location status
  getDetailedStatus(): {
    isTracking: boolean;
    lastLocation: LocationData | null;
    retryCount: number;
    locationHistory: LocationData[];
    isHighAccuracy: boolean;
    trackingInterval: number;
  } {
    return {
      isTracking: this.isTracking,
      lastLocation: this.lastKnownLocation,
      retryCount: this.retryCount,
      locationHistory: this.locationHistory.slice(-5), // Last 5 locations
      isHighAccuracy: this.isHighAccuracyMode,
      trackingInterval: this.trackingInterval,
    };
  }

  // Enable high accuracy mode for emergency situations
  setHighAccuracyMode(enabled: boolean): void {
    this.isHighAccuracyMode = enabled;
    this.trackingInterval = enabled ? 1000 : 5000; // 1s vs 5s

    if (this.isTracking) {
      // Restart tracking with new settings
      this.stopTracking();
      this.startTracking();
    }
  }

  // Set custom tracking interval
  setTrackingInterval(intervalMs: number): void {
    this.trackingInterval = Math.max(intervalMs, 1000); // Minimum 1 second
  }

  // Assess location quality based on accuracy
  private assessLocationQuality(
    accuracy: number,
  ): "excellent" | "good" | "fair" | "poor" {
    if (accuracy <= 5) return "excellent"; // Within 5 meters
    if (accuracy <= 20) return "good"; // Within 20 meters
    if (accuracy <= 50) return "fair"; // Within 50 meters
    return "poor"; // Over 50 meters
  }

  // Determine likely location source
  private determineLocationSource(
    accuracy: number,
  ): "gps" | "network" | "passive" {
    if (accuracy <= 10) return "gps"; // High accuracy, likely GPS
    if (accuracy <= 100) return "network"; // Medium accuracy, likely network
    return "passive"; // Low accuracy, passive location
  }

  // Add location to history with smart filtering
  private addToHistory(location: LocationData): void {
    // Only add if it's significantly different from the last location
    const lastLocation = this.locationHistory[this.locationHistory.length - 1];
    if (lastLocation) {
      const distance = this.calculateDistanceBetween(lastLocation, location);
      const timeDiff = location.timestamp - lastLocation.timestamp;

      // Skip if location hasn't changed much and time is too recent
      if (distance < 5 && timeDiff < 30000) {
        // 5 meters, 30 seconds
        return;
      }
    }

    this.locationHistory.push(location);

    // Keep only recent history
    if (this.locationHistory.length > this.MAX_HISTORY) {
      this.locationHistory = this.locationHistory.slice(-this.MAX_HISTORY);
    }
  }

  // Calculate distance between two locations (Haversine formula)
  private calculateDistanceBetween(
    loc1: LocationData,
    loc2: LocationData,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Get location movement analysis
  getMovementAnalysis(): {
    isStationary: boolean;
    averageSpeed: number;
    direction: string;
    totalDistance: number;
  } {
    if (this.locationHistory.length < 2) {
      return {
        isStationary: true,
        averageSpeed: 0,
        direction: "unknown",
        totalDistance: 0,
      };
    }

    let totalDistance = 0;
    let totalTime = 0;
    const recent = this.locationHistory.slice(-10); // Last 10 locations

    for (let i = 1; i < recent.length; i++) {
      const distance = this.calculateDistanceBetween(recent[i - 1], recent[i]);
      const time = (recent[i].timestamp - recent[i - 1].timestamp) / 1000; // seconds
      totalDistance += distance;
      totalTime += time;
    }

    const averageSpeed = totalTime > 0 ? (totalDistance / totalTime) * 3.6 : 0; // km/h
    const isStationary = averageSpeed < 0.5; // Less than 0.5 km/h

    // Simple direction calculation
    const first = recent[0];
    const last = recent[recent.length - 1];
    const bearing = this.calculateBearing(first, last);
    const direction = this.bearingToDirection(bearing);

    return {
      isStationary,
      averageSpeed,
      direction,
      totalDistance,
    };
  }

  // Calculate bearing between two points
  private calculateBearing(start: LocationData, end: LocationData): number {
    const φ1 = (start.latitude * Math.PI) / 180;
    const φ2 = (end.latitude * Math.PI) / 180;
    const Δλ = ((end.longitude - start.longitude) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
  }

  // Convert bearing to compass direction
  private bearingToDirection(bearing: number): string {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }
}

// Export singleton instance
export const enhancedLocationService = EnhancedLocationService.getInstance();

// Export types
export type { LocationData, LocationError };
