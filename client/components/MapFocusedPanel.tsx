import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation,
  Map,
  Settings,
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

interface SettingsProps {
  onEmergencySettings: () => void;
  onLocationSettings: () => void;
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
      <Card className="border-0 bg-gray-50/80">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Map className="h-4 w-4" />
            Map Display
          </h3>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              variant={mapType === "roadmap" ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMapTypeChange("roadmap");
              }}
              className="h-10 flex flex-col gap-1 clickable"
            >
              <Map className="h-4 w-4" />
              <span className="text-xs">Map</span>
            </Button>
            <Button
              variant={mapType === "satellite" ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMapTypeChange("satellite");
              }}
              className="h-10 flex flex-col gap-1 clickable"
            >
              <Satellite className="h-4 w-4" />
              <span className="text-xs">Satellite</span>
            </Button>
          </div>

          {/* Map Overlays */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Live Traffic</span>
              </div>
              <Button
                variant={trafficEnabled ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onTrafficToggle(!trafficEnabled);
                }}
                className="h-8 px-3 clickable"
              >
                {trafficEnabled ? "On" : "Off"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Points of Interest</span>
              </div>
              <Button
                variant={satelliteEnabled ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSatelliteToggle(!satelliteEnabled);
                }}
                className="h-8 px-3 clickable"
              >
                {satelliteEnabled ? "On" : "Off"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Controls */}
      <Card className="border-0 bg-gray-50/80">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Options
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
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
              className="h-10 flex flex-col gap-1 clickable"
            >
              <Compass className="h-4 w-4" />
              <span className="text-xs">Recenter</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Toggle 3D view
                window.dispatchEvent(new CustomEvent("toggle3DView"));
              }}
              className="h-10 flex flex-col gap-1 clickable"
            >
              <Layers className="h-4 w-4" />
              <span className="text-xs">3D View</span>
            </Button>
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
        <Route className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Ready to Navigate
        </h3>
        <p className="text-sm text-gray-500">
          Search for a destination to get started
        </p>
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
        <Card className="border-l-4 border-blue-500 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Navigation className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {currentStep.instruction}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  in {currentStep.distance}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Summary */}
      {routeSummary && (
        <Card className="border-0 bg-gray-50/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Route className="h-4 w-4" />
              Route Summary
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-lg font-bold text-gray-900">
                    {routeSummary.duration}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Estimated Time</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-lg font-bold text-gray-900">
                    {routeSummary.distance}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Total Distance</p>
              </div>
            </div>

            {routeSummary.traffic && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2">
                  <Car className="h-4 w-4 text-orange-500" />
                  <Badge
                    variant="outline"
                    className="text-orange-700 border-orange-300 bg-orange-50"
                  >
                    {routeSummary.traffic} traffic
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stop Navigation */}
      {onStopNavigation && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onStopNavigation();
          }}
          variant="destructive"
          className="w-full h-12 clickable"
        >
          Stop Navigation
        </Button>
      )}
    </motion.div>
  );
};

const MapSettings: React.FC<SettingsProps> = ({
  onEmergencySettings,
  onLocationSettings,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <Card className="border-0 bg-gray-50/80">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Quick Settings
          </h3>

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEmergencySettings();
              }}
              className="w-full justify-start h-10 clickable"
            >
              Emergency Contacts
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onLocationSettings();
              }}
              className="w-full justify-start h-10 clickable"
            >
              Location Sharing
            </Button>
          </div>
        </CardContent>
      </Card>
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

  // Settings props
  onEmergencySettings: () => void;
  onLocationSettings: () => void;
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
  onEmergencySettings,
  onLocationSettings,
}) => {
  const [activeTab, setActiveTab] = useState<"routes" | "map" | "settings">(
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
    {
      id: "settings" as const,
      label: "Settings",
      icon: Settings,
      content: (
        <MapSettings
          onEmergencySettings={onEmergencySettings}
          onLocationSettings={onLocationSettings}
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
