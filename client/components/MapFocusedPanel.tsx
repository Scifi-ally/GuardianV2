import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Map,
  MapPin,
  Clock,
  Route,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Satellite,
  Eye,
  Car,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MapControlsProps {
  mapType: string;
  onMapTypeChange: (type: string) => void;
  trafficEnabled: boolean;
  onTrafficToggle: (enabled: boolean) => void;
  satelliteEnabled: boolean;
  onSatelliteToggle: (enabled: boolean) => void;
}

interface RouteInfoProps {
  isNavigating: boolean;
  routeSummary?: {
    distance: string;
    duration: string;
    traffic?: string;
  };
  currentStep?: {
    instruction: string;
    distance: string;
    direction: string;
  };
  onStopNavigation?: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  mapType,
  onMapTypeChange,
  trafficEnabled,
  onTrafficToggle,
  satelliteEnabled,
  onSatelliteToggle,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Map Type Controls */}
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Map className="h-4 w-4" />
            Map Display
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={mapType === "roadmap" ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Map button clicked");
                  onMapTypeChange("roadmap");
                }}
                className={cn(
                  "h-12 flex flex-col gap-1 clickable w-full transition-all duration-200 cursor-pointer",
                  mapType === "roadmap"
                    ? "bg-gray-900 text-white shadow-lg"
                    : "hover:bg-gray-50 border-2 border-gray-200",
                )}
                style={{ pointerEvents: "auto" }}
              >
                <Map className="h-5 w-5" />
                <span className="text-xs font-medium">Map</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={mapType === "satellite" ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Satellite button clicked");
                  onMapTypeChange("satellite");
                }}
                className={cn(
                  "h-12 flex flex-col gap-1 clickable w-full transition-all duration-200 cursor-pointer",
                  mapType === "satellite"
                    ? "bg-gray-900 text-white shadow-lg"
                    : "hover:bg-gray-50 border-2 border-gray-200",
                )}
                style={{ pointerEvents: "auto" }}
              >
                <Satellite className="h-5 w-5" />
                <span className="text-xs font-medium">Satellite</span>
              </Button>
            </motion.div>
          </div>

          {/* Map Overlays */}
          <div className="space-y-3">
            <motion.div
              className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Car className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  Live Traffic
                </span>
              </div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant={trafficEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Traffic toggle clicked:", !trafficEnabled);
                    onTrafficToggle(!trafficEnabled);
                  }}
                  className={cn(
                    "h-8 px-4 clickable font-medium transition-all duration-200 cursor-pointer",
                    trafficEnabled
                      ? "bg-gray-900 hover:bg-gray-800 text-white"
                      : "hover:bg-gray-50 hover:text-gray-700 border-gray-300",
                  )}
                  style={{ pointerEvents: "auto" }}
                >
                  {trafficEnabled ? "On" : "Off"}
                </Button>
              </motion.div>
            </motion.div>
            <motion.div
              className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Building className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  Points of Interest
                </span>
              </div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant={satelliteEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("POI toggle clicked:", !satelliteEnabled);
                    onSatelliteToggle(!satelliteEnabled);
                  }}
                  className={cn(
                    "h-8 px-4 clickable font-medium transition-all duration-200 cursor-pointer",
                    satelliteEnabled
                      ? "bg-gray-900 hover:bg-gray-800 text-white"
                      : "hover:bg-gray-50 hover:text-gray-700 border-gray-300",
                  )}
                  style={{ pointerEvents: "auto" }}
                >
                  {satelliteEnabled ? "On" : "Off"}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* View Controls */}
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Options
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Recenter button clicked");
                  // Recenter map to user location
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                      const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                      };
                      // Trigger a custom event that can be caught by the map
                      window.dispatchEvent(
                        new CustomEvent("recenterMap", { detail: location }),
                      );
                    });
                  }
                }}
                className="h-12 flex flex-col gap-1 clickable w-full transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 border-gray-200 cursor-pointer"
                style={{ pointerEvents: "auto" }}
              >
                <Compass className="h-5 w-5" />
                <span className="text-xs font-medium">Recenter</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("3D View button clicked");
                  // Toggle 3D view
                  window.dispatchEvent(new CustomEvent("toggle3DView"));
                }}
                className="h-12 flex flex-col gap-1 clickable w-full transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 border-gray-200 cursor-pointer"
                style={{ pointerEvents: "auto" }}
              >
                <Layers className="h-5 w-5" />
                <span className="text-xs font-medium">3D View</span>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const RouteInfo: React.FC<RouteInfoProps> = ({
  isNavigating,
  routeSummary,
  currentStep,
  onStopNavigation,
}) => {
  if (!isNavigating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center py-8"
      >
        <motion.div
          className="relative mx-auto mb-4"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Route className="h-8 w-8 text-gray-600" />
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Navigation className="h-3 w-3 text-white" />
          </motion.div>
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Ready to Navigate
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Use the search bar above to find your destination
        </p>
        <motion.div
          className="flex justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="px-3 py-1 bg-blue-50 rounded-full text-xs font-medium text-blue-700">
            Real-time traffic
          </div>
          <div className="px-3 py-1 bg-emerald-50 rounded-full text-xs font-medium text-emerald-700">
            Smart routing
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Current Step */}
      {currentStep && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Navigation className="h-6 w-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <motion.p
                    className="font-semibold text-gray-900 text-base leading-tight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {currentStep.instruction}
                  </motion.p>
                  <motion.div
                    className="flex items-center gap-2 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-1 text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-lg">
                      <MapPin className="h-3 w-3" />
                      in {currentStep.distance}
                    </div>
                    {currentStep.direction && (
                      <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                        {currentStep.direction}
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Route Summary */}
      {routeSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-lg">
            <CardContent className="p-5">
              <motion.h3
                className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <Route className="h-4 w-4 text-indigo-600" />
                </div>
                Route Overview
              </motion.h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <motion.div
                  className="text-center p-3 bg-blue-50 rounded-xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-xl font-bold text-blue-900">
                      {routeSummary.duration}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-blue-700">ETA</p>
                </motion.div>
                <motion.div
                  className="text-center p-3 bg-emerald-50 rounded-xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span className="text-xl font-bold text-emerald-900">
                      {routeSummary.distance}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-emerald-700">
                    Distance
                  </p>
                </motion.div>
              </div>

              {routeSummary.traffic && (
                <motion.div
                  className="flex items-center justify-center gap-2 p-3 bg-orange-50 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Car className="h-4 w-4 text-orange-600" />
                  <Badge
                    variant="outline"
                    className="text-orange-800 border-orange-300 bg-orange-100 font-medium"
                  >
                    {routeSummary.traffic} traffic
                  </Badge>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stop Navigation */}
      {onStopNavigation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Stop Navigation button clicked");
              onStopNavigation();
            }}
            variant="destructive"
            className="w-full h-12 clickable bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
            style={{ pointerEvents: "auto" }}
          >
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <X className="h-5 w-5" />
              Stop Navigation
            </motion.div>
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

interface MapFocusedPanelProps {
  // Navigation props
  isNavigating: boolean;
  routeSummary?: {
    distance: string;
    duration: string;
    traffic?: string;
  };
  currentStep?: {
    instruction: string;
    distance: string;
    direction: string;
  };
  onStopNavigation?: () => void;

  // Map control props
  mapType: string;
  onMapTypeChange: (type: string) => void;
  trafficEnabled: boolean;
  onTrafficToggle: (enabled: boolean) => void;
  satelliteEnabled: boolean;
  onSatelliteToggle: (enabled: boolean) => void;
}

export const MapFocusedPanel: React.FC<MapFocusedPanelProps> = ({
  isNavigating,
  routeSummary,
  currentStep,
  onStopNavigation,
  mapType,
  onMapTypeChange,
  trafficEnabled,
  onTrafficToggle,
  satelliteEnabled,
  onSatelliteToggle,
}) => {
  const [activeTab, setActiveTab] = useState<"routes" | "map">(
    isNavigating ? "routes" : "map",
  );

  const tabs = [
    {
      id: "routes" as const,
      label: "Routes",
      icon: Navigation,
      content: (
        <RouteInfo
          isNavigating={isNavigating}
          routeSummary={routeSummary}
          currentStep={currentStep}
          onStopNavigation={onStopNavigation}
        />
      ),
    },
    {
      id: "map" as const,
      label: "Map",
      icon: Map,
      content: (
        <MapControls
          mapType={mapType}
          onMapTypeChange={onMapTypeChange}
          trafficEnabled={trafficEnabled}
          onTrafficToggle={onTrafficToggle}
          satelliteEnabled={satelliteEnabled}
          onSatelliteToggle={onSatelliteToggle}
        />
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex bg-gray-100/80 rounded-lg p-1 mb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(tab.id);
              }}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md clickable",
                "text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>

              {/* Active tab indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeMapTab"
                  className="absolute inset-0 bg-white rounded-md shadow-sm -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    duration: 0.4,
                    damping: 30,
                    stiffness: 300,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-0">
        <AnimatePresence mode="wait">
          {tabs.map((tab) => {
            if (tab.id !== activeTab) return null;

            return (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut",
                }}
                className="w-full"
              >
                {tab.content}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
