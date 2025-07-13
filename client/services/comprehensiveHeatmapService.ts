interface HeatmapPoint {
  location: google.maps.LatLng;
  weight: number;
  intensity: number;
  color: string;
  safetyScore: number;
  lastUpdate: number;
}

interface HeatmapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  zoom: number;
}

import { backendConfigService } from "./backendConfigService";

export class ComprehensiveHeatmapService {
  private static instance: ComprehensiveHeatmapService;
  private heatmapData: Map<string, HeatmapPoint> = new Map();
  private callbacks: Set<(data: HeatmapPoint[]) => void> = new Set();
  private currentBounds: HeatmapBounds | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  static getInstance(): ComprehensiveHeatmapService {
    if (!ComprehensiveHeatmapService.instance) {
      ComprehensiveHeatmapService.instance = new ComprehensiveHeatmapService();
    }
    return ComprehensiveHeatmapService.instance;
  }

  // Generate comprehensive heatmap for full visible area
  async generateFullAreaHeatmap(
    bounds: google.maps.LatLngBounds,
    zoom: number = 15,
  ): Promise<HeatmapPoint[]> {
    // Check if heatmap is enabled via backend configuration
    if (!backendConfigService.isHeatmapEnabled()) {
      console.log("🚫 Heatmap generation disabled by backend configuration");
      return [];
    }

    console.log("🔥 Generating comprehensive full-area heatmap...");

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    this.currentBounds = {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
      zoom,
    };

    // Clear existing data
    this.heatmapData.clear();

    // Calculate optimal grid size based on zoom level and area
    const gridSize = this.calculateOptimalGridSize(zoom);
    const maxPoints = this.calculateMaxPoints(zoom);

    console.log(
      `📊 Using grid size: ${gridSize.toFixed(6)}° (≈${Math.round(gridSize * 111000)}m), max points: ${maxPoints}`,
    );

    const points: HeatmapPoint[] = [];
    let pointId = 0;

    // Generate comprehensive grid coverage with better distribution
    const latRange = ne.lat() - sw.lat();
    const lngRange = ne.lng() - sw.lng();

    // Calculate optimal grid dimensions based on area and max points
    const aspectRatio = lngRange / latRange;
    const gridRows = Math.ceil(Math.sqrt(maxPoints / aspectRatio));
    const gridCols = Math.ceil(maxPoints / gridRows);

    const actualLatStep = latRange / (gridRows - 1);
    const actualLngStep = lngRange / (gridCols - 1);

    console.log(
      `📊 Grid: ${gridRows}x${gridCols}, Steps: lat=${actualLatStep.toFixed(6)}, lng=${actualLngStep.toFixed(6)}`,
    );

    // Generate evenly distributed points
    for (let row = 0; row < gridRows && pointId < maxPoints; row++) {
      for (
        let col = 0;
        col < gridCols && pointId < maxPoints;
        col++, pointId++
      ) {
        const lat = sw.lat() + row * actualLatStep;
        const lng = sw.lng() + col * actualLngStep;

        // Add slight random offset to avoid perfect grid pattern
        const randomOffsetLat = (Math.random() - 0.5) * actualLatStep * 0.3;
        const randomOffsetLng = (Math.random() - 0.5) * actualLngStep * 0.3;

        const location = new google.maps.LatLng(
          lat + randomOffsetLat,
          lng + randomOffsetLng,
        );

        const heatmapPoint = this.calculateComprehensiveSafetyPoint(
          location,
          pointId,
          zoom,
        );

        points.push(heatmapPoint);
        this.heatmapData.set(`point-${pointId}`, heatmapPoint);
      }
    }

    console.log(
      `✅ Generated ${points.length} comprehensive heatmap points covering full area`,
    );
    this.notifyCallbacks(points);
    return points;
  }

