import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
import { useSimpleAuth as useAuth } from "@/contexts/SimpleAuthContext";
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

      // Enhanced SOS with immediate location sharing
      const locationUrl = currentLocation
        ? `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
        : "Location unavailable";

      const emergencyMessage = `🚨 EMERGENCY ALERT: ${userProfile.displayName || "Emergency User"} needs immediate help! Location: ${locationUrl} - Time: ${new Date().toLocaleString()} - Please respond immediately or call emergency services!`;

      // Send to all emergency contacts via multiple channels
      const notificationPromises = emergencyContacts.map(async (contact) => {
        // Try native sharing first
        if (navigator.share) {
          try {
            await navigator.share({
              title: "🚨 EMERGENCY ALERT",
              text: emergencyMessage,
            });
          } catch (shareError) {
            // Fallback to SMS
            window.open(
              `sms:${contact.phone}?body=${encodeURIComponent(emergencyMessage)}`,
              "_blank",
            );
          }
        } else {
          // Direct SMS fallback
          window.open(
            `sms:${contact.phone}?body=${encodeURIComponent(emergencyMessage)}`,
            "_blank",
          );
        }
      });

      await Promise.allSettled(notificationPromises);

      // Also use the original SOS service for tracking
      try {
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

          // Start continuous location sharing every 30 seconds
          const sosInterval = setInterval(async () => {
            try {
              const updatedLocation = await getCurrentLocation();
              const updateMessage = `🚨 SOS LOCATION UPDATE: ${locationUrl} - Time: ${new Date().toLocaleString()}`;

              emergencyContacts.forEach((contact) => {
                window.open(
                  `sms:${contact.phone}?body=${encodeURIComponent(updateMessage)}`,
                  "_blank",
                );
              });
            } catch (error) {
              console.warn("Location update failed:", error);
            }
          }, 30000);

          // Store interval for cleanup
          (window as any).sosLocationInterval = sosInterval;
        }
      } catch (sosError) {
        console.warn(
          "SOS service failed, but emergency contacts were notified:",
          sosError,
        );
      }

      toast.success(
        `🚨 Emergency alert sent to ${emergencyContacts.length} contact${emergencyContacts.length > 1 ? "s" : ""}! Continuous location sharing activated.`,
        { duration: 10000 },
      );

      onSOSPress?.();
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

    // Clear continuous location sharing interval
    if ((window as any).sosLocationInterval) {
      clearInterval((window as any).sosLocationInterval);
      (window as any).sosLocationInterval = null;
    }

    toast.info("Emergency alert cancelled - location sharing stopped");
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
        <div className="relative px-6 py-3">
          <div className="flex items-center justify-between max-w-xs mx-auto">
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
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item, index)}
                  disabled={sending}
                  className={cn(
                    "relative flex flex-col items-center px-3 py-2 transition-all duration-300",
                    sending && isSpecial && "opacity-50 cursor-not-allowed",
                  )}
                  whileHover={{
                    scale: isSpecial ? 1.15 : 1.1,
                    y: -2,
                  }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.1,
                    type: "spring",
                    damping: 20,
                    stiffness: 300,
                  }}
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
                      "relative z-10 p-1.5 rounded-xl transition-all duration-300",
                      isSpecial &&
                        "bg-emergency text-emergency-foreground shadow-lg",
                      isActive && !isSpecial && "bg-primary/20",
                    )}
                  >
                    <Icon
                      className={cn(
                        "transition-all duration-300",
                        isSpecial ? "h-6 w-6" : "h-4 w-4",
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
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-emergency/20 opacity-50"
                      animate={{
                        opacity: [0.2, 0.5, 0.2],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
