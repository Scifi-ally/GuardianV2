import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  MapPin,
  User,
  Settings,
  AlertTriangle,
  Users,
  Navigation as NavigationIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  isSpecial?: boolean;
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "contacts", label: "Contacts", icon: Users, path: "/contacts" },
  { id: "sos", label: "SOS", icon: AlertTriangle, path: "", isSpecial: true },
  {
    id: "navigation",
    label: "Routes",
    icon: NavigationIcon,
    path: "/navigation",
  },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

interface MagicNavbarProps {
  onSOSPress?: () => void;
}

export function MagicNavbar({ onSOSPress }: MagicNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [sosPressed, setSOSPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const currentIndex = navItems.findIndex(
      (item) => item.path === location.pathname,
    );
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  const handleNavClick = (item: NavItem, index: number) => {
    if (item.isSpecial) {
      handleSOSPress();
    } else {
      setActiveIndex(index);
      navigate(item.path);
    }
  };

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

  const handleCancelSOS = () => {
    setSOSPressed(false);
    setCountdown(0);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Background with blur effect */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-lg border-t border-border" />

      {/* Magic floating indicator */}
      <div className="relative">
        <div
          className="absolute top-0 transition-all duration-500 ease-out"
          style={{
            left: `${(activeIndex * 100) / navItems.length}%`,
            width: `${100 / navItems.length}%`,
            transform: "translateY(-2px)",
          }}
        >
          <div className="mx-auto w-12 h-1 bg-primary rounded-full shadow-lg" />
        </div>
      </div>

      {/* Navigation items */}
      <div className="relative px-4 py-3 pb-6">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeIndex === index;
            const isSpecial = item.isSpecial;

            if (isSpecial && sosPressed) {
              return (
                <button
                  key={item.id}
                  onClick={handleCancelSOS}
                  className={cn(
                    "relative flex flex-col items-center p-3 transition-all duration-300",
                    "bg-warning/20 rounded-2xl animate-pulse",
                  )}
                >
                  <div className="absolute inset-0 rounded-2xl border-2 border-warning animate-ping" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="text-2xl font-bold text-warning mb-1">
                      {countdown}
                    </div>
                    <span className="text-xs text-warning font-medium">
                      Cancel
                    </span>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item, index)}
                className={cn(
                  "relative flex flex-col items-center p-3 transition-all duration-300",
                  "hover:scale-110 active:scale-95",
                  isSpecial && "transform hover:scale-125",
                )}
              >
                {/* Background circle for active/special items */}
                <div
                  className={cn(
                    "absolute inset-2 rounded-2xl transition-all duration-300",
                    isActive && !isSpecial && "bg-primary/10 scale-110",
                    isSpecial && "bg-emergency/10 scale-125 animate-pulse",
                  )}
                />

                {/* Icon container */}
                <div
                  className={cn(
                    "relative z-10 p-2 rounded-xl transition-all duration-300",
                    isSpecial &&
                      "bg-emergency text-emergency-foreground shadow-lg",
                    isActive && !isSpecial && "bg-primary/20",
                  )}
                >
                  <Icon
                    className={cn(
                      "transition-all duration-300",
                      isSpecial ? "h-7 w-7" : "h-5 w-5",
                      isActive && !isSpecial
                        ? "text-primary"
                        : "text-foreground",
                      isSpecial && "text-emergency-foreground",
                    )}
                  />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-300 mt-1",
                    isActive && !isSpecial
                      ? "text-primary"
                      : "text-muted-foreground",
                    isSpecial && "text-emergency font-bold",
                  )}
                >
                  {item.label}
                </span>

                {/* Active indicator dot */}
                {isActive && !isSpecial && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  </div>
                )}

                {/* Special item glow effect */}
                {isSpecial && (
                  <div className="absolute inset-0 rounded-2xl bg-emergency/20 animate-pulse opacity-50" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
