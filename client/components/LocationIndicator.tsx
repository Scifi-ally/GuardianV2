import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Navigation,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useNotifications } from "./NotificationSystem";

interface LocationIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function LocationIndicator({
  className,
  compact = false,
}: LocationIndicatorProps) {
  const { location, getCurrentLocation } = useGeolocation();
  const { addNotification } = useNotifications();
  const [locationStatus, setLocationStatus] = useState<
    "unknown" | "requesting" | "granted" | "denied" | "unavailable"
  >("unknown");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (location) {
      setLocationStatus("granted");
    } else {
      // Check location permissions
      checkLocationPermission();
    }
  }, [location]);

  const checkLocationPermission = async () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unavailable");
      return;
    }

    try {
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });

        if (permission.state === "granted") {
          setLocationStatus("granted");
        } else if (permission.state === "denied") {
          setLocationStatus("denied");
        } else {
          setLocationStatus("unknown");
        }
      }
    } catch (error) {
      setLocationStatus("unknown");
    }
  };

  const requestLocation = async () => {
    setLocationStatus("requesting");

    try {
      await getCurrentLocation();
      setLocationStatus("granted");

      addNotification({
        type: "success",
        title: "Location Enabled",
        message: "Your location is now being tracked for safety features",
        duration: 3000,
      });
    } catch (error) {
      setLocationStatus("denied");

      addNotification({
        type: "error",
        title: "Location Access Required",
        message: "Please enable location services in your browser settings",
        action: {
          label: "Help",
          onClick: () => {
            addNotification({
              type: "info",
              title: "How to Enable Location",
              message:
                "1. Click the location icon in your browser's address bar\n2. Select 'Allow'\n3. Refresh the page",
              duration: 10000,
            });
          },
        },
        persistent: true,
      });
    }
  };

  const getLocationIcon = () => {
    switch (locationStatus) {
      case "requesting":
        return <Loader className="w-4 h-4 animate-spin" />;
      case "granted":
        return <MapPin className="w-4 h-4 text-safe" />;
      case "denied":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "unavailable":
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getConnectionIcon = () => {
    return isOnline ? (
      <Wifi className="w-3 h-3 text-safe" />
    ) : (
      <WifiOff className="w-3 h-3 text-destructive" />
    );
  };

  const getLocationText = () => {
    switch (locationStatus) {
      case "requesting":
        return "Getting location...";
      case "granted":
        return location
          ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
          : "Location enabled";
      case "denied":
        return "Location denied";
      case "unavailable":
        return "Location unavailable";
      default:
        return "Location unknown";
    }
  };

  const getAccuracyText = () => {
    if (location?.accuracy) {
      return `±${Math.round(location.accuracy)}m`;
    }
    return "";
  };

  const getStatusColor = () => {
    switch (locationStatus) {
      case "granted":
        return "text-safe";
      case "denied":
      case "unavailable":
        return "text-destructive";
      case "requesting":
        return "text-warning";
      default:
        return "text-muted-foreground";
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex items-center gap-2 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm border",
          className,
        )}
      >
        <div className="flex items-center gap-1">
          {getLocationIcon()}
          {getConnectionIcon()}
        </div>
        {locationStatus === "denied" && (
          <Button
            size="sm"
            variant="outline"
            onClick={requestLocation}
            className="h-5 text-xs px-2"
          >
            Enable
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-background/95 backdrop-blur-md border rounded-lg p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {getLocationIcon()}
            {locationStatus === "granted" && (
              <motion.div
                className="absolute -inset-1 bg-safe/20 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className={cn("text-sm font-medium", getStatusColor())}>
                {locationStatus === "granted"
                  ? "Location Active"
                  : "Location Status"}
              </p>
              <Badge variant="outline" className="text-xs">
                {getConnectionIcon()}
                {isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {getLocationText()}
              {getAccuracyText() && (
                <span className="ml-2 text-safe">{getAccuracyText()}</span>
              )}
            </p>
          </div>
        </div>

        {locationStatus === "denied" && (
          <Button
            size="sm"
            variant="outline"
            onClick={requestLocation}
            className="text-xs"
          >
            <MapPin className="w-3 h-3 mr-1" />
            Enable
          </Button>
        )}

        {locationStatus === "granted" && location && (
          <div className="text-right">
            <Badge className="bg-safe/20 text-safe border-safe/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
        )}
      </div>
    </motion.div>
  );
}
