import { useState, useCallback, useEffect } from "react";
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
import { GoogleMap as EnhancedGoogleMap } from "@/components/SimpleEnhancedGoogleMap";
import { SlideUpPanel } from "@/components/SlideUpPanel";
import { MagicNavbar } from "@/components/MagicNavbar";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useMapTheme } from "@/hooks/use-map-theme";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { RealTimeSafetyFeatures } from "@/components/RealTimeSafetyFeatures";

import { CustomCheckbox } from "@/components/ui/custom-checkbox";

import { LocationIndicator } from "@/components/LocationStatus";
import {
  SlideDownNotifications,
  useSlideDownNotifications,
} from "@/components/SlideDownNotifications";
import { LocationSharingInfoButton } from "@/components/LocationSharingInfo";
import AINavigationPanel from "@/components/AINavigationPanel";
import { emergencyContactActionsService } from "@/services/emergencyContactActionsService";
import { realTimeService } from "@/services/realTimeService";
import { sharedLocationService } from "@/services/sharedLocationService";
import { LocationPermissionPrompt } from "@/components/LocationPermissionPrompt";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import { RouteSelection } from "@/components/RouteSelection";
import { routeCalculationService } from "@/services/routeCalculationService";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { CompactSearchBar } from "@/components/CompactSearchBar";

import { EmergencyAlerts } from "@/components/EmergencyAlerts";

import { EnhancedSafetyMonitor } from "@/components/EnhancedSafetyMonitor";
import { PerformanceOptimizer } from "@/components/PerformanceOptimizer";

import { ComprehensiveSafetySystem } from "@/components/ComprehensiveSafetySystem";

import {
  notificationSettingsService,
  shouldShowNotification,
} from "@/services/notificationSettingsService";

import { ClickableFixes } from "@/components/ClickableFixes";
import { areaBasedSafety } from "@/services/areaBasedSafety";
import { realTimeDataService } from "@/services/realTimeDataService";
import {
  SmartLocationDisplay,
  useLocationName,
} from "@/components/SmartLocationDisplay";

