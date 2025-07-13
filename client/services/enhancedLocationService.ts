import { notifications } from "@/services/enhancedNotificationService";
import { enhancedFirebaseService } from "@/services/enhancedFirebaseService";
import { geminiAIService } from "@/services/geminiAIService";
import { GeoPoint } from "firebase/firestore";

export interface EnhancedLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  address?: string;
  confidence: number;
  source: "gps" | "network" | "passive" | "fused";
  batteryImpact: "low" | "medium" | "high";
}

export interface LocationHistory {
  locations: EnhancedLocationData[];
  totalDistance: number;
  averageSpeed: number;
  timespan: number;
  patterns: LocationPattern[];
}

export interface LocationPattern {
  type: "home" | "work" | "frequent" | "route";
  location: { latitude: number; longitude: number };
  frequency: number;
  timePatterns: string[];
  confidence: number;
}

export interface SafetyZone {
  id: string;
  name: string;
  center: { latitude: number; longitude: number };
  radius: number;
  type: "safe" | "caution" | "danger";
  isActive: boolean;
  notifications: boolean;
  entryMessage?: string;
  exitMessage?: string;
}

interface LocationServiceConfig {
  highAccuracy: boolean;
  maxAge: number;
  timeout: number;
  enableBackgroundTracking: boolean;
  updateInterval: number;
  maxHistorySize: number;
  enablePredictiveTracking: boolean;
  enableGeofencing: boolean;
  enableAIAnalysis: boolean;
}

class EnhancedLocationService {
  private static instance: EnhancedLocationService;
  private watchId: number | null = null;
  private currentLocation: EnhancedLocationData | null = null;
  private locationHistory: EnhancedLocationData[] = [];
  private safetyZones: Map<string, SafetyZone> = new Map();
  private isTracking = false;
  private config: LocationServiceConfig = {
    highAccuracy: false,
    maxAge: 60000, // 60 seconds - longer cache
    timeout: 30000, // 30 seconds - longer timeout
    enableBackgroundTracking: true,
    updateInterval: 15000, // 15 seconds - less frequent updates
    maxHistorySize: 1000,
    enablePredictiveTracking: true,
    enableGeofencing: true,
    enableAIAnalysis: true,
  };
  private listeners: ((location: EnhancedLocationData) => void)[] = [];
  private geofenceListeners: ((
    zone: SafetyZone,
    action: "enter" | "exit",
  ) => void)[] = [];
  private lastUpdateTime = 0;
  private consecutiveErrors = 0;
  private maxErrors = 5;
  private isBackgroundMode = false;
  private wakeLock: any = null;
  private lastNotificationTime: Map<string, number> = new Map();
  private notificationCooldown = 10000; // 10 seconds between same type notifications

  static getInstance(): EnhancedLocationService {
    if (!EnhancedLocationService.instance) {
      EnhancedLocationService.instance = new EnhancedLocationService();
    }
    return EnhancedLocationService.instance;
  }

  constructor() {
    this.loadSafetyZones();
    this.setupBackgroundHandling();
    this.setupBatteryOptimization();
  }

  // Configuration methods
  updateConfig(newConfig: Partial<LocationServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.isTracking) {
      this.stopTracking();
      this.startTracking();
    }

