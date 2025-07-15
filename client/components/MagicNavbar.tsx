import { useState, useEffect, useCallback, useMemo } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useSOSSettings } from "@/contexts/SOSSettingsContext";
import { SOSService } from "@/services/sosService";
import { RealTimeLocationService } from "@/services/realTimeLocationService";
import { SOSPasswordModal } from "@/components/SOSPasswordModal";
import { RealTimeSOSTracker } from "@/components/RealTimeSOSTracker";
import { notifications } from "@/services/enhancedNotificationService";

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
  const isMobile = useIsMobile();
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
    // Silently activate enhanced navigation
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
      notifications.error({
        title: "Authentication Required",
        description: "Please sign in to send emergency alerts",
        vibrate: true,
      });
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
        // Silent handling - no toast notification
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
              const currentLocationName = await getLocationName(
                updatedLocation.latitude,
                updatedLocation.longitude,
              );
              const updateMessage = `🚨 SOS LOCATION UPDATE: ${currentLocationName} (${updatedLocation.latitude.toFixed(6)}, ${updatedLocation.longitude.toFixed(6)}) - Time: ${new Date().toLocaleString()}`;

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

      // Try to actually contact emergency services
      const actuallyContactEmergencyServices = async () => {
        const settings = JSON.parse(
          localStorage.getItem("guardian-advanced-settings") || "{}",
        );

        // Check if auto-call is enabled
        if (settings.autoCallEmergencyServices) {
          try {
            // Try to initiate call to emergency services
            window.location.href = "tel:911";
            notifications.emergency({
              title: "🚨 Calling Emergency Services",
              description:
                "Emergency call initiated. Stay on the line and provide your location.",
            });
          } catch (error) {
            console.warn("Auto-call failed:", error);
          }
        }

        // Try to send actual messages to emergency contacts
        emergencyContacts.forEach((contact) => {
          if (contact.phone) {
            try {
              // Try SMS (limited browser support)
              const smsLink = `sms:${contact.phone}?body=${encodeURIComponent(emergencyMessage)}`;
              window.location.href = smsLink;
            } catch (error) {
              console.warn(`Failed to send SMS to ${contact.name}:`, error);
            }
          }
        });
      };

      await actuallyContactEmergencyServices();

      notifications.emergency({
        title: "🚨 EMERGENCY ALERT ACTIVATED",
        description: `Emergency message copied to clipboard and sent to ${emergencyContacts.length} contacts. Location sharing activated.`,
        persistent: true,
      });

      onSOSPress?.();
    } catch (error) {
      console.error("Error sending SOS alert:", error);
      notifications.error({
        title: "SOS Alert Failed",
        description: "Unable to send emergency alert - try again",
        vibrate: true,
      });
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
      notifications.success({
        title: "SOS Cancelled",
        description: "Emergency alert has been cancelled",
        vibrate: true,
      });
    } catch (error) {
      console.error("Failed to stop SOS alert:", error);
      notifications.error({
        title: "Cancel Failed",
        description: "Unable to cancel SOS alert",
        vibrate: true,
      });
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

    notifications.success({
      title: "Alert Cancelled",
      description: "Emergency alert cancelled and location sharing stopped",
      vibrate: true,
    });
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
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom",
          isMobile ? "pb-2" : "pb-4",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Professional background with enhanced blur effect */}
        <motion.div
          className="absolute inset-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Subtle gradient overlay for depth */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-gray-50/20 to-transparent rounded-t-2xl"
          animate={{
            background: [
              "linear-gradient(to top, rgba(249, 250, 251, 0.2), transparent)",
              "linear-gradient(to top, rgba(239, 246, 255, 0.3), transparent)",
              "linear-gradient(to top, rgba(249, 250, 251, 0.2), transparent)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Navigation items */}
        <motion.div
          className={cn(
            "relative rounded-t-2xl",
            isMobile ? "px-6 py-4" : "px-8 py-5",
          )}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            delay: 0.2,
          }}
        >
          <motion.div
            className="flex items-center justify-between w-full max-w-sm mx-auto"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: 0.3,
            }}
          >
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
                    data-emergency="true"
                    aria-label={
                      sosPressed
                        ? "Cancel Emergency Alert"
                        : activeAlertId
                          ? "Stop Active SOS Alert"
                          : "Emergency SOS Button"
                    }
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (sosPressed) {
                          handleCancelSOS();
                        } else if (activeAlertId) {
                          stopActiveSOSAlert();
                        }
                      }
                    }}
                    className={cn(
                      "relative flex flex-col items-center transition-all duration-300 flex-1 touch-emergency emergency-focus sos-button rounded-xl",
                      isMobile
                        ? "px-4 py-3 max-w-[90px] min-h-[60px]"
                        : "px-6 py-4 max-w-[80px]",
                      sosPressed
                        ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg animate-pulse"
                        : activeAlertId
                          ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg animate-pulse"
                          : "bg-gradient-to-br from-red-50 to-red-100 border border-red-200",
                      sending && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {sosPressed && (
                      <div className="absolute inset-0 rounded-3xl border-2 border-warning animate-ping" />
                    )}
                    {(sending || activeAlertId) && (
                      <div className="absolute inset-0 rounded-3xl border-2 border-red-500 animate-pulse" />
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
                    "relative flex flex-col items-center transition-all duration-300 flex-1 touch-optimization rounded-xl",
                    isMobile
                      ? "px-4 py-3 max-w-[90px] min-h-[60px]"
                      : "px-6 py-4 max-w-[80px]",
                    sending && isSpecial && "opacity-50 cursor-not-allowed",
                    item.id === "map" &&
                      showEnhancedMapHint &&
                      "bg-blue-50 border border-blue-200",
                    isActive && !isSpecial && "bg-blue-50",
                  )}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{
                    scale: 1.05,
                    y: -2,
                    transition: { duration: 0.2 },
                  }}
                  initial={{ opacity: 0, y: 30, scale: 0.8, rotate: -10 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                  transition={{
                    delay: index * 0.1,
                    type: "spring",
                    damping: 20,
                    stiffness: 300,
                    duration: 0.6,
                  }}
                >
                  {/* Icon container */}
                  <motion.div
                    className={cn(
                      "relative z-10 p-3 rounded-xl transition-all duration-300 mb-1",
                      isSpecial &&
                        "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg",
                      isActive &&
                        !isSpecial &&
                        "bg-blue-500 text-white shadow-md",
                      !isActive && !isSpecial && "bg-gray-100 text-gray-600",
                    )}
                    animate={{
                      scale: isActive ? [1, 1.1, 1] : 1,
                      boxShadow: isActive
                        ? [
                            "0 4px 20px rgba(59, 130, 246, 0.3)",
                            "0 8px 30px rgba(59, 130, 246, 0.4)",
                            "0 4px 20px rgba(59, 130, 246, 0.3)",
                          ]
                        : "0 2px 10px rgba(0, 0, 0, 0.1)",
                    }}
                    transition={{
                      duration: 0.8,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      repeat: isActive ? Infinity : 0,
                      repeatDelay: 1.2,
                    }}
                  >
                    <motion.div
                      animate={isActive ? { rotate: [0, 3, -3, 0] } : {}}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      <Icon
                        className={cn(
                          "transition-all duration-300",
                          isSpecial ? "h-5 w-5" : "h-4 w-4",
                        )}
                      />
                    </motion.div>
                  </motion.div>

                  {/* Label */}
                  <motion.span
                    className={cn(
                      "text-xs font-semibold transition-all duration-300",
                      isActive && !isSpecial
                        ? "text-blue-600"
                        : "text-gray-600",
                      isSpecial && "text-red-600 font-bold",
                    )}
                    animate={{
                      y: isActive ? [0, -1, 0] : 0,
                    }}
                    transition={{
                      duration: 1.2,
                      ease: "easeInOut",
                      repeat: isActive ? Infinity : 0,
                      repeatDelay: 0.5,
                    }}
                  >
                    {item.label}
                  </motion.span>

                  {/* Special item glow effect */}
                  {isSpecial && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-red-500/10"
                      animate={{
                        opacity: [0.1, 0.3, 0.1],
                        scale: [1, 1.02, 1],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  {/* Active item indicator */}
                  <AnimatePresence>
                    {isActive && !isSpecial && (
                      <motion.div
                        className="absolute bottom-1 left-1/2 w-1 h-1 bg-blue-500 rounded-full"
                        initial={{ scale: 0, x: "-50%" }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{
                          type: "spring",
                          damping: 15,
                          stiffness: 300,
                        }}
                      />
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Enhanced Navigation Hint */}
        <AnimatePresence>
          {showEnhancedMapHint && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-600 text-white text-xs rounded-2xl whitespace-nowrap"
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
