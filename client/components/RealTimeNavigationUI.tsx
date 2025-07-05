import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Volume2,
  VolumeX,
  Clock,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Compass,
  Fuel,
  Car,
  Square,
  X,
  Route,
  Phone,
  Home,
  Zap,
  Coffee,
  Utensils,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import RealTimeNavigationService, {
  NavigationState,
  NavigationStep,
  TrafficInfo,
} from "@/services/realTimeNavigationService";

interface RealTimeNavigationUIProps {
  isVisible: boolean;
  onClose: () => void;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  map?: google.maps.Map;
}

export function RealTimeNavigationUI({
  isVisible,
  onClose,
  origin,
  destination,
  map,
}: RealTimeNavigationUIProps) {
  const [navState, setNavState] = useState<NavigationState | null>(null);
  const [showServiceMenu, setShowServiceMenu] = useState(false);
  const [nearbyServices, setNearbyServices] = useState<any[]>([]);
  const navigationService = useRef(RealTimeNavigationService.getInstance());

  useEffect(() => {
    const unsubscribe = navigationService.current.subscribe(setNavState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isVisible && !navState?.isNavigating) {
      startNavigation();
    }
  }, [isVisible]);

  const startNavigation = async () => {
    const success = await navigationService.current.startNavigation(
      origin,
      destination,
      map,
    );
    if (!success) {
      onClose();
    }
  };

  const stopNavigation = () => {
    navigationService.current.stopNavigation();
    onClose();
  };

  const toggleVoice = () => {
    navigationService.current.toggleVoice(!navState?.voiceEnabled);
  };

  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver.toLowerCase()) {
      case "turn-left":
      case "left":
        return <ArrowLeft className="h-6 w-6" />;
      case "turn-right":
      case "right":
        return <ArrowRight className="h-6 w-6" />;
      case "straight":
      case "continue":
        return <ArrowUp className="h-6 w-6" />;
      case "u-turn":
      case "uturn":
        return <RotateCcw className="h-6 w-6" />;
      case "slight-left":
        return (
          <div className="transform -rotate-45">
            <ArrowUp className="h-6 w-6" />
          </div>
        );
      case "slight-right":
        return (
          <div className="transform rotate-45">
            <ArrowUp className="h-6 w-6" />
          </div>
        );
      default:
        return <ArrowUp className="h-6 w-6" />;
    }
  };

  const findNearbyServices = async (
    type:
      | "gas_station"
      | "parking"
      | "electric_vehicle_charging_station"
      | "restaurant",
  ) => {
    if (!navState) return;

    // Use current location or destination
    navigator.geolocation.getCurrentPosition(async (position) => {
      const currentPos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const services = await navigationService.current.findNearbyServices(
        currentPos,
        type,
      );
      setNearbyServices(services);
      setShowServiceMenu(true);
    });
  };

  const getSpeedColor = () => {
    if (!navState) return "text-gray-500";

    const speedDiff = navState.currentSpeed - navState.speedLimit;
    if (speedDiff > 10) return "text-red-600";
    if (speedDiff > 5) return "text-orange-500";
    if (speedDiff > 0) return "text-yellow-600";
    return "text-green-600";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isVisible || !navState) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex flex-col">
      {/* Top Navigation Bar */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="bg-white shadow-lg border-b border-gray-200"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={stopNavigation}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Navigation</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVoice}
              className={cn(
                "h-8 w-8 p-0",
                navState.voiceEnabled
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                  : "text-gray-400 hover:bg-gray-100",
              )}
            >
              {navState.voiceEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowServiceMenu(true)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <Fuel className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Traffic Alert */}
        <AnimatePresence>
          {navState.trafficInfo && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="bg-orange-50 border-t border-orange-200 px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-800">
                  {navState.trafficInfo.cause} -{" "}
                  {navState.trafficInfo.delayMinutes} min delay
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Navigation Display */}
      <div className="flex-1 flex flex-col">
        {/* Primary Instruction */}
        <motion.div
          key={navState.currentStep?.instruction}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white shadow-md"
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                {navState.currentStep ? (
                  getManeuverIcon(navState.currentStep.maneuver)
                ) : (
                  <Navigation className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {navState.currentStep?.instruction ||
                    "Preparing navigation..."}
                </h2>
                {navState.currentStep?.streetName && (
                  <p className="text-gray-600">
                    on {navState.currentStep.streetName}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-500">
                    {navState.currentStep?.distance}
                  </span>
                  {navState.currentStep?.laneInfo && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Lane:</span>
                      {navState.currentStep.laneInfo.laneDirections.map(
                        (direction, index) => (
                          <div
                            key={index}
                            className={cn(
                              "w-3 h-3 border border-gray-300",
                              index + 1 ===
                                navState.currentStep?.laneInfo?.recommendedLane
                                ? "bg-blue-500"
                                : "bg-white",
                            )}
                          />
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Instruction Preview */}
        {navState.nextStep && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gray-200 rounded">
                {getManeuverIcon(navState.nextStep.maneuver)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Then {navState.nextStep.instruction}
                </p>
                <p className="text-xs text-gray-500">
                  {navState.nextStep.distance}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="bg-white border-t border-gray-200 mt-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {formatTime(navState.estimatedTimeArrival)}
                </div>
                <div className="text-xs text-gray-500">ETA</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {navState.remainingDuration}
                </div>
                <div className="text-xs text-gray-500">Time</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {navState.remainingDistance}
                </div>
                <div className="text-xs text-gray-500">Distance</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Speed Display */}
              <div className="text-center">
                <div className={cn("text-lg font-semibold", getSpeedColor())}>
                  {Math.round(navState.currentSpeed)}
                </div>
                <div className="text-xs text-gray-500">
                  {navState.speedLimit} mph
                </div>
              </div>

              {/* Compass */}
              <div className="relative">
                <Compass
                  className="h-8 w-8 text-gray-600"
                  style={{ transform: `rotate(${navState.compassHeading}deg)` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Menu */}
      <AnimatePresence>
        {showServiceMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50"
            onClick={() => setShowServiceMenu(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white rounded-t-2xl w-full max-h-96 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Nearby Services</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowServiceMenu(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1"
                    onClick={() => findNearbyServices("gas_station")}
                  >
                    <Fuel className="h-5 w-5" />
                    <span className="text-sm">Gas Stations</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1"
                    onClick={() => findNearbyServices("parking")}
                  >
                    <Car className="h-5 w-5" />
                    <span className="text-sm">Parking</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1"
                    onClick={() =>
                      findNearbyServices("electric_vehicle_charging_station")
                    }
                  >
                    <Zap className="h-5 w-5" />
                    <span className="text-sm">EV Charging</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-16 flex flex-col gap-1"
                    onClick={() => findNearbyServices("restaurant")}
                  >
                    <Utensils className="h-5 w-5" />
                    <span className="text-sm">Food</span>
                  </Button>
                </div>

                {nearbyServices.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">
                      Found {nearbyServices.length} locations
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {nearbyServices.map((service, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {service.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {service.vicinity}
                            </div>
                          </div>
                          {service.rating && (
                            <Badge variant="secondary" className="text-xs">
                              ⭐ {service.rating}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rerouting Indicator */}
      <AnimatePresence>
        {navState.isRerouting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60"
          >
            <Card className="p-6 bg-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin">
                  <Route className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">Recalculating Route</div>
                  <div className="text-sm text-gray-600">
                    Finding better path...
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RealTimeNavigationUI;
