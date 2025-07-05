import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Locate } from "lucide-react";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  onCurrentLocation?: () => void;
  showCurrentLocationButton?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Enter location...",
  onPlaceSelect,
  onCurrentLocation,
  showCurrentLocationButton = false,
  className = "",
  autoFocus = false,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    // Wait for Google Maps to load
    const initializeAutocomplete = () => {
      if (!window.google?.maps?.places) {
        setTimeout(initializeAutocomplete, 100);
        return;
      }

      try {
        // Create autocomplete with enhanced options for better suggestions
        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current!,
          {
            types: ["establishment", "geocode", "address"], // More comprehensive types
            fields: [
              "place_id",
              "formatted_address",
              "name",
              "geometry",
              "types",
              "vicinity",
              "address_components",
            ],
            // Remove country restrictions for global search
          },
        );

        // Set up place selection listener
        const listener = autocompleteRef.current.addListener(
          "place_changed",
          () => {
            const place = autocompleteRef.current?.getPlace();
            if (place && place.geometry) {
              console.log(
                "📍 Place selected:",
                place.name || place.formatted_address,
              );
              handlePlaceSelect(place);
            }
          },
        );

        return () => {
          if (listener) {
            google.maps.event.removeListener(listener);
          }
        };
      } catch (error) {
        console.error("Failed to initialize autocomplete:", error);
      }
    };

    initializeAutocomplete();
  }, []);

  const handlePlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult) => {
      if (place.formatted_address) {
        onChange(place.formatted_address);
      } else if (place.name) {
        onChange(place.name);
      }

      onPlaceSelect?.(place);
    },
    [onChange, onPlaceSelect],
  );

  const handleCurrentLocation = useCallback(async () => {
    if (!onCurrentLocation) return;

    setIsLoading(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // Reverse geocode to get address
            if (window.google?.maps) {
              const geocoder = new google.maps.Geocoder();
              try {
                const results = await new Promise<google.maps.GeocoderResult[]>(
                  (resolve, reject) => {
                    geocoder.geocode(
                      { location: { lat: latitude, lng: longitude } },
                      (results, status) => {
                        if (
                          status === google.maps.GeocoderStatus.OK &&
                          results
                        ) {
                          resolve(results);
                        } else {
                          reject(new Error("Geocoding failed"));
                        }
                      },
                    );
                  },
                );

                if (results.length > 0) {
                  const address = results[0].formatted_address;
                  onChange(address);
                  console.log("📍 Current location set:", address);
                }
              } catch (error) {
                console.warn("Geocoding failed:", error);
                onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              }
            } else {
              onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            }

            onCurrentLocation();
          },
          (error) => {
            console.error("Failed to get current location:", error);
            alert(
              "Unable to get your current location. Please ensure location access is enabled.",
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000,
          },
        );
      } else {
        alert("Geolocation is not supported by this browser.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [onChange, onCurrentLocation]);

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-4 text-sm"
            autoComplete="off"
            autoFocus={autoFocus}
            spellCheck={false}
          />
        </div>

        {showCurrentLocationButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCurrentLocation}
            disabled={isLoading}
            className="flex-shrink-0"
            title="Use current location"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Locate className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default LocationAutocomplete;
