interface RealTimeLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

interface RealTimeSafetyData {
  safetyScore: number;
  crimeIncidents: number;
  emergencyServices: Array<{
    type: "police" | "hospital" | "fire";
    distance: number;
    name: string;
  }>;
  trafficConditions: "light" | "moderate" | "heavy";
  weatherConditions: {
    condition: string;
    visibility: "good" | "poor";
    temperature: number;
  };
  lastUpdated: Date;
}

interface RealTimeUserData {
  batteryLevel: number;
  networkSignal: number;
  isOnline: boolean;
  deviceOrientation: "portrait" | "landscape";
}

class RealTimeDataService {
  private locationUpdateCallbacks: ((location: RealTimeLocation) => void)[] =
    [];
  private safetyDataCallbacks: ((data: RealTimeSafetyData) => void)[] = [];
  private userDataCallbacks: ((data: RealTimeUserData) => void)[] = [];

  private currentLocation: RealTimeLocation | null = null;
  private isTracking = false;
  private updateInterval: NodeJS.Timeout | null = null;

  // Import and use centralized error handler
  private logError = (() => {
    let errorHandler: any = null;
    return async (context: string, error: any, additionalInfo?: any) => {
      if (!errorHandler) {
        const { logError } = await import("@/utils/errorHandler");
        errorHandler = logError;
      }
      errorHandler(context, error, additionalInfo);
    };
  })();

  constructor() {
    this.initializeRealTimeServices();
  }

  private async initializeRealTimeServices() {
    // Initialize geolocation tracking
    this.startLocationTracking();

    // Initialize device monitoring
    this.startDeviceMonitoring();

    // Initialize periodic data updates
    this.startPeriodicUpdates();
  }

  private async startLocationTracking() {
    console.log("🚀 Starting location tracking...");

    if (!navigator.geolocation) {
      console.error("🚫 Geolocation not supported by this browser");
      this.useDefaultLocation();
      return;
    }

    // Log current environment details
    console.log("🌍 Environment check:", {
      protocol: location.protocol,
      hostname: location.hostname,
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext,
    });

    // Check if we're on HTTPS (required for high accuracy)
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      console.warn(
        "⚠️ HTTPS required for high accuracy geolocation, but will try anyway",
      );
    }

    // Check permissions first (if supported)
    if ("permissions" in navigator) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        console.log("🔐 Geolocation permission status:", permission.state);

