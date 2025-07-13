import { useState, useEffect, useRef, useCallback } from "react";
import {
  Navigation as NavIcon,
  MapPin,
  Clock,
  Route,
  Mic,
  Car,
  Bike,
  Footprints,
  Shield,
  Zap,
  RotateCcw,
  Settings,
} from "lucide-react";
import { MagicNavbar } from "@/components/MagicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocationAwareMap } from "@/components/LocationAwareMap";
import { EnhancedNavigationController } from "@/components/EnhancedNavigationController";
import { LocationAutocompleteInput } from "@/components/LocationAutocompleteInput";
import { AINavigationPanel } from "@/components/AINavigationPanel";
import { NavigationInstructions } from "@/components/NavigationInstructions";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { aiEnhancedNavigation } from "@/services/aiEnhancedNavigation";
import { realTimeSafetyMonitor } from "@/services/realTimeSafetyMonitor";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function EnhancedNavigationPage() {
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState("WALKING");
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  const [safetyScore, setSafetyScore] = useState(75);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [directionsResult, setDirectionsResult] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [activeTab, setActiveTab] = useState("navigate");
  const [navigationStats, setNavigationStats] = useState({
    totalDistance: "0 km",
    estimatedTime: "0 min",
    routesSaved: 12,
    avgSafetyScore: 82,
  });
  const [recentRoutes, setRecentRoutes] = useState([
    {
      id: 1,
      name: "Home → University",
      distance: "2.3 km",
      time: "15 min",
      safetyScore: 88,
      lastUsed: "Today",
    },
    {
      id: 2,
      name: "Office → Gym",
      distance: "1.1 km",
      time: "8 min",
      safetyScore: 92,
      lastUsed: "Yesterday",
    },
    {
      id: 3,
      name: "Mall → Home",
      distance: "3.7 km",
      time: "22 min",
      safetyScore: 76,
      lastUsed: "3 days ago",
    },
  ]);

  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Initialize location service
    const initLocation = async () => {
      const location = await enhancedLocationService.getCurrentLocation();
      setCurrentLocation(location);
      console.log("✅ Enhanced Navigation ready with location");
    };

    initLocation();

    // Subscribe to location updates
    const unsubscribe = enhancedLocationService.subscribe((location) => {
      setCurrentLocation(location);

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
    });

    return () => {
      unsubscribe();
      unsubscribeSafety();
    };
  }, [isNavigating]);

  const handleNavigationStart = useCallback(
    async (destination: google.maps.LatLng, routeAnalysis: any) => {
      if (!currentLocation) {
        toast.error("Current location not available");
        return;
      }

      try {
        console.log("🚀 Starting enhanced navigation...");

        // Start AI-enhanced navigation
        const route = await aiEnhancedNavigation.startNavigation(
          { lat: currentLocation.latitude, lng: currentLocation.longitude },
          { lat: destination.lat(), lng: destination.lng() },
        );

        setCurrentRoute(route);
        setIsNavigating(true);
        setShowAIPanel(true);
        setSafetyScore(routeAnalysis.overallSafety);

        // Update navigation stats
        setNavigationStats((prev) => ({
          ...prev,
          totalDistance: routeAnalysis.totalDistance,
          estimatedTime: routeAnalysis.estimatedTime,
        }));

        // Start real-time safety monitoring
        realTimeSafetyMonitor.startMonitoring({
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        });

        console.log("✅ Enhanced navigation started");
      } catch (error) {
        console.error("❌ Navigation failed:", error);
        toast.error("Failed to start navigation");
      }
    },
    [currentLocation],
  );

  const handleNavigationStop = useCallback(() => {
    console.log("🛑 Stopping enhanced navigation...");

    aiEnhancedNavigation.stopNavigation();
    realTimeSafetyMonitor.stopMonitoring();

    setIsNavigating(false);
    setCurrentRoute(null);
    setShowAIPanel(false);
    setDirectionsResult(null);
    setSafetyScore(75);

    // Reset navigation stats
    setNavigationStats((prev) => ({
      ...prev,
      totalDistance: "0 km",
      estimatedTime: "0 min",
    }));

    toast.success("Navigation stopped");
  }, []);

  const handleLocationUpdate = useCallback((location: any) => {
    setCurrentLocation(location);
  }, []);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    console.log("🗺️ Enhanced map loaded");
    setMapInstance(map);
  }, []);

  const handleSOSPress = () => {
    console.log("SOS triggered from enhanced navigation");
  };

  const transportModes = [
    { id: "WALKING", label: "Walk", icon: Footprints, color: "text-green-600" },
    { id: "DRIVING", label: "Drive", icon: Car, color: "text-blue-600" },
    { id: "BICYCLING", label: "Bike", icon: Bike, color: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative">
      {/* Enhanced Map Container */}
      <div className="h-screen w-full">
        <LocationAwareMap
          onLocationChange={handleLocationUpdate}
          onMapLoad={handleMapLoad}
          className="w-full h-full"
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

      {/* Enhanced Navigation Interface */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 bg-transparent border-b border-gray-200 rounded-none h-12">
              <TabsTrigger
                value="navigate"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <NavIcon className="h-4 w-4 mr-1" />
                Navigate
              </TabsTrigger>
              <TabsTrigger
                value="smart"
                className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-b-2 data-[state=active]:border-purple-600"
              >
                <Zap className="h-4 w-4 mr-1" />
                Smart
              </TabsTrigger>
              <TabsTrigger
                value="routes"
                className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-600"
              >
                <Route className="h-4 w-4 mr-1" />
                Routes
              </TabsTrigger>
              <TabsTrigger
                value="safety"
                className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-b-2 data-[state=active]:border-orange-600"
              >
                <Shield className="h-4 w-4 mr-1" />
                Safety
              </TabsTrigger>
            </TabsList>

            <div className="max-h-96 overflow-y-auto">
              <TabsContent value="navigate" className="mt-0 p-4 space-y-4">
                <AnimatePresence>
                  {isNavigating ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {/* Active Navigation Status */}
                      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-sm font-medium">
                                Navigating
                              </span>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  safetyScore >= 70
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800",
                                )}
                              >
                                Safety: {safetyScore}/100
                              </Badge>
                            </div>
                            <Button
                              onClick={handleNavigationStop}
                              size="sm"
                              variant="destructive"
                              className="h-8 px-3"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Stop
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="text-gray-600">Distance</div>
                              <div className="font-semibold">
                                {navigationStats.totalDistance}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-gray-600">ETA</div>
                              <div className="font-semibold">
                                {navigationStats.estimatedTime}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      {/* Search Interface */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">
                            Quick Navigation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <LocationAutocompleteInput
                            value=""
                            onChange={() => {}}
                            onPlaceSelect={(place) => {
                              if (mapRef.current && currentLocation) {
                                const destination = new google.maps.LatLng(
                                  place.geometry.location.lat,
                                  place.geometry.location.lng,
                                );
                                handleNavigationStart(destination, {
                                  overallSafety: 80,
                                  totalDistance: "Calculating...",
                                  estimatedTime: "Calculating...",
                                });
                              }
                            }}
                            placeholder="Search for destination..."
                            className="w-full"
                          />

                          {/* Transportation Mode Selection */}
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">
                              Travel Mode
                            </div>
                            <div className="flex gap-2">
                              {transportModes.map((mode) => {
                                const Icon = mode.icon;
                                return (
                                  <Button
                                    key={mode.id}
                                    size="sm"
                                    variant={
                                      selectedMode === mode.id
                                        ? "default"
                                        : "outline"
                                    }
                                    onClick={() => setSelectedMode(mode.id)}
                                    className={cn(
                                      "flex-1 h-12 flex flex-col items-center gap-1",
                                      selectedMode === mode.id &&
                                        "bg-blue-600 text-white",
                                    )}
                                  >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-xs">
                                      {mode.label}
                                    </span>
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="smart" className="mt-0 p-4">
                <EnhancedNavigationController
                  map={mapInstance}
                  currentLocation={currentLocation}
                  onNavigationStart={handleNavigationStart}
                  onLocationUpdate={handleLocationUpdate}
                  isNavigating={isNavigating}
                  onNavigationStop={handleNavigationStop}
                />
              </TabsContent>

              <TabsContent value="routes" className="mt-0 p-4 space-y-4">
                {/* Navigation Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Navigation Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {navigationStats.routesSaved}
                        </div>
                        <div className="text-gray-600">Routes Saved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {navigationStats.avgSafetyScore}
                        </div>
                        <div className="text-gray-600">Avg Safety</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Routes */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Recent Routes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentRoutes.map((route) => (
                      <div
                        key={route.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {route.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {route.distance} • {route.time} • {route.lastUsed}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              route.safetyScore >= 80 ? "default" : "secondary"
                            }
                            className={cn(
                              "text-xs",
                              route.safetyScore >= 80
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800",
                            )}
                          >
                            {route.safetyScore}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                          >
                            Use
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="safety" className="mt-0 p-4 space-y-4">
                {/* Current Safety Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      Current Area Safety
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="text-3xl font-bold text-green-600">
                        {safetyScore}/100
                      </div>
                      <div className="text-sm text-gray-600">
                        {safetyScore >= 80
                          ? "Very Safe"
                          : safetyScore >= 60
                            ? "Generally Safe"
                            : "Exercise Caution"}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            safetyScore >= 80
                              ? "bg-green-500"
                              : safetyScore >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500",
                          )}
                          style={{ width: `${safetyScore}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Safety Features */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      AI Safety Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          Real-time Analysis
                        </div>
                        <div className="text-xs text-gray-600">
                          AI-powered safety scoring
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800"
                      >
                        Active
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          Route Optimization
                        </div>
                        <div className="text-xs text-gray-600">
                          Safest path calculation
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-blue-100 text-blue-800"
                      >
                        Enabled
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          Emergency Detection
                        </div>
                        <div className="text-xs text-gray-600">
                          Automatic threat monitoring
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-purple-100 text-purple-800"
                      >
                        Monitoring
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