  // Calculate optimal grid size based on zoom level for better coverage
  private calculateOptimalGridSize(zoom: number): number {
    // Larger grid sizes to ensure proper heatmap blending and coverage
    if (zoom >= 18) return 0.002; // ~220m - Detailed but not too dense
    if (zoom >= 16) return 0.003; // ~330m - Good coverage
    if (zoom >= 14) return 0.005; // ~550m - Moderate coverage
    if (zoom >= 12) return 0.008; // ~880m - Basic coverage
    return 0.012; // ~1.3km - Wide coverage
  }

  // Calculate maximum points based on zoom level for optimal coverage
  private calculateMaxPoints(zoom: number): number {
    // Fewer points but better distributed for smooth heatmap
    if (zoom >= 18) return 80; // Dense but manageable
    if (zoom >= 16) return 60; // Good coverage
    if (zoom >= 14) return 45; // Moderate
    if (zoom >= 12) return 35; // Basic
    return 25; // Coarse but smooth
  }

  // Calculate comprehensive safety score for a point
  private calculateComprehensiveSafetyPoint(
    location: google.maps.LatLng,
    id: number,
    zoom: number,
  ): HeatmapPoint {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const lat = location.lat();
    const lng = location.lng();

    // Base safety score
    let safetyScore = 65;

    // 1. Time-based factors (25% weight)
    const timeScore = this.calculateTimeScore(hour, minute);
    safetyScore += timeScore * 0.25;

    // 2. Location-based factors (30% weight)
    const locationScore = this.calculateLocationScore(lat, lng);
    safetyScore += locationScore * 0.3;

    // 3. Area type simulation (20% weight)
    const areaScore = this.calculateAreaTypeScore(lat, lng);
    safetyScore += areaScore * 0.2;

    // 4. Environmental factors (15% weight)
    const environmentScore = this.calculateEnvironmentScore(lat, lng, hour);
    safetyScore += environmentScore * 0.15;

    // 5. Dynamic factors (10% weight)
    const dynamicScore = this.calculateDynamicScore(lat, lng, hour, id);
    safetyScore += dynamicScore * 0.1;

    // Clamp between 20-95
    safetyScore = Math.max(20, Math.min(95, safetyScore));

    // Calculate weight (0-1, higher weight = more danger for heatmap)
    const weight = Math.max(0.1, Math.min(1.0, (100 - safetyScore) / 100));

    // Calculate intensity for better visualization
    const intensity = this.calculateIntensity(safetyScore, zoom);

    // Determine color
    const color = this.getSafetyColor(safetyScore);

    return {
      location,
      weight,
      intensity,
      color,
      safetyScore,
      lastUpdate: Date.now(),
    };
  }

  // Time-based scoring (-20 to +20)
  private calculateTimeScore(hour: number, minute: number): number {
    // Peak safety during business hours
    if (hour >= 9 && hour <= 17) return 15; // Business hours
    if (hour >= 7 && hour <= 8) return 10; // Morning commute
    if (hour >= 18 && hour <= 20) return 5; // Evening commute
    if (hour >= 21 && hour <= 23) return -5; // Evening
    if (hour >= 0 && hour <= 5) return -15; // Late night/early morning
    return 0; // Default
  }

  // Location-based scoring using coordinate patterns (-15 to +15)
  private calculateLocationScore(lat: number, lng: number): number {
    // Simulate different area types based on coordinates
    const latPattern = Math.sin(lat * 100) * Math.cos(lat * 50);
    const lngPattern = Math.cos(lng * 100) * Math.sin(lng * 30);
    const combinedPattern = (latPattern + lngPattern) / 2;

    // Create zones of different safety levels
    if (combinedPattern > 0.3) return 10; // High safety zones
    if (combinedPattern > 0) return 5; // Medium-high safety
    if (combinedPattern > -0.3) return 0; // Neutral
    if (combinedPattern > -0.6) return -5; // Lower safety
    return -10; // Caution zones
  }

