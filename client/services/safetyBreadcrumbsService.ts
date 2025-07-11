interface BreadcrumbPoint {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
  speed?: number;
  heading?: number;
  address?: string;
  safetyScore?: number;
  isEmergency: boolean;
  batteryLevel?: number;
  networkSignal?: number;
}

interface BreadcrumbTrail {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  points: BreadcrumbPoint[];
  isEmergencyTrail: boolean;
  sharedWith: string[];
  encryptionKey?: string;
}

interface SafetyBreadcrumbsConfig {
  normalInterval: number; // milliseconds between points in normal mode
  emergencyInterval: number; // milliseconds between points in emergency mode
  maxTrailLength: number; // maximum points to keep
  retentionDays: number; // days to keep trails
  autoShareOnEmergency: boolean;
  encryptTrails: boolean;
  highAccuracyMode: boolean;
}

class SafetyBreadcrumbsService {
  private config: SafetyBreadcrumbsConfig = {
    normalInterval: 300000, // 5 minutes
    emergencyInterval: 30000, // 30 seconds
    maxTrailLength: 100,
    retentionDays: 7,
    autoShareOnEmergency: true,
    encryptTrails: true,
    highAccuracyMode: false,
  };

  private currentTrail: BreadcrumbTrail | null = null;
  private isTracking = false;
  private isEmergencyMode = false;
  private trackingInterval: NodeJS.Timeout | null = null;
  private watchPositionId: number | null = null;

  private listeners: {
    onNewPoint: ((point: BreadcrumbPoint) => void)[];
    onTrailUpdate: ((trail: BreadcrumbTrail) => void)[];
    onEmergencyModeChange: ((isEmergency: boolean) => void)[];
  } = {
    onNewPoint: [],
    onTrailUpdate: [],
    onEmergencyModeChange: [],
  };

  constructor() {
    this.loadPersistedTrails();
  }

