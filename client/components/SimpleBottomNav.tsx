import { useState, useEffect } from "react";
import {
  Home,
  MapPin,
  User,
  AlertTriangle,
  Shield,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  isSpecial?: boolean;
}

const navItems: NavItem[] = [
  { id: "map", label: "Map", icon: MapPin },
  { id: "sos", label: "SOS", icon: AlertTriangle, isSpecial: true },
  { id: "profile", label: "Profile", icon: User },
];

interface SimpleBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSOSPress: (alertId?: string) => void;
}

export function SimpleBottomNav({
  activeTab,
  onTabChange,
  onSOSPress,
}: SimpleBottomNavProps) {
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
          // Generate alert ID and trigger SOS
          const alertId = `ALERT-${Date.now()}`;
          onSOSPress(alertId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelSOS = () => {
    setSOSPressed(false);
    setCountdown(0);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Minimal Background */}
      <div className="bg-black/80 backdrop-blur-xl border-t border-white/10">
        {/* Compact SOS Button */}
        <div className="relative flex justify-center">
          <div className="absolute -top-8 flex justify-center">
            {sosPressed ? (
              <Button
                onClick={handleCancelSOS}
                className="w-16 h-16 rounded-full bg-warning/90 hover:bg-warning text-warning-foreground shadow-xl border-2 border-white/20 animate-pulse"
              >
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold">{countdown}</div>
                  <span className="text-xs">Cancel</span>
                </div>
              </Button>
            ) : (
              <Button
                onClick={handleSOSPress}
                className="w-16 h-16 rounded-full bg-emergency hover:bg-emergency/90 text-emergency-foreground shadow-xl border-2 border-white/20 transform hover:scale-110 transition-all duration-200"
              >
                <div className="flex flex-col items-center">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-xs font-bold">SOS</span>
                </div>
              </Button>
            )}
          </div>
        </div>

        {/* Compact Navigation Bar */}
        <div className="px-4 pt-12 pb-3">
          <div className="flex items-center justify-around max-w-sm mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isSpecial = item.isSpecial;

              if (isSpecial) {
                // Empty space for SOS button
                return <div key={item.id} className="w-8" />;
              }

              return (
                <Button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  variant="ghost"
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200",
                    isActive
                      ? "text-white bg-white/10"
                      : "text-white/60 hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-all duration-200",
                      isActive && "scale-110",
                    )}
                  />
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <div className="w-1 h-1 bg-white rounded-full" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
