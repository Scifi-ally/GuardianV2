import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, User, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
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
  icon: typeof MapPin;
  path: string;
  isSpecial?: boolean;
}

const navItems: NavItem[] = [
  { id: "map", label: "Map", icon: MapPin, path: "/" },
  { id: "sos", label: "SOS", icon: AlertTriangle, path: "", isSpecial: true },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

interface SimpleNavbarProps {
  onSOSPress?: () => void;
}

export function SimpleNavbar({ onSOSPress }: SimpleNavbarProps) {
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

      <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
        {/* Ultra-light professional background */}
        <div className="absolute inset-0 navbar-light bg-gradient-to-t from-white via-white/95 to-white/90 backdrop-blur-md border-t border-slate-200/50" />

        {/* Navigation container */}
        <div className="relative rounded-t-3xl">
          <div className="flex items-center justify-between w-full max-w-lg mx-auto px-6 py-3">
            <div className="flex-1"></div>
            <div className="flex items-center gap-6">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeIndex === index;
                const isSpecial = item.isSpecial;

                if (isSpecial && (sosPressed || sending || activeAlertId)) {
                  return (
                    <motion.button
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
                        "relative flex flex-col items-center transition-all duration-300 touch-emergency emergency-focus sos-button",
                        "px-4 py-3 min-w-[80px] min-h-[70px] mx-2",
                        sending && "opacity-50 cursor-not-allowed",
                      )}
                      whileHover={{
                        scale: 1.15,
                        y: -4,
                        transition: {
                          type: "spring",
                          damping: 20,
                          stiffness: 300,
                          duration: 0.2,
                        },
                      }}
                      whileTap={{
                        scale: 0.95,
                        transition: { duration: 0.1 },
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
                          "bg-gradient-to-br from-red-50 via-red-100 to-red-200 ring-2 ring-red-300/50 shadow-2xl",
                        )}
                        animate={{
                          scale: [1, 1.05, 1],
                          opacity: [0.8, 1, 0.8],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />

                      {/* Ultra-Premium Icon container with advanced effects */}
                      <motion.div
                        className={cn(
                          "relative z-10 rounded-professional smooth-transition backdrop-blur-sm interactive-card",
                          "p-3",
                          sosPressed
                            ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-lg ring-1 ring-yellow-200/50 rounded-2xl"
                            : activeAlertId
                              ? "bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white shadow-lg ring-1 ring-red-200/50 rounded-2xl"
                              : "bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white shadow-lg ring-1 ring-red-200/50 rounded-2xl",
                        )}
                        whileHover={{
                          boxShadow: sosPressed
                            ? "0 25px 50px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.4)"
                            : "0 25px 50px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.4)",
                          scale: 1.1,
                          transition: { duration: 0.3 },
                        }}
                        animate={{
                          scale: [1, 1.08, 1],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        {sosPressed ? (
                          <div className="text-2xl font-bold text-white">
                            {countdown}
                          </div>
                        ) : activeAlertId ? (
                          <div className="text-lg font-bold text-white">
                            STOP
                          </div>
                        ) : (
                          <div className="text-lg font-bold text-white">
                            ...
                          </div>
                        )}
                      </motion.div>

                      {/* Ultra-Enhanced Label */}
                      <motion.span
                        className={cn(
                          "font-medium transition-all duration-300 tracking-wide",
                          "text-sm mt-2",
                          sosPressed
                            ? "text-yellow-600 font-semibold drop-shadow-sm"
                            : activeAlertId
                              ? "text-red-600 font-semibold drop-shadow-sm"
                              : "text-red-600 font-semibold drop-shadow-sm",
                        )}
                        animate={{
                          y: [0, -3, 0],
                          scale: [1, 1.08, 1],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        {sosPressed
                          ? "Cancel"
                          : activeAlertId
                            ? "Active SOS"
                            : "Sending"}
                      </motion.span>

                      {/* Advanced special item effects */}
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
                    </motion.button>
                  );
                }

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavClick(item, index)}
                    disabled={sending}
                    className={cn(
                      "relative flex flex-col items-center transition-all duration-300 touch-optimization group",
                      "px-4 py-3 min-w-[80px] min-h-[70px] mx-2",
                      sending && isSpecial && "opacity-50 cursor-not-allowed",
                    )}
                    whileHover={{
                      scale: isSpecial ? 1.15 : 1.1,
                      y: -4,
                      transition: {
                        type: "spring",
                        damping: 20,
                        stiffness: 300,
                        duration: 0.2,
                      },
                    }}
                    whileTap={{
                      scale: 0.95,
                      transition: { duration: 0.1 },
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
                        // Map button - Beautiful blue ocean theme
                        item.id === "map" &&
                          isActive &&
                          "bg-gradient-to-br from-cyan-50 via-blue-100 to-indigo-200 ring-2 ring-cyan-300/60 shadow-2xl",
                        item.id === "map" &&
                          !isActive &&
                          "bg-gradient-to-br from-cyan-25 via-sky-50 to-blue-100 ring-1 ring-cyan-200/40 shadow-lg",
                        // Profile button - Beautiful purple gradient theme
                        item.id === "profile" &&
                          isActive &&
                          "bg-gradient-to-br from-purple-50 via-violet-100 to-indigo-200 ring-2 ring-purple-300/60 shadow-2xl",
                        item.id === "profile" &&
                          !isActive &&
                          "bg-gradient-to-br from-purple-25 via-lavender-50 to-violet-100 ring-1 ring-purple-200/40 shadow-lg",
                        // SOS button fallback
                        isSpecial &&
                          "bg-gradient-to-br from-red-50 via-red-100 to-red-200 ring-2 ring-red-300/50 shadow-2xl",
                        // Generic fallback
                        !isActive &&
                          !isSpecial &&
                          item.id !== "map" &&
                          item.id !== "profile" &&
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
                        "relative z-10 rounded-professional smooth-transition backdrop-blur-sm interactive-card",
                        "p-3",
                        // Map button - Ocean blue crystal theme
                        item.id === "map" &&
                          isActive &&
                          "bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-white shadow-lg ring-1 ring-cyan-200/50 rounded-2xl",
                        item.id === "map" &&
                          !isActive &&
                          "text-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-100 shadow-sm ring-1 ring-cyan-200/60 rounded-2xl",
                        // Profile button - Royal purple theme
                        item.id === "profile" &&
                          isActive &&
                          "bg-gradient-to-br from-purple-400 via-violet-500 to-indigo-600 text-white shadow-lg ring-1 ring-purple-200/50 rounded-2xl",
                        item.id === "profile" &&
                          !isActive &&
                          "text-purple-500 bg-gradient-to-br from-purple-50 to-violet-100 shadow-sm ring-1 ring-purple-200/60 rounded-2xl",
                        // SOS button fallback
                        isSpecial &&
                          "bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-white shadow-lg ring-1 ring-red-200/50 rounded-2xl",
                        // Generic fallback
                        !isActive &&
                          !isSpecial &&
                          item.id !== "map" &&
                          item.id !== "profile" &&
                          "text-slate-400 bg-white/95 shadow-sm ring-1 ring-slate-100/80 rounded-2xl",
                      )}
                      whileHover={{
                        boxShadow: isSpecial
                          ? "0 25px 50px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.4)"
                          : item.id === "map"
                            ? "0 25px 50px rgba(34, 211, 238, 0.6), 0 0 40px rgba(59, 130, 246, 0.5)"
                            : item.id === "profile"
                              ? "0 25px 50px rgba(147, 51, 234, 0.6), 0 0 40px rgba(139, 92, 246, 0.5)"
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
                          "transition-all duration-300 drop-shadow-sm",
                          isSpecial ? "h-6 w-6" : "h-5 w-5",
                          (isActive || isSpecial) &&
                            "text-white drop-shadow-lg",
                          !isActive && !isSpecial && "text-slate-400",
                        )}
                      />
                    </motion.div>

                    {/* Ultra-Enhanced Label */}
                    <motion.span
                      className={cn(
                        "font-medium transition-all duration-300 tracking-wide",
                        "text-sm mt-2",
                        // Map button labels
                        item.id === "map" && isActive
                          ? "text-cyan-700 font-semibold drop-shadow-sm"
                          : item.id === "map" && !isActive
                            ? "text-cyan-500 font-medium"
                            : "",
                        // Profile button labels
                        item.id === "profile" && isActive
                          ? "text-purple-700 font-semibold drop-shadow-sm"
                          : item.id === "profile" && !isActive
                            ? "text-purple-500 font-medium"
                            : "",
                        // SOS button labels
                        isSpecial &&
                          "text-red-400 font-semibold drop-shadow-sm",
                        // Generic fallback
                        !isSpecial &&
                          item.id !== "map" &&
                          item.id !== "profile" &&
                          (isActive
                            ? "text-slate-700 font-semibold drop-shadow-sm"
                            : "text-slate-400"),
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
      </div>
    </>
  );
}
