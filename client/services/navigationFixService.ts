/**
 * Navigation Fix Service
 * Resolves common navigation issues and provides error recovery
 */

import { enhancedNavigationService } from "./enhancedNavigationService";
import { unifiedNotifications } from "./unifiedNotificationService";
import { enhancedLocationService } from "./enhancedLocationService";

interface NavigationDiagnostic {
  googleMapsLoaded: boolean;
  locationPermission: boolean;
  currentLocation: boolean;
  internetConnection: boolean;
  apiKey: boolean;
  directionsService: boolean;
}

interface NavigationError {
  code: string;
  message: string;
  solution: string;
  priority: "low" | "medium" | "high" | "critical";
}

class NavigationFixService {
  private static instance: NavigationFixService;
  private isFixing = false;
  private lastDiagnostic: NavigationDiagnostic | null = null;

  static getInstance(): NavigationFixService {
    if (!NavigationFixService.instance) {
      NavigationFixService.instance = new NavigationFixService();
    }
    return NavigationFixService.instance;
  }

  // Comprehensive navigation diagnostics
  async diagnoseNavigationIssues(): Promise<NavigationDiagnostic> {
    console.log("🔍 Running navigation diagnostics...");

    const diagnostic: NavigationDiagnostic = {
      googleMapsLoaded: false,
      locationPermission: false,
      currentLocation: false,
      internetConnection: false,
      apiKey: false,
      directionsService: false,
    };

    try {
      // Check Google Maps API
      diagnostic.googleMapsLoaded = !!(
        window.google?.maps?.Map &&
        window.google?.maps?.DirectionsService &&
        window.google?.maps?.places?.PlacesService
      );

      // Check internet connection
      diagnostic.internetConnection = navigator.onLine;

      // Check API key (basic validation)
      diagnostic.apiKey =
        document
          .querySelector('script[src*="maps.googleapis.com"]')
          ?.getAttribute("src")
          ?.includes("key=") || false;

      // Check location permission
      if ("geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 30000,
              });
            },
          );
          diagnostic.locationPermission = true;
          diagnostic.currentLocation = !!(
            position.coords.latitude && position.coords.longitude
          );
        } catch (error) {
          diagnostic.locationPermission = false;
          diagnostic.currentLocation = false;
        }
      }

      // Check DirectionsService functionality
      if (diagnostic.googleMapsLoaded) {
        try {
          const directionsService = new google.maps.DirectionsService();
          diagnostic.directionsService = !!directionsService;
        } catch (error) {
          diagnostic.directionsService = false;
        }
      }

      this.lastDiagnostic = diagnostic;
      console.log("📊 Navigation diagnostic results:", diagnostic);
      return diagnostic;
    } catch (error) {
      console.error("❌ Navigation diagnostic failed:", error);
      return diagnostic;
    }
  }

  // Identify navigation errors based on diagnostic
  identifyNavigationErrors(
    diagnostic: NavigationDiagnostic,
  ): NavigationError[] {
    const errors: NavigationError[] = [];

    if (!diagnostic.internetConnection) {
      errors.push({
        code: "NO_INTERNET",
        message: "No internet connection detected",
        solution:
          "Check your internet connection and try again. Navigation requires an active internet connection.",
        priority: "critical",
      });
    }

    if (!diagnostic.googleMapsLoaded) {
      errors.push({
        code: "GOOGLE_MAPS_NOT_LOADED",
        message: "Google Maps API failed to load",
        solution:
          "Refresh the page to reload Google Maps. Check if your internet connection is stable.",
        priority: "critical",
      });
    }

    if (!diagnostic.apiKey) {
      errors.push({
        code: "INVALID_API_KEY",
        message: "Google Maps API key is missing or invalid",
        solution:
          "Contact support. The Google Maps API key needs to be configured properly.",
        priority: "critical",
      });
    }

    if (!diagnostic.locationPermission) {
      errors.push({
        code: "LOCATION_PERMISSION_DENIED",
        message: "Location access is denied",
        solution:
          'Allow location access in your browser settings or click the location icon (🔒) in the address bar and select "Allow".',
        priority: "high",
      });
    }

    if (diagnostic.locationPermission && !diagnostic.currentLocation) {
      errors.push({
        code: "LOCATION_UNAVAILABLE",
        message: "Unable to determine current location",
        solution:
          "Move to an area with better GPS signal or manually enter your starting location.",
        priority: "medium",
      });
    }

    if (diagnostic.googleMapsLoaded && !diagnostic.directionsService) {
      errors.push({
        code: "DIRECTIONS_SERVICE_ERROR",
        message: "Navigation service is not available",
        solution:
          "Refresh the page to reinitialize navigation services. This is usually a temporary issue.",
        priority: "high",
      });
    }

    return errors;
  }

  // Auto-fix navigation issues where possible
  async autoFixNavigationIssues(): Promise<{
    fixed: boolean;
    errors: NavigationError[];
    fixedIssues: string[];
  }> {
    if (this.isFixing) {
      return { fixed: false, errors: [], fixedIssues: [] };
    }

    this.isFixing = true;
    console.log("🔧 Starting auto-fix for navigation issues...");

    try {
      const diagnostic = await this.diagnoseNavigationIssues();
      const errors = this.identifyNavigationErrors(diagnostic);
      const fixedIssues: string[] = [];

      // Attempt to fix location permission issues
      if (!diagnostic.locationPermission) {
        try {
          await enhancedLocationService.getCurrentLocation();
          fixedIssues.push("Location permission granted");
        } catch (error) {
          console.log("Location permission still denied");
        }
      }

      // Attempt to reload Google Maps if needed
      if (!diagnostic.googleMapsLoaded && navigator.onLine) {
        try {
          await this.reloadGoogleMaps();
          fixedIssues.push("Google Maps API reloaded");
        } catch (error) {
          console.error("Failed to reload Google Maps:", error);
        }
      }

      // Re-run diagnostic after fixes
      const updatedDiagnostic = await this.diagnoseNavigationIssues();
      const remainingErrors = this.identifyNavigationErrors(updatedDiagnostic);

      const criticalErrorsFixed =
        errors.filter((e) => e.priority === "critical").length >
        remainingErrors.filter((e) => e.priority === "critical").length;

      console.log(`✅ Auto-fix completed. Fixed: ${fixedIssues.length} issues`);

      return {
        fixed: fixedIssues.length > 0 || criticalErrorsFixed,
        errors: remainingErrors,
        fixedIssues,
      };
    } finally {
      this.isFixing = false;
    }
  }

  // Reload Google Maps API
  private async reloadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Remove existing Google Maps script
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]',
      );
      if (existingScript) {
        existingScript.remove();
      }

      // Clean up Google Maps object
      if (window.google) {
        delete (window as any).google;
      }

      // Reload the script
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async`;
      script.async = true;

      script.onload = () => {
        console.log("✅ Google Maps API reloaded successfully");
        resolve();
      };

      script.onerror = () => {
        console.error("❌ Failed to reload Google Maps API");
        reject(new Error("Failed to reload Google Maps API"));
      };

      document.head.appendChild(script);

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error("Google Maps API reload timeout"));
      }, 10000);
    });
  }

  // Fix specific navigation error
  async fixNavigationError(errorCode: string): Promise<boolean> {
    console.log(`🔧 Attempting to fix navigation error: ${errorCode}`);

    switch (errorCode) {
      case "LOCATION_PERMISSION_DENIED":
        return this.fixLocationPermission();

      case "GOOGLE_MAPS_NOT_LOADED":
        return this.fixGoogleMapsLoading();

      case "DIRECTIONS_SERVICE_ERROR":
        return this.fixDirectionsService();

      case "NO_INTERNET":
        return this.checkInternetConnection();

      default:
        console.warn(`No fix available for error: ${errorCode}`);
        return false;
    }
  }

  // Fix location permission issues
  private async fixLocationPermission(): Promise<boolean> {
    try {
      const position = await enhancedLocationService.getCurrentLocation();
      if (position) {
        console.log("✅ Location permission fixed");
        return true;
      }
    } catch (error) {
      console.error("❌ Cannot fix location permission:", error);
    }
    return false;
  }

  // Fix Google Maps loading issues
  private async fixGoogleMapsLoading(): Promise<boolean> {
    try {
      await this.reloadGoogleMaps();
      return !!window.google?.maps?.Map;
    } catch (error) {
      console.error("❌ Cannot fix Google Maps loading:", error);
      return false;
    }
  }

  // Fix DirectionsService issues
  private async fixDirectionsService(): Promise<boolean> {
    try {
      if (window.google?.maps?.DirectionsService) {
        // Test DirectionsService
        const directionsService = new google.maps.DirectionsService();
        console.log("✅ DirectionsService restored");
        return true;
      }
    } catch (error) {
      console.error("❌ Cannot fix DirectionsService:", error);
    }
    return false;
  }

  // Check internet connection
  private async checkInternetConnection(): Promise<boolean> {
    try {
      const response = await fetch("https://www.google.com/favicon.ico", {
        mode: "no-cors",
        cache: "no-cache",
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Safe navigation start with error handling
  async startNavigationSafely(
    destination: { lat: number; lng: number; name?: string },
    origin?: { lat: number; lng: number },
  ): Promise<boolean> {
    try {
      // Pre-flight check
      const diagnostic = await this.diagnoseNavigationIssues();
      const errors = this.identifyNavigationErrors(diagnostic);

      // Check for critical errors
      const criticalErrors = errors.filter((e) => e.priority === "critical");
      if (criticalErrors.length > 0) {
        console.error(
          "❌ Critical navigation errors detected:",
          criticalErrors,
        );

        // Attempt auto-fix
        const fixResult = await this.autoFixNavigationIssues();
        if (!fixResult.fixed) {
          this.showNavigationErrorDialog(criticalErrors);
          return false;
        }
      }

      // Start navigation
      console.log("🧭 Starting safe navigation...");
      await enhancedNavigationService.startNavigation(
        destination,
        origin,
        "driving",
      );

      unifiedNotifications.success("Navigation Started", {
        message: `Navigating to ${destination.name || "destination"}`,
      });

      return true;
    } catch (error) {
      console.error("❌ Navigation start failed:", error);

      // Show user-friendly error message
      this.showNavigationFailureMessage(error as Error);
      return false;
    }
  }

  // Show navigation error dialog
  private showNavigationErrorDialog(errors: NavigationError[]) {
    const primaryError = errors[0];
    unifiedNotifications.error("Navigation Error", {
      message: primaryError.message,
      persistent: true,
    });
  }

  // Show navigation failure message
  private showNavigationFailureMessage(error: Error) {
    let userMessage = "Navigation failed to start. ";

    if (error.message.includes("ZERO_RESULTS")) {
      userMessage += "No route found to the destination.";
    } else if (error.message.includes("OVER_QUERY_LIMIT")) {
      userMessage += "Too many requests. Please try again in a moment.";
    } else if (error.message.includes("REQUEST_DENIED")) {
      userMessage += "Navigation service is not available.";
    } else {
      userMessage += "Please check your internet connection and try again.";
    }

    unifiedNotifications.error("Navigation Failed", {
      message: userMessage,
    });
  }

  // Get navigation health status
  getNavigationHealthStatus(): {
    status: "healthy" | "degraded" | "error";
    lastCheck: Date | null;
    issues: number;
  } {
    if (!this.lastDiagnostic) {
      return { status: "error", lastCheck: null, issues: 0 };
    }

    const errors = this.identifyNavigationErrors(this.lastDiagnostic);
    const criticalErrors = errors.filter((e) => e.priority === "critical");

    if (criticalErrors.length > 0) {
      return { status: "error", lastCheck: new Date(), issues: errors.length };
    } else if (errors.length > 0) {
      return {
        status: "degraded",
        lastCheck: new Date(),
        issues: errors.length,
      };
    } else {
      return { status: "healthy", lastCheck: new Date(), issues: 0 };
    }
  }

  // Manual navigation troubleshooting
  async runNavigationTroubleshooter(): Promise<{
    diagnostic: NavigationDiagnostic;
    errors: NavigationError[];
    recommendations: string[];
  }> {
    console.log("🔍 Running navigation troubleshooter...");

    const diagnostic = await this.diagnoseNavigationIssues();
    const errors = this.identifyNavigationErrors(diagnostic);

    const recommendations = [
      "Ensure you have a stable internet connection",
      "Allow location access when prompted",
      "Refresh the page if navigation seems unresponsive",
      "Try entering destinations manually if search isn't working",
      "Clear browser cache if problems persist",
    ];

    // Add specific recommendations based on errors
    if (errors.some((e) => e.code === "LOCATION_PERMISSION_DENIED")) {
      recommendations.unshift(
        'Click the location icon in your browser\'s address bar and select "Allow"',
      );
    }

    if (errors.some((e) => e.code === "GOOGLE_MAPS_NOT_LOADED")) {
      recommendations.unshift("Refresh the page to reload Google Maps");
    }

    return { diagnostic, errors, recommendations };
  }
}

export const navigationFixService = NavigationFixService.getInstance();
