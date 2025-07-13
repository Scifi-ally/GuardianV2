interface SafetyHeatmapPoint {
  location: google.maps.LatLng;
  weight: number;
  intensity: number;
  color: string;
  lastUpdate: number;
}

export class SimplifiedSafetyHeatmapService {
  private static instance: SimplifiedSafetyHeatmapService;
  private heatmapData: Map<string, SafetyHeatmapPoint> = new Map();
  private callbacks: Set<(data: SafetyHeatmapPoint[]) => void> = new Set();

  static getInstance(): SimplifiedSafetyHeatmapService {
    if (!SimplifiedSafetyHeatmapService.instance) {
      SimplifiedSafetyHeatmapService.instance =
        new SimplifiedSafetyHeatmapService();
    }
    return SimplifiedSafetyHeatmapService.instance;
  }

  // Generate basic safety heatmap
  async generateBasicHeatmap(
    center: google.maps.LatLng,
    radiusKm: number = 2,
  ): Promise<SafetyHeatmapPoint[]> {
    console.log("🔥 Generating basic safety heatmap...");

    // Clear existing data
    this.heatmapData.clear();

    const points: SafetyHeatmapPoint[] = [];
    const gridSize = 0.008; // ~800m grid
    const bounds = this.calculateBounds(center, radiusKm);

    let pointId = 0;
    for (
      let lat = bounds.south;
      lat <= bounds.north && pointId < 25;
      lat += gridSize
    ) {
      for (
        let lng = bounds.west;
        lng <= bounds.east && pointId < 25;
        lng += gridSize, pointId++
      ) {
        const location = new google.maps.LatLng(lat, lng);
        const safetyPoint = this.calculateBasicSafetyPoint(location, pointId);

        points.push(safetyPoint);
        this.heatmapData.set(`point-${pointId}`, safetyPoint);
      }
    }

    console.log(`✅ Generated ${points.length} basic safety heatmap points`);
    this.notifyCallbacks(points);
    return points;
  }

  // Calculate basic safety score for a point
  private calculateBasicSafetyPoint(
    location: google.maps.LatLng,
    id: number,
  ): SafetyHeatmapPoint {
    const now = new Date();
    const hour = now.getHours();

    // Basic time-based safety scoring
    let safetyScore = 70; // Base score

    // Time of day factor
    if (hour >= 6 && hour <= 18) {
      safetyScore += 15; // Daytime bonus
    } else if (hour >= 19 && hour <= 22) {
      safetyScore += 5; // Evening
    } else {
      safetyScore -= 10; // Night penalty
    }

    // Random variation based on location
    const locVariation =
      (Math.sin(location.lat() * 100) + Math.cos(location.lng() * 100)) * 10;
    safetyScore += locVariation;

    // Clamp between 30-95
    safetyScore = Math.max(30, Math.min(95, safetyScore));

    // Convert to heatmap weight (0-1, higher weight = more danger)
    const weight = Math.max(0.1, Math.min(1.0, (100 - safetyScore) / 100));

    // Calculate intensity for visualization
    const intensity = weight;

    // Determine color based on safety score
    const color = this.getSafetyColor(safetyScore);

    return {
      location,
      weight,
      intensity,
      color,
      lastUpdate: Date.now(),
    };
  }

  // Get safety color based on score
  private getSafetyColor(score: number): string {
    if (score >= 80) return "#22c55e"; // Green - Safe
    if (score >= 65) return "#84cc16"; // Light green - Mostly safe
    if (score >= 50) return "#eab308"; // Yellow - Caution
    if (score >= 35) return "#f97316"; // Orange - Warning
    return "#ef4444"; // Red - Danger
  }

  // Calculate bounds for area
  private calculateBounds(center: google.maps.LatLng, radiusKm: number) {
    const lat = center.lat();
    const lng = center.lng();
    const latOffset = radiusKm / 111; // Rough conversion
    const lngOffset = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    return {
      north: lat + latOffset,
      south: lat - latOffset,
      east: lng + lngOffset,
      west: lng - lngOffset,
    };
  }

  // Subscribe to updates
  subscribe(callback: (data: SafetyHeatmapPoint[]) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // Notify all callbacks
  private notifyCallbacks(data: SafetyHeatmapPoint[]): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Callback error:", error);
      }
    });
  }

  // Get current heatmap data
  getCurrentHeatmapData(): SafetyHeatmapPoint[] {
    return Array.from(this.heatmapData.values());
  }

  // Clear heatmap data
  clearHeatmapData(): void {
    this.heatmapData.clear();
    this.notifyCallbacks([]);
  }

  // Start basic updates
  startBasicUpdates(): void {
    console.log("🔄 Starting basic heatmap updates...");
    // Simple update every 5 minutes
    setInterval(() => {
      const currentData = this.getCurrentHeatmapData();
      if (currentData.length > 0) {
        // Update timestamps and slight score variations
        currentData.forEach((point) => {
          point.lastUpdate = Date.now();
          // Small random variation
          const variation = (Math.random() - 0.5) * 0.1;
          point.weight = Math.max(0.1, Math.min(1.0, point.weight + variation));
        });
        this.notifyCallbacks(currentData);
      }
    }, 300000); // 5 minutes
  }

  // Stop updates
  stopUpdates(): void {
    console.log("⏹️ Stopped basic heatmap updates");
  }
}

export const simplifiedSafetyHeatmapService =
  SimplifiedSafetyHeatmapService.getInstance();