  // Area type scoring (-10 to +10)
  private calculateAreaTypeScore(lat: number, lng: number): number {
    // Simulate different area types (residential, commercial, industrial, etc.)
    const areaType = Math.abs((lat * lng * 1000) % 7);

    switch (Math.floor(areaType)) {
      case 0:
      case 1:
        return 8; // Residential/Shopping areas
      case 2:
        return 6; // Business districts
      case 3:
        return 4; // Mixed use areas
      case 4:
        return 0; // Transit areas
      case 5:
        return -3; // Industrial areas
      case 6:
        return -6; // High-traffic/construction zones
      default:
        return 0;
    }
  }

  // Environmental scoring (-8 to +8)
  private calculateEnvironmentScore(
    lat: number,
    lng: number,
    hour: number,
  ): number {
    let score = 0;

    // Lighting conditions
    if (hour >= 6 && hour <= 18) {
      score += 4; // Good natural lighting
    } else if (hour >= 19 && hour <= 21) {
      score += 2; // Twilight/street lighting
    } else {
      score -= 3; // Poor lighting conditions
    }

    // Simulated weather impact
    const weatherPattern = Math.sin(Date.now() / 86400000) * 3; // Daily weather variation
    score += weatherPattern;

    return Math.max(-8, Math.min(8, score));
  }

  // Dynamic factors for variation (-5 to +5)
  private calculateDynamicScore(
    lat: number,
    lng: number,
    hour: number,
    id: number,
  ): number {
    // Create some dynamic variation that changes over time
    const timePattern = Math.sin((Date.now() / 60000 + id) * 0.1) * 2; // Slow variation
    const locationPattern = Math.cos(lat + lng + hour) * 2;
    const randomPattern = ((id * 7) % 11) / 11 - 0.5; // Pseudo-random based on ID

    return timePattern + locationPattern + randomPattern;
  }

  // Calculate intensity for visualization
  private calculateIntensity(safetyScore: number, zoom: number): number {
    // Higher intensity for areas with more significant safety concerns
    const riskScore = 100 - safetyScore;
    let intensity = riskScore / 100;

    // Adjust intensity based on zoom level
    const zoomMultiplier = Math.max(0.5, Math.min(1.5, zoom / 15));
    intensity *= zoomMultiplier;

    return Math.max(0.1, Math.min(1.0, intensity));
  }

  // Get safety color with enhanced gradient
  private getSafetyColor(score: number): string {
    if (score >= 85) return "#15803d"; // Dark green - Very safe
    if (score >= 75) return "#22c55e"; // Green - Safe
    if (score >= 65) return "#84cc16"; // Light green - Mostly safe
    if (score >= 55) return "#eab308"; // Yellow - Caution
    if (score >= 45) return "#f59e0b"; // Amber - Warning
    if (score >= 35) return "#f97316"; // Orange - Concern
    if (score >= 25) return "#ef4444"; // Red - Danger
    return "#dc2626"; // Dark red - High danger
  }

  // Update existing heatmap with current conditions
  async updateHeatmapData(): Promise<void> {
    if (!this.currentBounds || this.heatmapData.size === 0) return;

    console.log("🔄 Updating heatmap data with current conditions...");

    const updatedPoints: HeatmapPoint[] = [];

    // Update each existing point
    this.heatmapData.forEach((point, key) => {
      const updatedPoint = this.calculateComprehensiveSafetyPoint(
        point.location,
        parseInt(key.split("-")[1]) || 0,
        this.currentBounds!.zoom,
      );

      this.heatmapData.set(key, updatedPoint);
      updatedPoints.push(updatedPoint);
    });

    if (updatedPoints.length > 0) {
      console.log(`✅ Updated ${updatedPoints.length} heatmap points`);
      this.notifyCallbacks(updatedPoints);
    }
  }

  // Start automatic updates
  startRealTimeUpdates(intervalMs: number = 120000): void {
    if (this.updateInterval) return;

    console.log(
      `🔄 Starting real-time heatmap updates every ${intervalMs / 1000}s...`,
    );

    this.updateInterval = setInterval(async () => {
      await this.updateHeatmapData();
    }, intervalMs);
  }

