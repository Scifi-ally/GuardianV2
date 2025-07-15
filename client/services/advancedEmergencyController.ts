import { enhancedEmergencyService } from "./enhancedEmergencyService";
import { unifiedNotifications } from "./unifiedNotificationService";
import { enhancedLocationService } from "./enhancedLocationService";

interface EmergencyState {
  isSOSActive: boolean;
  isEmergencyMode: boolean;
  countdown: number;
  emergencyType: "medical" | "fire" | "police" | "general";
  location: { lat: number; lng: number } | null;
  emergencyContacts: number;
  nearbyServices: number;
  lastActivation: number;
}

interface EmergencyController {
  state: EmergencyState;
  callbacks: Set<(state: EmergencyState) => void>;
  countdownInterval: NodeJS.Timeout | null;
  locationWatchId: number | null;
}

export class AdvancedEmergencyController {
  private static instance: AdvancedEmergencyController;
  private controller: EmergencyController;

  constructor() {
    this.controller = {
      state: {
        isSOSActive: false,
        isEmergencyMode: false,
        countdown: 0,
        emergencyType: "general",
        location: null,
        emergencyContacts: 0,
        nearbyServices: 0,
        lastActivation: 0,
      },
      callbacks: new Set(),
      countdownInterval: null,
      locationWatchId: null,
    };

    // Initialize emergency service status
    this.initializeStatus();
  }

  static getInstance(): AdvancedEmergencyController {
    if (!AdvancedEmergencyController.instance) {
      AdvancedEmergencyController.instance = new AdvancedEmergencyController();
    }
    return AdvancedEmergencyController.instance;
  }

  // Initialize emergency status
  private async initializeStatus(): Promise<void> {
    try {
      // Try to get current location with fallback strategy
      let location = null;

      try {
        location = await enhancedLocationService.getCurrentLocation();
      } catch (locationError) {
        console.debug(
          "Location unavailable during emergency controller init, using fallback",
        );

        // Fallback: Try to get any cached location
        const cachedLocation = enhancedLocationService.current;
        if (cachedLocation) {
          location = cachedLocation;
          console.log("Using cached location for emergency controller");
        } else {
          // Final fallback: Initialize without location for now
          console.log(
            "No location available, emergency controller will initialize when location is available",
          );
          this.updateState({
            emergencyContacts: 0,
            nearbyServices: 0,
          });

          // Set up listener for when location becomes available
          enhancedLocationService.addLocationListener((newLocation) => {
            this.initializeWithLocation(newLocation);
          });
          return;
        }
      }

      if (location) {
        await this.initializeWithLocation(location);
      }
    } catch (error) {
      console.debug(
        "Emergency controller initialization deferred:",
        error.message,
      );
      // Don't throw error - emergency controller should initialize gracefully
      this.updateState({
        emergencyContacts: 0,
        nearbyServices: 0,
      });
    }
  }

  private async initializeWithLocation(location: any): Promise<void> {
    try {
      // Initialize emergency service for this location
      await enhancedEmergencyService.initializeForLocation({
        lat: location.latitude,
        lng: location.longitude,
      });

      // Get emergency contacts and services count
      const contacts = enhancedEmergencyService.getEmergencyContacts();
      const services = enhancedEmergencyService.getNearbyEmergencyServices();

      this.updateState({
        location: { lat: location.latitude, lng: location.longitude },
        emergencyContacts: contacts.length,
        nearbyServices: services.length,
      });

      console.log("✅ Advanced Emergency Controller initialized with location");
    } catch (error) {
      console.debug(
        "Failed to initialize emergency service with location:",
        error.message,
      );
    }
  }

  // Activate SOS with countdown
  async activateSOSWithCountdown(
    type: "medical" | "fire" | "police" | "general" = "general",
    countdownSeconds: number = 5,
  ): Promise<void> {
    if (this.controller.state.isSOSActive) {
      console.log("SOS already active");
      return;
    }

    console.log(`🚨 Starting SOS countdown (${countdownSeconds}s) for ${type}`);

    this.updateState({
      isSOSActive: true,
      emergencyType: type,
      countdown: countdownSeconds,
    });

    // Start countdown
    this.controller.countdownInterval = setInterval(() => {
      const newCountdown = this.controller.state.countdown - 1;

      if (newCountdown <= 0) {
        // Countdown finished - activate emergency
        this.executeEmergencyActivation(type);
      } else {
        // Update countdown
        this.updateState({ countdown: newCountdown });

        // Show countdown notification
        unifiedNotifications.warning(`🚨 Emergency in ${newCountdown}s`, {
          message: "Tap to cancel",
          persistent: true,
        });
      }
    }, 1000);

    // Show initial countdown notification
    unifiedNotifications.critical(
      `🚨 Activating ${type} emergency in ${countdownSeconds}s`,
      {
        message:
          "Tap to cancel - Touch anywhere to cancel emergency activation",
        persistent: true,
      },
    );
  }

