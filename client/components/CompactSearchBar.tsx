import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Navigation,
  Target,
  X,
  Loader2,
  ArrowRight,
  Locate,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactSearchBarProps {
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

export function CompactSearchBar({
  fromLocation,
  setFromLocation,
  toLocation,
  setToLocation,
  onSearch,
  onUseCurrentLocation,
  location,
  isSearching = false,
}: CompactSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    { label: "Home", icon: MapPin, type: "recent", color: "text-blue-600" },
    { label: "Work", icon: MapPin, type: "recent", color: "text-green-600" },
    {
      label: "Hospital",
      icon: MapPin,
      type: "emergency",
      color: "text-red-600",
    },
    {
      label: "Police Station",
      icon: MapPin,
      type: "emergency",
      color: "text-blue-800",
    },
    {
      label: "Fire Station",
      icon: MapPin,
      type: "emergency",
      color: "text-orange-600",
    },
    {
      label: "Pharmacy",
      icon: MapPin,
      type: "emergency",
      color: "text-green-700",
    },
  ];

  const handleExpand = () => {
    setIsAnimating(true);
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
      setIsAnimating(false);
    }, 150);
  };

  const handleCollapse = () => {
    setIsAnimating(true);
    setIsExpanded(false);
    setShowSuggestions(false);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Auto-set current location as from location on component mount
  useEffect(() => {
    if (location && !fromLocation) {
      onUseCurrentLocation();
    }
  }, [location, fromLocation, onUseCurrentLocation]);

  const handleSearch = () => {
    if (toLocation) {
      // Ensure we have current location set
      if (!fromLocation && location) {
        onUseCurrentLocation();
      }
      onSearch();
      handleCollapse();
    }
  };

  useEffect(() => {
    if (toLocation) {
      setIsExpanded(true);
    }
  }, [toLocation]);

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000]">
      <motion.div
        layout
        className={cn(
          "bg-white/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden",
          "transition-all duration-500 ease-out",
          isAnimating && "transform-gpu will-change-transform",
        )}
        animate={{
          scale: isExpanded ? 1 : 0.98,
          y: isExpanded ? 0 : -2,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        whileHover={{
          scale: isExpanded ? 1 : 1.02,
          transition: { duration: 0.2 },
        }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* Compact Mode */
            <motion.div
              key="compact"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="p-3"
            >
              <motion.button
                onClick={handleExpand}
                className="w-full flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-300 group"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Search className="h-4 w-4 text-white" />
                </motion.div>
                <div className="flex-1 text-left">
                  <motion.p
                    className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors"
                    initial={{ x: -5, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {toLocation
                      ? `Going to ${toLocation}`
                      : "Where would you like to go?"}
                  </motion.p>
                  <motion.p
                    className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors"
                    initial={{ x: -5, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {location
                      ? "From current location"
                      : "Tap to set destination"}
                  </motion.p>
                </div>
                <motion.div
                  className="flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Sparkles className="h-3 w-3 text-blue-500 group-hover:text-purple-600 transition-colors" />
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </motion.div>
              </motion.button>
            </motion.div>
          ) : (
            /* Expanded Mode */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="p-6"
            >
              <motion.div
                className="flex items-center justify-between mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.h3
                  className="text-xl font-bold text-gray-900 flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Zap className="h-5 w-5 text-blue-600" />
                  Quick Navigation
                </motion.h3>
                <motion.button
                  onClick={handleCollapse}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <X className="h-4 w-4 text-gray-500 group-hover:text-red-500 transition-colors" />
                </motion.button>
              </motion.div>

              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Current Location Display */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <motion.div
                      className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    Starting from current location
                  </label>
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-full p-4 pl-12 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">
                          {fromLocation || "Getting your location..."}
                        </span>
                        {location && (
                          <motion.div
                            className="flex items-center gap-1 text-xs text-green-600"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Live
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <Locate className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                  </motion.div>
                </motion.div>

                {/* To Field */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <motion.div
                      className="w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                    Where would you like to go?
                  </label>
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.01 }}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      placeholder="Enter destination..."
                      className="w-full p-4 pl-12 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 transition-all duration-300 text-gray-900 placeholder:text-gray-500"
                    />
                    <Navigation className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600" />
                    {toLocation && (
                      <motion.button
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                        onClick={() => setToLocation("")}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    )}
                  </motion.div>
                </motion.div>

                {/* Search Button */}
                <motion.button
                  onClick={handleSearch}
                  disabled={!toLocation || isSearching}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 p-4 rounded-2xl font-bold transition-all duration-300 shadow-lg",
                    toLocation
                      ? "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 shadow-blue-200 hover:shadow-blue-300"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-gray-100",
                  )}
                  whileHover={toLocation ? { scale: 1.03, y: -2 } : {}}
                  whileTap={toLocation ? { scale: 0.97 } : {}}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                >
                  {isSearching ? (
                    <motion.div
                      className="flex items-center gap-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Loader2 className="h-5 w-5" />
                      </motion.div>
                      <span>Finding best route...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="flex items-center gap-3"
                      whileHover={{ x: 2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Target className="h-5 w-5" />
                      <span>Start Navigation</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  )}
                </motion.button>
              </motion.div>

              {/* Quick Suggestions */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="mt-4 p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-lg"
                  >
                    <motion.p
                      className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      Quick destinations
                    </motion.p>
                    <div className="grid grid-cols-2 gap-3">
                      {suggestions.map((suggestion, index) => (
                        <motion.button
                          key={suggestion.label}
                          onClick={() => {
                            setToLocation(suggestion.label);
                            setShowSuggestions(false);
                          }}
                          className="flex items-center gap-3 p-3 text-left hover:bg-white rounded-xl transition-all duration-200 group border border-transparent hover:border-gray-200 hover:shadow-md"
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          initial={{ opacity: 0, x: -20, scale: 0.8 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{
                            delay: index * 0.08,
                            type: "spring",
                            stiffness: 300,
                          }}
                        >
                          <motion.div
                            className={cn(
                              "p-2 rounded-lg",
                              suggestion.type === "emergency"
                                ? "bg-red-100 group-hover:bg-red-200"
                                : "bg-blue-100 group-hover:bg-blue-200",
                            )}
                            whileHover={{ rotate: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <suggestion.icon
                              className={cn(
                                "h-4 w-4",
                                suggestion.color || "text-gray-600",
                              )}
                            />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors block truncate">
                              {suggestion.label}
                            </span>
                            <span className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                              {suggestion.type === "emergency"
                                ? "Emergency"
                                : "Quick access"}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
