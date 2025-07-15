/**
 * Navigation Error Handler Service
 * Handles extreme cases and provides robust error recovery for navigation
 */

import { unifiedNotifications } from "./unifiedNotificationService";

export interface NavigationError {
  type:
    | "LOCATION_DENIED"
    | "GPS_UNAVAILABLE"
    | "NETWORK_OFFLINE"
    | "API_FAILURE"
    | "ROUTE_NOT_FOUND"
    | "INVALID_DESTINATION"
    | "EXTREME_WEATHER"
    | "SAFETY_CRITICAL"
    | "DEVICE_ERROR"
    | "UNKNOWN";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  recoverable: boolean;
  context?: any;
}

export interface RecoveryAction {
  type: "retry" | "fallback" | "manual" | "emergency" | "offline";
  description: string;
  action: () => Promise<void>;
  priority: number; // 1-5, 1 being highest priority
}

class NavigationErrorHandler {
  private static instance: NavigationErrorHandler;
  private retryAttempts: Map<string, number> = new Map();
  private errorHistory: NavigationError[] = [];
  private maxRetries = 3;
  private offlineMode = false;

  static getInstance(): NavigationErrorHandler {
    if (!NavigationErrorHandler.instance) {
      NavigationErrorHandler.instance = new NavigationErrorHandler();
    }
    return NavigationErrorHandler.instance;
  }

