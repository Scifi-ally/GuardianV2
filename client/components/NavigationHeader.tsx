/**
 * Navigation Header Component
 * Always visible navigation search bar with Google Maps-style suggestions
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Menu, Settings, AlertTriangle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpandableSearchBar } from "@/components/ExpandableSearchBar";
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
          {/* Google Maps Style Search Bar */}
          <div className="max-w-lg mx-auto">
            <ExpandableSearchBar
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
              className="w-full"
            />
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

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
