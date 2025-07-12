import { useState, useEffect } from "react";
import { EventEmitter } from "@/lib/eventEmitter";

// Types for real-time data
export interface RealTimeStats {
  activeAlerts: number;
  safeTrips: number;
  safetyScore: number;
  emergencyContacts: number;
  lastUpdated: Date;
}

export interface RealTimeLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
  safetyScore?: number;
}

export interface RealTimeAlert {
  id: string;
  type: "emergency" | "warning" | "info";
  title: string;
  message: string;
  location?: RealTimeLocation;
  timestamp: Date;
  expiresAt?: Date;
}

export interface RealTimeTraffic {
  congestionLevel: "low" | "moderate" | "high" | "severe";
  avgSpeed: number;
  incidents: Array<{
    type: "accident" | "construction" | "closure";
    description: string;
    location: RealTimeLocation;
    severity: "minor" | "major" | "critical";
  }>;
}

class RealTimeService extends EventEmitter {
  private isConnected = false;
  private updateInterval: number | null = null;
  private stats: RealTimeStats | null = null;
  private currentLocation: RealTimeLocation | null = null;
  private alerts: RealTimeAlert[] = [];

  constructor() {
    super();
    this.initializeService();
  }

  private initializeService() {
    // Initialize with default stats
    this.stats = {
      activeAlerts: 0,
      safeTrips: 0,
      safetyScore: 95,
      emergencyContacts: 0,
      lastUpdated: new Date(),
    };

    this.startRealTimeUpdates();
  }

