import { enhancedSafetyScoring } from "./enhancedSafetyScoring";

interface SafetyAwareRoute {
  path: google.maps.LatLng[];
  totalDistance: number;
  totalDuration: number;
  averageSafetyScore: number;
  avoidedDangerZones: number;
  instructions: Array<{
    instruction: string;
    distance: string;
    duration: string;
    safetyScore: number;
  }>;
}

interface RouteOptions {
  avoidDangerZones: boolean;
  minimumSafetyScore: number;
  preferSafeRoutes: boolean;
  travelMode: "WALKING" | "DRIVING" | "BICYCLING";
}

export class SafetyAwareNavigation {
  private static instance: SafetyAwareNavigation;

  static getInstance(): SafetyAwareNavigation {
    if (!SafetyAwareNavigation.instance) {
      SafetyAwareNavigation.instance = new SafetyAwareNavigation();
    }
    return SafetyAwareNavigation.instance;
  }

  async calculateSafeRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: RouteOptions = {
      avoidDangerZones: true,
      minimumSafetyScore: 60,
      preferSafeRoutes: true,
      travelMode: "WALKING",
    },
  ): Promise<SafetyAwareRoute> {
    console.log("🛡️ Calculating safety-aware route...", {
      origin,
      destination,
      options,
    });

    try {
      // Create waypoints along the route for safety analysis
      const waypoints = await this.generateSafetyCheckpoints(
        origin,
        destination,
        options,
      );

      // Calculate routes with safety considerations
      const routes = await this.calculateMultipleRoutes(
        origin,
        destination,
        waypoints,
        options,
      );

      // Score and rank routes by safety
      const scoredRoutes = await this.scoreRoutesBySafety(routes, options);

      // Return the safest route
      const safestRoute = scoredRoutes[0];

      console.log("✅ Safe route calculated:", {
        averageSafety: safestRoute.averageSafetyScore,
        avoidedZones: safestRoute.avoidedDangerZones,
      });

      return safestRoute;
    } catch (error) {
      console.error("❌ Safety-aware navigation failed:", error);
      // Fallback to standard route
      return this.calculateFallbackRoute(origin, destination, options);
    }
  }

  private async generateSafetyCheckpoints(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: RouteOptions,
  ): Promise<google.maps.LatLng[]> {
    const waypoints: google.maps.LatLng[] = [];

    // Calculate intermediate points along the direct path
    const steps = 5; // Number of safety checkpoints

    for (let i = 1; i < steps; i++) {
      const fraction = i / steps;
      const lat = origin.lat + (destination.lat - origin.lat) * fraction;
      const lng = origin.lng + (destination.lng - origin.lng) * fraction;

      // Check safety score at this point
      const safetyScore = await enhancedSafetyScoring.calculateEnhancedSafety(
        lat,
        lng,
      );

      // If this point is dangerous and we're avoiding danger zones, find a safer alternative
      if (
        options.avoidDangerZones &&
        safetyScore.overallScore < options.minimumSafetyScore
      ) {
        const saferPoint = await this.findSaferAlternative(
          lat,
          lng,
          options.minimumSafetyScore,
        );
        if (saferPoint) {
          waypoints.push(
            new google.maps.LatLng(saferPoint.lat, saferPoint.lng),
          );
        }
      } else {
        waypoints.push(new google.maps.LatLng(lat, lng));
      }
    }

    return waypoints;
  }

  private async findSaferAlternative(
    lat: number,
    lng: number,
    minSafetyScore: number,
    searchRadius: number = 0.005, // ~500m radius
  ): Promise<{ lat: number; lng: number } | null> {
    const candidates = [
      { lat: lat + searchRadius, lng: lng },
      { lat: lat - searchRadius, lng: lng },
      { lat: lat, lng: lng + searchRadius },
      { lat: lat, lng: lng - searchRadius },
      { lat: lat + searchRadius / 2, lng: lng + searchRadius / 2 },
      { lat: lat - searchRadius / 2, lng: lng - searchRadius / 2 },
      { lat: lat + searchRadius / 2, lng: lng - searchRadius / 2 },
      { lat: lat - searchRadius / 2, lng: lng + searchRadius / 2 },
    ];

    for (const candidate of candidates) {
      try {
        const safetyScore = await enhancedSafetyScoring.calculateEnhancedSafety(
          candidate.lat,
          candidate.lng,
        );

        if (safetyScore.overallScore >= minSafetyScore) {
          console.log(
            `✅ Found safer alternative: ${safetyScore.overallScore}/100`,
          );
          return candidate;
        }
      } catch (error) {
        continue; // Try next candidate
      }
    }

    return null; // No safer alternative found
  }

  private async calculateMultipleRoutes(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints: google.maps.LatLng[],
    options: RouteOptions,
  ): Promise<google.maps.DirectionsResult[]> {
    const directionsService = new google.maps.DirectionsService();
    const routes: google.maps.DirectionsResult[] = [];

    // Calculate direct route
    try {
      const directRoute = await new Promise<google.maps.DirectionsResult>(
        (resolve, reject) => {
          directionsService.route(
            {
              origin,
              destination,
              travelMode: google.maps.TravelMode[options.travelMode],
              avoidHighways: options.travelMode === "WALKING",
              avoidTolls: true,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                resolve(result);
              } else {
                reject(new Error(`Direct route failed: ${status}`));
              }
            },
          );
        },
      );
      routes.push(directRoute);
    } catch (error) {
      console.warn("Direct route failed:", error);
    }

    // Calculate route with safety waypoints
    if (waypoints.length > 0) {
      try {
        const safeRoute = await new Promise<google.maps.DirectionsResult>(
          (resolve, reject) => {
            directionsService.route(
              {
                origin,
                destination,
                waypoints: waypoints.slice(0, 8).map((point) => ({
                  // Google Maps limit
                  location: point,
                  stopover: false,
                })),
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode[options.travelMode],
                avoidHighways: options.travelMode === "WALKING",
                avoidTolls: true,
              },
              (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(new Error(`Safe route failed: ${status}`));
                }
              },
            );
          },
        );
        routes.push(safeRoute);
      } catch (error) {
        console.warn("Safe route failed:", error);
      }
    }

    return routes;
  }

  private async scoreRoutesBySafety(
    routes: google.maps.DirectionsResult[],
    options: RouteOptions,
  ): Promise<SafetyAwareRoute[]> {
    const scoredRoutes: SafetyAwareRoute[] = [];

    for (const route of routes) {
      if (!route.routes || route.routes.length === 0) continue;

      const googleRoute = route.routes[0];
      const path = googleRoute.overview_path;

      // Sample points along the route for safety analysis
      const samplePoints = this.sampleRoutePoints(path, 20); // 20 sample points
      const safetyScores: number[] = [];
      let avoidedDangerZones = 0;

      // Calculate safety score for each sample point
      for (const point of samplePoints) {
        try {
          const safetyData =
            await enhancedSafetyScoring.calculateEnhancedSafety(
              point.lat(),
              point.lng(),
            );
          safetyScores.push(safetyData.overallScore);

          if (safetyData.overallScore < options.minimumSafetyScore) {
            avoidedDangerZones++;
          }
        } catch (error) {
          safetyScores.push(50); // Default safety score
        }
      }

      const averageSafetyScore =
        safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length;

      // Extract route information
      const leg = googleRoute.legs[0];
      const instructions = googleRoute.legs.flatMap(
        (leg) =>
          leg.steps?.map((step, index) => ({
            instruction: step.instructions || "Continue",
            distance: step.distance?.text || "Unknown",
            duration: step.duration?.text || "Unknown",
            safetyScore:
              safetyScores[
                Math.floor((index * safetyScores.length) / leg.steps!.length)
              ] || 50,
          })) || [],
      );

      scoredRoutes.push({
        path,
        totalDistance: leg.distance?.value || 0,
        totalDuration: leg.duration?.value || 0,
        averageSafetyScore,
        avoidedDangerZones,
        instructions,
      });
    }

    // Sort by safety score (highest first), then by distance (shortest first)
    return scoredRoutes.sort((a, b) => {
      const safetyDiff = b.averageSafetyScore - a.averageSafetyScore;
      if (Math.abs(safetyDiff) > 10) return safetyDiff; // Prioritize safety if significant difference
      return a.totalDistance - b.totalDistance; // Then prioritize distance
    });
  }

  private sampleRoutePoints(
    path: google.maps.LatLng[],
    numSamples: number,
  ): google.maps.LatLng[] {
    if (path.length <= numSamples) return path;

    const sampledPoints: google.maps.LatLng[] = [];
    const interval = Math.floor(path.length / numSamples);

    for (let i = 0; i < path.length; i += interval) {
      sampledPoints.push(path[i]);
    }

    return sampledPoints;
  }

  private async calculateFallbackRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: RouteOptions,
  ): Promise<SafetyAwareRoute> {
    console.log("🔄 Using fallback route calculation");

    // Simple fallback route with basic safety estimation
    const distance = this.calculateDistance(origin, destination);
    const duration = this.estimateDuration(distance, options.travelMode);

    return {
      path: [
        new google.maps.LatLng(origin.lat, origin.lng),
        new google.maps.LatLng(destination.lat, destination.lng),
      ],
      totalDistance: distance,
      totalDuration: duration,
      averageSafetyScore: 65, // Conservative estimate
      avoidedDangerZones: 0,
      instructions: [
        {
          instruction: `Head towards destination (${distance.toFixed(0)}m)`,
          distance: `${(distance / 1000).toFixed(1)} km`,
          duration: `${Math.round(duration / 60)} min`,
          safetyScore: 65,
        },
      ],
    };
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private estimateDuration(distance: number, travelMode: string): number {
    const speeds = {
      WALKING: 1.4, // m/s (5 km/h)
      BICYCLING: 4.2, // m/s (15 km/h)
      DRIVING: 13.9, // m/s (50 km/h city driving)
    };

    const speed = speeds[travelMode as keyof typeof speeds] || speeds.WALKING;
    return distance / speed; // seconds
  }
}

// Export singleton instance
export const safetyAwareNavigation = SafetyAwareNavigation.getInstance();
