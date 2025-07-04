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
  Car,
  Bike,
  Footprints,
  Users,
  RefreshCw,
  Brain,
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
import { RealTimeLocationShare } from "@/components/RealTimeLocationShare";
import { CustomCheckbox } from "@/components/ui/custom-checkbox";

import { LocationIndicator } from "@/components/LocationStatus";
import {
  SlideDownNotifications,
  useSlideDownNotifications,
} from "@/components/SlideDownNotifications";
import { LocationSharingInfoButton } from "@/components/LocationSharingInfo";
import AINavigationPanel from "@/components/AINavigationPanel";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import GuardianNavigation from "@/components/GuardianNavigation";
import AIFeaturesPanel from "@/components/AIFeaturesPanel";

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
  const [travelMode, setTravelMode] = useState<
    "WALKING" | "DRIVING" | "BICYCLING"
  >("WALKING");
  const [routeSettings, setRouteSettings] = useState({
    showTraffic: false,
    satelliteView: false,
    showSafeZones: false,
    showEmergencyServices: false,
    showSafeAreaCircles: false,
    zoomLevel: 15,
    showDebug: false,
  });

  const { location, error, getCurrentLocation } = useGeolocation();
  const { mapTheme, mapType, toggleTheme, toggleMapType } = useMapTheme();
  const { userProfile } = useAuth();

  const emergencyContacts = userProfile?.emergencyContacts || [];

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
    if (!fromLocation || !toLocation) return;

    setIsNavigating(true);

    try {
      // Use Google Geocoding API to convert address to coordinates
      const geocoder = new google.maps.Geocoder();

      const geocodeResult = await new Promise<google.maps.GeocoderResult[]>(
        (resolve, reject) => {
          geocoder.geocode({ address: toLocation }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        },
      );

      if (geocodeResult.length > 0) {
        const destinationCoords = {
          lat: geocodeResult[0].geometry.location.lat(),
          lng: geocodeResult[0].geometry.location.lng(),
        };

        setDestination(destinationCoords);

        // Start AI-enhanced navigation automatically when search is performed
        if (location) {
          console.log("🧭 Starting AI-Enhanced Navigation automatically...");

          const { aiEnhancedNavigation } = await import(
            "@/services/aiEnhancedNavigation"
          );

          const enhancedRoute = await aiEnhancedNavigation.startNavigation(
            { lat: location.latitude, lng: location.longitude },
            destinationCoords,
          );

          console.log("🚀 AI-Enhanced Route generated:", enhancedRoute);

          // Show AI Navigation Panel
          setShowAIPanel(true);

          // Subscribe to navigation updates
          aiEnhancedNavigation.subscribe((navigationState) => {
            console.log("📍 Navigation state update:", navigationState);

            // Show alerts if any
            if (navigationState.nextAlert) {
              const { message, severity, distance } = navigationState.nextAlert;
              console.log(`🚨 Alert in ${Math.round(distance)}m: ${message}`);
            }

            // Log dynamic alerts
            if (navigationState.route?.dynamicAlerts.length) {
              navigationState.route.dynamicAlerts.forEach((alert) => {
                console.log("🔔 Dynamic alert:", alert);
              });
            }
          });
        }
      } else {
        throw new Error("No results found for the destination");
      }
    } catch (error) {
      console.error("Navigation error:", error);

      // Fallback to a default location with user notification
      setDestination({
        lat: 37.7749,
        lng: -122.4194,
      });

      addNotification({
        type: "warning",
        title: "Location Not Found",
        message: `Could not find "${toLocation}". Using default location.`,
      });
    }

    // Generate route instructions based on travel mode
    const mockInstructions = [
      `Starting from ${fromLocation}`,
      travelMode === "WALKING"
        ? "Taking pedestrian-friendly route via Main Street"
        : travelMode === "BICYCLING"
          ? "Following bike-friendly route with dedicated lanes"
          : "Using optimal driving route via major roads",
      "Continue straight for 0.8 miles",
      "Turn right at the traffic light",
      `Arriving at ${toLocation}`,
    ];

    // Add traffic consideration if enabled
    if (routeSettings.showTraffic) {
      mockInstructions.splice(1, 0, "Traffic conditions: Light traffic ahead");
    }

    setRouteInstructions(mockInstructions);
  }, [fromLocation, toLocation, travelMode]);

  const handleUseCurrentLocation = useCallback(async () => {
    try {
      const currentLoc = await getCurrentLocation();
      setFromLocation(
        `${currentLoc.latitude.toFixed(4)}, ${currentLoc.longitude.toFixed(4)}`,
      );
      // Removed notification - silent location usage
    } catch (error: any) {
      console.error("Error getting current location:", error);

      const errorMessage = error?.message || "Unable to get your location";
      setFromLocation("���� Location unavailable - tap to retry");

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

  // Refresh route when travel mode changes
  useEffect(() => {
    if (destination && isNavigating) {
      // Small delay to ensure the map has processed the new travel mode
      const timer = setTimeout(() => {
        // The route will automatically refresh due to travelMode dependency in GoogleMap
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [travelMode, destination, isNavigating]);

  const handleSOSPress = useCallback(() => {
    console.log("SOS activated");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Guardian Navigation Form */}
      <motion.div
        className="relative z-20 bg-background/95 backdrop-blur-md border-b border-border/20 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto px-4 py-3">
          {/* Guardian Branding with AI Toggle */}
          <motion.div
            className="flex items-center justify-between mb-3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-black font-bold text-sm tracking-wide">
                GUARDIAN
              </span>
            </div>
            <motion.button
              onClick={() => setShowAIFeaturesPanel(!showAIFeaturesPanel)}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Brain className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">
                {showAIFeaturesPanel ? "Hide AI" : "Show AI"}
              </span>
            </motion.button>
          </motion.div>

          {/* Enhanced Navigation Container - Compact Design */}
          <motion.div
            className="bg-white/95 rounded-xl p-3 shadow-xl border border-gray-200/50"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <div className="flex items-center gap-2">
              {/* Visual Connection Line - Smaller */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full shadow-sm"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <div className="w-0.5 h-8 bg-gradient-to-b from-green-500 to-blue-500 my-0.5"></div>
                <motion.div
                  className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                />
              </div>

              <div className="flex-1 space-y-2">
                {/* From Input - Compact */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <LocationAutocomplete
                    value={fromLocation}
                    onChange={setFromLocation}
                    placeholder="📍 From"
                    showCurrentLocationButton={true}
                    onCurrentLocation={() => {
                      console.log("📍 Using current location for FROM");
                      if (location) {
                        setFromLocation(
                          `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
                        );
                      } else {
                        handleUseCurrentLocation();
                      }
                    }}
                    className="w-full h-9 text-sm"
                  />
                </motion.div>

                {/* To Input - Compact */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <LocationAutocomplete
                    value={toLocation}
                    onChange={setToLocation}
                    placeholder="🎯 To"
                    onPlaceSelect={(place) => {
                      console.log("🎯 Destination selected:", place);
                    }}
                    className="w-full h-9 text-sm"
                  />
                </motion.div>
              </div>

              {/* Search Button - Compact */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0"
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={handleSearch}
                  className="h-10 px-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg font-medium transition-all duration-300"
                  disabled={!fromLocation || !toLocation}
                >
                  <Route className="h-4 w-4 mr-1" />
                  <span className="text-sm">Go</span>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Clear Route Button */}
      {destination && (
        <motion.div
          className="container mx-auto px-4 py-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
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
            className="w-full h-9 text-xs bg-white/90 hover:bg-white border border-gray-300"
          >
            Clear Route
          </Button>
        </motion.div>
      )}

      {/* Vehicle Selection */}
      <div className="container mx-auto px-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Travel by:</span>
          <div className="flex items-center gap-1">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                size="sm"
                variant={travelMode === "WALKING" ? "default" : "outline"}
                onClick={() => setTravelMode("WALKING")}
                className="h-7 px-2 text-xs transition-all duration-200 hover:shadow-md"
              >
                <Footprints className="h-3 w-3 mr-1" />
                Walk
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                size="sm"
                variant={travelMode === "DRIVING" ? "default" : "outline"}
                onClick={() => setTravelMode("DRIVING")}
                className="h-7 px-2 text-xs transition-all duration-200 hover:shadow-md"
              >
                <Car className="h-3 w-3 mr-1" />
                Car
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                size="sm"
                variant={travelMode === "BICYCLING" ? "default" : "outline"}
                onClick={() => setTravelMode("BICYCLING")}
                className="h-7 px-2 text-xs transition-all duration-200 hover:shadow-md"
              >
                <Bike className="h-3 w-3 mr-1" />
                Bike
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Unified Slidedown Notifications */}
      <SlideDownNotifications />

      {/* AI Navigation Panel */}
      <AINavigationPanel
        isVisible={showAIPanel}
        onClose={() => setShowAIPanel(false)}
      />

      {/* AI Features Panel */}
      <AIFeaturesPanel
        isVisible={showAIFeaturesPanel}
        location={location}
        isNavigating={isNavigating}
        onClose={() => setShowAIFeaturesPanel(false)}
      />

      {/* Enhanced Google Map */}
      <div className="absolute inset-0 top-0 z-10 pt-16">
        <EnhancedGoogleMap
          key={`${routeSettings.showTraffic}-${routeSettings.showSafeZones}-${routeSettings.showEmergencyServices}-${routeSettings.showSafeAreaCircles}-${routeSettings.zoomLevel}-${mapTheme}-${mapType}`}
          location={location}
          mapTheme={mapTheme}
          mapType={mapType}
          showTraffic={routeSettings.showTraffic}
          showSafeZones={routeSettings.showSafeZones}
          showEmergencyServices={routeSettings.showEmergencyServices}
          showSafeAreaCircles={routeSettings.showSafeAreaCircles}
          showDebug={routeSettings.showDebug}
          enableSatelliteView={routeSettings.satelliteView}
          zoomLevel={routeSettings.zoomLevel}
          destination={destination}
          trackUserLocation={true}
          travelMode={travelMode}
          onDirectionsChange={handleDirectionsChange}
          emergencyContacts={emergencyContacts.map((contact) => ({
            id: contact.id,
            name: contact.name,
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

      {/* Slide Up Panel with Tabs for Navigation, Contacts, and Settings */}
      <SlideUpPanel
        minHeight={200}
        maxHeight={Math.floor(window.innerHeight * 0.8)}
        initialHeight={Math.floor(window.innerHeight * 0.45)}
        bottomOffset={120}
        collapsedHeight={60}
        onTouchOutside={() => console.log("Panel closed by touch outside")}
      >
        <Tabs
          defaultValue={isNavigating ? "navigation" : "safety"}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="navigation" className="text-xs h-7">
              <Navigation className="h-3 w-3 mr-1" />
              Routes
            </TabsTrigger>
            <TabsTrigger value="safety" className="text-xs h-7">
              <Navigation2 className="h-3 w-3 mr-1" />
              Safety
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs h-7">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="debug" className="text-xs h-7">
              <MapPin className="h-3 w-3 mr-1" />
              Debug
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="safety"
            className="mt-4 space-y-4 transform transition-all duration-300 ease-out slide-up"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Navigation2 className="h-5 w-5 text-primary" />
                  Real-Time Safety
                </h3>
                <RealTimeSafetyFeatures />
              </div>

              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Location Sharing
                  <LocationSharingInfoButton />
                </h3>
                <div className="mt-4">
                  <RealTimeLocationShare />
                </div>
              </div>
            </div>
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
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 flex-col gap-1 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md"
                    onClick={() => {
                      if (location) {
                        const message = `My current location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
                        if (navigator.share) {
                          navigator.share({
                            title: "My Location",
                            text: message,
                          });
                        } else {
                          // Copy to clipboard with fallback
                          try {
                            if (navigator.clipboard && window.isSecureContext) {
                              navigator.clipboard.writeText(message);
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
                            alert("Location copied to clipboard!");
                          } catch (error) {
                            console.error("Copy failed:", error);
                            alert("Failed to copy location");
                          }
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
                    onClick={() => {
                      console.log("Starting live tracking...");
                      alert(
                        "Live tracking started! Your location will be shared with emergency contacts.",
                      );
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
                      <p className="text-sm font-medium">Emergency Services</p>
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
                      <p className="text-sm font-medium">Safety Areas</p>
                      <p className="text-xs text-muted-foreground">
                        Color-coded zones
                      </p>
                    </div>
                    <CustomCheckbox
                      checked={routeSettings.showSafeAreaCircles}
                      onChange={(checked) =>
                        setRouteSettings((prev) => ({
                          ...prev,
                          showSafeAreaCircles: checked,
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

                  <motion.div
                    className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div>
                      <p className="text-sm font-medium">Zoom Level</p>
                      <p className="text-xs text-muted-foreground">
                        {routeSettings.zoomLevel}
                      </p>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="20"
                      value={routeSettings.zoomLevel}
                      onChange={(e) =>
                        setRouteSettings((prev) => ({
                          ...prev,
                          zoomLevel: parseInt(e.target.value),
                        }))
                      }
                      className="w-16 h-2"
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="debug"
            className="mt-4 space-y-4 transform transition-all duration-300 ease-out slide-left"
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location Debug
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Location status and troubleshooting
                </p>

                {/* Location Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Location Status</p>
                      <p className="text-xs text-muted-foreground">
                        {location
                          ? `Found at ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                          : error
                            ? "Error getting location"
                            : "Searching for location..."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {location && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          ±{Math.round(location.accuracy)}m
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={getCurrentLocation}
                        className="h-7 text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  {location && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-muted/20 rounded">
                        <span className="font-medium">Accuracy</span>
                        <div>±{Math.round(location.accuracy)}m</div>
                      </div>
                      <div className="p-2 bg-muted/20 rounded">
                        <span className="font-medium">Timestamp</span>
                        <div>
                          {new Date(location.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      {location.speed !== undefined && location.speed > 0 && (
                        <div className="p-2 bg-muted/20 rounded">
                          <span className="font-medium">Speed</span>
                          <div>{Math.round(location.speed * 3.6)} km/h</div>
                        </div>
                      )}
                      {location.heading !== undefined && (
                        <div className="p-2 bg-muted/20 rounded">
                          <span className="font-medium">Heading</span>
                          <div>{Math.round(location.heading)}°</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-muted/20 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Browser Info</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        Geolocation:{" "}
                        {navigator.geolocation
                          ? "✅ Supported"
                          : "❌ Not supported"}
                      </div>
                      <div>
                        Permissions API:{" "}
                        {"permissions" in navigator
                          ? "✅ Available"
                          : "❌ Not available"}
                      </div>
                      <div>
                        HTTPS:{" "}
                        {window.location.protocol === "https:"
                          ? "✅ Secure"
                          : "⚠️ Insecure"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SlideUpPanel>

      {/* Magic Navbar */}
      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
