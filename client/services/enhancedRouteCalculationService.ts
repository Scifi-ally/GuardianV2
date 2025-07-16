import { advancedSafetyScoring } from "./advancedSafetyScoring";
import type { SafetyLocation } from "./advancedSafetyScoring";

interface RouteWaypoint {
  latitude: number;
  longitude: number;
  name?: string;
}

interface RouteOption {
  id: string;
  name: string;
  distance: string;
  duration: string;
  safetyScore: number;
  waypoints: RouteWaypoint[];
  instructions: string[];
  avoidTolls: boolean;
  avoidHighways: boolean;
  safetyFactors: {
    lighting: number;
    crimeRate: number;
    emergencyServices: number;
    traffic: number;
  };
  risks: string[];
  advantages: string[];
  description: string;
}

interface RouteCalculationResult {
  safestRoute: RouteOption;
  quickestRoute: RouteOption;
  recommendedRoute: "safest" | "quickest";
}

class EnhancedRouteCalculationService {
  private static instance: EnhancedRouteCalculationService;

  static getInstance(): EnhancedRouteCalculationService {
    if (!EnhancedRouteCalculationService.instance) {
      EnhancedRouteCalculationService.instance =
        new EnhancedRouteCalculationService();
    }
    return EnhancedRouteCalculationService.instance;
  }

  async calculateRoutes(
    origin: SafetyLocation,
    destination: SafetyLocation,
  ): Promise<RouteCalculationResult> {
    try {
      // Calculate multiple route options with different priorities
      const [safestRoute, quickestRoute] = await Promise.all([
        this.calculateSafestRoute(origin, destination),
        this.calculateQuickestRoute(origin, destination),
      ]);

      // Determine recommended route based on current conditions
      const recommendedRoute = this.determineRecommendedRoute(
        safestRoute,
        quickestRoute,
      );

      return {
        safestRoute,
        quickestRoute,
        recommendedRoute,
      };
    } catch (error) {
      console.error("Enhanced route calculation failed:", error);

      // Fallback to basic routes
      const fallbackRoute = await this.createFallbackRoute(origin, destination);

      return {
        safestRoute: fallbackRoute,
        quickestRoute: fallbackRoute,
        recommendedRoute: "safest",
      };
    }
  }

  private async calculateSafestRoute(
    origin: SafetyLocation,
    destination: SafetyLocation,
  ): Promise<RouteOption> {
    try {
      // Use Google Directions API with safety-optimized parameters
      const directionsService = new google.maps.DirectionsService();

      const request: google.maps.DirectionsRequest = {
        origin: { lat: origin.latitude, lng: origin.longitude },
        destination: { lat: destination.latitude, lng: destination.longitude },
        travelMode: google.maps.TravelMode.WALKING,
        avoidHighways: true,
        avoidTolls: true,
        alternatives: true,
      };

      const result = await this.getDirections(directionsService, request);

      if (result.routes && result.routes.length > 0) {
        // Analyze all alternative routes for safety
        const routeAnalyses = await Promise.all(
          result.routes.map((route) =>
            this.analyzeRouteSafety(route, origin, destination),
          ),
        );

        // Select the safest route
        const safestAnalysis = routeAnalyses.reduce((safest, current) =>
          current.safetyScore > safest.safetyScore ? current : safest,
        );

        return safestAnalysis;
      }

      return await this.createFallbackRoute(origin, destination, "safest");
    } catch (error) {
      console.error("Safest route calculation failed:", error);
      return await this.createFallbackRoute(origin, destination, "safest");
    }
  }

  private async calculateQuickestRoute(
    origin: SafetyLocation,
    destination: SafetyLocation,
  ): Promise<RouteOption> {
    try {
      const directionsService = new google.maps.DirectionsService();

      const request: google.maps.DirectionsRequest = {
        origin: { lat: origin.latitude, lng: origin.longitude },
        destination: { lat: destination.latitude, lng: destination.longitude },
        travelMode: google.maps.TravelMode.WALKING,
        optimizeWaypoints: true,
      };

      const result = await this.getDirections(directionsService, request);

      if (result.routes && result.routes.length > 0) {
        const quickestRoute = result.routes[0]; // First route is typically quickest
        return await this.analyzeRouteSafety(
          quickestRoute,
          origin,
          destination,
          "quickest",
        );
      }

      return await this.createFallbackRoute(origin, destination, "quickest");
    } catch (error) {
      console.error("Quickest route calculation failed:", error);
      return await this.createFallbackRoute(origin, destination, "quickest");
    }
  }

