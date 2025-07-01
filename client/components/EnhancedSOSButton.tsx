import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Shield,
  Phone,
  MessageSquare,
  Navigation,
  Camera,
  Clock,
} from "lucide-react";
import { SOSService } from "@/services/sosService";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation, useHapticFeedback } from "@/hooks/use-device-apis";
import { cn } from "@/lib/utils";

interface EnhancedSOSButtonProps {
  onEmergencyTrigger?: (alertId: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  countdown?: number;
}

export function EnhancedSOSButton({
  onEmergencyTrigger,
  className,
  size = "lg",
  countdown = 3,
}: EnhancedSOSButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [currentCountdown, setCurrentCountdown] = useState(0);
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastAlert, setLastAlert] = useState<string | null>(null);
  const { userProfile } = useAuth();
  const { getCurrentLocation } = useGeolocation();
  const { emergencyVibration, successVibration } = useHapticFeedback();

  const sizeClasses = {
    sm: "h-20 w-20 text-sm",
    md: "h-28 w-28 text-base",
    lg: "h-36 w-36 text-lg",
  };

  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const triggerSOS = useCallback(async () => {
    if (!userProfile || isTriggering) return;

    setIsTriggering(true);
    emergencyVibration();

    try {
      // Get current location
      const location = await getCurrentLocation().catch(() => undefined);

      // Send SOS alert
      const result = await SOSService.sendSOSAlert(
        userProfile.uid,
        userProfile.displayName,
        userProfile.guardianKey,
        userProfile.emergencyContacts,
        location,
        "manual",
        `Emergency alert from ${userProfile.displayName}. Immediate assistance needed.`,
      );

      if (result.success && result.alertId) {
        setLastAlert(result.alertId);
        onEmergencyTrigger?.(result.alertId);
        successVibration();
      }
    } catch (error) {
      console.error("Failed to send SOS alert:", error);
    } finally {
      setIsTriggering(false);
      setIsPressed(false);
      setCurrentCountdown(0);
    }
  }, [
    userProfile,
    isTriggering,
    emergencyVibration,
    getCurrentLocation,
    onEmergencyTrigger,
    successVibration,
  ]);

  const handlePress = useCallback(() => {
    if (isPressed || isTriggering) return;

    setIsPressed(true);
    setCurrentCountdown(countdown);

    const countdownInterval = setInterval(() => {
      setCurrentCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Store interval for cleanup
    return () => clearInterval(countdownInterval);
  }, [isPressed, isTriggering, countdown, triggerSOS]);

  const handleCancel = useCallback(() => {
    setIsPressed(false);
    setCurrentCountdown(0);
  }, []);

  const progress = isPressed
    ? ((countdown - currentCountdown) / countdown) * 100
    : 0;

  if (isTriggering) {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div
          className={cn(
            "rounded-full bg-emergency/20 border-4 border-emergency flex items-center justify-center relative",
            sizeClasses[size],
          )}
        >
          <div className="absolute inset-4 border-4 border-emergency rounded-full animate-spin" />
          <AlertTriangle className={cn("text-emergency", iconSizes[size])} />
        </div>
        <div className="text-center space-y-2">
          <Badge className="bg-emergency text-emergency-foreground animate-pulse">
            SENDING ALERT...
          </Badge>
          <p className="text-sm text-muted-foreground">
            Notifying emergency contacts
          </p>
        </div>
      </div>
    );
  }

  if (isPressed) {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div className="relative">
          <div
            className={cn(
              "rounded-full bg-warning/20 border-4 border-warning flex items-center justify-center relative",
              sizeClasses[size],
            )}
          >
            <div className="absolute inset-4 border-4 border-warning rounded-full animate-pulse" />
            <div className="text-3xl font-bold text-warning">
              {currentCountdown}
            </div>
          </div>
          <div className="absolute inset-0 rounded-full">
            <Progress
              value={progress}
              className="h-full rounded-full [&>div]:bg-emergency [&>div]:rounded-full"
            />
          </div>
        </div>
        <div className="text-center space-y-2">
          <Badge className="bg-warning text-warning-foreground">
            COUNTDOWN ACTIVE
          </Badge>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
          >
            Cancel Alert
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Button
        onClick={handlePress}
        disabled={isTriggering || !userProfile?.emergencyContacts.length}
        className={cn(
          "rounded-full bg-emergency hover:bg-emergency/90 text-emergency-foreground shadow-2xl border-4 border-white relative overflow-hidden group transition-all duration-200 hover:scale-105",
          sizeClasses[size],
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent group-hover:from-white/30" />
        <div className="flex flex-col items-center gap-2 relative z-10">
          <AlertTriangle className={iconSizes[size]} />
          <span className="font-bold">SOS</span>
        </div>
      </Button>

      <div className="text-center max-w-xs space-y-2">
        {userProfile?.emergencyContacts.length ? (
          <>
            <p className="text-sm text-muted-foreground">
              Press and hold for {countdown} seconds to send emergency alert
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>{userProfile.emergencyContacts.length} contacts</span>
              </div>
              <div className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                <span>GPS ready</span>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-warning">No emergency contacts added</p>
            <p className="text-xs text-muted-foreground">
              Add contacts to enable SOS alerts
            </p>
          </div>
        )}
      </div>

      {lastAlert && (
        <Card className="w-full max-w-sm border-safe">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1 rounded-full bg-safe/20">
                <Shield className="h-3 w-3 text-safe" />
              </div>
              <span className="text-safe font-medium">
                Alert sent successfully
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your emergency contacts have been notified
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
