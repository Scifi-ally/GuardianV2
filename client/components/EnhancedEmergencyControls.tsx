import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Phone,
  Shield,
  Heart,
  Flame,
  UserCheck,
  MapPin,
  Clock,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { advancedEmergencyController } from "@/services/advancedEmergencyController";

interface EmergencyControlsProps {
  className?: string;
  onEmergencyActivated?: (type: string) => void;
}

export function EnhancedEmergencyControls({
  className,
  onEmergencyActivated,
}: EmergencyControlsProps) {
  const [emergencyState, setEmergencyState] = useState({
    isSOSActive: false,
    isEmergencyMode: false,
    countdown: 0,
    emergencyType: "general" as "medical" | "fire" | "police" | "general",
    emergencyContacts: 0,
    nearbyServices: 0,
  });

  const [isTestMode, setIsTestMode] = useState(false);

  // Subscribe to emergency state changes
  useEffect(() => {
    const unsubscribe = advancedEmergencyController.subscribe((state) => {
      setEmergencyState({
        isSOSActive: state.isSOSActive,
        isEmergencyMode: state.isEmergencyMode,
        countdown: state.countdown,
        emergencyType: state.emergencyType,
        emergencyContacts: state.emergencyContacts,
        nearbyServices: state.nearbyServices,
      });
    });

    return unsubscribe;
  }, []);

  // Activate specific emergency type
  const activateEmergency = async (
    type: "medical" | "fire" | "police" | "general",
  ) => {
    try {
      await advancedEmergencyController.activateSOSWithCountdown(type, 5);
      onEmergencyActivated?.(type);
    } catch (error) {
      console.error("Failed to activate emergency:", error);
    }
  };

  // Quick emergency (no countdown)
  const quickEmergency = async (
    type: "medical" | "fire" | "police" | "general",
  ) => {
    try {
      await advancedEmergencyController.quickEmergencyActivation(type);
      onEmergencyActivated?.(type);
    } catch (error) {
      console.error("Failed to activate quick emergency:", error);
    }
  };

  // Cancel current emergency
  const cancelEmergency = () => {
    if (emergencyState.isSOSActive) {
      advancedEmergencyController.cancelSOS();
    } else if (emergencyState.isEmergencyMode) {
      advancedEmergencyController.deactivateEmergency();
    }
  };

  // Make direct emergency call
  const makeEmergencyCall = (number: string) => {
    advancedEmergencyController.makeEmergencyCall(number);
  };

  // Test emergency systems
  const testSystems = async () => {
    setIsTestMode(true);
    try {
      await advancedEmergencyController.testEmergencySystems();
    } finally {
      setIsTestMode(false);
    }
  };

  // Get emergency type icon
  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case "medical":
        return Heart;
      case "fire":
        return Flame;
      case "police":
        return Shield;
      default:
        return AlertTriangle;
    }
  };

  // Get emergency type color
  const getEmergencyColor = (type: string) => {
    switch (type) {
      case "medical":
        return "text-red-600";
      case "fire":
        return "text-orange-600";
      case "police":
        return "text-blue-600";
      default:
        return "text-yellow-600";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Active Emergency Status */}
      {(emergencyState.isSOSActive || emergencyState.isEmergencyMode) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Emergency Active
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {emergencyState.isSOSActive && (
              <div className="flex items-center justify-between">
                <span className="text-red-700">
                  Activating in {emergencyState.countdown} seconds...
                </span>
                <Button
                  onClick={cancelEmergency}
                  variant="outline"
                  size="sm"
                  className="border-red-300"
                >
                  Cancel
                </Button>
              </div>
            )}

            {emergencyState.isEmergencyMode && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-700">
                  {(() => {
                    const Icon = getEmergencyIcon(emergencyState.emergencyType);
                    return <Icon className="h-4 w-4" />;
                  })()}
                  <span className="font-medium">
                    {emergencyState.emergencyType.toUpperCase()} Emergency
                    Active
                  </span>
                </div>
                <Button
                  onClick={cancelEmergency}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  Deactivate Emergency
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Emergency Type Buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Emergency Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => activateEmergency("medical")}
              variant="outline"
              className="h-16 flex-col gap-1 border-red-200 hover:bg-red-50"
              disabled={
                emergencyState.isSOSActive || emergencyState.isEmergencyMode
              }
            >
              <Heart className="h-5 w-5 text-red-600" />
              <span className="text-xs">Medical</span>
            </Button>

            <Button
              onClick={() => activateEmergency("fire")}
              variant="outline"
              className="h-16 flex-col gap-1 border-orange-200 hover:bg-orange-50"
              disabled={
                emergencyState.isSOSActive || emergencyState.isEmergencyMode
              }
            >
              <Flame className="h-5 w-5 text-orange-600" />
              <span className="text-xs">Fire</span>
            </Button>

            <Button
              onClick={() => activateEmergency("police")}
              variant="outline"
              className="h-16 flex-col gap-1 border-blue-200 hover:bg-blue-50"
              disabled={
                emergencyState.isSOSActive || emergencyState.isEmergencyMode
              }
            >
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-xs">Police</span>
            </Button>

            <Button
              onClick={() => activateEmergency("general")}
              variant="outline"
              className="h-16 flex-col gap-1 border-gray-200 hover:bg-gray-50"
              disabled={
                emergencyState.isSOSActive || emergencyState.isEmergencyMode
              }
            >
              <AlertTriangle className="h-5 w-5 text-gray-600" />
              <span className="text-xs">General</span>
            </Button>
          </div>

          {/* Quick Emergency Button */}
          <Button
            onClick={() => quickEmergency("general")}
            variant="destructive"
            size="lg"
            className="w-full emergency-pulse"
            disabled={
              emergencyState.isSOSActive || emergencyState.isEmergencyMode
            }
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            IMMEDIATE SOS (No Countdown)
          </Button>
        </CardContent>
      </Card>

      {/* Direct Emergency Calls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Direct Emergency Calls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => makeEmergencyCall("911")}
              variant="outline"
              className="justify-start gap-2"
            >
              <Phone className="h-4 w-4" />
              Call 911 (Emergency)
            </Button>

            <Button
              onClick={() => makeEmergencyCall("112")}
              variant="outline"
              className="justify-start gap-2"
            >
              <Phone className="h-4 w-4" />
              Call 112 (International)
            </Button>

            <Button
              onClick={() => makeEmergencyCall("999")}
              variant="outline"
              className="justify-start gap-2"
            >
              <Phone className="h-4 w-4" />
              Call 999 (UK Emergency)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Emergency Readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">
                  {emergencyState.emergencyContacts}
                </div>
                <div className="text-xs text-muted-foreground">Contacts</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">
                  {emergencyState.nearbyServices}
                </div>
                <div className="text-xs text-muted-foreground">Services</div>
              </div>
            </div>
          </div>

          <Button
            onClick={testSystems}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isTestMode}
          >
            <Clock className="h-4 w-4 mr-2" />
            {isTestMode ? "Testing..." : "Test Emergency Systems"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
