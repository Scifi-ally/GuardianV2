import { useState } from "react";
import { AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmergencyButtonProps {
  onEmergencyTrigger?: () => void;
  className?: string;
}

export function EmergencyButton({
  onEmergencyTrigger,
  className,
}: EmergencyButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleEmergencyPress = () => {
    if (isPressed) return;

    setIsPressed(true);
    setCountdown(10);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsPressed(false);
          onEmergencyTrigger?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    setIsPressed(false);
    setCountdown(0);
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {!isPressed ? (
        <Button
          onClick={handleEmergencyPress}
          size="lg"
          className="h-32 w-32 rounded-full bg-emergency hover:bg-emergency/90 text-emergency-foreground shadow-2xl border-4 border-white relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent group-hover:from-white/30" />
          <div className="flex flex-col items-center gap-2 relative z-10">
            <AlertTriangle className="h-8 w-8" />
            <span className="text-sm font-bold">SOS</span>
          </div>
        </Button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="h-32 w-32 rounded-full bg-warning/20 border-4 border-warning flex items-center justify-center relative">
            <div className="absolute inset-4 border-4 border-warning rounded-full animate-pulse" />
            <div className="text-2xl font-bold text-warning">{countdown}</div>
          </div>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
          >
            Cancel Alert
          </Button>
        </div>
      )}

      <div className="text-center max-w-xs">
        <p className="text-sm text-muted-foreground">
          {!isPressed
            ? "Press and hold for emergency alert"
            : "Alerting emergency contacts..."}
        </p>
      </div>
    </div>
  );
}
