/**
 * Enhanced Navigation Service
 * Real-time navigation with Google Maps integration, travel mode selection, and emergency features
 */

import { unifiedNotifications } from "./unifiedNotificationService";
import { enhancedLocationService } from "./enhancedLocationService";
import { emergencyContactActionsService } from "./emergencyContactActionsService";
import {
  unifiedSafetyAnalysisService,
  type ComprehensiveSafetyMetrics,
} from "./unifiedSafetyAnalysisService";

export type TravelMode = "walking" | "driving" | "bicycling";
export type NavigationStatus =
  | "idle"
  | "calculating"
  | "navigating"
  | "paused"
  | "completed";

// Use the comprehensive metrics from unified service
export type SafetyMetrics = ComprehensiveSafetyMetrics;

export interface RouteStep {
  instruction: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
  polyline: string;
}

export interface NavigationRoute {
  id: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: { lat: number; lng: number }[];
  travelMode: TravelMode;
  steps: RouteStep[];
  totalDistance: { text: string; value: number };
  totalDuration: { text: string; value: number };
  overview_polyline: string;
  safetyScore: number;
  alternativeRoutes?: NavigationRoute[];
}

export interface NavigationState {
  status: NavigationStatus;
  currentRoute: NavigationRoute | null;
  currentStep: number;
  remainingDistance: number;
  remainingTime: number;
  nextTurn: string | null;
  userLocation: { lat: number; lng: number } | null;
  isTracking: boolean;
  travelMode: TravelMode;
  zoomLevel: number;
  emergencyMode: boolean;
}

class EnhancedNavigationService {
  private static instance: EnhancedNavigationService;
  private state: NavigationState;
  private map: google.maps.Map | null = null;
  private directionsService: google.maps.DirectionsService | null = null;
  private directionsRenderer: google.maps.DirectionsRenderer | null = null;
  private locationUpdateInterval: number | null = null;
  private navigationCallbacks: ((state: NavigationState) => void)[] = [];
  private routePolyline: google.maps.Polyline | null = null;
  private userMarker: google.maps.Marker | null = null;

  constructor() {
    this.state = {
      status: "idle",
      currentRoute: null,
      currentStep: 0,
      remainingDistance: 0,
      remainingTime: 0,
      nextTurn: null,
      userLocation: null,
      isTracking: false,
      travelMode: "driving",
      zoomLevel: 16,
      emergencyMode: false,
    };
  }

  static getInstance(): EnhancedNavigationService {
    if (!EnhancedNavigationService.instance) {
      EnhancedNavigationService.instance = new EnhancedNavigationService();
    }
    return EnhancedNavigationService.instance;
  }