  // Execute emergency activation
  private async executeEmergencyActivation(
    type: "medical" | "fire" | "police" | "general",
  ): Promise<void> {
    try {
      console.log(`🚨 EXECUTING EMERGENCY ACTIVATION: ${type.toUpperCase()}`);

      // Clear countdown
      this.clearCountdown();

      // Update state
      this.updateState({
        isEmergencyMode: true,
        lastActivation: Date.now(),
      });

      // Get current location with high accuracy
      const location = await enhancedLocationService.getCurrentLocation();
      this.updateState({
        location: { lat: location.latitude, lng: location.longitude },
      });

      // Activate emergency service
      await enhancedEmergencyService.activateSOS(type);

      // Start emergency location tracking
      this.startEmergencyLocationTracking();

      // Additional emergency actions
      await this.executeEmergencyActions(type);

      // Notify completion
      unifiedNotifications.critical("🚨 EMERGENCY ACTIVATED", {
        message: `${type.toUpperCase()} emergency services contacted - Touch to deactivate if safe`,
        persistent: true,
      });

      console.log(`✅ Emergency activation completed for ${type}`);
    } catch (error) {
      console.error("Failed to execute emergency activation:", error);
      unifiedNotifications.error("Emergency activation failed", {
        message: "Please call emergency services directly",
      });
    }
  }

  // Execute additional emergency actions
  private async executeEmergencyActions(
    type: "medical" | "fire" | "police" | "general",
  ): Promise<void> {
    try {
      // Maximize device brightness
      if ("screen" in navigator && "brightness" in (navigator as any).screen) {
        try {
          await (navigator as any).screen.brightness.set(1.0);
        } catch (e) {
          console.log("Could not set brightness");
        }
      }

      // Activate flashlight if available
      if ("torch" in navigator) {
        try {
          await (navigator as any).torch(true);
        } catch (e) {
          console.log("Could not activate flashlight");
        }
      }

      // Vibrate in SOS pattern if available
      if ("vibrate" in navigator) {
        // SOS pattern: ... --- ... (short-short-short long-long-long short-short-short)
        navigator.vibrate([
          200, 100, 200, 100, 200, 300, 500, 300, 500, 300, 500, 300, 200, 100,
          200, 100, 200,
        ]);
      }

      // Play emergency sound if possible
      this.playEmergencySound();

      // Store emergency activation in local storage for persistence
      localStorage.setItem(
        "emergency-activation",
        JSON.stringify({
          type,
          timestamp: Date.now(),
          location: this.controller.state.location,
        }),
      );

      console.log("✅ Emergency actions executed");
    } catch (error) {
      console.error("Some emergency actions failed:", error);
    }
  }

