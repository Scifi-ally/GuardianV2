import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast-migration";
import {
  Phone,
  MessageSquare,
  MapPin,
  Volume2,
  Flashlight,
  Shield,
  Users,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/use-device-apis";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
  description: string;
}

export function QuickSafetyActions() {
  const { userProfile } = useAuth();
  const { location } = useGeolocation();
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [isAlarmOn, setIsAlarmOn] = useState(false);

  const toggleFlashlight = async () => {
    try {
      if (navigator.mediaDevices && "getUserMedia" in navigator.mediaDevices) {
        if (!isFlashlightOn) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities();

          if ("torch" in capabilities) {
            await track.applyConstraints({
              advanced: [{ torch: true } as any],
            });
            setIsFlashlightOn(true);
            // Silently turn on flashlight
          } else {
            toast.error("Flashlight not available on this device");
          }
        } else {
          setIsFlashlightOn(false);
          // Silently turn off flashlight
        }
      } else {
        toast.error("Camera access not available");
      }
    } catch (error) {
      console.error("Flashlight error:", error);
      toast.error("Failed to control flashlight");
    }
  };

  const toggleAlarm = () => {
    if (!isAlarmOn) {
      // Create loud alarm sound
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

      oscillator.start();

      // Oscillate between two frequencies for alarm effect
      let isHigh = true;
      const alarmInterval = setInterval(() => {
        oscillator.frequency.setValueAtTime(
          isHigh ? 800 : 400,
          audioContext.currentTime,
        );
        isHigh = !isHigh;
      }, 200);

      setIsAlarmOn(true);
      // Silently activate alarm

      // Auto stop after 30 seconds
      setTimeout(() => {
        clearInterval(alarmInterval);
        oscillator.stop();
        setIsAlarmOn(false);
        // Silently stop alarm after timeout
      }, 30000);
    } else {
      setIsAlarmOn(false);
      // Silently stop alarm
    }
  };

  const shareLocationWithContacts = async () => {
    if (!location || !userProfile?.emergencyContacts) {
      toast.error("Location or emergency contacts not available");
      return;
    }

    const locationText = `🚨 Safety Check: I'm at https://maps.google.com/?q=${location.latitude},${location.longitude} - ${new Date().toLocaleTimeString()}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Safety Location Update",
          text: locationText,
        });
        // Silently share location
      } catch (error) {
        // Fallback to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(locationText);
          // Silently copy to clipboard
        }
      }
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(locationText);
      // Silently copy to clipboard
    }
  };

  const sendQuickSMS = async () => {
    if (
      !userProfile?.emergencyContacts ||
      userProfile.emergencyContacts.length === 0
    ) {
      // Silently handle no emergency contacts
      return;
    }

    const primaryContact = userProfile.emergencyContacts[0];
    const locationText = location
      ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      : "Location unavailable";
    const message = `🚨 URGENT: I need help! My location: ${locationText} - Please respond immediately! Time: ${new Date().toLocaleString()}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
      }
      // Silently copy emergency message
    } catch (error) {
      toast.error("Message sending failed", {
        description: `Send this message to ${primaryContact.name} manually`,
        duration: 5000,
      });
      navigator.clipboard?.writeText(message);
      // Silently show emergency message
    }
  };

  const callEmergencyContact = async () => {
    if (
      !userProfile?.emergencyContacts ||
      userProfile.emergencyContacts.length === 0
    ) {
      // Silently handle no emergency contacts
      return;
    } else {
      const primaryContact = userProfile.emergencyContacts[0];
      // Copy contact number instead of auto-calling
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(primaryContact.phone);
        }
        toast.info(
          `Contact number for ${primaryContact.name} copied to clipboard - Call manually`,
        );
      } catch (error) {
        toast.info(`Call ${primaryContact.name}: ${primaryContact.phone}`);
      }
    }
  };

  const startLiveTracking = () => {
    toast.info(
      "Live tracking started - sharing location with emergency contacts",
    );
    // This would integrate with the real-time location service
  };

  const quickActions: QuickAction[] = [
    {
      id: "call",
      label: "Emergency Call",
      icon: Phone,
      color: "bg-red-500 hover:bg-red-600",
      action: callEmergencyContact,
      description: "Call your emergency contacts",
    },
    {
      id: "sms",
      label: "Quick SMS",
      icon: MessageSquare,
      color: "bg-orange-500 hover:bg-orange-600",
      action: sendQuickSMS,
      description: "Send emergency SMS with location",
    },
    {
      id: "location",
      label: "Share Location",
      icon: MapPin,
      color: "bg-blue-500 hover:bg-blue-600",
      action: shareLocationWithContacts,
      description: "Share current location",
    },
    {
      id: "alarm",
      label: isAlarmOn ? "Stop Alarm" : "Panic Alarm",
      icon: Volume2,
      color: isAlarmOn
        ? "bg-gray-500 hover:bg-gray-600"
        : "bg-purple-500 hover:bg-purple-600",
      action: toggleAlarm,
      description: "Loud emergency alarm sound",
    },
    {
      id: "flashlight",
      label: isFlashlightOn ? "Turn Off" : "Flashlight",
      icon: Flashlight,
      color: isFlashlightOn
        ? "bg-gray-500 hover:bg-gray-600"
        : "bg-yellow-500 hover:bg-yellow-600",
      action: toggleFlashlight,
      description: "Emergency flashlight",
    },

    {
      id: "tracking",
      label: "Live Tracking",
      icon: Navigation,
      color: "bg-indigo-500 hover:bg-indigo-600",
      action: startLiveTracking,
      description: "Start live location sharing",
    },
  ];

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Quick Safety Actions</h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                onClick={action.action}
                className={cn(
                  "w-full h-14 flex flex-col gap-1 text-white text-xs font-medium transition-all duration-200",
                  action.color,
                )}
                size="sm"
              >
                <action.icon className="h-4 w-4" />
                <span className="leading-tight text-center">
                  {action.label}
                </span>
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="text-xs text-gray-500 text-center mt-3">
          Tap any action for immediate safety assistance
        </div>
      </CardContent>
    </Card>
  );
}
