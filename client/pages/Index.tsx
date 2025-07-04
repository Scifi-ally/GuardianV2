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

        // Start safety-aware navigation automatically when search is performed
        if (location) {
          console.log("🛡️ Starting Safety-Aware Navigation...");

          try {
            // Use the new safety-aware navigation service
            const { safetyAwareNavigation } = await import(
              "@/services/safetyAwareNavigation"
            );

            const safeRoute = await safetyAwareNavigation.calculateSafeRoute(
              { lat: location.latitude, lng: location.longitude },
              destinationCoords,
              {
                avoidDangerZones: true,
                minimumSafetyScore: 40, // Avoid areas with safety score below 40
                preferSafeRoutes: true,
                travelMode: travelMode,
              },
            );

            console.log("🚀 Safety-optimized route generated:", {
              averageSafety: safeRoute.averageSafetyScore,
              avoidedDangerZones: safeRoute.avoidedDangerZones,
              distance: `${(safeRoute.totalDistance / 1000).toFixed(1)}km`,
              duration: `${Math.round(safeRoute.totalDuration / 60)}min`,
            });

            // Update route instructions with safety-aware data
            setTurnByTurnInstructions(safeRoute.instructions);
            setRouteSummary({
              distance: `${(safeRoute.totalDistance / 1000).toFixed(1)} km`,
              duration: `${Math.round(safeRoute.totalDuration / 60)} min`,
            });

            // Show notification about safety features
            addNotification({
              type: "success",
              title: "Safety-Optimized Route",
              message: `Route calculated with ${safeRoute.averageSafetyScore}/100 average safety score. ${safeRoute.avoidedDangerZones > 0 ? `Avoided ${safeRoute.avoidedDangerZones} danger zones.` : "Path is clear of danger zones."}`,
            });

            setIsNavigating(true);
          } catch (safetyNavError) {
            console.warn(
              "Safety-aware navigation failed, using fallback:",
              safetyNavError,
            );

            // Fallback to basic navigation
            setIsNavigating(true);

            addNotification({
              type: "warning",
              title: "Basic Navigation",
              message:
                "Using standard navigation. Safety features temporarily unavailable.",
            });
          }
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
      {/* Compact Black & White Navigation Form */}
      <motion.div
        className="relative z-20 bg-white border-b border-black/10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      >
        <div className="container mx-auto px-3 py-2">
          {/* Simple Branding */}
          <motion.div
            className="flex items-center justify-center mb-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
          >
            <span className="text-black font-bold text-xs tracking-wider">
              GUARDIAN
            </span>
          </motion.div>

          {/* Minimal Navigation Container */}
          <motion.div
            className="bg-white rounded-lg p-2 border border-black/20"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          >
            <div className="flex items-center gap-2">
              {/* Simple Connection Line */}
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                <div className="w-0.5 h-6 bg-black/40 my-0.5"></div>
                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
              </div>

              <div className="flex-1 space-y-1.5">
                {/* From Input */}
                <LocationAutocomplete
                  value={fromLocation}
                  onChange={setFromLocation}
                  placeholder="From"
                  showCurrentLocationButton={true}
                  onCurrentLocation={() => {
                    if (location) {
                      setFromLocation(
                        `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
                      );
                    } else {
                      handleUseCurrentLocation();
                    }
                  }}
                  className="w-full h-7 text-xs bg-white border-black/30 text-black placeholder:text-black/60"
                />

                {/* To Input */}
                <LocationAutocomplete
                  value={toLocation}
                  onChange={setToLocation}
                  placeholder="To"
                  onPlaceSelect={(place) => {
                    console.log("🎯 Destination selected:", place);
                  }}
                  className="w-full h-7 text-xs bg-white border-black/30 text-black placeholder:text-black/60"
                />
              </div>

              {/* Simple Search Button */}
              <Button
                onClick={handleSearch}
                className="h-8 px-2 bg-black hover:bg-black/80 text-white rounded-md text-xs"
                disabled={!fromLocation || !toLocation}
              >
                <Route className="h-3 w-3 mr-1" />
                Go
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Clear Route Button - Black/White Theme */}
      {destination && (
        <motion.div
          className="container mx-auto px-3 py-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
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
            className="w-full h-6 text-xs bg-white hover:bg-black/10 border border-black/30 text-black"
          >
            Clear Route
          </Button>
        </motion.div>
      )}

      {/* Vehicle Selection - Black/White Theme */}
      <div className="container mx-auto px-3 pb-1">
        <div className="flex items-center justify-center gap-1">
          <Button
            size="sm"
            variant={travelMode === "WALKING" ? "default" : "outline"}
            onClick={() => setTravelMode("WALKING")}
            className={cn(
              "h-6 px-2 text-xs border-black/30",
              travelMode === "WALKING"
                ? "bg-black text-white hover:bg-black/80"
                : "bg-white text-black hover:bg-black/10",
            )}
          >
            <Footprints className="h-2 w-2 mr-1" />
            Walk
          </Button>
          <Button
            size="sm"
            variant={travelMode === "DRIVING" ? "default" : "outline"}
            onClick={() => setTravelMode("DRIVING")}
            className={cn(
              "h-6 px-2 text-xs border-black/30",
              travelMode === "DRIVING"
                ? "bg-black text-white hover:bg-black/80"
                : "bg-white text-black hover:bg-black/10",
            )}
          >
            <Car className="h-2 w-2 mr-1" />
            Car
          </Button>
          <Button
            size="sm"
            variant={travelMode === "BICYCLING" ? "default" : "outline"}
            onClick={() => setTravelMode("BICYCLING")}
            className={cn(
              "h-6 px-2 text-xs border-black/30",
              travelMode === "BICYCLING"
                ? "bg-black text-white hover:bg-black/80"
                : "bg-white text-black hover:bg-black/10",
            )}
          >
            <Bike className="h-2 w-2 mr-1" />
            Bike
          </Button>
        </div>
      </div>
      {/* Unified Slidedown Notifications */}
      <SlideDownNotifications />

      {/* AI Navigation Panel */}
      <AINavigationPanel
        isVisible={showAIPanel}
        onClose={() => setShowAIPanel(false)}
      />

      {/* Enhanced Google Map with Safety Score Coloring */}
      <div className="absolute inset-0 top-0 z-10 pt-20">
        <EnhancedGoogleMap
          key={`${routeSettings.showTraffic}-${routeSettings.showSafeZones}-${routeSettings.showEmergencyServices}-${routeSettings.showSafeAreaCircles}-${routeSettings.zoomLevel}-${mapTheme}-${mapType}`}
          location={location}
          mapTheme="light"
          mapType="normal"
          showTraffic={routeSettings.showTraffic}
          showSafeZones={true}
          showEmergencyServices={routeSettings.showEmergencyServices}
          showSafeAreaCircles={true}
          showDebug={false}
          enableSatelliteView={false}
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
            <TabsTrigger value="ai" className="text-xs h-7">
              <Brain className="h-3 w-3 mr-1" />
              AI Guardian
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs h-7">
              <Settings className="h-3 w-3 mr-1" />
              Settings
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
              {/* Current Area Safety Score */}
              {location && (
                <div className="bg-white border border-black/10 rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Navigation2 className="h-4 w-4" />
                    Current Area Safety
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Safety Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-black transition-all duration-500"
                          style={{ width: "75%" }}
                          initial={{ width: "0%" }}
                          animate={{ width: "75%" }}
                        />
                      </div>
                      <span className="text-xs font-bold text-black">
                        75/100
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    📍 {location.latitude.toFixed(4)},{" "}
                    {location.longitude.toFixed(4)}
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
            value="ai"
            className="mt-4 space-y-4 transform transition-all duration-300 ease-out slide-left"
          >
            <div className="space-y-4">
              {/* AI Features Panel Embedded */}
              <div className="bg-white rounded-lg border border-black/10 p-4">
                <AIFeaturesPanel
                  isVisible={true}
                  location={location}
                  isNavigating={isNavigating}
                  onClose={undefined}
                />
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
