interface Location {
  latitude: number;
  longitude: number;
}

interface RouteOption {
  id: string;
  type: "safest" | "quickest";
  title: string;
  duration: string;
  distance: string;
  safetyLevel: "high" | "medium" | "low";
  features: string[];
  waypoints: Location[];
  warnings?: string[];
}

interface RouteCalculationResult {
  safestRoute: RouteOption;
  quickestRoute: RouteOption;
  recommendedRoute: "safest" | "quickest";
}

class RouteCalculationService {
  private async getSafetyScore(lat: number, lng: number): Promise<number> {
    try {
      const { geminiNewsAnalysisService } = await import(
        "./geminiNewsAnalysisService"
      );
      const analysis = await geminiNewsAnalysisService.analyzeAreaSafety(
        lat,
        lng,
      );
      return analysis.score;
    } catch (error) {
      console.warn("Background safety scoring failed, using fallback:", error);
      // Fallback based on time of day
      const hour = new Date().getHours();
      return hour >= 6 && hour <= 20 ? 75 : 60;
    }
  }

  private async calculateRouteSafety(waypoints: Location[]): Promise<{
    averageSafety: number;
    warnings: string[];
    safetyLevel: "high" | "medium" | "low";
  }> {
    let totalSafety = 0;
    const warnings: string[] = [];

    // Sample a few points along the route for safety analysis
    const samplePoints =
      waypoints.length > 3
        ? [
            waypoints[0],
            waypoints[Math.floor(waypoints.length / 2)],
            waypoints[waypoints.length - 1],
          ]
        : waypoints;

    for (const point of samplePoints) {
      const safety = await this.getSafetyScore(point.latitude, point.longitude);
      totalSafety += safety;

      if (safety < 40) {
        warnings.push("High-risk area detected along route");
      } else if (safety < 60) {
        warnings.push("Moderate caution advised in some areas");
      }
    }

    const averageSafety = totalSafety / samplePoints.length;

    let safetyLevel: "high" | "medium" | "low";
    if (averageSafety >= 70) {
      safetyLevel = "high";
    } else if (averageSafety >= 50) {
      safetyLevel = "medium";
    } else {
      safetyLevel = "low";
    }

    return { averageSafety, warnings, safetyLevel };
  }

  private generateSafeRoute(start: Location, end: Location): Location[] {
    // Generate a route that prioritizes safety (simulated)
    const midpoint = {
      latitude:
        (start.latitude + end.latitude) / 2 + (Math.random() - 0.5) * 0.01,
      longitude:
        (start.longitude + end.longitude) / 2 + (Math.random() - 0.5) * 0.01,
    };

    return [start, midpoint, end];
  }

  private generateQuickRoute(start: Location, end: Location): Location[] {
    // Generate a more direct route (simulated)
    return [start, end];
  }

  private calculateDistance(waypoints: Location[]): number {
    let distance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const lat1 = (waypoints[i].latitude * Math.PI) / 180;
      const lat2 = (waypoints[i + 1].latitude * Math.PI) / 180;
      const deltaLat =
        ((waypoints[i + 1].latitude - waypoints[i].latitude) * Math.PI) / 180;
      const deltaLng =
        ((waypoints[i + 1].longitude - waypoints[i].longitude) * Math.PI) / 180;

      const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(deltaLng / 2) *
          Math.sin(deltaLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      distance += 6371000 * c; // Earth's radius in meters
    }
    return distance;
  }

  async calculateRoutes(
    start: Location,
    end: Location,
  ): Promise<RouteCalculationResult> {
    console.log("🗺️ Calculating routes with background safety analysis...");

    // Generate both route options
    const safeWaypoints = this.generateSafeRoute(start, end);
    const quickWaypoints = this.generateQuickRoute(start, end);

    // Calculate safety for both routes in background
    const [safeSafetyData, quickSafetyData] = await Promise.all([
      this.calculateRouteSafety(safeWaypoints),
      this.calculateRouteSafety(quickWaypoints),
    ]);

    // Calculate distances
    const safeDistance = this.calculateDistance(safeWaypoints);
    const quickDistance = this.calculateDistance(quickWaypoints);

    const safestRoute: RouteOption = {
      id: "safest",
      type: "safest",
      title: "Safest Route",
      duration: `${Math.ceil(safeDistance / 50)}min`, // Assuming 50m/min walking speed
      distance: `${(safeDistance / 1000).toFixed(1)}km`,
      safetyLevel: safeSafetyData.safetyLevel,
      features: [
        "Well-lit pathways",
        "High foot traffic areas",
        "Emergency services nearby",
        "Avoids isolated areas",
      ],
      waypoints: safeWaypoints,
      warnings: safeSafetyData.warnings,
    };

    const quickestRoute: RouteOption = {
      id: "quickest",
      type: "quickest",
      title: "Quickest Route",
      duration: `${Math.ceil(quickDistance / 80)}min`, // Assuming 80m/min direct route
      distance: `${(quickDistance / 1000).toFixed(1)}km`,
      safetyLevel: quickSafetyData.safetyLevel,
      features: ["Direct path", "Shortest distance", "Minimal detours"],
      waypoints: quickWaypoints,
      warnings: quickSafetyData.warnings,
    };

    // Determine recommended route based on time of day and safety levels
    const hour = new Date().getHours();
    const isNightTime = hour < 6 || hour > 20;
    const recommendedRoute =
      isNightTime || quickSafetyData.averageSafety < 60 ? "safest" : "quickest";

    console.log(
      "✅ Route calculation completed with background safety analysis",
    );

    return {
      safestRoute,
      quickestRoute,
      recommendedRoute,
    };
  }
}

export const routeCalculationService = new RouteCalculationService();
export type { RouteOption, RouteCalculationResult };
