import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Navigation,
  X,
  Loader2,
  Clock,
  Star,
  ArrowRight,
  Target,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  address: string;
  type: "recent" | "favorite" | "business" | "place";
  coordinates?: { lat: number; lng: number };
  distance?: string;
}

interface SleekSearchBarProps {
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
  onLocationSelect?: (result: SearchResult) => void;
}

export function SleekSearchBar({
  fromLocation,
  setFromLocation,
  toLocation,
  setToLocation,
  onSearch,
  onUseCurrentLocation,
  location,
  isSearching = false,
  onLocationSelect,
}: SleekSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fromInputRef = useRef<HTMLInputElement>(null);

  // Real search results from localStorage and Google Places
  const getSearchResults = (): SearchResult[] => {
    const recentSearches = JSON.parse(
      localStorage.getItem("recentSearches") || "[]",
    );
    const favoriteLocations = JSON.parse(
      localStorage.getItem("favoriteLocations") || "[]",
    );

    const results: SearchResult[] = [];

    // Add recent searches
    recentSearches.slice(0, 2).forEach((search: any, index: number) => {
      results.push({
        id: `recent-${index}`,
        name: search.name,
        address: search.address,
        type: "recent",
        coordinates: search.coordinates,
        distance: search.distance,
      });
    });

    // Add favorite locations
    favoriteLocations.slice(0, 2).forEach((favorite: any, index: number) => {
      results.push({
        id: `favorite-${index}`,
        name: favorite.name,
        address: favorite.address,
        type: "favorite",
        coordinates: favorite.coordinates,
        distance: favorite.distance,
      });
    });

    return results;
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setActiveField("to");
    setTimeout(() => toInputRef.current?.focus(), 100);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setActiveField(null);
    setSearchResults([]);
  };

  const handleInputChange = (field: "from" | "to", value: string) => {
    if (field === "from") {
      setFromLocation(value);
    } else {
      setToLocation(value);
    }

    // Real search using Google Places API
    if (value.length > 2) {
      setIsLoading(true);

      // Use Google Places Autocomplete if available
      if (window.google?.maps?.places) {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input: value,
            componentRestrictions: { country: "us" },
            types: ["establishment", "geocode"],
          },
          (predictions, status) => {
            setIsLoading(false);
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              const results: SearchResult[] = predictions
                .slice(0, 5)
                .map((prediction, index) => ({
                  id: `prediction-${index}`,
                  name: prediction.structured_formatting.main_text,
                  address:
                    prediction.structured_formatting.secondary_text ||
                    prediction.description,
                  type: "place",
                  coordinates: undefined, // Will be resolved when selected
                }));

              // Combine with recent/favorite results if query is short
              const localResults = value.length < 4 ? getSearchResults() : [];
              setSearchResults([...localResults, ...results]);
            } else {
              // Fallback to local results only
              setSearchResults(
                getSearchResults().filter(
                  (result) =>
                    result.name.toLowerCase().includes(value.toLowerCase()) ||
                    result.address.toLowerCase().includes(value.toLowerCase()),
                ),
              );
            }
          },
        );
      } else {
        // Fallback search without Google Places
        setIsLoading(false);
        setSearchResults(
          getSearchResults().filter(
            (result) =>
              result.name.toLowerCase().includes(value.toLowerCase()) ||
              result.address.toLowerCase().includes(value.toLowerCase()),
          ),
        );
      }
    } else if (value.length === 0) {
      setSearchResults(getSearchResults());
    } else {
      setSearchResults([]);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    const selectedLocation = result.name;

    if (activeField === "from") {
      setFromLocation(selectedLocation);
    } else {
      setToLocation(selectedLocation);
    }

    // Save to recent searches
    const recentSearches = JSON.parse(
      localStorage.getItem("recentSearches") || "[]",
    );
    const newSearch = {
      name: result.name,
      address: result.address,
      type: result.type,
      coordinates: result.coordinates,
      timestamp: Date.now(),
    };

    // Remove if already exists and add to front
    const filteredSearches = recentSearches.filter(
      (search: any) => search.name !== result.name,
    );
    const updatedSearches = [newSearch, ...filteredSearches].slice(0, 10); // Keep last 10
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

    setSearchResults([]);
    onLocationSelect?.(result);
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

  const swapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "recent":
        return Clock;
      case "favorite":
        return Star;
      case "business":
        return MapPin;
      default:
        return MapPin;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "recent":
        return "text-blue-500";
      case "favorite":
        return "text-yellow-500";
      case "business":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  useEffect(() => {
    if (isExpanded && !activeField) {
      setSearchResults(getSearchResults());
    }
  }, [isExpanded]);

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000]">
      <motion.div
        layout
        className={cn(
          "bg-white/98 backdrop-blur-2xl rounded-2xl border border-gray-200/50 overflow-hidden",
          "shadow-lg transition-all duration-300",
          isExpanded && "shadow-2xl",
        )}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Sleek Compact Mode
            <motion.div
              key="compact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-2"
            >
              <button
                onClick={handleExpand}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50/60 rounded-xl transition-all duration-200 group"
              >
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Search className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fromLocation && toLocation
                      ? `${fromLocation} → ${toLocation}`
                      : "Search destination"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {fromLocation && toLocation
                      ? "Tap to edit"
                      : "Tap to start"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>
            </motion.div>
          ) : (
            // Sleek Expanded Mode
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4"
            >
              {/* Header */}
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
                      ref={fromInputRef}
                      type="text"
                      value={fromLocation}
                      onChange={(e) =>
                        handleInputChange("from", e.target.value)
                      }
                      onFocus={() => {
                        setActiveField("from");
                        setSearchResults(getSearchResults());
                      }}
                      placeholder="Starting location"
                      className="w-full p-3 pl-10 pr-20 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {location && !fromLocation && (
                      <button
                        onClick={onUseCurrentLocation}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        Current
                      </button>
                    )}
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button
                    onClick={swapLocations}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      <RotateCcw className="h-4 w-4 text-gray-500" />
                    </motion.div>
                  </button>
                </div>

                {/* To Field */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    To
                  </label>
                  <div className="relative">
                    <input
                      ref={toInputRef}
                      type="text"
                      value={toLocation}
                      onChange={(e) => handleInputChange("to", e.target.value)}
                      onFocus={() => {
                        setActiveField("to");
                        setSearchResults(getSearchResults());
                      }}
                      placeholder="Choose destination"
                      className="w-full p-3 pl-10 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    />
                    <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Search Results */}
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-gray-50 rounded-lg p-2 space-y-1"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="ml-2 text-sm text-gray-600">
                            Searching...
                          </span>
                        </div>
                      ) : (
                        searchResults.map((result, index) => {
                          const IconComponent = getTypeIcon(result.type);
                          return (
                            <motion.button
                              key={result.id}
                              onClick={() => handleResultSelect(result)}
                              className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-white rounded-lg transition-colors"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                            >
                              <div className="p-1.5 bg-gray-100 rounded-lg">
                                <IconComponent
                                  className={cn(
                                    "h-3 w-3",
                                    getTypeColor(result.type),
                                  )}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {result.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-500 truncate">
                                    {result.address}
                                  </p>
                                  {result.distance && (
                                    <>
                                      <span className="text-xs text-gray-300">
                                        •
                                      </span>
                                      <p className="text-xs text-blue-600 font-medium">
                                        {result.distance}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search Button */}
                <motion.button
                  onClick={handleSearch}
                  disabled={!fromLocation || !toLocation || isSearching}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium text-sm transition-all",
                    fromLocation && toLocation
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed",
                  )}
                  whileHover={fromLocation && toLocation ? { scale: 1.01 } : {}}
                  whileTap={fromLocation && toLocation ? { scale: 0.99 } : {}}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finding Route...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4" />
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
