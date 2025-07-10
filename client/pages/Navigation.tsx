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
  Zap,
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

import { RealTimeNavigationUI } from "@/components/RealTimeNavigationUI";
import { NavigationModeSelector } from "@/components/NavigationModeSelector";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { aiEnhancedNavigation } from "@/services/aiEnhancedNavigation";
import NavigationIntegrationService from "@/services/navigationIntegrationService";
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
  const [isSearching, setIsSearching] = useState(false);
  const [showRealTimeNavigation, setShowRealTimeNavigation] = useState(false);
  const [navigationOrigin, setNavigationOrigin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [navigationDestination, setNavigationDestination] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [activeNavigationMode, setActiveNavigationMode] = useState<
    string | null
  >(null);

  useEffect(() => {
    // Get user's current location (immediate, no timeouts)
    const initLocation = async () => {
      // Always get location immediately without any waiting
      const location = await enhancedLocationService.getCurrentLocation();
      setCurrentLocation(location);

      // Set up the UI immediately
      setFromLocation("Current Location");
      setLocationStatus("real");
      setNavigationOrigin({ lat: location.latitude, lng: location.longitude });

      console.log("✅ App ready immediately with location:", {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        accuracy: location.accuracy + "m",
      });
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

    // Subscribe to location errors for better user feedback (only critical errors)
    const unsubscribeErrors = enhancedLocationService.subscribeToErrors(
      (error) => {
        if (error.code === 3) {
          // TIMEOUT
          // Completely silent - no notifications for timeout errors
          console.log("ℹ️ Location timeout handled silently");
        } else if (error.code === 1) {
          // PERMISSION_DENIED
          // Only show permission error once
          console.log("⚠️ Location permission denied");
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          // Silent handling
          console.log("ℹ️ GPS unavailable, using fallback location");
        }
      },
    );

    return () => {
      unsubscribe();
      unsubscribeSafety();
      unsubscribeErrors();
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

  const startRealTimeNavigation = () => {
    if (navigationOrigin && navigationDestination) {
      setShowRealTimeNavigation(true);
    } else {
      toast.error("Please select a destination first");
    }
  };

  const stopRealTimeNavigation = () => {
    setShowRealTimeNavigation(false);
  };

  const openModeSelector = () => {
    if (navigationOrigin && navigationDestination) {
      setShowModeSelector(true);
    } else {
      toast.error("Please select both origin and destination first");
    }
  };

  const handleModeSelect = (mode: string) => {
    setActiveNavigationMode(mode);
    if (mode === "realtime") {
      setShowRealTimeNavigation(true);
    }
  };

  const stopAllNavigation = () => {
    NavigationIntegrationService.getInstance().stopNavigation();
    setShowRealTimeNavigation(false);
    setActiveNavigationMode(null);
  };

  const handleGetRoute = async () => {
    console.log("���� handleGetRoute called", {
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

    setIsSearching(true);

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
          toast.error("Failed to calculate route. Please try again.");
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
    } finally {
      setIsSearching(false);
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
    setToLocation(place.name || place.formatted_address || "Selected location");

    // Set navigation destination coordinates
    if (place.geometry?.location) {
      const lat =
        typeof place.geometry.location.lat === "function"
          ? place.geometry.location.lat()
          : place.geometry.location.lat;
      const lng =
        typeof place.geometry.location.lng === "function"
          ? place.geometry.location.lng()
          : place.geometry.location.lng;

      setNavigationDestination({ lat, lng });
    }

    // Auto-start navigation when a place is selected
    if (currentLocation && place.geometry?.location) {
      console.log("🚀 Auto-starting navigation for selected place");
      setIsSearching(true);

      try {
        const destinationCoords = {
          lat:
            typeof place.geometry.location.lat === "function"
              ? place.geometry.location.lat()
              : place.geometry.location.lat,
          lng:
            typeof place.geometry.location.lng === "function"
              ? place.geometry.location.lng()
              : place.geometry.location.lng,
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
            toast.error("Failed to calculate route. Please try again.");
          } finally {
            setIsSearching(false);
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
        setIsSearching(false);
      }
    } else {
      console.log("⚠️ Cannot auto-start navigation:", {
        hasCurrentLocation: !!currentLocation,
        hasPlaceGeometry: !!place.geometry?.location,
      });
      toast.info("Location added. Click 'Start Navigation' to begin.");
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

              <div className="space-y-2">
                <Button
                  onClick={openModeSelector}
                  disabled={!navigationOrigin || !navigationDestination}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 h-9 text-sm font-medium"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Choose Navigation Mode
                </Button>

                {activeNavigationMode && (
                  <Button
                    onClick={stopAllNavigation}
                    className="w-full bg-red-600 hover:bg-red-700 text-white border-0 h-8 text-sm"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop Navigation
                  </Button>
                )}
              </div>
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

      {/* Navigation Mode Selector */}
      <NavigationModeSelector
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        onModeSelect={handleModeSelect}
        origin={navigationOrigin}
        destination={navigationDestination}
      />

      {/* Real-Time Navigation UI */}
      {showRealTimeNavigation && navigationOrigin && navigationDestination && (
        <RealTimeNavigationUI
          isVisible={showRealTimeNavigation}
          onClose={stopRealTimeNavigation}
          origin={navigationOrigin}
          destination={navigationDestination}
          map={mapInstance}
        />
      )}
    </div>
  );
}
