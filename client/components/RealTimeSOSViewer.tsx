import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Battery,
  Signal,
  Navigation,
  RefreshCw,
  AlertTriangle,
  User,
  Calendar,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { SOSService, type SOSAlert } from "@/services/sosService";
import { useAuth } from "@/contexts/AuthContext";
import { notifications } from "@/services/enhancedNotificationService";

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  battery?: number;
  speed?: number;
  address?: string;
}

interface RealTimeSOSViewerProps {
  alert: SOSAlert;
  onNavigate?: (location: LocationUpdate) => void;
  className?: string;
}

export function RealTimeSOSViewer({
  alert,
  onNavigate,
  className,
}: RealTimeSOSViewerProps) {
  const [locationHistory, setLocationHistory] = useState<LocationUpdate[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(true);
  const { userProfile } = useAuth();

  // Simulate real-time location updates (in a real app, this would come from Firebase)
  useEffect(() => {
    if (!alert.id) return;

    // Initialize with alert location if available
    if (alert.location) {
      const initialLocation: LocationUpdate = {
        latitude: alert.location.latitude,
        longitude: alert.location.longitude,
        accuracy: alert.location.accuracy || 0,
        timestamp: alert.location.timestamp,
        battery: 100,
        address: "Initial emergency location",
      };
      setCurrentLocation(initialLocation);
      setLocationHistory([initialLocation]);
      setLastUpdateTime(new Date());
      setIsLoading(false);
    }

    // Simulate receiving location updates every 30 seconds
    const updateInterval = setInterval(() => {
      if (!alert.location) return;

      // Simulate slight movement (in reality, this would be real GPS updates)
      const baseLocation = alert.location;
      const variation = 0.0001; // Small GPS variation
      const randomOffset = () => (Math.random() - 0.5) * variation;

      const newLocation: LocationUpdate = {
        latitude: baseLocation.latitude + randomOffset(),
        longitude: baseLocation.longitude + randomOffset(),
        accuracy: Math.floor(Math.random() * 20) + 5, // 5-25m accuracy
        timestamp: new Date(),
        battery: Math.max(20, Math.floor(Math.random() * 80) + 20),
        speed: Math.random() < 0.3 ? Math.floor(Math.random() * 5) : 0, // Sometimes moving
        address: `Updated location ${new Date().toLocaleTimeString()}`,
      };

      setCurrentLocation(newLocation);
      setLocationHistory((prev) => [newLocation, ...prev.slice(0, 19)]); // Keep last 20 updates
      setLastUpdateTime(new Date());

      // Notify about new location update
      if (Notification.permission === "granted") {
        new Notification(`${alert.senderName} location updated`, {
          body: `New location received at ${newLocation.timestamp.toLocaleTimeString()}`,
          icon: "/logo.svg",
        });
      }

      notifications.info({
        title: "Location Update",
        description: `${alert.senderName} location updated`,
        vibrate: true,
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(updateInterval);
  }, [alert.id, alert.location, alert.senderName]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatTimeDifference = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleNavigateToLocation = (location: LocationUpdate) => {
    onNavigate?.(location);

    // Copy coordinates to clipboard
    const coords = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(coords).then(() => {
      notifications.success({
        title: "Coordinates Copied",
        description: "Emergency location copied to clipboard",
      });
    });
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 10) return "text-green-600";
    if (accuracy <= 25) return "text-yellow-600";
    return "text-red-600";
  };

  const getBatteryColor = (battery: number | undefined) => {
    if (!battery) return "text-gray-500";
    if (battery > 50) return "text-green-600";
    if (battery > 20) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <Card className={cn("border-l-4 border-l-blue-500", className)}>
        <CardContent className="p-6 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-muted-foreground">
            Connecting to {alert.senderName}'s location...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Live Status Header */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Location Tracking</span>
              </div>
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {isLive ? "ACTIVE" : "DISCONNECTED"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{alert.senderName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Updates every 30 seconds</span>
            </div>
            {lastUpdateTime && (
              <div className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                <span>Last: {formatTimeDifference(lastUpdateTime)}</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Current Location */}
      {currentLocation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentLocation.timestamp.getTime()}
        >
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-500" />
                Current Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Coordinates
                  </p>
                  <p className="font-mono text-sm">
                    {currentLocation.latitude.toFixed(6)},{" "}
                    {currentLocation.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Accuracy
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      getAccuracyColor(currentLocation.accuracy),
                    )}
                  >
                    ±{currentLocation.accuracy}m
                  </p>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Battery
                    className={cn(
                      "h-4 w-4",
                      getBatteryColor(currentLocation.battery),
                    )}
                  />
                  <span className="text-sm">
                    {currentLocation.battery || "Unknown"}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Signal className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Strong</span>
                </div>
                {currentLocation.speed !== undefined &&
                  currentLocation.speed > 0 && (
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">
                        {currentLocation.speed} km/h
                      </span>
                    </div>
                  )}
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Updated at {formatTime(currentLocation.timestamp)}</span>
              </div>

              {/* Navigation Button */}
              <Button
                onClick={() => handleNavigateToLocation(currentLocation)}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate to Emergency Location
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Location History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Location History
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing last {locationHistory.length} location updates
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {locationHistory.map((location, index) => (
                <motion.div
                  key={`${location.timestamp.getTime()}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    index === 0 ? "bg-red-50 border-red-200" : "bg-gray-50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        index === 0
                          ? "bg-red-500 animate-pulse"
                          : "bg-gray-400",
                      )}
                    />
                    <div>
                      <p className="text-sm font-mono">
                        {location.latitude.toFixed(6)},{" "}
                        {location.longitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(location.timestamp)} • ±{location.accuracy}m
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {location.battery && (
                      <span
                        className={cn(
                          "text-xs",
                          getBatteryColor(location.battery),
                        )}
                      >
                        {location.battery}%
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNavigateToLocation(location)}
                      className="h-7 px-2"
                    >
                      <Navigation className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Actions */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-red-800">
              Emergency Actions
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => (window.location.href = "tel:911")}
            >
              Call 911
            </Button>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => {
                if (currentLocation) {
                  const message = `EMERGENCY: ${alert.senderName} needs help at ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;
                  navigator.share?.({
                    title: "Emergency Alert",
                    text: message,
                  });
                }
              }}
            >
              Share Alert
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for real-time SOS tracking from receiver's perspective
export function useRealTimeSOSViewer(alertId: string) {
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!alertId) return;

    // In a real implementation, this would subscribe to Firebase real-time updates
    // For now, we simulate the connection
    setIsConnected(true);

    // Cleanup
    return () => {
      setIsConnected(false);
    };
  }, [alertId]);

  return {
    locationUpdates,
    isConnected,
  };
}
