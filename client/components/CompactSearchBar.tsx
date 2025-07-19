import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Navigation,
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
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

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000]">
      <motion.div
        layout
        className={cn(
          "bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 overflow-hidden",
          "transition-all duration-300",
        )}
        animate={{
          scale: isExpanded ? 1 : 1,
        }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="compact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3"
            >
              <button
                onClick={handleExpand}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50/80 rounded-lg transition-colors"
              >
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Search className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {fromLocation && toLocation
                      ? `${fromLocation} → ${toLocation}`
                      : "Search destination"}
                  </p>
                  <p className="text-xs text-gray-500">Tap to set route</p>
                </div>
              </button>
            </motion.div>
          ) : (
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
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </motion.button>
              </div>

              <div className="space-y-3">
                {/* From Field */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    From
                  </label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                      placeholder="Enter starting location"
                      className="w-full p-3 pl-10 pr-20 bg-gray-50/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {location && !fromLocation && (
                      <button
                        onClick={onUseCurrentLocation}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        Current
                      </button>
                    )}
                  </div>
                </div>

                {/* To Field */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    To
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      placeholder="Choose destination"
                      className="w-full p-3 pl-10 bg-gray-50/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                    <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Search Button */}
                <motion.button
                  onClick={handleSearch}
                  disabled={!fromLocation || !toLocation || isSearching}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all text-sm",
                    fromLocation && toLocation
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed",
                  )}
                  whileHover={fromLocation && toLocation ? { scale: 1.01 } : {}}
                  whileTap={fromLocation && toLocation ? { scale: 0.99 } : {}}
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
