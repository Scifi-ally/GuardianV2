/**
 * Navigation Header Component
 * Always visible navigation search bar with Google Maps-style suggestions
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Menu, Settings, AlertTriangle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedSearchBar } from "@/components/EnhancedSearchBar";
import { NavigationTroubleshooter } from "@/components/NavigationTroubleshooter";
import { NetworkStatus } from "@/components/NetworkStatus";
import { cn } from "@/lib/utils";
import { navigationFixService } from "@/services/navigationFixService";

interface NavigationHeaderProps {
  onPlaceSelect?: (place: { lat: number; lng: number; name: string }) => void;
  onNavigationStart?: (destination: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
  onMenuClick?: () => void;
  onSettingsClick?: () => void;
  onSOSClick?: () => void;
  className?: string;
  location?: { latitude: number; longitude: number } | null;
}

export function NavigationHeader({
  onPlaceSelect,
  onNavigationStart,
  onMenuClick,
  onSettingsClick,
  onSOSClick,
  className,
  location,
}: NavigationHeaderProps) {
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);

  const handleNavigationStart = async (destination: {
    lat: number;
    lng: number;
    name: string;
  }) => {
    console.log("🧭 Navigation Header: Starting navigation to:", destination);

    // Use navigation fix service for safe navigation
    const success = await navigationFixService.startNavigationSafely(
      {
        lat: destination.lat,
        lng: destination.lng,
        name: destination.name,
      },
      location
        ? {
            lat: location.latitude,
            lng: location.longitude,
          }
        : undefined,
    );

    if (success) {
      onNavigationStart?.(destination);
    } else {
      // Show troubleshooter if navigation failed
      setShowTroubleshooter(true);
    }
  };

  return (
    <>
      {/* Navigation Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm",
          className,
        )}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Menu Button */}
            <Button
              onClick={onMenuClick}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Enhanced Search Bar */}
            <div className="flex-1 max-w-2xl">
              <EnhancedSearchBar
                onPlaceSelect={(place) => {
                  console.log("🎯 Place selected in header:", place);
                  onPlaceSelect?.({
                    lat: place.location.lat,
                    lng: place.location.lng,
                    name: place.name,
                  });
                }}
                onNavigationStart={handleNavigationStart}
                placeholder="Search for places, addresses, or landmarks"
                showTravelModes={true}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Navigation Troubleshooter */}
              <Button
                onClick={() => setShowTroubleshooter(true)}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-gray-500 hover:text-blue-600"
                title="Navigation Help"
              >
                <Navigation className="h-5 w-5" />
              </Button>

              {/* Settings */}
              <Button
                onClick={onSettingsClick}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-gray-500 hover:text-gray-700"
              >
                <Settings className="h-5 w-5" />
              </Button>

              {/* SOS Button */}
              <Button
                onClick={onSOSClick}
                variant="destructive"
                size="sm"
                className="h-10 px-3 bg-red-500 hover:bg-red-600 text-white font-medium"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                SOS
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Status Indicator */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-blue-50 border-t border-blue-100"
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>Navigation ready - Search for destinations above</span>
                </div>
                <NetworkStatus />
              </div>
              <div className="text-blue-600 text-xs">
                Powered by Google Maps
              </div>
            </div>
          </div>
        </motion.div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-24" />

      {/* Navigation Troubleshooter Modal */}
      <NavigationTroubleshooter
        isOpen={showTroubleshooter}
        onClose={() => setShowTroubleshooter(false)}
        onNavigationFixed={() => {
          console.log("✅ Navigation fixed!");
          setShowTroubleshooter(false);
        }}
      />
    </>
  );
}

export default NavigationHeader;