// Debug Content Component
function DebugContent() {
  const {
    location,
    error,
    isTracking,
    permissionStatus,
    getCurrentLocation,
    startTracking,
    stopTracking,
  } = useGeolocation();

  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [updateCount, setUpdateCount] = useState(0);
  const [systemInfo] = useState({
    userAgent:
      navigator.userAgent.slice(0, 100) +
      (navigator.userAgent.length > 100 ? "..." : ""),
    platform: navigator.platform,
    language: navigator.language,
    online: navigator.onLine,
    screenSize: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
  });

  useEffect(() => {
    if (location) {
      setLastUpdate(new Date(location.timestamp).toLocaleString());
      setUpdateCount((prev) => prev + 1);
    }
  }, [location]);

  const getLocationQuality = () => {
    if (!location) return null;
    const accuracy = location.accuracy;
    if (accuracy <= 5) return { level: "excellent", color: "text-green-600" };
    if (accuracy <= 20) return { level: "good", color: "text-blue-600" };
    if (accuracy <= 100) return { level: "fair", color: "text-yellow-600" };
    return { level: "poor", color: "text-red-600" };
  };

  const getPermissionColor = () => {
    switch (permissionStatus) {
      case "granted":
        return "text-green-600";
      case "denied":
        return "text-red-600";
      case "prompt":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const testLocation = async () => {
    try {
      await getCurrentLocation();
      console.log("Location test successful");
    } catch (error) {
      console.error("Location test failed:", error);
    }
  };

  const quality = getLocationQuality();

  return (
    <div className="space-y-4">
      {/* Location Information */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Permission Status:</span>
          <Badge className={`text-xs ${getPermissionColor()}`}>
            {permissionStatus || "unknown"}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Tracking Status:</span>
          <Badge
            className={`text-xs ${isTracking ? "text-green-600" : "text-red-600"}`}
          >
            {isTracking ? "Active" : "Stopped"}
          </Badge>
        </div>

        {location && (
          <>
            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="col-span-2">
                <span className="font-medium">Location:</span>
                <div className="mt-1">
                  <SmartLocationDisplay
                    latitude={location.latitude}
                    longitude={location.longitude}
                    showCoordinates={true}
                  />
                </div>
              </div>
              <div>
                <span className="font-medium">Accuracy:</span>{" "}
                <span className={quality?.color}>
                  ±{Math.round(location.accuracy)}m
                </span>
              </div>
              <div>
                <span className="font-medium">Updates:</span> {updateCount}
              </div>
            </div>
            <div className="text-xs">
              <span className="font-medium">Last Update:</span> {lastUpdate}
            </div>
          </>
        )}

        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
            <strong>Error:</strong> {error.message}
          </div>
        )}
      </div>

      {/* System Information */}
      <div className="border-t pt-3 space-y-2">
        <h5 className="text-xs font-semibold text-slate-700">System Info</h5>
        <div className="space-y-1 text-xs text-slate-600">
          <div>
            <span className="font-medium">Platform:</span> {systemInfo.platform}
          </div>
          <div>
            <span className="font-medium">Language:</span> {systemInfo.language}
          </div>
          <div>
            <span className="font-medium">Screen:</span> {systemInfo.screenSize}
          </div>
          <div>
            <span className="font-medium">Viewport:</span>{" "}
            {systemInfo.viewportSize}
          </div>
          <div>
            <span className="font-medium">Connection:</span>{" "}
            <span
              className={systemInfo.online ? "text-green-600" : "text-red-600"}
            >
              {systemInfo.online ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t pt-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={testLocation}
            className="flex-1 text-xs h-8"
          >
            <Target className="w-3 h-3 mr-1" />
            Test Location
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={isTracking ? stopTracking : startTracking}
            className="flex-1 text-xs h-8"
          >
            {isTracking ? "Stop Tracking" : "Start Tracking"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const { addNotification } = useSlideDownNotifications();
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInstructions, setRouteInstructions] = useState<string[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAIFeaturesPanel, setShowAIFeaturesPanel] = useState(true);
  const [destination, setDestination] = useState<
    { lat: number; lng: number } | undefined
  >(undefined);
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
  const travelMode = "WALKING"; // Default to walking for safety
  const [routeSettings, setRouteSettings] = useState({
    showTraffic: false,
    satelliteView: false,
    showSafeZones: false,
    showEmergencyServices: false,
    showSafeAreaCircles: false,
    zoomLevel: 15,
    showDebug: false,
  });

  const { location, error, getCurrentLocation, permissionStatus } =
    useGeolocation();
  const { mapTheme, mapType, toggleTheme, toggleMapType } = useMapTheme();
  const { userProfile } = useAuth();

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
    (route: any) => {
      setShowRouteSelection(false);
      setDestination({
        lat: route.waypoints[route.waypoints.length - 1].latitude,
        lng: route.waypoints[route.waypoints.length - 1].longitude,
      });
      setIsNavigating(true);

      addNotification({
        type: "success",
        title: "Navigation Started",
        message: `Following ${route.title} - ${route.duration}`,
      });
    },
    [addNotification],
  );

  // Initialize real-time data monitoring
  useEffect(() => {
    const initializeTracking = async () => {
      try {
        console.log("🚀 Initializing location tracking...");

        // Start real-time tracking with error handling
        await realTimeDataService.startTracking();

        const status = realTimeDataService.getLocationStatus();
        console.log("📍 Location tracking status:", status);

        // Removed automatic location notifications - only show on user action
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("🚫 Failed to initialize location tracking:", {
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
  }, [location, addNotification]);

  // Auto-populate emergency contact locations when user location and contacts are available
  useEffect(() => {
    if (
      location &&
      userProfile?.emergencyContacts &&
      userProfile.emergencyContacts.length > 0
    ) {
      console.log("🎯 Auto-populating emergency contact locations...");
      sharedLocationService.autoPopulateEmergencyContactLocations(
        { latitude: location.latitude, longitude: location.longitude },
        userProfile.emergencyContacts,
      );

      // Start simulation for movement
      sharedLocationService.startEmergencyContactSimulation();

      // Emergency contacts notification removed - no slide down notifications
    }
  }, [location, userProfile?.emergencyContacts, addNotification]);

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
    if (!fromLocation || !toLocation) {
      addNotification({
        type: "warning",
        title: "Missing Information",
        message: "Please enter both starting point and destination.",
      });
      return;
    }

    setIsNavigating(true);

    try {
      // If destination is already set from autocomplete, use it directly
      let destinationCoords = destination;

      // Otherwise, geocode the address
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
          destinationCoords = {
            lat: geocodeResult[0].geometry.location.lat(),
            lng: geocodeResult[0].geometry.location.lng(),
          };
          setDestination(destinationCoords);
        }
      }

      if (!destinationCoords) {
        throw new Error("Destination coordinates not available");
      }

      // Calculate safety score for the route during navigation
      if (location) {
        try {
          const { areaBasedSafety } = await import(
            "@/services/areaBasedSafety"
          );
          const { area } = await areaBasedSafety.getSafetyScore({
            latitude: destinationCoords.lat,
            longitude: destinationCoords.lng,
          });

          console.log("🛡�� Route safety analysis:", {
            destination: `${destinationCoords.lat.toFixed(4)}, ${destinationCoords.lng.toFixed(4)}`,
            safetyScore: area.safetyScore,
          });

          // Route safety notification removed - no slide down notifications
        } catch (safetyError) {
          console.warn("Safety analysis failed:", safetyError);
        }
      }

      // Show route selection modal after calculating routes
      try {
        // Route planning notification removed - no slide down notifications

        const routes = await routeCalculationService.calculateRoutes(
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: destinationCoords.lat, longitude: destinationCoords.lng },
        );

        setRouteOptions(routes);
        setShowRouteSelection(true);
      } catch (routeError) {
        console.error("Route calculation error:", routeError);
        addNotification({
          type: "error",
          title: "Route Planning Failed",
          message: "Unable to calculate routes. Please try again.",
        });
      }

      setIsNavigating(false); // Reset navigation state
    } catch (error) {
      console.error("Navigation error:", error);
      addNotification({
        type: "error",
        title: "Navigation Failed",
        message:
          error instanceof Error
            ? error.message
            : "Could not calculate route. Please try again.",
      });
      setIsNavigating(false);
    }
  }, [fromLocation, toLocation, destination, location, addNotification]);

  const handleUseCurrentLocation = useCallback(async () => {
    try {
      console.log("🎯 Green button clicked - getting current location...");
      const currentLoc = await getCurrentLocation();
      console.log("✅ Got current location:", currentLoc);

      // Try to get location name using geocoding
      if (window.google?.maps) {
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: currentLoc.latitude, lng: currentLoc.longitude };

        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const result = results[0];
            const components = result.address_components;

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
              console.log("📍 Setting from location to:", shortName);
              setFromLocation(shortName);
            } else if (neighborhood && city) {
              console.log(
                "📍 Setting from location to:",
                `${neighborhood}, ${city}`,
              );
              setFromLocation(`${neighborhood}, ${city}`);
            } else if (city) {
              console.log("📍 Setting from location to:", city);
              setFromLocation(city);
            } else {
              console.log("📍 Setting from location to: Current Location");
              setFromLocation("Current Location");
            }
          } else {
            console.log("📍 Geocoding failed, using: Current Location");
            setFromLocation("Current Location");
          }
        });
      } else {
        console.log("📍 Google Maps not available, using: Current Location");
        setFromLocation("Current Location");
      }

      // Location set notification removed - no slide down notifications
    } catch (error: any) {
      console.error("Error getting current location:", error);

      const errorMessage = error?.message || "Unable to get your location";
      setFromLocation("📍 Location unavailable - tap to retry");

      addNotification({
        type: "error",
        title: "Location Error",
        message: errorMessage,
        action: {
          label: "Try Again",
          onClick: handleUseCurrentLocation,
        },
        persistent: true,
      });
    }
  }, [getCurrentLocation, addNotification]);

  // Route refreshes automatically when destination changes

  const handleSOSPress = useCallback(() => {
    console.log("SOS activated");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PerformanceOptimizer />
      <ClickableFixes />
      {/* Compact Navigation Header - Reduced Height */}
      {/* Compact Search Bar */}
      <CompactSearchBar
        fromLocation={fromLocation}
        setFromLocation={setFromLocation}
        toLocation={toLocation}
        setToLocation={setToLocation}
        onSearch={handleSearch}
        onUseCurrentLocation={handleUseCurrentLocation}
        location={location}
        isSearching={isNavigating}
      />

      {/* Clear Route Button */}
      {destination && (
        <div className="container mx-auto px-3 py-1">
          <Button
            onClick={() => {
              setDestination(undefined);
              setIsNavigating(false);
              setRouteInstructions([]);
              setTurnByTurnInstructions([]);
              setRouteSummary(null);
            }}
            size="sm"
            variant="outline"
            className="w-full h-8 text-sm bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
          >
            Clear Route
          </Button>
        </div>
      )}

      {/* Transportation mode simplified to walking by default */}
      {/* Unified Slidedown Notifications */}
      <SlideDownNotifications />

      {/* Emergency Alerts */}
      <EmergencyAlerts />

      {/* AI Navigation Panel */}
      <AINavigationPanel
        isVisible={showAIPanel}
        onClose={() => setShowAIPanel(false)}
      />

      {/* Location Permission Prompt removed */}

      {/* Enhanced Google Map with Safety Score Coloring */}
      <div className="absolute inset-0 top-0 z-10">
        <EnhancedGoogleMap
          key="main-map"
          location={location}
          mapTheme={mapTheme}
          mapType={mapType}
          showTraffic={routeSettings.showTraffic}
          showSafeZones={routeSettings.showSafeZones}
          showEmergencyServices={routeSettings.showEmergencyServices}
          showSafeAreaCircles={routeSettings.showSafeAreaCircles}
          showDebug={routeSettings.showDebug}
          zoomLevel={routeSettings.zoomLevel}
          destination={destination}
          trackUserLocation={true}
          travelMode={travelMode}
          onDirectionsChange={handleDirectionsChange}
          showSharedLocations={true}
          currentUserId={userProfile?.uid}
          emergencyContacts={emergencyContacts.map((contact) => ({
            id: contact.id,
            name: contact.name,
            phone: contact.phone || "",
            guardianKey: contact.guardianKey,
            location: {
              lat: 37.7749 + Math.random() * 0.01,
              lng: -122.4194 + Math.random() * 0.01,
            },
          }))}
          onLocationUpdate={(newLocation) => {
            console.log("Location updated:", newLocation);
          }}
        />
      </div>

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

      {/* Slide Up Panel with Tabs for Navigation, Contacts, and Settings */}
      <SlideUpPanel
        minHeight={200}
        maxHeight={Math.floor(window.innerHeight * 0.8)}
        initialHeight={Math.floor(window.innerHeight * 0.45)}
        bottomOffset={80}
        collapsedHeight={60}
        onTouchOutside={() => console.log("Panel closed by touch outside")}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Tabs
            defaultValue={isNavigating ? "navigation" : "safety"}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100/80 backdrop-blur-sm rounded-xl p-1 shadow-sm">
              <TabsTrigger
                value="navigation"
                className="text-xs h-9 font-mono font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Navigation className="h-4 w-4 mr-1.5" />
                ROUTES
              </TabsTrigger>
              <TabsTrigger
                value="safety"
                className="text-xs h-9 font-mono font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Navigation2 className="h-4 w-4 mr-1.5" />
                SAFETY
              </TabsTrigger>

              <TabsTrigger
                value="settings"
                className="text-xs h-9 font-mono font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Settings className="h-4 w-4 mr-1.5" />
                SETTINGS
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="safety"
              className="mt-6 space-y-6 transform transition-all duration-300 ease-out slide-up"
            >
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100/50 shadow-sm">
                    <h3 className="text-xl font-bold font-mono flex items-center gap-3 text-slate-800 mb-2">
                      <div className="p-2 bg-blue-500 rounded-xl shadow-md">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      LOCATION SHARING
                      <LocationSharingInfoButton />
                    </h3>
                    <p className="text-sm text-slate-600 font-mono mb-4">
                      Share your location with trusted contacts for enhanced
                      safety
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border border-red-100/50 shadow-sm">
                    <h3 className="text-xl font-bold font-mono flex items-center gap-3 text-slate-800 mb-2">
                      <div className="p-2 bg-red-500 rounded-xl shadow-md">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      EMERGENCY SOS
                    </h3>
                    <p className="text-sm text-slate-600 font-mono mb-4">
                      Use the red SOS button in the bottom navigation to send
                      emergency alerts
                    </p>
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        Press and hold for 3 seconds to activate emergency mode
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent
              value="navigation"
              className="mt-4 space-y-4 transform transition-all duration-300 ease-out slide-right"
            >
              {isNavigating && turnByTurnInstructions.length > 0 ? (
                // Navigation Instructions
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-primary" />
                      Turn-by-Turn Navigation
                    </h3>
                    <Badge className="bg-primary/20 text-primary">Active</Badge>
                  </div>

                  {/* Route Summary */}
                  {routeSummary && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {travelMode === "WALKING" && (
                              <Footprints className="h-4 w-4 text-primary" />
                            )}
                            {travelMode === "DRIVING" && (
                              <Car className="h-4 w-4 text-primary" />
                            )}
                            {travelMode === "BICYCLING" && (
                              <Bike className="h-4 w-4 text-primary" />
                            )}
                            <span className="text-sm font-medium">
                              Route Summary ({travelMode.toLowerCase()})
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {routeSummary.distance} • {routeSummary.duration}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                </div>
              ) : (
                // Route Planning
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Route Planning</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="outline"
                      className="h-12 flex-col gap-1 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
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

                                    if (navigator.share) {
                                      navigator.share({
                                        title: "My Location",
                                        text: message,
                                      });
                                    } else {
                                      // Copy to clipboard with fallback
                                      try {
                                        if (
                                          navigator.clipboard &&
                                          window.isSecureContext
                                        ) {
                                          navigator.clipboard.writeText(
                                            message,
                                          );
                                        } else {
                                          const textArea =
                                            document.createElement("textarea");
                                          textArea.value = message;
                                          textArea.style.position = "fixed";
                                          textArea.style.left = "-999999px";
                                          textArea.style.top = "-999999px";
                                          document.body.appendChild(textArea);
                                          textArea.focus();
                                          textArea.select();
                                          document.execCommand("copy");
                                          document.body.removeChild(textArea);
                                        }
                                        addNotification({
                                          type: "success",
                                          title: "Location Shared",
                                          message:
                                            "Location copied to clipboard!",
                                        });
                                      } catch (error) {
                                        console.error("Copy failed:", error);
                                        addNotification({
                                          type: "error",
                                          title: "Share Failed",
                                          message:
                                            "Failed to copy location to clipboard",
                                        });
                                      }
                                    }
                                  } else {
                                    // Fallback to coordinates
                                    const message = `My current location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
                                    if (navigator.share) {
                                      navigator.share({
                                        title: "My Location",
                                        text: message,
                                      });
                                    } else {
                                      try {
                                        navigator.clipboard?.writeText(message);
                                        addNotification({
                                          type: "success",
                                          title: "Location Shared",
                                          message:
                                            "Location copied to clipboard!",
                                        });
                                      } catch {
                                        addNotification({
                                          type: "error",
                                          title: "Share Failed",
                                          message:
                                            "Failed to copy location to clipboard",
                                        });
                                      }
                                    }
                                  }
                                },
                              );
                            } else {
                              // Fallback when Google Maps not available
                              const message = `My current location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
                              if (navigator.share) {
                                navigator.share({
                                  title: "My Location",
                                  text: message,
                                });
                              } else {
                                try {
                                  navigator.clipboard?.writeText(message);
                                  addNotification({
                                    type: "success",
                                    title: "Location Shared",
                                    message: "Location copied to clipboard!",
                                  });
                                } catch {
                                  addNotification({
                                    type: "error",
                                    title: "Share Failed",
                                    message:
                                      "Failed to copy location to clipboard",
                                  });
                                }
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
                      className="h-12 flex-col gap-1 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
                      onClick={async () => {
                        try {
                          if (!userProfile?.emergencyContacts?.length) {
                            addNotification({
                              type: "error",
                              title: "Live Tracking Unavailable",
                              message:
                                "Please add emergency contacts first to enable live tracking.",
                            });
                            return;
                          }

                          const currentLocation = await getCurrentLocation();

                          // Start live tracking with real-time service
                          realTimeService.startLiveTracking({
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                            accuracy: currentLocation.accuracy,
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
                              currentLocation.latitude,
                              currentLocation.longitude,
                              currentLocation.accuracy,
                              userProfile.photoURL,
                              true, // isLiveTracking
                            );
                          }

                          // Notify emergency contacts about live tracking
                          const locationUrl = `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
                          await emergencyContactActionsService.sendEmergencyMessage(
                            `🔴 LIVE TRACKING STARTED: I'm sharing my real-time location with you. Current location: ${locationUrl}. You'll receive updates every 2 minutes.`,
                          );

                          // Add to real-time alerts
                          realTimeService.addAlert({
                            id: `live-tracking-${Date.now()}`,
                            type: "info",
                            title: "Live Tracking Active",
                            message: `Sharing location with ${userProfile.emergencyContacts.length} emergency contacts`,
                            timestamp: new Date(),
                            location: {
                              latitude: currentLocation.latitude,
                              longitude: currentLocation.longitude,
                              accuracy: currentLocation.accuracy,
                              timestamp: Date.now(),
                            },
                          });

                          addNotification({
                            type: "success",
                            title: "Live Tracking Started",
                            message: `Your location is now being shared with ${userProfile.emergencyContacts.length} emergency contacts.`,
                          });

                          console.log("✅ Live tracking started successfully");
                        } catch (error) {
                          console.error("Live tracking error:", error);
                          addNotification({
                            type: "error",
                            title: "Live Tracking Failed",
                            message:
                              "Unable to start live tracking. Please check your location permissions.",
                          });
                        }
                      }}
                    >
                      <Navigation className="h-4 w-4" />
                      Live Tracking
                    </Button>
                  </div>
                </div>
              )}
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
                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">Map Theme</p>
                        <p className="text-xs text-muted-foreground">
                          Light or dark
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleTheme}
                        className="h-7 px-2 text-xs"
                      >
                        {mapTheme === "light" ? "🌞" : "🌙"}
                      </Button>
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">Map Type</p>
                        <p className="text-xs text-muted-foreground">
                          Standard or satellite
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleMapType}
                        className="h-7 px-2 text-xs"
                      >
                        {mapType === "normal" ? "🗺️" : "🛰️"}
                      </Button>
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">Traffic</p>
                        <p className="text-xs text-muted-foreground">
                          Real-time conditions
                        </p>
                      </div>
                      <CustomCheckbox
                        checked={routeSettings.showTraffic}
                        onChange={(checked) =>
                          setRouteSettings((prev) => ({
                            ...prev,
                            showTraffic: checked,
                          }))
                        }
                        size="sm"
                      />
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">Safe Zones</p>
                        <p className="text-xs text-muted-foreground">
                          Police & safe areas
                        </p>
                      </div>
                      <CustomCheckbox
                        checked={routeSettings.showSafeZones}
                        onChange={(checked) =>
                          setRouteSettings((prev) => ({
                            ...prev,
                            showSafeZones: checked,
                          }))
                        }
                        size="sm"
                      />
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Emergency Services
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hospitals & services
                        </p>
                      </div>
                      <CustomCheckbox
                        checked={routeSettings.showEmergencyServices}
                        onChange={(checked) =>
                          setRouteSettings((prev) => ({
                            ...prev,
                            showEmergencyServices: checked,
                          }))
                        }
                        size="sm"
                      />
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <p className="text-sm font-medium">Debug Console</p>
                        <p className="text-xs text-muted-foreground">
                          Developer info & logs
                        </p>
                      </div>
                      <CustomCheckbox
                        checked={routeSettings.showDebug}
                        onChange={(checked) =>
                          setRouteSettings((prev) => ({
                            ...prev,
                            showDebug: checked,
                          }))
                        }
                        size="sm"
                      />
                    </motion.div>

                    {/* Debug Console Content */}
                    {routeSettings.showDebug && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Debug Information
                        </h4>
                        <DebugContent />
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </SlideUpPanel>

      {/* Magic Navbar */}
      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
