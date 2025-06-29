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
            <div className="flex items-center justify-center relative">
              {panicMode && (
                <div className="absolute -top-2 -right-2 h-4 w-4 bg-emergency rounded-full animate-pulse border-2 border-white" />
              )}
              {!sosPressed ? (
                <Button
                  onClick={handleSOSPress}
                  className={cn(
                    "h-20 w-20 rounded-full transition-all duration-200",
                    panicMode
                      ? "bg-emergency animate-pulse text-emergency-foreground shadow-lg border-4 border-emergency/50"
                      : "bg-emergency hover:bg-emergency/90 text-emergency-foreground shadow-lg border-2 border-white",
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
    </>
  );
}
