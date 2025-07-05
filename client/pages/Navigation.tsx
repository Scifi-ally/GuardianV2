import { useState, useEffect } from "react";
import {
  Navigation as Nav,
  MapPin,
  Clock,
  Route,
  Mic,
  Car,
  Bike,
  Footprints,
  Search,
  Target,
  Navigation2,
  StopCircle,
} from "lucide-react";
import { MagicNavbar } from "@/components/MagicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GoogleMapsNavigationView } from "@/components/GoogleMapsNavigationView";
import { AINavigationPanel } from "@/components/AINavigationPanel";
import { SlideUpPanel } from "@/components/SlideUpPanel";
import { NavigationInstructions } from "@/components/NavigationInstructions";
import { LocationAutocompleteInput } from "@/components/LocationAutocompleteInput";
import { RealTimeMapFeatures } from "@/components/RealTimeMapFeatures";
import { DebugPanel } from "@/components/DebugPanel";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { aiEnhancedNavigation } from "@/services/aiEnhancedNavigation";
import { realTimeSafetyMonitor } from "@/services/realTimeSafetyMonitor";
import { toast } from "sonner";

export default function NavigationPage() {
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState("WALKING");
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  const [safetyScore, setSafetyScore] = useState(75);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [directionsResult, setDirectionsResult] = useState<any>(null);
  const [locationStatus, setLocationStatus] = useState<
    "loading" | "real" | "fallback"
  >("loading");
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    // Get user's current location
    const initLocation = async () => {
      try {
        // Get real location or fallback
        const location = await enhancedLocationService.getCurrentLocation();
        setCurrentLocation(location);

        // Check if it's real location or fallback
        if (location.accuracy <= 100) {
          setFromLocation("Current Location");
          setLocationStatus("real");
          toast.success("Real location found! Navigation ready.", {
            duration: 3000,
          });
        } else {
          setFromLocation("Approximate Location");
          setLocationStatus("fallback");
          toast.info(
            "Using approximate location. Try moving for better accuracy.",
            { duration: 3000 },
          );
        }

        console.log("✅ App ready with location:", {
          lat: location.latitude.toFixed(6),
          lng: location.longitude.toFixed(6),
          accuracy: location.accuracy + "m",
          isReal: location.accuracy <= 100,
        });
      } catch (error) {
        console.error("Location error:", error);

        // Backup fallback
        const backupLocation = {
          latitude: 37.7749, // San Francisco
          longitude: -122.4194,
          accuracy: 1000,
          timestamp: Date.now(),
        };

        setCurrentLocation(backupLocation);
        setFromLocation("Demo Location");
        setLocationStatus("fallback");
        toast.warning("Using demo location for testing.", { duration: 3000 });
      }
    };

    initLocation();

    // Subscribe to location updates
    const unsubscribe = enhancedLocationService.subscribe((location) => {
      setCurrentLocation(location);

      // Update safety monitoring with new location
      if (isNavigating) {
        realTimeSafetyMonitor.updateLocation({
          lat: location.latitude,
          lng: location.longitude,
        });
      }
    });

    // Subscribe to safety updates
    const unsubscribeSafety = realTimeSafetyMonitor.subscribe((safetyData) => {
      setSafetyScore(safetyData.score);

      // Show safety alerts if any
      if (safetyData.alerts.length > 0) {
        safetyData.alerts.forEach((alert) => {
          toast.warning(alert, { duration: 5000 });
        });
      }
    });

    return () => {
      unsubscribe();
      unsubscribeSafety();
    };
  }, []);

  // Debug destination changes
  useEffect(() => {
    console.log("🎯 Destination changed:", destination);
  }, [destination]);

  // Debug navigation state changes
  useEffect(() => {
    console.log("🧭 Navigation state changed:", {
      isNavigating,
      hasRoute: !!currentRoute,
      hasDestination: !!destination,
    });
  }, [isNavigating, currentRoute, destination]);

  const handleSOSPress = () => {
    console.log("SOS triggered from navigation");
  };

  const handleGetRoute = async () => {
    console.log("🚀 handleGetRoute called", {
      currentLocation,
      toLocation,
      selectedPlace: selectedPlace?.name,
    });

    if (!currentLocation) {
      toast.error("Location not available");
      return;
    }

    if (!toLocation.trim() && !selectedPlace) {
      toast.error("Please enter a destination");
      return;
    }

    try {
      // Use selected place coordinates or fallback to mock destination
      const destinationCoords = selectedPlace?.geometry?.location
        ? {
            lat: selectedPlace.geometry.location.lat,
            lng: selectedPlace.geometry.location.lng,
          }
        : {
            lat: currentLocation.latitude + 0.01, // 1km north
            lng: currentLocation.longitude + 0.005, // 0.5km east
          };

      console.log("📍 Setting destination coordinates:", destinationCoords);
      setDestination(destinationCoords);

      // Add a small delay to ensure state is updated
      setTimeout(async () => {
        try {
          console.log("🚀 Starting AI navigation...");
          // Start AI-enhanced navigation
          const route = await aiEnhancedNavigation.startNavigation(
            { lat: currentLocation.latitude, lng: currentLocation.longitude },
            destinationCoords,
          );

          console.log("✅ AI navigation route received:", route);
          setCurrentRoute(route);
          setIsNavigating(true);
          setShowAIPanel(true);
          setSafetyScore(route.overallSafetyScore);
        } catch (routeError) {
          console.error("❌ AI navigation failed:", routeError);
        }
      }, 100);

      // Start real-time safety monitoring
      realTimeSafetyMonitor.startMonitoring({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      });
    } catch (error) {
      console.error("Failed to start navigation:", error);
      toast.error("Failed to start navigation. Please try again.");
    }
  };

  const handleStopNavigation = () => {
    aiEnhancedNavigation.stopNavigation();
    realTimeSafetyMonitor.stopMonitoring();
    setIsNavigating(false);
    setDestination(null);
    setCurrentRoute(null);
    setShowAIPanel(false);
    setDirectionsResult(null);
    setSafetyScore(75);
  };

  const handleDirectionsChange = (directions: any) => {
    setDirectionsResult(directions);
    if (directions) {
      // Extract safety score from route (mock calculation)
      const route = directions.routes[0];
      const distance = route.legs[0].distance.value;
      const mockSafetyScore = Math.max(
        40,
        Math.min(95, 80 - (distance / 1000) * 5),
      );
      setSafetyScore(Math.round(mockSafetyScore));
    }
  };

  const handleMapLoad = (map: google.maps.Map) => {
    console.log("🗺️ Map loaded, setting instance");
    setMapInstance(map);
  };

  const handlePlaceSelect = async (place: any) => {
    console.log("🎯 Place selected:", place);
    setSelectedPlace(place);

    // Auto-start navigation when a place is selected
    if (currentLocation && place.geometry?.location) {
      console.log("🚀 Auto-starting navigation for selected place");
      try {
        const destinationCoords = {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        };

        console.log(
          "📍 Auto-setting destination coordinates:",
          destinationCoords,
        );
        setDestination(destinationCoords);

        // Add a small delay to ensure state is updated
        setTimeout(async () => {
          try {
            console.log("🚀 Auto-starting AI navigation...");
            // Start AI-enhanced navigation
            const route = await aiEnhancedNavigation.startNavigation(
              { lat: currentLocation.latitude, lng: currentLocation.longitude },
              destinationCoords,
            );

            console.log("✅ Auto-navigation route received:", route);
            setCurrentRoute(route);
            setIsNavigating(true);
            setShowAIPanel(true);
            setSafetyScore(route.overallSafetyScore);
          } catch (routeError) {
            console.error("❌ Auto-navigation failed:", routeError);
          }
        }, 100);

        // Start real-time safety monitoring
        realTimeSafetyMonitor.startMonitoring({
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        });

        console.log("✅ Auto-navigation started successfully");
      } catch (error) {
        console.error("❌ Failed to auto-start navigation:", error);
        toast.error("Failed to start navigation. Please try again.");
      }
    } else {
      console.log("⚠️ Cannot auto-start navigation:", {
        hasCurrentLocation: !!currentLocation,
        hasPlaceGeometry: !!place.geometry?.location,
      });
    }
  };

  const transportModes = [
    { id: "WALKING", label: "Walk", icon: Footprints },
    { id: "DRIVING", label: "Drive", icon: Car },
    { id: "BICYCLING", label: "Bike", icon: Bike },
  ];

  return (
    <div className="min-h-screen bg-white relative">
      {/* Full screen map */}
      <div className="h-screen w-full">
        <GoogleMapsNavigationView
          location={currentLocation}
          destination={destination}
          isNavigating={isNavigating}
          safetyScore={safetyScore}
          travelMode={selectedMode}
          onDirectionsChange={handleDirectionsChange}
          onLocationChange={(loc) => setCurrentLocation(loc)}
          onMapLoad={handleMapLoad}
        />

        {/* Real-time features overlay */}
        <RealTimeMapFeatures
          map={mapInstance}
          currentLocation={currentLocation}
          onFeatureUpdate={(feature, data) => {
            console.log(`📊 ${feature} data updated:`, data);
          }}
        />

        {/* AI Navigation Panel */}
        <AINavigationPanel
          isVisible={showAIPanel}
          onClose={() => setShowAIPanel(false)}
        />

        {/* Real-time Navigation Instructions */}
        <NavigationInstructions
          directionsResult={directionsResult}
          currentLocation={currentLocation}
          isVisible={isNavigating && !!directionsResult}
        />
      </div>

      {/* Slide up panel for route planning */}
      <SlideUpPanel
        minHeight={280}
        maxHeight={480}
        initialHeight={320}
        bottomOffset={96}
        className="bg-white/95 backdrop-blur-sm"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-black">Smart Navigation</h2>
              <p className="text-sm text-gray-600">
                AI-powered routes with real-time safety
              </p>
            </div>
            {isNavigating && (
              <Button
                onClick={handleStopNavigation}
                size="sm"
                variant="destructive"
                className="h-8 px-3"
              >
                <StopCircle className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}
          </div>

          {/* Route Planning Card */}
          <Card className="bg-white/90 border-gray-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Route className="h-4 w-4 text-black" />
                <h3 className="text-sm font-medium text-black">Plan Route</h3>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <Input
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    placeholder="From location"
                    className="flex-1 text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 h-8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                  <LocationAutocompleteInput
                    value={toLocation}
                    onChange={setToLocation}
                    onPlaceSelect={handlePlaceSelect}
                    placeholder="Search for destination..."
                    className="flex-1 text-sm bg-white border-gray-300 text-black placeholder:text-gray-500 h-8"
                  />
                </div>
              </div>

              {/* Transportation Mode Selection */}
              <div className="bg-gray-50 rounded-lg p-2 mb-3">
                <div className="flex items-center justify-center gap-1">
                  {transportModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <Button
                        key={mode.id}
                        size="sm"
                        variant={
                          selectedMode === mode.id ? "default" : "outline"
                        }
                        onClick={() => setSelectedMode(mode.id)}
                        className={`h-7 px-2 text-xs ${
                          selectedMode === mode.id
                            ? "bg-black text-white"
                            : "bg-white hover:bg-black hover:text-white border-gray-300"
                        }`}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {mode.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleGetRoute}
                disabled={isNavigating}
                className="w-full bg-black hover:bg-gray-800 text-white border-0 h-8 text-sm"
              >
                <Navigation2 className="h-4 w-4 mr-2" />
                {isNavigating ? "Navigating..." : "Start Navigation"}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Routes */}
          <Card className="bg-white/90 border-gray-200">
            <CardContent className="p-3">
              <h3 className="text-sm font-medium text-black mb-2">
                Recent Routes
              </h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-white/80">
                  <div>
                    <p className="text-sm font-medium text-black">
                      Home → University
                    </p>
                    <p className="text-xs text-gray-600">
                      Via Main St • 15 min walk
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className="bg-black text-white border-0 text-xs px-2 py-0">
                      Safe
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-black hover:bg-gray-100 h-6 px-2 text-xs"
                    >
                      Use
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-white/80">
                  <div>
                    <p className="text-sm font-medium text-black">
                      Office → Gym
                    </p>
                    <p className="text-xs text-gray-600">
                      Via Park Ave • 8 min walk
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className="bg-black text-white border-0 text-xs px-2 py-0">
                      Safe
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 text-black hover:bg-gray-100 h-6 px-2 text-xs"
                    >
                      Use
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Safety Info */}
          <Card className="bg-white/90 border-gray-200">
            <CardContent className="py-3 text-center">
              <div className="space-y-2">
                <div className="p-2 rounded-full bg-gray-100 w-fit mx-auto">
                  <Clock className="h-4 w-4 text-black" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1 text-black">
                    Real-time Safety Updates
                  </h3>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    Routes updated with live safety data including lighting,
                    traffic, and community reports.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SlideUpPanel>

      <MagicNavbar onSOSPress={handleSOSPress} />

      {/* Debug Panel for development */}
      <DebugPanel
        currentLocation={currentLocation}
        destination={destination}
        isNavigating={isNavigating}
        selectedPlace={selectedPlace}
        toLocation={toLocation}
        safetyScore={safetyScore}
        directionsResult={directionsResult}
        mapInstance={mapInstance}
      />
    </div>
  );
}
