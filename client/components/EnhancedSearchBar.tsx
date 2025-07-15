/**
 * Enhanced Search Bar with Google Maps-style Auto-suggestions
 * Provides comprehensive search functionality with real-time suggestions
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Navigation,
  Clock,
  Star,
  Locate,
  X,
  ArrowRight,
  Building,
  Car,
  User,
  Bike,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-device-apis";
import {
  enhancedNavigationService,
  TravelMode,
} from "@/services/enhancedNavigationService";

interface SearchSuggestion {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  type: "place" | "recent" | "favorite" | "category";
  icon:
    | "pin"
    | "star"
    | "clock"
    | "building"
    | "restaurant"
    | "hospital"
    | "gas";
  distance?: string;
  rating?: number;
  place_id?: string;
  types?: string[];
}

interface EnhancedSearchBarProps {
  onPlaceSelect: (place: SearchSuggestion) => void;
  onNavigationStart?: (destination: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
  placeholder?: string;
  className?: string;
  showTravelModes?: boolean;
  defaultTravelMode?: TravelMode;
}

const RECENT_SEARCHES_KEY = "enhanced_recent_searches";
const FAVORITE_PLACES_KEY = "enhanced_favorite_places";

// Safety-focused categories for quick access
const QUICK_CATEGORIES = [
  { name: "Hospitals", icon: "hospital", query: "hospital near me" },
  { name: "Police", icon: "building", query: "police station near me" },
  { name: "Fire Station", icon: "building", query: "fire station near me" },
  { name: "Pharmacy", icon: "hospital", query: "pharmacy near me" },
  { name: "Safe Places", icon: "building", query: "safe places near me" },
  { name: "Gas Stations", icon: "gas", query: "gas station near me" },
];

export function EnhancedSearchBar({
  onPlaceSelect,
  onNavigationStart,
  placeholder = "Search for places or addresses",
  className,
  showTravelModes = true,
  defaultTravelMode = "driving",
}: EnhancedSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  const [favorites, setFavorites] = useState<SearchSuggestion[]>([]);
  const [currentTravelMode, setCurrentTravelMode] =
    useState<TravelMode>(defaultTravelMode);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { getCurrentLocation, location } = useGeolocation();

  // Initialize Google Places services
  useEffect(() => {
    const initializeServices = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current =
          new google.maps.places.AutocompleteService();

        // Create a hidden map for PlacesService
        const mapDiv = document.createElement("div");
        const map = new google.maps.Map(mapDiv);
        placesService.current = new google.maps.places.PlacesService(map);

        console.log("✅ Google Places services initialized");
      } else {
        // Retry after 500ms if Google Maps not loaded yet
        setTimeout(initializeServices, 500);
      }
    };

    initializeServices();
    loadStoredData();
  }, []);

  // Load recent searches and favorites from localStorage
  const loadStoredData = () => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }

      const storedFavorites = localStorage.getItem(FAVORITE_PLACES_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Failed to load stored search data:", error);
    }
  };

  // Save recent search
  const saveRecentSearch = (place: SearchSuggestion) => {
    try {
      const updated = [
        { ...place, type: "recent" as const },
        ...recentSearches.filter((r) => r.id !== place.id).slice(0, 4),
      ];
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save recent search:", error);
    }
  };

  // Get Google Places suggestions
  const getGooglePlacesSuggestions = useCallback(
    async (query: string): Promise<SearchSuggestion[]> => {
      if (!autocompleteService.current || query.length < 2) return [];

      return new Promise((resolve) => {
        const request: google.maps.places.AutocompletionRequest = {
          input: query,
          types: ["establishment", "geocode"],
          componentRestrictions: { country: ["in"] }, // India focus
          location: location
            ? new google.maps.LatLng(location.latitude, location.longitude)
            : undefined,
          radius: location ? 50000 : undefined, // 50km radius
        };

        autocompleteService.current!.getPlacePredictions(
          request,
          (predictions, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              const suggestions: SearchSuggestion[] = predictions
                .slice(0, 8)
                .map((prediction) => ({
                  id: prediction.place_id || Math.random().toString(),
                  name: prediction.structured_formatting.main_text,
                  address:
                    prediction.structured_formatting.secondary_text ||
                    prediction.description,
                  location: { lat: 0, lng: 0 }, // Will be filled when selected
                  type: "place",
                  icon: getPlaceIcon(prediction.types),
                  place_id: prediction.place_id,
                  types: prediction.types,
                }));
              resolve(suggestions);
            } else {
              resolve([]);
            }
          },
        );
      });
    },
    [location],
  );

  // Get place icon based on type
  const getPlaceIcon = (types: string[] = []): SearchSuggestion["icon"] => {
    if (types.includes("restaurant") || types.includes("food"))
      return "restaurant";
    if (types.includes("gas_station")) return "gas";
    if (types.includes("hospital") || types.includes("pharmacy"))
      return "hospital";
    if (types.includes("atm") || types.includes("bank")) return "building";
    return "pin";
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedIndex(-1);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const googleSuggestions = await getGooglePlacesSuggestions(value);

        // Filter recent searches and favorites that match the query
        const filteredRecent = recentSearches
          .filter(
            (item) =>
              item.name.toLowerCase().includes(value.toLowerCase()) ||
              item.address.toLowerCase().includes(value.toLowerCase()),
          )
          .slice(0, 3);

        const filteredFavorites = favorites
          .filter(
            (item) =>
              item.name.toLowerCase().includes(value.toLowerCase()) ||
              item.address.toLowerCase().includes(value.toLowerCase()),
          )
          .slice(0, 2);

        // Combine all suggestions with priorities
        const allSuggestions = [
          ...filteredFavorites,
          ...filteredRecent,
          ...googleSuggestions,
        ];

        setSuggestions(allSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Search failed:", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Get current location
  const handleCurrentLocation = async () => {
    try {
      setIsSearching(true);
      const currentLoc = await getCurrentLocation();

      const currentLocationSuggestion: SearchSuggestion = {
        id: "current_location",
        name: "Current Location",
        address: `${currentLoc.latitude.toFixed(6)}, ${currentLoc.longitude.toFixed(6)}`,
        location: { lat: currentLoc.latitude, lng: currentLoc.longitude },
        type: "place",
        icon: "pin",
      };

      handlePlaceSelect(currentLocationSuggestion);
    } catch (error) {
      console.error("Failed to get current location:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle place selection
  const handlePlaceSelect = async (suggestion: SearchSuggestion) => {
    try {
      let finalSuggestion = suggestion;

      // If it's a Google Places suggestion without coordinates, get the details
      if (suggestion.place_id && suggestion.location.lat === 0) {
        setIsSearching(true);

        const placeDetails = await getPlaceDetails(suggestion.place_id);
        if (placeDetails) {
          finalSuggestion = {
            ...suggestion,
            location: {
              lat: placeDetails.geometry!.location!.lat(),
              lng: placeDetails.geometry!.location!.lng(),
            },
            rating: placeDetails.rating,
          };
        }
      }

      setSearchQuery(finalSuggestion.name);
      setShowSuggestions(false);
      saveRecentSearch(finalSuggestion);
      onPlaceSelect(finalSuggestion);

      // Auto-start navigation if callback provided
      if (onNavigationStart) {
        onNavigationStart({
          lat: finalSuggestion.location.lat,
          lng: finalSuggestion.location.lng,
          name: finalSuggestion.name,
        });
      }
    } catch (error) {
      console.error("Failed to select place:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Get Google Place details
  const getPlaceDetails = (
    placeId: string,
  ): Promise<google.maps.places.PlaceResult | null> => {
    return new Promise((resolve) => {
      if (!placesService.current) {
        resolve(null);
        return;
      }

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ["geometry", "name", "formatted_address", "rating", "types"],
      };

      placesService.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          resolve(null);
        }
      });
    });
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handlePlaceSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Get suggestion icon component
  const getSuggestionIcon = (
    iconType: SearchSuggestion["icon"],
    suggestionType: SearchSuggestion["type"],
  ) => {
    const iconClass = "h-4 w-4 flex-shrink-0";

    if (suggestionType === "recent")
      return <Clock className={cn(iconClass, "text-gray-500")} />;
    if (suggestionType === "favorite")
      return <Star className={cn(iconClass, "text-yellow-500")} />;

    switch (iconType) {
      case "restaurant":
        return <Building className={cn(iconClass, "text-orange-500")} />;
      case "hospital":
        return <Building className={cn(iconClass, "text-red-500")} />;
      case "gas":
        return <Building className={cn(iconClass, "text-blue-500")} />;
      case "building":
        return <Building className={cn(iconClass, "text-gray-600")} />;
      default:
        return <MapPin className={cn(iconClass, "text-green-500")} />;
    }
  };

  // Travel mode icons
  const getTravelModeIcon = (mode: TravelMode) => {
    switch (mode) {
      case "driving":
        return <Car className="h-4 w-4" />;
      case "walking":
        return <User className="h-4 w-4" />;
      case "bicycling":
        return <Bike className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <Search
            className={cn(
              "h-5 w-5 transition-colors",
              isSearching ? "text-blue-500 animate-pulse" : "text-gray-400",
            )}
          />
        </div>

        <Input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          className="pl-12 pr-20 h-14 text-base border border-gray-300 focus:border-blue-500 rounded-full shadow-md focus:shadow-lg transition-all duration-200 bg-white"
          autoComplete="off"
        />

        {/* Action Buttons Container - Google Maps Style */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {/* Clear Button - Google Maps Style */}
          {searchQuery && (
            <Button
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
                setShowSuggestions(false);
                searchInputRef.current?.focus();
              }}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Current Location Button */}
          <Button
            onClick={handleCurrentLocation}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-500"
            disabled={isSearching}
            title="Use current location"
          >
            <Locate className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || searchQuery === "") && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-3 z-50"
          >
            <Card className="shadow-2xl border border-gray-200 max-h-96 overflow-hidden rounded-lg bg-white">
              <CardContent className="p-0">
                {/* Quick Categories (when no search query) */}
                {searchQuery === "" && (
                  <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                      Quick search
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                      {QUICK_CATEGORIES.map((category) => (
                        <Button
                          key={category.name}
                          onClick={() => handleSearchChange(category.query)}
                          variant="outline"
                          size="sm"
                          className="h-7 sm:h-8 text-xs justify-start"
                        >
                          <Building className="h-3 w-3 mr-1" />
                          <span className="truncate">{category.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions List */}
                <div className="max-h-64 sm:max-h-80 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handlePlaceSelect(suggestion)}
                      className={cn(
                        "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0",
                        selectedIndex === index && "bg-blue-50",
                      )}
                    >
                      {getSuggestionIcon(suggestion.icon, suggestion.type)}

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900 truncate">
                          {suggestion.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">
                          {suggestion.address}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {suggestion.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600">
                              {suggestion.rating}
                            </span>
                          </div>
                        )}

                        {suggestion.type === "recent" && (
                          <Badge variant="secondary" className="text-xs">
                            Recent
                          </Badge>
                        )}

                        {suggestion.type === "favorite" && (
                          <Badge
                            variant="secondary"
                            className="text-xs text-yellow-600"
                          >
                            ★
                          </Badge>
                        )}

                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* No Results */}
                {suggestions.length === 0 &&
                  searchQuery !== "" &&
                  !isSearching && (
                    <div className="p-4 text-center text-gray-500">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <div className="text-sm">No places found</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Try a different search term
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}

export default EnhancedSearchBar;
