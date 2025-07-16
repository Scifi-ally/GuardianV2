import { advancedSafetyScoring } from "./advancedSafetyScoring";
import { enhancedRouteCalculationService } from "./enhancedRouteCalculationService";
import { notifications } from "./enhancedNotificationService";
import type { SafetyLocation } from "./advancedSafetyScoring";

interface NavigationState {
  currentLocation: SafetyLocation | null;
  destination: SafetyLocation | null;
  isNavigating: boolean;
  currentRoute: any | null;
  lastSafetyCheck: number;
}

interface SafetyAlert {
  type: "warning" | "info" | "critical";
  title: string;
  message: string;
  shouldReroute: boolean;
  alternatives?: string[];
}

class BackgroundSafetyNavigationController {
  private static instance: BackgroundSafetyNavigationController;
  private navigationState: NavigationState = {
    currentLocation: null,
    destination: null,
    isNavigating: false,
    currentRoute: null,
    lastSafetyCheck: 0,
  };
  private safetyCheckInterval: NodeJS.Timeout | null = null;
  private readonly SAFETY_CHECK_INTERVAL = 120000; // 2 minutes
  private readonly CRITICAL_SAFETY_THRESHOLD = 25;
  private readonly WARNING_SAFETY_THRESHOLD = 40;
  private listeners: Map<string, Function[]> = new Map();

  static getInstance(): BackgroundSafetyNavigationController {
    if (!BackgroundSafetyNavigationController.instance) {
      BackgroundSafetyNavigationController.instance =
        new BackgroundSafetyNavigationController();
    }
    return BackgroundSafetyNavigationController.instance;
  }

  /**
   * Start background safety monitoring
   */
  startSafetyMonitoring(location: SafetyLocation) {
    this.navigationState.currentLocation = location;

    // Stop existing interval
    if (this.safetyCheckInterval) {
      clearInterval(this.safetyCheckInterval);
    }

    // Start continuous monitoring
    this.safetyCheckInterval = setInterval(() => {
      this.performSafetyCheck();
    }, this.SAFETY_CHECK_INTERVAL);

    // Perform initial safety check
    this.performSafetyCheck();

    console.log("🛡️ Background safety monitoring started");
  }

  /**
   * Stop background safety monitoring
   */
  stopSafetyMonitoring() {
    if (this.safetyCheckInterval) {
      clearInterval(this.safetyCheckInterval);
      this.safetyCheckInterval = null;
    }

    this.navigationState = {
      currentLocation: null,
      destination: null,
      isNavigating: false,
      currentRoute: null,
      lastSafetyCheck: 0,
    };

    console.log("🛡️ Background safety monitoring stopped");
  }

  /**
   * Update current location for continuous monitoring
   */
  updateLocation(location: SafetyLocation) {
    this.navigationState.currentLocation = location;

    // Trigger immediate safety check if location changed significantly
    const lastCheck = Date.now() - this.navigationState.lastSafetyCheck;
    if (lastCheck > 30000) {
      // 30 seconds since last check
      this.performSafetyCheck();
    }
  }

  /**
   * Set navigation destination
   */
  setDestination(destination: SafetyLocation) {
    this.navigationState.destination = destination;
    this.navigationState.isNavigating = true;

    // Immediately analyze route safety
    this.analyzeRouteSafety();
  }

  /**
   * Clear navigation destination
   */
  clearDestination() {
    this.navigationState.destination = null;
    this.navigationState.isNavigating = false;
    this.navigationState.currentRoute = null;
  }

  /**
   * Get current safety recommendations for navigation
   */
  getCurrentSafetyRecommendations(): {
    shouldProceed: boolean;
    currentScore: number;
    recommendations: string[];
    alternatives: string[];
  } {
    const currentScore = advancedSafetyScoring.getCurrentSafetyScore();
    const safetyFactors = advancedSafetyScoring.getSafetyFactors();

    const recommendations: string[] = [];
    const alternatives: string[] = [];
    let shouldProceed = true;

    if (currentScore < this.CRITICAL_SAFETY_THRESHOLD) {
      shouldProceed = false;
      recommendations.push("Consider postponing travel due to safety concerns");
      alternatives.push("Wait for improved conditions");
      alternatives.push("Use public transportation");
      alternatives.push("Request escort or ride-share");
    } else if (currentScore < this.WARNING_SAFETY_THRESHOLD) {
      recommendations.push("Exercise increased caution");
      recommendations.push("Stay in well-lit, populated areas");

      if (safetyFactors?.timeOfDay && safetyFactors.timeOfDay < 50) {
        recommendations.push("Consider traveling during daylight hours");
      }
    }

    // Add positive recommendations for good safety scores
    if (currentScore > 80) {
      recommendations.push("Excellent safety conditions for travel");
    } else if (currentScore > 60) {
      recommendations.push(
        "Good safety conditions - proceed with normal caution",
      );
    }

    return {
      shouldProceed,
      currentScore,
      recommendations,
      alternatives,
    };
  }

