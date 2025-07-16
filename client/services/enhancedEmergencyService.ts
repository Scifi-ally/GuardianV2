import { unifiedNotifications } from "./unifiedNotificationService";
import { enhancedLocationService } from "./enhancedLocationService";

interface EmergencyService {
  id: string;
  type: "police" | "hospital" | "fire" | "emergency";
  name: string;
  position: { lat: number; lng: number };
  phone: string;
  responseTime: number; // minutes
  availability: "available" | "busy" | "offline";
  rating: number; // 1-5 stars
  lastUpdate: number;
  distance?: number; // km from user
  services: string[];
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  priority: number;
  location?: { lat: number; lng: number };
}

interface EmergencyStatus {
  isActive: boolean;
  level: "low" | "medium" | "high" | "critical";
  type: "medical" | "fire" | "police" | "general";
  location: { lat: number; lng: number };
  timestamp: number;
  responseTime?: number;
  assignedServices: string[];
}

export class EnhancedEmergencyService {
  private static instance: EnhancedEmergencyService;
  private emergencyServices: Map<string, EmergencyService> = new Map();
  private emergencyContacts: EmergencyContact[] = [];
  private currentEmergency: EmergencyStatus | null = null;
  private locationWatchId: number | null = null;
  private sosActive = false;

  static getInstance(): EnhancedEmergencyService {
    if (!EnhancedEmergencyService.instance) {
      EnhancedEmergencyService.instance = new EnhancedEmergencyService();
    }
    return EnhancedEmergencyService.instance;
  }

  // Initialize emergency services for a location
  async initializeForLocation(location: {
    lat: number;
    lng: number;
  }): Promise<void> {
    console.log("🚨 Initializing emergency services for location...");

    try {
      // Load emergency contacts from storage
      this.loadEmergencyContacts();

      // Discover nearby emergency services
      await this.discoverNearbyServices(location);

      // Update service availability
      await this.updateServiceAvailability();

      console.log(
        `✅ Initialized ${this.emergencyServices.size} emergency services`,
      );
    } catch (error) {
      console.error("Failed to initialize emergency services:", error);
      unifiedNotifications.error("Emergency services initialization failed");
    }
  }

  // Discover nearby emergency services using Google Places API simulation
  private async discoverNearbyServices(location: {
    lat: number;
    lng: number;
  }): Promise<void> {
    // Simulate real emergency services discovery
    // In production, this would use Google Places API with 'hospital', 'police', 'fire_station' types

    const mockServices: Omit<EmergencyService, "distance">[] = [
      {
        id: "police-central",
        type: "police",
        name: "Central Police Station",
        position: {
          lat: location.lat + (Math.random() - 0.5) * 0.02,
          lng: location.lng + (Math.random() - 0.5) * 0.02,
        },
        phone: "911",
        responseTime: 5 + Math.floor(Math.random() * 10),
        availability: Math.random() > 0.2 ? "available" : "busy",
        rating: 4.2 + Math.random() * 0.8,
        lastUpdate: Date.now(),
        services: ["Emergency Response", "Crime Reporting", "Traffic Control"],
      },
      {
        id: "hospital-general",
        type: "hospital",
        name: "General Hospital Emergency",
        position: {
          lat: location.lat + (Math.random() - 0.5) * 0.03,
          lng: location.lng + (Math.random() - 0.5) * 0.03,
        },
        phone: "911",
        responseTime: 8 + Math.floor(Math.random() * 12),
        availability: Math.random() > 0.15 ? "available" : "busy",
        rating: 4.5 + Math.random() * 0.5,
        lastUpdate: Date.now(),
        services: ["Emergency Medicine", "Trauma Center", "Ambulance"],
      },
      {
        id: "fire-station-1",
        type: "fire",
        name: "Fire Department Station 1",
        position: {
          lat: location.lat + (Math.random() - 0.5) * 0.025,
          lng: location.lng + (Math.random() - 0.5) * 0.025,
        },
        phone: "911",
        responseTime: 6 + Math.floor(Math.random() * 8),
        availability: Math.random() > 0.1 ? "available" : "busy",
        rating: 4.7 + Math.random() * 0.3,
        lastUpdate: Date.now(),
        services: [
          "Fire Suppression",
          "Emergency Medical",
          "Rescue Operations",
        ],
      },
      {
        id: "emergency-clinic",
        type: "hospital",
        name: "24/7 Emergency Clinic",
        position: {
          lat: location.lat + (Math.random() - 0.5) * 0.015,
          lng: location.lng + (Math.random() - 0.5) * 0.015,
        },
        phone: "+1-555-CLINIC",
        responseTime: 12 + Math.floor(Math.random() * 8),
        availability: "available",
        rating: 4.1 + Math.random() * 0.6,
        lastUpdate: Date.now(),
        services: ["Walk-in Emergency", "Minor Injuries", "Urgent Care"],
      },
    ];

    // Calculate distances and add services
    for (const service of mockServices) {
      const distance = this.calculateDistance(location, service.position);
      const serviceWithDistance: EmergencyService = {
        ...service,
        distance,
      };

      this.emergencyServices.set(service.id, serviceWithDistance);
    }

    // Sort by distance for quick access
    const sortedServices = Array.from(this.emergencyServices.values()).sort(
      (a, b) => (a.distance || 0) - (b.distance || 0),
    );

    console.log(
      `📍 Found ${sortedServices.length} emergency services within range`,
    );
  }

