import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  AlertTriangle,
  Phone,
  Activity,
  Eye,
  Hand,
  MapPin,
  Zap,
  Settings,
  RefreshCw,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { advancedSafeZonesController } from "@/services/advancedSafeZonesController";
import { advancedEmergencyController } from "@/services/advancedEmergencyController";
import { advancedGestureController } from "@/services/advancedGestureController";
import { unifiedNotifications } from "@/services/unifiedNotificationService";

interface SystemState {
  safeZones: {
    isEnabled: boolean;
    isActive: boolean;
    isLoading: boolean;
    pointCount: number;
    coverage: string;
    averageSafety: number;
  };
  emergency: {
    isSOSActive: boolean;
    isEmergencyMode: boolean;
    countdown: number;
    emergencyContacts: number;
    nearbyServices: number;
    isReady: boolean;
  };
  gestures: {
    isEnabled: boolean;
    isActive: boolean;
    hasPermissions: boolean;
    supportedGestures: string[];
    gestureCount: number;
  };
  lastUpdate: number;
}

export function UnifiedControlSystem() {
  const [systemState, setSystemState] = useState<SystemState>({
    safeZones: {
      isEnabled: false,
      isActive: false,
      isLoading: false,
      pointCount: 0,
      coverage: "No coverage",
      averageSafety: 0,
    },
    emergency: {
      isSOSActive: false,
      isEmergencyMode: false,
      countdown: 0,
      emergencyContacts: 0,
      nearbyServices: 0,
      isReady: false,
    },
    gestures: {
      isEnabled: false,
      isActive: false,
      hasPermissions: false,
      supportedGestures: [],
      gestureCount: 0,
    },
    lastUpdate: Date.now(),
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize all systems
  const initializeSystems = async () => {
    setIsLoading(true);
    try {
      console.log("🔧 Initializing Unified Control System...");

      // Initialize gesture controller first (needs permissions)
      await advancedGestureController.initialize();

      // Test emergency systems
      await advancedEmergencyController.testEmergencySystems();

      // Subscribe to all system state changes
      setupSubscriptions();

      setIsInitialized(true);
      unifiedNotifications.success("🔧 All systems initialized", {
        message: "Safe zones, emergency, and gesture controls active",
      });

      console.log("✅ Unified Control System initialized");
    } catch (error) {
      console.error("Failed to initialize systems:", error);
      unifiedNotifications.error("System initialization failed", {
        message: "Some features may not be available",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up subscriptions to all controllers
  const setupSubscriptions = () => {
    // Safe zones subscription
    advancedSafeZonesController.subscribe((safeZonesState) => {
      setSystemState((prev) => ({
        ...prev,
        safeZones: {
          isEnabled: safeZonesState.isEnabled,
          isActive: safeZonesState.isActive,
          isLoading: safeZonesState.isLoading,
          pointCount: safeZonesState.pointCount,
          coverage: safeZonesState.coverage,
          averageSafety: safeZonesState.averageSafety,
        },
        lastUpdate: Date.now(),
      }));
    });

    // Emergency subscription
    advancedEmergencyController.subscribe((emergencyState) => {
      const status = advancedEmergencyController.getEmergencyStatus();
      setSystemState((prev) => ({
        ...prev,
        emergency: {
          isSOSActive: emergencyState.isSOSActive,
          isEmergencyMode: emergencyState.isEmergencyMode,
          countdown: emergencyState.countdown,
          emergencyContacts: emergencyState.emergencyContacts,
          nearbyServices: emergencyState.nearbyServices,
          isReady: status.isReady,
        },
        lastUpdate: Date.now(),
      }));
    });

    // Gesture subscription
    advancedGestureController.subscribe((gestureState) => {
      setSystemState((prev) => ({
        ...prev,
        gestures: {
          isEnabled: gestureState.isEnabled,
          isActive: gestureState.isActive,
          hasPermissions: gestureState.hasPermissions,
          supportedGestures: gestureState.supportedGestures,
          gestureCount: gestureState.gestureCount,
        },
        lastUpdate: Date.now(),
      }));
    });

    console.log("✅ Subscriptions set up");
  };

  // Initialize on mount
  useEffect(() => {
    initializeSystems();

    // Listen for custom events from gesture system
    const handleShowEmergencyControls = () => {
      unifiedNotifications.success("Emergency Controls", {
        message: "Swipe gesture detected",
      });
    };

    const handleToggleSafeZones = () => {
      advancedSafeZonesController.toggleSafeZones(
        !systemState.safeZones.isEnabled,
      );
    };

    document.addEventListener(
      "show-emergency-controls",
      handleShowEmergencyControls,
    );
    document.addEventListener("toggle-safe-zones", handleToggleSafeZones);

    return () => {
      document.removeEventListener(
        "show-emergency-controls",
        handleShowEmergencyControls,
      );
      document.removeEventListener("toggle-safe-zones", handleToggleSafeZones);
      advancedGestureController.cleanup();
    };
  }, []);

  // Toggle safe zones
  const toggleSafeZones = async (enabled: boolean) => {
    await advancedSafeZonesController.toggleSafeZones(enabled);
  };

  // Toggle gestures
  const toggleGestures = async (enabled: boolean) => {
    await advancedGestureController.toggleGestures(enabled);
  };

  // Activate emergency
  const activateEmergency = async (
    type: "medical" | "fire" | "police" | "general" = "general",
  ) => {
    await advancedEmergencyController.activateSOSWithCountdown(type, 5);
  };

  // Cancel emergency
  const cancelEmergency = () => {
    if (systemState.emergency.isSOSActive) {
      advancedEmergencyController.cancelSOS();
    } else if (systemState.emergency.isEmergencyMode) {
      advancedEmergencyController.deactivateEmergency();
    }
  };

  // Test all systems
  const testAllSystems = async () => {
    setIsLoading(true);
    try {
      console.log("🧪 Testing all systems...");

      // Test emergency systems
      const emergencyTest =
        await advancedEmergencyController.testEmergencySystems();

      // Test safe zones
      await advancedSafeZonesController.refreshSafeZones();

      // Test gestures
      const gestureDebug = advancedGestureController.getDebugInfo();

      const allPassed = emergencyTest && gestureDebug.state.isActive;

      unifiedNotifications.success(
        allPassed ? "✅ All tests passed" : "⚠️ Some tests failed",
        {
          message: `Emergency: ${emergencyTest ? "✅" : "❌"} | Gestures: ${gestureDebug.state.isActive ? "✅" : "❌"}`,
        },
      );

      console.log("🧪 System test completed");
    } catch (error) {
      console.error("System test failed:", error);
      unifiedNotifications.error("System test failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Get system status color
  const getStatusColor = (isActive: boolean, isEnabled: boolean) => {
    if (isActive && isEnabled) return "text-green-600";
    if (isEnabled) return "text-yellow-600";
    return "text-gray-600";
  };

  // Get system status badge
  const getStatusBadge = (
    isActive: boolean,
    isEnabled: boolean,
    isLoading?: boolean,
  ) => {
    if (isLoading) return "secondary";
    if (isActive && isEnabled) return "default";
    if (isEnabled) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6 p-4">
      {/* System Status Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Unified Control System
            {!isInitialized && (
              <Badge variant="secondary" className="ml-2">
                Initializing...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Shield
                  className={cn(
                    "h-6 w-6",
                    getStatusColor(
                      systemState.safeZones.isActive,
                      systemState.safeZones.isEnabled,
                    ),
                  )}
                />
              </div>
              <div className="text-sm font-medium">Safe Zones</div>
              <Badge
                variant={getStatusBadge(
                  systemState.safeZones.isActive,
                  systemState.safeZones.isEnabled,
                  systemState.safeZones.isLoading,
                )}
                className="text-xs"
              >
                {systemState.safeZones.isLoading
                  ? "Loading..."
                  : systemState.safeZones.isActive
                    ? "Active"
                    : systemState.safeZones.isEnabled
                      ? "Enabled"
                      : "Disabled"}
              </Badge>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Phone
                  className={cn(
                    "h-6 w-6",
                    systemState.emergency.isSOSActive ||
                      systemState.emergency.isEmergencyMode
                      ? "text-red-600"
                      : systemState.emergency.isReady
                        ? "text-green-600"
                        : "text-yellow-600",
                  )}
                />
              </div>
              <div className="text-sm font-medium">Emergency</div>
              <Badge
                variant={
                  systemState.emergency.isSOSActive ||
                  systemState.emergency.isEmergencyMode
                    ? "destructive"
                    : systemState.emergency.isReady
                      ? "default"
                      : "secondary"
                }
                className="text-xs"
              >
                {systemState.emergency.isSOSActive
                  ? `SOS ${systemState.emergency.countdown}s`
                  : systemState.emergency.isEmergencyMode
                    ? "Active"
                    : systemState.emergency.isReady
                      ? "Ready"
                      : "Setup"}
              </Badge>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Hand
                  className={cn(
                    "h-6 w-6",
                    getStatusColor(
                      systemState.gestures.isActive,
                      systemState.gestures.isEnabled,
                    ),
                  )}
                />
              </div>
              <div className="text-sm font-medium">Gestures</div>
              <Badge
                variant={getStatusBadge(
                  systemState.gestures.isActive,
                  systemState.gestures.isEnabled,
                )}
                className="text-xs"
              >
                {systemState.gestures.isActive
                  ? `${systemState.gestures.supportedGestures.length} types`
                  : systemState.gestures.isEnabled
                    ? "Enabled"
                    : "Disabled"}
              </Badge>
            </div>
          </div>

          {/* Emergency SOS Button */}
          {systemState.emergency.isSOSActive ||
          systemState.emergency.isEmergencyMode ? (
            <Button
              onClick={cancelEmergency}
              variant="destructive"
              size="lg"
              className="w-full"
            >
              <XCircle className="h-5 w-5 mr-2" />
              {systemState.emergency.isSOSActive
                ? `CANCEL SOS (${systemState.emergency.countdown}s)`
                : "DEACTIVATE EMERGENCY"}
            </Button>
          ) : (
            <Button
              onClick={() => activateEmergency("general")}
              variant="destructive"
              size="lg"
              className="w-full emergency-pulse"
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              EMERGENCY SOS
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Detailed Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">System Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Safe Zones Control */}
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5" />
              <div>
                <div className="font-medium">Safe Zones</div>
                <div className="text-sm text-muted-foreground">
                  {systemState.safeZones.isActive
                    ? `${systemState.safeZones.pointCount} points | ${systemState.safeZones.coverage}`
                    : "Real-time safety heatmap"}
                </div>
              </div>
            </div>
            <Switch
              checked={systemState.safeZones.isEnabled}
              onCheckedChange={toggleSafeZones}
              disabled={systemState.safeZones.isLoading}
            />
          </div>

          {/* Gesture Control */}
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded">
            <div className="flex items-center gap-3">
              <Hand className="h-5 w-5" />
              <div>
                <div className="font-medium">Gesture Controls</div>
                <div className="text-sm text-muted-foreground">
                  {systemState.gestures.isActive
                    ? `${systemState.gestures.gestureCount} gestures detected`
                    : systemState.gestures.hasPermissions
                      ? "Motion permissions granted"
                      : "Requires permissions"}
                </div>
              </div>
            </div>
            <Switch
              checked={systemState.gestures.isEnabled}
              onCheckedChange={toggleGestures}
            />
          </div>

          {/* Emergency Status */}
          <div className="p-3 bg-muted/20 rounded">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="h-5 w-5" />
              <div className="font-medium">Emergency Status</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Contacts: {systemState.emergency.emergencyContacts}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Services: {systemState.emergency.nearbyServices}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={testAllSystems}
          variant="outline"
          className="flex-1"
          disabled={isLoading}
        >
          <TestTube className="h-4 w-4 mr-2" />
          {isLoading ? "Testing..." : "Test Systems"}
        </Button>

        <Button
          onClick={initializeSystems}
          variant="outline"
          className="flex-1"
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {isLoading ? "Initializing..." : "Refresh"}
        </Button>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span>
                {new Date(systemState.lastUpdate).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Safe Zones Average:</span>
              <span>{systemState.safeZones.averageSafety}%</span>
            </div>
            <div className="flex justify-between">
              <span>Supported Gestures:</span>
              <span>{systemState.gestures.supportedGestures.length}</span>
            </div>
            <div className="flex justify-between">
              <span>System Status:</span>
              <Badge
                variant={
                  isInitialized && systemState.emergency.isReady
                    ? "default"
                    : "secondary"
                }
              >
                {isInitialized ? "Operational" : "Initializing"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
