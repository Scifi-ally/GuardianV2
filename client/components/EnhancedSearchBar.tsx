import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Navigation,
  X,
  Loader2,
  Clock,
  Star,
  Building,
  Home,
  Briefcase,
  Heart,
  ArrowRight,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  name: string;
  address: string;
  type: "recent" | "favorite" | "business" | "place";
  coordinates?: { lat: number; lng: number };
  icon?: any;
}

interface EnhancedSearchBarProps {
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

export function EnhancedSearchBar({
  fromLocation,
  setFromLocation,
  toLocation,
  setToLocation,
  onSearch,
  onUseCurrentLocation,
  location,
  isSearching = false,
  onLocationSelect,
}: EnhancedSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Mock search results for demonstration
  const mockResults: SearchResult[] = [
    {
      id: "1",
      name: "Home",
      address: "123 Main Street",
      type: "recent",
      icon: Home,
    },
    {
      id: "2",
      name: "Work",
      address: "456 Business Ave",
      type: "favorite",
      icon: Briefcase,
    },
    {
      id: "3",
      name: "Central Hospital",
      address: "789 Health Blvd",
      type: "business",
      icon: Heart,
    },
    {
      id: "4",
      name: "Downtown Mall",
      address: "321 Shopping Center",
      type: "place",
      icon: Building,
    },
  ];

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

    // Simulate search with delay
    if (value.length > 2) {
      setIsLoading(true);
      setTimeout(() => {
        setSearchResults(
          mockResults.filter(
            (result) =>
              result.name.toLowerCase().includes(value.toLowerCase()) ||
              result.address.toLowerCase().includes(value.toLowerCase()),
          ),
        );
        setIsLoading(false);
      }, 300);
    } else {
      setSearchResults(mockResults.slice(0, 4));
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    if (activeField === "from") {
      setFromLocation(result.name);
    } else {
      setToLocation(result.name);
    }
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

  useEffect(() => {
    if (isExpanded && !activeField) {
      setSearchResults(mockResults.slice(0, 4));
    }
  }, [isExpanded]);

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000]">
      <motion.div
        layout
        className={cn(
          "bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden",
          "transition-all duration-300",
        )}
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Compact Mode
            <motion.div
              key="compact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3"
            >
              <button
                onClick={handleExpand}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50/80 rounded-xl transition-colors group"
              >
                <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-medium text-gray-900">
                    {fromLocation && toLocation
                      ? `${fromLocation} → ${toLocation}`
                      : "Where would you like to go?"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {fromLocation && toLocation
                      ? "Tap to change route"
                      : "Search destinations"}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>
            </motion.div>
          ) : (
            // Expanded Mode
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-semibold text-gray-900">
                  Plan Your Route
                </h3>
                <motion.button
                  onClick={handleCollapse}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5 text-gray-500" />
                </motion.button>
              </div>

              <div className="space-y-4">
                {/* From Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
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
                        setSearchResults(mockResults.slice(0, 4));
                      }}
                      placeholder="Enter starting location"
                      className="w-full p-4 pl-12 pr-24 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                    />
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    {location && !fromLocation && (
                      <button
                        onClick={onUseCurrentLocation}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
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
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Target className="h-5 w-5 text-gray-500" />
                    </motion.div>
                  </button>
                </div>

                {/* To Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
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
                        setSearchResults(mockResults.slice(0, 4));
                      }}
                      placeholder="Choose destination"
                      className="w-full p-4 pl-12 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                    />
                    <Navigation className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Search Results */}
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-gray-50/80 rounded-xl p-3 space-y-1"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="ml-2 text-sm text-gray-600">
                            Searching...
                          </span>
                        </div>
                      ) : (
                        searchResults.map((result, index) => {
                          const IconComponent = result.icon || MapPin;
                          return (
                            <motion.button
                              key={result.id}
                              onClick={() => handleResultSelect(result)}
                              className="w-full flex items-center gap-3 p-3 text-left hover:bg-white rounded-lg transition-colors"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div
                                className={cn(
                                  "p-2 rounded-lg",
                                  result.type === "recent" && "bg-gray-100",
                                  result.type === "favorite" && "bg-yellow-100",
                                  result.type === "business" && "bg-blue-100",
                                  result.type === "place" && "bg-green-100",
                                )}
                              >
                                <IconComponent
                                  className={cn(
                                    "h-4 w-4",
                                    result.type === "recent" && "text-gray-600",
                                    result.type === "favorite" &&
                                      "text-yellow-600",
                                    result.type === "business" &&
                                      "text-blue-600",
                                    result.type === "place" && "text-green-600",
                                  )}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {result.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {result.address}
                                </p>
                              </div>
                              {result.type === "recent" && (
                                <Clock className="h-4 w-4 text-gray-400" />
                              )}
                              {result.type === "favorite" && (
                                <Star className="h-4 w-4 text-yellow-500" />
                              )}
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
                    "w-full flex items-center justify-center gap-3 p-4 rounded-xl font-semibold text-base transition-all",
                    fromLocation && toLocation
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed",
                  )}
                  whileHover={fromLocation && toLocation ? { scale: 1.02 } : {}}
                  whileTap={fromLocation && toLocation ? { scale: 0.98 } : {}}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Finding Route...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-5 w-5" />
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