  /**
   * Get real-time route safety status
   */
  getRouteSafetyStatus(): {
    isRouteSafe: boolean;
    routeScore: number;
    concerns: string[];
    suggestions: string[];
  } {
    if (!this.navigationState.currentRoute) {
      return {
        isRouteSafe: true,
        routeScore: 50,
        concerns: [],
        suggestions: [],
      };
    }

    const routeScore = this.navigationState.currentRoute.safetyScore || 50;
    const concerns: string[] = [];
    const suggestions: string[] = [];

    if (routeScore < this.CRITICAL_SAFETY_THRESHOLD) {
      concerns.push("Route passes through high-risk areas");
      suggestions.push("Consider alternative route");
      suggestions.push("Travel with others if possible");
    }

    if (routeScore < this.WARNING_SAFETY_THRESHOLD) {
      concerns.push("Some safety considerations along route");
      suggestions.push("Stay alert and aware of surroundings");
    }

    return {
      isRouteSafe: routeScore > this.WARNING_SAFETY_THRESHOLD,
      routeScore,
      concerns,
      suggestions,
    };
  }

  /**
   * Register listener for safety events
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove listener for safety events
   */
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private async performSafetyCheck() {
    if (!this.navigationState.currentLocation) return;

    try {
      this.navigationState.lastSafetyCheck = Date.now();

      const currentScore = await advancedSafetyScoring.analyzeSafetyForLocation(
        this.navigationState.currentLocation,
      );

      // Check for safety alerts
      const alert = this.evaluateSafetyConditions(currentScore);

      if (alert) {
        this.emit("safety_alert", alert);

        // Show silent background notifications for critical issues only
        if (alert.type === "critical") {
          console.warn("🚨 Critical safety alert:", alert.message);
        }
      }

      // Re-evaluate route if navigating
      if (
        this.navigationState.isNavigating &&
        this.navigationState.destination
      ) {
        this.analyzeRouteSafety();
      }

      this.emit("safety_update", {
        score: currentScore,
        location: this.navigationState.currentLocation,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Background safety check failed:", error);
    }
  }

  private async analyzeRouteSafety() {
    if (
      !this.navigationState.currentLocation ||
      !this.navigationState.destination
    ) {
      return;
    }

    try {
      const routeAnalysis =
        await advancedSafetyScoring.calculateSafetyOptimizedRoute(
          this.navigationState.currentLocation,
          this.navigationState.destination,
          { prioritizeSafety: true },
        );

      this.navigationState.currentRoute = routeAnalysis;

      // Check if route needs updating
      if (routeAnalysis.score < this.WARNING_SAFETY_THRESHOLD) {
        const alert: SafetyAlert = {
          type:
            routeAnalysis.score < this.CRITICAL_SAFETY_THRESHOLD
              ? "critical"
              : "warning",
          title: "Route Safety Update",
          message: `Current route safety score: ${routeAnalysis.score}/100`,
          shouldReroute: routeAnalysis.score < this.CRITICAL_SAFETY_THRESHOLD,
          alternatives: routeAnalysis.alternativeRecommendation
            ? [routeAnalysis.alternativeRecommendation]
            : [],
        };

        this.emit("route_safety_alert", alert);
      }

      this.emit("route_analysis_complete", routeAnalysis);
    } catch (error) {
      console.error("Route safety analysis failed:", error);
    }
  }

  private evaluateSafetyConditions(currentScore: number): SafetyAlert | null {
    const safetyFactors = advancedSafetyScoring.getSafetyFactors();

    if (currentScore < this.CRITICAL_SAFETY_THRESHOLD) {
      return {
        type: "critical",
        title: "Critical Safety Alert",
        message: "Current area has significant safety concerns",
        shouldReroute: true,
        alternatives: [
          "Move to a safer area immediately",
          "Contact emergency services if needed",
          "Find public transportation or call for help",
        ],
      };
    }

    if (currentScore < this.WARNING_SAFETY_THRESHOLD) {
      const concerns: string[] = [];

      if (safetyFactors?.crime && safetyFactors.crime < 40) {
        concerns.push("elevated crime risk");
      }
      if (safetyFactors?.lighting && safetyFactors.lighting < 40) {
        concerns.push("poor lighting conditions");
      }
      if (
        safetyFactors?.emergencyServices &&
        safetyFactors.emergencyServices < 40
      ) {
        concerns.push("limited emergency response");
      }

      if (concerns.length > 0) {
        return {
          type: "warning",
          title: "Safety Advisory",
          message: `Detected ${concerns.join(", ")} in current area`,
          shouldReroute: false,
          alternatives: [
            "Exercise increased caution",
            "Stay in well-populated areas",
            "Consider alternative timing",
          ],
        };
      }
    }

    return null;
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in safety event listener for ${event}:`, error);
        }
      });
    }
  }
}

export const backgroundSafetyNavigationController =
  BackgroundSafetyNavigationController.getInstance();
export type { SafetyAlert, NavigationState };
