import { toast } from "sonner";
import RealTimeNavigationService from "./realTimeNavigationService";
import { aiEnhancedNavigation } from "./aiEnhancedNavigation";
import { enhancedLocationService } from "./enhancedLocationService";
import { realTimeSafetyMonitor } from "./realTimeSafetyMonitor";

export interface NavigationMode {
  id: string;
  name: string;
  description: string;
  features: string[];
  icon: string;
}

export const navigationModes: NavigationMode[] = [
  {
    id: "basic",
    name: "Basic Navigation",
    description: "Standard turn-by-turn directions",
    features: ["Turn-by-turn directions", "Route overview", "Distance & time"],
    icon: "🗺️",
  },
  {
    id: "enhanced",
    name: "AI Enhanced",
    description: "AI-powered safety and optimization",
    features: [
      "Safety scoring",
      "Smart rerouting",
      "Threat detection",
      "Weather integration",
    ],
    icon: "🤖",
  },
  {
    id: "realtime",
    name: "Real-Time Navigation",
    description: "Live tracking with advanced features",
    features: [
      "Live location tracking",
      "Voice guidance",
      "Traffic rerouting",
      "Speed monitoring",
      "Lane guidance",
      "Nearby services",
    ],
    icon: "🚀",
  },
];

export class NavigationIntegrationService {
  private static instance: NavigationIntegrationService;
  private currentMode: string = "basic";
  private isActive: boolean = false;
  private listeners: ((data: any) => void)[] = [];

  private constructor() {}

  static getInstance(): NavigationIntegrationService {
    if (!NavigationIntegrationService.instance) {
      NavigationIntegrationService.instance =
        new NavigationIntegrationService();
    }
    return NavigationIntegrationService.instance;
  }

  // Start navigation with specified mode
  async startNavigation(
    mode: string,
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options?: {
      map?: google.maps.Map;
      voiceEnabled?: boolean;
      avoidTolls?: boolean;
      avoidHighways?: boolean;
    },
  ): Promise<boolean> {
    try {
      this.currentMode = mode;
      this.isActive = true;

      console.log(`🚀 Starting ${mode} navigation...`, { origin, destination });

      switch (mode) {
        case "basic":
          return this.startBasicNavigation(origin, destination, options);

        case "enhanced":
          return this.startEnhancedNavigation(origin, destination, options);

        case "realtime":
          return this.startRealTimeNavigation(origin, destination, options);

        default:
          throw new Error(`Unknown navigation mode: ${mode}`);
      }
    } catch (error) {
      console.error(`❌ Failed to start ${mode} navigation:`, error);
      this.isActive = false;
      return false;
    }
  }

