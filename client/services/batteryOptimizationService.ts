import { EventEmitter } from "@/lib/eventEmitter";

interface BatteryInfo {
  level: number;
  charging: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
}

interface OptimizationSettings {
  lowBatteryMode: boolean;
  disableAnimations: boolean;
  reduceLocationAccuracy: boolean;
  disableBackgroundUpdates: boolean;
  disableNonSafetyFeatures: boolean;
  reducedPollingRate: boolean;
}

class BatteryOptimizationService extends EventEmitter {
  private battery: any = null;
  private settings: OptimizationSettings = {
    lowBatteryMode: false,
    disableAnimations: false,
    reduceLocationAccuracy: false,
    disableBackgroundUpdates: false,
    disableNonSafetyFeatures: false,
    reducedPollingRate: false,
  };

  private readonly LOW_BATTERY_THRESHOLD = 0.2; // 20%
  private readonly CRITICAL_BATTERY_THRESHOLD = 0.1; // 10%

  async initialize() {
    try {
      // @ts-ignore - Battery API is experimental
      this.battery = await navigator.getBattery?.();

      if (this.battery) {
        this.setupBatteryListeners();
        this.updateOptimizations();
      } else {
        console.log("Battery API not supported");
      }
    } catch (error) {
      console.log("Battery monitoring not available:", error);
    }
  }

  private setupBatteryListeners() {
    if (!this.battery) return;

    this.battery.addEventListener("levelchange", () => {
      this.updateOptimizations();
      this.emit("battery:levelchange", this.getBatteryInfo());
    });

    this.battery.addEventListener("chargingchange", () => {
      this.updateOptimizations();
      this.emit("battery:chargingchange", this.getBatteryInfo());
    });
  }

  private updateOptimizations() {
    if (!this.battery) return;

    const level = this.battery.level;
    const charging = this.battery.charging;

    // Enable optimizations based on battery level
    if (level <= this.CRITICAL_BATTERY_THRESHOLD && !charging) {
      this.enableCriticalMode();
    } else if (level <= this.LOW_BATTERY_THRESHOLD && !charging) {
      this.enableLowBatteryMode();
    } else if (charging || level > this.LOW_BATTERY_THRESHOLD) {
      this.disableBatteryOptimizations();
    }

    this.emit("optimizations:update", this.settings);
  }

  private enableCriticalMode() {
    this.settings = {
      lowBatteryMode: true,
      disableAnimations: true,
      reduceLocationAccuracy: true,
      disableBackgroundUpdates: true,
      disableNonSafetyFeatures: true,
      reducedPollingRate: true,
    };

    // Apply critical optimizations to DOM
    document.body.classList.add("critical-battery-mode");

    console.log("🔋 Critical battery mode enabled");
  }

  private enableLowBatteryMode() {
    this.settings = {
      lowBatteryMode: true,
      disableAnimations: true,
      reduceLocationAccuracy: false,
      disableBackgroundUpdates: true,
      disableNonSafetyFeatures: true,
      reducedPollingRate: true,
    };

    // Apply low battery optimizations to DOM
    document.body.classList.add("low-battery-mode");
    document.body.classList.remove("critical-battery-mode");

    console.log("🔋 Low battery mode enabled");
  }

  private disableBatteryOptimizations() {
    this.settings = {
      lowBatteryMode: false,
      disableAnimations: false,
      reduceLocationAccuracy: false,
      disableBackgroundUpdates: false,
      disableNonSafetyFeatures: false,
      reducedPollingRate: false,
    };

    // Remove battery optimizations from DOM
    document.body.classList.remove("low-battery-mode", "critical-battery-mode");

    console.log("🔋 Battery optimizations disabled");
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

  getOptimizationSettings(): OptimizationSettings {
    return { ...this.settings };
  }

  isLowBatteryMode(): boolean {
    return this.settings.lowBatteryMode;
  }

  shouldDisableAnimations(): boolean {
    return this.settings.disableAnimations;
  }

  shouldReduceLocationAccuracy(): boolean {
    return this.settings.reduceLocationAccuracy;
  }

  shouldDisableBackgroundUpdates(): boolean {
    return this.settings.disableBackgroundUpdates;
  }

  shouldDisableNonSafetyFeatures(): boolean {
    return this.settings.disableNonSafetyFeatures;
  }

  shouldUseReducedPollingRate(): boolean {
    return this.settings.reducedPollingRate;
  }

  // Manual override for testing or user preference
  enableBatterySaverMode(enable: boolean) {
    if (enable) {
      this.enableLowBatteryMode();
    } else {
      this.disableBatteryOptimizations();
    }
  }
}

export const batteryOptimizationService = new BatteryOptimizationService();
