import { useState, useCallback, useEffect } from "react";
import {
  MapPin,
  User,
  AlertTriangle,
  Phone,
  Shield,
  Camera,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [panicMode, setPanicMode] = useState(false);
  const [panicTimer, setPanicTimer] = useState<NodeJS.Timeout | null>(null);

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
          activatePanicMode();
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

  const activatePanicMode = useCallback(() => {
    setPanicMode(true);
    // Auto-deactivate panic mode after 5 minutes
    const timer = setTimeout(
      () => {
        setPanicMode(false);
      },
      5 * 60 * 1000,
    );
    setPanicTimer(timer);
  }, []);

  const deactivatePanicMode = useCallback(() => {
    setPanicMode(false);
    if (panicTimer) {
      clearTimeout(panicTimer);
      setPanicTimer(null);
    }
  }, [panicTimer]);

  useEffect(() => {
    return () => {
      if (panicTimer) {
        clearTimeout(panicTimer);
      }
    };
  }, [panicTimer]);

  return (
    <>
      {/* Panic Mode Overlay */}
      {panicMode && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <Card className="border-emergency bg-emergency/5 backdrop-blur-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-emergency/20">
                    <AlertTriangle className="h-4 w-4 text-emergency animate-pulse" />
                  </div>
                  <Badge className="bg-emergency text-emergency-foreground text-xs">
                    PANIC MODE ACTIVE
                  </Badge>
                </div>
                <Button
                  onClick={deactivatePanicMode}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs hover:bg-emergency/10"
                >
                  Deactivate
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Button
                  onClick={() => (window.location.href = "tel:911")}
                  size="sm"
                  className="h-12 flex-col gap-1 text-xs bg-emergency hover:bg-emergency/90"
                >
                  <Phone className="h-4 w-4" />
                  911
                </Button>
                <Button
                  onClick={() => {
                    /* Add silent alert functionality */
                  }}
                  size="sm"
                  variant="outline"
                  className="h-12 flex-col gap-1 text-xs border-warning hover:bg-warning/10"
                >
                  <MessageSquare className="h-4 w-4" />
                  Alert
                </Button>
                <Button
                  onClick={() => {
                    /* Add camera functionality */
                  }}
                  size="sm"
                  variant="outline"
                  className="h-12 flex-col gap-1 text-xs border-primary hover:bg-primary/10"
                >
                  <Camera className="h-4 w-4" />
                  Record
                </Button>
                <Button
                  onClick={() => {
                    /* Add safe mode functionality */
                  }}
                  size="sm"
                  variant="outline"
                  className="h-12 flex-col gap-1 text-xs border-safe hover:bg-safe/10"
                >
                  <Shield className="h-4 w-4" />
                  Safe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Background with blur and gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-xl border-t border-border/30" />

        {/* Navigation Content */}
        <div className="relative container max-w-md mx-auto px-4 py-3">
          {/* Tab Indicator */}
          <div className="absolute top-2 left-4 right-4 h-1 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out",
                activeTab === "map"
                  ? "translate-x-0 w-1/2"
                  : "translate-x-full w-1/2",
              )}
            />
          </div>

          <div className="flex items-end justify-between pt-2">
            {/* Map Button */}
            <div className="flex flex-col items-center">
              <Button
                onClick={() => onTabChange("map")}
                variant="ghost"
                className={cn(
                  "h-14 w-14 rounded-2xl flex-col gap-1 transition-all duration-300 transform",
                  activeTab === "map"
                    ? "bg-primary/15 text-primary scale-110 shadow-lg border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105",
                )}
              >
                <MapPin
                  className={cn(
                    "transition-all duration-200",
                    activeTab === "map" ? "h-6 w-6" : "h-5 w-5",
                  )}
                />
              </Button>
              <span
                className={cn(
                  "text-xs font-medium mt-1 transition-all duration-200",
                  activeTab === "map"
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                Map
              </span>
            </div>

            {/* SOS Button - Center Elevated */}
            <div className="flex flex-col items-center relative -mt-4">
              {panicMode && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-emergency rounded-full animate-pulse border-2 border-white shadow-lg" />
              )}
              {!sosPressed ? (
                <Button
                  onClick={handleSOSPress}
                  className={cn(
                    "h-20 w-20 rounded-full transition-all duration-300 transform hover:scale-105",
                    panicMode
                      ? "bg-emergency animate-pulse text-emergency-foreground shadow-xl border-4 border-emergency/30 ring-4 ring-emergency/20"
                      : "bg-gradient-to-br from-emergency to-emergency/80 hover:from-emergency/90 hover:to-emergency/70 text-emergency-foreground shadow-xl border-3 border-white/50",
                  )}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <AlertTriangle className="h-7 w-7 drop-shadow-sm" />
                    <span className="text-xs font-bold drop-shadow-sm">
                      SOS
                    </span>
                  </div>
                </Button>
              ) : (
                <Button
                  onClick={handleCancelSOS}
                  className={cn(
                    "h-20 w-20 rounded-full transition-all duration-200 transform",
                    "bg-gradient-to-br from-warning to-warning/80 text-warning-foreground",
                    "shadow-xl border-3 border-white/50 animate-pulse",
                  )}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="text-xl font-bold drop-shadow-sm">
                      {countdown}
                    </div>
                    <span className="text-xs font-medium drop-shadow-sm">
                      Cancel
                    </span>
                  </div>
                </Button>
              )}
              <span className="text-xs font-medium mt-2 text-emergency">
                Emergency
              </span>
            </div>

            {/* Profile Button */}
            <div className="flex flex-col items-center">
              <Button
                onClick={() => onTabChange("profile")}
                variant="ghost"
                className={cn(
                  "h-14 w-14 rounded-2xl flex-col gap-1 transition-all duration-300 transform",
                  activeTab === "profile"
                    ? "bg-primary/15 text-primary scale-110 shadow-lg border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/20 hover:scale-105",
                )}
              >
                <User
                  className={cn(
                    "transition-all duration-200",
                    activeTab === "profile" ? "h-6 w-6" : "h-5 w-5",
                  )}
                />
              </Button>
              <span
                className={cn(
                  "text-xs font-medium mt-1 transition-all duration-200",
                  activeTab === "profile"
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                Profile
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
