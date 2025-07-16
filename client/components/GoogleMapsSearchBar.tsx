import { useState, useRef, useEffect } from "react";
import { Search, X, Navigation, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoogleMapsSearchBarProps {
  onSearch: (query: string) => void;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  className?: string;
}

export function GoogleMapsSearchBar({
  onSearch,
  location,
  className,
}: GoogleMapsSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Google Places Autocomplete
  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      if (window.google?.maps?.places) {
        const service = new google.maps.places.AutocompleteService();

        service.getPlacePredictions(
          {
            input: searchQuery,
            types: ["establishment", "geocode"],
            location: location
              ? new google.maps.LatLng(location.latitude, location.longitude)
              : undefined,
            radius: 50000,
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
              setShowSuggestions(true);
            }
          },
        );
      }
    } catch (error) {
      console.warn("Google Places API not available");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      {/* Main Search Bar - Exact Google Maps Style */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="w-full">
          <div
            className={cn(
              "flex items-center bg-white rounded-lg shadow-md border transition-all duration-200",
              isFocused
                ? "shadow-lg border-blue-500"
                : "border-gray-200 hover:shadow-lg",
            )}
          >
            {/* Search Icon */}
            <div className="pl-4 pr-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search Google Maps"
              className="flex-1 py-3 text-gray-900 placeholder-gray-500 bg-transparent outline-none text-base"
              style={{ fontSize: "16px" }} // Prevent zoom on iOS
            />

            {/* Clear Button */}
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-2 mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Directions Button */}
            <button
              type="button"
              className="p-2 mr-3 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            >
              <Navigation className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Suggestions Dropdown - Google Maps Style */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 truncate">{suggestion}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent Searches - Google Maps Style */}
      {isFocused && !query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent
            </h3>
          </div>
          <div className="px-4 py-3 text-sm text-gray-500">
            No recent searches
          </div>
        </div>
      )}
    </div>
  );
}