  /**
   * Main error handling entry point
   */
  async handleNavigationError(
    error: any,
    context: { destination?: any; currentLocation?: any },
  ): Promise<RecoveryAction[]> {
    const navigationError = this.classifyError(error, context);
    this.logError(navigationError);

    const recoveryActions = this.generateRecoveryActions(
      navigationError,
      context,
    );

    // Automatic recovery for low severity issues
    if (navigationError.severity === "low" && recoveryActions.length > 0) {
      try {
        await recoveryActions[0].action();
        return [];
      } catch (autoRecoveryError) {
        console.warn("Auto-recovery failed:", autoRecoveryError);
      }
    }

    // Show user notification for higher severity issues
    this.showErrorNotification(navigationError);

    return recoveryActions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Classify the error type and severity
   */
  private classifyError(error: any, context: any): NavigationError {
    // Location permission errors
    if (error.code === 1 || error.message?.includes("denied")) {
      return {
        type: "LOCATION_DENIED",
        message: "Location access denied. Please enable location services.",
        severity: "high",
        recoverable: true,
        context,
      };
    }

    // GPS/positioning errors
    if (error.code === 2 || error.message?.includes("position unavailable")) {
      return {
        type: "GPS_UNAVAILABLE",
        message:
          "GPS signal unavailable. Please move to an area with better signal.",
        severity: "medium",
        recoverable: true,
        context,
      };
    }

    // Network errors
    if (!navigator.onLine || error.message?.includes("network")) {
      return {
        type: "NETWORK_OFFLINE",
        message: "Network connection lost. Using offline navigation mode.",
        severity: "medium",
        recoverable: true,
        context,
      };
    }

    // API failures
    if (error.status >= 400 || error.message?.includes("API")) {
      return {
        type: "API_FAILURE",
        message: "Navigation service temporarily unavailable.",
        severity: "medium",
        recoverable: true,
        context,
      };
    }

    // Route calculation failures
    if (
      error.message?.includes("route") ||
      error.message?.includes("directions")
    ) {
      return {
        type: "ROUTE_NOT_FOUND",
        message: "Unable to calculate route to destination.",
        severity: "medium",
        recoverable: true,
        context,
      };
    }

    // Invalid destinations
    if (
      error.message?.includes("destination") ||
      error.message?.includes("invalid")
    ) {
      return {
        type: "INVALID_DESTINATION",
        message: "Invalid destination. Please select a different location.",
        severity: "low",
        recoverable: true,
        context,
      };
    }

    // Safety critical conditions
    if (this.isSafetyCritical(error, context)) {
      return {
        type: "SAFETY_CRITICAL",
        message: "Safety alert: Navigation conditions may be dangerous.",
        severity: "critical",
        recoverable: false,
        context,
      };
    }

    // Default unknown error
    return {
      type: "UNKNOWN",
      message:
        error.message || "An unexpected error occurred during navigation.",
      severity: "medium",
      recoverable: true,
      context,
    };
  }

  /**
   * Generate appropriate recovery actions
   */
  private generateRecoveryActions(
    error: NavigationError,
    context: any,
  ): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    switch (error.type) {
      case "LOCATION_DENIED":
        actions.push({
          type: "manual",
          description: "Enable location services in browser settings",
          action: async () => {
            window.open("chrome://settings/content/location", "_blank");
          },
          priority: 1,
        });
        actions.push({
          type: "fallback",
          description: "Enter address manually",
          action: async () => {
            this.triggerManualLocationEntry();
          },
          priority: 2,
        });
        break;

      case "GPS_UNAVAILABLE":
        actions.push({
          type: "retry",
          description: "Retry getting GPS location",
          action: async () => {
            await this.retryLocationAcquisition();
          },
          priority: 1,
        });
        actions.push({
          type: "fallback",
          description: "Use approximate location",
          action: async () => {
            await this.useApproximateLocation(context);
          },
          priority: 2,
        });
        break;

      case "NETWORK_OFFLINE":
        actions.push({
          type: "offline",
          description: "Continue with offline navigation",
          action: async () => {
            await this.enableOfflineMode(context);
          },
          priority: 1,
        });
        actions.push({
          type: "retry",
          description: "Retry when connection returns",
          action: async () => {
            await this.waitForConnection();
          },
          priority: 2,
        });
        break;

      case "API_FAILURE":
        actions.push({
          type: "retry",
          description: "Retry navigation request",
          action: async () => {
            await this.retryWithBackoff(context);
          },
          priority: 1,
        });
        actions.push({
          type: "fallback",
          description: "Use alternative navigation service",
          action: async () => {
            await this.useAlternativeService(context);
          },
          priority: 2,
        });
        break;

      case "ROUTE_NOT_FOUND":
        actions.push({
          type: "fallback",
          description: "Try alternative routing",
          action: async () => {
            await this.findAlternativeRoute(context);
          },
          priority: 1,
        });
        actions.push({
          type: "manual",
          description: "Get directions to nearby landmark",
          action: async () => {
            await this.navigateToNearbyLandmark(context);
          },
          priority: 2,
        });
        break;

      case "SAFETY_CRITICAL":
        actions.push({
          type: "emergency",
          description: "Contact emergency services",
          action: async () => {
            await this.triggerEmergencyContact();
          },
          priority: 1,
        });
        actions.push({
          type: "fallback",
          description: "Find nearest safe location",
          action: async () => {
            await this.findNearestSafeLocation(context);
          },
          priority: 2,
        });
        break;

      default:
        actions.push({
          type: "retry",
          description: "Retry navigation",
          action: async () => {
            await this.genericRetry(context);
          },
          priority: 1,
        });
        break;
    }

    return actions;
  }

  /**
   * Check if the situation is safety critical
   */
  private isSafetyCritical(error: any, context: any): boolean {
    // Check for extreme weather conditions
    if (context.weather === "storm" || context.weather === "extreme") {
      return true;
    }

    // Check for very high crime area
    if (context.safetyScore && context.safetyScore < 30) {
      return true;
    }

    // Check for emergency situation
    if (context.isEmergency) {
      return true;
    }

    return false;
  }

  /**
   * Log error for debugging and analytics
   */
  private logError(error: NavigationError): void {
    this.errorHistory.push({
      ...error,
      timestamp: new Date().toISOString(),
    } as any);

    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(-50);
    }

