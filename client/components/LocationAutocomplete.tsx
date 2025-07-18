import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
            toast.error("Location access failed", {
              description: "Please enable location access and try again",
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000,
          },
        );
      } else {
        toast.error("Geolocation not supported", {
          description: "Your browser doesn't support location services",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onChange, onCurrentLocation]);

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-1.5 sm:gap-2">
        <div className="relative flex-1 min-w-0">
          <MapPin className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-8 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base h-10 sm:h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            autoComplete="off"
            autoFocus={autoFocus}
            spellCheck={false}
          />
        </div>

        {showCurrentLocationButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCurrentLocation}
            disabled={isLoading}
            className="flex-shrink-0 h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-lg border-gray-300"
            title="Use current location"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Locate className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default LocationAutocomplete;
