interface SafetyArea {
  id: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  safetyScore: number;
  lastUpdated: Date;
  factors: {
    crimeRate: number;
    lighting: number;
    footTraffic: number;
    emergencyServices: number;
    communityReports: number;
  };
}

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

class AreaBasedSafetyService {
  private currentArea: SafetyArea | null = null;
  private safetyAreas: Map<string, SafetyArea> = new Map();
  private lastLocation: LocationCoordinates | null = null;

  // Grid size for area detection (approximately 500m x 500m)
  private readonly GRID_SIZE = 0.0045; // degrees

  constructor() {
    this.initializeMockAreas();
  }

  private initializeMockAreas() {
    // Generate some mock safety areas for demonstration
    const mockAreas: SafetyArea[] = [
      {
        id: "downtown_safe",
        bounds: {
          north: 37.7849,
          south: 37.7749,
          east: -122.4094,
          west: -122.4194,
        },
        safetyScore: 85,
        lastUpdated: new Date(),
        factors: {
          crimeRate: 90,
          lighting: 85,
          footTraffic: 95,
          emergencyServices: 80,
          communityReports: 75,
        },
      },
      {
        id: "residential_medium",
        bounds: {
          north: 37.7749,
          south: 37.7649,
          east: -122.4094,
          west: -122.4194,
        },
        safetyScore: 72,
        lastUpdated: new Date(),
        factors: {
          crimeRate: 75,
          lighting: 70,
          footTraffic: 60,
          emergencyServices: 85,
          communityReports: 80,
        },
      },
      {
        id: "industrial_caution",
        bounds: {
          north: 37.7649,
          south: 37.7549,
          east: -122.4094,
          west: -122.4194,
        },
        safetyScore: 45,
        lastUpdated: new Date(),
        factors: {
          crimeRate: 40,
          lighting: 35,
          footTraffic: 30,
          emergencyServices: 60,
          communityReports: 50,
        },
      },
    ];

    mockAreas.forEach((area) => {
      this.safetyAreas.set(area.id, area);
    });
  }

  private getAreaId(location: LocationCoordinates): string {
    // Create a grid-based ID for the location
    const gridLat = Math.floor(location.latitude / this.GRID_SIZE);
    const gridLng = Math.floor(location.longitude / this.GRID_SIZE);
    return `area_${gridLat}_${gridLng}`;
  }

  private isInArea(location: LocationCoordinates, area: SafetyArea): boolean {
    return (
      location.latitude >= area.bounds.south &&
      location.latitude <= area.bounds.north &&
      location.longitude >= area.bounds.west &&
      location.longitude <= area.bounds.east
    );
  }

  private async calculateSafetyScore(
    location: LocationCoordinates,
  ): Promise<SafetyArea> {
    // Check if location is in a known area
    for (const area of this.safetyAreas.values()) {
      if (this.isInArea(location, area)) {
        // Refresh area if it's more than 30 minutes old
        if (Date.now() - area.lastUpdated.getTime() > 30 * 60 * 1000) {
          const updatedArea = await this.refreshAreaWithAI(area, location);
          this.safetyAreas.set(area.id, updatedArea);
          return updatedArea;
        }
        return area;
      }
    }

    // Generate new area with AI analysis
    const areaId = this.getAreaId(location);
    const newArea = await this.generateAreaWithAI(areaId, location);

    this.safetyAreas.set(areaId, newArea);
    return newArea;
  }

  private async generateAreaWithAI(
    areaId: string,
    location: LocationCoordinates,
  ): Promise<SafetyArea> {
    try {
      // Import AI news analysis service
      const { aiNewsAnalysis } = await import("@/services/aiNewsAnalysis");

      // Get comprehensive safety analysis
      const aiAnalysis = await aiNewsAnalysis.getLocationSafetyScore(
        location.latitude,
        location.longitude,
      );

      console.log("🤖 AI Safety Analysis Complete:", {
        location: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        finalScore: aiAnalysis.finalScore,
        confidence: aiAnalysis.confidence,
        newsImpact: aiAnalysis.newsImpact,
        timeAdjustment: aiAnalysis.timeOfDayAdjustment,
        weatherImpact: aiAnalysis.weatherImpact,
      });

      const newArea: SafetyArea = {
        id: areaId,
        bounds: {
          north: location.latitude + this.GRID_SIZE / 2,
          south: location.latitude - this.GRID_SIZE / 2,
          east: location.longitude + this.GRID_SIZE / 2,
          west: location.longitude - this.GRID_SIZE / 2,
        },
        safetyScore: aiAnalysis.finalScore,
        lastUpdated: new Date(),
        factors: {
          crimeRate: Math.max(0, Math.min(100, 70 + aiAnalysis.newsImpact)),
          lighting:
            aiAnalysis.environmentalFactors.find((f) => f.type === "lighting")
              ?.value || 70,
          footTraffic: aiAnalysis.crowdingFactor + 50,
          emergencyServices: aiAnalysis.infrastructureScore + 70,
          communityReports: aiAnalysis.confidence,
        },
      };

      return newArea;
    } catch (error) {
      console.error("AI analysis failed, using fallback:", error);
      // Fallback to basic calculation
      return this.generateBasicArea(areaId, location);
    }
  }

