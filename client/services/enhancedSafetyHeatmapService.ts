import { geminiNewsAnalysisService } from "./geminiNewsAnalysisService";
import { unifiedNotifications } from "./unifiedNotificationService";

interface WeatherData {
  temperature: number;
  condition: string;
  visibility: number;
  precipitation: number;
  windSpeed: number;
  uvIndex: number;
}

interface SafetyHeatmapPoint {
  location: google.maps.LatLng;
  weight: number;
  intensity: number;
  factors: {
    news: number;
    weather: number;
    time: number;
    crowd: number;
    lighting: number;
    police: number;
    crime: number;
  };
  color: string;
  lastUpdate: number;
}

interface RealTimeFactors {
  timeOfDay: number; // 0-100 (higher = safer time)
  weatherSafety: number; // 0-100
  crowdDensity: number; // 0-100
  policePresence: number; // 0-100
  lightingConditions: number; // 0-100
  recentIncidents: number; // 0-100 (lower = more incidents)
}

export class EnhancedSafetyHeatmapService {
  private static instance: EnhancedSafetyHeatmapService;
  private heatmapData: Map<string, SafetyHeatmapPoint> = new Map();
  private weatherData: WeatherData | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private callbacks: Set<(data: SafetyHeatmapPoint[]) => void> = new Set();

  static getInstance(): EnhancedSafetyHeatmapService {
    if (!EnhancedSafetyHeatmapService.instance) {
      EnhancedSafetyHeatmapService.instance =
        new EnhancedSafetyHeatmapService();
    }
    return EnhancedSafetyHeatmapService.instance;
  }