  private startRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateStats();
      this.updateLocationFromBrowser();
      this.checkForAlerts();
    }, 30000);

    this.isConnected = true;
    this.emit("connected");
  }

  private updateStats() {
    if (!this.stats) return;

    // Simulate real-time stats updates
    const previousStats = { ...this.stats };

    // Gradually increase safe trips (simulate real usage)
    if (Math.random() > 0.7) {
      this.stats.safeTrips += 1;
    }

    // Simulate safety score fluctuations based on location and time
    const timeOfDay = new Date().getHours();
    const baseScore = timeOfDay >= 22 || timeOfDay <= 6 ? 85 : 95; // Lower at night
    const variation = (Math.random() - 0.5) * 10; // ±5 points
    this.stats.safetyScore = Math.max(70, Math.min(100, baseScore + variation));

    // Update timestamp
    this.stats.lastUpdated = new Date();

    // Emit update if significant change
    if (
      Math.abs(previousStats.safetyScore - this.stats.safetyScore) > 5 ||
      previousStats.safeTrips !== this.stats.safeTrips
    ) {
      this.emit("statsUpdated", this.stats);
    }
  }

  private updateLocationFromBrowser() {
    // Get current location from browser
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: RealTimeLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          // Add safety score based on location (mock calculation)
          newLocation.safetyScore = this.calculateLocationSafety(newLocation);

          this.currentLocation = newLocation;
          this.emit("locationUpdated", newLocation);
        },
        (error) => {
          console.warn("Failed to get location:", error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    }
  }

  public updateLocation(location: RealTimeLocation) {
    this.currentLocation = location;
    this.emit("locationUpdated", location);
  }

  private calculateLocationSafety(location: RealTimeLocation): number {
    // Mock safety calculation based on coordinates
    // In real app, this would call safety API
    const lat = location.latitude;
    const lng = location.longitude;

    // Simple algorithm: closer to city center = higher safety (mock)
    const distance = Math.sqrt(
      Math.pow(lat - 37.7749, 2) + Math.pow(lng + 122.4194, 2),
    );
    const baseSafety = Math.max(60, 100 - distance * 1000);

    // Add random variation
    const variation = (Math.random() - 0.5) * 20;
    return Math.max(50, Math.min(100, baseSafety + variation));
  }

  private checkForAlerts() {
    // Simulate random alerts (replace with real alert checking)
    if (Math.random() > 0.95) {
      // 5% chance of new alert
      const alertTypes = ["warning", "info"] as const;
      const alertType =
        alertTypes[Math.floor(Math.random() * alertTypes.length)];

      const alert: RealTimeAlert = {
        id: `alert_${Date.now()}`,
        type: alertType,
        title: alertType === "warning" ? "Area Advisory" : "Safety Update",
        message:
          alertType === "warning"
            ? "Increased police activity in your area. Stay alert."
            : "Local safety conditions have improved.",
        location: this.currentLocation || undefined,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      };

      this.alerts.push(alert);
      this.emit("alertReceived", alert);

      // Update active alerts count
      if (this.stats) {
        this.stats.activeAlerts = this.alerts.filter(
          (a) => !a.expiresAt || a.expiresAt > new Date(),
        ).length;
        this.emit("statsUpdated", this.stats);
      }
    }

    // Clean up expired alerts
    this.alerts = this.alerts.filter(
      (alert) => !alert.expiresAt || alert.expiresAt > new Date(),
    );
  }

  // Public methods
  public getStats(): RealTimeStats | null {
    return this.stats;
  }

  public getCurrentLocation(): RealTimeLocation | null {
    return this.currentLocation;
  }

  public getActiveAlerts(): RealTimeAlert[] {
    return this.alerts.filter(
      (alert) => !alert.expiresAt || alert.expiresAt > new Date(),
    );
  }

  public updateEmergencyContactCount(count: number) {
    if (this.stats) {
      this.stats.emergencyContacts = count;
      this.stats.lastUpdated = new Date();
      this.emit("statsUpdated", this.stats);
    }
  }

  public incrementSafeTrips() {
    if (this.stats) {
      this.stats.safeTrips += 1;
      this.stats.lastUpdated = new Date();
      this.emit("statsUpdated", this.stats);
    }
  }

  public reportEmergency() {
    const emergencyAlert: RealTimeAlert = {
      id: `emergency_${Date.now()}`,
      type: "emergency",
      title: "Emergency Alert Sent",
      message: "Your emergency contacts have been notified of your situation.",
      location: this.currentLocation || undefined,
      timestamp: new Date(),
    };

    this.alerts.push(emergencyAlert);
    this.emit("alertReceived", emergencyAlert);

    if (this.stats) {
      this.stats.activeAlerts += 1;
      this.stats.lastUpdated = new Date();
      this.emit("statsUpdated", this.stats);
    }
  }

  private liveTrackingInterval: number | null = null;

  public startLiveTracking(initialLocation: RealTimeLocation) {
    // Update current location
    this.updateLocation(initialLocation);

    // Start periodic location updates every 2 minutes
    if (this.liveTrackingInterval) {
      clearInterval(this.liveTrackingInterval);
    }

    this.liveTrackingInterval = setInterval(
      () => {
        // In a real app, this would get fresh location data
        // For now, simulate slight location changes
        if (this.currentLocation) {
          const updatedLocation = {
            ...this.currentLocation,
            timestamp: Date.now(),
            // Simulate minor location variance
            latitude:
              this.currentLocation.latitude + (Math.random() - 0.5) * 0.0001,
            longitude:
              this.currentLocation.longitude + (Math.random() - 0.5) * 0.0001,
          };

          this.updateLocation(updatedLocation);
          this.emit("liveTrackingUpdate", updatedLocation);
        }
      },
      2 * 60 * 1000,
    ); // 2 minutes

    // Add tracking alert
    const trackingAlert: RealTimeAlert = {
      id: `live_tracking_${Date.now()}`,
      type: "info",
      title: "Live Tracking Active",
      message:
        "Your location is being shared with emergency contacts every 2 minutes.",
      location: initialLocation,
      timestamp: new Date(),
    };

    this.alerts.push(trackingAlert);
    this.emit("alertReceived", trackingAlert);
  }

  public stopLiveTracking() {
    if (this.liveTrackingInterval) {
      clearInterval(this.liveTrackingInterval);
      this.liveTrackingInterval = null;
    }

    // Add stopped tracking alert
    const stoppedAlert: RealTimeAlert = {
      id: `tracking_stopped_${Date.now()}`,
      type: "info",
      title: "Live Tracking Stopped",
      message: "Location sharing with emergency contacts has been disabled.",
      timestamp: new Date(),
    };

    this.alerts.push(stoppedAlert);
    this.emit("alertReceived", stoppedAlert);
  }

  public isLiveTrackingActive(): boolean {
    return this.liveTrackingInterval !== null;
  }

  public addAlert(alert: RealTimeAlert) {
    this.alerts.push(alert);
    this.emit("alertReceived", alert);

    if (this.stats) {
      this.stats.activeAlerts = this.alerts.filter(
        (a) => !a.expiresAt || a.expiresAt > new Date(),
      ).length;
      this.stats.lastUpdated = new Date();
      this.emit("statsUpdated", this.stats);
    }
  }

  public dismissAlert(alertId: string) {
    this.alerts = this.alerts.filter((alert) => alert.id !== alertId);

    if (this.stats) {
      this.stats.activeAlerts = this.alerts.filter(
        (a) => !a.expiresAt || a.expiresAt > new Date(),
      ).length;
      this.stats.lastUpdated = new Date();
      this.emit("statsUpdated", this.stats);
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected;
  }

  public reconnect() {
    this.isConnected = false;
    this.startRealTimeUpdates();
  }

  public disconnect() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isConnected = false;
    this.emit("disconnected");
  }

  // Settings persistence
  public saveSettings(settings: any) {
    try {
      localStorage.setItem("guardian_settings", JSON.stringify(settings));
      this.emit("settingsSaved", settings);
      return true;
    } catch (error) {
      console.error("Failed to save settings:", error);
      return false;
    }
  }

  public loadSettings(): any {
    try {
      const saved = localStorage.getItem("guardian_settings");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to load settings:", error);
      return null;
    }
  }
}

