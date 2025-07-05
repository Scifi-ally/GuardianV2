import { useState, useRef, useEffect } from "react";
import { Search, Navigation, MapPin, X, Route, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { LocationAutocompleteInput } from "@/components/LocationAutocompleteInput";

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

export function GoogleMapsStyleSearch({
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
  const fromInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
    console.log("🎯 Place selected in search:", place);
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

  return (
    <div className="absolute top-3 left-0 right-0 z-50">
      {/* Main Search Container */}
      <motion.div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 mx-3 overflow-hidden backdrop-blur-sm"
        layout
        initial={false}
        animate={{
          height: isExpanded ? "auto" : "48px",
          boxShadow: isExpanded
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            : "0 10px 25px -3px rgba(0, 0, 0, 0.1)",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{
          background: isExpanded
            ? "linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(248,250,252,0.95))"
            : "rgba(255,255,255,0.95)",
        }}
      >
        <div className="relative">
          {/* Collapsed Search Bar */}
          {!isExpanded && (
            <motion.div
              className="flex items-center h-12 px-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg"
              onClick={handleSearchClick}
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -1 }}
            >
              <div className="p-2 bg-blue-50 rounded-full mr-3">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-gray-600 flex-1 font-medium">
                Where would you like to go?
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <Navigation className="h-5 w-5 text-blue-500" />
              </div>
            </motion.div>
          )}

          {/* Expanded Form */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="p-3 space-y-2.5 bg-gradient-to-b from-white to-gray-50"
              >
                {/* Compact Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Route className="h-4 w-4 text-blue-500" />
                    Route
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Compact From Input */}
                <motion.div
                  className="relative"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 border border-white" />
                      <div className="w-0.5 h-4 bg-gradient-to-b from-green-300 to-red-300 mt-0.5" />
                    </div>
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
                          if (onPlaceSelect) {
                            onPlaceSelect(place);
                          }
                          setActiveInput(null);
                        }}
                        placeholder="From"
                        className={`pl-3 pr-10 h-9 border rounded-lg transition-all duration-200 bg-white text-sm
                          ${
                            activeInput === "from"
                              ? "border-green-500 ring-1 ring-green-200"
                              : "border-gray-300 hover:border-gray-400"
                          }
                        `}
                      />
                      {!fromLocation && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-7 w-7 p-0 text-green-600 hover:bg-green-50 z-10 rounded"
                          onClick={handleCurrentLocation}
                          disabled={isLoadingLocation}
                          title="Use current location"
                        >
                          {isLoadingLocation ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <MapPin className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Compact To Input */}
                <motion.div
                  className="relative"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 border border-white" />
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
                        placeholder="To"
                        className={`pl-3 h-9 border rounded-lg transition-all duration-200 bg-white text-sm
                          ${
                            activeInput === "to"
                              ? "border-red-500 ring-1 ring-red-200"
                              : "border-gray-300 hover:border-gray-400"
                          }
                        `}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Compact Action Buttons */}
                <motion.div
                  className="flex items-center justify-end gap-2 pt-2"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    onClick={handleSearchClick}
                    disabled={!fromLocation || !toLocation || isSearching}
                    className={`
                      px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${
                        !fromLocation || !toLocation || isSearching
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                      }
                    `}
                    size="sm"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        Finding...
                      </>
                    ) : (
                      <>
                        <Route className="h-3 w-3 mr-1.5" />
                        Directions
                      </>
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

export default GoogleMapsStyleSearch;
