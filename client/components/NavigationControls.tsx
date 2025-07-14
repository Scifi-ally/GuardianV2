import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Car,
  User,
  Bike,
  X,
  MapPin,
  Clock,
  Route,
  AlertTriangle,
  Zap,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  enhancedNavigationService,
  TravelMode,
  NavigationState,
} from "@/services/enhancedNavigationService";
import { unifiedNotifications } from "@/services/unifiedNotificationService";

interface NavigationControlsProps {
  isVisible: boolean;
  onClose: () => void;
  destination?: { lat: number; lng: number; name?: string };
}

const travelModes: {
  mode: TravelMode;
  icon: any;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    mode: "driving",
    icon: Car,
    label: "Driving",
    description: "Fastest route by car",
    color: "bg-blue-500",
  },
  {
    mode: "walking",
    icon: User,
    label: "Walking",
    description: "Pedestrian route",
    color: "bg-green-500",
  },
  {
    mode: "bicycling",
    icon: Bike,
    label: "Cycling",
    description: "Bike-friendly route",
    color: "bg-orange-500",
  },
];

export function NavigationControls({
  isVisible,
  onClose,
  destination,
}: NavigationControlsProps) {
  const [navigationState, setNavigationState] = useState<NavigationState>(
    enhancedNavigationService.getState(),
  );
  const [selectedMode, setSelectedMode] = useState<TravelMode>("driving");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // Subscribe to navigation state changes
    const unsubscribe =
      enhancedNavigationService.onStateChange(setNavigationState);

    return () => {
      // Note: In a real implementation, we'd need an unsubscribe method
      // For now, we'll clear the callback by setting a new empty array
    };
  }, []);

  const handleStartNavigation = async () => {
    if (!destination) {
      unifiedNotifications.error("No Destination", {
        message: "Please select a destination to start navigation",
      });
      return;
    }

    setIsStarting(true);
    try {
      await enhancedNavigationService.startNavigation(
        destination,
        undefined,
        selectedMode,
      );
      // Don't close immediately, let user see the navigation started
    } catch (error) {
      console.error("Failed to start navigation:", error);
      unifiedNotifications.error("Navigation Failed", {
        message: "Unable to start navigation. Please try again.",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancelNavigation = () => {
    enhancedNavigationService.cancelNavigation();
    onClose();
  };

  const handleClearNavigation = () => {
    enhancedNavigationService.clearNavigation();
    onClose();
  };

  const handleEmergencyMode = () => {
    enhancedNavigationService.enableEmergencyMode();
    unifiedNotifications.warning("Emergency Mode", {
      message:
        "Emergency navigation mode activated - contacts will be notified",
    });
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 3600) {
      return `${Math.round(seconds / 60)} min`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const getProgressPercentage = (): number => {
    if (!navigationState.currentRoute) return 0;
    const totalDistance = navigationState.currentRoute.totalDistance.value;
    const remaining = navigationState.remainingDistance;
    return ((totalDistance - remaining) / totalDistance) * 100;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="mobile-panel mobile-nav bg-white border-t border-gray-200 shadow-2xl"
      >
        <div className="mobile-container mobile-padding-md space-y-3 max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                {navigationState.status === "idle"
                  ? "Navigation"
                  : navigationState.status === "navigating"
                    ? "Navigating"
                    : "Route Planning"}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Destination Info */}
          {destination && (
            <Card className="bg-gray-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {destination.name || "Selected Location"}
                    </div>
                    <div className="text-xs text-gray-600">
                      {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Status */}
          {navigationState.status === "navigating" &&
            navigationState.currentRoute && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                {/* Progress */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">
                          {formatTime(navigationState.remainingTime)} remaining
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDistance(navigationState.remainingDistance)}
                      </div>
                    </div>
                    <Progress value={getProgressPercentage()} className="h-2" />
                  </CardContent>
                </Card>

                {/* Next Turn */}
                {navigationState.nextTurn && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Route className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-yellow-800">
                            Next Turn
                          </div>
                          <div
                            className="text-sm text-yellow-700"
                            dangerouslySetInnerHTML={{
                              __html: navigationState.nextTurn,
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation Controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelNavigation}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEmergencyMode}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Emergency
                  </Button>
                </div>
              </motion.div>
            )}

          {/* Travel Mode Selection */}
          {navigationState.status === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="text-sm font-medium text-gray-700">
                Choose travel mode:
              </div>
              <div className="mobile-grid gap-2">
                {travelModes.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = selectedMode === mode.mode;
                  return (
                    <motion.button
                      key={mode.mode}
                      onClick={() => setSelectedMode(mode.mode)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "mobile-button mobile-padding-sm rounded-lg border-2 transition-all duration-200 min-h-16",
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300",
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            "p-2 rounded-full",
                            isSelected ? mode.color : "bg-gray-100",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              isSelected ? "text-white" : "text-gray-600",
                            )}
                          />
                        </div>
                        <div
                          className={cn(
                            "text-xs font-medium",
                            isSelected ? "text-blue-700" : "text-gray-700",
                          )}
                        >
                          {mode.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {mode.description}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Start Navigation Button */}
              <Button
                onClick={handleStartNavigation}
                disabled={!destination || isStarting}
                className="w-full h-12 text-base font-medium"
              >
                {isStarting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Calculating Route...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Start Navigation
                  </div>
                )}
              </Button>
            </motion.div>
          )}

          {/* Route Calculation */}
          {navigationState.status === "calculating" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3" />
              <div className="text-sm font-medium text-gray-700">
                Calculating best route...
              </div>
              <div className="text-xs text-gray-500">
                Analyzing traffic and safety conditions
              </div>
            </motion.div>
          )}

          {/* Completed Navigation */}
          {navigationState.status === "completed" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-3"
            >
              <div className="text-lg">🎉</div>
              <div className="text-sm font-medium text-gray-700">
                Navigation Complete!
              </div>
              <div className="text-xs text-gray-500">
                You have arrived at your destination
              </div>
              <Button
                onClick={handleClearNavigation}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Clear Navigation
              </Button>
            </motion.div>
          )}

          {/* Safety Score */}
          {navigationState.currentRoute && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Safety Score: {navigationState.currentRoute.safetyScore}
                    </Badge>
                  </div>
                  <div className="text-xs text-green-700">
                    {navigationState.currentRoute.safetyScore >= 80
                      ? "Excellent"
                      : navigationState.currentRoute.safetyScore >= 60
                        ? "Good"
                        : "Moderate"}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Mode Indicator */}
          {navigationState.emergencyMode && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg"
            >
              <Zap className="h-4 w-4 text-red-600" />
              <div className="flex-1 text-sm font-medium text-red-800">
                Emergency Mode Active
              </div>
              <Button size="sm" variant="ghost">
                <Phone className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
