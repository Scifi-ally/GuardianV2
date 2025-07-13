import { comprehensiveHeatmapService } from "./comprehensiveHeatmapService";
import { unifiedNotifications } from "./unifiedNotificationService";

interface SafeZoneState {
  isEnabled: boolean;
  isLoading: boolean;
  isActive: boolean;
  lastUpdate: number;
  pointCount: number;
  coverage: string;
  averageSafety: number;
}

interface SafeZoneController {
  map: google.maps.Map | null;
  heatmapLayer: google.maps.visualization.HeatmapLayer | null;
  state: SafeZoneState;
  callbacks: Set<(state: SafeZoneState) => void>;
}

export class AdvancedSafeZonesController {
  private static instance: AdvancedSafeZonesController;
  private controller: SafeZoneController;

  constructor() {
    this.controller = {
      map: null,
      heatmapLayer: null,
      state: {
        isEnabled: false,
        isLoading: false,
        isActive: false,
        lastUpdate: 0,
        pointCount: 0,
        coverage: "No coverage",
        averageSafety: 0,
      },
      callbacks: new Set(),
    };
  }

  static getInstance(): AdvancedSafeZonesController {
    if (!AdvancedSafeZonesController.instance) {
      AdvancedSafeZonesController.instance = new AdvancedSafeZonesController();
    }
    return AdvancedSafeZonesController.instance;
  }

  // Initialize the controller with a map instance
  initialize(map: google.maps.Map): void {
    console.log("🛡️ Initializing Advanced Safe Zones Controller...");
    this.controller.map = map;

    // Add map event listeners for automatic updates
    map.addListener("bounds_changed", () => {
      if (this.controller.state.isEnabled) {
        this.debouncedUpdate();
      }
    });

    map.addListener("zoom_changed", () => {
      if (this.controller.state.isEnabled) {
        this.debouncedUpdate();
      }
    });

    console.log("✅ Advanced Safe Zones Controller initialized");
  }

