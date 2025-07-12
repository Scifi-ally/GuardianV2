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
  const [focusedField, setFocusedField] = useState<"from" | "to" | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = [
    { label: "Home", icon: MapPin, type: "recent" },
    { label: "Work", icon: MapPin, type: "recent" },
    { label: "Hospital", icon: MapPin, type: "emergency" },
    { label: "Police Station", icon: MapPin, type: "emergency" },
  ];

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setFocusedField(null);
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    if (!fromLocation) {
      onUseCurrentLocation();
    }
    if (fromLocation && toLocation) {
      onSearch();
      handleCollapse();
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
        className={cn(
          "bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden",
          "transition-all duration-300",
        )}
        animate={{
          scale: isExpanded ? 1 : 0.98,
        }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* Compact Mode */
            <motion.div
              key="compact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-2"
            >
              <button
                onClick={handleExpand}
                className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Search className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-medium text-gray-900">
                    {fromLocation && toLocation
                      ? `${fromLocation} → ${toLocation}`
                      : "Where to go?"}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Tap to set destination
                  </p>
                </div>
              </button>
            </motion.div>
          ) : (
            /* Expanded Mode */
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Plan Route
                </h3>
                <motion.button
                  onClick={handleCollapse}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </motion.button>
              </div>

              <div className="space-y-3">
                {/* From Field */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    From
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                      onFocus={() => {
                        setFocusedField("from");
                        setShowSuggestions(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 150)
                      }
                      placeholder="Enter starting location"
                      className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {location && !fromLocation && (
                      <button
                        onClick={onUseCurrentLocation}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Use current
                      </button>
                    )}
                  </div>
                </div>

                {/* To Field */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    To
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      onFocus={() => {
                        setFocusedField("to");
                        setShowSuggestions(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 150)
                      }
                      placeholder="Choose destination"
                      className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Search Button */}
                <motion.button
                  onClick={handleSearch}
                  disabled={!fromLocation || !toLocation || isSearching}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all",
                    fromLocation && toLocation
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed",
                  )}
                  whileHover={fromLocation && toLocation ? { scale: 1.02 } : {}}
                  whileTap={fromLocation && toLocation ? { scale: 0.98 } : {}}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Get Directions
                    </>
                  )}
                </motion.button>
              </div>

              {/* Quick Suggestions */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Quick options
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {suggestions.map((suggestion, index) => (
                        <motion.button
                          key={suggestion.label}
                          onClick={() => {
                            if (focusedField === "from") {
                              setFromLocation(suggestion.label);
                            } else {
                              setToLocation(suggestion.label);
                            }
                            setShowSuggestions(false);
                          }}
                          className="flex items-center gap-2 p-2 text-left hover:bg-white rounded-lg transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <suggestion.icon
                            className={cn(
                              "h-3 w-3",
                              suggestion.type === "emergency"
                                ? "text-red-500"
                                : "text-gray-500",
                            )}
                          />
                          <span className="text-xs text-gray-700">
                            {suggestion.label}
                          </span>
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
