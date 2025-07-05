import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Clock, Star, Building } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
}

interface LocationAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function LocationAutocompleteInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for a place",
  className,
  disabled = false,
}: LocationAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [inputRect, setInputRect] = useState<DOMRect | null>(null);
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);

  // Initialize Google Places services
  useEffect(() => {
    if (window.google?.maps?.places) {
      const service = new google.maps.places.AutocompleteService();
      setAutocompleteService(service);

      // Create a dummy map for PlacesService (required)
      const map = new google.maps.Map(document.createElement("div"));
      const placesServiceInstance = new google.maps.places.PlacesService(map);
      setPlacesService(placesServiceInstance);

      console.log("✅ Google Places services initialized");
    } else {
      console.warn("⚠️ Google Places API not available, using fallback");
    }
  }, []);

  // Get real Google Places suggestions
  const getGooglePlacesSuggestions = async (
    query: string,
  ): Promise<LocationSuggestion[]> => {
    if (!autocompleteService || query.length < 2) {
      return [];
    }

    return new Promise((resolve) => {
      const request = {
        input: query,
        types: ["establishment", "geocode"],
        fields: ["place_id", "description", "structured_formatting"],
      };

      autocompleteService.getPlacePredictions(
        request,
        (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            const suggestions = predictions.map((prediction) => ({
              place_id: prediction.place_id,
              description: prediction.description,
              main_text: prediction.structured_formatting.main_text,
              secondary_text:
                prediction.structured_formatting.secondary_text || "",
              types: prediction.types || [],
            }));
            resolve(suggestions);
          } else {
            console.warn("Places API error:", status);
            resolve(getFallbackSuggestions(query));
          }
        },
      );
    });
  };

  // Fallback suggestions when Google Places API fails
  const getFallbackSuggestions = (query: string): LocationSuggestion[] => {
    if (query.length < 2) return [];

    const mockPlaces = [
      {
        place_id: "fallback_1",
        description: "Starbucks Coffee",
        main_text: "Starbucks",
        secondary_text: "Coffee shop nearby",
        types: ["cafe", "food", "establishment"],
      },
      {
        place_id: "fallback_2",
        description: "City Mall",
        main_text: "City Mall",
        secondary_text: "Shopping center",
        types: ["shopping_mall", "establishment"],
      },
      {
        place_id: "fallback_3",
        description: "Central Library",
        main_text: "Central Library",
        secondary_text: "Public library",
        types: ["library", "establishment"],
      },
      {
        place_id: "fallback_4",
        description: "Main Train Station",
        main_text: "Train Station",
        secondary_text: "Transit station",
        types: ["transit_station", "establishment"],
      },
    ];

    const queryLower = query.toLowerCase();
    const filtered = mockPlaces.filter(
      (place) =>
        place.main_text.toLowerCase().includes(queryLower) ||
        place.description.toLowerCase().includes(queryLower),
    );

    return filtered.length > 0 ? filtered : mockPlaces.slice(0, 3);
  };

  // Handle input changes with debounced search
  useEffect(() => {
    console.log(`🔍 Input value changed: "${value}"`);

    // Always set input rect when value changes and input is focused
    if (inputRef.current && document.activeElement === inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setInputRect(rect);
      console.log("📍 Updated input rect:", rect);
    }

    if (value.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (value.length < 2) {
      return;
    }

    setIsLoading(true);

    // Debounce search requests
    const searchTimeout = setTimeout(async () => {
      try {
        const results = autocompleteService
          ? await getGooglePlacesSuggestions(value)
          : getFallbackSuggestions(value);

        console.log(
          `🔍 Search for "${value}": ${results.length} results found`,
        );
        console.log(
          "📍 Suggestions:",
          results.map((r) => r.main_text),
        );

        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Search error:", error);
        const fallbackResults = getFallbackSuggestions(value);
        setSuggestions(fallbackResults);
        setShowSuggestions(true);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimeout);
  }, [value, autocompleteService]);

  // Update input position on scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (inputRef.current && showSuggestions) {
        setInputRect(inputRef.current.getBoundingClientRect());
      }
    };

    if (showSuggestions) {
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [showSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
    // Immediately hide suggestions and clear state to prevent double-trigger
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSuggestions([]);

    onChange(suggestion.main_text);
    setIsLoading(true);

    try {
      if (
        placesService &&
        suggestion.place_id &&
        !suggestion.place_id.startsWith("fallback_")
      ) {
        // Get detailed place information from Google Places API
        const request = {
          placeId: suggestion.place_id,
          fields: [
            "place_id",
            "name",
            "formatted_address",
            "geometry",
            "types",
          ],
        };

        placesService.getDetails(request, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            console.log("✅ Place details retrieved:", place);
            onPlaceSelect({
              place_id: place.place_id,
              name: place.name,
              formatted_address: place.formatted_address,
              geometry: {
                location: {
                  lat: place.geometry?.location?.lat() || 37.7749,
                  lng: place.geometry?.location?.lng() || -122.4194,
                },
              },
              types: place.types || [],
            });
          } else {
            console.warn("Failed to get place details, using fallback");
            useFallbackPlace(suggestion);
          }
          setIsLoading(false);
        });
      } else {
        // Use fallback for non-Google places or when service unavailable
        useFallbackPlace(suggestion);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error getting place details:", error);
      useFallbackPlace(suggestion);
      setIsLoading(false);
    }
  };

  // Fallback place creation
  const useFallbackPlace = (suggestion: LocationSuggestion) => {
    const fallbackPlace = {
      place_id: suggestion.place_id,
      name: suggestion.main_text,
      formatted_address: suggestion.description,
      geometry: {
        location: {
          lat: 37.7749 + (Math.random() - 0.5) * 0.1,
          lng: -122.4194 + (Math.random() - 0.5) * 0.1,
        },
      },
      types: suggestion.types,
    };

    onPlaceSelect(fallbackPlace);
  };

  // Get icon for place type
  const getPlaceIcon = (types: string[], placeId: string) => {
    // Recent searches
    if (placeId.startsWith("recent_")) {
      return <Clock className="h-4 w-4 text-gray-500" />;
    }

    // Place type icons
    if (types.includes("airport")) return "✈️";
    if (types.includes("university") || types.includes("school")) return "🎓";
    if (types.includes("hospital")) return "🏥";
    if (types.includes("restaurant")) return "🍽️";
    if (types.includes("cafe")) return "☕";
    if (types.includes("gas_station")) return "⛽";
    if (types.includes("bank")) return "🏦";
    if (types.includes("park")) return "🌳";
    if (types.includes("tourist_attraction")) return "📍";
    if (types.includes("shopping_mall")) return "🛍️";
    if (types.includes("store")) return "🏪";
    if (types.includes("grocery_or_supermarket")) return "����";
    if (types.includes("library")) return "📚";
    if (types.includes("transit_station")) return "🚉";
    if (types.includes("gym")) return "💪";
    if (types.includes("premise")) return "🏠";
    return <MapPin className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          console.log("🎯 Input focused");
          if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setInputRect(rect);
            console.log("📍 Set input rect on focus:", rect);
          }
          // Always show suggestions on focus if we have any
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          } else if (value.length === 0) {
            // Show recent searches when focused with empty input
            const recentSearches = [
              {
                place_id: "recent_1",
                description: "Home",
                main_text: "Home",
                secondary_text: "Saved location",
                types: ["premise"],
              },
              {
                place_id: "recent_2",
                description: "Work",
                main_text: "Work",
                secondary_text: "Saved location",
                types: ["establishment"],
              },
              {
                place_id: "recent_3",
                description: "Starbucks",
                main_text: "Starbucks",
                secondary_text: "Recent search",
                types: ["cafe"],
              },
            ];
            setSuggestions(recentSearches);
            setShowSuggestions(true);
          }
        }}
        onBlur={(e) => {
          // Don't hide if clicking on suggestions
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (
            relatedTarget &&
            relatedTarget.closest("[data-suggestion-dropdown]")
          ) {
            return;
          }
          // Delay hiding to allow click on suggestions
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        placeholder={placeholder}
        className={cn("pr-10", isLoading && "animate-pulse", className)}
        disabled={disabled}
        autoComplete="off"
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Suggestions dropdown using portal */}
      {(() => {
        console.log("🔍 Suggestion render check:", {
          showSuggestions,
          suggestionsCount: suggestions.length,
          hasInputRect: !!inputRect,
          inputValue: value,
        });

        if (!showSuggestions || suggestions.length === 0 || !inputRect) {
          return null;
        }

        console.log(
          `📋 Rendering ${suggestions.length} suggestions with portal at position:`,
          inputRect,
        );
        return createPortal(
          <Card
            data-suggestion-dropdown="true"
            className="fixed z-[9999] max-h-60 overflow-y-auto bg-white border border-gray-200 shadow-lg"
            style={{
              top: inputRect.bottom + window.scrollY + 4,
              left: inputRect.left + window.scrollX,
              width: inputRect.width,
            }}
          >
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors",
                    selectedIndex === index && "bg-gray-50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {typeof getPlaceIcon(
                        suggestion.types,
                        suggestion.place_id,
                      ) === "string" ? (
                        <span className="text-lg">
                          {getPlaceIcon(suggestion.types, suggestion.place_id)}
                        </span>
                      ) : (
                        getPlaceIcon(suggestion.types, suggestion.place_id)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.main_text}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {suggestion.secondary_text}
                      </div>
                    </div>
                    {suggestion.place_id.startsWith("recent_") ? (
                      <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>,
          document.body,
        );
      })()}

      {/* No results message using portal */}
      {showSuggestions &&
        suggestions.length === 0 &&
        value.length >= 2 &&
        !isLoading &&
        inputRect &&
        createPortal(
          <Card
            className="fixed z-[9999] bg-white border border-gray-200 shadow-lg"
            style={{
              top: inputRect.bottom + window.scrollY + 4,
              left: inputRect.left + window.scrollX,
              width: inputRect.width,
            }}
          >
            <div className="px-3 py-4 text-center text-sm text-gray-500">
              No places found for "{value}"
            </div>
          </Card>,
          document.body,
        )}
    </div>
  );
}

export default LocationAutocompleteInput;
