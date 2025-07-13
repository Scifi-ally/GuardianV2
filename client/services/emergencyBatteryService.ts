import { unifiedNotifications } from "./unifiedNotificationService";

interface BatteryInfo {
  level: number;
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
}

class EmergencyBatteryService {
  private battery: any = null;
  private isMonitoring = false;
  private emergencyMode = false;
  private criticalLevel = 0.15; // 15%
  private lowLevel = 0.25; // 25%
  private wakeLock: any = null;

  async initialize() {
    try {
      // Get battery API if available
      if ("getBattery" in navigator) {
        this.battery = await (navigator as any).getBattery();
        this.setupBatteryListeners();
      } else if ("battery" in navigator) {
        this.battery = (navigator as any).battery;
        this.setupBatteryListeners();
      }
    } catch (error) {
      console.warn("Battery API not available:", error);
    }
  }

  private setupBatteryListeners() {
    if (!this.battery) return;

    this.battery.addEventListener("levelchange", () => {
      this.checkBatteryStatus();
    });

    this.battery.addEventListener("chargingchange", () => {
      this.checkBatteryStatus();
    });

    // Initial check
    this.checkBatteryStatus();
  }

  private checkBatteryStatus() {
    if (!this.battery) return;

    const level = this.battery.level;
    const charging = this.battery.charging;

    // Critical battery warning for emergency situations
    if (level <= this.criticalLevel && !charging) {
      this.handleCriticalBattery(level);
    } else if (level <= this.lowLevel && !charging && this.emergencyMode) {
      this.handleLowBatteryInEmergency(level);
    }
  }

  private handleCriticalBattery(level: number) {
    const percentage = Math.round(level * 100);

    unifiedNotifications.critical("🔋 CRITICAL BATTERY WARNING", {
      message: `Battery at ${percentage}%. Emergency features may be limited. Consider activating power save mode.`,
      persistent: true,
      action: {
        label: "Activate Emergency Power Mode",
        onClick: () => {
          this.activateEmergencyPowerMode();
        },
      },
    });

    // Auto-activate emergency power mode if battery is extremely low
    if (level <= 0.1) {
      // 10%
      this.activateEmergencyPowerMode();
    }
  }

  private handleLowBatteryInEmergency(level: number) {
    const percentage = Math.round(level * 100);

    unifiedNotifications.warning("🔋 Low Battery in Emergency", {
      message: `Battery at ${percentage}%. Optimizing emergency features for extended use.`,
    });

    // Reduce location update frequency
    this.optimizeLocationTracking();
  }

  async activateEmergencyPowerMode() {
    this.emergencyMode = true;

    try {
      // Request wake lock to prevent screen from turning off during emergency
      if ("wakeLock" in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request("screen");
        console.log("Emergency wake lock activated");
      }
    } catch (error) {
      console.warn("Wake lock not available:", error);
    }

    // Reduce non-essential features
    this.optimizeForBattery();

    unifiedNotifications.success("🔋 Emergency Power Mode Activated", {
      message:
        "Battery optimized for emergency use. Screen will stay on, non-essential features reduced.",
    });

    // Save setting
    localStorage.setItem("guardian-emergency-power-mode", "true");
  }

  private optimizeForBattery() {
    // Reduce location update frequency
    this.optimizeLocationTracking();

    // Disable non-essential animations
    document.body.classList.add("reduce-motion");

    // Reduce screen brightness (if possible)
    this.requestReducedBrightness();
  }

  private optimizeLocationTracking() {
    // Increase location update interval to save battery
    const event = new CustomEvent("battery-optimize-location", {
      detail: {
        emergencyMode: true,
        updateInterval: 60000, // 1 minute instead of 30 seconds
      },
    });
    window.dispatchEvent(event);
  }

  private requestReducedBrightness() {
    // This is limited in browsers, but we can suggest to user
    unifiedNotifications.success("💡 Battery Tip", {
      message:
        "Consider reducing screen brightness manually to extend battery life during emergency.",
    });
  }

  deactivateEmergencyPowerMode() {
    this.emergencyMode = false;

    // Release wake lock
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }

    // Restore normal operation
    document.body.classList.remove("reduce-motion");

    // Restore normal location tracking
    const event = new CustomEvent("battery-optimize-location", {
      detail: {
        emergencyMode: false,
        updateInterval: 30000, // Back to 30 seconds
      },
    });
    window.dispatchEvent(event);

    localStorage.removeItem("guardian-emergency-power-mode");

    unifiedNotifications.success("Normal Power Mode Restored", {
      title: "🔋 Battery Status",
    });
  }

  getBatteryInfo(): BatteryInfo | null {
    if (!this.battery) return null;

    return {
      level: this.battery.level,
      charging: this.battery.charging,
      chargingTime: this.battery.chargingTime,
      dischargingTime: this.battery.dischargingTime,
    };
  }

  isInEmergencyMode(): boolean {
    return this.emergencyMode;
  }

  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.initialize();

    // Check if emergency power mode was previously activated
    if (localStorage.getItem("guardian-emergency-power-mode") === "true") {
      this.activateEmergencyPowerMode();
    }
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.deactivateEmergencyPowerMode();
  }
}

export const emergencyBatteryService = new EmergencyBatteryService();
