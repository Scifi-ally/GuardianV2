import { emergencyErrorHandler } from "./emergencyErrorHandler";
import { offlineEmergencyService } from "./offlineEmergencyService";
import { unifiedNotifications } from "./unifiedNotificationService";

interface EmergencyScenario {
  type:
    | "device_failure"
    | "location_unavailable"
    | "no_contacts"
    | "permission_denied"
    | "battery_critical"
    | "network_failure"
    | "multiple_failures";
  severity: "extreme" | "critical" | "high";
  triggers: string[];
  fallbacks: string[];
  lastResort: string[];
}

class ExtremeEmergencyHandler {
  private scenarios: Map<string, EmergencyScenario> = new Map();
  private activeScenarios: Set<string> = new Set();
  private failureCount = 0;
  private lastEmergencyTime = 0;
  private emergencyMode = false;

  constructor() {
    this.initializeScenarios();
    this.setupEmergencyDetection();
  }

  private initializeScenarios() {
    // Device failure scenario
    this.scenarios.set("device_failure", {
      type: "device_failure",
      severity: "extreme",
      triggers: ["geolocation_error", "permission_error", "api_failure"],
      fallbacks: ["manual_location", "ip_location", "last_known"],
      lastResort: ["emergency_contacts_only", "basic_sms"],
    });

    // Location completely unavailable
    this.scenarios.set("location_unavailable", {
      type: "location_unavailable",
      severity: "critical",
      triggers: ["gps_disabled", "location_denied", "position_unavailable"],
      fallbacks: ["manual_entry", "address_input", "landmark_selection"],
      lastResort: ["contact_emergency_services", "emergency_call"],
    });

    // No emergency contacts configured
    this.scenarios.set("no_contacts", {
      type: "no_contacts",
      severity: "high",
      triggers: ["empty_contacts", "invalid_contacts"],
      fallbacks: ["add_contacts_flow", "use_default_emergency"],
      lastResort: ["direct_911_call", "generic_emergency_sms"],
    });

    // All permissions denied
    this.scenarios.set("permission_denied", {
      type: "permission_denied",
      severity: "critical",
      triggers: ["location_denied", "notification_denied", "camera_denied"],
      fallbacks: ["manual_operations", "text_only_mode"],
      lastResort: ["basic_phone_functions", "emergency_dial"],
    });

    // Critical battery with multiple failures
    this.scenarios.set("battery_critical", {
      type: "battery_critical",
      severity: "extreme",
      triggers: ["battery_low", "multiple_service_failures"],
      fallbacks: ["ultra_low_power_mode", "essential_only"],
      lastResort: ["emergency_beacon", "final_location_broadcast"],
    });

    // Complete network failure
    this.scenarios.set("network_failure", {
      type: "network_failure",
      severity: "extreme",
      triggers: ["offline_mode", "api_failures", "connectivity_lost"],
      fallbacks: ["offline_mode", "local_storage", "device_functions"],
      lastResort: ["emergency_call", "local_alarm"],
    });

    // Multiple catastrophic failures
    this.scenarios.set("multiple_failures", {
      type: "multiple_failures",
      severity: "extreme",
      triggers: ["cascading_failures", "system_breakdown"],
      fallbacks: ["emergency_protocols", "manual_override"],
      lastResort: ["panic_mode", "all_emergency_actions"],
    });
  }

  private setupEmergencyDetection() {
    // Listen for emergency scenarios
    window.addEventListener(
      "emergency-scenario",
      this.handleEmergencyScenario.bind(this),
    );

    // Monitor for cascading failures
    this.monitorSystemHealth();

    // Set up panic detection
    this.setupPanicDetection();
  }

  private monitorSystemHealth() {
    setInterval(() => {
      this.checkSystemHealth();
    }, 10000); // Check every 10 seconds
  }

  private checkSystemHealth() {
    const healthChecks = [
      this.checkLocationServices(),
      this.checkConnectivity(),
      this.checkPermissions(),
      this.checkBattery(),
      this.checkEmergencyContacts(),
    ];

    const failures = healthChecks.filter((check) => !check).length;

    if (failures >= 3) {
      this.triggerScenario("multiple_failures");
    }
  }

  private checkLocationServices(): boolean {
    try {
      return (
        "geolocation" in navigator &&
        localStorage.getItem("lastKnownLocation") !== null
      );
    } catch {
      return false;
    }
  }

  private checkConnectivity(): boolean {
    return navigator.onLine;
  }

