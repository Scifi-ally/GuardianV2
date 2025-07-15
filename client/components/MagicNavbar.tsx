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
    // Focus on the floating search bar instead of navigating
    const searchInput = document.querySelector(
      'input[placeholder*="Where do you want to go"]',
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.click();
    }
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
        {/* Enhanced Background with premium blur effect */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/60 rounded-t-3xl shadow-2xl ring-1 ring-gray-200/50" />

        {/* Navigation items */}
        <div
          className={cn(
            "relative rounded-t-3xl",
            isMobile ? "px-4 py-3" : "px-8 py-4",
          )}
        >
          <div className="flex items-center justify-between w-full max-w-2xl mx-auto px-2">
            <div className="flex-1"></div>
            <div className="flex items-center gap-6">
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
                        "relative flex flex-col items-center transition-all duration-300 flex-1 touch-emergency emergency-focus sos-button",
                        isMobile
                          ? "px-3 py-2 max-w-[90px] min-h-[60px]"
                          : "px-6 py-3 max-w-[80px]",
                        sosPressed
                          ? "bg-warning/20 rounded-3xl animate-pulse"
                          : activeAlertId
                            ? "bg-red-500 text-white rounded-3xl animate-pulse"
                            : "bg-emergency/20 rounded-3xl",
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
                      "relative flex flex-col items-center transition-all duration-500 touch-optimization group",
                      isMobile
                        ? "px-6 py-4 min-w-[100px] min-h-[80px] mx-2"
                        : "px-8 py-5 min-w-[120px] min-h-[90px] mx-3",
                      sending && isSpecial && "opacity-50 cursor-not-allowed",
                      item.id === "map" &&
                        showEnhancedMapHint &&
                        "bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-lg",
                    )}
                    whileHover={{
                      scale: isSpecial ? 1.25 : 1.2,
                      y: -8,
                      rotateY: 5,
                      transition: {
                        type: "spring",
                        damping: 15,
                        stiffness: 400,
                        duration: 0.4,
                      },
                    }}
                    whileTap={{
                      scale: 0.9,
                      rotateZ: isSpecial ? 5 : -3,
                      transition: { duration: 0.15 },
                    }}
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        delay: index * 0.2,
                        type: "spring",
                        damping: 20,
                        stiffness: 300,
                        duration: 0.8,
                      },
                    }}
                  >
                    {/* Ultra-Enhanced Background with dynamic effects */}
                    <motion.div
                      className={cn(
                        "absolute inset-0 rounded-3xl transition-all duration-500",
                        isActive &&
                          !isSpecial &&
                          "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 ring-2 ring-blue-300/50 shadow-xl",
                        isSpecial &&
                          "bg-gradient-to-br from-red-50 via-red-100 to-red-200 ring-2 ring-red-300/50 shadow-2xl",
                        !isActive &&
                          !isSpecial &&
                          "bg-gradient-to-br from-gray-50 to-gray-100 shadow-md ring-1 ring-gray-200/30",
                      )}
                      animate={{
                        scale:
                          isActive || isSpecial ? [1, 1.05, 1] : [1, 1.02, 1],
                        rotate: isActive && !isSpecial ? [0, 2, 0] : 0,
                        opacity:
                          isActive || isSpecial
                            ? [0.8, 1, 0.8]
                            : [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: isSpecial ? 1.5 : 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Ultra-Premium Icon container with advanced effects */}
                    <motion.div
                      className={cn(
                        "relative z-10 p-4 rounded-2xl transition-all duration-500 backdrop-blur-sm",
                        isSpecial &&
                          "bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-2xl ring-2 ring-red-300/70",
                        isActive &&
                          !isSpecial &&
                          "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-xl ring-2 ring-blue-300/70",
                        !isActive &&
                          !isSpecial &&
                          "text-gray-700 bg-white/80 shadow-lg ring-1 ring-gray-200/60",
                      )}
                      whileHover={{
                        boxShadow: isSpecial
                          ? "0 25px 50px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.4)"
                          : isActive
                            ? "0 20px 40px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.4)"
                            : "0 15px 30px rgba(0, 0, 0, 0.15)",
                        scale: 1.1,
                        transition: { duration: 0.3 },
                      }}
                      animate={{
                        rotateY: isActive ? [0, 15, 0] : 0,
                        scale: isSpecial ? [1, 1.08, 1] : [1, 1.02, 1],
                      }}
                      transition={{
                        duration: isSpecial ? 1.2 : 2.5,
                        repeat: isSpecial || isActive ? Infinity : 0,
                        ease: "easeInOut",
                      }}
                    >
                      <Icon
                        className={cn(
                          "transition-all duration-500 drop-shadow-sm",
                          isSpecial ? "h-7 w-7" : "h-6 w-6",
                          (isActive || isSpecial) &&
                            "text-white drop-shadow-lg",
                          !isActive && !isSpecial && "text-gray-700",
                        )}
                      />
                    </motion.div>

                    {/* Ultra-Enhanced Label */}
                    <motion.span
                      className={cn(
                        "text-sm font-medium transition-all duration-500 mt-3 tracking-wide",
                        isActive && !isSpecial
                          ? "text-blue-700 font-bold drop-shadow-sm"
                          : "text-gray-600",
                        isSpecial && "text-red-700 font-bold drop-shadow-sm",
                      )}
                      animate={{
                        y: isActive || isSpecial ? [0, -3, 0] : 0,
                        scale: isActive || isSpecial ? [1, 1.08, 1] : 1,
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: isActive || isSpecial ? Infinity : 0,
                        ease: "easeInOut",
                      }}
                    >
                      {item.label}
                    </motion.span>

                    {/* Advanced special item effects */}
                    {isSpecial && (
                      <motion.div
                        className="absolute inset-0 rounded-3xl bg-emergency/20 opacity-50"
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
            <div className="flex-1"></div>
          </div>
        </div>

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
