import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Clock, Star, Building, Search } from "lucide-react";
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

export const LocationAutocompleteInput = forwardRef<
  HTMLInputElement,
  LocationAutocompleteInputProps
>(
  (
    {
      value,
      onChange,
      onPlaceSelect,
      placeholder = "Search for a place",
      className,
      disabled = false,
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose the input ref to parent components
    useImperativeHandle(ref, () => inputRef.current!);
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

    // Get real Google Places suggestions with enhanced functionality
    const getGooglePlacesSuggestions = async (
      query: string,
    ): Promise<LocationSuggestion[]> => {
      if (!autocompleteService || query.length < 2) {
        return [];
      }

      return new Promise((resolve) => {
        const request: google.maps.places.AutocompletionRequest = {
          input: query,
          types: ["establishment", "geocode", "address"],
          componentRestrictions: {
            country: ["us", "ca", "gb", "au", "de", "fr", "es", "it"],
          },
        };

        // Add location bias if available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              request.location = new google.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude,
              );
              request.radius = 50000; // 50km radius
            },
            () => {
              // Ignore geolocation errors
            },
            { timeout: 1000, enableHighAccuracy: false },
          );
        }

        autocompleteService.getPlacePredictions(
          request,
          (predictions, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              // Enhanced suggestions with better sorting and filtering
              const suggestions = predictions
                .map((prediction) => ({
                  place_id: prediction.place_id,
                  description: prediction.description,
                  main_text: prediction.structured_formatting.main_text,
                  secondary_text:
                    prediction.structured_formatting.secondary_text || "",
                  types: prediction.types || [],
                }))
                .sort((a, b) => {
                  // Prioritize exact matches and popular places
                  const aExact = a.main_text
                    .toLowerCase()
                    .startsWith(query.toLowerCase());
                  const bExact = b.main_text
                    .toLowerCase()
                    .startsWith(query.toLowerCase());

                  if (aExact && !bExact) return -1;
                  if (!aExact && bExact) return 1;

                  // Prioritize establishments over geocoded addresses
                  const aIsEstablishment = a.types.includes("establishment");
                  const bIsEstablishment = b.types.includes("establishment");

                  if (aIsEstablishment && !bIsEstablishment) return -1;
                  if (!aIsEstablishment && bIsEstablishment) return 1;

                  return 0;
                })
                .slice(0, 6); // Limit to 6 suggestions

              resolve(suggestions);
            } else {
              console.warn("Places API error:", status);
              resolve([]);
            }
          },
        );
      });
    };

    // No fallback suggestions - only use real Google Places API results
    const getFallbackSuggestions = (query: string): LocationSuggestion[] => {
      // Return empty array - no mock suggestions
      return [];
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
      }, 150); // Faster debounce for better responsiveness

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
          // Get comprehensive place information from Google Places API
          const request = {
            placeId: suggestion.place_id,
            fields: [
              "place_id",
              "name",
              "formatted_address",
              "geometry",
              "types",
              "rating",
              "user_ratings_total",
              "photos",
              "international_phone_number",
              "website",
              "opening_hours",
              "price_level",
              "vicinity",
              "business_status",
              "url",
            ],
          };

          placesService.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              console.log("✅ Enhanced place details retrieved:", place);

              // Create enhanced place object with additional properties
              const enhancedPlace = {
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
                rating: place.rating || null,
                user_ratings_total: place.user_ratings_total || null,
                price_level: place.price_level || null,
                priceRange: place.price_level
                  ? "$".repeat(place.price_level)
                  : null,
                phone: place.international_phone_number || null,
                website: place.website || null,
                isOpen: place.opening_hours?.isOpen?.() || null,
                openingHours: place.opening_hours?.weekday_text || null,
                vicinity: place.vicinity || null,
                business_status: place.business_status || null,
                url: place.url || null,
                photoUrl:
                  place.photos?.[0]?.getUrl({
                    maxWidth: 400,
                    maxHeight: 300,
                  }) || null,
                primaryType: place.types?.[0] || "place",
                coordinates: {
                  lat: place.geometry?.location?.lat() || 37.7749,
                  lng: place.geometry?.location?.lng() || -122.4194,
                },
              };

              onPlaceSelect(enhancedPlace);
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
      if (types.includes("restaurant")) return "���️";
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
            <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
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
              className="fixed z-[9999] max-h-64 overflow-y-auto bg-white border border-gray-100 shadow-2xl rounded-xl backdrop-blur-sm"
              style={{
                top: inputRect.bottom + window.scrollY + 8,
                left: inputRect.left + window.scrollX,
                width: inputRect.width,
                background: "rgba(255, 255, 255, 0.98)",
                borderWidth: "1px",
              }}
            >
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.place_id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-all duration-150 mx-1 rounded-lg group",
                      selectedIndex === index
                        ? "bg-blue-50 border-l-4 border-l-blue-500 shadow-sm"
                        : "hover:bg-gray-50 hover:shadow-sm",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            selectedIndex === index
                              ? "bg-blue-100"
                              : "bg-gray-100 group-hover:bg-gray-200",
                          )}
                        >
                          {typeof getPlaceIcon(
                            suggestion.types,
                            suggestion.place_id,
                          ) === "string" ? (
                            <span className="text-sm">
                              {getPlaceIcon(
                                suggestion.types,
                                suggestion.place_id,
                              )}
                            </span>
                          ) : (
                            getPlaceIcon(suggestion.types, suggestion.place_id)
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "text-sm font-semibold truncate transition-colors",
                            selectedIndex === index
                              ? "text-blue-900"
                              : "text-gray-900",
                          )}
                        >
                          {suggestion.main_text}
                        </div>
                        <div
                          className={cn(
                            "text-xs truncate transition-colors mt-0.5",
                            selectedIndex === index
                              ? "text-blue-600"
                              : "text-gray-500",
                          )}
                        >
                          {suggestion.secondary_text}
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {suggestion.place_id.startsWith("recent_") ? (
                          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Star className="h-3 w-3 text-yellow-600" />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                              selectedIndex === index
                                ? "bg-blue-100"
                                : "bg-gray-100",
                            )}
                          >
                            <MapPin
                              className={cn(
                                "h-3 w-3 transition-colors",
                                selectedIndex === index
                                  ? "text-blue-600"
                                  : "text-gray-400",
                              )}
                            />
                          </div>
                        )}
                      </div>
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
              className="fixed z-[9999] bg-white border border-gray-100 shadow-2xl rounded-xl backdrop-blur-sm"
              style={{
                top: inputRect.bottom + window.scrollY + 8,
                left: inputRect.left + window.scrollX,
                width: inputRect.width,
                background: "rgba(255, 255, 255, 0.98)",
              }}
            >
              <div className="px-4 py-6 text-center">
                <div className="mb-2">
                  <Search className="h-8 w-8 text-gray-300 mx-auto" />
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  No places found
                </div>
                <div className="text-xs text-gray-400">
                  Try searching for "{value}" with different keywords
                </div>
              </div>
            </Card>,
            document.body,
          )}
      </div>
    );
  },
);

LocationAutocompleteInput.displayName = "LocationAutocompleteInput";

export default LocationAutocompleteInput;
