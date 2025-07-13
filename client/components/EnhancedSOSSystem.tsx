import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  Phone,
  Check,
  X,
  Clock,
  MessageSquare,
  Copy,
  Share,
  StopCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useSlideDownNotifications } from "@/components/SlideDownNotifications";
import { cn } from "@/lib/utils";
import { unifiedNotifications } from "@/services/unifiedNotificationService";

interface SOSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  message: string;
  location: SOSLocation;
  timestamp: Date;
  status: "active" | "cancelled" | "resolved";
  responses: SOSResponse[];
  emergencyType:
    | "general"
    | "medical"
    | "personal_safety"
    | "natural_disaster"
    | "accident";
  priority: "low" | "medium" | "high" | "critical";
  autoEscalated: boolean;
  lastHeartbeat: Date;
  batteryCritical: boolean;
  soundAlarmEnabled: boolean;
  flashlightEnabled: boolean;
}

interface SOSResponse {
  id: string;
  userId: string;
  userName: string;
  response: "acknowledged" | "on_way" | "safe" | "emergency_services";
  message?: string;
  location?: SOSLocation;
  timestamp: Date;
}

interface EnhancedSOSSystemProps {
  onSOSLocationReceived?: (location: SOSLocation) => void;
  onSOSAlert?: (alert: SOSAlert) => void;
  onStartNavigation?: (location: SOSLocation) => void;
  className?: string;
}

