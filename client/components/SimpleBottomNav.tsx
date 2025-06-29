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
      <div className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden">
        {/* Background with blur and gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/98 to-background/90 backdrop-blur-xl" />

        {/* Navigation Content */}
        <div className="relative max-w-sm mx-auto px-4 py-2">
          {/* Tab Indicator */}
          <div className="absolute top-1 left-4 right-4 h-0.5 bg-muted/20 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full transition-all duration-700 ease-in-out shadow-sm",
                activeTab === "map"
                  ? "translate-x-0 w-1/2"
                  : "translate-x-full w-1/2",
              )}
            />
          </div>

          <div className="flex items-end justify-center gap-20 pt-2">
            {/* Map Button */}
            <div className="relative flex flex-col items-center group">
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100",
                  activeTab === "map"
                    ? "bg-primary/20 blur-xl scale-110"
                    : "bg-primary/10 blur-lg scale-105",
                )}
              />
              <Button
                onClick={() => onTabChange("map")}
                variant="ghost"
                className={cn(
                  "relative h-12 w-12 rounded-2xl transition-all duration-500 transform backdrop-blur-sm",
                  "hover:shadow-lg hover:-translate-y-1 active:scale-95",
                  activeTab === "map"
                    ? "bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 text-primary scale-110 shadow-xl border-2 border-primary/30 ring-4 ring-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-105 hover:border-primary/20 border-2 border-transparent",
                )}
              >
                <MapPin
                  className={cn(
                    "transition-all duration-300",
                    activeTab === "map" ? "h-8 w-8" : "h-7 w-7",
                  )}
                />
              </Button>
              <span
                className={cn(
                  "text-xs font-medium mt-1 transition-all duration-300",
                  activeTab === "map"
                    ? "text-primary scale-110"
                    : "text-muted-foreground group-hover:text-primary",
                )}
              >
                Map
              </span>
            </div>

            {/* SOS Button - Center Elevated */}
            <div className="relative flex flex-col items-center -mt-4">
              {panicMode && (
                <div className="absolute -top-2 -right-2 h-4 w-4 bg-emergency rounded-full border-2 border-white shadow-2xl" />
              )}
              <div className="absolute inset-0 rounded-full bg-emergency/20 blur-2xl scale-125 opacity-50" />
              {!sosPressed ? (
                <Button
                  onClick={handleSOSPress}
                  className={cn(
                    "relative h-18 w-18 rounded-full transition-all duration-300 transform",
                    "bg-gradient-to-br from-emergency via-emergency/90 to-emergency/80",
                    "hover:from-emergency/95 hover:via-emergency/85 hover:to-emergency/75",
                    "text-emergency-foreground shadow-2xl border-4 border-white/70",
                    "hover:scale-110 hover:shadow-emergency/25 hover:-translate-y-2",
                    "active:scale-105 active:translate-y-0",
                    panicMode && "ring-4 ring-emergency/30 border-emergency/50",
                  )}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <AlertTriangle className="h-7 w-7 drop-shadow-lg" />
                    <span className="text-xs font-bold drop-shadow-lg">
                      SOS
                    </span>
                  </div>
                </Button>
              ) : (
                <Button
                  onClick={handleCancelSOS}
                  className={cn(
                    "relative h-18 w-18 rounded-full transition-all duration-200",
                    "bg-gradient-to-br from-warning via-warning/90 to-warning/80 text-warning-foreground",
                    "shadow-2xl border-4 border-white/70 ring-4 ring-warning/30",
                  )}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="text-lg font-bold drop-shadow-lg">
                      {countdown}
                    </div>
                    <span className="text-xs font-medium drop-shadow-lg">
                      Cancel
                    </span>
                  </div>
                </Button>
              )}
              <span className="text-xs font-bold mt-2 text-emergency">
                Emergency
              </span>
            </div>

            {/* Profile Button */}
            <div className="relative flex flex-col items-center group">
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100",
                  activeTab === "profile"
                    ? "bg-primary/20 blur-xl scale-110"
                    : "bg-primary/10 blur-lg scale-105",
                )}
              />
              <Button
                onClick={() => onTabChange("profile")}
                variant="ghost"
                className={cn(
                  "relative h-12 w-12 rounded-2xl transition-all duration-500 transform backdrop-blur-sm",
                  "hover:shadow-lg hover:-translate-y-1 active:scale-95",
                  activeTab === "profile"
                    ? "bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 text-primary scale-110 shadow-xl border-2 border-primary/30 ring-4 ring-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-105 hover:border-primary/20 border-2 border-transparent",
                )}
              >
                <User
                  className={cn(
                    "transition-all duration-300",
                    activeTab === "profile" ? "h-8 w-8" : "h-7 w-7",
                  )}
                />
              </Button>
              <span
                className={cn(
                  "text-xs font-medium mt-1 transition-all duration-300",
                  activeTab === "profile"
                    ? "text-primary scale-110"
                    : "text-muted-foreground group-hover:text-primary",
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