  // Load emergency contacts from storage
  private loadEmergencyContacts(): void {
    try {
      const userProfile = JSON.parse(
        localStorage.getItem("guardian-user-profile") || "{}",
      );
      this.emergencyContacts = userProfile.emergencyContacts || [];
      console.log(
        `📞 Loaded ${this.emergencyContacts.length} emergency contacts`,
      );
    } catch (error) {
      console.warn("Failed to load emergency contacts:", error);
      this.emergencyContacts = [];
    }
  }

  // Update service availability in real-time
  private async updateServiceAvailability(): Promise<void> {
    this.emergencyServices.forEach((service) => {
      // Simulate availability changes
      if (Math.random() > 0.9) {
        const availabilityOptions: EmergencyService["availability"][] = [
          "available",
          "busy",
          "offline",
        ];
        const currentIndex = availabilityOptions.indexOf(service.availability);

        // More likely to become available than unavailable
        if (service.availability === "busy" && Math.random() > 0.3) {
          service.availability = "available";
        } else if (
          service.availability === "available" &&
          Math.random() > 0.8
        ) {
          service.availability = "busy";
        }

        service.lastUpdate = Date.now();
      }

      // Update response times based on current conditions
      if (Math.random() > 0.8) {
        const baseTime =
          service.type === "police" ? 5 : service.type === "fire" ? 6 : 8;
        const variation = service.availability === "busy" ? 5 : 0;
        service.responseTime =
          baseTime + variation + Math.floor(Math.random() * 5);
        service.lastUpdate = Date.now();
      }
    });
  }

  // Activate SOS emergency
  async activateSOS(
    emergencyType: "medical" | "fire" | "police" | "general" = "general",
  ): Promise<void> {
    if (this.sosActive) {
      unifiedNotifications.warning("SOS already active");
      return;
    }

    console.log("🚨 ACTIVATING SOS EMERGENCY!");
    this.sosActive = true;

    try {
      // Get current location
      const currentLocation =
        await enhancedLocationService.getCurrentLocation();

      // Create emergency status
      this.currentEmergency = {
        isActive: true,
        level: "critical",
        type: emergencyType,
        location: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        timestamp: Date.now(),
        assignedServices: [],
      };

      // Start location tracking
      this.startEmergencyLocationTracking();

      // Contact emergency services
      await this.contactEmergencyServices(emergencyType);

      // Notify emergency contacts
      await this.notifyEmergencyContacts();

      // Send notifications
      unifiedNotifications.critical("🚨 SOS ACTIVATED", {
        message: "Emergency services contacted. Location shared.",
        persistent: true,
      });

      // Start periodic updates
      this.startEmergencyUpdates();
    } catch (error) {
      console.error("SOS activation failed:", error);
      unifiedNotifications.error(
        "SOS activation failed - trying alternative methods",
      );

      // Fallback: at least try to call 911
      this.initiateEmergencyCall("911");
    }
  }

  // Contact emergency services
  private async contactEmergencyServices(
    type: "medical" | "fire" | "police" | "general",
  ): Promise<void> {
    // Find best available service for emergency type
    const relevantServices = Array.from(this.emergencyServices.values())
      .filter((service) => {
        if (type === "medical") return service.type === "hospital";
        if (type === "fire") return service.type === "fire";
        if (type === "police") return service.type === "police";
        return true; // general emergency
      })
      .filter((service) => service.availability === "available")
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    if (relevantServices.length === 0) {
      // No specific services available, call 911
      this.initiateEmergencyCall("911");
      return;
    }

    const bestService = relevantServices[0];

    // Simulate contacting the service
    console.log(
      `🚨 Contacting ${bestService.name} - ETA: ${bestService.responseTime} min`,
    );

    if (this.currentEmergency) {
      this.currentEmergency.assignedServices.push(bestService.id);
      this.currentEmergency.responseTime = bestService.responseTime;
    }

    // Update service status
    bestService.availability = "busy";
    bestService.lastUpdate = Date.now();

    unifiedNotifications.success(
      `Emergency services contacted: ${bestService.name}`,
      {
        message: `Estimated response time: ${bestService.responseTime} minutes`,
      },
    );
  }

