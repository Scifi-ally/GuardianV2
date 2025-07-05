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

  // Mock autocomplete service (replace with actual Google Places API)
  const getMockSuggestions = (query: string): LocationSuggestion[] => {
    if (query.length < 2) return [];

    const recentSearches = [
      {
        place_id: "recent_1",
        description: "Home",
        main_text: "Home",
        secondary_text: "123 Main Street, Anytown",
        types: ["premise"],
      },
      {
        place_id: "recent_2",
        description: "Work",
        main_text: "Work",
        secondary_text: "456 Business Ave, Downtown",
        types: ["establishment"],
      },
    ];

    const mockPlaces = [
      // Coffee shops
      {
        place_id: "1",
        description: "Starbucks Coffee",
        main_text: "Starbucks",
        secondary_text: "Coffee shop • 0.3 miles away",
        types: ["cafe", "food", "establishment"],
      },
      {
        place_id: "coffee2",
        description: "Blue Bottle Coffee",
        main_text: "Blue Bottle Coffee",
        secondary_text: "Coffee shop • 0.5 miles away",
        types: ["cafe", "food", "establishment"],
      },
      // Restaurants
      {
        place_id: "rest1",
        description: "McDonald's",
        main_text: "McDonald's",
        secondary_text: "Fast food • 0.2 miles away",
        types: ["restaurant", "food", "establishment"],
      },
      {
        place_id: "rest2",
        description: "Chipotle Mexican Grill",
        main_text: "Chipotle",
        secondary_text: "Mexican restaurant • 0.7 miles away",
        types: ["restaurant", "food", "establishment"],
      },
      // Shopping
      {
        place_id: "3",
        description: "City Mall",
        main_text: "City Mall",
        secondary_text: "Shopping center • 1.2 miles away",
        types: ["shopping_mall", "establishment"],
      },
      {
        place_id: "shop1",
        description: "Target",
        main_text: "Target",
        secondary_text: "Department store • 0.9 miles away",
        types: ["store", "establishment"],
      },
      {
        place_id: "shop2",
        description: "Whole Foods Market",
        main_text: "Whole Foods",
        secondary_text: "Grocery store • 0.6 miles away",
        types: ["grocery_or_supermarket", "establishment"],
      },
      // Public places
      {
        place_id: "2",
        description: "Central Library",
        main_text: "Central Library",
        secondary_text: "Public library • 0.8 miles away",
        types: ["library", "establishment"],
      },
      {
        place_id: "4",
        description: "University Campus",
        main_text: "University Campus",
        secondary_text: "Educational institution • 2.1 miles away",
        types: ["university", "establishment"],
      },
      {
        place_id: "5",
        description: "Downtown Hospital",
        main_text: "Downtown Hospital",
        secondary_text: "Medical center • 1.5 miles away",
        types: ["hospital", "establishment"],
      },
      {
        place_id: "6",
        description: "City Park",
        main_text: "City Park",
        secondary_text: "Public park • 0.6 miles away",
        types: ["park", "establishment"],
      },
      // Transport
      {
        place_id: "7",
        description: "Train Station",
        main_text: "Main Train Station",
        secondary_text: "Transit station • 1.8 miles away",
        types: ["transit_station", "establishment"],
      },
      {
        place_id: "airport1",
        description: "San Francisco International Airport",
        main_text: "SFO Airport",
        secondary_text: "Airport • 12 miles away",
        types: ["airport", "establishment"],
      },
      // Services
      {
        place_id: "8",
        description: "Gas Station",
        main_text: "Shell Gas Station",
        secondary_text: "Fuel station • 0.4 miles away",
        types: ["gas_station", "establishment"],
      },
      {
        place_id: "bank1",
        description: "Bank of America",
        main_text: "Bank of America",
        secondary_text: "Bank • 0.3 miles away",
        types: ["bank", "establishment"],
      },
      {
        place_id: "gym1",
        description: "24 Hour Fitness",
        main_text: "24 Hour Fitness",
        secondary_text: "Gym • 0.8 miles away",
        types: ["gym", "establishment"],
      },
    ];

    // Combine recent searches and places
    const allSuggestions = [...recentSearches, ...mockPlaces];

    // Filter based on query with fuzzy matching
    const queryLower = query.toLowerCase();
    const filtered = allSuggestions.filter((place) => {
      const mainMatch = place.main_text.toLowerCase().includes(queryLower);
      const descMatch = place.description.toLowerCase().includes(queryLower);
      const wordMatch = place.main_text
        .toLowerCase()
        .split(" ")
        .some((word) => word.startsWith(queryLower));
      return mainMatch || descMatch || wordMatch;
    });

    // If no matches, show some default suggestions
    if (filtered.length === 0) {
      return allSuggestions.slice(0, 4);
    }

    // Prioritize exact matches and recent searches
    return filtered.slice(0, 6);
  };

  // Handle input changes with immediate suggestions
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

    // Show suggestions immediately for any input
    const results = getMockSuggestions(value);
    console.log(
      `🔍 Immediate search for "${value}": ${results.length} results found`,
    );
    console.log(
      "📍 Suggestions:",
      results.map((r) => r.main_text),
    );

    setSuggestions(results);
    setShowSuggestions(true);
    setIsLoading(false);
  }, [value]);

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
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    onChange(suggestion.main_text);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // Mock place details (replace with actual Google Places API)
    const mockPlace = {
      place_id: suggestion.place_id,
      name: suggestion.main_text,
      formatted_address: suggestion.description,
      geometry: {
        location: {
          lat: 37.7749 + (Math.random() - 0.5) * 0.1,
          lng: -122.4194 + (Math.random() - 0.5) * 0.1,
        },
      },
    };

    onPlaceSelect(mockPlace);
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
                secondary_text: "123 Main Street, Anytown",
                types: ["premise"],
              },
              {
                place_id: "recent_2",
                description: "Work",
                main_text: "Work",
                secondary_text: "456 Business Ave, Downtown",
                types: ["establishment"],
              },
            ];
            setSuggestions(recentSearches);
            setShowSuggestions(true);
          }
        }}
        onBlur={() => {
          // Delay hiding to allow click on suggestions
          setTimeout(() => setShowSuggestions(false), 150);
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