  // Generate comprehensive real-time safety heatmap
  async generateEnhancedHeatmap(
    center: google.maps.LatLng,
    radiusKm: number = 2,
  ): Promise<SafetyHeatmapPoint[]> {
    console.log("🔥 Generating enhanced safety heatmap...");

    // Clear existing data
    this.heatmapData.clear();

    try {
      // Get current weather data
      await this.updateWeatherData(center);

      // Generate grid of safety points
      const gridSize = 0.005; // ~500m grid
      const points: SafetyHeatmapPoint[] = [];
      let pointId = 0;

      const bounds = this.calculateBounds(center, radiusKm);

      for (
        let lat = bounds.south;
        lat <= bounds.north && pointId < 50;
        lat += gridSize
      ) {
        for (
          let lng = bounds.west;
          lng <= bounds.east && pointId < 50;
          lng += gridSize, pointId++
        ) {
          const point = new google.maps.LatLng(lat, lng);

          try {
            const safetyPoint = await this.calculateSafetyPoint(point, pointId);
            points.push(safetyPoint);
            this.heatmapData.set(`point-${pointId}`, safetyPoint);

            // Small delay to prevent API rate limiting
            if (pointId % 5 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          } catch (error) {
            // Fallback to basic calculation
            const fallbackPoint = this.generateFallbackPoint(point, pointId);
            points.push(fallbackPoint);
            this.heatmapData.set(`point-${pointId}`, fallbackPoint);
          }
        }
      }

      console.log(`✅ Generated ${points.length} safety heatmap points`);
      this.notifyCallbacks(points);
      return points;
    } catch (error) {
      console.error("Failed to generate enhanced heatmap:", error);
      unifiedNotifications.error("Safety heatmap temporarily unavailable");
      return this.generateBasicHeatmap(center, radiusKm);
    }
  }

  // Calculate comprehensive safety score for a point
  private async calculateSafetyPoint(
    location: google.maps.LatLng,
    id: number,
  ): Promise<SafetyHeatmapPoint> {
    // Get real-time factors
    const realTimeFactors = this.calculateRealTimeFactors(location);

    // Get news analysis (with throttling)
    let newsScore = 70; // Default neutral score
    try {
      if (id % 3 === 0) {
        // Only analyze every 3rd point to save API calls
        const newsAnalysis = await geminiNewsAnalysisService.analyzeAreaSafety(
          location.lat(),
          location.lng(),
        );
        newsScore = newsAnalysis.score;
      }
    } catch (error) {
      console.warn("News analysis failed, using default score");
    }

    // Calculate individual factor scores
    const factors = {
      news: newsScore,
      weather: this.calculateWeatherSafety(),
      time: realTimeFactors.timeOfDay,
      crowd: 100 - realTimeFactors.crowdDensity, // Invert crowd density
      lighting: realTimeFactors.lightingConditions,
      police: realTimeFactors.policePresence,
      crime: realTimeFactors.recentIncidents,
    };

    // Weighted average for overall safety score
    const weights = {
      news: 0.25,
      weather: 0.15,
      time: 0.15,
      crowd: 0.15,
      lighting: 0.1,
      police: 0.1,
      crime: 0.1,
    };

    const safetyScore = Object.entries(factors).reduce(
      (sum, [factor, value]) => {
        return sum + value * weights[factor as keyof typeof weights];
      },
      0,
    );

    // Convert to heatmap weight (0-1)
    const weight = Math.max(0.1, Math.min(1.0, safetyScore / 100));

    // Determine color based on safety score
    const color = this.getSafetyColor(safetyScore);

    // Calculate intensity for visualization
    const intensity = this.calculateIntensity(safetyScore, factors);

    return {
      location,
      weight,
      intensity,
      factors,
      color,
      lastUpdate: Date.now(),
    };
  }

  // Calculate real-time factors based on location and time
  private calculateRealTimeFactors(
    location: google.maps.LatLng,
  ): RealTimeFactors {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Time of day safety (0-100, higher = safer)
    let timeOfDay = 70; // Default
    if (hour >= 6 && hour <= 18) {
      timeOfDay = 85; // Daytime
    } else if (hour >= 19 && hour <= 22) {
      timeOfDay = 65; // Evening
    } else {
      timeOfDay = 40; // Night
    }

    // Simulate other real-time factors
    const crowdDensity = this.simulateCrowdDensity(location, hour);
    const policePresence = this.simulatePolicePresence(location, hour);
    const lightingConditions = this.simulateLighting(location, hour);
    const recentIncidents = this.simulateIncidents(location);

    return {
      timeOfDay,
      weatherSafety: this.calculateWeatherSafety(),
      crowdDensity,
      policePresence,
      lightingConditions,
      recentIncidents,
    };
  }

  // Calculate weather-based safety score
  private calculateWeatherSafety(): number {
    if (!this.weatherData) return 70; // Default

    let score = 100;

    // Temperature impact
    if (
      this.weatherData.temperature < -10 ||
      this.weatherData.temperature > 40
    ) {
      score -= 20;
    }

    // Visibility impact
    if (this.weatherData.visibility < 5) {
      score -= 15;
    }

    // Precipitation impact
    if (this.weatherData.precipitation > 5) {
      score -= 10;
    }

    // Wind impact
    if (this.weatherData.windSpeed > 25) {
      score -= 10;
    }

    return Math.max(20, score);
  }

  // Get safety color based on score
  private getSafetyColor(score: number): string {
    if (score >= 80) return "#22c55e"; // Green - Safe
    if (score >= 65) return "#84cc16"; // Light green - Mostly safe
    if (score >= 50) return "#eab308"; // Yellow - Caution
    if (score >= 35) return "#f97316"; // Orange - Warning
    return "#ef4444"; // Red - Danger
  }

  // Calculate visual intensity for heatmap
  private calculateIntensity(score: number, factors: any): number {
    // Higher intensity for areas with more significant safety concerns
    const riskScore = 100 - score;
    return Math.max(0.1, Math.min(1.0, riskScore / 100));
  }

  // Simulate crowd density based on location and time
  private simulateCrowdDensity(
    location: google.maps.LatLng,
    hour: number,
  ): number {
    // Higher crowd during business hours and weekends
    let baseDensity = 30;

    if (hour >= 9 && hour <= 17) {
      baseDensity = 70; // Business hours
    } else if (hour >= 18 && hour <= 22) {
      baseDensity = 60; // Evening
    }

    // Add some randomness
    return Math.max(10, Math.min(90, baseDensity + (Math.random() - 0.5) * 30));
  }

  // Simulate police presence
  private simulatePolicePresence(
    location: google.maps.LatLng,
    hour: number,
  ): number {
    // Higher police presence during certain hours
    let basePresence = 40;

    if (hour >= 22 || hour <= 6) {
      basePresence = 60; // Night patrols
    }

    return Math.max(
      20,
      Math.min(80, basePresence + (Math.random() - 0.5) * 20),
    );
  }

  // Simulate lighting conditions
  private simulateLighting(location: google.maps.LatLng, hour: number): number {
    if (hour >= 6 && hour <= 18) {
      return 90; // Daylight
    } else if (hour >= 19 && hour <= 22) {
      return 70; // Twilight/street lighting
    } else {
      return 30; // Night/poor lighting
    }
  }

  // Simulate recent incidents
  private simulateIncidents(location: google.maps.LatLng): number {
    // Random incident score (lower = more incidents)
    return Math.max(30, Math.min(95, 70 + (Math.random() - 0.5) * 40));
  }

  // Generate fallback safety point without external APIs
  private generateFallbackPoint(
    location: google.maps.LatLng,
    id: number,
  ): SafetyHeatmapPoint {
    const realTimeFactors = this.calculateRealTimeFactors(location);

    // Simple weighted average of available factors
    const safetyScore =
      realTimeFactors.timeOfDay * 0.3 +
      realTimeFactors.lightingConditions * 0.25 +
      realTimeFactors.policePresence * 0.2 +
      realTimeFactors.recentIncidents * 0.25;

    const factors = {
      news: 70, // Default
      weather: this.calculateWeatherSafety(),
      time: realTimeFactors.timeOfDay,
      crowd: 100 - realTimeFactors.crowdDensity,
      lighting: realTimeFactors.lightingConditions,
      police: realTimeFactors.policePresence,
      crime: realTimeFactors.recentIncidents,
    };

    return {
      location,
      weight: Math.max(0.1, Math.min(1.0, safetyScore / 100)),
      intensity: this.calculateIntensity(safetyScore, factors),
      factors,
      color: this.getSafetyColor(safetyScore),
      lastUpdate: Date.now(),
    };
  }

  // Generate basic heatmap as fallback
  private generateBasicHeatmap(
    center: google.maps.LatLng,
    radiusKm: number,
  ): SafetyHeatmapPoint[] {
    const points: SafetyHeatmapPoint[] = [];
    const gridSize = 0.01;
    const bounds = this.calculateBounds(center, radiusKm);

    let id = 0;
    for (
      let lat = bounds.south;
      lat <= bounds.north && id < 25;
      lat += gridSize
    ) {
      for (
        let lng = bounds.west;
        lng <= bounds.east && id < 25;
        lng += gridSize, id++
      ) {
        const location = new google.maps.LatLng(lat, lng);
        points.push(this.generateFallbackPoint(location, id));
      }
    }

    return points;
  }

  // Update weather data
  private async updateWeatherData(location: google.maps.LatLng): Promise<void> {
    try {
      // Simulate weather API call
      this.weatherData = {
        temperature: 15 + Math.random() * 20,
        condition: Math.random() > 0.7 ? "rainy" : "clear",
        visibility: 8 + Math.random() * 7,
        precipitation: Math.random() * 5,
        windSpeed: Math.random() * 15,
        uvIndex: Math.random() * 10,
      };
    } catch (error) {
      console.warn("Weather data unavailable, using defaults");
    }
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

  // Start real-time updates
  startRealTimeUpdates(center: google.maps.LatLng): void {
    if (this.updateInterval) return;

    console.log("🔄 Starting real-time heatmap updates...");

    // Update every 3 minutes
    this.updateInterval = setInterval(async () => {
      await this.updateExistingPoints();
    }, 180000);
  }

  // Update existing points with new data
  private async updateExistingPoints(): Promise<void> {
    const points: SafetyHeatmapPoint[] = [];

    for (const [id, point] of this.heatmapData) {
      try {
        // Recalculate real-time factors
        const realTimeFactors = this.calculateRealTimeFactors(point.location);

        // Update factors
        point.factors.time = realTimeFactors.timeOfDay;
        point.factors.crowd = 100 - realTimeFactors.crowdDensity;
        point.factors.lighting = realTimeFactors.lightingConditions;
        point.factors.police = realTimeFactors.policePresence;
        point.factors.weather = this.calculateWeatherSafety();

        // Recalculate safety score
        const weights = {
          news: 0.25,
          weather: 0.15,
          time: 0.15,
          crowd: 0.15,
          lighting: 0.1,
          police: 0.1,
          crime: 0.1,
        };
        const safetyScore = Object.entries(point.factors).reduce(
          (sum, [factor, value]) => {
            return sum + value * weights[factor as keyof typeof weights];
          },
          0,
        );

        // Update point properties
        point.weight = Math.max(0.1, Math.min(1.0, safetyScore / 100));
        point.intensity = this.calculateIntensity(safetyScore, point.factors);
        point.color = this.getSafetyColor(safetyScore);
        point.lastUpdate = Date.now();

        points.push(point);
      } catch (error) {
        console.warn(`Failed to update point ${id}`);
      }
    }

    if (points.length > 0) {
      console.log(`🔄 Updated ${points.length} heatmap points`);
      this.notifyCallbacks(points);
    }
  }

  // Stop real-time updates
  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log("⏹️ Stopped real-time heatmap updates");
    }
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
}

export const enhancedSafetyHeatmapService =
  EnhancedSafetyHeatmapService.getInstance();