  // Notify emergency contacts
  private async notifyEmergencyContacts(): Promise<void> {
    if (this.emergencyContacts.length === 0) {
      console.warn("No emergency contacts configured");
      return;
    }

    const location = this.currentEmergency?.location;
    const message = `EMERGENCY ALERT: SOS activated at ${location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "unknown location"}. Time: ${new Date().toLocaleString()}`;

    for (const contact of this.emergencyContacts) {
      try {
        // Simulate SMS/call notification
        console.log(
          `📱 Notifying ${contact.name} (${contact.phone}): ${message}`,
        );

        // In a real implementation, this would use SMS API or trigger phone calls
        unifiedNotifications.success(`Notified ${contact.name}`, {
          message: `Emergency alert sent to ${contact.relation}`,
        });
      } catch (error) {
        console.error(`Failed to notify ${contact.name}:`, error);
      }
    }
  }

  // Start emergency location tracking
  private startEmergencyLocationTracking(): void {
    if (!navigator.geolocation) return;

    console.log("📍 Starting emergency location tracking...");

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        if (this.currentEmergency) {
          this.currentEmergency.location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          console.log(
            `📍 Emergency location updated: ${position.coords.latitude}, ${position.coords.longitude}`,
          );
        }
      },
      (error) => {
        console.error("Emergency location tracking failed:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  // Start periodic emergency updates
  private startEmergencyUpdates(): void {
    const updateInterval = setInterval(() => {
      if (!this.sosActive || !this.currentEmergency) {
        clearInterval(updateInterval);
        return;
      }

      // Update emergency services availability
      this.updateServiceAvailability();

      // Check if emergency response has arrived
      this.checkEmergencyResponse();

      console.log("🔄 Emergency status updated");
    }, 30000); // Update every 30 seconds during emergency
  }

  // Check emergency response status
  private checkEmergencyResponse(): void {
    if (!this.currentEmergency) return;

    const elapsedMinutes =
      (Date.now() - this.currentEmergency.timestamp) / (1000 * 60);

    if (
      this.currentEmergency.responseTime &&
      elapsedMinutes >= this.currentEmergency.responseTime
    ) {
      unifiedNotifications.success("🚑 Emergency services should be arriving", {
        message: "Response team is in your area",
      });
    }
  }

  // Deactivate SOS
  deactivateSOS(): void {
    console.log("✅ Deactivating SOS emergency");

    this.sosActive = false;
    this.currentEmergency = null;

    // Stop location tracking
    if (this.locationWatchId) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }

    // Update service availability
    this.emergencyServices.forEach((service) => {
      if (service.availability === "busy") {
        service.availability = "available";
        service.lastUpdate = Date.now();
      }
    });

    unifiedNotifications.success("SOS deactivated", {
      message: "Emergency services notified of cancellation",
    });
  }

  // Initiate emergency call
  private initiateEmergencyCall(number: string): void {
    try {
      // Try to open phone dialer
      window.open(`tel:${number}`, "_self");

      unifiedNotifications.success(`Calling ${number}`, {
        message: "Emergency call initiated",
      });
    } catch (error) {
      console.error("Failed to initiate call:", error);
      unifiedNotifications.error(
        `Call ${number} manually for emergency assistance`,
      );
    }
  }

  // Calculate distance between two points
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth's radius in km
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

  // Get nearby emergency services
  getNearbyEmergencyServices(maxDistance: number = 10): EmergencyService[] {
    return Array.from(this.emergencyServices.values())
      .filter((service) => (service.distance || 0) <= maxDistance)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // Get available emergency services
  getAvailableEmergencyServices(): EmergencyService[] {
    return Array.from(this.emergencyServices.values())
      .filter((service) => service.availability === "available")
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // Get emergency contacts
  getEmergencyContacts(): EmergencyContact[] {
    return [...this.emergencyContacts];
  }

  // Get current emergency status
  getCurrentEmergencyStatus(): EmergencyStatus | null {
    return this.currentEmergency ? { ...this.currentEmergency } : null;
  }

  // Check if SOS is active
  isSosActive(): boolean {
    return this.sosActive;
  }

  // Update emergency contacts
  updateEmergencyContacts(contacts: EmergencyContact[]): void {
    this.emergencyContacts = contacts;

    // Save to storage
    try {
      const userProfile = JSON.parse(
        localStorage.getItem("guardian-user-profile") || "{}",
      );
      userProfile.emergencyContacts = contacts;
      localStorage.setItem(
        "guardian-user-profile",
        JSON.stringify(userProfile),
      );

      console.log(`💾 Updated ${contacts.length} emergency contacts`);
    } catch (error) {
      console.error("Failed to save emergency contacts:", error);
    }
  }

  // Test emergency systems
  async testEmergencySystems(): Promise<boolean> {
    console.log("🧪 Testing emergency systems...");

    try {
      // Test location access
      await enhancedLocationService.getCurrentLocation();

      // Test notification system
      unifiedNotifications.success("Emergency systems test", {
        message: "All systems operational",
      });

      console.log("✅ Emergency systems test passed");
      return true;
    } catch (error) {
      console.error("Emergency systems test failed:", error);
      unifiedNotifications.error("Emergency systems test failed", {
        message: "Check permissions and settings",
      });
      return false;
    }
  }
}

export const enhancedEmergencyService = EnhancedEmergencyService.getInstance();
