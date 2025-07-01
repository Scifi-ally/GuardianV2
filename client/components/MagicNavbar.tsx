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
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useSOSSettings } from "@/contexts/SOSSettingsContext";
import { SOSService } from "@/services/sosService";
import { RealTimeLocationService } from "@/services/realTimeLocationService";
import { SOSPasswordModal } from "@/components/SOSPasswordModal";
import { RealTimeSOSTracker } from "@/components/RealTimeSOSTracker";
import { toast } from "sonner";

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  isSpecial?: boolean;
}

const navItems: NavItem[] = [
  { id: "map", label: "Map", icon: MapPin, path: "/" },
  { id: "sos", label: "SOS", icon: AlertTriangle, path: "", isSpecial: true },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

interface MagicNavbarProps {
  onSOSPress?: () => void;
}

export function MagicNavbar({ onSOSPress }: MagicNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const { location: userLocation, getCurrentLocation } = useGeolocation();
  const { sosSettings, verifyPassword } = useSOSSettings();
  const [activeIndex, setActiveIndex] = useState(0);
  const [sosPressed, setSOSPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);

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

  const sendSOSAlert = async () => {
    if (!currentUser || !userProfile) {
      toast.error("Authentication required to send SOS");
      return;
    }

    setSending(true);

    try {
      // Get current location
      let currentLocation;
      try {
        currentLocation = await getCurrentLocation();
      } catch (error) {
        console.warn("Could not get current location:", error);
        currentLocation = userLocation;
      }

      // Get emergency contacts
      const emergencyContacts = userProfile.emergencyContacts || [];

      if (emergencyContacts.length === 0) {
        toast.error("No emergency contacts found. Add contacts first.");
        setSending(false);
        return;
      }

      // Send SOS alert
      const result = await SOSService.sendSOSAlert(
        currentUser.uid,
        userProfile.displayName || "Emergency User",
        userProfile.guardianKey || "UNKNOWN",
        emergencyContacts,
        currentLocation
          ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              accuracy: currentLocation.accuracy,
            }
          : undefined,
        "manual",
        "Emergency SOS alert! Please respond immediately.",
      );

      if (result.success && result.alertId) {
        setActiveAlertId(result.alertId);

        // Start real-time location tracking for this alert
        RealTimeLocationService.startTracking(
          currentUser.uid,
          async (location) => {
            // Update the alert location silently every 30 seconds
            await SOSService.updateSOSLocation(result.alertId!, {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              timestamp: new Date(location.timestamp),
            });
          },
          (error) => {
            console.warn("Real-time tracking error:", error);
          },
          {
            interval: 30000, // 30 seconds
            silentUpdates: true,
            emergencyMode: true,
          },
        );

        toast.success(
          `Emergency alert sent to ${emergencyContacts.length} contact${emergencyContacts.length > 1 ? "s" : ""}! Location tracking started.`,
        );
        onSOSPress?.();
      } else {
        toast.error(result.error || "Failed to send emergency alert");
      }
    } catch (error) {
      console.error("Error sending SOS alert:", error);
      toast.error("Failed to send emergency alert");
    } finally {
      setSending(false);
    }
  };

  const handleSOSPress = () => {
    if (sosPressed || sending) return;

    setSOSPressed(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setSOSPressed(false);
          sendSOSAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelSOS = () => {
    if (sosSettings.requirePasswordToCancel && sosSettings.passwordProtected) {
      setShowPasswordModal(true);
    } else {
      cancelSOSAlert();
    }
  };

  const cancelSOSAlert = () => {
    setSOSPressed(false);
    setCountdown(0);
    setShowPasswordModal(false);

    // Stop real-time tracking if active
    if (activeAlertId && currentUser) {
      RealTimeLocationService.stopTracking(currentUser.uid);
      setActiveAlertId(null);
    }

    toast.info("Emergency alert cancelled");
  };

  const handlePasswordVerification = (password: string) => {
    return verifyPassword(password);
  };

  const handlePasswordSuccess = () => {
    cancelSOSAlert();
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
  };

  return (
    <>
      <SOSPasswordModal
        isOpen={showPasswordModal}
        onVerify={handlePasswordVerification}
        onCancel={handlePasswordCancel}
        onSuccess={handlePasswordSuccess}
        title="Cancel Emergency Alert"
        description="Enter your emergency password to cancel the SOS alert"
      />

      {/* Real-time location tracking for active SOS alert */}
      {activeAlertId && (
        <RealTimeSOSTracker
          alertId={activeAlertId}
          isEmergency={true}
          onLocationUpdate={(location) => {
            // Location updates happen silently - no toast notifications
            console.log("Location updated for SOS alert:", location);
          }}
        />
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Background with blur effect */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-lg border-t border-border" />

        {/* Navigation items */}
        <div className="relative px-4 py-3 pb-6">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeIndex === index;
              const isSpecial = item.isSpecial;

              if (isSpecial && (sosPressed || sending)) {
                return (
                  <button
                    key={item.id}
                    onClick={sosPressed ? handleCancelSOS : undefined}
                    disabled={sending}
                    className={cn(
                      "relative flex flex-col items-center p-3 transition-all duration-300",
                      sosPressed
                        ? "bg-warning/20 rounded-2xl animate-pulse"
                        : "bg-emergency/20 rounded-2xl",
                      sending && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {sosPressed && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-warning animate-ping" />
                    )}
                    {sending && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-emergency animate-pulse" />
                    )}
                    <div className="relative z-10 flex flex-col items-center">
                      {sosPressed ? (
                        <>
                          <div className="text-2xl font-bold text-warning mb-1">
                            {countdown}
                          </div>
                          <span className="text-xs text-warning font-medium">
                            Cancel
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="text-lg font-bold text-emergency mb-1">
                            ...
                          </div>
                          <span className="text-xs text-emergency font-medium">
                            Sending
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item, index)}
                  disabled={sending}
                  className={cn(
                    "relative flex flex-col items-center p-3 transition-all duration-300",
                    "hover:scale-110 active:scale-95",
                    isSpecial && "transform hover:scale-125",
                    sending && isSpecial && "opacity-50 cursor-not-allowed",
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
    </>
  );
}