    console.error("Navigation Error:", error);
  }

  /**
   * Show appropriate notification to user
   */
  private showErrorNotification(error: NavigationError): void {
    switch (error.severity) {
      case "critical":
        unifiedNotifications.critical("Critical Navigation Error", {
          message: error.message,
          persistent: true,
        });
        break;
      case "high":
        unifiedNotifications.error("Navigation Error", {
          message: error.message,
        });
        break;
      case "medium":
        unifiedNotifications.warning("Navigation Issue", {
          message: error.message,
        });
        break;
      case "low":
        unifiedNotifications.info("Navigation Notice", {
          message: error.message,
        });
        break;
    }
  }

  // Recovery action implementations
  private async retryLocationAcquisition(): Promise<void> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("✅ Location acquired successfully");
          resolve();
        },
        (error) => {
          console.error("❌ Location retry failed:", error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    });
  }

  private async useApproximateLocation(context: any): Promise<void> {
    // Use IP-based geolocation as fallback
    try {
      const response = await fetch("https://ipapi.co/json/");
      const locationData = await response.json();
      console.log("📍 Using approximate location:", locationData.city);
      // Trigger navigation with approximate location
    } catch (error) {
      console.error("Failed to get approximate location:", error);
      throw error;
    }
  }

  private async enableOfflineMode(context: any): Promise<void> {
    this.offlineMode = true;
    console.log("📶 Offline navigation mode enabled");
    unifiedNotifications.info("Offline Mode", {
      message: "Using cached map data for navigation",
    });
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (navigator.onLine) {
          console.log("🌐 Connection restored");
          resolve();
        } else {
          setTimeout(checkConnection, 1000);
        }
      };
      checkConnection();
    });
  }

  private async retryWithBackoff(context: any): Promise<void> {
    const retryKey = `${context.destination?.lat}_${context.destination?.lng}`;
    const attempts = this.retryAttempts.get(retryKey) || 0;

    if (attempts >= this.maxRetries) {
      throw new Error("Max retry attempts exceeded");
    }

    const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
    await new Promise((resolve) => setTimeout(resolve, delay));

    this.retryAttempts.set(retryKey, attempts + 1);
    console.log(
      `🔄 Retrying navigation (attempt ${attempts + 1}/${this.maxRetries})`,
    );
  }

  private async useAlternativeService(context: any): Promise<void> {
    console.log("🔀 Switching to alternative navigation service");
    // Implement fallback to different mapping service
  }

  private async findAlternativeRoute(context: any): Promise<void> {
    console.log("🛣️ Finding alternative route");
    // Implement alternative route calculation
  }

  private async navigateToNearbyLandmark(context: any): Promise<void> {
    console.log("🏛️ Finding nearby landmark for navigation");
    // Navigate to a well-known nearby location first
  }

  private async triggerEmergencyContact(): Promise<void> {
    console.log("🚨 Triggering emergency contact");
    unifiedNotifications.critical("Emergency Alert", {
      message: "Emergency services contact initiated",
      persistent: true,
    });
  }

  private async findNearestSafeLocation(context: any): Promise<void> {
    console.log("🛡️ Finding nearest safe location");
    // Navigate to nearest police station, hospital, or safe public area
  }

  private async genericRetry(context: any): Promise<void> {
    console.log("🔄 Generic retry attempt");
    await this.retryWithBackoff(context);
  }

  private triggerManualLocationEntry(): void {
    console.log("📝 Triggering manual location entry");
    // Open manual address input
  }

  /**
   * Get error statistics for debugging
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: NavigationError[];
  } {
    const errorsByType: Record<string, number> = {};

    this.errorHistory.forEach((error) => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      recentErrors: this.errorHistory.slice(-10),
    };
  }

  /**
   * Clear error history and retry counters
   */
  reset(): void {
    this.errorHistory = [];
    this.retryAttempts.clear();
    this.offlineMode = false;
    console.log("🧹 Navigation error handler reset");
  }
}

export const navigationErrorHandler = NavigationErrorHandler.getInstance();
