import { useState, useCallback } from "react";
import {
  MapPin,
  User,
  AlertTriangle,
  Phone,
  Camera,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModernBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSOSPress: () => void;
}

export function ModernBottomNav({
  activeTab,
  onTabChange,
  onSOSPress,
}: ModernBottomNavProps) {
  const [sosPressed, setSosPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSOSPress = useCallback(() => {
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
  }, [sosPressed, onSOSPress]);

  const handleCancelSOS = useCallback(() => {
    setSosPressed(false);
    setCountdown(0);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-4 py-2 max-w-lg mx-auto">
        {/* Map Tab */}
        <button
          onClick={() => onTabChange("map")}
          className={cn(
            "flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200",
            "min-w-0 flex-1 max-w-[80px]", // Prevent overflow
            activeTab === "map"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
          )}
        >
          <MapPin className="h-6 w-6 mb-1 flex-shrink-0" />
          <span className="text-xs font-medium truncate">Map</span>
        </button>

        {/* SOS Button */}
        <div className="flex flex-col items-center px-2">
          {!sosPressed ? (
            <button
              onClick={handleSOSPress}
              className={cn(
                "flex flex-col items-center justify-center",
                "h-14 w-14 rounded-full",
                "bg-red-500 text-white",
                "shadow-lg border-2 border-white",
                "transition-transform duration-200",
                "hover:scale-105 active:scale-95",
                "focus:outline-none focus:ring-4 focus:ring-red-200",
              )}
            >
              <AlertTriangle className="h-6 w-6 mb-0.5" />
              <span className="text-xs font-bold">SOS</span>
            </button>
          ) : (
            <button
              onClick={handleCancelSOS}
              className={cn(
                "flex flex-col items-center justify-center",
                "h-14 w-14 rounded-full",
                "bg-orange-500 text-white",
                "shadow-lg border-2 border-white",
                "focus:outline-none focus:ring-4 focus:ring-orange-200",
              )}
            >
              <span className="text-lg font-bold">{countdown}</span>
              <span className="text-xs font-medium">Cancel</span>
            </button>
          )}
          <span className="text-xs font-medium text-gray-600 mt-1">
            Emergency
          </span>
        </div>

        {/* Profile Tab */}
        <button
          onClick={() => onTabChange("profile")}
          className={cn(
            "flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200",
            "min-w-0 flex-1 max-w-[80px]", // Prevent overflow
            activeTab === "profile"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
          )}
        >
          <User className="h-6 w-6 mb-1 flex-shrink-0" />
          <span className="text-xs font-medium truncate">Profile</span>
        </button>
      </div>

      {/* Emergency Actions */}
      {sosPressed && (
        <div className="absolute bottom-full left-0 right-0 bg-white border-t border-red-200 shadow-lg">
          <div className="flex items-center justify-around px-4 py-3 max-w-lg mx-auto">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 mx-1 text-xs h-8"
              onClick={() => (window.location.href = "tel:911")}
            >
              <Phone className="h-3 w-3 mr-1" />
              Call 911
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 mx-1 text-xs h-8"
            >
              <Camera className="h-3 w-3 mr-1" />
              Record
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 mx-1 text-xs h-8"
            >
              <Shield className="h-3 w-3 mr-1" />
              Alert
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
