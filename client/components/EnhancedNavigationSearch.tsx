import { useState, useRef, useEffect } from "react";
import {
  Search,
  Navigation,
  MapPin,
  X,
  Route,
  Loader2,
  ArrowRight,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { LocationAutocompleteInput } from "@/components/LocationAutocompleteInput";
import { cn } from "@/lib/utils";

interface EnhancedNavigationSearchProps {
  toLocation: string;
  setToLocation: (value: string) => void;
  onSearch: (destination: string) => void;
  onPlaceSelect?: (place: any) => void;
  location: { latitude: number; longitude: number } | null;
  isSearching?: boolean;
}

export function EnhancedNavigationSearch({
  toLocation,
  setToLocation,
  onSearch,
  onPlaceSelect,
  location,
  isSearching = false,
}: EnhancedNavigationSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Auto-expand when user starts typing
  useEffect(() => {
    if (toLocation) {
      setIsExpanded(true);
    }
  }, [toLocation]);

  const handleSearchClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => toInputRef.current?.focus(), 150);
    } else if (toLocation) {
      onSearch(toLocation);
    }
  };

  const handlePlaceSelect = (place: any) => {
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  };

  const clearAll = () => {
    setToLocation("");
    setIsExpanded(false);
  };

  return (
    <div className="absolute top-3 left-0 right-0 z-50">
      <motion.div
        className={cn(
          "bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 mx-3 overflow-hidden",
          "transition-all duration-300 ease-out",
        )}
        layout
        initial={false}
        animate={{
          height: isExpanded ? "auto" : "52px",
          boxShadow: isExpanded
            ? "0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)"
            : "0 8px 32px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="relative">
          {/* Collapsed Search Bar */}
          {!isExpanded && (
            <motion.div
              className="flex items-center h-12 px-4 cursor-pointer group"
              onClick={handleSearchClick}
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -1 }}
            >
              <motion.div
                className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-3 shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Search className="h-4 w-4 text-white" />
              </motion.div>
              <motion.span
                className="text-gray-600 font-medium text-base flex-1"
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
              >
                Where to?
              </motion.span>
              <Navigation className="h-5 w-5 text-indigo-500" />
            </motion.div>
          )}

          {/* Expanded Form */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="p-4 space-y-4 bg-gradient-to-b from-white/80 to-gray-50/50"
              >
                {/* Simple Actions */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Single Destination Input */}
                <motion.div
                  className="relative"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <motion.div
                        className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md"
                        whileHover={{ scale: 1.2 }}
                      />
                      <div className="text-xs text-gray-500 mt-1 font-medium">
                        From: Current Location
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <LocationAutocompleteInput
                      ref={toInputRef}
                      value={toLocation}
                      onChange={setToLocation}
                      onPlaceSelect={(place) => {
                        handlePlaceSelect(place);
                      }}
                      placeholder="Where to?"
                      className="h-12 pl-4 rounded-xl border-2 transition-all duration-200 bg-white/80 backdrop-blur-sm text-base font-medium shadow-sm border-blue-400 ring-4 ring-blue-100 bg-white w-full"
                    />
                  </div>
                </motion.div>

                {/* Action Button */}
                <motion.div
                  className="pt-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={handleSearchClick}
                    disabled={!toLocation || isSearching}
                    className={cn(
                      "w-full h-12 rounded-xl text-base font-semibold transition-all duration-200 shadow-lg",
                      !toLocation || isSearching
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 hover:shadow-blue-500/40 hover:shadow-xl transform hover:-translate-y-0.5",
                    )}
                  >
                    {isSearching ? (
                      <motion.div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Finding...
                      </motion.div>
                    ) : (
                      <motion.div
                        className="flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Navigation className="h-5 w-5" />
                        Go
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default EnhancedNavigationSearch;
