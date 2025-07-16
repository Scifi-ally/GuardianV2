import { useState, useEffect } from "react";
import { MapPin, Navigation, Locate, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicStatusIndicatorProps {
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  destination?: {
    latitude: number;
    longitude: number;
  } | null;
  isNavigating?: boolean;
  className?: string;
}

export function DynamicStatusIndicator({
  location,
  destination,
  isNavigating,
  className,
}: DynamicStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Monitor Google Maps status
  useEffect(() => {
    if (window.google?.maps) {
      setMapStatus("ready");
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps) {
          setMapStatus("ready");
          clearInterval(interval);
        }
      }, 100);

      setTimeout(() => {
        if (!window.google?.maps) {
          setMapStatus("error");
        }
        clearInterval(interval);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  const getLocationStatus = () => {
    if (!location)
      return { text: "Getting location...", color: "text-yellow-600" };
    if (destination && isNavigating)
      return { text: "Navigation active", color: "text-blue-600" };
    return { text: "Location ready", color: "text-green-600" };
  };

  const locationStatus = getLocationStatus();

  return (
    <div
      className={cn(
        "bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-3",
        className,
      )}
    >
      <div className="flex items-center gap-4 text-sm">
        {/* Location Status */}
        <div className="flex items-center gap-2">
          {location ? (
            <Locate className={cn("h-4 w-4", locationStatus.color)} />
          ) : (
            <div className="h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
          )}
          <span className={cn("font-medium", locationStatus.color)}>
            {locationStatus.text}
          </span>
        </div>

        {/* Navigation Status */}
        {destination && (
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-600">
              {isNavigating ? "Navigating" : "Route set"}
            </span>
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <span
            className={cn(
              "font-medium",
              isOnline ? "text-green-600" : "text-red-600",
            )}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        {/* Map Status */}
        <div className="flex items-center gap-2">
          <MapPin
            className={cn(
              "h-4 w-4",
              mapStatus === "ready"
                ? "text-green-600"
                : mapStatus === "error"
                  ? "text-red-600"
                  : "text-yellow-600",
            )}
          />
          <span
            className={cn(
              "font-medium",
              mapStatus === "ready"
                ? "text-green-600"
                : mapStatus === "error"
                  ? "text-red-600"
                  : "text-yellow-600",
            )}
          >
            {mapStatus === "ready"
              ? "Maps ready"
              : mapStatus === "error"
                ? "Maps error"
                : "Loading maps"}
          </span>
        </div>
      </div>

      {/* Coordinates Display (if location available) */}
      {location && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Lat: {location.latitude.toFixed(6)}</div>
            <div>Lng: {location.longitude.toFixed(6)}</div>
            {destination && (
              <div className="text-blue-600">
                Destination: {destination.latitude.toFixed(4)},{" "}
                {destination.longitude.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
