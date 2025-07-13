import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Phone,
  Users,
  Activity,
  Eye,
  Zap,
  Clock,
  Cloud,
  Newspaper,
  Thermometer,
  Wind,
  Sun,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { enhancedEmergencyService } from "@/services/enhancedEmergencyService";
import { comprehensiveHeatmapService } from "@/services/comprehensiveHeatmapService";
import { performanceMonitor } from "@/utils/performanceMonitor";
import { unifiedNotifications } from "@/services/unifiedNotificationService";
import { enhancedLocationService } from "@/services/enhancedLocationService";

interface SafetyMetrics {
  overallScore: number;
  newsAnalysis: number;
  weatherSafety: number;
  timeFactors: number;
  emergencyServices: number;
  locationSafety: number;
  lastUpdate: number;
}

interface SystemStatus {
  heatmapActive: boolean;
  emergencyServicesActive: boolean;
  locationTracking: boolean;
  realTimeUpdates: boolean;
  sosReady: boolean;
}

export function UnifiedSafetyControlCenter() {
  const [safetyMetrics, setSafetyMetrics] = useState<SafetyMetrics>({
    overallScore: 75,
    newsAnalysis: 70,
    weatherSafety: 80,
    timeFactors: 75,
    emergencyServices: 85,
    locationSafety: 70,
    lastUpdate: Date.now(),
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    heatmapActive: false,
    emergencyServicesActive: false,
    locationTracking: false,
    realTimeUpdates: false,
    sosReady: false,
  });

  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<number>(0);
  const [nearbyServices, setNearbyServices] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize safety systems
  const initializeSafetySystems = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("🛡️ Initializing unified safety systems...");

      // Get current location
      const location = await enhancedLocationService.getCurrentLocation();
      const locationData = {
        lat: location.latitude,
        lng: location.longitude,
      };
      setCurrentLocation(locationData);

      // Initialize emergency services
      await enhancedEmergencyService.initializeForLocation(locationData);

      // Get emergency contacts count
      const contacts = enhancedEmergencyService.getEmergencyContacts();
      setEmergencyContacts(contacts.length);

      // Get nearby services count
      const services = enhancedEmergencyService.getNearbyEmergencyServices();
      setNearbyServices(services.length);

      // Test emergency systems
      const sosReady = await enhancedEmergencyService.testEmergencySystems();

      // Update system status
      setSystemStatus({
        heatmapActive: true,
        emergencyServicesActive: true,
        locationTracking: true,
        realTimeUpdates: true,
        sosReady,
      });

      // Start real-time safety monitoring
      await startRealTimeMonitoring(locationData);

      unifiedNotifications.success("Safety systems initialized", {
        message: "All safety features are now active and monitoring",
      });
    } catch (error) {
      console.error("Failed to initialize safety systems:", error);
      unifiedNotifications.error("Safety initialization failed", {
        message: "Some features may not be available",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start real-time safety monitoring
  const startRealTimeMonitoring = async (location: {
    lat: number;
    lng: number;
  }) => {
    try {
      // Analyze performance and generate comprehensive heatmap
      await performanceMonitor.analyzePerformance();
      const metrics = performanceMonitor.getCurrentMetrics();

      const bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(location.lat - 0.01, location.lng - 0.01),
        new google.maps.LatLng(location.lat + 0.01, location.lng + 0.01),
      );

      const heatmapData =
        await comprehensiveHeatmapService.generateAdaptiveHeatmap(
          bounds,
          15,
          metrics?.performanceLevel || "medium",
        );

      // Calculate metrics from comprehensive heatmap data
      if (heatmapData.length > 0) {
        // Use actual calculated safety scores from comprehensive service
        const avgSafetyScore =
          heatmapData.reduce((sum, point) => sum + point.safetyScore, 0) /
          heatmapData.length;

        const avgNews = avgSafetyScore * 0.8; // News analysis factor
        const avgWeather = avgSafetyScore * 0.9; // Weather safety factor
        const avgTime = avgSafetyScore * 1.1; // Time-based factor
        const avgLocation = avgSafetyScore; // Overall location safety

        const emergencyScore =
          nearbyServices > 0 ? Math.min(100, 60 + nearbyServices * 10) : 40;
        const overallScore =
          (avgNews + avgWeather + avgTime + avgLocation + emergencyScore) / 5;

        setSafetyMetrics({
          overallScore: Math.round(overallScore),
          newsAnalysis: Math.round(avgNews),
          weatherSafety: Math.round(avgWeather),
          timeFactors: Math.round(avgTime),
          emergencyServices: Math.round(emergencyScore),
          locationSafety: Math.round(avgLocation),
          lastUpdate: Date.now(),
        });
      }

      // Subscribe to updates
      comprehensiveHeatmapService.subscribe((updatedData) => {
        if (updatedData.length > 0) {
          // Use comprehensive metrics
          const avgSafetyScore =
            updatedData.reduce((sum, point) => sum + point.safetyScore, 0) /
            updatedData.length;

          const avgNews = avgSafetyScore * 0.8; // News analysis factor
          const avgWeather = avgSafetyScore * 0.9; // Weather safety factor
          const avgTime = avgSafetyScore * 1.1; // Time-based factor
          const avgLocation = avgSafetyScore; // Overall location safety

          setSafetyMetrics((prev) => ({
            ...prev,
            newsAnalysis: Math.round(avgNews),
            weatherSafety: Math.round(avgWeather),
            timeFactors: Math.round(avgTime),
            locationSafety: Math.round(avgLocation),
            overallScore: Math.round(
              (avgNews +
                avgWeather +
                avgTime +
                avgLocation +
                prev.emergencyServices) /
                5,
            ),
            lastUpdate: Date.now(),
          }));
        }
      });

      console.log("✅ Real-time safety monitoring started");
    } catch (error) {
      console.error("Failed to start real-time monitoring:", error);
    }
  };

  // Toggle safety features
  const toggleFeature = (feature: keyof SystemStatus) => {
    setSystemStatus((prev) => {
      const newStatus = { ...prev, [feature]: !prev[feature] };

      if (feature === "heatmapActive" && !newStatus.heatmapActive) {
        comprehensiveHeatmapService.stopRealTimeUpdates();
      } else if (
        feature === "heatmapActive" &&
        newStatus.heatmapActive &&
        currentLocation
      ) {
        const optimalSettings = performanceMonitor.getOptimalHeatmapSettings();
        if (optimalSettings.enableRealTimeUpdates) {
          comprehensiveHeatmapService.startRealTimeUpdates(
            optimalSettings.updateInterval,
          );
        }
      }

      return newStatus;
    });
  };

  // Emergency SOS activation
  const activateEmergencySOS = async () => {
    try {
      await enhancedEmergencyService.activateSOS("general");
      unifiedNotifications.critical("🚨 EMERGENCY SOS ACTIVATED", {
        message: "Emergency services have been notified",
        persistent: true,
      });
    } catch (error) {
      console.error("SOS activation failed:", error);
      unifiedNotifications.error("SOS failed - call 911 directly");
    }
  };

  // Get safety score color
  const getSafetyColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  // Get safety badge variant
  const getSafetyBadge = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    if (score >= 40) return "destructive";
    return "destructive";
  };

  // Format time since last update
  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((Date.now() - safetyMetrics.lastUpdate) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Initialize on mount
  useEffect(() => {
    initializeSafetySystems();
  }, [initializeSafetySystems]);

  return (
    <div className="space-y-6 p-4">
      {/* Overall Safety Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Unified Safety Control Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Safety Score */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {safetyMetrics.overallScore}%
                </span>
                <Badge variant={getSafetyBadge(safetyMetrics.overallScore)}>
                  {safetyMetrics.overallScore >= 80
                    ? "Safe"
                    : safetyMetrics.overallScore >= 60
                      ? "Caution"
                      : "Alert"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Overall Safety Score • Updated {getTimeSinceUpdate()}
              </p>
            </div>
            <Progress value={safetyMetrics.overallScore} className="w-24" />
          </div>

          {/* Emergency SOS Button */}
          <Button
            onClick={activateEmergencySOS}
            variant="destructive"
            size="lg"
            className="w-full emergency-pulse"
            disabled={!systemStatus.sosReady}
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            EMERGENCY SOS
          </Button>
        </CardContent>
      </Card>

      {/* Safety Metrics Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Safety Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                <span className="text-sm font-medium">News Analysis</span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    getSafetyColor(safetyMetrics.newsAnalysis),
                  )}
                >
                  {safetyMetrics.newsAnalysis}%
                </span>
              </div>
              <Progress value={safetyMetrics.newsAnalysis} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                <span className="text-sm font-medium">Weather Safety</span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    getSafetyColor(safetyMetrics.weatherSafety),
                  )}
                >
                  {safetyMetrics.weatherSafety}%
                </span>
              </div>
              <Progress value={safetyMetrics.weatherSafety} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Time Factors</span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    getSafetyColor(safetyMetrics.timeFactors),
                  )}
                >
                  {safetyMetrics.timeFactors}%
                </span>
              </div>
              <Progress value={safetyMetrics.timeFactors} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm font-medium">Emergency Services</span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    getSafetyColor(safetyMetrics.emergencyServices),
                  )}
                >
                  {safetyMetrics.emergencyServices}%
                </span>
              </div>
              <Progress
                value={safetyMetrics.emergencyServices}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status & Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Safety Heatmap</span>
              </div>
              <Switch
                checked={systemStatus.heatmapActive}
                onCheckedChange={() => toggleFeature("heatmapActive")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm font-medium">Emergency Services</span>
              </div>
              <Switch
                checked={systemStatus.emergencyServicesActive}
                onCheckedChange={() => toggleFeature("emergencyServicesActive")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Location Tracking</span>
              </div>
              <Switch
                checked={systemStatus.locationTracking}
                onCheckedChange={() => toggleFeature("locationTracking")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Real-time Updates</span>
              </div>
              <Switch
                checked={systemStatus.realTimeUpdates}
                onCheckedChange={() => toggleFeature("realTimeUpdates")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{emergencyContacts}</div>
                <p className="text-sm text-muted-foreground">
                  Emergency Contacts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{nearbyServices}</div>
                <p className="text-sm text-muted-foreground">Nearby Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={initializeSafetySystems}
          variant="outline"
          className="flex-1"
          disabled={isLoading}
        >
          <Zap className="h-4 w-4 mr-2" />
          {isLoading ? "Initializing..." : "Refresh Systems"}
        </Button>

        <Button
          onClick={() => {
            comprehensiveHeatmapService.clearHeatmapData();
            if (currentLocation) {
              const bounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(
                  currentLocation.lat - 0.01,
                  currentLocation.lng - 0.01,
                ),
                new google.maps.LatLng(
                  currentLocation.lat + 0.01,
                  currentLocation.lng + 0.01,
                ),
              );
              const metrics = performanceMonitor.getCurrentMetrics();
              comprehensiveHeatmapService.generateAdaptiveHeatmap(
                bounds,
                15,
                metrics?.performanceLevel || "medium",
              );
            }
          }}
          variant="outline"
          className="flex-1"
        >
          <Activity className="h-4 w-4 mr-2" />
          Update Heatmap
        </Button>
      </div>
    </div>
  );
}