  // Basic navigation mode
  private async startBasicNavigation(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options?: any,
  ): Promise<boolean> {
    // Use Google Maps Directions API directly for basic routing
    if (!window.google?.maps?.DirectionsService) {
      toast.error("Google Maps not available");
      return false;
    }

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();

    return new Promise((resolve) => {
      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.WALKING,
        avoidHighways: options?.avoidHighways || false,
        avoidTolls: options?.avoidTolls || false,
      };

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          if (options?.map) {
            directionsRenderer.setMap(options.map);
            directionsRenderer.setDirections(result);
          }

          this.notifyListeners({
            mode: "basic",
            status: "active",
            route: result.routes[0],
            instructions: this.extractBasicInstructions(result.routes[0]),
          });

          toast.success("Basic navigation started");
          resolve(true);
        } else {
          toast.error("Could not calculate route");
          resolve(false);
        }
      });
    });
  }

  // Enhanced AI navigation mode
  private async startEnhancedNavigation(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options?: any,
  ): Promise<boolean> {
    try {
      // Start AI enhanced navigation service
      const route = await aiEnhancedNavigation.startNavigation(
        origin,
        destination,
      );

      if (!route) {
        toast.error("Could not calculate enhanced route");
        return false;
      }

      // Start safety monitoring
      realTimeSafetyMonitor.startMonitoring(origin);

      this.notifyListeners({
        mode: "enhanced",
        status: "active",
        route: route,
        safetyScore: route.overallSafetyScore,
        threats: route.safetyThreats || [],
      });

      toast.success("AI Enhanced navigation started");
      return true;
    } catch (error) {
      console.error("Enhanced navigation failed:", error);
      toast.error("Failed to start enhanced navigation");
      return false;
    }
  }

  // Real-time navigation mode
  private async startRealTimeNavigation(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options?: any,
  ): Promise<boolean> {
    try {
      const navService = RealTimeNavigationService.getInstance();

      // Configure voice settings
      if (options?.voiceEnabled !== undefined) {
        navService.toggleVoice(options.voiceEnabled);
      }

      const success = await navService.startNavigation(
        origin,
        destination,
        options?.map,
      );

      if (success) {
        // Also start enhanced monitoring for comprehensive tracking
        realTimeSafetyMonitor.startMonitoring(origin);

        this.notifyListeners({
          mode: "realtime",
          status: "active",
          service: navService,
        });

        toast.success("Real-time navigation started");
        return true;
      } else {
        toast.error("Could not start real-time navigation");
        return false;
      }
    } catch (error) {
      console.error("Real-time navigation failed:", error);
      toast.error("Failed to start real-time navigation");
      return false;
    }
  }

  // Stop navigation
  stopNavigation(): void {
    if (!this.isActive) return;

    try {
      switch (this.currentMode) {
        case "enhanced":
          aiEnhancedNavigation.stopNavigation();
          realTimeSafetyMonitor.stopMonitoring();
          break;

        case "realtime":
          RealTimeNavigationService.getInstance().stopNavigation();
          realTimeSafetyMonitor.stopMonitoring();
          break;

        case "basic":
          // Basic mode cleanup handled by DirectionsRenderer
          break;
      }

      this.isActive = false;
      this.notifyListeners({
        mode: this.currentMode,
        status: "stopped",
      });

      toast.info(`${this.currentMode} navigation stopped`);
    } catch (error) {
      console.error("Error stopping navigation:", error);
    }
  }

  // Get available navigation modes
  getAvailableModes(): NavigationMode[] {
    return navigationModes;
  }

  // Get current navigation status
  getStatus(): { isActive: boolean; mode: string } {
    return {
      isActive: this.isActive,
      mode: this.currentMode,
    };
  }

  // Extract basic instructions from Google Maps route
  private extractBasicInstructions(route: google.maps.DirectionsRoute): any[] {
    const instructions: any[] = [];

    for (const leg of route.legs) {
      for (const step of leg.steps) {
        instructions.push({
          instruction: step.instructions.replace(/<[^>]*>/g, ""),
          distance: step.distance?.text || "",
          duration: step.duration?.text || "",
          maneuver: step.maneuver || "straight",
        });
      }
    }

    return instructions;
  }

  // Subscribe to navigation updates
  subscribe(listener: (data: any) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(data: any): void {
    this.listeners.forEach((listener) => listener(data));
  }

  // Quick start with mode detection
  async quickStart(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    preferences?: {
      preferSafety?: boolean;
      preferSpeed?: boolean;
      needVoiceGuidance?: boolean;
      hasGoodConnection?: boolean;
    },
  ): Promise<string> {
    // Auto-select best mode based on preferences and capabilities
    let selectedMode = "basic";

    if (preferences?.needVoiceGuidance || preferences?.hasGoodConnection) {
      selectedMode = "realtime";
    } else if (preferences?.preferSafety) {
      selectedMode = "enhanced";
    }

    const success = await this.startNavigation(
      selectedMode,
      origin,
      destination,
      {
        voiceEnabled: preferences?.needVoiceGuidance,
      },
    );

    return success ? selectedMode : "none";
  }

  // Get nearby services during navigation
  async findNearbyServices(
    location: { lat: number; lng: number },
    type:
      | "gas_station"
      | "parking"
      | "electric_vehicle_charging_station"
      | "restaurant"
      | "hospital"
      | "police",
  ): Promise<any[]> {
    if (this.currentMode === "realtime") {
      return RealTimeNavigationService.getInstance().findNearbyServices(
        location,
        type,
      );
    }

    // Fallback implementation for other modes
    return this.basicNearbySearch(location, type);
  }

  // Basic nearby search fallback
  private async basicNearbySearch(
    location: { lat: number; lng: number },
    type: string,
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
        radius: 2000, // 2km radius
        type: type,
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results.slice(0, 3)); // Return top 3 results
        } else {
          resolve([]);
        }
      });
    });
  }

  // Emergency stop with safety prioritization
  emergencyStop(): void {
    this.stopNavigation();

    // Find nearest emergency services
    enhancedLocationService.getCurrentLocation().then((location) => {
      this.findNearbyServices(
        { lat: location.latitude, lng: location.longitude },
        "hospital",
      ).then((hospitals) => {
        if (hospitals.length > 0) {
          toast.error(
            `Navigation stopped. Nearest hospital: ${hospitals[0].name}`,
            {
              duration: 10000,
            },
          );
        }
      });
    });
  }
}

export default NavigationIntegrationService;
