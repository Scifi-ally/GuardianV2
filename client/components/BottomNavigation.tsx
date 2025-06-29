import { useState } from "react";
import { MapPin, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  onSOSPress?: () => void;
  onMapPress?: () => void;
  onProfilePress?: () => void;
  className?: string;
}

export function BottomNavigation({
  onSOSPress,
  onMapPress,
  onProfilePress,
  className,
}: BottomNavigationProps) {
  const [isHidden, setIsHidden] = useState(false);
  const [sosPressed, setSOSPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSOSPress = () => {
    if (sosPressed) return;

    setSOSPressed(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setSOSPressed(false);
          onSOSPress?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    setSOSPressed(false);
    setCountdown(0);
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsHidden(!isHidden)}
        className={cn(
          "fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 p-0 shadow-lg transition-all duration-300",
          "bg-muted hover:bg-muted/80 text-foreground",
          isHidden && "bg-primary hover:bg-primary/90 text-primary-foreground",
        )}
        aria-label={isHidden ? "Show navigation" : "Hide navigation"}
      >
        <div
          className={cn(
            "transition-transform duration-300",
            isHidden && "rotate-180",
          )}
        >
          {isHidden ? "+" : "−"}
        </div>
      </Button>

      {/* Bottom Navigation */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 ease-out",
          "bg-background/95 backdrop-blur-lg border-t border-border",
          "transform",
          isHidden ? "translate-y-full opacity-0" : "translate-y-0 opacity-100",
          className,
        )}
      >
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Map Button */}
            <Button
              onClick={onMapPress}
              variant="ghost"
              size="lg"
              className={cn(
                "h-14 w-14 rounded-full transition-all duration-300",
                "hover:scale-110 hover:bg-muted active:scale-95",
                "flex flex-col gap-1",
              )}
              aria-label="Open map"
            >
              <MapPin className="h-6 w-6" />
              <span className="text-xs">Map</span>
            </Button>

            {/* SOS Button - Center */}
            <div className="relative">
              {!sosPressed ? (
                <Button
                  onClick={handleSOSPress}
                  className={cn(
                    "h-20 w-20 rounded-full transition-all duration-300",
                    "bg-emergency hover:bg-emergency/90 text-emergency-foreground",
                    "shadow-2xl hover:shadow-emergency/25 hover:scale-110 active:scale-95",
                    "animate-pulse hover:animate-none",
                    "flex flex-col gap-1",
                  )}
                  aria-label="Emergency SOS"
                >
                  <AlertTriangle className="h-8 w-8" />
                  <span className="text-xs font-bold">SOS</span>
                </Button>
              ) : (
                <div className="relative h-20 w-20">
                  <Button
                    onClick={handleCancel}
                    className={cn(
                      "h-20 w-20 rounded-full",
                      "bg-warning hover:bg-warning/90 text-warning-foreground",
                      "shadow-2xl animate-pulse",
                    )}
                    aria-label={`Cancel SOS - ${countdown} seconds`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-2xl font-bold">{countdown}</div>
                      <span className="text-xs">Cancel</span>
                    </div>
                  </Button>
                  <div className="absolute inset-0 rounded-full border-4 border-warning animate-ping" />
                </div>
              )}
            </div>

            {/* Profile Button */}
            <Button
              onClick={onProfilePress}
              variant="ghost"
              size="lg"
              className={cn(
                "h-14 w-14 rounded-full transition-all duration-300",
                "hover:scale-110 hover:bg-muted active:scale-95",
                "flex flex-col gap-1",
              )}
              aria-label="Open profile"
            >
              <User className="h-6 w-6" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
