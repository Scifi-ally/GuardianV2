/**
 * Admin Debug Service
 * Provides Firebase-controlled debug mode that only admins can enable
 */

import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { safetyDebugService } from "./safetyDebugService";

interface DebugConfig {
  enabled: boolean;
  showLocationDebug: boolean;
  showSystemInfo: boolean;
  showCoordinates: boolean;
  showAccuracy: boolean;
  showConnectionStatus: boolean;
  enabledBy?: string;
  enabledAt?: Date;
  features: {
    locationDebugPanel: boolean;
    systemInfoPanel: boolean;
    coordinateDisplay: boolean;
    accuracyIndicator: boolean;
    connectionIndicator: boolean;
    performanceMetrics: boolean;
    safetyScoreDebug: boolean;
    safetyCalculationBasis: boolean;
  };
}

class AdminDebugService {
  private debugConfig: DebugConfig = {
    enabled: false,
    showLocationDebug: false,
    showSystemInfo: false,
    showCoordinates: false,
    showAccuracy: false,
    showConnectionStatus: false,
    features: {
      locationDebugPanel: false,
      systemInfoPanel: false,
      coordinateDisplay: false,
      accuracyIndicator: false,
      connectionIndicator: false,
      performanceMetrics: false,
      safetyScoreDebug: false,
      safetyCalculationBasis: false,
    },
  };

  private listeners: ((config: DebugConfig) => void)[] = [];
  private unsubscribe?: () => void;

  constructor() {
    this.initializeDebugConfig();
  }

  private async initializeDebugConfig() {
    try {
      // Temporarily disable Firebase connection to prevent fetch errors
      // TODO: Re-enable when Firebase connection is stable
      console.log(
        "📋 Admin debug service: Firebase connection disabled to prevent fetch errors",
      );
      return;

      // Listen to real-time changes to the debug config
      this.unsubscribe = onSnapshot(
        doc(db, "admin", "debugConfig"),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data() as DebugConfig;
            this.debugConfig = {
              ...this.debugConfig,
              ...data,
              enabledAt: data.enabledAt
                ? data.enabledAt instanceof Date
                  ? data.enabledAt
                  : new Date((data.enabledAt as any).seconds * 1000)
                : undefined,
            };

            // Enable/disable safety debug based on admin config
            if (this.shouldShowSafetyScoreDebug()) {
              safetyDebugService.enableDebugMode(true, "admin_controlled");
            } else {
              safetyDebugService.enableDebugMode(false, "admin_controlled");
            }

            this.notifyListeners();
          } else {
            // No debug config found, ensure it's disabled
            this.debugConfig.enabled = false;
            this.notifyListeners();
          }
        },
        (error) => {
          console.warn("Debug config listener error:", error);
          // Fail safe - disable debug mode on error
          this.debugConfig.enabled = false;
          this.notifyListeners();
        },
      );
    } catch (error) {
      console.warn("Failed to initialize debug config:", error);
      this.debugConfig.enabled = false;
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.debugConfig));
  }

  /**
   * Subscribe to debug config changes
   */
  public subscribe(listener: (config: DebugConfig) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current config
    listener(this.debugConfig);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if debug mode is enabled
   */
  public isDebugEnabled(): boolean {
    return this.debugConfig.enabled === true;
  }

  /**
   * Check if a specific debug feature is enabled
   */
  public isFeatureEnabled(feature: keyof DebugConfig["features"]): boolean {
    return (
      this.debugConfig.enabled === true &&
      this.debugConfig.features[feature] === true
    );
  }

  /**
   * Check if location debug should be shown
   */
  public shouldShowLocationDebug(): boolean {
    return this.isFeatureEnabled("locationDebugPanel");
  }

  /**
   * Check if system info should be shown
   */
  public shouldShowSystemInfo(): boolean {
    return this.isFeatureEnabled("systemInfoPanel");
  }

  /**
   * Check if coordinates should be displayed
   */
  public shouldShowCoordinates(): boolean {
    return this.isFeatureEnabled("coordinateDisplay");
  }

  /**
   * Check if accuracy indicator should be shown
   */
  public shouldShowAccuracy(): boolean {
    return this.isFeatureEnabled("accuracyIndicator");
  }

  /**
   * Check if connection status should be shown
   */
  public shouldShowConnectionStatus(): boolean {
    return this.isFeatureEnabled("connectionIndicator");
  }

  /**
   * Check if safety score debug should be shown
   */
  public shouldShowSafetyScoreDebug(): boolean {
    return this.isFeatureEnabled("safetyScoreDebug");
  }

  /**
   * Check if safety calculation basis should be shown
   */
  public shouldShowSafetyCalculationBasis(): boolean {
    return this.isFeatureEnabled("safetyCalculationBasis");
  }

  /**
   * Enable safety score debug mode (admin-controlled)
   */
  public enableSafetyDebugMode(enabled: boolean): boolean {
    if (this.isDebugEnabled() && this.shouldShowSafetyScoreDebug()) {
      return safetyDebugService.enableDebugMode(enabled, "admin_controlled");
    }
    return false;
  }

  /**
   * Get current debug configuration
   */
  public getDebugConfig(): DebugConfig {
    return { ...this.debugConfig };
  }

  /**
   * Development helper - only works in development mode
   */
  public devModeOverride(enabled: boolean): void {
    if (import.meta.env.DEV) {
      console.warn(
        "🚨 DEBUG MODE OVERRIDE (Development Only):",
        enabled ? "ENABLED" : "DISABLED",
      );
      this.debugConfig.enabled = enabled;
      if (enabled) {
        // Enable all features in dev mode
        Object.keys(this.debugConfig.features).forEach((key) => {
          (this.debugConfig.features as any)[key] = true;
        });
      }
      this.notifyListeners();
    } else {
      console.warn(
        "Debug mode override is only available in development environment",
      );
    }
  }

  /**
   * Cleanup method
   */
  public destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.listeners = [];
  }
}

