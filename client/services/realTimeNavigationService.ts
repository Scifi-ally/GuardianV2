import { toast } from "sonner";

export interface NavigationStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver: string;
  streetName: string;
  coordinates: { lat: number; lng: number };
  speedLimit?: number;
  laneInfo?: LaneInfo;
}

export interface LaneInfo {
  totalLanes: number;
  recommendedLane: number;
  laneDirections: (
    | "straight"
    | "left"
    | "right"
    | "slight_left"
    | "slight_right"
    | "uturn"
  )[];
}

export interface TrafficInfo {
  severity: "low" | "moderate" | "high" | "severe";
  cause?: string;
  delayMinutes: number;
  alternativeRoute?: boolean;
}

export interface NavigationState {
  isNavigating: boolean;
  currentStep: NavigationStep | null;
  nextStep: NavigationStep | null;
  remainingSteps: NavigationStep[];
  estimatedTimeArrival: Date;
  remainingDistance: string;
  remainingDuration: string;
  currentSpeed: number;
  speedLimit: number;
  trafficInfo: TrafficInfo | null;
  isRerouting: boolean;
  voiceEnabled: boolean;
  compassHeading: number;
}

export class RealTimeNavigationService {
  private static instance: RealTimeNavigationService;
  private state: NavigationState;
  private listeners: ((state: NavigationState) => void)[] = [];
  private watchId: number | null = null;
  private routeUpdateInterval: number | null = null;
  private directionsService: google.maps.DirectionsService | null = null;
  private directionsRenderer: google.maps.DirectionsRenderer | null = null;
  private currentRoute: google.maps.DirectionsRoute | null = null;
  private speechSynthesis: SpeechSynthesis | null = null;
  private lastAnnouncedStep: string | null = null;

  private constructor() {
    this.state = {
      isNavigating: false,
      currentStep: null,
      nextStep: null,
      remainingSteps: [],
      estimatedTimeArrival: new Date(),
      remainingDistance: "",
      remainingDuration: "",
      currentSpeed: 0,
      speedLimit: 50,
      trafficInfo: null,
      isRerouting: false,
      voiceEnabled: true,
      compassHeading: 0,
    };

    this.initializeServices();
  }

  static getInstance(): RealTimeNavigationService {
    if (!RealTimeNavigationService.instance) {
      RealTimeNavigationService.instance = new RealTimeNavigationService();
    }
    return RealTimeNavigationService.instance;
  }

  private initializeServices() {
    if (window.google?.maps) {
      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        suppressInfoWindows: true,
        preserveViewport: false,
        polylineOptions: {
          strokeColor: "#4285F4",
          strokeWeight: 6,
          strokeOpacity: 0.8,
        },
      });

      if ("speechSynthesis" in window) {
        this.speechSynthesis = window.speechSynthesis;
      }