  // Start emergency location tracking
  private startEmergencyLocationTracking(): void {
    if (!navigator.geolocation) return;

    console.log("📍 Starting emergency location tracking...");

    this.controller.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        this.updateState({ location: newLocation });

        // Store location updates
        localStorage.setItem(
          "emergency-location",
          JSON.stringify({
            ...newLocation,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy,
          }),
        );

        console.log(
          `📍 Emergency location updated: ${newLocation.lat}, ${newLocation.lng}`,
        );
      },
      (error) => {
        console.error("Emergency location tracking failed:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  }

  // Play emergency sound
  private playEmergencySound(): void {
    try {
      // Create emergency tone using Web Audio API
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Emergency siren frequency
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.5);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 1);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);
    } catch (error) {
      console.log("Could not play emergency sound:", error);
    }
  }

  // Cancel SOS activation
  cancelSOS(): void {
    console.log("❌ Cancelling SOS activation");

    this.clearCountdown();
    this.updateState({
      isSOSActive: false,
      countdown: 0,
    });

    unifiedNotifications.success("SOS cancelled");
  }

  // Deactivate emergency mode
  deactivateEmergency(): void {
    console.log("✅ Deactivating emergency mode");

    // Clear tracking
    if (this.controller.locationWatchId) {
      navigator.geolocation.clearWatch(this.controller.locationWatchId);
      this.controller.locationWatchId = null;
    }

    // Deactivate emergency service
    enhancedEmergencyService.deactivateSOS();

    // Update state
    this.updateState({
      isSOSActive: false,
      isEmergencyMode: false,
      countdown: 0,
    });

    // Clear stored data
    localStorage.removeItem("emergency-activation");
    localStorage.removeItem("emergency-location");

    unifiedNotifications.success("Emergency mode deactivated");
  }

  // Clear countdown timer
  private clearCountdown(): void {
    if (this.controller.countdownInterval) {
      clearInterval(this.controller.countdownInterval);
      this.controller.countdownInterval = null;
    }
  }

  // Quick emergency activation (no countdown)
  async quickEmergencyActivation(
    type: "medical" | "fire" | "police" | "general" = "general",
  ): Promise<void> {
    console.log(`⚡ Quick emergency activation: ${type}`);
    await this.executeEmergencyActivation(type);
  }

  // Test emergency systems
  async testEmergencySystems(): Promise<boolean> {
    try {
      console.log("🧪 Testing emergency systems...");

      // Test location access
      await enhancedLocationService.getCurrentLocation();

      // Test emergency service initialization
      const testResult = await enhancedEmergencyService.testEmergencySystems();

      // Test notifications
      unifiedNotifications.success("Emergency systems test completed");

      console.log("✅ Emergency systems test passed");
      return testResult;
    } catch (error) {
      console.error("Emergency systems test failed:", error);
      unifiedNotifications.error("Emergency systems test failed");
      return false;
    }
  }

  // Update emergency contacts
  updateEmergencyContacts(contacts: any[]): void {
    enhancedEmergencyService.updateEmergencyContacts(contacts);
    this.updateState({ emergencyContacts: contacts.length });
  }

  // Manual emergency call
  makeEmergencyCall(number: string = "911"): void {
    try {
      console.log(`📞 Making emergency call to ${number}`);
      window.open(`tel:${number}`, "_self");

      unifiedNotifications.success(`Calling ${number}`, {
        message: "Emergency call initiated",
      });
    } catch (error) {
      console.error("Failed to make emergency call:", error);
      unifiedNotifications.error(
        `Call ${number} manually for emergency assistance`,
      );
    }
  }

  // Get emergency status
  getEmergencyStatus(): {
    isActive: boolean;
    hasContacts: boolean;
    hasNearbyServices: boolean;
    isReady: boolean;
  } {
    return {
      isActive:
        this.controller.state.isSOSActive ||
        this.controller.state.isEmergencyMode,
      hasContacts: this.controller.state.emergencyContacts > 0,
      hasNearbyServices: this.controller.state.nearbyServices > 0,
      isReady:
        this.controller.state.emergencyContacts > 0 &&
        this.controller.state.nearbyServices > 0,
    };
  }

  // Update state and notify callbacks
  private updateState(newState: Partial<EmergencyState>): void {
    this.controller.state = { ...this.controller.state, ...newState };
    this.notifyCallbacks();
  }

  // Subscribe to state changes
  subscribe(callback: (state: EmergencyState) => void): () => void {
    this.controller.callbacks.add(callback);
    // Immediately call with current state
    callback(this.controller.state);
    return () => this.controller.callbacks.delete(callback);
  }

  // Notify all callbacks
  private notifyCallbacks(): void {
    this.controller.callbacks.forEach((callback) => {
      try {
        callback(this.controller.state);
      } catch (error) {
        console.error("Emergency callback error:", error);
      }
    });
  }

  // Get current state
  getState(): EmergencyState {
    return { ...this.controller.state };
  }

  // Get debug info
  getDebugInfo(): {
    state: EmergencyState;
    hasLocationTracking: boolean;
    hasCountdown: boolean;
    callbackCount: number;
  } {
    return {
      state: this.controller.state,
      hasLocationTracking: !!this.controller.locationWatchId,
      hasCountdown: !!this.controller.countdownInterval,
      callbackCount: this.controller.callbacks.size,
    };
  }
}

export const advancedEmergencyController =
  AdvancedEmergencyController.getInstance();