  // Start tracking breadcrumbs
  public startTracking(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isTracking) {
        resolve();
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      console.log("🍞 Starting safety breadcrumbs tracking");

      // Create new trail
      this.currentTrail = {
        id: this.generateTrailId(),
        userId,
        startTime: new Date(),
        points: [],
        isEmergencyTrail: false,
        sharedWith: [],
        encryptionKey: this.config.encryptTrails
          ? this.generateEncryptionKey()
          : undefined,
      };

      this.isTracking = true;

      // Start position watching
      this.startPositionWatching();

      // Start periodic breadcrumb drops
      this.startPeriodicTracking();

      resolve();
    });
  }

  // Stop tracking
  public stopTracking(): void {
    if (!this.isTracking) return;

    console.log("🛑 Stopping safety breadcrumbs tracking");

    this.isTracking = false;

    // Clear intervals
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    // Stop position watching
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }

    // Finalize current trail
    if (this.currentTrail) {
      this.currentTrail.endTime = new Date();
      this.persistTrail(this.currentTrail);
      this.currentTrail = null;
    }
  }

  // Switch to emergency mode
  public activateEmergencyMode(): void {
    if (this.isEmergencyMode) return;

    console.log("🚨 Activating emergency breadcrumbs mode");

    this.isEmergencyMode = true;

    if (this.currentTrail) {
      this.currentTrail.isEmergencyTrail = true;

      // Auto-share if configured
      if (this.config.autoShareOnEmergency) {
        this.shareTrailWithEmergencyContacts();
      }
    }

    // Switch to high-frequency tracking
    this.restartPeriodicTracking();

    // Enable high accuracy mode
    this.config.highAccuracyMode = true;
    this.restartPositionWatching();

    // Notify listeners
    this.listeners.onEmergencyModeChange.forEach((callback) => callback(true));
  }

  // Deactivate emergency mode
  public deactivateEmergencyMode(): void {
    if (!this.isEmergencyMode) return;

    console.log("✅ Deactivating emergency breadcrumbs mode");

    this.isEmergencyMode = false;

    // Switch back to normal tracking
    this.restartPeriodicTracking();

    // Disable high accuracy mode
    this.config.highAccuracyMode = false;
    this.restartPositionWatching();

    // Notify listeners
    this.listeners.onEmergencyModeChange.forEach((callback) => callback(false));
  }

  private startPositionWatching(): void {
    const options: PositionOptions = {
      enableHighAccuracy: this.config.highAccuracyMode,
      timeout: 15000,
      maximumAge: this.isEmergencyMode ? 5000 : 30000,
    };

    this.watchPositionId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      options,
    );
  }

  private restartPositionWatching(): void {
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
    }
    this.startPositionWatching();
  }

  private startPeriodicTracking(): void {
    const interval = this.isEmergencyMode
      ? this.config.emergencyInterval
      : this.config.normalInterval;

    this.trackingInterval = setInterval(() => {
      this.dropBreadcrumb();
    }, interval);
  }

  private restartPeriodicTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    this.startPeriodicTracking();
  }

  private handlePositionUpdate(position: GeolocationPosition): void {
    // Only create breadcrumb in emergency mode for position updates
    if (this.isEmergencyMode) {
      this.createBreadcrumbFromPosition(position);
    }
  }

  private handlePositionError(error: GeolocationPositionError): void {
    console.warn("Breadcrumb position error:", error.message);

    // In emergency mode, try to get any location data
    if (this.isEmergencyMode) {
      navigator.geolocation.getCurrentPosition(
        (position) => this.createBreadcrumbFromPosition(position),
        () => console.error("Emergency location failed"),
        { timeout: 5000, maximumAge: 60000 },
      );
    }
  }

  private async dropBreadcrumb(): Promise<void> {
    if (!this.isTracking || !this.currentTrail) return;

    try {
      const position = await this.getCurrentPosition();
      this.createBreadcrumbFromPosition(position);
    } catch (error) {
      console.warn("Failed to drop breadcrumb:", error);
    }
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      const options: PositionOptions = {
        enableHighAccuracy: this.config.highAccuracyMode,
        timeout: this.isEmergencyMode ? 10000 : 15000,
        maximumAge: this.isEmergencyMode ? 5000 : 30000,
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  private async createBreadcrumbFromPosition(
    position: GeolocationPosition,
  ): Promise<void> {
    if (!this.currentTrail) return;

    const point: BreadcrumbPoint = {
      id: this.generatePointId(),
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date(position.timestamp),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      isEmergency: this.isEmergencyMode,
      batteryLevel: await this.getBatteryLevel(),
      networkSignal: this.getNetworkSignal(),
    };

    // Get address if possible
    try {
      point.address = await this.reverseGeocode(
        point.latitude,
        point.longitude,
      );
    } catch (error) {
      console.warn("Failed to get address for breadcrumb:", error);
    }

    // Get safety score if possible
    try {
      point.safetyScore = await this.getSafetyScore(
        point.latitude,
        point.longitude,
      );
    } catch (error) {
      console.warn("Failed to get safety score for breadcrumb:", error);
    }

    // Add to trail
    this.currentTrail.points.push(point);

    // Limit trail length
    if (this.currentTrail.points.length > this.config.maxTrailLength) {
      this.currentTrail.points = this.currentTrail.points.slice(
        -this.config.maxTrailLength,
      );
    }

    // Persist trail
    this.persistTrail(this.currentTrail);

    // Notify listeners
    this.listeners.onNewPoint.forEach((callback) => callback(point));
    this.listeners.onTrailUpdate.forEach((callback) =>
      callback(this.currentTrail!),
    );

    console.log("🍞 Breadcrumb dropped:", {
      lat: point.latitude.toFixed(6),
      lng: point.longitude.toFixed(6),
      emergency: point.isEmergency,
    });
  }

  private async getBatteryLevel(): Promise<number | undefined> {
    try {
      if ("getBattery" in navigator) {
        const battery = await (navigator as any).getBattery();
        return Math.round(battery.level * 100);
      }
    } catch (error) {
      console.warn("Failed to get battery level:", error);
    }
    return undefined;
  }

  private getNetworkSignal(): number | undefined {
    try {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      if (connection && connection.effectiveType) {
        const typeMap: { [key: string]: number } = {
          "slow-2g": 25,
          "2g": 50,
          "3g": 75,
          "4g": 100,
        };
        return typeMap[connection.effectiveType] || 50;
      }
    } catch (error) {
      console.warn("Failed to get network signal:", error);
    }
    return undefined;
  }

  private async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<string | undefined> {
    try {
      // Use the existing geocoding service if available
      const { geocodingService } = await import("./geocodingService");
      const result = await geocodingService.reverseGeocode(lat, lng);
      return geocodingService.getShortLocationName(result.location);
    } catch (error) {
      return undefined;
    }
  }

  private async getSafetyScore(
    lat: number,
    lng: number,
  ): Promise<number | undefined> {
    try {
      // Use existing safety service if available
      const { areaBasedSafety } = await import("./areaBasedSafety");
      const result = await areaBasedSafety.getSafetyScore({
        latitude: lat,
        longitude: lng,
      });
      return result.area.safetyScore;
    } catch (error) {
      return undefined;
    }
  }

  private persistTrail(trail: BreadcrumbTrail): void {
    try {
      const key = `breadcrumb_trail_${trail.id}`;
      localStorage.setItem(key, JSON.stringify(trail));
    } catch (error) {
      console.error("Failed to persist breadcrumb trail:", error);
    }
  }

  private loadPersistedTrails(): BreadcrumbTrail[] {
    const trails: BreadcrumbTrail[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("breadcrumb_trail_")) {
          const trailData = localStorage.getItem(key);
          if (trailData) {
            const trail = JSON.parse(trailData) as BreadcrumbTrail;
            // Convert date strings back to Date objects
            trail.startTime = new Date(trail.startTime);
            if (trail.endTime) trail.endTime = new Date(trail.endTime);
            trail.points = trail.points.map((point) => ({
              ...point,
              timestamp: new Date(point.timestamp),
            }));
            trails.push(trail);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load persisted trails:", error);
    }

    return trails;
  }

  private shareTrailWithEmergencyContacts(): void {
    if (!this.currentTrail) return;

    console.log("📤 Auto-sharing trail with emergency contacts");

    // This would integrate with the emergency contacts system
    // For now, just mark as shared
    this.currentTrail.sharedWith.push("emergency_contacts");
  }

  private generateTrailId(): string {
    return `trail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePointId(): string {
    return `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEncryptionKey(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Public API methods
  public getCurrentTrail(): BreadcrumbTrail | null {
    return this.currentTrail;
  }

  public getAllTrails(): BreadcrumbTrail[] {
    return this.loadPersistedTrails();
  }

  public getTrail(trailId: string): BreadcrumbTrail | null {
    const trails = this.loadPersistedTrails();
    return trails.find((trail) => trail.id === trailId) || null;
  }

  public deleteTrail(trailId: string): void {
    const key = `breadcrumb_trail_${trailId}`;
    localStorage.removeItem(key);
  }

  public shareTrail(
    trailId: string,
    shareWithUserIds: string[],
  ): Promise<string> {
    return new Promise((resolve) => {
      const trail = this.getTrail(trailId);
      if (trail) {
        trail.sharedWith.push(...shareWithUserIds);
        this.persistTrail(trail);

        // Generate share link
        const shareLink = `${window.location.origin}/trail/${trailId}${trail.encryptionKey ? `#${trail.encryptionKey}` : ""}`;
        resolve(shareLink);
      } else {
        throw new Error("Trail not found");
      }
    });
  }

  public updateConfig(newConfig: Partial<SafetyBreadcrumbsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔧 Breadcrumbs config updated:", this.config);

    // Restart tracking with new config if active
    if (this.isTracking) {
      this.restartPeriodicTracking();
    }
  }

  public getConfig(): SafetyBreadcrumbsConfig {
    return { ...this.config };
  }

  public isTrackingActive(): boolean {
    return this.isTracking;
  }

  public isInEmergencyMode(): boolean {
    return this.isEmergencyMode;
  }

  // Event listeners
  public onNewPoint(callback: (point: BreadcrumbPoint) => void): () => void {
    this.listeners.onNewPoint.push(callback);
    return () => {
      const index = this.listeners.onNewPoint.indexOf(callback);
      if (index > -1) this.listeners.onNewPoint.splice(index, 1);
    };
  }

  public onTrailUpdate(callback: (trail: BreadcrumbTrail) => void): () => void {
    this.listeners.onTrailUpdate.push(callback);
    return () => {
      const index = this.listeners.onTrailUpdate.indexOf(callback);
      if (index > -1) this.listeners.onTrailUpdate.splice(index, 1);
    };
  }

  public onEmergencyModeChange(
    callback: (isEmergency: boolean) => void,
  ): () => void {
    this.listeners.onEmergencyModeChange.push(callback);
    return () => {
      const index = this.listeners.onEmergencyModeChange.indexOf(callback);
      if (index > -1) this.listeners.onEmergencyModeChange.splice(index, 1);
    };
  }
}

export const safetyBreadcrumbsService = new SafetyBreadcrumbsService();
export type { BreadcrumbPoint, BreadcrumbTrail, SafetyBreadcrumbsConfig };