// Create singleton instance
export const adminDebugService = new AdminDebugService();

// Hook for React components
export function useAdminDebug() {
  const [debugConfig, setDebugConfig] = useState<DebugConfig>({
    enabled: false,
    showLocationDebug: false,
    showSystemInfo: false,
    showCoordinates: false,
    showAccuracy: false,
    showConnectionStatus: false,
    features: {
      locationDebugPanel: false,
      systemInfoPanel: false,
      coordinateDisplay: false,
      accuracyIndicator: false,
      connectionIndicator: false,
      performanceMetrics: false,
      safetyScoreDebug: false,
      safetyCalculationBasis: false,
    },
  });

  useEffect(() => {
    const unsubscribe = adminDebugService.subscribe(setDebugConfig);
    return unsubscribe;
  }, []);

  return {
    isDebugEnabled: debugConfig.enabled,
    shouldShowLocationDebug: adminDebugService.shouldShowLocationDebug(),
    shouldShowSystemInfo: adminDebugService.shouldShowSystemInfo(),
    shouldShowCoordinates: adminDebugService.shouldShowCoordinates(),
    shouldShowAccuracy: adminDebugService.shouldShowAccuracy(),
    shouldShowConnectionStatus: adminDebugService.shouldShowConnectionStatus(),
    shouldShowSafetyScoreDebug: adminDebugService.shouldShowSafetyScoreDebug(),
    shouldShowSafetyCalculationBasis:
      adminDebugService.shouldShowSafetyCalculationBasis(),
    safetyDebugData: adminDebugService.shouldShowSafetyCalculationBasis()
      ? safetyDebugService.getDebugDisplayData()
      : null,
    debugConfig,
  };
}

// Import React hooks
import { useState, useEffect } from "react";

export default adminDebugService;