  private generateBasicArea(
    areaId: string,
    location: LocationCoordinates,
  ): SafetyArea {
    return {
      id: areaId,
      bounds: {
        north: location.latitude + this.GRID_SIZE / 2,
        south: location.latitude - this.GRID_SIZE / 2,
        east: location.longitude + this.GRID_SIZE / 2,
        west: location.longitude - this.GRID_SIZE / 2,
      },
      safetyScore: this.generateSafetyScore(location),
      lastUpdated: new Date(),
      factors: this.generateSafetyFactors(location),
    };
  }

  private async refreshAreaWithAI(
    area: SafetyArea,
    location: LocationCoordinates,
  ): Promise<SafetyArea> {
    try {
      const { aiNewsAnalysis } = await import("@/services/aiNewsAnalysis");
      const aiAnalysis = await aiNewsAnalysis.getLocationSafetyScore(
        location.latitude,
        location.longitude,
      );

      return {
        ...area,
        safetyScore: aiAnalysis.finalScore,
        lastUpdated: new Date(),
        factors: {
          crimeRate: Math.max(0, Math.min(100, 70 + aiAnalysis.newsImpact)),
          lighting:
            aiAnalysis.environmentalFactors.find((f) => f.type === "lighting")
              ?.value || 70,
          footTraffic: aiAnalysis.crowdingFactor + 50,
          emergencyServices: aiAnalysis.infrastructureScore + 70,
          communityReports: aiAnalysis.confidence,
        },
      };
    } catch (error) {
      console.error("AI refresh failed:", error);
      return area;
    }
  }

  private generateSafetyScore(location: LocationCoordinates): number {
    // Simulate safety score based on location characteristics
    // In real implementation, this would use actual crime data, lighting, etc.

    // Base score
    let score = 70;

    // Distance from city center (higher = safer for residential)
    const centerLat = 37.7749;
    const centerLng = -122.4194;
    const distance = Math.sqrt(
      Math.pow(location.latitude - centerLat, 2) +
        Math.pow(location.longitude - centerLng, 2),
    );

    // Adjust based on distance (closer to center = more activity but also more risk)
    if (distance < 0.01) {
      score += Math.random() * 20 - 10; // ±10 around center
    } else {
      score += Math.random() * 30 - 5; // Generally safer in outskirts
    }

    // Add some randomness to simulate real-world variation
    score += (Math.random() - 0.5) * 20;

    return Math.max(20, Math.min(100, Math.round(score)));
  }

  private generateSafetyFactors(location: LocationCoordinates) {
    const base = 60 + Math.random() * 30; // 60-90 base
    return {
      crimeRate: Math.round(base + (Math.random() - 0.5) * 20),
      lighting: Math.round(base + (Math.random() - 0.5) * 25),
      footTraffic: Math.round(base + (Math.random() - 0.5) * 30),
      emergencyServices: Math.round(base + (Math.random() - 0.5) * 15),
      communityReports: Math.round(base + (Math.random() - 0.5) * 20),
    };
  }

  private hasMovedToNewArea(location: LocationCoordinates): boolean {
    if (!this.lastLocation) return true;

    const distance = Math.sqrt(
      Math.pow(location.latitude - this.lastLocation.latitude, 2) +
        Math.pow(location.longitude - this.lastLocation.longitude, 2),
    );

    // Consider new area if moved more than ~200m
    return distance > 0.002;
  }

  public async getSafetyScore(location: LocationCoordinates): Promise<{
    area: SafetyArea;
    isNewArea: boolean;
  }> {
    const isNewArea = this.hasMovedToNewArea(location);

    if (isNewArea || !this.currentArea) {
      this.currentArea = await this.calculateSafetyScore(location);
      this.lastLocation = location;

      console.log("🛡️ New area detected with AI analysis:", {
        areaId: this.currentArea.id,
        safetyScore: this.currentArea.safetyScore,
        location: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        factors: this.currentArea.factors,
      });
    }

    return {
      area: this.currentArea,
      isNewArea,
    };
  }

  public getUnsafeAreas(): SafetyArea[] {
    return Array.from(this.safetyAreas.values()).filter(
      (area) => area.safetyScore < 60,
    );
  }

  public isAreaSafe(location: LocationCoordinates): boolean {
    const { area } = this.getSafetyScore(location);
    return area.safetyScore >= 60;
  }

  public getCurrentArea(): SafetyArea | null {
    return this.currentArea;
  }
}

export const areaBasedSafety = new AreaBasedSafetyService();
export type { SafetyArea, LocationCoordinates };
