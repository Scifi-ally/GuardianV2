interface GridCell {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: google.maps.LatLng;
  safetyScore: number;
  color: string;
  opacity: number;
  lastUpdate: number;
  cellId: string;
  rectangle?: google.maps.Rectangle;
}

interface SafetyFactors {
  timeOfDay: number;
  locationDensity: number;
  historicalIncidents: number;
  lighting: number;
  accessibility: number;
  crowdLevel: number;
  weatherConditions: number;
  emergencyProximity: number;
}

interface GridConfiguration {
  cellSizeMeters: number;
  maxCellsPerDimension: number;
  updateIntervalMs: number;
  zoomLevels: {
    [zoom: number]: {
      cellSize: number;
      maxCells: number;
    };
  };
}

import { backendConfigService } from "./backendConfigService";

export class StableGridHeatmapService {
  private static instance: StableGridHeatmapService;
  private gridCells: Map<string, GridCell> = new Map();
  private rectangles: google.maps.Rectangle[] = [];
  private callbacks: Set<(cells: GridCell[]) => void> = new Set();
  private currentBounds: google.maps.LatLngBounds | null = null;
  private currentZoom: number = 15;
  private map: google.maps.Map | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isVisible: boolean = true;

  // Fixed grid configuration that doesn't change dramatically with zoom
  private readonly config: GridConfiguration = {
    cellSizeMeters: 150, // Base cell size in meters
    maxCellsPerDimension: 50,
    updateIntervalMs: 180000, // 3 minutes
    zoomLevels: {
      10: { cellSize: 500, maxCells: 20 },
      11: { cellSize: 400, maxCells: 25 },
      12: { cellSize: 300, maxCells: 30 },
      13: { cellSize: 250, maxCells: 35 },
      14: { cellSize: 200, maxCells: 40 },
      15: { cellSize: 150, maxCells: 45 },
      16: { cellSize: 120, maxCells: 50 },
      17: { cellSize: 100, maxCells: 55 },
      18: { cellSize: 80, maxCells: 60 },
      19: { cellSize: 60, maxCells: 65 },
      20: { cellSize: 50, maxCells: 70 },
    },
  };

  static getInstance(): StableGridHeatmapService {
    if (!StableGridHeatmapService.instance) {
      StableGridHeatmapService.instance = new StableGridHeatmapService();
    }
    return StableGridHeatmapService.instance;
  }

  // Initialize with map reference
  initialize(map: google.maps.Map): void {
    this.map = map;
    console.log("🔷 Stable Grid Heatmap Service initialized");
  }

  // Generate stable grid that doesn't change dramatically with zoom
  async generateStableGrid(
    bounds: google.maps.LatLngBounds,
    zoom: number,
  ): Promise<GridCell[]> {
    // Check if heatmap is enabled via backend configuration
    if (!backendConfigService.isHeatmapEnabled()) {
      console.log(
        "🚫 Grid heatmap generation disabled by backend configuration",
      );
      return [];
    }

    console.log(`🔷 Generating stable grid for zoom ${zoom}...`);

    this.currentBounds = bounds;
    this.currentZoom = zoom;

    // Clear existing grid
    this.clearGrid();

    // Get zoom-appropriate configuration
    const zoomConfig = this.getZoomConfig(zoom);
    const cellSizeMeters = zoomConfig.cellSize;
    const maxCells = zoomConfig.maxCells;

    console.log(
      `📊 Using cell size: ${cellSizeMeters}m, max cells: ${maxCells}`,
    );

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // Calculate cell size in degrees (approximate)
    const cellSizeLat = cellSizeMeters / 111000; // 1 degree ≈ 111km
    const cellSizeLng =
      cellSizeMeters / (111000 * Math.cos((ne.lat() * Math.PI) / 180));

    // Calculate grid dimensions
    const latRange = ne.lat() - sw.lat();
    const lngRange = ne.lng() - sw.lng();

    const cellsLat = Math.min(
      maxCells,
      Math.max(5, Math.ceil(latRange / cellSizeLat)),
    );
    const cellsLng = Math.min(
      maxCells,
      Math.max(5, Math.ceil(lngRange / cellSizeLng)),
    );

    const actualCellSizeLat = latRange / cellsLat;
    const actualCellSizeLng = lngRange / cellsLng;

    console.log(
      `📊 Grid: ${cellsLat}×${cellsLng} cells, actual size: ${actualCellSizeLat.toFixed(6)}°×${actualCellSizeLng.toFixed(6)}°`,
    );

    const newCells: GridCell[] = [];

    // Generate grid cells
    for (let row = 0; row < cellsLat; row++) {
      for (let col = 0; col < cellsLng; col++) {
        const south = sw.lat() + row * actualCellSizeLat;
        const north = south + actualCellSizeLat;
        const west = sw.lng() + col * actualCellSizeLng;
        const east = west + actualCellSizeLng;

        const cellBounds = {
          north,
          south,
          east,
          west,
        };

        const center = new google.maps.LatLng(
          (north + south) / 2,
          (east + west) / 2,
        );

        const cellId = `${row}-${col}`;
        const safetyScore = await this.calculateAdvancedSafetyScore(
          center,
          cellBounds,
          row,
          col,
          zoom,
        );

        const gridCell: GridCell = {
          bounds: cellBounds,
          center,
          safetyScore,
          color: this.getSafetyColor(safetyScore),
          opacity: this.getSafetyOpacity(safetyScore),
          lastUpdate: Date.now(),
          cellId,
        };

        this.gridCells.set(cellId, gridCell);
        newCells.push(gridCell);
      }
    }

    console.log(`✅ Generated ${newCells.length} stable grid cells`);
    this.notifyCallbacks(newCells);
    this.renderGrid();

    return newCells;
  }

