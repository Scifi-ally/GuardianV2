interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

interface GeofenceArea {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number; // in meters
  type: "safe" | "warning" | "danger";
  notifications: boolean;
}

interface ActivityPattern {
  type: "stationary" | "walking" | "driving" | "running" | "unknown";
  confidence: number;
  duration: number;
  startTime: Date;
}

class SmartLocationService {
  private watchId: number | null = null;
  private locationHistory: LocationPoint[] = [];
  private geofences: GeofenceArea[] = [];
  private currentActivity: ActivityPattern | null = null;
  private subscribers: Array<(data: any) => void> = [];

  // Initialize smart location tracking
  async startTracking(
    options: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
      trackActivity?: boolean;
      geofenceEnabled?: boolean;
    } = {},
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Request permissions
      const permission = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      if (permission.state === "denied") {
        return { success: false, error: "Location permission denied" };
      }

      // Setup default geofences (safe zones)
      await this.setupDefaultGeofences();

      // Start location watching
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handleLocationUpdate(position),
        (error) => this.handleLocationError(error),
        {
          enableHighAccuracy: options.enableHighAccuracy ?? true,
          timeout: options.timeout ?? 10000,
          maximumAge: options.maximumAge ?? 5000,
        },
      );

      // Start activity detection if enabled
      if (options.trackActivity) {
        this.startActivityDetection();
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to start location tracking:", error);
      return {
        success: false,
        error: "Failed to initialize location tracking",
      };
    }
  }

  // Stop location tracking
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Handle location updates
  private handleLocationUpdate(position: GeolocationPosition): void {
    const locationPoint: LocationPoint = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date(),
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
    };

    // Add to history (keep last 100 points)
    this.locationHistory.push(locationPoint);
    if (this.locationHistory.length > 100) {
      this.locationHistory.shift();
    }

    // Check geofences
    this.checkGeofences(locationPoint);

    // Update activity detection
    this.updateActivityDetection(locationPoint);

    // Notify subscribers
    this.notifySubscribers({
      type: "location_update",
      location: locationPoint,
      activity: this.currentActivity,
    });
  }

  // Handle location errors
  private handleLocationError(error: GeolocationPositionError): void {
    console.error("Location error:", error);
    this.notifySubscribers({
      type: "location_error",
      error: error.message,
      code: error.code,
    });
  }

  // Setup default safe zones
  private async setupDefaultGeofences(): Promise<void> {
    // Get current location to setup nearby safe zones
    try {
      const position = await this.getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Add home area as safe zone (500m radius)
      this.geofences.push({
        id: "home_area",
        name: "Home Area",
        center: { lat: latitude, lng: longitude },
        radius: 500,
        type: "safe",
        notifications: true,
      });

      // Add more geofences based on common safe places
      // This would typically come from a backend service
      this.geofences.push(
        {
          id: "workplace",
          name: "Workplace Area",
          center: { lat: latitude + 0.01, lng: longitude + 0.01 },
          radius: 300,
          type: "safe",
          notifications: true,
        },
        {
          id: "shopping_center",
          name: "Shopping Center",
          center: { lat: latitude - 0.005, lng: longitude + 0.008 },
          radius: 400,
          type: "safe",
          notifications: false,
        },
      );
    } catch (error) {
      console.error("Failed to setup default geofences:", error);
    }
  }

  // Check if current location is within any geofences
  private checkGeofences(location: LocationPoint): void {
    this.geofences.forEach((geofence) => {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        geofence.center.lat,
        geofence.center.lng,
      );

      const isInside = distance <= geofence.radius;
      const wasInside = this.isLocationInGeofence(
        this.locationHistory[this.locationHistory.length - 2],
        geofence,
      );

      // Detect geofence entry/exit
      if (isInside && !wasInside) {
        this.notifySubscribers({
          type: "geofence_enter",
          geofence,
          location,
        });
      } else if (!isInside && wasInside) {
        this.notifySubscribers({
          type: "geofence_exit",
          geofence,
          location,
        });
      }
    });
  }

  // Activity detection using location patterns
  private updateActivityDetection(location: LocationPoint): void {
    if (this.locationHistory.length < 5) return;

    const recentPoints = this.locationHistory.slice(-5);
    const speeds = recentPoints
      .filter((point) => point.speed !== undefined)
      .map((point) => point.speed!);

    if (speeds.length === 0) return;

    const avgSpeed =
      speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    const maxSpeed = Math.max(...speeds);

    let activityType: ActivityPattern["type"] = "unknown";
    let confidence = 0.5;

    if (avgSpeed < 0.5) {
      activityType = "stationary";
      confidence = 0.9;
    } else if (avgSpeed < 2) {
      activityType = "walking";
      confidence = 0.8;
    } else if (avgSpeed < 15) {
      activityType = "running";
      confidence = 0.7;
    } else {
      activityType = "driving";
      confidence = 0.8;
    }

    // Update current activity
    const now = new Date();
    if (
      !this.currentActivity ||
      this.currentActivity.type !== activityType ||
      now.getTime() - this.currentActivity.startTime.getTime() > 300000 // 5 minutes
    ) {
      this.currentActivity = {
        type: activityType,
        confidence,
        duration: 0,
        startTime: now,
      };

      this.notifySubscribers({
        type: "activity_change",
        activity: this.currentActivity,
        location,
      });
    } else {
      // Update duration
      this.currentActivity.duration =
        now.getTime() - this.currentActivity.startTime.getTime();
    }
  }

  // Start device motion-based activity detection
  private startActivityDetection(): void {
    if ("DeviceMotionEvent" in window) {
      window.addEventListener("devicemotion", (event) => {
        const acceleration = event.acceleration;
        if (acceleration) {
          const magnitude = Math.sqrt(
            acceleration.x! ** 2 + acceleration.y! ** 2 + acceleration.z! ** 2,
          );

          // Detect significant movement patterns
          if (magnitude > 2) {
            this.notifySubscribers({
              type: "movement_detected",
              magnitude,
              timestamp: new Date(),
            });
          }
        }
      });
    }
  }

  // Utility functions
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private isLocationInGeofence(
    location: LocationPoint | undefined,
    geofence: GeofenceArea,
  ): boolean {
    if (!location) return false;
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      geofence.center.lat,
      geofence.center.lng,
    );
    return distance <= geofence.radius;
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      });
    });
  }

  // Subscription management
  subscribe(callback: (data: any) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(data: any): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Error in location subscriber:", error);
      }
    });
  }

  // Public getters
  getCurrentLocation(): LocationPoint | null {
    return this.locationHistory[this.locationHistory.length - 1] || null;
  }

  getLocationHistory(): LocationPoint[] {
    return [...this.locationHistory];
  }

  getCurrentActivity(): ActivityPattern | null {
    return this.currentActivity;
  }

  getGeofences(): GeofenceArea[] {
    return [...this.geofences];
  }

  // Add custom geofence
  addGeofence(geofence: Omit<GeofenceArea, "id">): string {
    const id = `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.geofences.push({ ...geofence, id });
    return id;
  }

  // Remove geofence
  removeGeofence(id: string): boolean {
    const index = this.geofences.findIndex((g) => g.id === id);
    if (index > -1) {
      this.geofences.splice(index, 1);
      return true;
    }
    return false;
  }

  // Get safety analytics
  getSafetyAnalytics(): {
    totalDistance: number;
    averageSpeed: number;
    timeInSafeZones: number;
    activitiesDetected: string[];
  } {
    if (this.locationHistory.length < 2) {
      return {
        totalDistance: 0,
        averageSpeed: 0,
        timeInSafeZones: 0,
        activitiesDetected: [],
      };
    }

    let totalDistance = 0;
    const speeds: number[] = [];
    const activities = new Set<string>();

    for (let i = 1; i < this.locationHistory.length; i++) {
      const prev = this.locationHistory[i - 1];
      const curr = this.locationHistory[i];

      totalDistance += this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );

      if (curr.speed !== undefined) {
        speeds.push(curr.speed);
      }
    }

    // Calculate time in safe zones (simplified)
    const safeGeofences = this.geofences.filter((g) => g.type === "safe");
    let timeInSafeZones = 0;

    this.locationHistory.forEach((location) => {
      const isInSafeZone = safeGeofences.some((geofence) =>
        this.isLocationInGeofence(location, geofence),
      );
      if (isInSafeZone) {
        timeInSafeZones += 5; // Approximate 5 seconds per location point
      }
    });

    if (this.currentActivity) {
      activities.add(this.currentActivity.type);
    }

    return {
      totalDistance: Math.round(totalDistance),
      averageSpeed:
        speeds.length > 0
          ? speeds.reduce((a, b) => a + b, 0) / speeds.length
          : 0,
      timeInSafeZones,
      activitiesDetected: Array.from(activities),
    };
  }
}

export const smartLocationService = new SmartLocationService();
export type { LocationPoint, GeofenceArea, ActivityPattern };
