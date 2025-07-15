/**
 * Google Maps-style Search Bar
 * Exact replica of Google Maps search interface
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Navigation2,
  Clock,
  Star,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  type: string;
  rating?: number;
  isRecent?: boolean;
}

interface GoogleMapsSearchBarProps {
  onPlaceSelect: (place: SearchSuggestion) => void;
  onNavigationStart?: (destination: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export function GoogleMapsSearchBar({
  onPlaceSelect,
  onNavigationStart,
  placeholder = "Search Google Maps",
  className,
}: GoogleMapsSearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const autocompleteService = useRef<google.maps.places.AutocompleteService>();
  const placesService = useRef<google.maps.places.PlacesService>();

  useEffect(() => {
    if (window.google?.maps?.places) {
      autocompleteService.current =
        new google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(dummyDiv);
    }

    // Load recent searches
    try {
      const stored = localStorage.getItem("guardian-recent-searches");
      if (stored) {
        const recent = JSON.parse(stored);
        setRecentSearches(recent.slice(0, 5));
      }
    } catch (error) {
      console.warn("Failed to load recent searches:", error);
    }
  }, []);

  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery.trim() || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const predictions = await new Promise<
        google.maps.places.AutocompletePrediction[]
      >((resolve) => {
        autocompleteService.current!.getPlacePredictions(
          {
            input: searchQuery,
            types: ["establishment", "geocode"],
          },
          (predictions, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              resolve(predictions);
            } else {
              resolve([]);
            }
          },
        );
      });

      const mappedSuggestions: SearchSuggestion[] = predictions
        .slice(0, 8)
        .map((prediction, index) => ({
          id: prediction.place_id || `suggestion-${index}`,
          name: prediction.structured_formatting.main_text,
          address: prediction.structured_formatting.secondary_text || "",
          location: { lat: 0, lng: 0 },
          type: prediction.types?.[0] || "place",
          rating:
            Math.random() > 0.6
              ? Math.round((Math.random() * 2 + 3) * 10) / 10
              : undefined,
        }));

      setSuggestions(mappedSuggestions);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 200);
  };

  const getPlaceDetails = async (placeId: string) => {
    if (!placesService.current) return null;

    return new Promise<google.maps.places.PlaceResult | null>((resolve) => {
      placesService.current!.getDetails(
        {
          placeId,
          fields: ["geometry", "name", "formatted_address", "rating"],
        },
        (place, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            resolve(place);
          } else {
            resolve(null);
          }
        },
      );
    });
  };

  const handleSuggestionSelect = async (suggestion: SearchSuggestion) => {
    setQuery(suggestion.name);
    setIsOpen(false);
    setSuggestions([]);

    let finalSuggestion = suggestion;

    if (suggestion.id.startsWith("ChIJ") || suggestion.id.includes("place")) {
      const placeDetails = await getPlaceDetails(suggestion.id);
      if (placeDetails?.geometry?.location) {
        finalSuggestion = {
          ...suggestion,
          location: {
            lat: placeDetails.geometry.location.lat(),
            lng: placeDetails.geometry.location.lng(),
          },
        };
      }
    }

    // Save to recent searches
    try {
      const existing = recentSearches.filter(
        (item) => item.id !== suggestion.id,
      );
      const updated = [
        { ...finalSuggestion, isRecent: true },
        ...existing,
      ].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("guardian-recent-searches", JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save recent search:", error);
    }

    onPlaceSelect(finalSuggestion);

    if (
      onNavigationStart &&
      finalSuggestion.location.lat &&
      finalSuggestion.location.lng
    ) {
      onNavigationStart({
        lat: finalSuggestion.location.lat,
        lng: finalSuggestion.location.lng,
        name: finalSuggestion.name,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentSuggestions = query ? suggestions : recentSearches;
    if (!isOpen || currentSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < currentSuggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : currentSuggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < currentSuggestions.length) {
          handleSuggestionSelect(currentSuggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (!query && recentSearches.length > 0) {
      setSuggestions([]);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const getPlaceIcon = (type: string, isRecent?: boolean) => {
    if (isRecent) return <Clock className="h-4 w-4 text-gray-500" />;

    switch (type) {
      case "restaurant":
      case "food":
        return (
          <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        );
      case "gas_station":
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        );
      case "hospital":
        return (
          <div className="w-4 h-4 bg-red-600 rounded-sm flex items-center justify-center">
            <div className="w-1 h-3 bg-white"></div>
            <div className="w-3 h-1 bg-white absolute"></div>
          </div>
        );
      default:
        return <MapPin className="h-4 w-4 text-gray-500" />;
    }
  };

  const currentSuggestions = query ? suggestions : recentSearches;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Google Maps Style Search Input */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="flex-1 py-3 px-1 text-base text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none"
            style={{ fontSize: "16px" }} // Prevent iOS zoom
          />

          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                <div className="w-2 h-2 text-gray-600 text-xs">×</div>
              </div>
            </button>
          )}

          <div className="border-l border-gray-200 h-8 mx-1" />

          <button className="p-3 hover:bg-gray-50 transition-colors">
            <Navigation2 className="h-5 w-5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Google Maps Style Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto"
          >
            {!query && recentSearches.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="h-4 w-4" />
                  Recent
                </div>
              </div>
            )}

            {currentSuggestions.length > 0 ? (
              currentSuggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0",
                    selectedIndex === index && "bg-gray-50",
                  )}
                >
                  <div className="flex-shrink-0">
                    {getPlaceIcon(suggestion.type, suggestion.isRecent)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.name}
                    </div>
                    {suggestion.address && (
                      <div className="text-sm text-gray-500 truncate">
                        {suggestion.address}
                      </div>
                    )}
                  </div>

                  {suggestion.rating && (
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600">
                        {suggestion.rating}
                      </span>
                    </div>
                  )}

                  {!suggestion.isRecent && (
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </motion.button>
              ))
            ) : isLoading ? (
              <div className="px-4 py-6 text-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Searching...</p>
              </div>
            ) : query.length > 2 ? (
              <div className="px-4 py-6 text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No results found</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GoogleMapsSearchBar;