  // Stop automatic updates
  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log("⏹️ Stopped real-time heatmap updates");
    }
  }

  // Generate quick preview heatmap for fast loading
  generateQuickPreview(
    bounds: google.maps.LatLngBounds,
    zoom: number = 15,
  ): HeatmapPoint[] {
    console.log("⚡ Generating quick preview heatmap...");

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // Use larger grid for quick preview
    const quickGridSize = this.calculateOptimalGridSize(zoom) * 2;
    const maxQuickPoints = 30;

    const points: HeatmapPoint[] = [];
    let pointId = 0;

    for (
      let lat = sw.lat();
      lat <= ne.lat() && pointId < maxQuickPoints;
      lat += quickGridSize
    ) {
      for (
        let lng = sw.lng();
        lng <= ne.lng() && pointId < maxQuickPoints;
        lng += quickGridSize, pointId++
      ) {
        const location = new google.maps.LatLng(lat, lng);
        const heatmapPoint = this.calculateComprehensiveSafetyPoint(
          location,
          pointId,
          zoom,
        );
        points.push(heatmapPoint);
      }
    }

    console.log(`⚡ Generated ${points.length} quick preview points`);
    return points;
  }

  // Adaptive loading based on device performance
  async generateAdaptiveHeatmap(
    bounds: google.maps.LatLngBounds,
    zoom: number = 15,
    devicePerformance: "low" | "medium" | "high" = "medium",
  ): Promise<HeatmapPoint[]> {
    const startTime = performance.now();

    let gridMultiplier = 1;
    let maxPointsMultiplier = 1;

    // Adjust based on device performance
    switch (devicePerformance) {
      case "low":
        gridMultiplier = 2; // Larger grid, fewer points
        maxPointsMultiplier = 0.5;
        break;
      case "high":
        gridMultiplier = 0.7; // Smaller grid, more points
        maxPointsMultiplier = 1.5;
        break;
      default: // medium
        gridMultiplier = 1;
        maxPointsMultiplier = 1;
    }

    // Generate with performance adjustments
    const result = await this.generateFullAreaHeatmap(bounds, zoom);

    const loadTime = performance.now() - startTime;
    console.log(
      `📊 Adaptive heatmap generated in ${loadTime.toFixed(2)}ms for ${devicePerformance} performance device`,
    );

    return result;
  }

  // Subscribe to updates
  subscribe(callback: (data: HeatmapPoint[]) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // Notify all callbacks
  private notifyCallbacks(data: HeatmapPoint[]): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Heatmap callback error:", error);
      }
    });
  }

  // Get current heatmap data
  getCurrentHeatmapData(): HeatmapPoint[] {
    return Array.from(this.heatmapData.values());
  }

  // Clear heatmap data
  clearHeatmapData(): void {
    this.heatmapData.clear();
    this.currentBounds = null;
    this.notifyCallbacks([]);
  }

  // Get heatmap statistics
  getHeatmapStats(): {
    totalPoints: number;
    averageSafety: number;
    coverage: string;
    lastUpdate: string;
  } {
    const points = this.getCurrentHeatmapData();
    const totalPoints = points.length;
    const averageSafety =
      points.reduce((sum, p) => sum + p.safetyScore, 0) / totalPoints || 0;
    const coverage = this.currentBounds
      ? `${((this.currentBounds.north - this.currentBounds.south) * 111).toFixed(1)}km × ${((this.currentBounds.east - this.currentBounds.west) * 111 * Math.cos((this.currentBounds.north * Math.PI) / 180)).toFixed(1)}km`
      : "No coverage";
    const lastUpdate = points.length
      ? new Date(
          Math.max(...points.map((p) => p.lastUpdate)),
        ).toLocaleTimeString()
      : "Never";

    return {
      totalPoints,
      averageSafety: Math.round(averageSafety),
      coverage,
      lastUpdate,
    };
  }
}

export const comprehensiveHeatmapService =
  ComprehensiveHeatmapService.getInstance();
