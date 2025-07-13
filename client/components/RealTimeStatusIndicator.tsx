/**
 * Real-Time Status Indicator
 * Professional component showing connection status and real-time data updates
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  WifiOff,
  Activity,
  MapPin,
  Users,
  AlertTriangle,
  Timer,
  Signal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useRealTime } from "@/hooks/useRealTime";
import { cn } from "@/lib/utils";

interface RealTimeStatusIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function RealTimeStatusIndicator({
  className,
  compact = false,
}: RealTimeStatusIndicatorProps) {
  const {
    location,
    isLocationTracking,
    stats,
    traffic,
    connectionState: rawConnectionState,
    contacts,
  } = useRealTime();

  // Safety check for connection state
  const connectionState =
    typeof rawConnectionState === "string"
      ? rawConnectionState
      : "disconnected";

  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Update timestamp when data changes
  useEffect(() => {
    setLastUpdateTime(new Date());
  }, [location, stats, traffic]);

  const getConnectionIcon = () => {
    switch (connectionState) {
      case "connected":
        return <Wifi className="h-3 w-3 text-green-500" />;
      case "reconnecting":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Signal className="h-3 w-3 text-yellow-500" />
          </motion.div>
        );
      default:
        return <WifiOff className="h-3 w-3 text-red-500" />;
    }
  };

  const getConnectionColor = () => {
    switch (connectionState) {
      case "connected":
        return "bg-green-500";
      case "reconnecting":
        return "bg-yellow-500";
      default:
        return "bg-red-500";
    }
  };

  const getLocationAccuracy = () => {
    if (!location) return "Unknown";
    if (location.accuracy <= 5) return "High";
    if (location.accuracy <= 20) return "Good";
    if (location.accuracy <= 50) return "Fair";
    return "Low";
  };

  const getTrafficColor = () => {
    if (!traffic) return "text-gray-500";
    switch (traffic.congestionLevel) {
      case "low":
        return "text-green-500";
      case "moderate":
        return "text-yellow-500";
      case "high":
        return "text-orange-500";
      case "severe":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  if (compact) {
    return (
      <motion.div
        className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2",
          className,
        )}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Connection Status */}
        <Badge
          variant="outline"
          className={cn(
            "flex items-center gap-1 bg-white/90 backdrop-blur-sm",
            connectionState === "connected"
              ? "border-green-200 text-green-700"
              : connectionState === "reconnecting"
                ? "border-yellow-200 text-yellow-700"
                : "border-red-200 text-red-700",
          )}
        >
          {getConnectionIcon()}
          <span className="text-xs font-medium">
            {connectionState === "connected" ? "Live" : "Offline"}
          </span>
        </Badge>

        {/* Location Status */}
        {isLocationTracking && location && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border-blue-200 text-blue-700"
          >
            <MapPin className="h-3 w-3" />
            <span className="text-xs font-medium">
              ±{Math.round(location.accuracy)}m
            </span>
          </Badge>
        )}

        {/* Safety Score */}
        {stats && (
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1 bg-white/90 backdrop-blur-sm",
              stats.safetyScore >= 80
                ? "border-green-200 text-green-700"
                : stats.safetyScore >= 60
                  ? "border-yellow-200 text-yellow-700"
                  : "border-red-200 text-red-700",
            )}
          >
            <Activity className="h-3 w-3" />
            <span className="text-xs font-medium">{stats.safetyScore}%</span>
          </Badge>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("w-full max-w-md", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  getConnectionColor(),
                  connectionState === "reconnecting" && "animate-pulse",
                )}
              />
              <span className="text-sm font-medium text-gray-900">
                Real-Time Status
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {new Date(lastUpdateTime).toLocaleTimeString()}
            </Badge>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Connection */}
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <div>
                <div className="font-medium text-gray-900">Connection</div>
                <div className="text-xs text-gray-600 capitalize">
                  {connectionState}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin
                className={cn(
                  "h-3 w-3",
                  isLocationTracking ? "text-blue-500" : "text-gray-400",
                )}
              />
              <div>
                <div className="font-medium text-gray-900">Location</div>
                <div className="text-xs text-gray-600">
                  {isLocationTracking ? getLocationAccuracy() : "Disabled"}
                </div>
              </div>
            </div>

            {/* Safety Score */}
            {stats && (
              <div className="flex items-center gap-2">
                <Activity
                  className={cn(
                    "h-3 w-3",
                    stats.safetyScore >= 80
                      ? "text-green-500"
                      : stats.safetyScore >= 60
                        ? "text-yellow-500"
                        : "text-red-500",
                  )}
                />
                <div>
                  <div className="font-medium text-gray-900">Safety</div>
                  <div className="text-xs text-gray-600">
                    {stats.safetyScore}% Score
                  </div>
                </div>
              </div>
            )}

            {/* Traffic */}
            {traffic && (
              <div className="flex items-center gap-2">
                <Timer className={cn("h-3 w-3", getTrafficColor())} />
                <div>
                  <div className="font-medium text-gray-900">Traffic</div>
                  <div className="text-xs text-gray-600 capitalize">
                    {traffic.congestionLevel}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {stats && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{stats.emergencyContactsOnline} contacts online</span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  <span>
                    Updated{" "}
                    {Math.round((Date.now() - stats.lastLocationUpdate) / 1000)}
                    s ago
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
