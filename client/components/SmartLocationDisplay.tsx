import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartLocationDisplayProps {
  latitude: number;
  longitude: number;
  className?: string;
  showCoordinates?: boolean;
}

export function SmartLocationDisplay({
  latitude,
  longitude,
  className,
  showCoordinates = false,
}: SmartLocationDisplayProps) {
  const [locationName, setLocationName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getLocationName = async () => {
      setIsLoading(true);
      try {
        // Try Google Geocoding API if available
        if (window.google?.maps) {
          const geocoder = new google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };

          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              // Extract the most relevant name parts
              const result = results[0];
              const components = result.address_components;

              let shortName = "";
              let neighborhood = "";
              let city = "";

              components.forEach((component) => {
                const types = component.types;
                if (
                  types.includes("establishment") ||
                  types.includes("point_of_interest")
                ) {
                  shortName = component.long_name;
                } else if (
                  types.includes("neighborhood") ||
                  types.includes("sublocality")
                ) {
                  neighborhood = component.long_name;
                } else if (types.includes("locality")) {
                  city = component.long_name;
                }
              });

              // Build display name
              if (shortName) {
                setLocationName(shortName);
              } else if (neighborhood && city) {
                setLocationName(`${neighborhood}, ${city}`);
              } else if (city) {
                setLocationName(city);
              } else {
                setLocationName(result.formatted_address.split(",")[0]);
              }
            } else {
              setLocationName(
                `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
              );
            }
            setIsLoading(false);
          });
        } else {
          // Fallback to OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                "User-Agent": "Guardian Safety App",
              },
            },
          );

          if (response.ok) {
            const data = await response.json();
            if (data.display_name) {
              const address = data.address || {};
              const name =
                address.neighbourhood ||
                address.suburb ||
                address.city ||
                address.town ||
                data.display_name.split(",")[0];
              setLocationName(name);
            } else {
              setLocationName(
                `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
              );
            }
          } else {
            setLocationName(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.warn("Geocoding failed:", error);
        setLocationName(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        setIsLoading(false);
      }
    };

    getLocationName();
  }, [latitude, longitude]);

  if (isLoading) {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs text-gray-500">Finding location...</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <MapPin className="h-3 w-3 text-blue-500" />
      <span className="text-sm">{locationName}</span>
      {showCoordinates && (
        <span className="text-xs text-gray-500 ml-1">
          ({latitude.toFixed(3)}, {longitude.toFixed(3)})
        </span>
      )}
    </span>
  );
}

// Hook version for simple use cases
export function useLocationName(latitude: number, longitude: number) {
  const [locationName, setLocationName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getLocationName = async () => {
      setIsLoading(true);
      try {
        if (window.google?.maps) {
          const geocoder = new google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };

          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              const result = results[0];
              const components = result.address_components;

              let shortName = "";
              let neighborhood = "";
              let city = "";

              components.forEach((component) => {
                const types = component.types;
                if (
                  types.includes("establishment") ||
                  types.includes("point_of_interest")
                ) {
                  shortName = component.long_name;
                } else if (
                  types.includes("neighborhood") ||
                  types.includes("sublocality")
                ) {
                  neighborhood = component.long_name;
                } else if (types.includes("locality")) {
                  city = component.long_name;
                }
              });

              if (shortName) {
                setLocationName(shortName);
              } else if (neighborhood && city) {
                setLocationName(`${neighborhood}, ${city}`);
              } else if (city) {
                setLocationName(city);
              } else {
                setLocationName(result.formatted_address.split(",")[0]);
              }
            } else {
              setLocationName(
                `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
              );
            }
            setIsLoading(false);
          });
        } else {
          setLocationName(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
          setIsLoading(false);
        }
      } catch (error) {
        setLocationName(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        setIsLoading(false);
      }
    };

    getLocationName();
  }, [latitude, longitude]);

  return { locationName, isLoading };
}
