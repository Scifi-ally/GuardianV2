import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Target,
  Route,
  Clock,
  ArrowRight,
  Zap,
  RefreshCw,
  X,
  Search,
  Star,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModernSearchInput } from "./ModernSearchInput";

interface EnhancedGoogleMapsSearchProps {
  fromLocation: string;
  setFromLocation: (location: string) => void;
  toLocation: string;
  setToLocation: (location: string) => void;
  onSearch: () => void;
  onUseCurrentLocation: () => void;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  } | null;
  isSearching?: boolean;
}

export function EnhancedGoogleMapsSearch({
  fromLocation,
  setFromLocation,
  toLocation,
  setToLocation,
  onSearch,
  onUseCurrentLocation,
  location,
  isSearching = false,
}: EnhancedGoogleMapsSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [swapAnimation, setSwapAnimation] = useState(false);

  const handleSwapLocations = useCallback(() => {
    if (!fromLocation || !toLocation) return;

    setSwapAnimation(true);
    setTimeout(() => {
      const temp = fromLocation;
      setFromLocation(toLocation);
      setToLocation(temp);
      setSwapAnimation(false);
    }, 200);
  }, [fromLocation, toLocation, setFromLocation, setToLocation]);

  const clearRoute = () => {
    setFromLocation("");
    setToLocation("");
    setIsExpanded(false);
  };

  const handleQuickSearch = () => {
    if (!fromLocation) {
      onUseCurrentLocation();
    }
    if (fromLocation && toLocation) {
      onSearch();
    } else {
      setIsExpanded(true);
    }
  };

  useEffect(() => {
    if (fromLocation && toLocation) {
      setIsExpanded(true);
    }
  }, [fromLocation, toLocation]);

  return (
    <div className="absolute top-4 left-4 right-4 z-30">
      <motion.div
        layout
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Header Section */}
        <motion.div layout className="p-4">
          {!isExpanded ? (
            /* Collapsed Search Bar */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <motion.div
                className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search className="h-5 w-5 text-white" />
              </motion.div>

              <motion.button
                onClick={() => setIsExpanded(true)}
                className="flex-1 text-left p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-gray-600 font-medium">
                  {fromLocation && toLocation
                    ? `${fromLocation} → ${toLocation}`
                    : fromLocation
                      ? `From: ${fromLocation}`
                      : "Where would you like to go?"}
                </span>
              </motion.button>

              {location && (
                <motion.button
                  onClick={onUseCurrentLocation}
                  className="p-3 bg-green-100 hover:bg-green-200 rounded-2xl transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Use current location"
                >
                  <Target className="h-5 w-5 text-green-600" />
                </motion.button>
              )}
            </motion.div>
          ) : (
            /* Expanded Search Form */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Header with title and close */}
              <div className="flex items-center justify-between">
                <motion.h2
                  className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                >
                  Plan Your Route
                </motion.h2>
                <motion.button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5 text-gray-500" />
                </motion.button>
              </div>

              {/* From Location */}
              <div className="space-y-2">
                <motion.label
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="p-1 bg-green-100 rounded-lg">
                    <MapPin className="h-3 w-3 text-green-600" />
                  </div>
                  From
                </motion.label>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <ModernSearchInput
                    value={fromLocation}
                    onChange={setFromLocation}
                    onLocationSelect={(loc) => setFromLocation(loc)}
                    placeholder="Enter starting location"
                    icon={MapPin}
                  />
                </motion.div>

                {location && !fromLocation && (
                  <motion.button
                    onClick={onUseCurrentLocation}
                    className="flex items-center gap-2 p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 text-sm font-medium"
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Target className="h-4 w-4" />
                    Use current location
                  </motion.button>
                )}
              </div>

              {/* Swap Button */}
              <AnimatePresence>
                {fromLocation && toLocation && (
                  <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    <motion.button
                      onClick={handleSwapLocations}
                      className="p-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                      whileHover={{ scale: 1.1, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      animate={{ rotate: swapAnimation ? 180 : 0 }}
                    >
                      <RefreshCw className="h-5 w-5" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* To Location */}
              <div className="space-y-2">
                <motion.label
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="p-1 bg-red-100 rounded-lg">
                    <Navigation className="h-3 w-3 text-red-600" />
                  </div>
                  To
                </motion.label>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <ModernSearchInput
                    value={toLocation}
                    onChange={setToLocation}
                    onLocationSelect={(loc) => setToLocation(loc)}
                    placeholder="Choose destination"
                    icon={Navigation}
                  />
                </motion.div>
              </div>

              {/* Quick Actions */}
              <motion.div
                className="flex gap-2 pt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  onClick={handleQuickSearch}
                  disabled={!fromLocation || !toLocation || isSearching}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl font-semibold transition-all duration-200",
                    fromLocation && toLocation
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed",
                  )}
                  whileHover={
                    fromLocation && toLocation ? { scale: 1.02, y: -2 } : {}
                  }
                  whileTap={fromLocation && toLocation ? { scale: 0.98 } : {}}
                >
                  {isSearching ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </motion.div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Route className="h-4 w-4" />
                      Get Directions
                    </>
                  )}
                </motion.button>

                {(fromLocation || toLocation) && (
                  <motion.button
                    onClick={clearRoute}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Suggestions when expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-100 p-4 bg-gradient-to-b from-gray-50 to-white"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Quick Options
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Home", icon: Star, color: "text-purple-600" },
                  { label: "Work", icon: Clock, color: "text-blue-600" },
                  { label: "Hospital", icon: MapPin, color: "text-red-600" },
                  { label: "Police", icon: Shield, color: "text-green-600" },
                ].map((item, index) => (
                  <motion.button
                    key={item.label}
                    onClick={() => setToLocation(item.label)}
                    className="flex items-center gap-2 p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <item.icon className={cn("h-4 w-4", item.color)} />
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