  private async analyzeRouteSafety(
    route: google.maps.DirectionsRoute,
    origin: SafetyLocation,
    destination: SafetyLocation,
    type: "safest" | "quickest" = "safest",
  ): Promise<RouteOption> {
    const leg = route.legs[0];

    // Extract waypoints from route
    const waypoints: RouteWaypoint[] = [
      { latitude: origin.latitude, longitude: origin.longitude, name: "Start" },
    ];

    // Add intermediate waypoints (sample points along route)
    const steps = leg.steps || [];
    for (let i = 0; i < Math.min(steps.length, 10); i += 2) {
      const step = steps[i];
      if (step.end_location) {
        waypoints.push({
          latitude: step.end_location.lat(),
          longitude: step.end_location.lng(),
        });
      }
    }

    waypoints.push({
      latitude: destination.latitude,
      longitude: destination.longitude,
      name: "Destination",
    });

    // Calculate safety score for the route
    const safetyAnalysis =
      await advancedSafetyScoring.calculateSafetyOptimizedRoute(
        origin,
        destination,
        { prioritizeSafety: type === "safest" },
      );

    // Extract detailed safety factors
    const currentSafetyFactors = advancedSafetyScoring.getSafetyFactors();

    const safetyFactors = {
      lighting: currentSafetyFactors?.lighting || 70,
      crimeRate: currentSafetyFactors?.crime || 70,
      emergencyServices: currentSafetyFactors?.emergencyServices || 70,
      traffic: currentSafetyFactors?.traffic || 70,
    };

    // Generate instructions
    const instructions = steps.map(
      (step, index) =>
        `${index + 1}. ${step.instructions?.replace(/<[^>]*>/g, "") || "Continue"} (${step.distance?.text || ""})`,
    );

    return {
      id: `${type}_${Date.now()}`,
      name: type === "safest" ? "Safest Route" : "Quickest Route",
      distance: leg.distance?.text || "Unknown distance",
      duration: leg.duration?.text || "Unknown duration",
      safetyScore: safetyAnalysis.score,
      waypoints,
      instructions,
      avoidTolls: type === "safest",
      avoidHighways: type === "safest",
      safetyFactors,
      risks: safetyAnalysis.risks,
      advantages: safetyAnalysis.advantages,
      description: this.generateRouteDescription(
        type,
        safetyAnalysis.score,
        safetyAnalysis,
      ),
    };
  }

  private async getDirections(
    service: google.maps.DirectionsService,
    request: google.maps.DirectionsRequest,
  ): Promise<google.maps.DirectionsResult> {
    return new Promise((resolve, reject) => {
      service.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          reject(new Error(`Directions request failed with status: ${status}`));
        }
      });
    });
  }

  private determineRecommendedRoute(
    safestRoute: RouteOption,
    quickestRoute: RouteOption,
  ): "safest" | "quickest" {
    // Recommend safest route if:
    // 1. Safety score difference is significant (>20 points)
    // 2. Current time is night (after 8 PM or before 6 AM)
    // 3. Safest route doesn't take significantly longer (>50% more time)

    const hour = new Date().getHours();
    const isNightTime = hour < 6 || hour > 20;
    const safetyDifference =
      safestRoute.safetyScore - quickestRoute.safetyScore;

    // Parse durations to compare (simplified - assumes format like "15 mins")
    const safestDuration = this.parseDuration(safestRoute.duration);
    const quickestDuration = this.parseDuration(quickestRoute.duration);
    const timeDifferenceRatio = safestDuration / quickestDuration;

    if (isNightTime) {
      return "safest"; // Always recommend safest route at night
    }

    if (safetyDifference > 20 && timeDifferenceRatio < 1.5) {
      return "safest"; // Significantly safer and not too much longer
    }

    if (safestRoute.safetyScore < 40) {
      return "quickest"; // If even safest route is risky, prefer quickest
    }

    return safetyDifference > 10 ? "safest" : "quickest";
  }

  private parseDuration(duration: string): number {
    // Simple duration parser - extract minutes
    const match = duration.match(/(\d+)\s*min/i);
    return match ? parseInt(match[1]) : 15; // Default 15 minutes
  }

  private generateRouteDescription(
    type: "safest" | "quickest",
    safetyScore: number,
    analysis: any,
  ): string {
    if (type === "safest") {
      if (safetyScore > 80) {
        return "Highly recommended safe route with excellent lighting and emergency service coverage.";
      } else if (safetyScore > 60) {
        return "Generally safe route with good infrastructure and moderate security.";
      } else {
        return "Route with some safety considerations - stay alert and consider alternatives.";
      }
    } else {
      return `Fastest available route${safetyScore > 70 ? " with good safety conditions" : " - be cautious of potential risks"}.`;
    }
  }

  private async createFallbackRoute(
    origin: SafetyLocation,
    destination: SafetyLocation,
    type: "safest" | "quickest" = "safest",
  ): Promise<RouteOption> {
    // Create a basic fallback route when API calls fail
    const distance = this.calculateDistance(origin, destination);
    const estimatedDuration = Math.round(distance * 12); // 12 minutes per km walking

    const baseScore =
      await advancedSafetyScoring.analyzeSafetyForLocation(origin);
    const destScore =
      await advancedSafetyScoring.analyzeSafetyForLocation(destination);
    const averageScore = (baseScore + destScore) / 2;

    return {
      id: `fallback_${type}_${Date.now()}`,
      name: type === "safest" ? "Safe Direct Route" : "Direct Route",
      distance: `${distance.toFixed(1)} km`,
      duration: `${estimatedDuration} mins`,
      safetyScore: averageScore,
      waypoints: [
        {
          latitude: origin.latitude,
          longitude: origin.longitude,
          name: "Start",
        },
        {
          latitude: destination.latitude,
          longitude: destination.longitude,
          name: "Destination",
        },
      ],
      instructions: [
        "1. Head towards your destination",
        "2. Follow main roads when possible",
        "3. Stay in well-lit areas",
        "4. Arrive at destination",
      ],
      avoidTolls: type === "safest",
      avoidHighways: type === "safest",
      safetyFactors: {
        lighting: 60,
        crimeRate: 60,
        emergencyServices: 60,
        traffic: 60,
      },
      risks: averageScore < 50 ? ["Limited route analysis available"] : [],
      advantages: ["Direct path to destination"],
      description: "Basic route - detailed analysis unavailable.",
    };
  }

  private calculateDistance(
    point1: SafetyLocation,
    point2: SafetyLocation,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.latitude * Math.PI) / 180) *
        Math.cos((point2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const enhancedRouteCalculationService =
  EnhancedRouteCalculationService.getInstance();
export type { RouteOption, RouteCalculationResult, RouteWaypoint };
