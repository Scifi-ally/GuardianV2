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
      {/* Background with proper spacing */}
      <div className="bg-background/95 backdrop-blur-lg border-t border-border shadow-2xl">
        {/* SOS Button Container - positioned above the nav bar */}
        <div className="relative flex justify-center">
          <div className="absolute -top-12 flex justify-center">
            {sosPressed ? (
              <Button
                onClick={handleCancelSOS}
                className="w-24 h-24 rounded-full bg-warning/90 hover:bg-warning text-warning-foreground shadow-2xl border-4 border-background animate-pulse"
              >
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold">{countdown}</div>
                  <span className="text-xs font-medium">Cancel</span>
                </div>
              </Button>
            ) : (
              <Button
                onClick={handleSOSPress}
                className="w-24 h-24 rounded-full bg-emergency hover:bg-emergency/90 text-emergency-foreground shadow-2xl border-4 border-background transform hover:scale-105 transition-all duration-200"
              >
                <div className="flex flex-col items-center gap-1">
                  <AlertTriangle className="h-8 w-8" />
                  <span className="text-xs font-bold">SOS</span>
                </div>
              </Button>
            )}
          </div>
        </div>

        {/* Navigation Bar with proper padding */}
        <div className="px-6 pt-16 pb-6">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isSpecial = item.isSpecial;

              if (isSpecial) {
                // Empty space for SOS button
                return <div key={item.id} className="w-16" />;
              }

              return (
                <Button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  variant="ghost"
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 hover:scale-105",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-xl transition-all duration-300",
                      isActive && "bg-primary/20 scale-110",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && (
                    <div className="w-1 h-1 bg-primary rounded-full" />
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