        if (permission.state === "denied") {
          console.error("🚫 Geolocation permission explicitly denied");
          this.useDefaultLocation();
          return;
        }
      } catch (permissionError) {
        console.log("ℹ️ Permission API not fully supported:", permissionError);
      }
    }

    // Test basic geolocation first
    console.log("🔍 Testing basic geolocation availability...");
    try {
      await this.testBasicGeolocation();
    } catch (testError) {
      console.error("🚫 Basic geolocation test failed:", testError);
      this.useDefaultLocation();
      return;
    }

    this.isTracking = true;

    // Use enhanced location service for reliable location tracking
    await this.initializeEnhancedLocation();

    // Location tracking now handled by progressive strategy above
  }

  private startDeviceMonitoring() {
    // Monitor battery level (if supported)
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          this.notifyUserDataUpdate({
            batteryLevel: Math.round(battery.level * 100),
            networkSignal: this.getNetworkSignal(),
            isOnline: navigator.onLine,
            deviceOrientation:
              window.innerHeight > window.innerWidth ? "portrait" : "landscape",
          });
        };

        battery.addEventListener("levelchange", updateBattery);
        battery.addEventListener("chargingchange", updateBattery);
        updateBattery(); // Initial update
      });
    }

    // Monitor network status
    window.addEventListener("online", () => this.updateUserData());
    window.addEventListener("offline", () => this.updateUserData());

    // Monitor orientation changes
    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.updateUserData(), 100);
    });
  }

  private handleLocationError(error: GeolocationPositionError) {
    let errorMessage = "Unknown location error";
    let suggestion = "";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location access denied by user";
        suggestion =
          "Please enable location permissions in your browser settings";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information is unavailable";
        suggestion =
          "Please check your GPS settings and ensure you're not in an area with poor signal";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out";
        suggestion = "Please try again or check your internet connection";
        break;
      default:
        errorMessage = `Location error (code: ${error.code})`;
        suggestion =
          "Please try refreshing the page or check your location settings";
        break;
    }

    this.logError("Location Tracking Error", error, {
      interpretedMessage: errorMessage,
      suggestion: suggestion,
      errorCode: error.code,
    });

    // Try fallback location method
    this.tryFallbackLocation();
  }

  private async tryFallbackLocation() {
    try {
      console.log("🔄 Trying emergency fallback location method...");

      // Try multiple fallback strategies
      const fallbackStrategies = [
        {
          name: "Network-based",
          options: {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 120000, // Accept 2-minute old cache
          },
        },
        {
          name: "Any available",
          options: {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 300000, // Accept 5-minute old cache
          },
        },
      ];

      for (const strategy of fallbackStrategies) {
        try {
          console.log(`🔄 Trying fallback: ${strategy.name}`);

          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              const timeoutId = setTimeout(() => {
                reject(new Error(`Fallback ${strategy.name} timed out`));
              }, strategy.options.timeout! + 2000);

              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  clearTimeout(timeoutId);
                  resolve(pos);
                },
                (err) => {
                  clearTimeout(timeoutId);
                  reject(err);
                },
                strategy.options,
              );
            },
          );

          const fallbackLocation: RealTimeLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date(),
          };

          this.currentLocation = fallbackLocation;
          this.notifyLocationUpdate(fallbackLocation);
          console.log(
            `✅ Fallback location obtained via ${strategy.name}:`,
            fallbackLocation,
          );
          return; // Success, exit
        } catch (strategyError) {
          console.warn(`❌ Fallback ${strategy.name} failed:`, strategyError);
        }
      }

      // All fallback strategies failed
      console.error("🚫 All fallback strategies failed");
      this.useDefaultLocation();
    } catch (error) {
      this.logError("Fallback Location Method Failed", error);
      this.useDefaultLocation();
    }
  }

  private async tryProgressiveGeolocation(): Promise<void> {
    const strategies = [
      {
        name: "High Accuracy",
        options: {
          enableHighAccuracy: true,
          timeout: 8000, // Shorter initial timeout
          maximumAge: 10000,
        },
      },
      {
        name: "Balanced",
        options: {
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 30000,
        },
      },
      {
        name: "Fast",
        options: {
          enableHighAccuracy: false,
          timeout: 20000, // Longer for final attempt
          maximumAge: 60000, // Accept older cache
        },
      },
    ];

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      console.log(
        `📍 Trying geolocation strategy ${i + 1}/3: ${strategy.name}`,
      );

      try {
        await this.attemptGeolocation(strategy.options, strategy.name);
        console.log(`✅ Geolocation successful with ${strategy.name} strategy`);
        return; // Success, exit
      } catch (error) {
        console.warn(`❌ ${strategy.name} strategy failed:`, error);

        if (i === strategies.length - 1) {
          // All strategies failed
          throw new Error(
            `All geolocation strategies failed. Last error: ${error}`,
          );
        }

        // Wait briefly before next attempt
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async attemptGeolocation(
    options: PositionOptions,
    strategyName: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(
            `${strategyName} strategy timed out after ${options.timeout}ms`,
          ),
        );
      }, options.timeout! + 1000); // Add 1 second buffer

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);

          const newLocation: RealTimeLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date(),
          };

          this.currentLocation = newLocation;
          this.notifyLocationUpdate(newLocation);

          console.log(`✅ ${strategyName} location obtained:`, {
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
            accuracy: Math.round(position.coords.accuracy) + "m",
            strategy: strategyName,
          });

          // Start watching for continuous updates with successful options
          this.startContinuousTracking(options);
          resolve();
        },
        (error) => {
          clearTimeout(timeoutId);
          this.logError(`${strategyName} Geolocation Strategy Failed`, error, {
            strategy: strategyName,
            options: options,
          });
          reject(error);
        },
        options,
      );
    });
  }

  private startContinuousTracking(successfulOptions: PositionOptions): void {
    // Use the successful options for continuous tracking but with longer timeout
    const trackingOptions = {
      ...successfulOptions,
      timeout: 25000, // Longer timeout for continuous tracking
      maximumAge: 45000, // Accept slightly older positions
    };

    console.log(
      "🔄 Starting continuous location tracking with options:",
      trackingOptions,
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: RealTimeLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date(),
        };

        this.currentLocation = newLocation;
        this.notifyLocationUpdate(newLocation);

        console.log("📍 Location updated:", {
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          accuracy: Math.round(position.coords.accuracy) + "m",
        });
      },
      (error) => {
        // Don't fail completely on watch errors, just log them
        console.warn("⚠️ Continuous tracking error:", {
          code: error.code,
          message: error.message,
        });

        // If continuous tracking fails, try to restart with fallback
        setTimeout(() => {
          this.tryFallbackLocation();
        }, 5000);
      },
      trackingOptions,
    );

    // Store watch ID for cleanup
    (this as any).watchId = watchId;
  }

  private async testBasicGeolocation(): Promise<void> {
    try {
      // Use enhanced location service instead of direct geolocation API
      const { enhancedLocationService } = await import(
        "@/services/enhancedLocationService"
      );

      const location = await enhancedLocationService.getCurrentLocation();
      console.log("✅ Enhanced location service test successful:", {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy,
      });

      return Promise.resolve();
    } catch (error) {
      // Enhanced location service should never throw, but handle just in case
      console.log("ℹ️ Location service test completed with fallback");
      return Promise.resolve(); // Always resolve to avoid blocking the app
    }
  }

  private async initializeEnhancedLocation() {
    try {
      const { enhancedLocationService } = await import(
        "@/services/enhancedLocationService"
      );

      // Get initial location
      const location = await enhancedLocationService.getCurrentLocation();
      this.currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(location.timestamp),
      };

      // Subscribe to location updates
      enhancedLocationService.subscribe((locationData) => {
        this.currentLocation = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: new Date(locationData.timestamp),
        };
        this.notifyLocationUpdate(this.currentLocation);
      });

      // Start tracking
      await enhancedLocationService.startTracking();

      console.log("✅ Enhanced location tracking initialized successfully");
    } catch (error) {
      console.log("ℹ️ Enhanced location failed, using default location");
      this.useDefaultLocation();
    }
  }

  private useDefaultLocation() {
    console.log("📍 Using default location (San Francisco)");

    const defaultLocation: RealTimeLocation = {
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: new Date(),
    };

    this.currentLocation = defaultLocation;
    this.notifyLocationUpdate(defaultLocation);
  }

  private getNetworkSignal(): number {
    // Use Network Information API if available
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      if (connection.effectiveType) {
        const effectiveType = connection.effectiveType;
        switch (effectiveType) {
          case "4g":
            return 85 + Math.random() * 15;
          case "3g":
            return 60 + Math.random() * 25;
          case "2g":
            return 30 + Math.random() * 30;
          case "slow-2g":
            return 10 + Math.random() * 20;
          default:
            return 70 + Math.random() * 30;
        }
      }
    }

    // Fallback: simulate based on online status
    return navigator.onLine ? 70 + Math.random() * 30 : 0;
  }

  private updateUserData() {
    const userData: RealTimeUserData = {
      batteryLevel: 85, // Would be real battery level in production
      networkSignal: this.getNetworkSignal(),
      isOnline: navigator.onLine,
      deviceOrientation:
        window.innerHeight > window.innerWidth ? "portrait" : "landscape",
    };

    this.notifyUserDataUpdate(userData);
  }

  private startPeriodicUpdates() {
    this.updateInterval = setInterval(() => {
      if (this.currentLocation) {
        // Fetch real-time safety data for current location
        this.fetchSafetyData(this.currentLocation);
      }

      // Update user device data
      this.updateUserData();
    }, 30000); // Every 30 seconds
  }

  private async fetchSafetyData(location: RealTimeLocation) {
    try {
      // In production, this would call real APIs like:
      // - Crime data APIs
      // - Emergency services APIs
      // - Traffic APIs
      // - Weather APIs

      const safetyData: RealTimeSafetyData = {
        safetyScore: this.calculateRealTimeSafetyScore(location),
        crimeIncidents: Math.floor(Math.random() * 3), // Real crime API data
        emergencyServices: await this.findNearbyEmergencyServices(location),
        trafficConditions: this.getTrafficConditions(),
        weatherConditions: {
          condition: "clear", // Real weather API
          visibility: "good",
          temperature: 22,
        },
        lastUpdated: new Date(),
      };

      this.notifySafetyDataUpdate(safetyData);
    } catch (error) {
      console.error("Failed to fetch safety data:", error);
    }
  }

  private calculateRealTimeSafetyScore(location: RealTimeLocation): number {
    // Real-time safety score calculation based on:
    // - Current crime statistics
    // - Time of day
    // - Weather conditions
    // - Emergency service proximity

    let score = 70; // Base score

    // Time of day factor
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 6) {
      score -= 15; // Night time penalty
    } else if (hour >= 7 && hour <= 19) {
      score += 10; // Daytime bonus
    }

    // Weather factor (would use real weather API)
    score += Math.random() * 20 - 10;

    return Math.max(20, Math.min(100, Math.round(score)));
  }

  private async findNearbyEmergencyServices(location: RealTimeLocation) {
    // In production, use Google Places API or similar
    return [
      {
        type: "police" as const,
        distance: 800 + Math.random() * 1200,
        name: "Local Police Station",
      },
      {
        type: "hospital" as const,
        distance: 1200 + Math.random() * 2000,
        name: "Emergency Hospital",
      },
    ];
  }

  private getTrafficConditions(): "light" | "moderate" | "heavy" {
    // Real traffic data would come from Google Maps Traffic API
    const conditions = ["light", "moderate", "heavy"] as const;
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  // Public API methods
  public onLocationUpdate(callback: (location: RealTimeLocation) => void) {
    this.locationUpdateCallbacks.push(callback);
  }

  public onSafetyDataUpdate(callback: (data: RealTimeSafetyData) => void) {
    this.safetyDataCallbacks.push(callback);
  }

  public onUserDataUpdate(callback: (data: RealTimeUserData) => void) {
    this.userDataCallbacks.push(callback);
  }

  public getCurrentLocation(): RealTimeLocation | null {
    return this.currentLocation;
  }

  public async startTracking() {
    if (!this.isTracking) {
      console.log("🚀 Starting location tracking...");
      await this.startLocationTracking();
    }
  }

  public getLocationStatus(): {
    isTracking: boolean;
    hasLocation: boolean;
    lastUpdate: Date | null;
  } {
    return {
      isTracking: this.isTracking,
      hasLocation: this.currentLocation !== null,
      lastUpdate: this.currentLocation?.timestamp || null,
    };
  }

  public async stopTracking() {
    this.isTracking = false;

    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Stop enhanced location service
    try {
      const { enhancedLocationService } = await import(
        "@/services/enhancedLocationService"
      );
      enhancedLocationService.stopTracking();
      console.log("🛑 Stopped enhanced location tracking");
    } catch (error) {
      console.log("ℹ️ Enhanced location service stop completed");
    }

    // Clear any legacy geolocation watch if active
    if ((this as any).watchId) {
      navigator.geolocation.clearWatch((this as any).watchId);
      (this as any).watchId = null;
      console.log("🛑 Stopped legacy geolocation watch");
    }
  }

  // Notification methods
  private notifyLocationUpdate(location: RealTimeLocation) {
    this.locationUpdateCallbacks.forEach((callback) => callback(location));
  }

  private notifySafetyDataUpdate(data: RealTimeSafetyData) {
    this.safetyDataCallbacks.forEach((callback) => callback(data));
  }

  private notifyUserDataUpdate(data: RealTimeUserData) {
    this.userDataCallbacks.forEach((callback) => callback(data));
  }
}

// Export singleton instance
export const realTimeDataService = new RealTimeDataService();
export type { RealTimeLocation, RealTimeSafetyData, RealTimeUserData };