  // Initialize navigation with map instance
  initializeNavigation(map: google.maps.Map) {
    this.map = map;
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      suppressInfoWindows: true,
      polylineOptions: {
        strokeColor: "#2563EB",
        strokeWeight: 6,
        strokeOpacity: 0.8,
      },
    });
    this.directionsRenderer.setMap(map);

    console.log("🗺️ Enhanced navigation initialized");
  }

  // Start navigation to destination
  async startNavigation(
    destination: { lat: number; lng: number },
    origin?: { lat: number; lng: number },
    travelMode: TravelMode = "driving",
  ): Promise<void> {
    try {
      this.state.status = "calculating";
      this.state.travelMode = travelMode;
      this.notifyCallbacks();

      // Get current location if origin not provided
      let startLocation = origin;
      if (!startLocation) {
        const currentLocation =
          await enhancedLocationService.getCurrentLocation();
        startLocation = {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        };
      }

      // Calculate route
      const route = await this.calculateRoute(
        startLocation,
        destination,
        travelMode,
      );

      if (!route) {
        throw new Error("Failed to calculate route");
      }

      this.state.currentRoute = route;
      this.state.status = "navigating";
      this.state.currentStep = 0;
      this.state.userLocation = startLocation;

      // Start location tracking
      await this.startLocationTracking();

      // Zoom to route
      this.zoomToRoute();

      // Display route on map with safety coloring
      this.displayRoute(route);
      this.displaySafetyOverlay(route);
      this.displayIncidentMarkers(route);

      // Show navigation UI
      this.showNavigationInterface();

      unifiedNotifications.success("Navigation Started", {
        message: `Route calculated: ${route.totalDistance.text}, ${route.totalDuration.text}`,
      });

      this.notifyCallbacks();
    } catch (error) {
      console.error("Navigation start failed:", error);
      this.state.status = "idle";
      unifiedNotifications.error("Navigation Failed", {
        message: "Unable to calculate route. Please try again.",
      });
      this.notifyCallbacks();
    }
  }

  // Calculate route using Google Directions API
  private async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    travelMode: TravelMode,
  ): Promise<NavigationRoute | null> {
    if (!this.directionsService) return null;

    try {
      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: this.getTravelModeForGoogle(travelMode),
        provideRouteAlternatives: true,
        avoidHighways: false,
        avoidTolls: false,
      };

      const result = await new Promise<google.maps.DirectionsResult>(
        (resolve, reject) => {
          this.directionsService!.route(request, (result, status) => {
            if (status === "OK" && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          });
        },
      );

      const mainRoute = result.routes[0];
      const leg = mainRoute.legs[0];

      // Calculate comprehensive safety metrics
      const safetyAnalysis = await this.calculateComprehensiveSafety(
        mainRoute,
        travelMode,
      );

      const route: NavigationRoute = {
        id: `route_${Date.now()}`,
        origin,
        destination,
        travelMode,
        steps: leg.steps.map((step) => ({
          instruction: step.instructions,
          distance: step.distance!,
          duration: step.duration!,
          start_location: {
            lat: step.start_location.lat(),
            lng: step.start_location.lng(),
          },
          end_location: {
            lat: step.end_location.lat(),
            lng: step.end_location.lng(),
          },
          polyline: step.polyline?.points || "",
        })),
        totalDistance: leg.distance!,
        totalDuration: leg.duration!,
        overview_polyline: mainRoute.overview_polyline,
        safetyScore: safetyAnalysis.overallSafety,
        safetyMetrics: safetyAnalysis,
        segmentSafety: await this.calculateSegmentSafety(mainRoute),
        riskWarnings: this.generateRiskWarnings(safetyAnalysis),
        safetyRecommendations: this.generateSafetyRecommendations(
          safetyAnalysis,
          travelMode,
        ),
        alternativeRoutes: await this.processAlternativeRoutes(
          result.routes.slice(1),
          origin,
          destination,
          travelMode,
        ),
      };

      return route;
    } catch (error) {
      console.error("Route calculation failed:", error);
      return null;
    }
  }

  // Start real-time location tracking during navigation
  private async startLocationTracking(): Promise<void> {
    this.state.isTracking = true;

    // Stop any existing tracking
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }

    // Start location updates every 2 seconds during navigation
    this.locationUpdateInterval = setInterval(async () => {
      await this.updateUserLocation();
    }, 2000) as unknown as number;

    console.log("📍 Location tracking started");
  }

  // Update user location and navigation progress
  private async updateUserLocation(): Promise<void> {
    try {
      const location = await enhancedLocationService.getCurrentLocation();
      const newLocation = {
        lat: location.latitude,
        lng: location.longitude,
      };

      this.state.userLocation = newLocation;

      // Update user marker on map
      this.updateUserMarker(newLocation);

      // Check navigation progress
      if (this.state.currentRoute) {
        this.updateNavigationProgress(newLocation);
      }

      // Auto-zoom to user location if needed
      if (this.state.status === "navigating") {
        this.autoZoomToUser(newLocation);
      }

      this.notifyCallbacks();
    } catch (error) {
      console.error("Location update failed:", error);
    }
  }

  // Update navigation progress based on current location
  private updateNavigationProgress(userLocation: {
    lat: number;
    lng: number;
  }): void {
    if (!this.state.currentRoute) return;

    const route = this.state.currentRoute;
    const currentStep = this.state.currentStep;

    // Calculate remaining distance and time
    let remainingDistance = 0;
    let remainingTime = 0;

    for (let i = currentStep; i < route.steps.length; i++) {
      remainingDistance += route.steps[i].distance.value;
      remainingTime += route.steps[i].duration.value;
    }

    this.state.remainingDistance = remainingDistance;
    this.state.remainingTime = remainingTime;

    // Check if we've reached the current step's end point
    if (currentStep < route.steps.length) {
      const step = route.steps[currentStep];
      const distanceToStepEnd = this.calculateDistance(
        userLocation,
        step.end_location,
      );

      // If we're close to the step end (within 20 meters), move to next step
      if (distanceToStepEnd < 20 && currentStep < route.steps.length - 1) {
        this.state.currentStep++;
        this.state.nextTurn =
          route.steps[this.state.currentStep]?.instruction || null;

        // Announce next turn
        if (this.state.nextTurn) {
          unifiedNotifications.info("Navigation", {
            message: this.state.nextTurn,
          });
        }
      }
    }

    // Check if navigation is complete
    const distanceToDestination = this.calculateDistance(
      userLocation,
      route.destination,
    );

    if (distanceToDestination < 10) {
      this.completeNavigation();
    }
  }

  // Display route on map
  private displayRoute(route: NavigationRoute): void {
    if (!this.directionsRenderer || !this.map) return;

    // Create directions result for renderer
    const directionsResult: google.maps.DirectionsResult = {
      routes: [
        {
          legs: [
            {
              steps: route.steps.map((step) => ({
                instructions: step.instruction,
                distance: step.distance,
                duration: step.duration,
                start_location: new google.maps.LatLng(
                  step.start_location.lat,
                  step.start_location.lng,
                ),
                end_location: new google.maps.LatLng(
                  step.end_location.lat,
                  step.end_location.lng,
                ),
                polyline: { points: step.polyline },
              })) as google.maps.DirectionsStep[],
              distance: route.totalDistance,
              duration: route.totalDuration,
              start_address: "",
              end_address: "",
              start_location: new google.maps.LatLng(
                route.origin.lat,
                route.origin.lng,
              ),
              end_location: new google.maps.LatLng(
                route.destination.lat,
                route.destination.lng,
              ),
            },
          ],
          overview_polyline: route.overview_polyline,
          bounds: new google.maps.LatLngBounds(),
          copyrights: "",
          summary: "",
          warnings: [],
          waypoint_order: [],
        },
      ],
      status: google.maps.DirectionsStatus.OK,
      request: {
        origin: new google.maps.LatLng(route.origin.lat, route.origin.lng),
        destination: new google.maps.LatLng(
          route.destination.lat,
          route.destination.lng,
        ),
        travelMode: this.getTravelModeForGoogle(route.travelMode),
      },
    };

    this.directionsRenderer.setDirections(directionsResult);
  }

  // Update user marker on map
  private updateUserMarker(location: { lat: number; lng: number }): void {
    if (!this.map) return;

    if (this.userMarker) {
      this.userMarker.setPosition(location);
    } else {
      this.userMarker = new google.maps.Marker({
        position: location,
        map: this.map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: "Your Location",
      });
    }
  }

  // Auto-zoom to user location during navigation
  private autoZoomToUser(location: { lat: number; lng: number }): void {
    if (!this.map) return;

    const currentCenter = this.map.getCenter();
    if (!currentCenter) return;

    const distance = this.calculateDistance(
      { lat: currentCenter.lat(), lng: currentCenter.lng() },
      location,
    );

    // If user has moved significantly, re-center map
    if (distance > 100) {
      this.map.panTo(location);
    }
  }

  // Zoom to show entire route
  private zoomToRoute(): void {
    if (!this.map || !this.state.currentRoute) return;

    const bounds = new google.maps.LatLngBounds();
    const route = this.state.currentRoute;

    bounds.extend(new google.maps.LatLng(route.origin.lat, route.origin.lng));
    bounds.extend(
      new google.maps.LatLng(route.destination.lat, route.destination.lng),
    );

    route.steps.forEach((step) => {
      bounds.extend(
        new google.maps.LatLng(
          step.start_location.lat,
          step.start_location.lng,
        ),
      );
      bounds.extend(
        new google.maps.LatLng(step.end_location.lat, step.end_location.lng),
      );
    });

    this.map.fitBounds(bounds, { padding: 50 });
    this.state.zoomLevel = this.map.getZoom() || 16;
  }

  // Show navigation interface
  private showNavigationInterface(): void {
    // This would trigger the navigation UI to show
    unifiedNotifications.info("Navigation Active", {
      message: "Tap the map to view navigation details",
      persistent: true,
    });
  }

  // Complete navigation
  private completeNavigation(): void {
    this.state.status = "completed";
    this.stopLocationTracking();

    unifiedNotifications.success("Navigation Complete", {
      message: "You have arrived at your destination!",
    });

    // Auto-clear navigation after 10 seconds
    setTimeout(() => {
      this.clearNavigation();
    }, 10000);

    this.notifyCallbacks();
  }

  // Cancel navigation
  cancelNavigation(): void {
    this.state.status = "idle";
    this.stopLocationTracking();
    this.clearRoute();

    unifiedNotifications.success("Navigation Cancelled");
    this.notifyCallbacks();
  }

  // Clear navigation and reset map
  clearNavigation(): void {
    this.state = {
      ...this.state,
      status: "idle",
      currentRoute: null,
      currentStep: 0,
      remainingDistance: 0,
      remainingTime: 0,
      nextTurn: null,
      isTracking: false,
    };

    this.stopLocationTracking();
    this.clearRoute();
    this.clearUserMarker();

    this.notifyCallbacks();
  }

  // Stop location tracking
  private stopLocationTracking(): void {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
    this.state.isTracking = false;
    console.log("📍 Location tracking stopped");
  }

  // Clear route from map
  private clearRoute(): void {
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({ routes: [] } as any);
    }
    if (this.routePolyline) {
      this.routePolyline.setMap(null);
      this.routePolyline = null;
    }
  }

  // Clear user marker
  private clearUserMarker(): void {
    if (this.userMarker) {
      this.userMarker.setMap(null);
      this.userMarker = null;
    }
  }

  // Set travel mode
  setTravelMode(mode: TravelMode): void {
    this.state.travelMode = mode;
    this.notifyCallbacks();
  }

  // Enable emergency mode
  enableEmergencyMode(): void {
    this.state.emergencyMode = true;

    // Share location with emergency contacts during navigation
    if (this.state.userLocation && this.state.status === "navigating") {
      emergencyContactActionsService.shareLocationUpdate(
        this.state.userLocation,
        "Emergency navigation mode activated",
      );
    }

    this.notifyCallbacks();
  }

  // Helper methods
  private getTravelModeForGoogle(mode: TravelMode): google.maps.TravelMode {
    switch (mode) {
      case "walking":
        return google.maps.TravelMode.WALKING;
      case "driving":
        return google.maps.TravelMode.DRIVING;
      case "bicycling":
        return google.maps.TravelMode.BICYCLING;
      default:
        return google.maps.TravelMode.DRIVING;
    }
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateSafetyScore(route: google.maps.DirectionsRoute): number {
    // Comprehensive safety score calculation
    let score = 85; // Base score

    // Route characteristics analysis
    const summary = route.summary.toLowerCase();
    const hasHighways =
      summary.includes("highway") || summary.includes("freeway");
    const hasLocalRoads =
      summary.includes("local") || summary.includes("residential");
    const hasTolls = summary.includes("toll");

    if (hasHighways) score += 5; // Highways are generally safer
    if (hasLocalRoads) score -= 5; // Local roads might be riskier
    if (hasTolls) score += 3; // Toll roads tend to be well-maintained

    // Time-based safety factors
    const hour = new Date().getHours();
    const timeScore = this.calculateTimeFactors(hour);
    score = score * (timeScore / 100);

    // Weather safety factors
    const weatherScore = this.calculateWeatherSafety();
    score = score * (weatherScore / 100);

    // Location safety factors (simplified)
    const locationScore = this.calculateLocationSafety();
    score = score * (locationScore / 100);

    // Route distance and duration factors
    const routeDuration = route.legs[0].duration?.value || 0;
    if (routeDuration > 3600) score -= 5; // Long routes are riskier
    if (routeDuration < 600) score += 5; // Short routes are safer

    return Math.max(Math.min(Math.round(score), 100), 20);
  }

  private calculateTimeFactors(hour: number): number {
    // Higher risk during late night/early morning hours
    if (hour >= 22 || hour <= 5) return 60;
    if (hour >= 6 && hour <= 8) return 85; // Morning commute
    if (hour >= 17 && hour <= 19) return 80; // Evening commute
    return 95; // Safe daytime hours
  }

  private calculateWeatherSafety(): number {
    // Simplified weather analysis
    const season = this.getCurrentSeason();
    const hour = new Date().getHours();

    let score = 90;

    // Adjust for seasonal factors
    if (season === "winter") score -= 10;
    if (season === "summer" && hour >= 12 && hour <= 16) score -= 5; // Hot afternoon

    // Simulate weather conditions (in real app, use weather API)
    const isRainy = Math.random() < 0.2;
    const isStormy = Math.random() < 0.05;

    if (isStormy) score -= 30;
    else if (isRainy) score -= 15;

    return Math.max(score, 20);
  }

  private calculateLocationSafety(): number {
    // Simplified location-based safety analysis
    // In reality, this would use crime data, emergency services proximity, etc.
    const baseScore = 85;

    // Random factors for demo (in reality, use real data)
    const crimeRate = Math.random() * 0.3; // 0-30% crime adjustment
    const emergencyProximity = Math.random() * 0.2; // 0-20% emergency services bonus

    const score = baseScore - crimeRate * 100 + emergencyProximity * 100;
    return Math.max(Math.min(score, 100), 20);
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "autumn";
    return "winter";
  }

  // Public API
  getState(): NavigationState {
    return { ...this.state };
  }

  onStateChange(callback: (state: NavigationState) => void): void {
    this.navigationCallbacks.push(callback);
  }

  private notifyCallbacks(): void {
    this.navigationCallbacks.forEach((callback) => callback(this.getState()));
  }

  // Enhanced comprehensive safety analysis using unified service
  private async calculateComprehensiveSafety(
    route: google.maps.DirectionsRoute,
    travelMode: TravelMode,
  ): Promise<SafetyMetrics> {
    const routePoints = this.extractRoutePoints(route);
    const routeCenter = this.calculateRouteCenter(routePoints);

    try {
      // Use unified safety analysis service for comprehensive metrics
      const analysis =
        await unifiedSafetyAnalysisService.analyzeComprehensiveSafety(
          routeCenter,
          this.calculateRouteRadius(routePoints),
          "high", // High priority for navigation
        );

      // Apply navigation-specific adjustments
      const navigationAdjustedMetrics = this.applyNavigationAdjustments(
        analysis.metrics,
        route,
        travelMode,
      );

      console.log(
        `🛡️ Comprehensive safety analysis completed with ${Object.keys(navigationAdjustedMetrics).length} metrics`,
      );

      return navigationAdjustedMetrics;
    } catch (error) {
      console.error("❌ Comprehensive safety analysis failed:", error);
      return this.getFallbackSafetyMetrics();
    }
  }

  // Extract key points along the route for analysis
  private extractRoutePoints(
    route: google.maps.DirectionsRoute,
  ): { lat: number; lng: number }[] {
    const points: { lat: number; lng: number }[] = [];
    const leg = route.legs[0];

    // Add start and end points
    points.push({
      lat: leg.start_location.lat(),
      lng: leg.start_location.lng(),
    });

    // Add intermediate points from steps
    leg.steps.forEach((step, index) => {
      if (index % 2 === 0) {
        // Sample every other step to avoid too many points
        points.push({
          lat: step.end_location.lat(),
          lng: step.end_location.lng(),
        });
      }
    });

    points.push({
      lat: leg.end_location.lat(),
      lng: leg.end_location.lng(),
    });

    return points;
  }

  // Analyze news incidents along the route
  private async analyzeNewsAlongRoute(
    routePoints: { lat: number; lng: number }[],
  ): Promise<{ score: number; incidents: any[] }> {
    let totalScore = 100;
    let allIncidents: any[] = [];

    for (const point of routePoints) {
      try {
        const incidents = await newsAnalysisService.getSafetyIncidents(
          point,
          2,
        ); // 2km radius
        allIncidents = allIncidents.concat(incidents);

        // Reduce score based on incident severity and recency
        incidents.forEach((incident) => {
          const ageInDays =
            (Date.now() - incident.timestamp.getTime()) / (24 * 60 * 60 * 1000);
          const recencyFactor = Math.max(0.1, 1 - ageInDays / 30); // Decay over 30 days
          const severityImpact =
            {
              low: 5,
              medium: 15,
              high: 25,
              critical: 40,
            }[incident.severity] || 10;

          totalScore -= severityImpact * recencyFactor;
        });
      } catch (error) {
        console.warn("Failed to analyze news for point:", point);
      }
    }

    return {
      score: Math.max(totalScore, 20),
      incidents: allIncidents,
    };
  }

  // Analyze traffic safety based on Indian driving conditions
  private async analyzeTrafficSafety(
    route: google.maps.DirectionsRoute,
    travelMode: TravelMode,
  ): Promise<number> {
    let score = 80;
    const summary = route.summary.toLowerCase();
    const leg = route.legs[0];
    const duration = leg.duration?.value || 0;
    const distance = leg.distance?.value || 0;

    // Road type analysis
    if (summary.includes("highway") || summary.includes("expressway")) {
      score += 15; // Highways are safer in India
    }
    if (summary.includes("ring road") || summary.includes("outer ring")) {
      score += 10; // Ring roads are generally better
    }
    if (summary.includes("old") || summary.includes("village")) {
      score -= 20; // Old/village roads are riskier
    }

    // Traffic density based on speed
    const avgSpeed = distance / duration; // m/s
    if (avgSpeed < 5 && travelMode === "driving") {
      // Very slow traffic
      score -= 15;
    } else if (avgSpeed > 15 && travelMode === "driving") {
      // Good traffic flow
      score += 10;
    }

    // Time-based traffic risk
    const hour = new Date().getHours();
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      score -= 10; // Rush hour traffic
    }
    if (hour >= 22 || hour <= 5) {
      score -= 15; // Night driving risks
    }

    // Mode-specific adjustments
    if (travelMode === "walking" && distance > 2000) {
      score -= 20; // Long walks are riskier
    }
    if (travelMode === "bicycling") {
      score -= 10; // Cycling risks in Indian traffic
    }

    return Math.max(Math.min(score, 100), 20);
  }

  // Calculate time-based risk factors
  private calculateTimeBasedRisk(): number {
    const hour = new Date().getHours();
    const day = new Date().getDay();

    let risk = 20; // Base risk

    // Time of day risk
    if (hour >= 22 || hour <= 5) {
      risk += 40; // High risk late night/early morning
    } else if (hour >= 18 && hour <= 21) {
      risk += 20; // Moderate risk evening
    } else if (hour >= 6 && hour <= 9) {
      risk += 15; // Rush hour risk
    }

    // Day of week risk
    if (day === 0) {
      // Sunday
      risk += 10; // Fewer people around
    } else if (day === 6) {
      // Saturday
      risk += 5; // Weekend risk
    }

    // Festival and special event risks (simplified)
    const month = new Date().getMonth();
    if (month === 9 || month === 10) {
      // Diwali season
      risk += 15;
    }

    return Math.min(risk, 80);
  }

  // Analyze crime patterns specific to Indian context
  private async analyzeCrimePatterns(
    routePoints: { lat: number; lng: number }[],
  ): Promise<number> {
    let score = 85;

    for (const point of routePoints) {
      // Use news analysis for crime data
      const locationScore =
        await newsAnalysisService.getLocationSafetyScore(point);
      score = Math.min(score, locationScore);
    }

    // Area type analysis
    // This would integrate with Indian city databases
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 5) {
      score -= 15; // Night crime risk
    }

    return Math.max(score, 30);
  }

  // Calculate women's safety factors
  private calculateWomenSafety(
    routePoints: { lat: number; lng: number }[],
    timeRisk: number,
  ): number {
    let score = 75; // Base women safety score

    // Time-based adjustments
    score -= timeRisk * 0.5; // Time risk affects women more

    // Area type considerations (simplified)
    // In real implementation, use crowd-sourced women safety data
    const hour = new Date().getHours();
    if (hour >= 20 || hour <= 6) {
      score -= 20; // Night safety concerns
    }

    // Transport mode considerations
    if (this.state.travelMode === "walking") {
      score -= 10; // Walking alone risks
    }

    return Math.max(score, 25);
  }

  // Assess communal safety
  private assessCommunalSafety(
    routePoints: { lat: number; lng: number }[],
  ): number {
    let score = 90; // Generally safe

    // Historical communal tension areas (simplified)
    // In real implementation, use government and NGO data

    // Festival season considerations
    const month = new Date().getMonth();
    if (month === 2 || month === 9) {
      // Holi/Diwali seasons
      score -= 5;
    }

    return Math.max(score, 60);
  }

  // Assess political stability
  private assessPoliticalStability(
    routePoints: { lat: number; lng: number }[],
  ): number {
    let score = 85;

    // Election periods, bandh calls, etc.
    // This would integrate with political calendar APIs

    const day = new Date().getDay();
    if (day === 1) {
      // Mondays often have bandhs
      score -= 10;
    }

    return Math.max(score, 50);
  }

  // Evaluate emergency access
  private evaluateEmergencyAccess(
    routePoints: { lat: number; lng: number }[],
  ): number {
    let score = 70;

    // Distance to hospitals, police stations
    // This would use Google Places API for nearby emergency services

    // Highway access generally better
    score += 15;

    return Math.min(score, 95);
  }

  // Assess infrastructure quality
  private assessInfrastructure(
    route: google.maps.DirectionsRoute,
    travelMode: TravelMode,
  ): number {
    let score = 70;
    const summary = route.summary.toLowerCase();

    if (summary.includes("highway") || summary.includes("expressway")) {
      score += 20;
    }
    if (summary.includes("ring road")) {
      score += 15;
    }
    if (summary.includes("old") || summary.includes("village")) {
      score -= 25;
    }

    // Mode-specific adjustments
    if (travelMode === "walking") {
      score -= 10; // Sidewalk quality varies
    }
    if (travelMode === "bicycling") {
      score -= 15; // Limited cycling infrastructure
    }

    return Math.max(Math.min(score, 95), 30);
  }

  // Analyze crowd density
  private analyzeCrowdDensity(
    routePoints: { lat: number; lng: number }[],
    timeRisk: number,
  ): number {
    let score = 75;

    const hour = new Date().getHours();

    // Rush hour crowding
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      score -= 15;
    }

    // Market areas, business districts (simplified)
    // This would use foot traffic APIs

    return Math.max(score, 40);
  }

  // Assess lighting conditions
  private assessLightingConditions(
    routePoints: { lat: number; lng: number }[],
    timeRisk: number,
  ): number {
    let score = 80;
    const hour = new Date().getHours();

    if (hour >= 19 || hour <= 6) {
      score = 60; // Base night score

      // Highway lighting is generally better
      score += 15;

      // Rural/village areas have poor lighting
      score -= 20;
    }

    return Math.max(score, 30);
  }

  // Calculate overall safety from individual metrics
  private calculateOverallSafety(
    metrics: Omit<SafetyMetrics, "overallSafety">,
  ): number {
    const weights = {
      crimeRate: 0.2,
      newsIncidents: 0.15,
      trafficSafety: 0.15,
      womenSafety: 0.1,
      timeBasedRisk: 0.1,
      communalTension: 0.05,
      politicalStability: 0.05,
      emergencyAccess: 0.08,
      infrastructureQuality: 0.07,
      crowdDensity: 0.03,
      lightingConditions: 0.02,
    };

    let weightedSum = 0;
    Object.entries(metrics).forEach(([key, value]) => {
      const weight = weights[key as keyof typeof weights] || 0;
      weightedSum += value * weight;
    });

    return Math.round(Math.max(Math.min(weightedSum, 100), 20));
  }

  // Calculate segment-wise safety for route coloring
  private async calculateSegmentSafety(
    route: google.maps.DirectionsRoute,
  ): Promise<RouteSegmentSafety[]> {
    const segments: RouteSegmentSafety[] = [];
    const leg = route.legs[0];

    for (let i = 0; i < leg.steps.length; i++) {
      const step = leg.steps[i];
      const midpoint = {
        lat: (step.start_location.lat() + step.end_location.lat()) / 2,
        lng: (step.start_location.lng() + step.end_location.lng()) / 2,
      };

      // Analyze safety for this segment
      const incidents = await newsAnalysisService.getSafetyIncidents(
        midpoint,
        1,
      );
      const locationScore =
        await newsAnalysisService.getLocationSafetyScore(midpoint);

      let segmentScore = locationScore;
      const riskFactors: string[] = [];

      // Adjust based on incidents
      incidents.forEach((incident) => {
        const ageInDays =
          (Date.now() - incident.timestamp.getTime()) / (24 * 60 * 60 * 1000);
        if (ageInDays < 7) {
          segmentScore -= 20;
          riskFactors.push(`Recent ${incident.incidentType}`);
        }
      });

      // Time-based adjustments
      const hour = new Date().getHours();
      if (hour >= 22 || hour <= 5) {
        segmentScore -= 15;
        riskFactors.push("Late night travel");
      }

      segments.push({
        segmentIndex: i,
        safetyScore: Math.max(segmentScore, 20),
        riskFactors,
        color: this.getSafetyColor(segmentScore),
        incidents,
      });
    }

    return segments;
  }

  // Get color based on safety score
  private getSafetyColor(score: number): string {
    if (score >= 80) return "#22c55e"; // Green - Very Safe
    if (score >= 60) return "#eab308"; // Yellow - Moderately Safe
    if (score >= 40) return "#f97316"; // Orange - Risky
    return "#ef4444"; // Red - High Risk
  }

  // Display safety overlay on map
  private displaySafetyOverlay(route: NavigationRoute): void {
    if (!this.map || !route.segmentSafety) return;

    // Clear existing overlays
    this.clearSafetyOverlays();

    route.segmentSafety.forEach((segment, index) => {
      const step = route.steps[segment.segmentIndex];
      if (!step) return;

      // Create a polyline for this segment with safety color
      const segmentPath = [
        new google.maps.LatLng(
          step.start_location.lat,
          step.start_location.lng,
        ),
        new google.maps.LatLng(step.end_location.lat, step.end_location.lng),
      ];

      const polyline = new google.maps.Polyline({
        path: segmentPath,
        strokeColor: segment.color,
        strokeWeight: 8,
        strokeOpacity: 0.7,
        map: this.map,
      });

      // Add click listener for segment details
      polyline.addListener("click", () => {
        this.showSegmentSafetyInfo(segment);
      });

      this.safetyOverlays.push(polyline as any);
    });
  }

  // Display incident markers on map
  private displayIncidentMarkers(route: NavigationRoute): void {
    if (!this.map) return;

    // Clear existing incident markers
    this.clearIncidentMarkers();

    route.segmentSafety?.forEach((segment) => {
      segment.incidents.forEach((incident) => {
        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(
            incident.location.lat,
            incident.location.lng,
          ),
          map: this.map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: this.getIncidentColor(incident.severity),
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          title: incident.title,
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px;">${incident.title}</h3>
              <p style="margin: 0 0 4px 0; font-size: 12px;">${incident.description}</p>
              <p style="margin: 0; font-size: 10px; color: #666;">
                ${incident.timestamp.toLocaleDateString()} - Severity: ${incident.severity}
              </p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(this.map, marker);
        });

        this.incidentMarkers.push(marker);
      });
    });
  }

  // Get incident marker color
  private getIncidentColor(severity: string): string {
    switch (severity) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f97316";
      case "medium":
        return "#eab308";
      case "low":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  }

  // Show segment safety information
  private showSegmentSafetyInfo(segment: RouteSegmentSafety): void {
    const riskText =
      segment.riskFactors.length > 0
        ? segment.riskFactors.join(", ")
        : "No specific risks identified";

    unifiedNotifications.info("Segment Safety Info", {
      message: `Safety Score: ${segment.safetyScore}/100. Risk Factors: ${riskText}`,
    });
  }

  // Clear safety overlays
  private clearSafetyOverlays(): void {
    this.safetyOverlays.forEach((overlay) => {
      overlay.setMap(null);
    });
    this.safetyOverlays = [];
  }

  // Clear incident markers
  private clearIncidentMarkers(): void {
    this.incidentMarkers.forEach((marker) => {
      marker.setMap(null);
    });
    this.incidentMarkers = [];
  }

  // Generate risk warnings
  private generateRiskWarnings(metrics: SafetyMetrics): string[] {
    const warnings: string[] = [];

    if (metrics.crimeRate < 50) {
      warnings.push("High crime rate area - exercise extra caution");
    }
    if (metrics.newsIncidents < 50) {
      warnings.push("Recent safety incidents reported in this area");
    }
    if (metrics.trafficSafety < 50) {
      warnings.push("Poor traffic conditions - drive carefully");
    }
    if (metrics.womenSafety < 50) {
      warnings.push("Women safety concerns - consider alternative route");
    }
    if (metrics.timeBasedRisk < 50) {
      warnings.push("High risk time period - avoid if possible");
    }
    if (metrics.communalTension < 70) {
      warnings.push("Potential communal tensions in the area");
    }
    if (metrics.lightingConditions < 40) {
      warnings.push("Poor lighting conditions - carry flashlight");
    }

    return warnings;
  }

  // Generate safety recommendations
  private generateSafetyRecommendations(
    metrics: SafetyMetrics,
    travelMode: TravelMode,
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations
    recommendations.push("Keep emergency contacts handy");
    recommendations.push("Share your location with trusted contacts");

    // Mode-specific recommendations
    if (travelMode === "walking") {
      recommendations.push("Stick to well-lit, populated areas");
      recommendations.push(
        "Avoid wearing expensive jewelry or using phones openly",
      );
      if (metrics.womenSafety < 60) {
        recommendations.push("Travel in groups when possible");
      }
    } else if (travelMode === "driving") {
      recommendations.push("Keep doors locked and windows up in traffic");
      recommendations.push("Have emergency numbers programmed in your phone");
      if (metrics.trafficSafety < 60) {
        recommendations.push("Maintain extra following distance");
        recommendations.push("Be extra cautious at intersections");
      }
    } else if (travelMode === "bicycling") {
      recommendations.push("Wear bright clothing and use lights");
      recommendations.push("Stay in bike lanes where available");
      recommendations.push("Be extra vigilant in traffic");
    }

    // Time-based recommendations
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 5) {
      recommendations.push("Inform family/friends of your travel plans");
      recommendations.push("Consider postponing travel if not urgent");
    }

    // Area-specific recommendations
    if (metrics.emergencyAccess < 60) {
      recommendations.push("Identify nearby hospitals and police stations");
    }
    if (metrics.infrastructureQuality < 50) {
      recommendations.push("Check your vehicle/equipment before travel");
    }

    return recommendations;
  }

  // Process alternative routes with safety analysis
  private async processAlternativeRoutes(
    routes: google.maps.DirectionsRoute[],
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    travelMode: TravelMode,
  ): Promise<NavigationRoute[]> {
    const alternativeRoutes: NavigationRoute[] = [];

    for (let i = 0; i < Math.min(routes.length, 2); i++) {
      // Limit to 2 alternatives
      const route = routes[i];
      const safetyAnalysis = await this.calculateComprehensiveSafety(
        route,
        travelMode,
      );

      alternativeRoutes.push({
        id: `alt_route_${i}`,
        origin,
        destination,
        travelMode,
        steps: route.legs[0].steps.map((step) => ({
          instruction: step.instructions,
          distance: step.distance!,
          duration: step.duration!,
          start_location: {
            lat: step.start_location.lat(),
            lng: step.start_location.lng(),
          },
          end_location: {
            lat: step.end_location.lat(),
            lng: step.end_location.lng(),
          },
          polyline: step.polyline?.points || "",
        })),
        totalDistance: route.legs[0].distance!,
        totalDuration: route.legs[0].duration!,
        overview_polyline: route.overview_polyline,
        safetyScore: safetyAnalysis.overallSafety,
        safetyMetrics: safetyAnalysis,
        segmentSafety: await this.calculateSegmentSafety(route),
        riskWarnings: this.generateRiskWarnings(safetyAnalysis),
        safetyRecommendations: this.generateSafetyRecommendations(
          safetyAnalysis,
          travelMode,
        ),
      });
    }

    return alternativeRoutes;
  }

  // Helper methods for unified safety analysis integration
  private calculateRouteCenter(points: { lat: number; lng: number }[]): {
    lat: number;
    lng: number;
  } {
    if (points.length === 0) return { lat: 0, lng: 0 };

    const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;

    return { lat: avgLat, lng: avgLng };
  }

  private calculateRouteRadius(points: { lat: number; lng: number }[]): number {
    if (points.length < 2) return 5; // Default 5km radius

    // Calculate the maximum distance from center to any point
    const center = this.calculateRouteCenter(points);
    let maxDistance = 0;

    for (const point of points) {
      const distance = this.calculateDistance(center, point) / 1000; // Convert to km
      maxDistance = Math.max(maxDistance, distance);
    }

    return Math.max(maxDistance * 1.2, 2); // 20% buffer, minimum 2km
  }

  private applyNavigationAdjustments(
    baseMetrics: SafetyMetrics,
    route: google.maps.DirectionsRoute,
    travelMode: TravelMode,
  ): SafetyMetrics {
    const adjustedMetrics = { ...baseMetrics };

    // Navigation-specific traffic safety adjustments
    const summary = route.summary.toLowerCase();
    if (summary.includes("highway") || summary.includes("expressway")) {
      adjustedMetrics.trafficSafety += 10;
      adjustedMetrics.infrastructureQuality += 15;
    }

    // Travel mode specific adjustments
    if (travelMode === "walking") {
      adjustedMetrics.trafficSafety -= 10; // Walking in traffic is riskier
      adjustedMetrics.womenSafety -= 5; // Walking alone adjustments
    } else if (travelMode === "bicycling") {
      adjustedMetrics.trafficSafety -= 15; // Cycling in Indian traffic
      adjustedMetrics.infrastructureQuality -= 10; // Limited cycling infrastructure
    }

    // Time-based navigation adjustments
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 5) {
      adjustedMetrics.overallSafety -= 10;
      adjustedMetrics.womenSafety -= 15;
      adjustedMetrics.lightingConditions -= 20;
    }

    // Ensure all values stay within bounds
    Object.keys(adjustedMetrics).forEach((key) => {
      if (typeof adjustedMetrics[key as keyof SafetyMetrics] === "number") {
        adjustedMetrics[key as keyof SafetyMetrics] = Math.max(
          Math.min(adjustedMetrics[key as keyof SafetyMetrics] as number, 100),
          20,
        ) as any;
      }
    });

    // Recalculate overall safety after adjustments
    adjustedMetrics.overallSafety =
      this.calculateOverallSafetyFromMetrics(adjustedMetrics);

    return adjustedMetrics;
  }

  private calculateOverallSafetyFromMetrics(metrics: SafetyMetrics): number {
    // Enhanced weighting for comprehensive metrics
    const weights = {
      crimeRate: 0.15,
      newsIncidents: 0.12,
      trafficSafety: 0.1,
      womenSafety: 0.08,
      timeBasedRisk: 0.08,
      emergencyAccess: 0.07,
      infrastructureQuality: 0.06,
      policingEffectiveness: 0.05,
      healthSafety: 0.04,
      transportSafety: 0.04,
      economicSafety: 0.03,
      socialSafety: 0.03,
      environmentalSafety: 0.03,
      digitalSafety: 0.02,
      tourismSafety: 0.02,
      communalTension: 0.02,
      politicalStability: 0.02,
      crowdDensity: 0.02,
      lightingConditions: 0.02,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      const value = metrics[key as keyof SafetyMetrics];
      if (typeof value === "number") {
        weightedSum += value * weight;
        totalWeight += weight;
      }
    });

    return Math.round(weightedSum / totalWeight);
  }

  private getFallbackSafetyMetrics(): SafetyMetrics {
    return {
      overallSafety: 75,
      crimeRate: 75,
      newsIncidents: 80,
      trafficSafety: 70,
      womenSafety: 65,
      timeBasedRisk: 75,
      communalTension: 85,
      politicalStability: 80,
      emergencyAccess: 75,
      infrastructureQuality: 70,
      crowdDensity: 75,
      lightingConditions: 70,
      economicSafety: 75,
      tourismSafety: 80,
      transportSafety: 70,
      digitalSafety: 85,
      healthSafety: 75,
      environmentalSafety: 70,
      socialSafety: 80,
      policingEffectiveness: 70,
      lastUpdated: new Date(),
      dataSourceReliability: 60,
      aiConfidenceScore: 50,
      weatherImpact: 85,
      festivalSeasonAdjustment: 0,
    };
  }

  // Override the clear navigation method to clean up safety overlays
  clearNavigation(): void {
    this.state = {
      ...this.state,
      status: "idle",
      currentRoute: null,
      currentStep: 0,
      remainingDistance: 0,
      remainingTime: 0,
      nextTurn: null,
      isTracking: false,
    };

    this.stopLocationTracking();
    this.clearRoute();
    this.clearUserMarker();
    this.clearSafetyOverlays();
    this.clearIncidentMarkers();

    this.notifyCallbacks();
  }
}

export const enhancedNavigationService =
  EnhancedNavigationService.getInstance();
