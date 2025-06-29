import { useState } from "react";
import { MapPin, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SimpleBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSOSPress: () => void;
}

export function SimpleBottomNav({
  activeTab,
  onTabChange,
  onSOSPress,
}: SimpleBottomNavProps) {
  const [sosPressed, setSosPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSOSPress = () => {
    if (sosPressed) return;

    setSosPressed(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setSosPressed(false);
          onSOSPress();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelSOS = () => {
    setSosPressed(false);
    setCountdown(0);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-lg border-t border-border/50">
      <div className="container max-w-md mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Map Button */}
          <Button
            onClick={() => onTabChange("map")}
            variant="ghost"
            className={cn(
              "h-16 w-16 rounded-xl flex-col gap-1 transition-colors duration-200",
              activeTab === "map"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
            )}
          >
            <MapPin className="h-5 w-5" />
            <span className="text-xs font-medium">Map</span>
          </Button>

          {/* SOS Button - Center */}
          <div className="flex items-center justify-center">
            {!sosPressed ? (
              <Button
                onClick={handleSOSPress}
                className={cn(
                  "h-20 w-20 rounded-full transition-colors duration-200",
                  "bg-emergency hover:bg-emergency/90 text-emergency-foreground",
                  "shadow-lg border-2 border-white",
                )}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <AlertTriangle className="h-7 w-7" />
                  <span className="text-xs font-bold">SOS</span>
                </div>
              </Button>
            ) : (
              <Button
                onClick={handleCancelSOS}
                className={cn(
                  "h-20 w-20 rounded-full transition-colors duration-200",
                  "bg-warning hover:bg-warning/90 text-warning-foreground",
                  "shadow-lg border-2 border-white",
                )}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="text-xl font-bold">{countdown}</div>
                  <span className="text-xs font-medium">Cancel</span>
                </div>
              </Button>
            )}
          </div>

          {/* Profile Button */}
          <Button
            onClick={() => onTabChange("profile")}
            variant="ghost"
            className={cn(
              "h-16 w-16 rounded-xl flex-col gap-1 transition-colors duration-200",
              activeTab === "profile"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
