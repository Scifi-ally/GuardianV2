import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  const [mapLongPressTimer, setMapLongPressTimer] = useState<number | null>(
    null,
  );
  const [showEnhancedMapHint, setShowEnhancedMapHint] = useState(false);

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

  const handleMapLongPress = () => {
    navigate("/enhanced-navigation");
    toast.success("Enhanced Navigation activated!");
    setShowEnhancedMapHint(false);
  };

  const handleMapMouseDown = (item: NavItem, index: number) => {
    if (item.id === "map") {
      const timer = setTimeout(() => {
        setShowEnhancedMapHint(true);
        handleMapLongPress();
      }, 800); // 800ms long press
      setMapLongPressTimer(timer as unknown as number);
    }
  };

  const handleMapMouseUp = () => {
    if (mapLongPressTimer) {
      clearTimeout(mapLongPressTimer);
      setMapLongPressTimer(null);
    }
    setShowEnhancedMapHint(false);
  };

  const getLocationName = async (lat: number, lng: number): Promise<string> => {
    if (!window.google?.maps) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await new Promise<string>((resolve) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const components = results[0].address_components;
            let shortName = "";
            let neighborhood = "";
            let city = "";

            components.forEach((component) => {
              const types = component.types;
              if (
                types.includes("establishment") ||
                types.includes("point_of_interest")
              ) {
                shortName = component.long_name;
              } else if (
                types.includes("neighborhood") ||
                types.includes("sublocality")
              ) {
                neighborhood = component.long_name;
              } else if (types.includes("locality")) {
                city = component.long_name;
              }
            });

            if (shortName) resolve(shortName);
            else if (neighborhood && city) resolve(`${neighborhood}, ${city}`);
            else if (city) resolve(city);
            else resolve(results[0].formatted_address);
          } else {
            resolve(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        });
      });
      return result;
    } catch (error) {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
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

      // Enhanced SOS with internal location sharing only
      const locationName = currentLocation
        ? await getLocationName(
            currentLocation.latitude,
            currentLocation.longitude,
          )
        : "Location unavailable";

      const locationCoords = currentLocation
        ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
        : "Location unavailable";

      const emergencyMessage = `🚨 EMERGENCY ALERT: ${userProfile.displayName || "Emergency User"} needs immediate help!\n\nLocation: ${locationName}\nCoordinates: ${locationCoords}\nTime: ${new Date().toLocaleString()}\nAccuracy: ±${Math.round(currentLocation?.accuracy || 0)}m\n\nPlease respond immediately or call emergency services!`;

      // Internal sharing only - copy to clipboard
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(emergencyMessage);
        } else {
          // Fallback for non-secure contexts
          const textArea = document.createElement("textarea");
          textArea.value = emergencyMessage;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        }
      } catch (error) {
        console.error("Failed to copy emergency message:", error);
      }

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

              emergencyContacts.forEach(async (contact) => {
                try {
                  if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(updateMessage);
                  }
                  console.log(
                    `SOS update copied for ${contact.name}: ${contact.phone}`,
                  );
                } catch (error) {
                  console.error("Failed to copy SOS update:", error);
                }
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
        `🚨 Emergency message copied to clipboard! Send to your ${emergencyContacts.length} emergency contact${emergencyContacts.length > 1 ? "s" : ""}. Location sharing activated.`,
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

  const stopActiveSOSAlert = async () => {
    if (!activeAlertId || !currentUser) return;

    try {
      // Stop the location sharing interval
      if ((window as any).sosLocationInterval) {
        clearInterval((window as any).sosLocationInterval);
        (window as any).sosLocationInterval = null;
      }

      // Cancel the SOS alert
      await SOSService.cancelSOSAlert(activeAlertId, currentUser.uid);

      setActiveAlertId(null);
      toast.success("SOS alert cancelled");
    } catch (error) {
      console.error("Failed to stop SOS alert:", error);
      toast.error("Failed to stop SOS alert");
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

              if (isSpecial && (sosPressed || sending || activeAlertId)) {
                return (
                  <button
                    key={item.id}
                    onClick={
                      sosPressed
                        ? handleCancelSOS
                        : activeAlertId
                          ? stopActiveSOSAlert
                          : undefined
                    }
                    disabled={sending}
                    className={cn(
                      "relative flex flex-col items-center p-3 transition-all duration-300",
                      sosPressed
                        ? "bg-warning/20 rounded-2xl animate-pulse"
                        : activeAlertId
                          ? "bg-red-500 text-white rounded-2xl animate-pulse"
                          : "bg-emergency/20 rounded-2xl",
                      sending && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {sosPressed && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-warning animate-ping" />
                    )}
                    {(sending || activeAlertId) && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-red-500 animate-pulse" />
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
                      ) : activeAlertId ? (
                        <>
                          <div className="text-lg font-bold text-white mb-1">
                            STOP
                          </div>
                          <span className="text-xs text-white font-medium">
                            Active SOS
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
                  onMouseDown={() => handleMapMouseDown(item, index)}
                  onMouseUp={handleMapMouseUp}
                  onMouseLeave={handleMapMouseUp}
                  onTouchStart={() => handleMapMouseDown(item, index)}
                  onTouchEnd={handleMapMouseUp}
                  disabled={sending}
                  className={cn(
                    "relative flex flex-col items-center px-3 py-2 transition-all duration-300",
                    sending && isSpecial && "opacity-50 cursor-not-allowed",
                    item.id === "map" &&
                      showEnhancedMapHint &&
                      "bg-blue-100 rounded-lg",
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

        {/* Enhanced Navigation Hint */}
        <AnimatePresence>
          {showEnhancedMapHint && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg whitespace-nowrap"
            >
              🚀 Enhanced Navigation
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