    notifications.success({
      title: "Location Settings Updated",
      description: "Your location tracking preferences have been saved",
    });
  }

  setHighAccuracyMode(enabled: boolean): void {
    this.updateConfig({ highAccuracy: enabled });
  }

  setUpdateInterval(interval: number): void {
    this.updateConfig({ updateInterval: Math.max(1000, interval) });
  }

  // Core tracking methods
  async startTracking(): Promise<void> {
    if (!this.isGeolocationSupported()) {
      throw new Error("Geolocation is not supported by this browser");
    }

    if (this.isTracking) {
      return;
    }

    try {
      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        throw new Error("Location permission denied");
      }

      // Acquire wake lock for background tracking
      await this.acquireWakeLock();

      // Start tracking
      const options: PositionOptions = {
        enableHighAccuracy: this.config.highAccuracy,
        maximumAge: this.config.maxAge,
        timeout: this.config.timeout,
      };

      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handleLocationUpdate(position),
        (error) => this.handleLocationError(error),
        options,
      );

      this.isTracking = true;
      this.consecutiveErrors = 0;

      this.showDebouncedNotification("tracking-started", () => {
        notifications.success({
          title: "Location Tracking Started",
          description: this.config.highAccuracy
            ? "High accuracy GPS tracking active"
            : "Standard location tracking active",
          vibrate: true,
        });
      });

      // Get initial location immediately with fallback
      navigator.geolocation.getCurrentPosition(
        (position) => this.handleLocationUpdate(position),
        (error) => {
          console.debug(
            "Initial location request failed, will retry via watchPosition",
          );
          // Don't call handleLocationError for initial request to avoid excessive error notifications
        },
        {
          ...options,
          timeout: 10000, // Shorter timeout for initial request
        },
      );
    } catch (error) {
      console.error("Failed to start location tracking:", error);
      notifications.error({
        title: "Location Tracking Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    this.releaseWakeLock();

    // Removed notification to prevent excessive toasts
  }

  async getCurrentLocation(): Promise<EnhancedLocationData> {
    if (!this.isGeolocationSupported()) {
      throw new Error("Geolocation is not supported");
    }

    // Return cached location if recent enough
    if (
      this.currentLocation &&
      Date.now() - this.currentLocation.timestamp.getTime() < this.config.maxAge
    ) {
      return this.currentLocation;
    }

    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: this.config.highAccuracy,
        maximumAge: this.config.maxAge,
        timeout: this.config.timeout,
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const enhancedLocation = await this.enhanceLocationData(position);
          resolve(enhancedLocation);
        },
        (error) => {
          console.warn("Location request failed:", error);
          // For timeout errors, try to return cached location
          if (error.code === error.TIMEOUT && this.currentLocation) {
            console.log("Using cached location due to timeout");
            resolve(this.currentLocation);
          } else {
            reject(new Error(this.getLocationErrorMessage(error)));
          }
        },
        options,
      );
    });
  }

  // Location data processing
  private async handleLocationUpdate(
    position: GeolocationPosition,
  ): Promise<void> {
    try {
      const enhancedLocation = await this.enhanceLocationData(position);

      // Update current location
      this.currentLocation = enhancedLocation;

      // Add to history
      this.addToHistory(enhancedLocation);

      // Update Firebase if user is authenticated
      if (enhancedFirebaseService.currentUser) {
        await enhancedFirebaseService.updateUserProfile({
          lastLocation: new GeoPoint(
            enhancedLocation.latitude,
            enhancedLocation.longitude,
          ),
          lastSeen: new Date(),
        });
      }

      // Check geofences
      if (this.config.enableGeofencing) {
        this.checkGeofences(enhancedLocation);
      }

      // Perform AI analysis periodically
      if (this.config.enableAIAnalysis && this.shouldPerformAIAnalysis()) {
        this.performAIAnalysis();
      }

      // Notify listeners
      this.notifyListeners(enhancedLocation);

      this.consecutiveErrors = 0;
      this.lastUpdateTime = Date.now();
    } catch (error) {
      console.error("Error handling location update:", error);
      this.handleLocationError(error);
    }
  }

  private async enhanceLocationData(
    position: GeolocationPosition,
  ): Promise<EnhancedLocationData> {
    const location: EnhancedLocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: new Date(position.timestamp),
      confidence: this.calculateConfidence(position.coords.accuracy),
      source: this.determineLocationSource(position.coords.accuracy),
      batteryImpact: this.calculateBatteryImpact(),
    };

    // Reverse geocoding for address
    if (window.google?.maps) {
      try {
        location.address = await this.reverseGeocode(
          location.latitude,
          location.longitude,
        );
      } catch (error) {
        console.warn("Failed to reverse geocode:", error);
      }
    }

    return location;
  }

  private calculateConfidence(accuracy: number): number {
    // Convert accuracy to confidence score (0-1)
    if (accuracy <= 5) return 0.95;
    if (accuracy <= 10) return 0.9;
    if (accuracy <= 20) return 0.8;
    if (accuracy <= 50) return 0.6;
    if (accuracy <= 100) return 0.4;
    return 0.2;
  }

  private determineLocationSource(
    accuracy: number,
  ): EnhancedLocationData["source"] {
    if (accuracy <= 10) return "gps";
    if (accuracy <= 50) return "fused";
    if (accuracy <= 500) return "network";
    return "passive";
  }

  private calculateBatteryImpact(): EnhancedLocationData["batteryImpact"] {
    if (this.config.highAccuracy) return "high";
    if (this.config.updateInterval < 30000) return "medium";
    return "low";
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const result = results[0];
          const components = result.address_components;

          // Extract meaningful address components
          let shortAddress = "";
          let neighborhood = "";
          let city = "";

          components.forEach((component) => {
            const types = component.types;
            if (types.includes("street_number") || types.includes("route")) {
              shortAddress += component.short_name + " ";
            } else if (
              types.includes("neighborhood") ||
              types.includes("sublocality")
            ) {
              neighborhood = component.short_name;
            } else if (types.includes("locality")) {
              city = component.short_name;
            }
          });

          const address =
            shortAddress.trim() || neighborhood || city || "Unknown location";
          resolve(address);
        } else {
          reject(new Error("Geocoding failed"));
        }
      });
    });
  }

  // History management
  private addToHistory(location: EnhancedLocationData): void {
    this.locationHistory.push(location);

    // Trim history if it exceeds max size
    if (this.locationHistory.length > this.config.maxHistorySize) {
      this.locationHistory = this.locationHistory.slice(
        -this.config.maxHistorySize,
      );
    }

    // Save to localStorage for persistence
    this.saveHistoryToStorage();
  }

  private saveHistoryToStorage(): void {
    try {
      const recentHistory = this.locationHistory.slice(-100); // Keep last 100 locations
      localStorage.setItem("locationHistory", JSON.stringify(recentHistory));
    } catch (error) {
      console.warn("Failed to save location history:", error);
    }
  }

  private loadHistoryFromStorage(): void {
    try {
      const stored = localStorage.getItem("locationHistory");
      if (stored) {
        const history = JSON.parse(stored);
        this.locationHistory = history.map((loc: any) => ({
          ...loc,
          timestamp: new Date(loc.timestamp),
        }));
      }
    } catch (error) {
      console.warn("Failed to load location history:", error);
    }
  }

  // Geofencing
  addSafetyZone(zone: Omit<SafetyZone, "id">): string {
    const id = `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const safetyZone: SafetyZone = { ...zone, id };

    this.safetyZones.set(id, safetyZone);
    this.saveSafetyZones();

    this.showDebouncedNotification("zone-added", () => {
      notifications.success({
        title: "Safety Zone Added",
        description: `${zone.name} has been added to your safety zones`,
      });
    });

    return id;
  }

  removeSafetyZone(zoneId: string): void {
    this.safetyZones.delete(zoneId);
    this.saveSafetyZones();

    this.showDebouncedNotification("zone-removed", () => {
      notifications.success({
        title: "Safety Zone Removed",
        description: "Safety zone has been removed",
      });
    });
  }

  private checkGeofences(location: EnhancedLocationData): void {
    this.safetyZones.forEach((zone) => {
      if (!zone.isActive) return;

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        zone.center.latitude,
        zone.center.longitude,
      );

      const isInside = distance <= zone.radius;
      const wasInside = this.wasInZone(zone.id);

      if (isInside && !wasInside) {
        // Entering zone
        this.handleZoneEntry(zone);
      } else if (!isInside && wasInside) {
        // Exiting zone
        this.handleZoneExit(zone);
      }
    });
  }

  private handleZoneEntry(zone: SafetyZone): void {
    localStorage.setItem(`zone_${zone.id}`, "inside");

    if (zone.notifications && zone.entryMessage) {
      const notificationType = zone.type === "danger" ? "warning" : "success";
      notifications[notificationType]({
        title: `Entered ${zone.name}`,
        description: zone.entryMessage,
        vibrate: zone.type === "danger",
      });
    }

    this.notifyGeofenceListeners(zone, "enter");
  }

  private handleZoneExit(zone: SafetyZone): void {
    localStorage.setItem(`zone_${zone.id}`, "outside");

    if (zone.notifications && zone.exitMessage) {
      const notificationType = zone.type === "safe" ? "warning" : "success";
      notifications[notificationType]({
        title: `Left ${zone.name}`,
        description: zone.exitMessage,
        vibrate: zone.type === "safe",
      });
    }

    this.notifyGeofenceListeners(zone, "exit");
  }

  private wasInZone(zoneId: string): boolean {
    return localStorage.getItem(`zone_${zoneId}`) === "inside";
  }

  // AI Analysis
  private shouldPerformAIAnalysis(): boolean {
    const lastAnalysis = parseInt(
      localStorage.getItem("lastAIAnalysis") || "0",
    );
    const now = Date.now();
    const interval = 5 * 60 * 1000; // 5 minutes

    return now - lastAnalysis > interval;
  }

  private async performAIAnalysis(): Promise<void> {
    // Check if AI is available before proceeding
    const isAIAvailable = await geminiAIService.checkAvailability();
    if (!isAIAvailable || !this.currentLocation) {
      console.debug("AI analysis skipped - service unavailable or no location");
      return;
    }

    try {
      localStorage.setItem("lastAIAnalysis", Date.now().toString());

      const context = {
        latitude: this.currentLocation.latitude,
        longitude: this.currentLocation.longitude,
        address: this.currentLocation.address,
        timestamp: this.currentLocation.timestamp,
      };

      const weather = await this.getWeatherContext();
      const safetyContext = this.getSafetyContext();

      const analysis = await geminiAIService.analyzeSafetyContext(
        context,
        weather,
        safetyContext,
      );

      // Show high priority recommendations
      analysis.recommendations
        .filter((rec) => rec.priority === "high" || rec.priority === "critical")
        .forEach((rec) => {
          const notificationType =
            rec.priority === "critical" ? "error" : "warning";
          notifications[notificationType]({
            title: rec.title,
            description: rec.description,
            vibrate: rec.priority === "critical",
          });
        });
    } catch (error) {
      // Handle different types of AI analysis errors gracefully
      if (error instanceof Error) {
        if (
          error.message.includes("API access denied") ||
          error.message.includes("403") ||
          error.message.includes("using offline mode")
        ) {
          console.debug("AI analysis disabled due to API limitations");
          // Disable AI analysis for this session
          this.config.enableAIAnalysis = false;
        } else if (error.message.includes("rate limit")) {
          console.debug("AI analysis rate limited - will retry later");
          // Don't disable, just skip this round
        } else {
          console.debug("AI analysis failed:", error.message);
        }
      } else {
        console.debug("AI analysis failed with unknown error:", error);
      }
    }
  }

  // Utility methods
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

  private async getWeatherContext() {
    // Mock weather data - in a real app, this would come from a weather API
    return {
      temperature: 72,
      condition: "clear",
      visibility: 10,
      windSpeed: 5,
      alerts: [],
    };
  }

  private getSafetyContext() {
    const hour = new Date().getHours();
    let timeOfDay: "morning" | "afternoon" | "evening" | "night";

    if (hour >= 6 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "evening";
    else timeOfDay = "night";

    return {
      timeOfDay,
      dayOfWeek: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      userProfile: {
        emergencyContacts:
          enhancedFirebaseService.profile?.emergencyContacts.length || 0,
      },
      deviceInfo: {
        batteryLevel: this.getBatteryLevel(),
      },
      travelMode: "walking" as const,
    };
  }

  private getBatteryLevel(): number | undefined {
    // This would need to be implemented with Battery API
    return undefined;
  }

  // Background and battery optimization
  private setupBackgroundHandling(): void {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.isBackgroundMode = true;
        // Reduce update frequency in background
        this.updateConfig({ updateInterval: this.config.updateInterval * 2 });
      } else {
        this.isBackgroundMode = false;
        // Restore normal update frequency
        this.updateConfig({ updateInterval: this.config.updateInterval / 2 });
      }
    });
  }

  private setupBatteryOptimization(): void {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryConfig = () => {
          const lowBattery = battery.level < 0.2;
          const charging = battery.charging;

          if (lowBattery && !charging) {
            // Switch to battery saving mode
            this.updateConfig({
              highAccuracy: false,
              updateInterval: 60000, // 1 minute
            });

            notifications.warning({
              title: "Battery Saving Mode",
              description: "Location tracking optimized for low battery",
            });
          }
        };

        battery.addEventListener("levelchange", updateBatteryConfig);
        battery.addEventListener("chargingchange", updateBatteryConfig);
        updateBatteryConfig();
      });
    }
  }

  private async acquireWakeLock(): Promise<void> {
    if ("wakeLock" in navigator && this.config.enableBackgroundTracking) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request("screen");
      } catch (error) {
        console.warn("Wake lock not available:", error);
      }
    }
  }

  private releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  // Error handling
  private handleLocationError(error: any): void {
    this.consecutiveErrors++;

    const message = this.getLocationErrorMessage(error);
    console.warn("Location error:", message);

    // Don't show notifications for timeout errors - they're common
    if (error.code === 3) {
      // TIMEOUT
      console.debug("Location timeout - will retry silently");
      return;
    }

    if (this.consecutiveErrors >= this.maxErrors) {
      console.error("Multiple location errors - stopping tracking");
      this.stopTracking();
      // Only show critical error for permission denied
      if (error.code === 1) {
        // PERMISSION_DENIED
        notifications.error({
          title: "Location Permission Required",
          description: "Please enable location access to use this feature.",
        });
      }
    }
    // Remove other warning notifications to reduce noise
  }

  private getLocationErrorMessage(error: any): string {
    if (error.code) {
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          return "Location access denied. Please enable location permissions.";
        case 2: // POSITION_UNAVAILABLE
          return "Location information unavailable. Check your GPS settings.";
        case 3: // TIMEOUT
          return "Location request timed out. Using cached location if available.";
        default:
          return "Unknown location error occurred.";
      }
    }
    return error.message || "Location service error";
  }

  // Permission handling
  private async requestPermission(): Promise<PermissionState> {
    if ("permissions" in navigator) {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      return permission.state;
    }
    return "granted"; // Assume granted for older browsers
  }

  async getPermissionStatus(): Promise<string> {
    try {
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        return permission.state;
      }
      return "granted"; // Assume granted for older browsers
    } catch (error) {
      console.warn("Failed to check permission status:", error);
      return "unknown";
    }
  }

  private isGeolocationSupported(): boolean {
    return "geolocation" in navigator;
  }

  // Storage methods
  private saveSafetyZones(): void {
    try {
      const zones = Array.from(this.safetyZones.values());
      localStorage.setItem("safetyZones", JSON.stringify(zones));
    } catch (error) {
      console.warn("Failed to save safety zones:", error);
    }
  }

  private loadSafetyZones(): void {
    try {
      const stored = localStorage.getItem("safetyZones");
      if (stored) {
        const zones: SafetyZone[] = JSON.parse(stored);
        zones.forEach((zone) => {
          this.safetyZones.set(zone.id, zone);
        });
      }
    } catch (error) {
      console.warn("Failed to load safety zones:", error);
    }
  }

  // Event listeners
  addLocationListener(
    listener: (location: EnhancedLocationData) => void,
  ): void {
    this.listeners.push(listener);
  }

  removeLocationListener(
    listener: (location: EnhancedLocationData) => void,
  ): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  addGeofenceListener(
    listener: (zone: SafetyZone, action: "enter" | "exit") => void,
  ): void {
    this.geofenceListeners.push(listener);
  }

  removeGeofenceListener(
    listener: (zone: SafetyZone, action: "enter" | "exit") => void,
  ): void {
    const index = this.geofenceListeners.indexOf(listener);
    if (index > -1) {
      this.geofenceListeners.splice(index, 1);
    }
  }

  private notifyListeners(location: EnhancedLocationData): void {
    this.listeners.forEach((listener) => {
      try {
        listener(location);
      } catch (error) {
        console.error("Location listener error:", error);
      }
    });
  }

  private notifyGeofenceListeners(
    zone: SafetyZone,
    action: "enter" | "exit",
  ): void {
    this.geofenceListeners.forEach((listener) => {
      try {
        listener(zone, action);
      } catch (error) {
        console.error("Geofence listener error:", error);
      }
    });
  }

  // Notification debouncing helper
  private showDebouncedNotification(
    key: string,
    showNotification: () => void,
  ): void {
    const now = Date.now();
    const lastTime = this.lastNotificationTime.get(key) || 0;

    if (now - lastTime > this.notificationCooldown) {
      this.lastNotificationTime.set(key, now);
      showNotification();
    }
  }

  // Backward compatibility methods
  subscribe(callback: (location: any) => void): () => void {
    const wrappedCallback = (location: EnhancedLocationData) => {
      // Convert to legacy format for backward compatibility
      const legacyLocation = {
        coords: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          altitude: location.altitude,
          altitudeAccuracy: location.altitudeAccuracy,
          heading: location.heading,
          speed: location.speed,
        },
        timestamp: location.timestamp.getTime(),
      };
      callback(legacyLocation);
    };

    this.addLocationListener(wrappedCallback);
    return () => this.removeLocationListener(wrappedCallback);
  }

  // Legacy method names for compatibility
  setTrackingInterval(interval: number): void {
    this.updateConfig({ updateInterval: interval });
  }

  // Public getters
  get current(): EnhancedLocationData | null {
    return this.currentLocation;
  }

  get history(): EnhancedLocationData[] {
    return [...this.locationHistory];
  }

  get zones(): SafetyZone[] {
    return Array.from(this.safetyZones.values());
  }

  get isActive(): boolean {
    return this.isTracking;
  }

  get configuration(): LocationServiceConfig {
    return { ...this.config };
  }
}

export const enhancedLocationService = EnhancedLocationService.getInstance();
export default enhancedLocationService;