  // Advanced safety scoring using multiple scientific factors
  private async calculateAdvancedSafetyScore(
    center: google.maps.LatLng,
    bounds: GridCell["bounds"],
    row: number,
    col: number,
    zoom: number,
  ): Promise<number> {
    const factors = await this.calculateSafetyFactors(center, bounds);

    // Weighted scoring system (total: 100%)
    const weights = {
      timeOfDay: 0.15, // 15% - Time-based safety
      locationDensity: 0.2, // 20% - Population/activity density
      historicalIncidents: 0.18, // 18% - Historical safety data
      lighting: 0.12, // 12% - Lighting conditions
      accessibility: 0.1, // 10% - Emergency access
      crowdLevel: 0.08, // 8% - Current crowd levels
      weatherConditions: 0.09, // 9% - Weather impact
      emergencyProximity: 0.08, // 8% - Proximity to emergency services
    };

    // Calculate weighted score (0-100)
    let totalScore = 0;
    totalScore += factors.timeOfDay * weights.timeOfDay;
    totalScore += factors.locationDensity * weights.locationDensity;
    totalScore += factors.historicalIncidents * weights.historicalIncidents;
    totalScore += factors.lighting * weights.lighting;
    totalScore += factors.accessibility * weights.accessibility;
    totalScore += factors.crowdLevel * weights.crowdLevel;
    totalScore += factors.weatherConditions * weights.weatherConditions;
    totalScore += factors.emergencyProximity * weights.emergencyProximity;

    // Add spatial smoothing to prevent harsh transitions
    const smoothedScore = await this.applySpatialSmoothing(
      totalScore,
      row,
      col,
      center,
    );

    return Math.max(20, Math.min(95, smoothedScore));
  }

  // Calculate comprehensive safety factors
  private async calculateSafetyFactors(
    center: google.maps.LatLng,
    bounds: GridCell["bounds"],
  ): Promise<SafetyFactors> {
    const lat = center.lat();
    const lng = center.lng();
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    return {
      timeOfDay: this.calculateTimeOfDayFactor(hour, dayOfWeek),
      locationDensity: this.calculateLocationDensityFactor(lat, lng),
      historicalIncidents: this.calculateHistoricalIncidentsFactor(lat, lng),
      lighting: this.calculateLightingFactor(hour, lat, lng),
      accessibility: this.calculateAccessibilityFactor(lat, lng),
      crowdLevel: this.calculateCrowdLevelFactor(lat, lng, hour),
      weatherConditions: this.calculateWeatherConditionsFactor(lat, lng),
      emergencyProximity: this.calculateEmergencyProximityFactor(lat, lng),
    };
  }

  // Time of day safety factor (0-100)
  private calculateTimeOfDayFactor(hour: number, dayOfWeek: number): number {
    let baseScore = 70;

    // Time-based adjustments
    if (hour >= 6 && hour <= 8)
      baseScore += 15; // Morning rush - high activity
    else if (hour >= 9 && hour <= 17)
      baseScore += 20; // Business hours - safest
    else if (hour >= 18 && hour <= 20)
      baseScore += 10; // Evening rush - moderate
    else if (hour >= 21 && hour <= 23)
      baseScore -= 10; // Evening - lower safety
    else if (hour >= 0 && hour <= 5) baseScore -= 25; // Late night - lowest safety

    // Weekend adjustments
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend
      if (hour >= 10 && hour <= 22)
        baseScore += 5; // Weekend daytime boost
      else baseScore -= 5;
    }

