import { useState, useRef } from "react";
import { Search, Navigation, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LocationAutocompleteInput } from "@/components/LocationAutocompleteInput";
import { cn } from "@/lib/utils";

interface SimpleNavigationSearchProps {
  toLocation: string;
  setToLocation: (value: string) => void;
  onSearch: (destination: string) => void;
  onPlaceSelect?: (place: any) => void;
  location: { latitude: number; longitude: number } | null;
  isSearching?: boolean;
}

export function SimpleNavigationSearch({
  toLocation,
  setToLocation,
  onSearch,
  onPlaceSelect,
  location,
  isSearching = false,
}: SimpleNavigationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearchClick = () => {
    if (toLocation) {
      onSearch(toLocation);
    }
  };

  const handlePlaceSelect = (place: any) => {
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  };

  const clearSearch = () => {
    setToLocation("");
    inputRef.current?.focus();
  };

  return (
    <div className="absolute top-4 left-0 right-0 z-50 px-4">
      <motion.div
        className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center p-3 gap-3">
          {/* Search Icon */}
          <div className="p-2 bg-gray-100 rounded-xl">
            <Search className="h-5 w-5 text-gray-600" />
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <LocationAutocompleteInput
              ref={inputRef}
              value={toLocation}
              onChange={setToLocation}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Where to?"
              className="w-full h-10 px-3 text-base bg-transparent border-none outline-none placeholder-gray-500 text-gray-900"
            />
            {isSearching && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Clear Button */}
          {toLocation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Search/Go Button */}
          <Button
            onClick={handleSearchClick}
            disabled={!toLocation || isSearching}
            className={cn(
              "h-10 px-4 rounded-xl font-medium transition-all duration-200",
              !toLocation || isSearching
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg",
            )}
          >
            {isSearching ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Finding...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                <span className="hidden sm:inline">Go</span>
              </div>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default SimpleNavigationSearch;
