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
import { toast } from "sonner";

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
  className?: string;
}

export function EnhancedSOSSystem({
  onSOSLocationReceived,
  onSOSAlert,
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

  // Store active intervals for cleanup
  const [locationUpdateInterval, setLocationUpdateInterval] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup intervals on unmount
    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
    };
  }, [locationUpdateInterval]);

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

      // Create SOS alert object
      const alert: SOSAlert = {
        id: `sos_${Date.now()}`,
        userId: currentUser.uid,
        userName: userProfile.displayName || "Emergency User",
        message: emergencyMessage,
        location: sosLocation,
        timestamp: new Date(),
        status: "active",
        responses: [],
      };

      setActiveAlert(alert);
      setSOSActive(true);

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

      toast.success(
        "🚨 Emergency alert sent! Continuous location sharing activated.",
        {
          duration: 10000,
        },
      );

      addNotification({
        type: "error", // Use error type for high visibility
        title: "🚨 SOS ACTIVE",
        message: `Emergency alert sent. Location updates every 30 seconds. Tap to copy current location.`,
        persistent: true,
        action: {
          label: "Copy Location",
          onClick: async () => {
            const current = await getCurrentLocation();
            const name = await getLocationName(
              current.latitude,
              current.longitude,
            );
            const msg = `📍 Current Location: ${name}\nCoordinates: ${current.latitude.toFixed(6)}, ${current.longitude.toFixed(6)}\nTime: ${new Date().toLocaleString()}`;
            await copyToClipboard(msg);
            toast.success("Current location copied");
          },
        },
      });
    } catch (error) {
      console.error("Error sending SOS alert:", error);
      toast.error(
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
      // Stop location tracking
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
        setLocationUpdateInterval(null);
      }

      // Update alert status
      const updatedAlert = { ...activeAlert, status: "cancelled" as const };
      setActiveAlert(updatedAlert);
      setSOSActive(false);

      // Send cancellation message
      const cancelMessage = `✅ SOS CANCELLED: ${userProfile?.displayName || "User"} is now safe. Emergency situation resolved at ${new Date().toLocaleString()}.`;
      await copyToClipboard(cancelMessage);

      toast.success(
        "SOS alert cancelled - please send the cancellation message to your contacts",
      );
      addNotification({
        type: "success",
        title: "SOS Cancelled",
        message:
          "Cancellation message copied to clipboard. Send to your emergency contacts.",
      });

      // Clear active alert after a delay
      setTimeout(() => {
        setActiveAlert(null);
      }, 5000);
    } catch (error) {
      console.error("Failed to stop SOS alert:", error);
      toast.error("Failed to cancel SOS alert");
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
              <CardHeader className="pb-2">
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                  SOS ACTIVE - Emergency Alert Sent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-red-600">
                  <p>📍 Location: {activeAlert.location.address}</p>
                  <p>
                    🕐 Started: {activeAlert.timestamp.toLocaleTimeString()}
                  </p>
                  <p>📡 Updating location every 30 seconds</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={stopActiveAlert}
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop SOS
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
                      toast.success("Current location copied");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Location
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
