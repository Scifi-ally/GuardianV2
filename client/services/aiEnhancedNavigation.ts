import { geminiNewsAnalysisService } from "./geminiNewsAnalysisService";

interface NavigationPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

interface RouteSegment {
  start: NavigationPoint;
  end: NavigationPoint;
  safetyScore: number;
  aiRecommendations: string[];
  alertLevel: "safe" | "caution" | "warning" | "danger";
  estimatedTime: number;
  distance: number;
}

interface EnhancedRoute {
  segments: RouteSegment[];
  overallSafetyScore: number;
  totalTime: number;
  totalDistance: number;
  aiInsights: string[];
  dynamicAlerts: string[];
  alternativeRoutes?: EnhancedRoute[];
}

interface LiveNavigationState {
  currentLocation: NavigationPoint;
  destination: NavigationPoint;
  route: EnhancedRoute | null;
  isNavigating: boolean;
  nextAlert?: {
    message: string;
    severity: "info" | "warning" | "danger";
    distance: number; // meters until alert location
  };
}

export class AIEnhancedNavigationService {
  private static instance: AIEnhancedNavigationService;
  private navigationState: LiveNavigationState | null = null;
  private routeUpdateInterval: NodeJS.Timeout | null = null;
  private callbacks: Set<(state: LiveNavigationState) => void> = new Set();

  static getInstance(): AIEnhancedNavigationService {
    if (!AIEnhancedNavigationService.instance) {
      AIEnhancedNavigationService.instance = new AIEnhancedNavigationService();
    }
    return AIEnhancedNavigationService.instance;
  }

  // Start AI-enhanced navigation
  async startNavigation(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
  ): Promise<EnhancedRoute> {
    console.log("🧭 Starting AI-enhanced navigation...");

    const currentLocation: NavigationPoint = {
      lat: from.lat,
      lng: from.lng,
      timestamp: Date.now(),
    };

    const destination: NavigationPoint = {
      lat: to.lat,
      lng: to.lng,
      timestamp: Date.now(),
    };

    // Generate enhanced route with AI analysis
    const route = await this.generateEnhancedRoute(
      currentLocation,
      destination,
    );

    this.navigationState = {
      currentLocation,
      destination,
      route,
      isNavigating: true,
    };

    // Start real-time route monitoring
    this.startRouteMonitoring();

    // Notify subscribers
    this.notifyCallbacks();

    return route;
  }