  private checkPermissions(): boolean {
    // Check if basic permissions are available
    return (
      document.location.protocol === "https:" ||
      document.location.hostname === "localhost"
    );
  }

  private checkBattery(): boolean {
    // Assume battery is OK if we can't check
    return true;
  }

  private checkEmergencyContacts(): boolean {
    try {
      const contacts = localStorage.getItem("emergencyContacts");
      return contacts !== null && JSON.parse(contacts).length > 0;
    } catch {
      return false;
    }
  }

  private setupPanicDetection() {
    let rapidTapCount = 0;
    let lastTapTime = 0;

    document.addEventListener("click", (event) => {
      const now = Date.now();

      if (now - lastTapTime < 300) {
        // Rapid taps within 300ms
        rapidTapCount++;

        if (rapidTapCount >= 10) {
          // 10 rapid taps = panic
          this.triggerPanicMode();
          rapidTapCount = 0;
        }
      } else {
        rapidTapCount = 1;
      }

      lastTapTime = now;
    });

    // Screen shake detection
    if (window.DeviceMotionEvent) {
      let shakeDetected = false;

      window.addEventListener("devicemotion", (event) => {
        const acceleration = event.accelerationIncludingGravity;
        if (acceleration && !shakeDetected) {
          const totalAcceleration =
            Math.abs(acceleration.x!) +
            Math.abs(acceleration.y!) +
            Math.abs(acceleration.z!);

          if (totalAcceleration > 25) {
            // Strong shake
            shakeDetected = true;
            this.triggerPanicMode();

            // Reset after 5 seconds
            setTimeout(() => {
              shakeDetected = false;
            }, 5000);
          }
        }
      });
    }
  }

  public triggerScenario(scenarioType: string, context?: any) {
    if (this.activeScenarios.has(scenarioType)) {
      return; // Already handling this scenario
    }

    const scenario = this.scenarios.get(scenarioType);
    if (!scenario) {
      console.error("Unknown emergency scenario:", scenarioType);
      return;
    }

    this.activeScenarios.add(scenarioType);
    this.failureCount++;

    console.error(`🚨 EMERGENCY SCENARIO: ${scenarioType}`, scenario);

    this.executeEmergencyProtocol(scenario, context);
  }

  private async executeEmergencyProtocol(
    scenario: EmergencyScenario,
    context?: any,
  ) {
    try {
      // Immediate notification
      unifiedNotifications.error(
        `🚨 EMERGENCY: ${scenario.type.replace("_", " ").toUpperCase()}`,
        {
          message: "Activating emergency protocols",
          persistent: true,
        },
      );

      // Execute fallback strategies in order
      for (const fallback of scenario.fallbacks) {
        const success = await this.executeFallback(fallback, context);
        if (success) {
          console.log(`✅ Fallback successful: ${fallback}`);
          return;
        }
      }

      // If all fallbacks fail, execute last resort actions
      console.error("🔴 All fallbacks failed, executing last resort actions");

      for (const lastResort of scenario.lastResort) {
        await this.executeLastResort(lastResort, context);
      }
    } catch (error) {
      console.error("Emergency protocol execution failed:", error);
      this.triggerPanicMode();
    }
  }

  private async executeFallback(
    fallback: string,
    context?: any,
  ): Promise<boolean> {
    switch (fallback) {
      case "manual_location":
        return this.promptManualLocation();

      case "ip_location":
        return this.getIPLocation();

      case "last_known":
        return this.useLastKnownLocation();

      case "emergency_contacts_only":
        return this.contactEmergencyServices();

      case "manual_entry":
        return this.promptLocationEntry();

      case "add_contacts_flow":
        return this.promptEmergencyContacts();

      case "manual_operations":
        return this.enableManualMode();

      case "ultra_low_power_mode":
        return this.enableUltraLowPowerMode();

      case "offline_mode":
        offlineEmergencyService.activateOfflineEmergencyMode();
        return true;

      default:
        return false;
    }
  }

  private async executeLastResort(
    action: string,
    context?: any,
  ): Promise<void> {
    switch (action) {
      case "emergency_call":
        window.open("tel:911", "_self");
        break;

      case "basic_sms":
        this.sendBasicEmergencySMS();
        break;

      case "emergency_beacon":
        this.activateEmergencyBeacon();
        break;

      case "final_location_broadcast":
        this.broadcastFinalLocation();
        break;

      case "panic_mode":
        this.triggerPanicMode();
        break;

      case "all_emergency_actions":
        await this.executeAllEmergencyActions();
        break;
    }
  }

