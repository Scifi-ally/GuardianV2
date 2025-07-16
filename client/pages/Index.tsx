import { useState, useCallback, useEffect } from "react";
import { useLocation as useRouterLocation } from "react-router-dom";
import { notifications } from "@/services/enhancedNotificationService";
import {
  Navigation,
  MapPin,
  Route,
  ArrowRight,
  Settings,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Navigation2,
  RefreshCw,
  Locate,
  Footprints,
  Car,
  Bike,
  Activity,
  Target,
  Wifi,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { RealTimeGoogleMapsClone } from "@/components/RealTimeGoogleMapsClone";
import { advancedSafetyScoring } from "@/services/advancedSafetyScoring";

import { SlideUpPanel } from "@/components/SlideUpPanel";
import { MagicNavbar } from "@/components/MagicNavbar";
// Removed redundant useGeolocation - handled by LocationAwareMap
import { useMapTheme } from "@/hooks/use-map-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminDebug } from "@/services/adminDebugService";
import { useGestures, GestureGuide } from "@/hooks/useGestures";
import { advancedGestureController } from "@/services/advancedGestureController";

import { unifiedNotifications } from "@/services/unifiedNotificationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ComprehensiveSafetySystem } from "@/components/ComprehensiveSafetySystem";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// Debug helper removed - Firebase admin control only

import { CustomCheckbox } from "@/components/ui/custom-checkbox";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

// Removed redundant notification imports
import { LocationSharingInfoButton } from "@/components/LocationSharingInfo";
import AINavigationPanel from "@/components/AINavigationPanel";
import { useRealTime } from "@/hooks/useRealTime";
import { RealTimeStatusIndicator } from "@/components/RealTimeStatusIndicator";
import { emergencyContactActionsService } from "@/services/emergencyContactActionsService";
import { realTimeService } from "@/services/realTimeService";
import { emergencyBatteryService } from "@/services/emergencyBatteryService";
import { emergencyReadinessService } from "@/services/emergencyReadinessService";
import { sharedLocationService } from "@/services/sharedLocationService";
import { batteryOptimizationService } from "@/services/batteryOptimizationService";
import { emergencyErrorHandler } from "@/services/emergencyErrorHandler";
import { offlineEmergencyService } from "@/services/offlineEmergencyService";
import { productionPerformanceService } from "@/services/productionPerformanceService";
import { productionSafeguardsService } from "@/services/productionSafeguardsService";
import { LocationPermissionPrompt } from "@/components/LocationPermissionPrompt";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import { RouteSelection } from "@/components/RouteSelection";
import { enhancedRouteCalculationService } from "@/services/enhancedRouteCalculationService";
import { backgroundSafetyNavigationController } from "@/services/backgroundSafetyNavigationController";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { SimpleSearchBar } from "@/components/SimpleSearchBar";

import { EmergencyAlerts } from "@/components/EmergencyAlerts";
import { EmergencyServicesPanel } from "@/components/EmergencyServicesPanel";
import { SafetyDebugPanel } from "@/components/SafetyDebugPanel";

// Removed deprecated component import
import { PerformanceOptimizer } from "@/components/PerformanceOptimizer";

import {
  notificationSettingsService,
  shouldShowNotification,
} from "@/services/notificationSettingsService";

// ClickableFixes removed - debug component
import { areaBasedSafety } from "@/services/areaBasedSafety";
import { realTimeDataService } from "@/services/realTimeDataService";
import {
  SmartLocationDisplay,
  useLocationName,
} from "@/components/SmartLocationDisplay";

// AdminDebugContent removed - Firebase admin control only

export default function Index() {
  // Real-time data management
  const {
    location: realTimeLocation,
    isLocationTracking,
    stats,
    traffic,
    connectionState,
  } = useRealTime();

  // Legacy location state (for compatibility with existing components)
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);

  // Update legacy location when real-time location changes
  useEffect(() => {
    if (realTimeLocation) {
      setLocation({
        latitude: realTimeLocation.latitude,
        longitude: realTimeLocation.longitude,
      });

      // Update background safety monitoring
      backgroundSafetyNavigationController.updateLocation({
        latitude: realTimeLocation.latitude,
        longitude: realTimeLocation.longitude,
      });
    }
  }, [realTimeLocation]);

  // Initialize background safety monitoring
  useEffect(() => {
    if (location) {
      backgroundSafetyNavigationController.startSafetyMonitoring({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Listen for safety alerts (background processing only - no UI notifications)
      const handleSafetyAlert = (alert: any) => {
        console.log("🛡️ Background safety alert:", alert);
        // Safety processing happens silently in background
      };

      const handleRouteAlert = (alert: any) => {
        console.log("🗺️ Background route safety update:", alert);
        // Route safety influences navigation decisions automatically
      };

      backgroundSafetyNavigationController.on(
        "safety_alert",
        handleSafetyAlert,
      );
      backgroundSafetyNavigationController.on(
        "route_safety_alert",
        handleRouteAlert,
      );

      return () => {
        backgroundSafetyNavigationController.off(
          "safety_alert",
          handleSafetyAlert,
        );
        backgroundSafetyNavigationController.off(
          "route_safety_alert",
          handleRouteAlert,
        );
        backgroundSafetyNavigationController.stopSafetyMonitoring();
      };
    }
  }, [location]);

  // Get router location state for QR navigation
  const routerLocation = useRouterLocation();
  const qrTargetLocation = routerLocation.state?.targetLocation;

  // Using enhanced notification system instead of deprecated SlideDownNotifications
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInstructions, setRouteInstructions] = useState<string[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAIFeaturesPanel, setShowAIFeaturesPanel] = useState(true);
  const [destination, setDestination] = useState<
    { latitude: number; longitude: number } | undefined
  >(undefined);

  // Initialize emergency services and battery optimization
  useEffect(() => {
    // Start emergency battery monitoring
    emergencyBatteryService.startMonitoring();

    // Start emergency readiness monitoring (silent mode)
    emergencyReadinessService.startPeriodicChecks();

    // Initialize battery optimization service
    batteryOptimizationService.initialize();

    // Initialize production services
    console.log("🏭 Production services initialized:", {
      performance: "active",
      safeguards: "monitoring",
      accessibility: "ready",
    });

    // Initialize emergency systems
    try {
      // Update offline emergency data with current user
      if (userProfile) {
        offlineEmergencyService.updateUserProfile(userProfile);
        if (userProfile.emergencyContacts) {
          offlineEmergencyService.updateEmergencyContacts(
            userProfile.emergencyContacts,
          );
        }
      }
    } catch (error) {
      emergencyErrorHandler.handleEmergencyError({
        type: "system",
        severity: "medium",
        message: "Failed to initialize emergency systems",
        context: "app_startup",
      });
    }

    // Removed automatic readiness report display to reduce alert noise

    return () => {
      emergencyBatteryService.stopMonitoring();
      emergencyReadinessService.stopPeriodicChecks();
    };
  }, []);

  // Initialize advanced gesture system
  useEffect(() => {
    // Initialize advanced gesture controller
    advancedGestureController.initialize().catch(console.error);

    return () => {
      advancedGestureController.cleanup();
    };
  }, []);

  // Initialize gesture system for enhanced usability
  const { gesturesEnabled, setGesturesEnabled } = useGestures({
    onSOSActivated: () => {
      unifiedNotifications.sos({
        title: "�� Gesture SOS Activated",
        message:
          "Emergency SOS triggered by rapid taps or shake - immediate assistance needed!",
      });
    },
    onQuickShare: async () => {
      const shareText = `Emergency location shared via gesture`;
      navigator.clipboard?.writeText(shareText);
      unifiedNotifications.success("Location copied to clipboard via gesture");
    },
  });
  const [turnByTurnInstructions, setTurnByTurnInstructions] = useState<
    Array<{
      instruction: string;
      distance: string;
      duration: string;
      maneuver?: string;
    }>
  >([]);
  const [routeSummary, setRouteSummary] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [travelMode, setTravelMode] = useState<
    "WALKING" | "DRIVING" | "BICYCLING"
  >("WALKING"); // Default to walking for safety
  const [routeSettings, setRouteSettings] = useState({
    showTraffic: false,
    satelliteView: false,
    showSafeZones: false,
    showEmergencyServices: false,
    showSafeAreaCircles: false,
    zoomLevel: 15,
  });

  // Location handling moved to LocationAwareMap
  const {
    mapTheme,
    mapType,
    toggleTheme,
    toggleMapType,
    setMapTheme,
    setMapType,
  } = useMapTheme();

  // Battery optimization state
  const [batterySaverMode, setBatterySaverMode] = useState(false);

  // Listen for battery optimization changes
  useEffect(() => {
    const handleOptimizationUpdate = (settings: any) => {
      if (settings.disableNonSafetyFeatures) {
        // Disable non-safety features
        setRouteSettings((prev) => ({
          ...prev,
          showTraffic: false,
          showSafeAreaCircles: false,
        }));

        // Disable AI features panel
        setShowAIFeaturesPanel(false);
      }
    };

    batteryOptimizationService.on(
      "optimizations:update",
      handleOptimizationUpdate,
    );

    return () => {
      batteryOptimizationService.off(
        "optimizations:update",
        handleOptimizationUpdate,
      );
    };
  }, []);

  const { userProfile } = useAuth();
  const {
    shouldShowLocationDebug,
    shouldShowSystemInfo,
    isDebugEnabled,
    shouldShowSafetyCalculationBasis,
    safetyDebugData,
  } = useAdminDebug();

  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  const [routeOptions, setRouteOptions] = useState<{
    safestRoute: any;
    quickestRoute: any;
    recommendedRoute: "safest" | "quickest";
  } | null>(null);
  const [showRouteSelection, setShowRouteSelection] = useState(false);

  const emergencyContacts = userProfile?.emergencyContacts || [];

  // Route planning function (removed - now integrated into handleSearch)

  const handleRouteSelect = useCallback(
    async (route: any) => {
      setShowRouteSelection(false);
      const finalDestination = {
        latitude: route.waypoints[route.waypoints.length - 1].latitude,
        longitude: route.waypoints[route.waypoints.length - 1].longitude,
      };

      // Use advanced safety scoring to optimize route
      if (location) {
        try {
          const safetyOptimizedRoute =
            await advancedSafetyScoring.calculateSafetyOptimizedRoute(
              { latitude: location.latitude, longitude: location.longitude },
              finalDestination,
              { prioritizeSafety: true },
            );

          // Log safety analysis results for navigation decisions
          console.log("Safety-optimized route calculated:", {
            score: safetyOptimizedRoute.score,
            risks: safetyOptimizedRoute.risks,
            advantages: safetyOptimizedRoute.advantages,
            recommendation: safetyOptimizedRoute.alternativeRecommendation,
          });

          // Show warning if route has significant safety concerns
          if (
            safetyOptimizedRoute.score < 40 &&
            safetyOptimizedRoute.alternativeRecommendation
          ) {
            notifications.warning({
              title: "Route Safety Notice",
              description: safetyOptimizedRoute.alternativeRecommendation,
              vibrate: true,
            });
          }
        } catch (error) {
          console.error("Safety route optimization failed:", error);
        }
      }

      setDestination(finalDestination);
      setIsNavigating(true);

      // Update background safety controller with new destination
      backgroundSafetyNavigationController.setDestination(finalDestination);
    },
    [location],
  );

  // Initialize real-time data monitoring
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        // Start real-time tracking with error handling
        await realTimeDataService.startTracking();

        const status = realTimeDataService.getLocationStatus();

        // Removed automatic location notifications - only show on user action
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("��� Failed to initialize location tracking:", {
          error: errorMessage,
          type: (error as any)?.constructor?.name || typeof error,
        });

        // Location error notification removed - no slide down notifications
      }
    };

    initializeTracking();

    // Safety updates notification removed - no slide down notifications

    // Safety calculation now only during navigation - removed auto-notifications

    return () => {
      realTimeDataService.stopTracking();
    };
  }, [location]);

  // Auto-populate emergency contact locations when user location and contacts are available
  useEffect(() => {
    if (
      location &&
      userProfile?.emergencyContacts &&
      userProfile.emergencyContacts.length > 0
    ) {
      sharedLocationService.autoPopulateEmergencyContactLocations(
        { latitude: location.latitude, longitude: location.longitude },
        userProfile.emergencyContacts,
      );

      // Start simulation for movement
      sharedLocationService.startEmergencyContactSimulation();

      // Emergency contacts notification removed - no slide down notifications
    }
  }, [location, userProfile?.emergencyContacts]);

  // Handle QR code location targeting
  useEffect(() => {
    if (qrTargetLocation) {
      // Set destination from QR code
      setDestination({
        latitude: qrTargetLocation.lat,
        longitude: qrTargetLocation.lng,
      });

      // Set toLocation for display
      setToLocation(
        `QR Location: ${qrTargetLocation.lat.toFixed(4)}, ${qrTargetLocation.lng.toFixed(4)}`,
      );

      // Show notification
      notifications.success({
        title: "QR Location Loaded",
        description: "Location from QR code set as destination",
        vibrate: true,
      });

      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [qrTargetLocation]);

  const handleDirectionsChange = useCallback(
    (directions: google.maps.DirectionsResult | null) => {
      if (!directions || !directions.routes || directions.routes.length === 0) {
        setTurnByTurnInstructions([]);
        setRouteSummary(null);
        return;
      }

      const route = directions.routes[0];
      const leg = route.legs[0];

      // Extract route summary
      setRouteSummary({
        distance: leg.distance?.text || "Unknown distance",
        duration: leg.duration?.text || "Unknown duration",
      });

      // Extract step-by-step instructions
      const steps =
        leg.steps?.map((step, index) => ({
          instruction:
            step.instructions?.replace(/<[^>]*>/g, "") || `Step ${index + 1}`,
          distance: step.distance?.text || "",
          duration: step.duration?.text || "",
          maneuver: step.maneuver || undefined,
        })) || [];

      setTurnByTurnInstructions(steps);

      // Also update the basic route instructions for backward compatibility
      const basicInstructions = steps.map(
        (step, index) => `${index + 1}. ${step.instruction} (${step.distance})`,
      );
      setRouteInstructions(basicInstructions);
    },
    [],
  );

  const handleSearch = useCallback(async () => {
    if (!toLocation) {
      notifications.warning({
        title: "Missing Destination",
        description: "Please enter where you'd like to go.",
        vibrate: true,
      });
      return;
    }

    if (!location) {
      notifications.error({
        title: "Location Required",
        description: "Please enable location access to get directions.",
        vibrate: true,
      });
      return;
    }

    setIsNavigating(true);

    try {
      // Geocode the destination to get coordinates
      let destinationCoords = destination;

      if (!destinationCoords) {
        const geocoder = new google.maps.Geocoder();
        const geocodeResult = await new Promise<google.maps.GeocoderResult[]>(
          (resolve, reject) => {
            geocoder.geocode({ address: toLocation }, (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results) {
                resolve(results);
              } else {
                reject(new Error(`Could not find "${toLocation}"`));
              }
            });
          },
        );

        if (geocodeResult.length > 0) {
          const coords = {
            latitude: geocodeResult[0].geometry.location.lat(),
            longitude: geocodeResult[0].geometry.location.lng(),
          };
          destinationCoords = coords;
          setDestination(coords);
        }
      }

      if (!destinationCoords) {
        throw new Error("Could not find destination");
      }

      // Calculate routes using real Google Directions API with safety analysis
      try {
        const routes = await enhancedRouteCalculationService.calculateRoutes(
          { latitude: location.latitude, longitude: location.longitude },
          {
            latitude: destinationCoords.latitude,
            longitude: destinationCoords.longitude,
          },
        );

        // Enhance route options with safety scoring
        if (routes.safestRoute) {
          const safetyAnalysis =
            await advancedSafetyScoring.calculateSafetyOptimizedRoute(
              { latitude: location.latitude, longitude: location.longitude },
              {
                latitude: destinationCoords.latitude,
                longitude: destinationCoords.longitude,
              },
              { prioritizeSafety: true },
            );

          // Log safety analysis for internal use
          console.log("Route safety analysis:", {
            destinationSafetyScore: safetyAnalysis.score,
            risks: safetyAnalysis.risks,
            advantages: safetyAnalysis.advantages,
          });

          // Automatically recommend safest route if significant safety difference
          if (safetyAnalysis.score > 70) {
            routes.recommendedRoute = "safest";
          }
        }

        setRouteOptions(routes);
        setShowRouteSelection(true);

        notifications.success({
          title: "Routes Found",
          description: "Choose your preferred route to start navigation.",
          vibrate: true,
        });
      } catch (routeError) {
        console.error("Route calculation error:", routeError);
        notifications.error({
          title: "Route Planning Failed",
          description: "Unable to calculate routes. Please try again.",
          vibrate: true,
        });
      }

      setIsNavigating(false);
    } catch (error) {
      console.error("Navigation error:", error);
      notifications.error({
        title: "Navigation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not calculate route. Please try again.",
        vibrate: true,
      });
      setIsNavigating(false);
    }
  }, [toLocation, destination, location]);

  // Auto-set current location
  useEffect(() => {
    if (location && !fromLocation) {
      // Auto-geocode current location for display
      const geocodeCurrentLocation = async () => {
        try {
          if (window.google?.maps) {
            const geocoder = new google.maps.Geocoder();
            const latlng = { lat: location.latitude, lng: location.longitude };

            geocoder.geocode({ location: latlng }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                const result = results[0];
                const components = result.address_components;

                // Extract city or neighborhood
                let locationName = "Current Location";
                for (const component of components) {
                  if (component.types.includes("locality")) {
                    locationName = component.long_name;
                    break;
                  } else if (component.types.includes("sublocality")) {
                    locationName = component.long_name;
                    break;
                  }
                }

                setFromLocation(locationName);
              } else {
                setFromLocation("Current Location");
              }
            });
          } else {
            setFromLocation("Current Location");
          }
        } catch (error) {
          setFromLocation("Current Location");
        }
      };

      geocodeCurrentLocation();
    }
  }, [location, fromLocation]);

  // Route refreshes automatically when destination changes
  // SOS functionality is handled by MagicNavbar component

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <PerformanceOptimizer />
        {/* ClickableFixes removed - debug component */}
        {/* Compact Navigation Header - Reduced Height */}

        {/* Clear Route Button */}
        {destination && (
          <div className="container mx-auto px-3 py-1">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button
                onClick={() => {
                  setDestination(undefined);
                  setIsNavigating(false);
                  setRouteInstructions([]);
                  setTurnByTurnInstructions([]);
                  setRouteSummary(null);

                  // Clear destination from background safety controller
                  backgroundSafetyNavigationController.clearDestination();

                  unifiedNotifications.success("Route cleared", {
                    message: "Navigation route has been removed",
                  });
                }}
                size="sm"
                variant="outline"
                className="w-full h-10 text-sm bg-gradient-to-r from-white to-red-50 hover:from-red-50 hover:to-red-100 border-2 border-red-200 hover:border-red-300 text-red-700 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Clear Route
              </Button>
            </motion.div>
          </div>
        )}

        {/* Transportation mode simplified to walking by default */}
        {/* Notifications handled by UnifiedNotificationSystem */}

        {/* Emergency Alerts */}
        <EmergencyAlerts />

        {/* AI Navigation Panel */}
        <AINavigationPanel
          isVisible={showAIPanel}
          onClose={() => setShowAIPanel(false)}
        />

        {/* Location Permission Prompt removed */}

        {/* Real-Time Google Maps Clone with Integrated Safety Analysis */}
        <div className="absolute inset-0 top-0 z-10">
          <RealTimeGoogleMapsClone
            onLocationChange={(newLocation) => {
              setLocation(newLocation);

              // Update background safety monitoring
              backgroundSafetyNavigationController.updateLocation(newLocation);
            }}
            onDestinationSet={(dest) => {
              setDestination(dest);
              setIsNavigating(true);

              // Update background safety controller with new destination
              backgroundSafetyNavigationController.setDestination(dest);

              // Auto-geocode destination for display
              if (window.google?.maps) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode(
                  { location: { lat: dest.latitude, lng: dest.longitude } },
                  (results, status) => {
                    if (status === "OK" && results && results[0]) {
                      setToLocation(results[0].formatted_address);
                    }
                  },
                );
              }
            }}
            className="w-full h-full"
          />
        </div>

        {/* Real-Time Status Indicator removed - no accuracy/offline display */}

        {/* Notification Permission Prompt */}
        <NotificationPermissionPrompt
          onClose={() => setShowNotificationPrompt(false)}
          autoShow={true}
        />

        {/* Route Selection Modal */}
        {showRouteSelection && routeOptions && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <RouteSelection
                safestRoute={routeOptions.safestRoute}
                quickestRoute={routeOptions.quickestRoute}
                recommendedRoute={routeOptions.recommendedRoute}
                onRouteSelect={handleRouteSelect}
                onClose={() => setShowRouteSelection(false)}
              />
            </div>
          </div>
        )}

        {/* Enhanced Professional Slide Up Panel */}
        <SlideUpPanel
          minHeight={100}
          maxHeight={Math.floor(window.innerHeight * 0.8)}
          initialHeight={
            destination ? Math.floor(window.innerHeight * 0.35) : 120
          }
          bottomOffset={75}
          collapsedHeight={30}
          onTouchOutside={() => {}}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Tabs
              defaultValue={isNavigating ? "navigation" : "navigation"}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-12 bg-white/95 backdrop-blur-xl rounded-xl p-1 shadow-xl border border-gray-100">
                <TabsTrigger
                  value="navigation"
                  className="text-sm h-9 font-bold rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:scale-[1.02]"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  NAVIGATION
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="text-sm h-9 font-bold rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-700 data-[state=active]:to-gray-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:scale-[1.02]"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  SETTINGS
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="navigation"
                className="mt-3 space-y-3 transform transition-all duration-200 ease-out"
              >
                {isNavigating && turnByTurnInstructions.length > 0 ? (
                  // Navigation Instructions
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-blue-900">
                        <Navigation className="h-5 w-5 text-blue-600" />
                        Active Navigation
                      </h3>
                      <Badge className="bg-blue-600 text-white font-semibold px-3 py-1 rounded-full">
                        Live
                      </Badge>
                    </div>

                    {/* Enhanced Route Summary */}
                    {routeSummary && (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                      >
                        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-600 rounded-lg">
                                  {travelMode === "WALKING" && (
                                    <Footprints className="h-4 w-4 text-white" />
                                  )}
                                  {travelMode === "DRIVING" && (
                                    <Car className="h-4 w-4 text-white" />
                                  )}
                                  {travelMode === "BICYCLING" && (
                                    <Bike className="h-4 w-4 text-white" />
                                  )}
                                </div>
                                <span className="font-bold text-green-900">
                                  {travelMode.toLowerCase()} route
                                </span>
                              </div>
                              <div className="text-sm font-bold text-green-800">
                                {routeSummary.distance} •{" "}
                                {routeSummary.duration}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {turnByTurnInstructions.map((step, index) => (
                        <Card
                          key={index}
                          className={cn(
                            "transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md",
                            index === 0
                              ? "border-primary bg-primary/5 animate-in slide-in-from-left-2"
                              : "bg-muted/30 animate-in slide-in-from-left-1",
                          )}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                  index === 0
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {index === 0 ? "📍" : index + 1}
                              </div>
                              <div className="flex-1">
                                <p
                                  className={cn(
                                    "text-sm leading-relaxed",
                                    index === 0
                                      ? "font-medium text-primary"
                                      : "text-foreground",
                                  )}
                                >
                                  {step.instruction}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {step.distance}
                                  </span>
                                  {step.duration && (
                                    <>
                                      <span className="text-xs text-muted-foreground">
                                        •
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {step.duration}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsNavigating(false);
                        setRouteInstructions([]);
                      }}
                      className="w-full"
                    >
                      End Navigation
                    </Button>
                  </motion.div>
                ) : (
                  // Route Planning
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Route Planning</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        variant="outline"
                        className="h-12 sm:h-14 flex-col gap-1 text-xs sm:text-sm px-4 py-2 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                        onClick={async () => {
                          if (location && userProfile) {
                            try {
                              // Start sharing location on the map
                              const sessionId =
                                sharedLocationService.startLocationSharing(
                                  userProfile.uid,
                                  userProfile.displayName || "You",
                                  userProfile.photoURL,
                                );

                              // Update initial location
                              sharedLocationService.updateUserLocation(
                                userProfile.uid,
                                userProfile.displayName || "You",
                                location.latitude,
                                location.longitude,
                                location.accuracy || 100,
                                userProfile.photoURL,
                              );

                              // Get location name for sharing message
                              let locationMessage = "My current location";

                              if (window.google?.maps) {
                                const geocoder = new google.maps.Geocoder();
                                const latlng = {
                                  lat: location.latitude,
                                  lng: location.longitude,
                                };

                                geocoder.geocode(
                                  { location: latlng },
                                  (results, status) => {
                                    if (
                                      status === "OK" &&
                                      results &&
                                      results[0]
                                    ) {
                                      const result = results[0];
                                      const components =
                                        result.address_components;

                                      let shortName = "";
                                      let neighborhood = "";
                                      let city = "";

                                      components.forEach((component) => {
                                        const types = component.types;
                                        if (
                                          types.includes("establishment") ||
                                          types.includes("point_of_interest")
                                        ) {
                                          shortName = component.long_name;
                                        } else if (
                                          types.includes("neighborhood") ||
                                          types.includes("sublocality")
                                        ) {
                                          neighborhood = component.long_name;
                                        } else if (types.includes("locality")) {
                                          city = component.long_name;
                                        }
                                      });

                                      if (shortName) {
                                        locationMessage = `My location: ${shortName}`;
                                      } else if (neighborhood && city) {
                                        locationMessage = `My location: ${neighborhood}, ${city}`;
                                      } else if (city) {
                                        locationMessage = `My location: ${city}`;
                                      }

                                      const message = `${locationMessage} (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`;

                                      // Store location internally
                                      try {
                                        const locationData = {
                                          message,
                                          timestamp: new Date(),
                                          latitude: location.latitude,
                                          longitude: location.longitude,
                                        };
                                        sessionStorage.setItem(
                                          "shared-location",
                                          JSON.stringify(locationData),
                                        );
                                        console.log(
                                          "Location stored internally:",
                                          message,
                                        );
                                      } catch (error) {
                                        console.error(
                                          "Location storage failed:",
                                          error,
                                        );
                                      }
                                    } else {
                                      // Store coordinates internally
                                      const message = `My current location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
                                      try {
                                        const locationData = {
                                          message,
                                          timestamp: new Date(),
                                          latitude: location.latitude,
                                          longitude: location.longitude,
                                        };
                                        sessionStorage.setItem(
                                          "shared-location",
                                          JSON.stringify(locationData),
                                        );
                                        console.log(
                                          "Location stored internally:",
                                          message,
                                        );
                                      } catch (error) {
                                        console.error(
                                          "Location storage failed:",
                                          error,
                                        );
                                      }
                                    }
                                  },
                                );
                              } else {
                                // Store location internally when Google Maps not available
                                const message = `My current location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
                                try {
                                  const locationData = {
                                    message,
                                    timestamp: new Date(),
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                  };
                                  sessionStorage.setItem(
                                    "shared-location",
                                    JSON.stringify(locationData),
                                  );
                                  console.log(
                                    "Location stored internally:",
                                    message,
                                  );
                                } catch (error) {
                                  console.error(
                                    "Location storage failed:",
                                    error,
                                  );
                                }
                              }
                            } catch (error) {
                              console.error("Location sharing failed:", error);
                            }
                          }
                        }}
                      >
                        <MapPin className="h-4 w-4" />
                        Share Location
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 sm:h-14 flex-col gap-1 text-xs sm:text-sm px-4 py-2 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                        onClick={async () => {
                          try {
                            if (!userProfile?.emergencyContacts?.length) {
                              // Silent handling - no toast notification
                              return;
                            }

                            if (!location) {
                              console.error("No location available");
                              return;
                            }

                            // Start live tracking with real-time service
                            realTimeService.startLiveTracking({
                              latitude: location.latitude,
                              longitude: location.longitude,
                              accuracy: 10, // Default accuracy
                              timestamp: Date.now(),
                            });

                            // Also start live tracking on the map
                            if (userProfile) {
                              const sessionId =
                                sharedLocationService.startLiveTracking(
                                  userProfile.uid,
                                  userProfile.displayName || "You",
                                  userProfile.photoURL,
                                );

                              // Update initial location for live tracking
                              sharedLocationService.updateUserLocation(
                                userProfile.uid,
                                userProfile.displayName || "You",
                                location.latitude,
                                location.longitude,
                                10, // Default accuracy
                                userProfile.photoURL,
                                true, // isLiveTracking
                              );
                            }

                            // Notify emergency contacts about live tracking
                            const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
                            await emergencyContactActionsService.sendEmergencyMessage(
                              `����� LIVE TRACKING STARTED: I'm sharing my real-time location with you. Current location: ${locationUrl}. You'll receive updates every 2 minutes.`,
                            );

                            // Add to real-time alerts
                            realTimeService.addAlert({
                              id: `live-tracking-${Date.now()}`,
                              type: "info",
                              title: "Live Tracking Active",
                              message: `Sharing location with ${userProfile.emergencyContacts.length} emergency contacts`,
                              timestamp: new Date(),
                              location: {
                                latitude: location.latitude,
                                longitude: location.longitude,
                                accuracy: 10, // Default accuracy
                                timestamp: Date.now(),
                              },
                            });

                            // Silently start live tracking
                          } catch (error) {
                            console.error("Live tracking error:", error);
                            // Live tracking error toast removed - silent handling
                          }
                        }}
                      >
                        <Navigation className="h-4 w-4" />
                        Live Tracking
                      </Button>
                    </div>
                  </div>
                )}

                {/* Emergency Services Section */}
                <div className="mt-6 border-t pt-4">
                  <EmergencyServicesPanel
                    location={location}
                    onNavigateToService={(service) => {
                      // Set destination to emergency service location
                      setDestination({
                        latitude: service.location.lat,
                        longitude: service.location.lng,
                      });

                      // Start navigation
                      setIsNavigating(true);

                      // Show notification
                      unifiedNotifications.success(
                        `Navigating to ${service.name}`,
                        {
                          message: `Route to ${service.type} has been set`,
                        },
                      );
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent
                value="settings"
                className="mt-4 space-y-4 transform transition-all duration-300 ease-out slide-left"
              >
                <div className="space-y-4">
                  {/* Current Location with Name */}
                  {location && (
                    <div className="bg-white border border-black/10 rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Navigation2 className="h-4 w-4" />
                        Current Location
                      </h4>
                      <SmartLocationDisplay
                        latitude={location.latitude}
                        longitude={location.longitude}
                        showCoordinates={false}
                        className="mb-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Real-time safety analysis active
                      </p>
                    </div>
                  )}

                  {/* Map Style Settings */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Map Display</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30">
                        <ToggleSwitch
                          checked={mapType === "satellite"}
                          onChange={(checked) => {
                            const newMapType = checked ? "satellite" : "normal";
                            setMapType(newMapType);
                            console.log("Map type changed to:", newMapType);
                            unifiedNotifications.success(
                              `${newMapType === "satellite" ? "Satellite" : "Standard"} view enabled`,
                              {
                                message: `Map view updated to ${newMapType} mode`,
                              },
                            );
                          }}
                          label="Satellite View"
                          description={
                            mapType === "normal"
                              ? "Standard street view"
                              : "Satellite imagery"
                          }
                          size="md"
                        />
                      </div>

                      <div className="p-3 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30">
                        <ToggleSwitch
                          checked={routeSettings.showTraffic}
                          onChange={(checked) => {
                            setRouteSettings((prev) => ({
                              ...prev,
                              showTraffic: checked,
                            }));
                            unifiedNotifications.success(
                              checked
                                ? "Traffic layer enabled"
                                : "Traffic layer disabled",
                              {
                                message: checked
                                  ? "Real-time traffic data is now visible"
                                  : "Traffic data hidden from map",
                              },
                            );
                          }}
                          label="Traffic Layer"
                          description="Real-time traffic conditions"
                          size="md"
                        />
                      </div>

                      <div className="p-3 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30">
                        <ToggleSwitch
                          checked={routeSettings.showEmergencyServices}
                          onChange={(checked) => {
                            setRouteSettings((prev) => ({
                              ...prev,
                              showEmergencyServices: checked,
                            }));
                            unifiedNotifications.success(
                              checked
                                ? "Emergency services enabled"
                                : "Emergency services disabled",
                              {
                                message: checked
                                  ? "Hospitals and emergency services are now visible"
                                  : "Emergency service markers hidden from map",
                              },
                            );
                          }}
                          label="Emergency Services"
                          description="Hospitals & emergency services"
                          size="md"
                        />
                      </div>

                      {/* Admin debug mode indicator removed */}

                      <div className="p-3 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30">
                        <ToggleSwitch
                          checked={gesturesEnabled}
                          onChange={(checked) => {
                            setGesturesEnabled(checked);
                            advancedGestureController.toggleGestures(checked);
                            unifiedNotifications.success(
                              checked
                                ? "Gesture controls enabled"
                                : "Gesture controls disabled",
                              {
                                message: checked
                                  ? "5 rapid taps or shake for SOS, 3-finger hold for panic mode"
                                  : "Emergency gesture detection turned off",
                              },
                            );
                          }}
                          label="Gesture Controls"
                          description="Emergency gestures & navigation"
                          size="md"
                        />
                      </div>

                      {/* Battery Optimization */}
                      <div className="p-3 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30">
                        <ToggleSwitch
                          checked={batterySaverMode}
                          onChange={(checked) => {
                            setBatterySaverMode(checked);
                            batteryOptimizationService.enableBatterySaverMode(
                              checked,
                            );
                            unifiedNotifications.success(
                              checked
                                ? "Battery saver enabled"
                                : "Battery saver disabled",
                              {
                                message: checked
                                  ? "Reduced animations and background activity to save battery"
                                  : "Full functionality restored",
                              },
                            );
                          }}
                          label="Battery Saver"
                          description="Reduce animations and background activity to extend battery life"
                          size="md"
                        />
                      </div>

                      {/* Gesture Guide */}
                      {gesturesEnabled && (
                        <div className="mt-2 opacity-100 transition-opacity duration-200">
                          <GestureGuide />
                        </div>
                      )}

                      {/* Admin debug console removed */}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </SlideUpPanel>

        {/* Magic Navbar */}
        <MagicNavbar />
      </div>
    </ErrorBoundary>
  );
}
