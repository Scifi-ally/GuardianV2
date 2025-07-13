import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  MapPin,
  Users,
  Wifi,
  WifiOff,
  Battery,
  Zap,
  Clock,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { enhancedFirebaseService } from "@/services/enhancedFirebaseService";
import { safeAIService } from "@/services/safeAIService";
import { voiceCommandService } from "@/services/voiceCommandService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SafetyStatus {
  level: "safe" | "caution" | "warning" | "danger";
  score: number;
  factors: {
    location: boolean;
    connectivity: boolean;
    emergency: boolean;
    battery: number;
    time: "safe" | "moderate" | "risk";
  };
  lastUpdate: Date;
}

interface ServiceStatus {
  location: {
    active: boolean;
    accuracy?: number;
    lastUpdate?: Date;
  };
  firebase: {
    connected: boolean;
    synced: boolean;
  };
  ai: {
    available: boolean;
    lastAnalysis?: Date;
  };
  voice: {
    enabled: boolean;
    listening: boolean;
  };
  emergency: {
    contactsCount: number;
    alertsActive: number;
  };
}

export function RealTimeSafetyStatus() {
  const { currentUser, userProfile, isOnline } = useAuth();
  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(
    null,
  );
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    updateStatus();
    const interval = setInterval(updateStatus, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [currentUser, userProfile, isOnline]);

  const updateStatus = async () => {
    try {
      // Get current location
      const location = enhancedLocationService.current;

      // Get battery level
      const battery = await getBatteryLevel();
      setBatteryLevel(battery);

      // Calculate time-based risk
      const timeRisk = getTimeRisk();

      // Update service status
      const services: ServiceStatus = {
        location: {
          active: enhancedLocationService.isActive,
          accuracy: location?.accuracy,
          lastUpdate: location?.timestamp,
        },
        firebase: {
          connected: enhancedFirebaseService.isConnected,
          synced: isOnline,
        },
        ai: {
          available: safeAIService.isAvailable(),
        },
        voice: {
          enabled: voiceCommandService.currentSettings.enabled,
          listening: voiceCommandService.isActive,
        },
        emergency: {
          contactsCount: userProfile?.emergencyContacts?.length || 0,
          alertsActive: enhancedFirebaseService.activeEmergencyAlerts.length,
        },
      };

      setServiceStatus(services);

      // Calculate overall safety status
      const safety = calculateSafetyStatus(services, battery, timeRisk);
      setSafetyStatus(safety);
    } catch (error) {
      console.error("Failed to update safety status:", error);
    }
  };

  const getBatteryLevel = async (): Promise<number | null> => {
    try {
      if ("getBattery" in navigator) {
        const battery = await (navigator as any).getBattery();
        return battery.level * 100;
      }
    } catch (error) {
      // Battery API not available
    }
    return null;
  };

  const getTimeRisk = (): "safe" | "moderate" | "risk" => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 18) return "safe"; // Daytime
    if (hour >= 19 && hour <= 22) return "moderate"; // Evening
    return "risk"; // Night
  };

  const calculateSafetyStatus = (
    services: ServiceStatus,
    battery: number | null,
    timeRisk: "safe" | "moderate" | "risk",
  ): SafetyStatus => {
    let score = 100;
    let level: SafetyStatus["level"] = "safe";

    // Location factor
    if (!services.location.active) {
      score -= 25;
      level = "warning";
    } else if (services.location.accuracy && services.location.accuracy > 50) {
      score -= 10;
      if (level === "safe") level = "caution";
    }

    // Connectivity factor
    if (!services.firebase.connected) {
      score -= 20;
      if (level === "safe") level = "caution";
    }

    // Emergency preparedness factor
    if (services.emergency.contactsCount === 0) {
      score -= 30;
      level = "warning";
    } else if (services.emergency.contactsCount < 2) {
      score -= 10;
      if (level === "safe") level = "caution";
    }

    // Battery factor
    if (battery !== null) {
      if (battery < 10) {
        score -= 25;
        level = "danger";
      } else if (battery < 20) {
        score -= 15;
        if (level === "safe" || level === "caution") level = "warning";
      } else if (battery < 50) {
        score -= 5;
        if (level === "safe") level = "caution";
      }
    }

    // Time factor
    if (timeRisk === "risk") {
      score -= 15;
      if (level === "safe") level = "caution";
    } else if (timeRisk === "moderate") {
      score -= 5;
    }

    // Active emergency alerts
    if (services.emergency.alertsActive > 0) {
      level = "danger";
      score = Math.min(score, 30);
    }

    score = Math.max(0, score);

    return {
      level,
      score,
      factors: {
        location: services.location.active,
        connectivity: services.firebase.connected,
        emergency: services.emergency.contactsCount > 0,
        battery: battery || 0,
        time: timeRisk,
      },
      lastUpdate: new Date(),
    };
  };

  const getSafetyIcon = (level: SafetyStatus["level"]) => {
    switch (level) {
      case "safe":
        return <ShieldCheck className="h-5 w-5 text-green-600" />;
      case "caution":
        return <Shield className="h-5 w-5 text-yellow-600" />;
      case "warning":
        return <ShieldAlert className="h-5 w-5 text-orange-600" />;
      case "danger":
        return <ShieldX className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSafetyColor = (level: SafetyStatus["level"]) => {
    switch (level) {
      case "safe":
        return "text-green-600";
      case "caution":
        return "text-yellow-600";
      case "warning":
        return "text-orange-600";
      case "danger":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getProgressColor = (level: SafetyStatus["level"]) => {
    switch (level) {
      case "safe":
        return "bg-green-600";
      case "caution":
        return "bg-yellow-600";
      case "warning":
        return "bg-orange-600";
      case "danger":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  if (!currentUser || !safetyStatus || !serviceStatus) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-gray-400" />
            <div>
              <div className="font-medium text-sm">Safety Status</div>
              <div className="text-xs text-muted-foreground">
                {currentUser ? "Loading..." : "Sign in to view status"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Main Status */}
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={
                  safetyStatus.level === "danger"
                    ? { scale: [1, 1.1, 1] }
                    : { scale: 1 }
                }
                transition={{
                  duration: 1,
                  repeat:
                    safetyStatus.level === "danger" ? Infinity : undefined,
                }}
              >
                {getSafetyIcon(safetyStatus.level)}
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Safety Status</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      getSafetyColor(safetyStatus.level),
                    )}
                  >
                    {safetyStatus.level.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Score: {safetyStatus.score}/100
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">
                {safetyStatus.lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress value={safetyStatus.score} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Risk</span>
              <span>Safe</span>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 border-t pt-3"
            >
              {/* Service Status Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>Location</span>
                  <Badge
                    variant={
                      serviceStatus.location.active ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {serviceStatus.location.active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {serviceStatus.firebase.connected ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <span>Network</span>
                  <Badge
                    variant={
                      serviceStatus.firebase.connected
                        ? "default"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {serviceStatus.firebase.connected ? "Online" : "Offline"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  <span>Contacts</span>
                  <Badge variant="outline" className="text-xs">
                    {serviceStatus.emergency.contactsCount}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Battery className="h-3 w-3" />
                  <span>Battery</span>
                  <Badge
                    variant={
                      batteryLevel !== null && batteryLevel > 20
                        ? "outline"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {batteryLevel?.toFixed(0) || "Unknown"}%
                  </Badge>
                </div>
              </div>

              {/* AI & Voice Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="h-3 w-3" />
                    <span>AI Analysis</span>
                  </div>
                  <Badge
                    variant={
                      serviceStatus.ai.available ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {serviceStatus.ai.available ? "Available" : "Offline"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Activity className="h-3 w-3" />
                    <span>Voice Commands</span>
                  </div>
                  <div className="flex gap-1">
                    <Badge
                      variant={
                        serviceStatus.voice.enabled ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {serviceStatus.voice.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    {serviceStatus.voice.listening && (
                      <Badge variant="outline" className="text-xs">
                        Listening
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Time-based Risk */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>Time Risk</span>
                </div>
                <Badge
                  variant={
                    safetyStatus.factors.time === "safe"
                      ? "default"
                      : safetyStatus.factors.time === "moderate"
                        ? "outline"
                        : "destructive"
                  }
                  className="text-xs"
                >
                  {safetyStatus.factors.time.toUpperCase()}
                </Badge>
              </div>

              {/* Active Alerts */}
              {serviceStatus.emergency.alertsActive > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <div className="flex items-center gap-2 text-red-700">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      {serviceStatus.emergency.alertsActive} Active Emergency
                      Alert{serviceStatus.emergency.alertsActive > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RealTimeSafetyStatus;