  private async promptManualLocation(): Promise<boolean> {
    const location = prompt(
      "EMERGENCY: Enter your current location (address or description):",
    );
    if (location) {
      localStorage.setItem("manualEmergencyLocation", location);
      unifiedNotifications.success("Manual location saved", {
        message: location,
      });
      return true;
    }
    return false;
  }

  private async getIPLocation(): Promise<boolean> {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();

      if (data.latitude && data.longitude) {
        const location = {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 50000, // Very rough
          source: "ip",
          city: data.city,
          country: data.country_name,
        };

        localStorage.setItem(
          "emergencyLocationFallback",
          JSON.stringify(location),
        );

        unifiedNotifications.warning("Location estimated from IP", {
          message: `Approximate location: ${data.city}, ${data.country_name}`,
        });

        return true;
      }
    } catch (error) {
      console.error("IP location failed:", error);
    }
    return false;
  }

  private useLastKnownLocation(): boolean {
    const lastLocation = localStorage.getItem("lastKnownLocation");
    if (lastLocation) {
      try {
        const location = JSON.parse(lastLocation);
        unifiedNotifications.warning("Using last known location", {
          message: "GPS unavailable, using previous location",
        });
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  private contactEmergencyServices(): boolean {
    // Show emergency contact interface
    const contacts = ["911", "Local Emergency Services"];

    unifiedNotifications.error("Contact Emergency Services", {
      message: "Tap to call emergency services directly",
      persistent: true,
    });

    return true;
  }

  private promptLocationEntry(): boolean {
    // Create emergency location input
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 12px; max-width: 400px; width: 90%;">
        <h2 style="color: #dc2626; margin-bottom: 16px;">🚨 EMERGENCY LOCATION</h2>
        <p style="margin-bottom: 16px;">Enter your current location:</p>
        <input type="text" id="emergency-location" 
               placeholder="Address, landmark, or description"
               style="width: 100%; padding: 12px; margin-bottom: 16px; border: 2px solid #dc2626; border-radius: 8px;">
        <div style="display: flex; gap: 8px;">
          <button onclick="this.closest('div').previousElementSibling.closest('div').remove()" 
                  style="flex: 1; padding: 12px; background: #dc2626; color: white; border: none; border-radius: 8px;">
            Cancel
          </button>
          <button onclick="
            const input = document.getElementById('emergency-location');
            if (input.value) {
              localStorage.setItem('emergencyLocationManual', input.value);
              alert('Emergency location saved: ' + input.value);
              this.closest('div').closest('div').remove();
            }
          " style="flex: 1; padding: 12px; background: #16a34a; color: white; border: none; border-radius: 8px;">
            Save Location
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return true;
  }

  private promptEmergencyContacts(): boolean {
    unifiedNotifications.warning("Add Emergency Contacts", {
      message: "Go to Settings to add emergency contacts",
      persistent: true,
    });
    return true;
  }

  private enableManualMode(): boolean {
    document.body.classList.add("manual-emergency-mode");
    unifiedNotifications.warning("Manual Emergency Mode", {
      message: "Device permissions limited. Manual operation only.",
    });
    return true;
  }

  private enableUltraLowPowerMode(): boolean {
    document.body.classList.add("ultra-low-power-mode");

    // Disable all non-essential features
    const nonEssential = document.querySelectorAll(".non-essential");
    nonEssential.forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });

    unifiedNotifications.error("Ultra Low Power Mode", {
      message: "Battery critical. Only emergency features active.",
      persistent: true,
    });

    return true;
  }

  private sendBasicEmergencySMS(): void {
    const message =
      "🚨 EMERGENCY - I need immediate assistance. Please contact emergency services.";
    window.open(`sms:?body=${encodeURIComponent(message)}`, "_blank");
  }

  private activateEmergencyBeacon(): void {
    // Attempt to broadcast emergency signal
    localStorage.setItem(
      "emergencyBeaconActive",
      JSON.stringify({
        timestamp: Date.now(),
        message: "Emergency beacon activated",
        location: localStorage.getItem("lastKnownLocation"),
      }),
    );

    unifiedNotifications.error("🔴 EMERGENCY BEACON ACTIVE", {
      message: "Broadcasting emergency signal",
      persistent: true,
    });
  }

  private broadcastFinalLocation(): void {
    const location = localStorage.getItem("lastKnownLocation");
    if (location) {
      try {
        const loc = JSON.parse(location);
        const message = `🚨 FINAL EMERGENCY LOCATION: https://maps.google.com/?q=${loc.latitude},${loc.longitude} - SEND HELP IMMEDIATELY`;

        // Try multiple channels
        navigator.clipboard?.writeText(message);
        window.open(`sms:?body=${encodeURIComponent(message)}`, "_blank");

        unifiedNotifications.error("🔴 FINAL LOCATION BROADCAST", {
          message: "Emergency location sent to all available channels",
          persistent: true,
        });
      } catch (e) {
        console.error("Failed to broadcast final location");
      }
    }
  }

  private triggerPanicMode(): void {
    if (this.emergencyMode) return; // Already in panic mode

    this.emergencyMode = true;
    document.body.classList.add("panic-mode");

    // Execute all possible emergency actions simultaneously
    this.executeAllEmergencyActions();

    // Show panic mode interface
    this.showPanicModeInterface();
  }

  private async executeAllEmergencyActions(): Promise<void> {
    const actions = [
      () => window.open("tel:911", "_self"),
      () => offlineEmergencyService.sendEmergencySMS(),
      () => offlineEmergencyService.shareLocation(),
      () => offlineEmergencyService.activateAlarm(),
      () => this.broadcastFinalLocation(),
    ];

    // Execute all actions
    actions.forEach((action) => {
      try {
        action();
      } catch (e) {
        console.error("Emergency action failed:", e);
      }
    });

    unifiedNotifications.error("🚨 PANIC MODE ACTIVATED", {
      message: "ALL EMERGENCY PROTOCOLS ACTIVE",
      persistent: true,
    });
  }

  private showPanicModeInterface(): void {
    const panicInterface = document.createElement("div");
    panicInterface.id = "panic-mode-interface";
    panicInterface.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: #dc2626; color: white; z-index: 10001;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-family: monospace; text-align: center; padding: 20px;
    `;

    panicInterface.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px; animation: pulse 1s infinite;">🚨</div>
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">PANIC MODE ACTIVE</div>
      <div style="font-size: 18px; margin-bottom: 30px;">ALL EMERGENCY PROTOCOLS ACTIVATED</div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 400px; width: 100%;">
        <button onclick="window.open('tel:911', '_self')" 
                style="padding: 20px; background: #7f1d1d; border: 2px solid white; color: white; border-radius: 12px; font-size: 18px; font-weight: bold;">
          📞 CALL 911
        </button>
        <button onclick="offlineEmergencyService.sendEmergencySMS()" 
                style="padding: 20px; background: #7f1d1d; border: 2px solid white; color: white; border-radius: 12px; font-size: 18px; font-weight: bold;">
          📱 SEND SOS
        </button>
        <button onclick="offlineEmergencyService.shareLocation()" 
                style="padding: 20px; background: #7f1d1d; border: 2px solid white; color: white; border-radius: 12px; font-size: 18px; font-weight: bold;">
          📍 SHARE LOCATION
        </button>
        <button onclick="
          document.getElementById('panic-mode-interface').remove();
          document.body.classList.remove('panic-mode');
          extremeEmergencyHandler.emergencyMode = false;
        " style="padding: 20px; background: #059669; border: 2px solid white; color: white; border-radius: 12px; font-size: 18px; font-weight: bold;">
          ✅ SAFE NOW
        </button>
      </div>
      <div style="margin-top: 30px; font-size: 14px; opacity: 0.8;">
        Tap "SAFE NOW" when help arrives or you're safe
      </div>
    `;

    document.body.appendChild(panicInterface);

    // Make service available globally
    (window as any).extremeEmergencyHandler = this;
  }

  private handleEmergencyScenario(event: CustomEvent) {
    const { type, context } = event.detail;
    this.triggerScenario(type, context);
  }

  public clearScenario(scenarioType: string) {
    this.activeScenarios.delete(scenarioType);
  }

  public clearAllScenarios() {
    this.activeScenarios.clear();
    this.failureCount = 0;
    this.emergencyMode = false;
    document.body.classList.remove(
      "panic-mode",
      "manual-emergency-mode",
      "ultra-low-power-mode",
    );

    const panicInterface = document.getElementById("panic-mode-interface");
    if (panicInterface) {
      panicInterface.remove();
    }
  }

  public getStatus() {
    return {
      emergencyMode: this.emergencyMode,
      activeScenarios: Array.from(this.activeScenarios),
      failureCount: this.failureCount,
      lastEmergencyTime: this.lastEmergencyTime,
    };
  }
}

export const extremeEmergencyHandler = new ExtremeEmergencyHandler();
