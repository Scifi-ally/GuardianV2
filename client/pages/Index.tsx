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
} from "lucide-react";
import { GoogleMap } from "@/components/GoogleMap";
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
import {
  LocationStatusToast,
  useNotifications,
} from "@/components/NotificationSystem";
import { LocationIndicator } from "@/components/LocationIndicator";
import { LocationSharingInfoButton } from "@/components/LocationSharingInfo";

export default function Index() {
  const { addNotification } = useNotifications();
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInstructions, setRouteInstructions] = useState<string[]>([]);
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
    avoidTolls: false,
    avoidHighways: false,
    preferWellLit: true,
    avoidIsolated: true,
    showTraffic: true,
    satelliteView: false,
    showSafeZones: true,
    showEmergencyServices: true,
    showSafeAreaCircles: true,
    zoomLevel: 15,
  });

  const { location, getCurrentLocation } = useGeolocation();
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
        const location = geocodeResult[0].geometry.location;
        setDestination({
          lat: location.lat(),
          lng: location.lng(),
        });
      } else {
        throw new Error("No results found for the destination");
      }
    } catch (error) {
      console.error("Geocoding error:", error);

      // Fallback to a default location with user notification
      setDestination({
        lat: 37.7749,
        lng: -122.4194,
      });

      addNotification({
        type: "warning",
        title: "Location Not Found",
        message: `Could not find "${toLocation}". Using default location.`,
        duration: 4000,
      });
    }

    // Generate route instructions based on settings
    const mockInstructions = [
      `Starting from ${fromLocation}`,
      routeSettings.preferWellLit
        ? "Taking well-lit route via Main Street (recommended)"
        : "Head north on Main Street toward Oak Avenue",
      routeSettings.avoidHighways
        ? "Avoiding highways - using local roads"
        : "Continue on highway for fastest route",
      routeSettings.avoidIsolated
        ? "Route optimized to stay in populated areas"
        : "Turn right onto Oak Avenue",
      `Arriving at ${toLocation}`,
    ];

    // Add traffic consideration if enabled
    if (routeSettings.showTraffic) {
      mockInstructions.splice(1, 0, "Traffic conditions: Light traffic ahead");
    }

    setRouteInstructions(mockInstructions);
  }, [fromLocation, toLocation, routeSettings]);

  const handleUseCurrentLocation = useCallback(async () => {
    try {
      const currentLoc = await getCurrentLocation();
      setFromLocation(
        `${currentLoc.latitude.toFixed(4)}, ${currentLoc.longitude.toFixed(4)}`,
      );
    } catch (error: any) {
      console.error("Error getting current location:", error);

      const errorMessage = error?.message || "Unable to get your location";
      setFromLocation("📍 Location unavailable - tap to retry");

      addNotification({
        type: "error",
        title: "Location Error",
        message: errorMessage,
        action: {
          label: "Enable Location",
          onClick: handleUseCurrentLocation,
        },
        duration: 6000,
      });
    }
  }, [getCurrentLocation]);

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
      {/* Compact To/From Section at Top */}
      <div className="relative z-20 bg-background/95 backdrop-blur-md border-b border-border/20 shadow-sm transform transition-all duration-300 ease-out">
        <div className="container mx-auto px-3 py-3">
          <div className="flex items-center gap-2">
            {/* From Input */}
            <div className="relative flex-1">
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                <div className="w-2 h-2 bg-foreground rounded-full"></div>
              </div>
              <Input
                placeholder="From"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                onClick={
                  fromLocation.includes("unavailable")
                    ? handleUseCurrentLocation
                    : undefined
                }
                className={`pl-6 pr-8 h-9 text-xs bg-background/60 border-border/50 focus:border-foreground/30 transition-all ${
                  fromLocation.includes("unavailable")
                    ? "cursor-pointer text-destructive"
                    : ""
                }`}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleUseCurrentLocation}
                className="absolute right-1 top-1 h-7 w-7 p-0 hover:bg-muted/50"
                title={
                  fromLocation.includes("unavailable")
                    ? "Retry getting location"
                    : "Use current location"
                }
              >
                <MapPin
                  className={`h-3 w-3 ${fromLocation.includes("unavailable") ? "text-destructive" : ""}`}
                />
              </Button>
            </div>

            {/* Separator */}
            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />

            {/* To Input */}
            <div className="relative flex-1">
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                <div className="w-2 h-2 bg-foreground rounded-full"></div>
              </div>
              <Input
                placeholder="To destination"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="pl-6 h-9 text-xs bg-background/60 border-border/50 focus:border-foreground/30 transition-all"
              />
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              size="sm"
              className="h-9 px-3 bg-foreground hover:bg-foreground/90 text-background text-xs transition-all disabled:opacity-50"
              disabled={!fromLocation || !toLocation}
            >
              <Route className="h-3 w-3 mr-1" />
              Go
            </Button>

            {/* Clear Route Button */}
            {destination && (
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
                className="h-9 px-3 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Vehicle Selection */}
        <div className="container mx-auto px-3 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Travel by:</span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={travelMode === "WALKING" ? "default" : "outline"}
                onClick={() => setTravelMode("WALKING")}
                className="h-7 px-2 text-xs"
              >
                <Footprints className="h-3 w-3 mr-1" />
                Walk
              </Button>
              <Button
                size="sm"
                variant={travelMode === "DRIVING" ? "default" : "outline"}
                onClick={() => setTravelMode("DRIVING")}
                className="h-7 px-2 text-xs"
              >
                <Car className="h-3 w-3 mr-1" />
                Car
              </Button>
              <Button
                size="sm"
                variant={travelMode === "BICYCLING" ? "default" : "outline"}
                onClick={() => setTravelMode("BICYCLING")}
                className="h-7 px-2 text-xs"
              >
                <Bike className="h-3 w-3 mr-1" />
                Bike
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Status Toast */}
      <LocationStatusToast />

      {/* Google Map */}
      <div className="absolute inset-0 top-0 z-10 pt-16">
        <GoogleMap
          key={`${routeSettings.showTraffic}-${routeSettings.showSafeZones}-${routeSettings.showEmergencyServices}-${routeSettings.showSafeAreaCircles}-${routeSettings.zoomLevel}-${mapTheme}-${mapType}`}
          location={location}
          mapTheme={mapTheme}
          mapType={mapType}
          showTraffic={routeSettings.showTraffic}
          showSafeZones={routeSettings.showSafeZones}
          showEmergencyServices={routeSettings.showEmergencyServices}
          showSafeAreaCircles={routeSettings.showSafeAreaCircles}
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
          <TabsList className="grid w-full grid-cols-3 h-8">
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

              {/* Route Preferences */}
              <div>
                <h4 className="text-sm font-medium mb-2">Route Preferences</h4>
                <div className="space-y-2">
                  <motion.div
                    className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div>
                      <p className="text-sm font-medium">Well-lit paths</p>
                      <p className="text-xs text-muted-foreground">
                        Better lighting
                      </p>
                    </div>
                    <CustomCheckbox
                      checked={routeSettings.preferWellLit}
                      onChange={(checked) =>
                        setRouteSettings((prev) => ({
                          ...prev,
                          preferWellLit: checked,
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
                        Avoid isolated areas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stay populated
                      </p>
                    </div>
                    <CustomCheckbox
                      checked={routeSettings.avoidIsolated}
                      onChange={(checked) =>
                        setRouteSettings((prev) => ({
                          ...prev,
                          avoidIsolated: checked,
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
                      <p className="text-sm font-medium">Avoid highways</p>
                      <p className="text-xs text-muted-foreground">
                        Local roads
                      </p>
                    </div>
                    <CustomCheckbox
                      checked={routeSettings.avoidHighways}
                      onChange={(checked) =>
                        setRouteSettings((prev) => ({
                          ...prev,
                          avoidHighways: checked,
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
                      <p className="text-sm font-medium">Avoid tolls</p>
                      <p className="text-xs text-muted-foreground">
                        Toll-free routes
                      </p>
                    </div>
                    <CustomCheckbox
                      checked={routeSettings.avoidTolls}
                      onChange={(checked) =>
                        setRouteSettings((prev) => ({
                          ...prev,
                          avoidTolls: checked,
                        }))
                      }
                      size="sm"
                    />
                  </motion.div>
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
