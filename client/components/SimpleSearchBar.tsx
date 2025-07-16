import { useState, useRef, useEffect } from "react";
import { Search, MapPin, X, Loader2, ArrowRight, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleSearchBarProps {
  toLocation: string;
  setToLocation: (location: string) => void;
  onSearch: () => void;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  } | null;
  isSearching?: boolean;
}

export function SimpleSearchBar({
  toLocation,
  setToLocation,
  onSearch,
  location,
  isSearching = false,
}: SimpleSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real Google Places API autocomplete suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      if (window.google?.maps?.places) {
        const service = new google.maps.places.AutocompleteService();

        service.getPlacePredictions(
          {
            input: query,
            types: ["establishment", "geocode"],
            radius: 50000, // 50km radius
            location: location
              ? new google.maps.LatLng(location.latitude, location.longitude)
              : undefined,
          },
          (predictions, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              const suggestionList = predictions
                .slice(0, 5)
                .map((p) => p.description);
              setSuggestions(suggestionList);
            } else {
              setSuggestions([]);
            }
          },
        );
      }
    } catch (error) {
      console.warn("Google Places API not available, using fallback");
      // Fallback suggestions
      const fallbackSuggestions = [
        "Hospital",
        "Police Station",
        "Fire Station",
        "Pharmacy",
        "Gas Station",
      ].filter((s) => s.toLowerCase().includes(query.toLowerCase()));
      setSuggestions(fallbackSuggestions);
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setShowSuggestions(false);
  };

  const handleInputChange = (value: string) => {
    setToLocation(value);
    fetchSuggestions(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setToLocation(suggestion);
    setShowSuggestions(false);
    handleCollapse();
  };

  const handleSearch = () => {
    if (toLocation.trim()) {
      onSearch();
      handleCollapse();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
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
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300">
        {!isExpanded ? (
          // Compact Mode
          <div className="p-3">
            <button
              onClick={handleExpand}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="p-2 bg-blue-500 rounded-xl">
                <Search className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">
                  {toLocation || "Where would you like to go?"}
                </p>
                {location && (
                  <p className="text-xs text-gray-500">From current location</p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        ) : (
          // Expanded Mode
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Search Destination
              </h3>
              <button
                onClick={handleCollapse}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Current Location Display */}
            {location && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-green-800">
                    Starting from current location
                  </span>
                </div>
              </div>
            )}

            {/* Destination Input */}
            <div className="relative mb-4">
              <input
                ref={inputRef}
                type="text"
                value={toLocation}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  if (toLocation) setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Enter destination..."
                className="w-full p-3 pl-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {toLocation && (
                <button
                  onClick={() => {
                    setToLocation("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Real-time Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Suggestions
                </p>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full flex items-center gap-2 p-2 text-left hover:bg-white rounded-lg transition-colors"
                    >
                      <MapPin className="h-3 w-3 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {suggestion}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={!toLocation.trim() || isSearching}
              className={cn(
                "w-full flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all",
                toLocation.trim() && !isSearching
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
              )}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding route...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Get Directions
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
