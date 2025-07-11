import { useState, useRef, useEffect } from "react";
import {
  Search,
  Navigation,
  MapPin,
  X,
  Route,
  Loader2,
  Clock,
  Sparkles,
  Star,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
} from "framer-motion";
import { LocationAutocompleteInput } from "@/components/LocationAutocompleteInput";
import { cn } from "@/lib/utils";

interface GoogleMapsStyleSearchProps {
  fromLocation: string;
  setFromLocation: (value: string) => void;
  toLocation: string;
  setToLocation: (value: string) => void;
  onSearch: () => void;
  onUseCurrentLocation: () => void;
  onPlaceSelect?: (place: any) => void;
  location: { latitude: number; longitude: number } | null;
  isSearching?: boolean;
}

export function EnhancedGoogleMapsStyleSearch({
  fromLocation,
  setFromLocation,
  toLocation,
  setToLocation,
  onSearch,
  onUseCurrentLocation,
  onPlaceSelect,
  location,
  isSearching = false,
}: GoogleMapsStyleSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeInput, setActiveInput] = useState<"from" | "to" | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [recentSearches] = useState([
    "Home",
    "Work",
    "Coffee Shop",
    "Restaurant",
  ]);

  const fromInputRef = useRef<HTMLInputElement>(null);

  // Spring animations for smooth interactions
  const springConfig = { tension: 300, friction: 30 };
  const scale = useSpring(isHovered ? 1.02 : 1, springConfig);
  const opacity = useSpring(isExpanded ? 1 : 0.95, springConfig);

  // Auto-expand when user starts typing
  useEffect(() => {
    if (fromLocation || toLocation) {
      setIsExpanded(true);
    }
  }, [fromLocation, toLocation]);

  const handleSearchClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => fromInputRef.current?.focus(), 100);
    } else if (fromLocation && toLocation) {
      onSearch();
    }
  };

  const handleCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      await onUseCurrentLocation();
      if (location) {
        setFromLocation("Current Location");
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handlePlaceSelect = (place: any) => {
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  };

  const clearAll = () => {
    setFromLocation("");
    setToLocation("");
    setIsExpanded(false);
    setActiveInput(null);
  };

  const swapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  return (
    <div className="absolute top-3 left-0 right-0 z-50">
      {/* Floating Glass Morphism Container */}
      <motion.div
        className={cn(
          "relative mx-3 overflow-hidden backdrop-blur-xl border border-white/20",
          "bg-gradient-to-br from-white/90 via-white/70 to-white/50",
          "shadow-2xl shadow-black/10",
        )}
        style={{ scale }}
        layout
        initial={false}
        animate={{
          borderRadius: isExpanded ? "24px" : "32px",
          height: isExpanded ? "auto" : "56px",
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
          mass: 1,
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Animated Background Gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-emerald-500/10"
          animate={{
            opacity: isExpanded ? 0.6 : 0.3,
            scale: isExpanded ? 1.1 : 1,
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />

        {/* Sparkle Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${20 + (i % 2) * 60}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          {/* Collapsed Search Bar */}
          {!isExpanded && (
            <motion.div
              className="flex items-center h-14 px-6 cursor-pointer group"
              onClick={handleSearchClick}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mr-4 shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Search className="h-5 w-5 text-white" />
              </motion.div>

              <motion.span
                className="text-gray-700 flex-1 font-semibold text-lg"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Where would you like to go?
              </motion.span>

              <div className="flex items-center gap-3">
                <motion.div
                  className="flex gap-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 1, 0.4],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>

                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Compass className="h-6 w-6 text-blue-500" />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Expanded Form with Advanced Animations */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  staggerChildren: 0.1,
                }}
                className="p-6 space-y-4"
              >
                {/* Enhanced Header */}
                <motion.div
                  className="flex items-center justify-between"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Route className="h-5 w-5 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        Plan Your Route
                      </h3>
                      <p className="text-sm text-gray-500">
                        Smart navigation with safety insights
                      </p>
                    </div>
                  </div>

                  <motion.div
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="text-gray-400 hover:text-gray-600 hover:bg-white/50 h-10 w-10 p-0 rounded-xl"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Enhanced From/To Inputs */}
                <div className="relative">
                  {/* Connection Line */}
                  <motion.div
                    className="absolute left-6 top-6 w-0.5 h-12 bg-gradient-to-b from-emerald-400 via-blue-400 to-red-400 rounded-full"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  />

                  {/* From Input */}
                  <motion.div
                    className="relative mb-4"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-4 h-4 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-2 border-white shadow-lg z-10"
                        whileHover={{ scale: 1.3 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      />

                      <div className="flex-1 relative">
                        <LocationAutocompleteInput
                          value={fromLocation}
                          onChange={(value) => {
                            setFromLocation(value);
                            setActiveInput("from");
                          }}
                          onPlaceSelect={(place) => {
                            setFromLocation(
                              place.name ||
                                place.formatted_address ||
                                "Selected location",
                            );
                            if (onPlaceSelect) onPlaceSelect(place);
                            setActiveInput(null);
                          }}
                          placeholder="From location"
                          className={cn(
                            "h-12 pl-4 pr-12 border-2 rounded-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm text-base font-medium",
                            activeInput === "from"
                              ? "border-emerald-400 ring-4 ring-emerald-100 shadow-lg"
                              : "border-gray-200 hover:border-gray-300 hover:shadow-md",
                          )}
                        />

                        {!fromLocation && (
                          <motion.div
                            className="absolute right-2 top-2"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                              onClick={handleCurrentLocation}
                              disabled={isLoadingLocation}
                              title="Use current location"
                            >
                              {isLoadingLocation ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MapPin className="h-4 w-4" />
                              )}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Swap Button */}
                  {fromLocation && toLocation && (
                    <motion.div
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      whileHover={{ scale: 1.2, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={swapLocations}
                        className="h-8 w-8 p-0 bg-white shadow-lg hover:bg-gray-50 rounded-xl border"
                      >
                        <svg
                          className="h-4 w-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      </Button>
                    </motion.div>
                  )}

                  {/* To Input */}
                  <motion.div
                    className="relative"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-4 h-4 bg-gradient-to-r from-red-400 to-red-500 rounded-full border-2 border-white shadow-lg z-10"
                        whileHover={{ scale: 1.3 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17,
                        }}
                      />

                      <div className="flex-1">
                        <LocationAutocompleteInput
                          value={toLocation}
                          onChange={(value) => {
                            setToLocation(value);
                            setActiveInput("to");
                          }}
                          onPlaceSelect={(place) => {
                            handlePlaceSelect(place);
                            setActiveInput(null);
                          }}
                          placeholder="To destination"
                          className={cn(
                            "h-12 pl-4 border-2 rounded-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm text-base font-medium",
                            activeInput === "to"
                              ? "border-red-400 ring-4 ring-red-100 shadow-lg"
                              : "border-gray-200 hover:border-gray-300 hover:shadow-md",
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Recent Searches */}
                {!fromLocation && !toLocation && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Recent searches</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {recentSearches.map((search, index) => (
                        <motion.button
                          key={search}
                          className="px-3 py-1.5 bg-white/60 hover:bg-white/80 rounded-full text-sm text-gray-700 border border-gray-200 hover:border-gray-300 transition-all duration-200"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          onClick={() => setToLocation(search)}
                        >
                          {search}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Action Button */}
                <motion.div
                  className="flex justify-end pt-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleSearchClick}
                      disabled={!fromLocation || !toLocation || isSearching}
                      className={cn(
                        "px-8 py-3 rounded-2xl font-semibold text-base transition-all duration-300 shadow-lg",
                        !fromLocation || !toLocation || isSearching
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                          : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl",
                      )}
                      size="lg"
                    >
                      {isSearching ? (
                        <motion.div
                          className="flex items-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Finding route...
                        </motion.div>
                      ) : (
                        <motion.div
                          className="flex items-center"
                          whileHover={{ x: 5 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                        >
                          <Sparkles className="h-5 w-5 mr-2" />
                          Get Directions
                        </motion.div>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default EnhancedGoogleMapsStyleSearch;
