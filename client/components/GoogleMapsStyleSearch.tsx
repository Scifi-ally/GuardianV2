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
        className="bg-white rounded-lg shadow-lg border border-gray-200 mx-3"
        layout
        initial={false}
        animate={{
          height: isExpanded ? "auto" : "48px",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="relative">
          {/* Collapsed Search Bar */}
          {!isExpanded && (
            <motion.div
              className="flex items-center h-12 px-4 cursor-pointer"
              onClick={handleSearchClick}
              whileTap={{ scale: 0.98 }}
            >
              <Search className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-gray-500 flex-1">
                Search for directions
              </span>
              <Navigation className="h-5 w-5 text-blue-500" />
            </motion.div>
          )}

          {/* Expanded Form */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-3 space-y-3"
              >
                {/* From Input */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 relative">
                    <LocationAutocompleteInput
                      value={fromLocation}
                      onChange={setFromLocation}
                      onPlaceSelect={(place) => {
                        setFromLocation(
                          place.name ||
                            place.formatted_address ||
                            "Selected location",
                        );
                        if (onPlaceSelect) {
                          onPlaceSelect(place);
                        }
                      }}
                      placeholder="Choose starting point"
                      className={`pl-3 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        activeInput === "from" ? "ring-1 ring-blue-500" : ""
                      }`}
                    />
                    {!fromLocation && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-9 w-9 p-0 text-blue-500 hover:bg-blue-50 z-10"
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
                    )}
                  </div>
                </div>

                {/* To Input */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <LocationAutocompleteInput
                      value={toLocation}
                      onChange={setToLocation}
                      onPlaceSelect={handlePlaceSelect}
                      placeholder="Search for destination..."
                      className={`pl-3 h-11 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                        activeInput === "to" ? "ring-1 ring-blue-500" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>

                  <Button
                    onClick={handleSearchClick}
                    disabled={!fromLocation || !toLocation || isSearching}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    size="sm"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Route className="h-4 w-4 mr-2" />
                        Directions
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default GoogleMapsStyleSearch;
