import { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  geocodingService,
  type LocationInfo,
} from "@/services/geocodingService";
import { motion } from "framer-motion";

interface LocationDisplayProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  className?: string;
  showAccuracy?: boolean;
  showRefresh?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function LocationDisplay({
  latitude,
  longitude,
  accuracy,
  className,
  showAccuracy = true,
  showRefresh = false,
  compact = false,
  onClick,
}: LocationDisplayProps) {
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocationName = async () => {
    if (!latitude || !longitude) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await geocodingService.reverseGeocode(latitude, longitude);
      setLocationInfo(result.location);
    } catch (err) {
      console.error("Failed to get location name:", err);
      setError("Unable to get location name");
      // Create fallback location info
      setLocationInfo({
        formattedAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        city: "Unknown",
        state: "",
        country: "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationName();
  }, [latitude, longitude]);

  const getAccuracyColor = () => {
    if (!accuracy) return "text-gray-500";
    if (accuracy <= 5) return "text-green-600";
    if (accuracy <= 20) return "text-blue-600";
    if (accuracy <= 100) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyLevel = () => {
    if (!accuracy) return "Unknown";
    if (accuracy <= 5) return "Excellent";
    if (accuracy <= 20) return "Good";
    if (accuracy <= 100) return "Fair";
    return "Poor";
  };

  if (compact) {
    return (
      <motion.div
        className={cn(
          "flex items-center gap-2 text-sm",
          onClick &&
            "cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors",
          className,
        )}
        onClick={onClick}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-gray-500">Finding location...</span>
          </div>
        ) : error ? (
          <span className="text-red-500 text-xs">Location unavailable</span>
        ) : locationInfo ? (
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {geocodingService.getShortLocationName(locationInfo)}
            </div>
            {showAccuracy && accuracy && (
              <div className={cn("text-xs", getAccuracyColor())}>
                ±{Math.round(accuracy)}m • {getAccuracyLevel()}
              </div>
            )}
          </div>
        ) : null}
        {showRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fetchLocationName();
            }}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-50 rounded-full">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-500">
                      Finding your location...
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </div>
                </div>
              ) : error ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-red-600">
                    Location Error
                  </div>
                  <div className="text-xs text-gray-500">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </div>
                </div>
              ) : locationInfo ? (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {geocodingService.getShortLocationName(locationInfo)}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {geocodingService.getDisplayAddress(locationInfo)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {showAccuracy && accuracy && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          getAccuracyColor(),
                          "bg-gray-100",
                        )}
                      >
                        <Navigation className="h-3 w-3 mr-1" />±
                        {Math.round(accuracy)}m
                      </Badge>
                    )}

                    {locationInfo.neighborhood && (
                      <Badge variant="outline" className="text-xs">
                        {locationInfo.neighborhood}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>

          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchLocationName}
              disabled={isLoading}
              className="ml-2"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick location name hook for simple use cases
export function useLocationName(latitude: number, longitude: number) {
  const [locationName, setLocationName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchName = async () => {
      if (!latitude || !longitude) return;

      setIsLoading(true);
      try {
        const result = await geocodingService.reverseGeocode(
          latitude,
          longitude,
        );
        setLocationName(geocodingService.getShortLocationName(result.location));
      } catch (error) {
        setLocationName(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchName();
  }, [latitude, longitude]);

  return { locationName, isLoading };
}