      console.log("✅ Navigation services initialized");
    }
  }

  // Start navigation with real-time tracking
  async startNavigation(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    map?: google.maps.Map,
  ): Promise<boolean> {
    if (!this.directionsService) {
      console.error("❌ Directions service not available");
      return false;
    }

    try {
      console.log("🧭 Starting navigation...", { origin, destination });

      // Get initial route
      const route = await this.getOptimalRoute(origin, destination);
      if (!route) {
        // Unable to find route - silent
        return false;
      }

      this.currentRoute = route;

      // Set up directions renderer on map
      if (map && this.directionsRenderer) {
        this.directionsRenderer.setMap(map);
        this.directionsRenderer.setDirections({
          routes: [route],
        } as google.maps.DirectionsResult);
      }

      // Initialize navigation state
      const steps = this.parseRouteSteps(route);
      this.state = {
        ...this.state,
        isNavigating: true,
        remainingSteps: steps,
        currentStep: steps[0] || null,
        nextStep: steps[1] || null,
        estimatedTimeArrival: new Date(
          Date.now() + route.legs[0].duration!.value * 1000,
        ),
        remainingDistance: route.legs[0].distance!.text,
        remainingDuration: route.legs[0].duration!.text,
      };

      // Start real-time tracking
      this.startLocationTracking();
      this.startRouteMonitoring();

      // Voice announcement
      this.announceStart();

      this.notifyListeners();
      // Navigation started silently

      return true;
    } catch (error) {
      console.error("❌ Failed to start navigation:", error);
      // Failed to start navigation silently
      return false;
    }
  }

  // Get optimal route with traffic data
  private async getOptimalRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    avoidTraffic: boolean = true,
  ): Promise<google.maps.DirectionsRoute | null> {
    if (!this.directionsService) return null;

    return new Promise((resolve) => {
      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
        avoidHighways: false,
        avoidTolls: false,
        alternatives: true,
        optimizeWaypoints: true,
      };

      this.directionsService!.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Get route with best time considering traffic
          const routes = result.routes;
          const bestRoute = routes.reduce((best, current) => {
            const bestDuration =
              best.legs[0]?.duration_in_traffic?.value ||
              best.legs[0]?.duration?.value ||
              Infinity;
            const currentDuration =
              current.legs[0]?.duration_in_traffic?.value ||
              current.legs[0]?.duration?.value ||
              Infinity;
            return currentDuration < bestDuration ? current : best;
          });

          console.log("🗺️ Route found:", {
            distance: bestRoute.legs[0]?.distance?.text,
            duration: bestRoute.legs[0]?.duration?.text,
            durationInTraffic: bestRoute.legs[0]?.duration_in_traffic?.text,
          });

          resolve(bestRoute);
        } else {
          console.error("❌ Directions service failed:", status);
          resolve(null);
        }
      });
    });
  }

  // Parse route steps for navigation
  private parseRouteSteps(
    route: google.maps.DirectionsRoute,
  ): NavigationStep[] {
    const steps: NavigationStep[] = [];

    for (const leg of route.legs) {
      for (const step of leg.steps) {
        steps.push({
          instruction: step.instructions.replace(/<[^>]*>/g, ""), // Remove HTML tags
          distance: step.distance?.text || "",
          duration: step.duration?.text || "",
          maneuver: step.maneuver || "straight",
          streetName: this.extractStreetName(step.instructions),
          coordinates: {
            lat: step.end_location.lat(),
            lng: step.end_location.lng(),
          },
          speedLimit: this.estimateSpeedLimit(step.instructions),
          laneInfo: this.parseLaneInfo(step.instructions),
        });
      }
    }

    return steps;
  }

  // Extract street name from instruction
  private extractStreetName(instruction: string): string {
    const streetMatch = instruction.match(/on\s+(.+?)(?:\s+toward|$)/i);
    if (streetMatch) return streetMatch[1];

    const directionMatch = instruction.match(/Turn\s+\w+\s+onto\s+(.+)/i);
    if (directionMatch) return directionMatch[1];

    return "";
  }

  // Estimate speed limit based on road type
  private estimateSpeedLimit(instruction: string): number {
    if (
      instruction.toLowerCase().includes("highway") ||
      instruction.toLowerCase().includes("freeway")
    ) {
      return 70; // mph
    }
    if (
      instruction.toLowerCase().includes("boulevard") ||
      instruction.toLowerCase().includes("avenue")
    ) {
      return 45;
    }
    return 35; // Default city street
  }

  // Parse lane information
  private parseLaneInfo(instruction: string): LaneInfo | undefined {
    // This would be enhanced with real Google Maps lane data
    const leftTurn = instruction.toLowerCase().includes("turn left");
    const rightTurn = instruction.toLowerCase().includes("turn right");

    if (leftTurn || rightTurn) {
      return {
        totalLanes: 3,
        recommendedLane: leftTurn ? 1 : 3,
        laneDirections: leftTurn
          ? ["left", "straight", "straight"]
          : ["straight", "straight", "right"],
      };
    }

    return undefined;
  }

  // Start real-time location tracking
  private startLocationTracking() {
    if (!navigator.geolocation) {
      console.warn("⚠️ Geolocation not supported");
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.updateLocation(position);
      },
      (error) => {
        console.warn("⚠️ Location tracking error:", error);
      },
      options,
    );

    // Also track device orientation for compass
    if ("DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", (event) => {
        if (event.alpha !== null) {
          this.state.compassHeading = event.alpha;
          this.notifyListeners();
        }
      });
    }
  }

  // Update location and check progress
  private updateLocation(position: GeolocationPosition) {
    const currentPos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    // Update current speed
    if (position.coords.speed !== null) {
      this.state.currentSpeed = position.coords.speed * 2.237; // m/s to mph
    }

    // Check if we've reached the next step
    this.checkStepProgress(currentPos);

    // Check for speed limit violations
    this.checkSpeedLimit();

    this.notifyListeners();
  }

  // Check progress against current step
  private checkStepProgress(currentPos: { lat: number; lng: number }) {
    if (!this.state.currentStep) return;

    const distance = this.calculateDistance(
      currentPos,
      this.state.currentStep.coordinates,
    );

    // If within 50 meters of step completion
    if (distance < 0.05) {
      // 50 meters in km
      this.advanceToNextStep();
    }
  }

  // Advance to next navigation step
  private advanceToNextStep() {
    if (this.state.remainingSteps.length <= 1) {
      this.finishNavigation();
      return;
    }

    const newSteps = this.state.remainingSteps.slice(1);
    this.state = {
      ...this.state,
      remainingSteps: newSteps,
      currentStep: newSteps[0] || null,
      nextStep: newSteps[1] || null,
    };

    // Voice announcement for next step
    if (this.state.currentStep) {
      this.announceStep(this.state.currentStep);
    }

    this.notifyListeners();
  }

  // Start monitoring route for traffic and rerouting
  private startRouteMonitoring() {
    this.routeUpdateInterval = window.setInterval(() => {
      this.checkForRerouting();
      this.updateTrafficInfo();
    }, 30000); // Check every 30 seconds
  }

  // Check if rerouting is beneficial
  private async checkForRerouting() {
    if (!this.state.isNavigating || !this.currentRoute) return;

    // Get current position
    navigator.geolocation.getCurrentPosition(async (position) => {
      const currentPos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const destination = {
        lat: this.currentRoute!.legs[0].end_location.lat(),
        lng: this.currentRoute!.legs[0].end_location.lng(),
      };

      // Get new route from current position
      const newRoute = await this.getOptimalRoute(currentPos, destination);

      if (newRoute && this.currentRoute) {
        const currentDuration =
          this.currentRoute.legs[0]?.duration_in_traffic?.value ||
          this.currentRoute.legs[0]?.duration?.value ||
          0;
        const newDuration =
          newRoute.legs[0]?.duration_in_traffic?.value ||
          newRoute.legs[0]?.duration?.value ||
          0;

        // If new route saves more than 5 minutes
        if (currentDuration - newDuration > 300) {
          this.suggestReroute(
            newRoute,
            Math.floor((currentDuration - newDuration) / 60),
          );
        }
      }
    });
  }

  // Suggest rerouting to user
  private suggestReroute(
    newRoute: google.maps.DirectionsRoute,
    savedMinutes: number,
  ) {
    this.state.isRerouting = true;
    this.notifyListeners();

    // Faster route found - silent
  }

  // Accept rerouting
  private acceptReroute(newRoute: google.maps.DirectionsRoute) {
    this.currentRoute = newRoute;
    const steps = this.parseRouteSteps(newRoute);

    this.state = {
      ...this.state,
      remainingSteps: steps,
      currentStep: steps[0] || null,
      nextStep: steps[1] || null,
      isRerouting: false,
      estimatedTimeArrival: new Date(
        Date.now() + newRoute.legs[0].duration!.value * 1000,
      ),
      remainingDistance: newRoute.legs[0].distance!.text,
      remainingDuration: newRoute.legs[0].duration!.text,
    };

    // Update map display
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({
        routes: [newRoute],
      } as google.maps.DirectionsResult);
    }

    this.announceReroute();
    this.notifyListeners();
  }

  // Update traffic information
  private updateTrafficInfo() {
    // This would integrate with real traffic APIs
    // For now, simulate traffic detection
    const trafficLevels = ["low", "moderate", "high", "severe"] as const;
    const randomLevel =
      trafficLevels[Math.floor(Math.random() * trafficLevels.length)];

    if (randomLevel === "high" || randomLevel === "severe") {
      this.state.trafficInfo = {
        severity: randomLevel,
        cause: "Heavy traffic ahead",
        delayMinutes: randomLevel === "severe" ? 15 : 8,
        alternativeRoute: true,
      };
    } else {
      this.state.trafficInfo = null;
    }
  }

  // Check speed limit violations
  private checkSpeedLimit() {
    if (this.state.currentSpeed > this.state.speedLimit + 5) {
      // Speed limit warning
      if (this.state.voiceEnabled) {
        this.speak("Speed limit exceeded", false);
      }
    }
  }

  // Voice announcements
  private announceStart() {
    if (!this.state.voiceEnabled || !this.state.currentStep) return;
    this.speak(`Navigation started. ${this.state.currentStep.instruction}`);
  }

  private announceStep(step: NavigationStep) {
    if (!this.state.voiceEnabled) return;

    // Avoid repeating the same instruction
    if (this.lastAnnouncedStep === step.instruction) return;

    this.lastAnnouncedStep = step.instruction;
    this.speak(step.instruction);
  }

  private announceReroute() {
    if (!this.state.voiceEnabled) return;
    this.speak("Route updated. Following new path.");
  }

  private speak(text: string, addDistance: boolean = true) {
    if (!this.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    this.speechSynthesis.speak(utterance);
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(
    pos1: { lat: number; lng: number },
    pos2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(pos2.lat - pos1.lat);
    const dLng = this.toRad(pos2.lng - pos1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(pos1.lat)) *
        Math.cos(this.toRad(pos2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Finish navigation
  private finishNavigation() {
    this.state.isNavigating = false;
    this.state.currentStep = null;
    this.state.nextStep = null;
    this.state.remainingSteps = [];

    if (this.state.voiceEnabled) {
      this.speak("You have arrived at your destination");
    }

    this.stopTracking();
    this.notifyListeners();
    // You have arrived silently
  }

  // Stop navigation
  stopNavigation() {
    this.state.isNavigating = false;
    this.stopTracking();
    this.notifyListeners();

    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
    }

    // Navigation stopped silently
  }

  // Stop all tracking
  private stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.routeUpdateInterval !== null) {
      clearInterval(this.routeUpdateInterval);
      this.routeUpdateInterval = null;
    }
  }

  // Toggle voice guidance
  toggleVoice(enabled: boolean) {
    this.state.voiceEnabled = enabled;
    this.notifyListeners();
  }

  // Get current navigation state
  getState(): NavigationState {
    return { ...this.state };
  }

  // Subscribe to state changes
  subscribe(listener: (state: NavigationState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  // Find nearby services (gas, parking, etc.)
  async findNearbyServices(
    location: { lat: number; lng: number },
    type:
      | "gas_station"
      | "parking"
      | "electric_vehicle_charging_station"
      | "restaurant",
  ): Promise<any[]> {
    if (!window.google?.maps?.places) {
      console.warn("⚠️ Places service not available");
      return [];
    }

    return new Promise((resolve) => {
      const map = new google.maps.Map(document.createElement("div"));
      const service = new google.maps.places.PlacesService(map);

      const request = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: 5000, // 5km radius
        type: type,
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results.slice(0, 5)); // Return top 5 results
        } else {
          resolve([]);
        }
      });
    });
  }
}

export default RealTimeNavigationService;