  // Enable safe zones with comprehensive debugging
  async enableSafeZones(): Promise<void> {
    if (!this.controller.map) {
      console.error("❌ Cannot enable safe zones: Map not initialized");
      unifiedNotifications.error("Safe zones unavailable: Map not ready");
      return;
    }

    if (this.controller.state.isEnabled) {
      console.log("ℹ️ Safe zones already enabled");
      return;
    }

    console.log("🔄 Enabling safe zones...");
    this.updateState({ isEnabled: true, isLoading: true });

    try {
      const bounds = this.controller.map.getBounds();
      if (!bounds) {
        throw new Error("Map bounds not available");
      }

      const zoom = this.controller.map.getZoom() || 15;
      console.log(`📊 Generating heatmap for zoom level ${zoom}`);

      // Generate comprehensive heatmap
      const heatmapPoints =
        await comprehensiveHeatmapService.generateFullAreaHeatmap(bounds, zoom);

      if (heatmapPoints.length === 0) {
        throw new Error("No heatmap data generated");
      }

      // Create weighted locations for Google Maps
      const weightedLocations = heatmapPoints.map((point) => ({
        location: point.location,
        weight: point.intensity || point.weight,
      }));

      console.log(
        `🔥 Rendering heatmap with ${weightedLocations.length} points`,
      );

      // Clear existing heatmap
      if (this.controller.heatmapLayer) {
        this.controller.heatmapLayer.setMap(null);
      }

      // Create enhanced heatmap layer
      const optimalRadius = Math.max(20, Math.min(120, 35 + (zoom - 10) * 8));
      const newHeatmapLayer = new google.maps.visualization.HeatmapLayer({
        data: weightedLocations,
        map: this.controller.map,
        radius: optimalRadius,
        opacity: 0.8,
        gradient: [
          "rgba(0, 0, 0, 0)", // Transparent (safe areas)
          "rgba(0, 255, 0, 0.2)", // Very light green (very safe)
          "rgba(34, 197, 94, 0.4)", // Light green (safe)
          "rgba(132, 204, 22, 0.5)", // Lime green (mostly safe)
          "rgba(234, 179, 8, 0.6)", // Yellow (caution)
          "rgba(245, 158, 11, 0.7)", // Amber (warning)
          "rgba(249, 115, 22, 0.8)", // Orange (concern)
          "rgba(239, 68, 68, 0.9)", // Red (danger)
          "rgba(220, 38, 38, 1.0)", // Dark red (high danger)
        ],
        maxIntensity: 1.2,
        dissipating: true,
      });

      this.controller.heatmapLayer = newHeatmapLayer;

      // Start real-time updates
      comprehensiveHeatmapService.startRealTimeUpdates(120000);

      // Subscribe to updates
      comprehensiveHeatmapService.subscribe((updatedPoints) => {
        if (updatedPoints.length > 0 && this.controller.state.isEnabled) {
          this.updateHeatmapLayer(updatedPoints);
        }
      });

      // Update state with statistics
      const stats = comprehensiveHeatmapService.getHeatmapStats();
      this.updateState({
        isLoading: false,
        isActive: true,
        pointCount: stats.totalPoints,
        coverage: stats.coverage,
        averageSafety: stats.averageSafety,
        lastUpdate: Date.now(),
      });

      unifiedNotifications.success("🛡️ Safe zones activated", {
        message: `${stats.totalPoints} points covering ${stats.coverage}`,
      });

      console.log("✅ Safe zones enabled successfully");
    } catch (error) {
      console.error("❌ Failed to enable safe zones:", error);
      this.updateState({ isLoading: false, isActive: false });
      unifiedNotifications.error("Failed to enable safe zones", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Disable safe zones
  disableSafeZones(): void {
    console.log("🔄 Disabling safe zones...");

    // Clear heatmap layer
    if (this.controller.heatmapLayer) {
      this.controller.heatmapLayer.setMap(null);
      this.controller.heatmapLayer = null;
    }

    // Stop updates
    comprehensiveHeatmapService.stopRealTimeUpdates();
    comprehensiveHeatmapService.clearHeatmapData();

    // Update state
    this.updateState({
      isEnabled: false,
      isLoading: false,
      isActive: false,
      pointCount: 0,
      coverage: "No coverage",
      averageSafety: 0,
    });

    unifiedNotifications.success("Safe zones disabled");
    console.log("✅ Safe zones disabled");
  }

  // Toggle safe zones
  async toggleSafeZones(enabled: boolean): Promise<void> {
    console.log(`🔄 Toggling safe zones: ${enabled}`);

    if (enabled) {
      await this.enableSafeZones();
    } else {
      this.disableSafeZones();
    }
  }

  // Update heatmap layer with new data
  private updateHeatmapLayer(points: any[]): void {
    if (!this.controller.heatmapLayer || !this.controller.map) return;

    const weightedLocations = points.map((point) => ({
      location: point.location,
      weight: point.intensity || point.weight,
    }));

    // Update the heatmap data
    this.controller.heatmapLayer.setData(weightedLocations);

    console.log(`🔄 Updated heatmap with ${weightedLocations.length} points`);
  }

  // Debounced update for map changes
  private updateTimeout: NodeJS.Timeout | null = null;
  private debouncedUpdate(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(async () => {
      if (this.controller.state.isEnabled && !this.controller.state.isLoading) {
        console.log("🗺️ Map changed, updating safe zones...");
        await this.enableSafeZones();
      }
    }, 1000);
  }

  // Update state and notify callbacks
  private updateState(newState: Partial<SafeZoneState>): void {
    this.controller.state = { ...this.controller.state, ...newState };
    this.notifyCallbacks();
  }

  // Subscribe to state changes
  subscribe(callback: (state: SafeZoneState) => void): () => void {
    this.controller.callbacks.add(callback);
    // Immediately call with current state
    callback(this.controller.state);
    return () => this.controller.callbacks.delete(callback);
  }

  // Notify all callbacks
  private notifyCallbacks(): void {
    this.controller.callbacks.forEach((callback) => {
      try {
        callback(this.controller.state);
      } catch (error) {
        console.error("Safe zones callback error:", error);
      }
    });
  }

  // Get current state
  getState(): SafeZoneState {
    return { ...this.controller.state };
  }

  // Manual refresh
  async refreshSafeZones(): Promise<void> {
    if (this.controller.state.isEnabled) {
      console.log("🔄 Manually refreshing safe zones...");
      await this.enableSafeZones();
    }
  }

  // Force clear (for debugging)
  forceClear(): void {
    console.log("🗑️ Force clearing safe zones...");
    this.disableSafeZones();
    comprehensiveHeatmapService.clearHeatmapData();
  }

  // Get debug info
  getDebugInfo(): {
    hasMap: boolean;
    hasHeatmapLayer: boolean;
    state: SafeZoneState;
    callbackCount: number;
  } {
    return {
      hasMap: !!this.controller.map,
      hasHeatmapLayer: !!this.controller.heatmapLayer,
      state: this.controller.state,
      callbackCount: this.controller.callbacks.size,
    };
  }
}

export const advancedSafeZonesController =
  AdvancedSafeZonesController.getInstance();