// Create singleton instance
export const realTimeService = new RealTimeService();

// React hook for using real-time data
export function useRealTimeData() {
  const [stats, setStats] = useState<RealTimeStats | null>(null);
  const [location, setLocation] = useState<RealTimeLocation | null>(null);
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initial data
    setStats(realTimeService.getStats());
    setLocation(realTimeService.getCurrentLocation());
    setAlerts(realTimeService.getActiveAlerts());
    setIsConnected(realTimeService.isConnectionActive());

    // Event listeners
    const handleStatsUpdate = (newStats: RealTimeStats) => setStats(newStats);
    const handleLocationUpdate = (newLocation: RealTimeLocation) =>
      setLocation(newLocation);
    const handleAlertReceived = (alert: RealTimeAlert) => {
      setAlerts((prev) => [...prev, alert]);
    };
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    realTimeService.on("statsUpdated", handleStatsUpdate);
    realTimeService.on("locationUpdated", handleLocationUpdate);
    realTimeService.on("alertReceived", handleAlertReceived);
    realTimeService.on("connected", handleConnected);
    realTimeService.on("disconnected", handleDisconnected);

    return () => {
      realTimeService.off("statsUpdated", handleStatsUpdate);
      realTimeService.off("locationUpdated", handleLocationUpdate);
      realTimeService.off("alertReceived", handleAlertReceived);
      realTimeService.off("connected", handleConnected);
      realTimeService.off("disconnected", handleDisconnected);
    };
  }, []);

  return {
    stats,
    location,
    alerts,
    isConnected,
    incrementSafeTrips:
      realTimeService.incrementSafeTrips.bind(realTimeService),
    reportEmergency: realTimeService.reportEmergency.bind(realTimeService),
    dismissAlert: realTimeService.dismissAlert.bind(realTimeService),
    reconnect: realTimeService.reconnect.bind(realTimeService),
  };
}

export default realTimeService;