  // Update current location during navigation
  async updateLocation(location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }): Promise<void> {
    if (!this.navigationState || !this.navigationState.isNavigating) return;

    const newLocation: NavigationPoint = {
      lat: location.latitude,
      lng: location.longitude,
      timestamp: Date.now(),
    };

    this.navigationState.currentLocation = newLocation;

    // Check for dynamic route updates
    await this.checkForRouteUpdates();

    // Update next alert
    this.updateNextAlert();

    this.notifyCallbacks();
  }

  // Generate AI-enhanced route
  private async generateEnhancedRoute(
    start: NavigationPoint,
    end: NavigationPoint,
  ): Promise<EnhancedRoute> {
    const segments = await this.createRouteSegments(start, end);

    // Analyze overall route safety
    const overallSafetyScore = this.calculateOverallSafety(segments);

    // Generate AI insights for the entire route
    const aiInsights = await this.generateRouteInsights(segments);

    // Calculate totals
    const totalTime = segments.reduce((sum, seg) => sum + seg.estimatedTime, 0);
    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);

    // Generate alternative routes if current route has low safety
    let alternativeRoutes: EnhancedRoute[] | undefined;
    if (overallSafetyScore < 60) {
      alternativeRoutes = await this.generateAlternativeRoutes(start, end);
    }

    return {
      segments,
      overallSafetyScore,
      totalTime,
      totalDistance,
      aiInsights,
      dynamicAlerts: [],
      alternativeRoutes,
    };
  }

  // Create route segments with AI analysis
  private async createRouteSegments(
    start: NavigationPoint,
    end: NavigationPoint,
  ): Promise<RouteSegment[]> {
    const segments: RouteSegment[] = [];

    // Create fewer segments to reduce API calls
    const numSegments = Math.min(
      3,
      Math.max(2, Math.floor(this.calculateDistance(start, end) / 1000)),
    ); // 1000m per segment to reduce API usage

    for (let i = 0; i < numSegments; i++) {
      const ratio = i / numSegments;
      const nextRatio = (i + 1) / numSegments;

      const segmentStart: NavigationPoint = {
        lat: start.lat + ratio * (end.lat - start.lat),
        lng: start.lng + ratio * (end.lng - start.lng),
        timestamp: Date.now(),
      };

      const segmentEnd: NavigationPoint = {
        lat: start.lat + nextRatio * (end.lat - start.lat),
        lng: start.lng + nextRatio * (end.lng - start.lng),
        timestamp: Date.now(),
      };

      try {
        // Get AI safety analysis for this segment
        const analysis = await geminiNewsAnalysisService.analyzeAreaSafety(
          (segmentStart.lat + segmentEnd.lat) / 2,
          (segmentStart.lng + segmentEnd.lng) / 2,
        );

        const segment: RouteSegment = {
          start: segmentStart,
          end: segmentEnd,
          safetyScore: analysis.score,
          aiRecommendations: this.generateSegmentRecommendations(analysis),
          alertLevel: this.determineAlertLevel(analysis.score),
          estimatedTime: this.estimateSegmentTime(segmentStart, segmentEnd),
          distance: this.calculateDistance(segmentStart, segmentEnd),
        };

        segments.push(segment);
      } catch (error) {
        console.warn("Failed to analyze segment, using fallback:", error);

        // Fallback segment
        const fallbackScore = 65 + Math.random() * 20;
        const segment: RouteSegment = {
          start: segmentStart,
          end: segmentEnd,
          safetyScore: fallbackScore,
          aiRecommendations: ["Stay alert", "Follow main roads"],
          alertLevel: this.determineAlertLevel(fallbackScore),
          estimatedTime: this.estimateSegmentTime(segmentStart, segmentEnd),
          distance: this.calculateDistance(segmentStart, segmentEnd),
        };

        segments.push(segment);
      }

      // Longer delay to respect API limits and prevent quota exhaustion
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    return segments;
  }

  // Generate AI insights for the route
  private async generateRouteInsights(
    segments: RouteSegment[],
  ): Promise<string[]> {
    const insights: string[] = [];

    const avgSafety =
      segments.reduce((sum, seg) => sum + seg.safetyScore, 0) / segments.length;
    const dangerousSegments = segments.filter((seg) => seg.safetyScore < 40);
    const timeOfDay = new Date().getHours();

    // Time-based insights
    if (timeOfDay >= 22 || timeOfDay <= 5) {
      insights.push("🌙 Night travel detected - extra caution recommended");
    } else if (timeOfDay >= 6 && timeOfDay <= 9) {
      insights.push(
        "🌅 Morning commute time - generally safer with good visibility",
      );
    }

    // Safety-based insights
    if (avgSafety >= 80) {
      insights.push("✅ This route has excellent safety ratings");
    } else if (avgSafety < 50) {
      insights.push(
        "⚠️ This route has safety concerns - consider alternatives",
      );
    }

    // Dangerous segments
    if (dangerousSegments.length > 0) {
      insights.push(
        `🚨 ${dangerousSegments.length} segment(s) require extra attention`,
      );
    }

    // Route characteristics
    if (segments.length > 4) {
      insights.push("📍 Long route - regular check-ins recommended");
    }

    return insights;
  }

  // Start real-time route monitoring
  private startRouteMonitoring(): void {
    this.routeUpdateInterval = setInterval(async () => {
      if (this.navigationState?.isNavigating) {
        await this.performRealTimeAnalysis();
      }
    }, 180000); // Check every 3 minutes to preserve API quota
  }

  // Perform real-time analysis during navigation
  private async performRealTimeAnalysis(): Promise<void> {
    if (!this.navigationState) return;

    const { currentLocation } = this.navigationState;

    try {
      // Get real-time analysis of current area
      const analysis = await geminiNewsAnalysisService.analyzeAreaSafety(
        currentLocation.lat,
        currentLocation.lng,
      );

      // Generate dynamic alerts based on current conditions
      const dynamicAlerts: string[] = [];

      if (analysis.score < 40) {
        dynamicAlerts.push("🚨 Entering high-risk area - stay alert");
      }

      // Check for news events affecting current area
      if (analysis.newsEvents.length > 0) {
        const negativeEvents = analysis.newsEvents.filter(
          (event) => event.impact === "negative",
        );
        if (negativeEvents.length > 0) {
          dynamicAlerts.push(
            `📰 Recent incidents reported in this area: ${negativeEvents[0].title}`,
          );
        }
      }

      if (this.navigationState.route) {
        this.navigationState.route.dynamicAlerts = dynamicAlerts;
      }

      this.notifyCallbacks();
    } catch (error) {
      console.warn("Real-time analysis failed:", error);
    }
  }

  // Check for route updates
  private async checkForRouteUpdates(): Promise<void> {
    // Implementation for checking if route needs to be updated
    // based on current conditions, traffic, incidents, etc.
  }

  // Update next alert based on current location
  private updateNextAlert(): void {
    if (!this.navigationState?.route) return;

    const { currentLocation, route } = this.navigationState;

    // Find the next segment that needs attention
    for (const segment of route.segments) {
      const distanceToSegment = this.calculateDistance(
        currentLocation,
        segment.start,
      );

      if (distanceToSegment < 200 && segment.alertLevel !== "safe") {
        this.navigationState.nextAlert = {
          message: `${segment.alertLevel.toUpperCase()}: ${segment.aiRecommendations[0]}`,
          severity: segment.alertLevel === "danger" ? "danger" : "warning",
          distance: distanceToSegment,
        };
        break;
      }
    }
  }

  // Generate alternative routes
  private async generateAlternativeRoutes(
    start: NavigationPoint,
    end: NavigationPoint,
  ): Promise<EnhancedRoute[]> {
    // Generate 1-2 alternative routes with different paths
    const alternatives: EnhancedRoute[] = [];

    // Alternative 1: Slightly offset route
    const alt1Start = {
      ...start,
      lat: start.lat + 0.002,
      lng: start.lng + 0.002,
    };

    try {
      const altRoute1 = await this.generateEnhancedRoute(alt1Start, end);
      alternatives.push(altRoute1);
    } catch (error) {
      console.warn("Failed to generate alternative route 1:", error);
    }

    return alternatives;
  }

  // Utility methods
  private calculateOverallSafety(segments: RouteSegment[]): number {
    return (
      segments.reduce((sum, seg) => sum + seg.safetyScore, 0) / segments.length
    );
  }

  private generateSegmentRecommendations(analysis: any): string[] {
    const recommendations = [...(analysis.factors || [])];

    if (analysis.score < 40) {
      recommendations.push("Avoid if possible", "Travel in groups");
    } else if (analysis.score < 60) {
      recommendations.push("Stay alert", "Keep to main roads");
    }

    return recommendations.slice(0, 3);
  }

  private determineAlertLevel(
    score: number,
  ): "safe" | "caution" | "warning" | "danger" {
    if (score >= 80) return "safe";
    if (score >= 60) return "caution";
    if (score >= 40) return "warning";
    return "danger";
  }

  private estimateSegmentTime(
    start: NavigationPoint,
    end: NavigationPoint,
  ): number {
    const distance = this.calculateDistance(start, end);
    return Math.round((distance / 1.4) * 60); // 1.4 m/s walking speed
  }

  private calculateDistance(
    point1: NavigationPoint,
    point2: NavigationPoint,
  ): number {
    const R = 6371e3; // Earth radius in meters
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

  // Subscription management
  subscribe(callback: (state: LiveNavigationState) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyCallbacks(): void {
    if (this.navigationState) {
      this.callbacks.forEach((callback) => callback(this.navigationState!));
    }
  }

  // Stop navigation
  stopNavigation(): void {
    console.log("🛑 Stopping AI-enhanced navigation...");

    if (this.routeUpdateInterval) {
      clearInterval(this.routeUpdateInterval);
      this.routeUpdateInterval = null;
    }

    this.navigationState = null;
    this.notifyCallbacks();
  }

  // Get current navigation state
  getNavigationState(): LiveNavigationState | null {
    return this.navigationState;
  }
}

export const aiEnhancedNavigation = AIEnhancedNavigationService.getInstance();

// Export types
export type {
  NavigationPoint,
  RouteSegment,
  EnhancedRoute,
  LiveNavigationState,
};