export function EnhancedSOSSystem({
  onSOSLocationReceived,
  onSOSAlert,
  onStartNavigation,
  className,
}: EnhancedSOSSystemProps) {
  const { userProfile, currentUser } = useAuth();
  const { location, getCurrentLocation } = useGeolocation();
  const { addNotification } = useSlideDownNotifications();

  const [sosPressed, setSOSPressed] = useState(false);
  const [sosActive, setSOSActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [activeAlert, setActiveAlert] = useState<SOSAlert | null>(null);
  const [receivedAlerts, setReceivedAlerts] = useState<SOSAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [heartbeatActive, setHeartbeatActive] = useState(false);
  const [soundAlarmActive, setSoundAlarmActive] = useState(false);
  const [flashlightActive, setFlashlightActive] = useState(false);
  const [emergencyType, setEmergencyType] = useState<string>("general");

  // Store active intervals for cleanup
  const [locationUpdateInterval, setLocationUpdateInterval] =
    useState<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const batteryMonitor = useRef<NodeJS.Timeout | null>(null);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize battery monitoring and alarm audio
    monitorBattery();

    // Create alarm audio element
    alarmAudio.current = new Audio();
    alarmAudio.current.src =
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+L1uGkdBTCB1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+L1uGkdBTCB";

    // Cleanup intervals on unmount
    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
      stopHeartbeat();
      if (batteryMonitor.current) {
        clearInterval(batteryMonitor.current);
      }
      if (alarmAudio.current) {
        alarmAudio.current.pause();
      }
    };
  }, [locationUpdateInterval]);

  // Battery level monitoring for critical alerts
  useEffect(() => {
    if (activeAlert && batteryLevel < 15 && !activeAlert.autoEscalated) {
      // Auto-escalate when battery is critically low
      setActiveAlert({
        ...activeAlert,
        priority: "critical",
        autoEscalated: true,
        batteryCritical: true,
      });

      unifiedNotifications.batteryWarning(batteryLevel);

      // Auto-enable sound alarm for critical battery
      if (!soundAlarmActive && soundEnabled) {
        toggleSoundAlarm();
      }
    }
  }, [batteryLevel, activeAlert, soundAlarmActive, soundEnabled]);

  // Heartbeat failure detection
  useEffect(() => {
    if (activeAlert && heartbeatActive) {
      const heartbeatTimeout = setTimeout(() => {
        // If no heartbeat update in 2 minutes, escalate
        const timeSinceLastHeartbeat =
          Date.now() - activeAlert.lastHeartbeat.getTime();
        if (timeSinceLastHeartbeat > 120000) {
          // 2 minutes
          unifiedNotifications.critical(
            "No response detected - Emergency auto-escalated",
            {
              title: "Emergency Escalated",
              action: {
                label: "Respond Now",
                onClick: () => {
                  if (activeAlert) updateAlertHeartbeat(activeAlert.id);
                },
              },
            },
          );

          if (activeAlert) {
            setActiveAlert({
              ...activeAlert,
              priority: "critical",
              autoEscalated: true,
            });
          }
        }
      }, 130000); // Check after 2 minutes 10 seconds

      return () => clearTimeout(heartbeatTimeout);
    }
  }, [activeAlert?.lastHeartbeat, heartbeatActive]);

  // Monitor battery level
  const monitorBattery = async () => {
    try {
      if ("getBattery" in navigator) {
        const battery = await (navigator as any).getBattery();
        setBatteryLevel(Math.round(battery.level * 100));

        battery.addEventListener("levelchange", () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }
    } catch (error) {
      // Battery API not supported
    }
  };

  // Start heartbeat monitoring
  const startHeartbeat = () => {
    if (heartbeatInterval.current) return;
    setHeartbeatActive(true);

    heartbeatInterval.current = setInterval(() => {
      if (activeAlert) {
        updateAlertHeartbeat(activeAlert.id);
      }
    }, 30000); // Every 30 seconds
  };

  // Stop heartbeat monitoring
  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    setHeartbeatActive(false);
  };

  // Update alert heartbeat
  const updateAlertHeartbeat = async (alertId: string) => {
    try {
      const currentLocation = await getCurrentLocation();
      if (activeAlert) {
        setActiveAlert({
          ...activeAlert,
          lastHeartbeat: new Date(),
          location: {
            ...activeAlert.location,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            timestamp: Date.now(),
          },
        });
      }
    } catch (error) {
      console.warn("Failed to update heartbeat:", error);
    }
  };

  // Toggle sound alarm
  const toggleSoundAlarm = () => {
    if (soundAlarmActive) {
      setSoundAlarmActive(false);
      if (alarmAudio.current) {
        alarmAudio.current.pause();
        alarmAudio.current.currentTime = 0;
      }
    } else {
      setSoundAlarmActive(true);
      if (alarmAudio.current) {
        alarmAudio.current.loop = true;
        alarmAudio.current.play().catch(() => {
          unifiedNotifications.error("Unable to play alarm sound");
        });
      }
    }
  };

  // Toggle flashlight (where supported)
  const toggleFlashlight = async () => {
    try {
      if (
        "mediaDevices" in navigator &&
        "getUserMedia" in navigator.mediaDevices
      ) {
        if (flashlightActive) {
          setFlashlightActive(false);
          unifiedNotifications.info("Flashlight turned off");
        } else {
          setFlashlightActive(true);
          unifiedNotifications.info("Flashlight turned on");
        }
      } else {
        toast.error("Flashlight not supported on this device");
      }
    } catch (error) {
      toast.error("Failed to control flashlight");
    }
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

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        return true;
      }
    } catch (error) {
      console.error("Copy to clipboard failed:", error);
      return false;
    }
  };

  const shareLocationInternally = useCallback(
    async (location: SOSLocation, message: string) => {
      const locationName = await getLocationName(
        location.latitude,
        location.longitude,
      );
      const shareText = `${message}\n\nLocation: ${locationName}\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\nTime: ${new Date().toLocaleString()}`;

      // Try native share first, then fallback to clipboard
      if (navigator.share) {
        try {
          await navigator.share({
            title: "🚨 Emergency Alert",
            text: shareText,
          });
          return true;
        } catch (error) {
          console.log("Native share failed, trying clipboard");
        }
      }

      // Fallback to clipboard
      const success = await copyToClipboard(shareText);
      if (success) {
        toast.success("Emergency message copied to clipboard");
        addNotification({
          type: "success",
          title: "Location Shared",
          message:
            "Emergency message copied to clipboard. Please send to your emergency contacts.",
        });
      } else {
        toast.error("Failed to copy emergency message");
      }
      return success;
    },
    [addNotification],
  );

  const startLocationTracking = useCallback(
    (alertId: string) => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }

      const interval = setInterval(async () => {
        try {
          const currentLoc = await getCurrentLocation();
          const locationData: SOSLocation = {
            latitude: currentLoc.latitude,
            longitude: currentLoc.longitude,
            accuracy: currentLoc.accuracy,
            timestamp: Date.now(),
          };

          const locationName = await getLocationName(
            currentLoc.latitude,
            currentLoc.longitude,
          );
          const updateMessage = `🚨 SOS LOCATION UPDATE\n\nI'm still at: ${locationName}\nCoordinates: ${currentLoc.latitude.toFixed(6)}, ${currentLoc.longitude.toFixed(6)}\nTime: ${new Date().toLocaleString()}\nAccuracy: ±${Math.round(currentLoc.accuracy || 0)}m`;

          // Send to callback for map display
          onSOSLocationReceived?.(locationData);

          // Copy update to clipboard for sharing
          await copyToClipboard(updateMessage);

          console.log("📍 SOS location updated:", locationData);
        } catch (error) {
          console.error("Failed to update SOS location:", error);
        }
      }, 30000); // Update every 30 seconds

      setLocationUpdateInterval(interval);
    },
    [getCurrentLocation, onSOSLocationReceived],
  );

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
        if (location) {
          currentLocation = location;
        } else {
          throw new Error("Location not available");
        }
      }

      const sosLocation: SOSLocation = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        timestamp: Date.now(),
      };

      const locationName = await getLocationName(
        sosLocation.latitude,
        sosLocation.longitude,
      );
      sosLocation.address = locationName;

      const emergencyMessage = `🚨 EMERGENCY ALERT: ${userProfile.displayName || "Emergency User"} needs immediate help!\n\nLocation: ${locationName}\nCoordinates: ${sosLocation.latitude.toFixed(6)}, ${sosLocation.longitude.toFixed(6)}\nTime: ${new Date().toLocaleString()}\nAccuracy: ±${Math.round(sosLocation.accuracy || 0)}m\n\nPlease respond immediately or call emergency services!`;

      // Create enhanced SOS alert object
      const alert: SOSAlert = {
        id: `sos_${Date.now()}`,
        userId: currentUser.uid,
        userName: userProfile.displayName || "Emergency User",
        message: `${emergencyMessage}\n\n📱 Battery: ${batteryLevel}%\n🚨 Type: ${emergencyType.replace("_", " ").toUpperCase()}\n⏰ Auto-tracking enabled\n\nThis is an automated emergency alert with real-time location tracking.`,
        location: sosLocation,
        timestamp: new Date(),
        status: "active",
        responses: [],
        emergencyType: emergencyType as any,
        priority: batteryLevel < 20 ? "critical" : "high",
        autoEscalated: false,
        lastHeartbeat: new Date(),
        batteryCritical: batteryLevel < 20,
        soundAlarmEnabled: soundEnabled,
        flashlightEnabled: false,
      };

      setActiveAlert(alert);
      setSOSActive(true);
      startHeartbeat();

      // Auto-enable sound alarm for critical situations
      if (batteryLevel < 20 || emergencyType === "medical") {
        setTimeout(() => {
          if (soundEnabled) {
            toggleSoundAlarm();
          }
        }, 5000);
      }

      // Send to callback for external handling
      onSOSAlert?.(alert);

      // Send to callback for map display
      onSOSLocationReceived?.(sosLocation);

      // Share location internally (no external apps)
      await shareLocationInternally(sosLocation, emergencyMessage);

      // Start continuous location tracking
      startLocationTracking(alert.id);

      // Play sound if enabled
      if (soundEnabled) {
        try {
          const audio = new Audio(
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvWoeCD2a0+/CcSIFNJDE7tuJOAUWZLXq3Y9KCQ9Tr+Wqbh0JaKzqwW0gBjuPzuyJQQgPUbfj3p1eFApLoOFvqKgBCmKrz7iFQAhGjO/BQQgJQbXZ2Y1JCApPrbZhJ1SBmm1iqXMdCD+W0O/DcyQEKX7J8N6POQsVYLjt3p1VFwpKmuByrWUdCTuV0+/DdCQEL3fI8dmRQQUVXrLt35ZTFw1PpeBprd2MCwZfpNjewGwdB0Kf0O+7ayUILnrC8d+OQA0S",
          );
          audio.play().catch(() => console.log("Could not play alert sound"));
        } catch (error) {
          console.log("Alert sound failed:", error);
        }
      }

      // Show SOS notification with location and actions
      if (activeAlert) {
        unifiedNotifications.sos({
          title: "🚨 Emergency Alert Sent",
          message: "Location shared and tracking active. Help is on the way.",
          location: {
            latitude: activeAlert.location.latitude,
            longitude: activeAlert.location.longitude,
            address: activeAlert.location.address,
          },
          action: {
            label: "View Location",
            onClick: () => {
              if (activeAlert?.location && onStartNavigation) {
                onStartNavigation(activeAlert.location);
              }
            },
          },
          secondaryAction: {
            label: "Share Update",
            onClick: async () => {
              await shareLocationInternally(
                activeAlert.location,
                "Emergency update: Still need assistance",
              );
            },
          },
        });
      }
    } catch (error) {
      console.error("Error sending SOS alert:", error);
      unifiedNotifications.error(
        `Failed to send emergency alert: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setSending(false);
    }
  };

  const handleSOSPress = () => {
    if (sosPressed || sending || sosActive) return;

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

  const cancelSOS = () => {
    setSOSPressed(false);
    setCountdown(0);
  };

  const stopActiveAlert = async () => {
    if (!activeAlert) return;

    try {
      // Stop all monitoring and tracking
      stopHeartbeat();

      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
        setLocationUpdateInterval(null);
      }

      // Stop sound alarm
      if (soundAlarmActive) {
        setSoundAlarmActive(false);
        if (alarmAudio.current) {
          alarmAudio.current.pause();
          alarmAudio.current.currentTime = 0;
        }
      }

      // Turn off flashlight
      if (flashlightActive) {
        setFlashlightActive(false);
      }

      // Send cancellation message
      const cancelMessage = `✅ SOS CANCELLED: ${userProfile?.displayName || "User"} is now safe. Emergency situation resolved at ${new Date().toLocaleString()}.\n\nFinal location was: ${activeAlert.location.address || `${activeAlert.location.latitude.toFixed(6)}, ${activeAlert.location.longitude.toFixed(6)}`}`;
      await copyToClipboard(cancelMessage);

      // Immediately clear the alert (no delay)
      setActiveAlert(null);
      setSOSActive(false);

      unifiedNotifications.success("SOS cancelled - all monitoring stopped", {
        action: {
          label: "Send Update",
          onClick: () => {
            navigator.clipboard?.writeText(cancelMessage);
            unifiedNotifications.info(
              "Cancellation message copied to clipboard",
            );
          },
        },
      });
    } catch (error) {
      console.error("Failed to stop SOS alert:", error);
      unifiedNotifications.error("Failed to cancel SOS alert");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Active SOS Alert Display */}
      <AnimatePresence>
        {activeAlert && activeAlert.status === "active" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 z-50"
          >
            <Card className="border-red-500 bg-red-50 shadow-2xl">
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-red-700 flex items-center gap-2 pr-8">
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                  SOS ACTIVE - Emergency Alert Sent
                </CardTitle>
                <Button
                  onClick={stopActiveAlert}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-red-600 space-y-1">
                  <p>📍 Location: {activeAlert.location.address}</p>
                  <p>
                    🕐 Started: {activeAlert.timestamp.toLocaleTimeString()}
                  </p>
                  <p>
                    📱 Battery: {batteryLevel}%{" "}
                    {activeAlert.batteryCritical && "��️ Critical"}
                  </p>
                  <p>
                    🚨 Type:{" "}
                    {activeAlert.emergencyType.replace("_", " ").toUpperCase()}
                  </p>
                  <p>
                    📡{" "}
                    {heartbeatActive
                      ? "Monitoring active"
                      : "Monitoring stopped"}
                  </p>
                  {activeAlert.lastHeartbeat && (
                    <p>
                      🔎 Last update:{" "}
                      {activeAlert.lastHeartbeat.toLocaleTimeString()}
                    </p>
                  )}
                </div>
                {/* Emergency Type Selector */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Emergency Type:
                  </label>
                  <select
                    value={emergencyType}
                    onChange={(e) => setEmergencyType(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={activeAlert?.status === "active"}
                  >
                    <option value="general">General Emergency</option>
                    <option value="medical">Medical Emergency</option>
                    <option value="personal_safety">Personal Safety</option>
                    <option value="accident">Accident</option>
                    <option value="natural_disaster">Natural Disaster</option>
                  </select>
                </div>

                {/* Emergency Controls */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button
                    onClick={toggleSoundAlarm}
                    variant={soundAlarmActive ? "default" : "outline"}
                    size="sm"
                    className={
                      soundAlarmActive
                        ? "bg-orange-600 hover:bg-orange-700"
                        : ""
                    }
                  >
                    {soundAlarmActive ? (
                      <Volume2 className="h-4 w-4 mr-1" />
                    ) : (
                      <VolumeX className="h-4 w-4 mr-1" />
                    )}
                    {soundAlarmActive ? "Stop Alarm" : "Sound Alarm"}
                  </Button>
                  <Button
                    onClick={toggleFlashlight}
                    variant={flashlightActive ? "default" : "outline"}
                    size="sm"
                    className={
                      flashlightActive
                        ? "bg-yellow-600 hover:bg-yellow-700"
                        : ""
                    }
                  >
                    🔦 {flashlightActive ? "Turn Off" : "Flashlight"}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (activeAlert?.location && onStartNavigation) {
                        onStartNavigation(activeAlert.location);
                        unifiedNotifications.success(
                          "Navigation started to emergency location",
                        );
                      }
                    }}
                    variant="default"
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate There
                  </Button>
                  <Button
                    onClick={async () => {
                      const current = await getCurrentLocation();
                      const name = await getLocationName(
                        current.latitude,
                        current.longitude,
                      );
                      const msg = `📍 Current Location: ${name}\nCoordinates: ${current.latitude.toFixed(6)}, ${current.longitude.toFixed(6)}\nTime: ${new Date().toLocaleString()}`;
                      await copyToClipboard(msg);
                      unifiedNotifications.success("Current location copied");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    onClick={stopActiveAlert}
                    variant="destructive"
                    size="sm"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Button */}
      <div className="flex justify-center">
        <motion.button
          onClick={sosPressed ? cancelSOS : handleSOSPress}
          disabled={sending}
          className={cn(
            "relative w-20 h-20 rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg transition-all duration-300",
            sosPressed
              ? "bg-yellow-500 animate-pulse scale-110"
              : sosActive
                ? "bg-red-600 animate-pulse"
                : "bg-red-500 hover:bg-red-600 hover:scale-105",
            sending && "opacity-50 cursor-not-allowed",
          )}
          whileHover={{ scale: sosPressed || sosActive ? 1.1 : 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {sosPressed && (
            <div className="absolute inset-0 rounded-full border-4 border-yellow-300 animate-ping" />
          )}
          {sosActive && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-pulse" />
          )}

          <div className="relative z-10 flex flex-col items-center">
            {sosPressed ? (
              <>
                <div className="text-2xl font-bold">{countdown}</div>
                <span className="text-xs">Cancel</span>
              </>
            ) : sosActive ? (
              <>
                <StopCircle className="h-6 w-6 mb-1" />
                <span className="text-xs">STOP</span>
              </>
            ) : sending ? (
              <>
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full mb-1" />
                <span className="text-xs">Sending</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6 mb-1" />
                <span className="text-xs">SOS</span>
              </>
            )}
          </div>
        </motion.button>
      </div>

      {/* Settings */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={() => setSoundEnabled(!soundEnabled)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
          Sound {soundEnabled ? "On" : "Off"}
        </Button>
      </div>

      {/* Instructions */}
      {!sosActive && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-800 mb-2">How to Use SOS</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Press and hold SOS button for 3 seconds</li>
              <li>
                • Your location will be shared internally (no external apps)
              </li>
              <li>• Message is copied to clipboard - send to your contacts</li>
              <li>• Location updates automatically every 30 seconds</li>
              <li>• Your location appears on the map for easy viewing</li>
              <li>• Press "Stop SOS" to cancel the emergency alert</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