    return Math.max(0, Math.min(100, baseScore));
  }

  // Location density factor based on coordinate patterns (0-100)
  private calculateLocationDensityFactor(lat: number, lng: number): number {
    // Simulate different area types using mathematical patterns
    const urbanPattern = Math.sin(lat * 157.3) * Math.cos(lng * 234.7);
    const commercialPattern = Math.cos(lat * 312.1) * Math.sin(lng * 198.4);
    const residentialPattern = Math.sin(lat * 89.6) * Math.sin(lng * 145.2);

    // Combine patterns to create realistic urban density
    const densityScore =
      urbanPattern * 0.4 + commercialPattern * 0.3 + residentialPattern * 0.3;

    // Convert to safety score (higher density = higher safety in most cases)
    let safetyScore = 50 + densityScore * 30;

    // Adjust for extremely high density (can reduce safety)
    if (densityScore > 0.7) safetyScore -= 10;

    return Math.max(20, Math.min(90, safetyScore));
  }

  // Historical incidents factor (0-100)
  private calculateHistoricalIncidentsFactor(lat: number, lng: number): number {
    // Simulate historical incident data using coordinate-based patterns
    const crimePattern = Math.abs(Math.sin(lat * 234.5 + lng * 156.8));
    const accidentPattern = Math.abs(Math.cos(lat * 178.2 - lng * 289.3));
    const vandalismPattern = Math.abs(Math.sin(lat * lng * 1247.6));

    // Weight different incident types
    const incidentScore =
      crimePattern * 0.5 + accidentPattern * 0.3 + vandalismPattern * 0.2;

    // Convert to safety score (lower incidents = higher safety)
    const safetyScore = 85 - incidentScore * 40;

    return Math.max(30, Math.min(95, safetyScore));
  }

  // Lighting conditions factor (0-100)
  private calculateLightingFactor(
    hour: number,
    lat: number,
    lng: number,
  ): number {
    let lightingScore = 70;

    // Natural lighting
    if (hour >= 6 && hour <= 18) {
      lightingScore += 25; // Good natural light
    } else if (hour >= 19 && hour <= 21) {
      lightingScore += 10; // Twilight
    } else {
      lightingScore -= 15; // Night time
    }

    // Simulate street lighting density
    const streetLightPattern = Math.abs(
      Math.sin(lat * 445.2) * Math.cos(lng * 337.8),
    );
    lightingScore += streetLightPattern * 15;

    return Math.max(25, Math.min(95, lightingScore));
  }

  // Accessibility factor (0-100)
  private calculateAccessibilityFactor(lat: number, lng: number): number {
    // Simulate road network and accessibility
    const roadDensityPattern = Math.abs(
      Math.cos(lat * 234.7) + Math.sin(lng * 156.3),
    );
    const publicTransportPattern = Math.abs(
      Math.sin(lat * 178.9) * Math.cos(lng * 267.4),
    );

    const accessibilityScore =
      50 + roadDensityPattern * 20 + publicTransportPattern * 15;

    return Math.max(30, Math.min(90, accessibilityScore));
  }

  // Current crowd level factor (0-100)
  private calculateCrowdLevelFactor(
    lat: number,
    lng: number,
    hour: number,
  ): number {
    let crowdScore = 60;

    // Time-based crowd adjustments
    if (hour >= 7 && hour <= 9)
      crowdScore += 20; // Morning rush
    else if (hour >= 12 && hour <= 14)
      crowdScore += 15; // Lunch hour
    else if (hour >= 17 && hour <= 19)
      crowdScore += 25; // Evening rush
    else if (hour >= 22 || hour <= 5) crowdScore -= 20; // Low activity

    // Location-based crowd simulation
    const eventPattern = Math.sin(Date.now() / 3600000 + lat + lng) * 10;
    crowdScore += eventPattern;

    return Math.max(20, Math.min(85, crowdScore));
  }

  // Weather conditions factor (0-100)
  private calculateWeatherConditionsFactor(lat: number, lng: number): number {
    // Simulate dynamic weather conditions
    const weatherPattern = Math.sin(Date.now() / 21600000) * 20; // 6-hour cycle
    const locationWeatherPattern = Math.cos(lat * 67.8 + lng * 123.4) * 10; // Location-based weather

    const weatherScore = 70 + weatherPattern + locationWeatherPattern;

    return Math.max(30, Math.min(90, weatherScore));
  }

  // Emergency services proximity factor (0-100)
  private calculateEmergencyProximityFactor(lat: number, lng: number): number {
    // Simulate proximity to police, fire, hospital
    const policeProximity = Math.abs(Math.sin(lat * 892.3 + lng * 567.1));
    const fireProximity = Math.abs(Math.cos(lat * 445.7 - lng * 334.8));
    const hospitalProximity = Math.abs(Math.sin(lat * lng * 789.2));

    const proximityScore =
      40 + policeProximity * 20 + fireProximity * 20 + hospitalProximity * 20;

    return Math.max(25, Math.min(85, proximityScore));
  }

  // Apply spatial smoothing to prevent harsh transitions
  private async applySpatialSmoothing(
    score: number,
    row: number,
    col: number,
    center: google.maps.LatLng,
  ): Promise<number> {
    // Simple smoothing by averaging with neighboring theoretical scores
    const neighbors = [
      { row: row - 1, col: col },
      { row: row + 1, col: col },
      { row: row, col: col - 1 },
      { row: row, col: col + 1 },
    ];

    let neighborScores = [score]; // Include current score
    let validNeighbors = 1;

    for (const neighbor of neighbors) {
      if (neighbor.row >= 0 && neighbor.col >= 0) {
        // Generate theoretical neighbor score using similar calculations
        const neighborId = `${neighbor.row}-${neighbor.col}`;
        const existingNeighbor = this.gridCells.get(neighborId);

        if (existingNeighbor) {
          neighborScores.push(existingNeighbor.safetyScore);
          validNeighbors++;
        }
      }
    }

    // Calculate weighted average (70% current, 30% neighbors)
    const averageNeighborScore =
      neighborScores.reduce((sum, s) => sum + s, 0) / neighborScores.length;
    return score * 0.7 + averageNeighborScore * 0.3;
  }

  // Get zoom-appropriate configuration
  private getZoomConfig(zoom: number): { cellSize: number; maxCells: number } {
    // Find closest zoom configuration
    const zoomLevels = Object.keys(this.config.zoomLevels)
      .map(Number)
      .sort((a, b) => a - b);

    for (let i = 0; i < zoomLevels.length; i++) {
      if (zoom <= zoomLevels[i]) {
        return this.config.zoomLevels[zoomLevels[i]];
      }
    }

    // Use highest zoom configuration for very high zooms
    const highestZoom = zoomLevels[zoomLevels.length - 1];
    return this.config.zoomLevels[highestZoom];
  }

  // Get safety color
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

  // Get safety opacity
  private getSafetyOpacity(score: number): number {
    // Higher opacity for more dangerous areas
    if (score >= 80) return 0.15; // Very safe - minimal overlay
    if (score >= 70) return 0.25; // Safe - light overlay
    if (score >= 60) return 0.35; // Mostly safe - moderate overlay
    if (score >= 50) return 0.45; // Caution - noticeable overlay
    if (score >= 40) return 0.55; // Warning - strong overlay
    if (score >= 30) return 0.65; // Concern - very strong overlay
    return 0.75; // Danger - maximum overlay
  }

  // Render grid as connected rectangles
  private renderGrid(): void {
    if (!this.map || !this.isVisible) return;

    // Clear existing rectangles
    this.clearRectangles();

    console.log(`🔷 Rendering ${this.gridCells.size} grid rectangles...`);

    // Create rectangles for each cell
    this.gridCells.forEach((cell) => {
      const rectangle = new google.maps.Rectangle({
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(cell.bounds.south, cell.bounds.west),
          new google.maps.LatLng(cell.bounds.north, cell.bounds.east),
        ),
        fillColor: cell.color,
        fillOpacity: cell.opacity,
        strokeColor: cell.color,
        strokeOpacity: cell.opacity * 0.8,
        strokeWeight: 0.5,
        map: this.map,
        clickable: false,
      });

      this.rectangles.push(rectangle);
      cell.rectangle = rectangle;
    });

    console.log(`✅ Rendered ${this.rectangles.length} grid rectangles`);
  }

  // Clear existing rectangles
  private clearRectangles(): void {
    this.rectangles.forEach((rectangle) => {
      rectangle.setMap(null);
    });
    this.rectangles = [];

    // Clear rectangle references from cells
    this.gridCells.forEach((cell) => {
      if (cell.rectangle) {
        cell.rectangle.setMap(null);
        delete cell.rectangle;
      }
    });
  }

  // Clear entire grid
  private clearGrid(): void {
    this.clearRectangles();
    this.gridCells.clear();
  }

  // Update existing grid with new safety scores
  async updateGrid(): Promise<void> {
    if (this.gridCells.size === 0 || !this.currentBounds) return;

    console.log("🔄 Updating grid safety scores...");

    const updatedCells: GridCell[] = [];

    for (const [cellId, cell] of this.gridCells) {
      const [row, col] = cellId.split("-").map(Number);
      const newSafetyScore = await this.calculateAdvancedSafetyScore(
        cell.center,
        cell.bounds,
        row,
        col,
        this.currentZoom,
      );

      // Update cell
      cell.safetyScore = newSafetyScore;
      cell.color = this.getSafetyColor(newSafetyScore);
      cell.opacity = this.getSafetyOpacity(newSafetyScore);
      cell.lastUpdate = Date.now();

      // Update rectangle visualization
      if (cell.rectangle) {
        cell.rectangle.setOptions({
          fillColor: cell.color,
          fillOpacity: cell.opacity,
          strokeColor: cell.color,
          strokeOpacity: cell.opacity * 0.8,
        });
      }

      updatedCells.push(cell);
    }

    console.log(`✅ Updated ${updatedCells.length} grid cells`);
    this.notifyCallbacks(updatedCells);
  }

  // Start real-time updates
  startRealTimeUpdates(): void {
    if (this.updateInterval) return;

    console.log(
      `🔄 Starting real-time grid updates every ${this.config.updateIntervalMs / 1000}s...`,
    );

    this.updateInterval = setInterval(async () => {
      await this.updateGrid();
    }, this.config.updateIntervalMs);
  }

  // Stop real-time updates
  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log("⏹️ Stopped real-time grid updates");
    }
  }

  // Show/hide grid
  setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.rectangles.forEach((rectangle) => {
      rectangle.setVisible(visible);
    });
    console.log(`🔷 Grid visibility: ${visible ? "ON" : "OFF"}`);
  }

  // Subscribe to updates
  subscribe(callback: (cells: GridCell[]) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // Notify callbacks
  private notifyCallbacks(cells: GridCell[]): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(cells);
      } catch (error) {
        console.error("Grid callback error:", error);
      }
    });
  }

  // Get current grid data
  getCurrentGrid(): GridCell[] {
    return Array.from(this.gridCells.values());
  }

  // Get grid statistics
  getGridStats(): {
    totalCells: number;
    averageSafety: number;
    cellSize: string;
    coverage: string;
    lastUpdate: string;
  } {
    const cells = this.getCurrentGrid();
    const totalCells = cells.length;
    const averageSafety =
      cells.reduce((sum, c) => sum + c.safetyScore, 0) / totalCells || 0;
    const zoomConfig = this.getZoomConfig(this.currentZoom);
    const cellSize = `${zoomConfig.cellSize}m`;
    const coverage = this.currentBounds
      ? `${Math.sqrt(totalCells)} × ${Math.sqrt(totalCells)} grid`
      : "No coverage";
    const lastUpdate = cells.length
      ? new Date(
          Math.max(...cells.map((c) => c.lastUpdate)),
        ).toLocaleTimeString()
      : "Never";

    return {
      totalCells,
      averageSafety: Math.round(averageSafety),
      cellSize,
      coverage,
      lastUpdate,
    };
  }

  // Handle zoom changes
  async handleZoomChange(newZoom: number): Promise<void> {
    if (!this.currentBounds) return;

    const oldZoomConfig = this.getZoomConfig(this.currentZoom);
    const newZoomConfig = this.getZoomConfig(newZoom);

    // Only regenerate grid if zoom configuration actually changes
    if (
      oldZoomConfig.cellSize !== newZoomConfig.cellSize ||
      oldZoomConfig.maxCells !== newZoomConfig.maxCells
    ) {
      console.log(
        `🔷 Zoom changed: ${this.currentZoom} → ${newZoom}, regenerating grid...`,
      );
      await this.generateStableGrid(this.currentBounds, newZoom);
    } else {
      console.log(
        `🔷 Zoom changed: ${this.currentZoom} → ${newZoom}, keeping existing grid`,
      );
      this.currentZoom = newZoom;
    }
  }

  // Cleanup
  cleanup(): void {
    this.stopRealTimeUpdates();
    this.clearGrid();
    this.callbacks.clear();
    this.currentBounds = null;
    this.map = null;
    console.log("🔷 Grid heatmap service cleaned up");
  }
}

export const stableGridHeatmapService = StableGridHeatmapService.getInstance();
