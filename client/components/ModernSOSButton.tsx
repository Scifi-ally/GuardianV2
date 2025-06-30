import { useState, useCallback } from "react";
import { AlertTriangle, Shield, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ModernSOSButtonProps {
  onEmergencyTrigger?: (alertId: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  countdown?: number;
  emergencyContacts?: any[];
}

export function ModernSOSButton({
  onEmergencyTrigger,
  className,
  size = "lg",
  countdown = 3,
  emergencyContacts = [],
}: ModernSOSButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [currentCountdown, setCurrentCountdown] = useState(0);
  const [isTriggering, setIsTriggering] = useState(false);

  const sizeClasses = {
    sm: "h-16 w-16 text-sm",
    md: "h-20 w-20 text-base",
    lg: "h-24 w-24 text-lg",
  };

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const triggerSOS = useCallback(async () => {
    setIsTriggering(true);

    try {
      // Simulate SOS alert
      const alertId = `sos_${Date.now()}`;
      onEmergencyTrigger?.(alertId);

      // Reset after 2 seconds
      setTimeout(() => {
        setIsTriggering(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to send SOS alert:", error);
      setIsTriggering(false);
    }
  }, [onEmergencyTrigger]);

  const handlePress = useCallback(() => {
    if (isPressed || isTriggering) return;

    setIsPressed(true);
    setCurrentCountdown(countdown);

    const countdownInterval = setInterval(() => {
      setCurrentCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsPressed(false);
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isPressed, isTriggering, countdown, triggerSOS]);

  const handleCancel = useCallback(() => {
    setIsPressed(false);
    setCurrentCountdown(0);
  }, []);

  if (isTriggering) {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div
          className={cn(
            "rounded-full bg-red-500 text-white flex items-center justify-center relative",
            sizeClasses[size],
          )}
        >
          <AlertTriangle className={cn("text-white", iconSizes[size])} />
        </div>
        <div className="text-center space-y-2">
          <Badge className="bg-red-500 text-white">SENDING ALERT...</Badge>
          <p className="text-sm text-muted-foreground">
            Notifying emergency contacts
          </p>
        </div>
      </div>
    );
  }

  if (isPressed) {
    const progress = ((countdown - currentCountdown) / countdown) * 100;

    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div className="relative">
          <div
            className={cn(
              "rounded-full bg-orange-500 text-white flex items-center justify-center",
              sizeClasses[size],
            )}
          >
            <div className="text-2xl font-bold">{currentCountdown}</div>
          </div>
          <div className="absolute -inset-2">
            <div className="w-full h-full">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e5e5"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray={`${progress}, 100`}
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <Badge className="bg-orange-500 text-white">COUNTDOWN ACTIVE</Badge>
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            className="border-orange-500 text-orange-500 hover:bg-orange-50"
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
        disabled={isTriggering || !emergencyContacts.length}
        className={cn(
          "rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg border-4 border-white relative transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <AlertTriangle className={iconSizes[size]} />
          <span className="font-bold">SOS</span>
        </div>
      </Button>

      <div className="text-center max-w-xs space-y-2">
        {emergencyContacts.length ? (
          <>
            <p className="text-sm text-muted-foreground">
              Press and hold for {countdown} seconds
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>{emergencyContacts.length} contacts</span>
              </div>
              <div className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                <span>GPS ready</span>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-orange-600">No emergency contacts</p>
            <p className="text-xs text-muted-foreground">
              Add contacts to enable SOS alerts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
