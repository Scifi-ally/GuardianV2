import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGeolocation } from "@/hooks/use-device-apis";
import { cn } from "@/lib/utils";

interface LocationDebugPanelProps {
  showDebug?: boolean;
  onToggleDebug?: (show: boolean) => void;
}

export function LocationDebugPanel({
  showDebug = false,
  onToggleDebug,
}: LocationDebugPanelProps) {
  const {
    location,
    error,
    isTracking,
    permissionStatus,
    getCurrentLocation,
    startTracking,
    stopTracking,
    requestPermission,
  } = useGeolocation();

  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [updateCount, setUpdateCount] = useState(0);
  const [averageAccuracy, setAverageAccuracy] = useState<number>(0);
  const [accuracyHistory, setAccuracyHistory] = useState<number[]>([]);

  // Track location updates
  useEffect(() => {
    if (location) {
      setLastUpdate(new Date(location.timestamp).toLocaleString());
      setUpdateCount((prev) => prev + 1);

      // Track accuracy history
      setAccuracyHistory((prev) => {
        const newHistory = [...prev, location.accuracy].slice(-10); // Keep last 10
        const avg =
          newHistory.reduce((sum, acc) => sum + acc, 0) / newHistory.length;
        setAverageAccuracy(avg);
        return newHistory;
      });
    }
  }, [location]);

  const getLocationQuality = () => {
    if (!location) return null;

    const accuracy = location.accuracy;
    if (accuracy <= 5) return { level: "excellent", color: "text-green-600" };
    if (accuracy <= 20) return { level: "good", color: "text-blue-600" };
    if (accuracy <= 100) return { level: "fair", color: "text-yellow-600" };
    return { level: "poor", color: "text-red-600" };
  };

  const getPermissionStatusColor = () => {
    switch (permissionStatus) {
      case "granted":
        return "bg-green-100 text-green-800 border-green-200";
      case "denied":
        return "bg-red-100 text-red-800 border-red-200";
      case "prompt":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const quality = getLocationQuality();

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onToggleDebug?.(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          Location Debug
        </Button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 400 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-4 right-4 z-50 w-80"
      >
        <Card className="bg-background/95 backdrop-blur-md shadow-lg border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location Debug
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleDebug?.(false)}
                className="h-6 w-6 p-0"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Permission Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Permission</span>
                <Badge
                  variant="outline"
                  className={cn("text-xs", getPermissionStatusColor())}
                >
                  {permissionStatus}
                </Badge>
              </div>
              {permissionStatus === "denied" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestPermission}
                  className="w-full h-7 text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Request Permission
                </Button>
              )}
            </div>

            {/* Tracking Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Tracking</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      isTracking
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-800 border-gray-200",
                    )}
                  >
                    {isTracking ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={isTracking ? stopTracking : startTracking}
                    className="h-6 px-2 text-xs"
                  >
                    {isTracking ? "Stop" : "Start"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Location Info */}
            {location ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">Coordinates</span>
                    {quality && (
                      <Badge
                        variant="outline"
                        className={cn("text-xs", quality.color)}
                      >
                        {quality.level}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs font-mono bg-muted rounded px-2 py-1">
                    {location.latitude.toFixed(6)}
                    <br />
                    {location.longitude.toFixed(6)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Accuracy</span>
                    <div>±{Math.round(location.accuracy)}m</div>
                  </div>
                  <div>
                    <span className="font-medium">Updates</span>
                    <div>{updateCount}</div>
                  </div>
                  {location.speed !== undefined && location.speed > 0 && (
                    <div>
                      <span className="font-medium">Speed</span>
                      <div>{Math.round(location.speed * 3.6)} km/h</div>
                    </div>
                  )}
                  {location.heading !== undefined && (
                    <div>
                      <span className="font-medium">Heading</span>
                      <div>{Math.round(location.heading)}°</div>
                    </div>
                  )}
                </div>

                {averageAccuracy > 0 && (
                  <div>
                    <span className="text-xs font-medium">Avg. Accuracy</span>
                    <div className="text-xs">
                      ±{Math.round(averageAccuracy)}m
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-xs font-medium">Last Update</span>
                  <div className="text-xs text-muted-foreground">
                    {lastUpdate}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 text-muted-foreground animate-spin" />
                <div className="text-xs text-muted-foreground">
                  Waiting for location...
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-destructive">
                      Location Error
                    </div>
                    <div className="text-xs text-destructive/80 mt-1">
                      {error}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="w-full mt-2 h-7 text-xs border-destructive/30 hover:bg-destructive/10"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={getCurrentLocation}
                className="h-7 text-xs"
              >
                <Target className="w-3 h-3 mr-1" />
                Get Location
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setUpdateCount(0);
                  setAccuracyHistory([]);
                  setAverageAccuracy(0);
                }}
                className="h-7 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset Stats
              </Button>
            </div>

            {/* Browser Info */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <div>
                Browser:{" "}
                {navigator.userAgent.includes("Chrome") ? "Chrome" : "Other"}
              </div>
              <div>
                Geolocation:{" "}
                {navigator.geolocation ? "Supported" : "Not supported"}
              </div>
              <div>
                Permissions API:{" "}
                {"permissions" in navigator ? "Available" : "Not available"}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default LocationDebugPanel;
