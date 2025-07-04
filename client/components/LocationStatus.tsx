import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-device-apis";

interface LocationStatusProps {
  onRetry?: () => void;
  onOpenSettings?: () => void;
  className?: string;
}

export function LocationStatus({
  onRetry,
  onOpenSettings,
  className,
}: LocationStatusProps) {
  const {
    location,
    error,
    isTracking,
    permissionStatus,
    getCurrentLocation,
    requestPermission,
  } = useGeolocation();

  const [isVisible, setIsVisible] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");

  // Update last update time when location changes
  useEffect(() => {
    if (location) {
      setLastUpdateTime(new Date(location.timestamp).toLocaleTimeString());
    }
  }, [location]);

  // Auto-hide success status after 5 seconds
  useEffect(() => {
    if (location && !error) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location, error]);

  // Show component if there's an error or no location yet
  useEffect(() => {
    if (error || !location) {
      setIsVisible(true);
    }
  }, [error, location]);

  const getStatusInfo = () => {
    if (error) {
      return {
        type: "error" as const,
        icon: AlertTriangle,
        title: "Location Error",
        message: error,
        action: "retry",
      };
    }

    if (!location) {
      return {
        type: "loading" as const,
        icon: RefreshCw,
        title: "Getting Location...",
        message: "Please wait while we find your location",
        action: "wait",
      };
    }

    if (location && isTracking) {
      return {
        type: "success" as const,
        icon: CheckCircle,
        title: "Location Found",
        message: `Accuracy: ±${Math.round(location.accuracy)}m • Updated: ${lastUpdateTime}`,
        action: "none",
      };
    }

    return {
      type: "warning" as const,
      icon: MapPin,
      title: "Location Available",
      message: "Location found but tracking is not active",
      action: "enable",
    };
  };

  const handleAction = async () => {
    const status = getStatusInfo();

    switch (status.action) {
      case "retry":
        try {
          await getCurrentLocation();
          if (onRetry) onRetry();
        } catch (err) {
          console.error("Retry failed:", err);
        }
        break;

      case "enable":
        try {
          await requestPermission();
        } catch (err) {
          console.error("Permission request failed:", err);
        }
        break;

      default:
        break;
    }
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
        }}
        className={cn(
          "fixed top-4 left-4 right-4 z-50 pointer-events-auto",
          className,
        )}
      >
        <div
          className={cn(
            "rounded-lg border shadow-lg backdrop-blur-md p-4",
            statusInfo.type === "error" &&
              "bg-destructive/10 border-destructive/20",
            statusInfo.type === "loading" && "bg-primary/10 border-primary/20",
            statusInfo.type === "success" && "bg-safe/10 border-safe/20",
            statusInfo.type === "warning" && "bg-warning/10 border-warning/20",
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={cn(
                  "rounded-full p-2",
                  statusInfo.type === "error" && "bg-destructive/20",
                  statusInfo.type === "loading" && "bg-primary/20",
                  statusInfo.type === "success" && "bg-safe/20",
                  statusInfo.type === "warning" && "bg-warning/20",
                )}
              >
                <IconComponent
                  className={cn(
                    "w-4 h-4",
                    statusInfo.type === "error" && "text-destructive",
                    statusInfo.type === "loading" &&
                      "text-primary animate-spin",
                    statusInfo.type === "success" && "text-safe",
                    statusInfo.type === "warning" && "text-warning",
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold">{statusInfo.title}</h4>
                  {isTracking && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-safe/20 text-safe border-safe/30"
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Tracking
                    </Badge>
                  )}
                  {permissionStatus && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        permissionStatus === "granted" &&
                          "bg-safe/20 text-safe border-safe/30",
                        permissionStatus === "denied" &&
                          "bg-destructive/20 text-destructive border-destructive/30",
                        permissionStatus === "prompt" &&
                          "bg-warning/20 text-warning border-warning/30",
                      )}
                    >
                      {permissionStatus}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  {statusInfo.message}
                </p>

                {location && (
                  <div className="text-xs font-mono text-muted-foreground">
                    {location.latitude.toFixed(6)},{" "}
                    {location.longitude.toFixed(6)}
                  </div>
                )}

                {statusInfo.action !== "none" &&
                  statusInfo.action !== "wait" && (
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAction}
                        className={cn(
                          "h-7 text-xs",
                          statusInfo.type === "error" &&
                            "border-destructive/30 hover:bg-destructive/10",
                          statusInfo.type === "warning" &&
                            "border-warning/30 hover:bg-warning/10",
                        )}
                      >
                        {statusInfo.action === "retry" && (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Try Again
                          </>
                        )}
                        {statusInfo.action === "enable" && (
                          <>
                            <MapPin className="w-3 h-3 mr-1" />
                            Enable Tracking
                          </>
                        )}
                      </Button>

                      {statusInfo.type === "error" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            window.open(
                              "chrome://settings/content/location",
                              "_blank",
                            );
                          }}
                          className="h-7 text-xs"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Settings
                        </Button>
                      )}
                    </div>
                  )}
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0 hover:bg-background/20"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Minimal location indicator for the UI
export function LocationIndicator() {
  const { location, isTracking, error } = useGeolocation();

  if (error) {
    return (
      <div className="flex items-center gap-1 text-destructive">
        <AlertTriangle className="w-3 h-3" />
        <span className="text-xs">Location Error</span>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span className="text-xs">Finding location...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-safe">
      <Navigation className={cn("w-3 h-3", isTracking && "animate-pulse")} />
      <span className="text-xs">±{Math.round(location.accuracy)}m</span>
    </div>
  );
}

export default LocationStatus;
