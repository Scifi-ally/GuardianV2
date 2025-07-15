/**
 * Navigation Header Component
 * Always visible navigation search bar with Google Maps-style suggestions
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Menu, Settings, AlertTriangle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleMapsExpandableSearch } from "@/components/GoogleMapsExpandableSearch";
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
  className?: string;
  location?: { latitude: number; longitude: number } | null;
}

export function NavigationHeader({
  onPlaceSelect,
  onNavigationStart,
  onMenuClick,
  onSettingsClick,
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
      {/* Navigation Header - Professional Design */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-lg w-full max-w-full overflow-hidden safe-area-inset-top",
          className,
        )}
      >
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 w-full max-w-full box-border">
          {/* Professional Header Layout */}
          <div className="flex items-center gap-2 sm:gap-4 w-full min-w-0">
            {/* App Logo/Brand */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base sm:text-lg font-bold text-gray-900">
                  Guardian
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Safety Navigation</p>
              </div>
            </div>

            {/* Google Maps Expandable Search Bar */}
            <div className="flex-1 max-w-3xl min-w-0">
              <GoogleMapsExpandableSearch
                onPlaceSelect={(place) => {
                  console.log("🎯 Place selected in header:", place);
                  onPlaceSelect?.({
                    lat: place.location.lat,
                    lng: place.location.lng,
                    name: place.name,
                  });
                }}
                onNavigationStart={handleNavigationStart}
                placeholder="Search Google Maps"
                className="w-full max-w-full"
              />
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettingsClick}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-16 sm:h-20" />

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
