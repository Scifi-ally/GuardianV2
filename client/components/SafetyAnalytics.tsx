import { useState, useEffect } from "react";
import {
  TrendingUp,
  MapPin,
  Activity,
  Clock,
  Shield,
  Zap,
  Route,
  AlertTriangle,
  CheckCircle,
  Navigation,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  smartLocationService,
  LocationPoint,
  ActivityPattern,
} from "@/services/smartLocationService";
import { cn } from "@/lib/utils";

interface SafetyMetrics {
  isTracking: boolean;
  currentLocation: LocationPoint | null;
  currentActivity: ActivityPattern | null;
  safetyScore: number;
  todayStats: {
    distance: number;
    duration: number;
    safeZoneTime: number;
    activitiesCount: number;
  };
  alerts: Array<{
    id: string;
    type: "info" | "warning" | "danger";
    message: string;
    timestamp: Date;
  }>;
}

export function SafetyAnalytics() {
  const [metrics, setMetrics] = useState<SafetyMetrics>({
    isTracking: false,
    currentLocation: null,
    currentActivity: null,
    safetyScore: 85,
    todayStats: {
      distance: 0,
      duration: 0,
      safeZoneTime: 0,
      activitiesCount: 0,
    },
    alerts: [],
  });

  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Subscribe to location service updates
    const unsubscribe = smartLocationService.subscribe((data) => {
      switch (data.type) {
        case "location_update":
          updateLocationMetrics(data.location, data.activity);
          break;
        case "activity_change":
          updateActivityMetrics(data.activity);
          break;
        case "geofence_enter":
          addAlert("info", `Entered safe zone: ${data.geofence.name}`);
          break;
        case "geofence_exit":
          addAlert("warning", `Left safe zone: ${data.geofence.name}`);
          break;
        case "movement_detected":
          if (data.magnitude > 5) {
            addAlert("warning", "Significant movement detected");
          }
          break;
        case "location_error":
          addAlert("danger", `Location error: ${data.error}`);
          break;
      }
    });

    return unsubscribe;
  }, []);

  const updateLocationMetrics = (
    location: LocationPoint,
    activity: ActivityPattern | null,
  ) => {
    setMetrics((prev) => {
      const analytics = smartLocationService.getSafetyAnalytics();

      return {
        ...prev,
        currentLocation: location,
        currentActivity: activity,
        isTracking: true,
        todayStats: {
          distance: analytics.totalDistance,
          duration: Date.now() - (activity?.startTime.getTime() || Date.now()),
          safeZoneTime: analytics.timeInSafeZones,
          activitiesCount: analytics.activitiesDetected.length,
        },
        safetyScore: calculateSafetyScore(analytics, location),
      };
    });
  };

  const updateActivityMetrics = (activity: ActivityPattern) => {
    setMetrics((prev) => ({
      ...prev,
      currentActivity: activity,
    }));
  };

  const addAlert = (type: "info" | "warning" | "danger", message: string) => {
    const newAlert = {
      id: `alert_${Date.now()}`,
      type,
      message,
      timestamp: new Date(),
    };

    setMetrics((prev) => ({
      ...prev,
      alerts: [newAlert, ...prev.alerts.slice(0, 4)], // Keep last 5 alerts
    }));

    // Auto-remove info alerts after 10 seconds
    if (type === "info") {
      setTimeout(() => {
        setMetrics((prev) => ({
          ...prev,
          alerts: prev.alerts.filter((alert) => alert.id !== newAlert.id),
        }));
      }, 10000);
    }
  };

  const calculateSafetyScore = (
    analytics: any,
    location: LocationPoint,
  ): number => {
    let score = 70; // Base score

    // Location accuracy bonus
    if (location.accuracy < 10) score += 10;
    else if (location.accuracy < 50) score += 5;

    // Activity detection bonus
    if (analytics.activitiesDetected.length > 0) score += 5;

    // Safe zone time bonus
    const safeZonePercentage =
      analytics.timeInSafeZones / (analytics.totalDistance / 5 || 1);
    if (safeZonePercentage > 0.5) score += 10;

    // Movement patterns (stable movement is safer)
    if (analytics.averageSpeed > 0 && analytics.averageSpeed < 80) score += 5;

    return Math.min(100, Math.max(0, score));
  };

  const startTracking = async () => {
    setIsInitializing(true);
    const result = await smartLocationService.startTracking({
      enableHighAccuracy: true,
      trackActivity: true,
      geofenceEnabled: true,
    });

    if (result.success) {
      setMetrics((prev) => ({ ...prev, isTracking: true }));
      addAlert("info", "Smart tracking started");
    } else {
      addAlert("danger", result.error || "Failed to start tracking");
    }
    setIsInitializing(false);
  };

  const stopTracking = () => {
    smartLocationService.stopTracking();
    setMetrics((prev) => ({ ...prev, isTracking: false }));
    addAlert("info", "Tracking stopped");
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}min`;
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case "walking":
        return "🚶";
      case "driving":
        return "🚗";
      case "running":
        return "🏃";
      case "stationary":
        return "⏸️";
      default:
        return "❓";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "info":
        return <CheckCircle className="h-4 w-4 text-safe" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "danger":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tracking Control */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-3 rounded-full border-2 transition-all duration-300",
                  metrics.isTracking
                    ? "bg-safe/20 border-safe/30 animate-pulse"
                    : "bg-muted/20 border-muted/30",
                )}
              >
                <Activity
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    metrics.isTracking ? "text-safe" : "text-muted-foreground",
                  )}
                />
              </div>
              <div>
                <h3 className="font-bold">Smart Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  {metrics.isTracking
                    ? "Real-time monitoring active"
                    : "Tracking disabled"}
                </p>
              </div>
            </div>
            <Button
              onClick={metrics.isTracking ? stopTracking : startTracking}
              disabled={isInitializing}
              className={cn(
                "transition-all duration-200",
                metrics.isTracking
                  ? "bg-warning hover:bg-warning/90 text-warning-foreground"
                  : "bg-safe hover:bg-safe/90 text-safe-foreground",
              )}
            >
              {isInitializing
                ? "Starting..."
                : metrics.isTracking
                  ? "Stop"
                  : "Start"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Status */}
      {metrics.isTracking && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-safe/30 bg-safe/5">
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <MapPin className="h-6 w-6 text-safe" />
                <div className="text-lg font-bold text-safe">
                  {metrics.currentLocation
                    ? `±${Math.round(metrics.currentLocation.accuracy)}m`
                    : "Getting GPS..."}
                </div>
                <div className="text-xs text-muted-foreground">
                  Location Accuracy
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                <div className="text-lg font-bold text-primary flex items-center gap-1">
                  <span>
                    {getActivityIcon(
                      metrics.currentActivity?.type || "unknown",
                    )}
                  </span>
                  <span className="capitalize">
                    {metrics.currentActivity?.type || "Unknown"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Current Activity
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Statistics */}
      {metrics.isTracking && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Today's Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Route className="h-4 w-4 text-protection" />
                <div>
                  <div className="font-bold text-protection">
                    {formatDistance(metrics.todayStats.distance)}
                  </div>
                  <div className="text-xs text-muted-foreground">Distance</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-warning" />
                <div>
                  <div className="font-bold text-warning">
                    {formatDuration(metrics.todayStats.duration)}
                  </div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-safe" />
                <div>
                  <div className="font-bold text-safe">
                    {Math.round(metrics.todayStats.safeZoneTime / 60)}min
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Safe Zones
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-bold text-primary">
                    {metrics.todayStats.activitiesCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Activities
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Score */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Safety Score</span>
                <span className="font-bold">{metrics.safetyScore}/100</span>
              </div>
              <Progress value={metrics.safetyScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Alerts */}
      {metrics.alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Live Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    alert.type === "info" && "bg-safe/5 border-safe/20",
                    alert.type === "warning" &&
                      "bg-warning/5 border-warning/20",
                    alert.type === "danger" &&
                      "bg-destructive/5 border-destructive/20",
                  )}
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
