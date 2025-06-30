import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Mic,
  Activity,
  MapPin,
  Phone,
  Shield,
  Volume2,
} from "lucide-react";
import {
  useDeviceMotion,
  useVoiceActivation,
  useGeolocation,
  useHapticFeedback,
} from "@/hooks/use-device-apis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface EmergencyDetectionProps {
  onEmergencyTriggered: (type: string, data?: any) => void;
}

export function EmergencyDetection({
  onEmergencyTriggered,
}: EmergencyDetectionProps) {
  const { motion, isShaking, requestPermission } = useDeviceMotion();
  const {
    isListening,
    transcript,
    isSupported: voiceSupported,
    startListening,
    stopListening,
  } = useVoiceActivation();
  const { location, getCurrentLocation, startTracking, stopTracking } =
    useGeolocation();
  const { emergencyVibration, successVibration, warningVibration } =
    useHapticFeedback();

  const [emergencyMode, setEmergencyMode] = useState(false);
  const [detectionEnabled, setDetectionEnabled] = useState(false);
  const [sosCountdown, setSOSCountdown] = useState(0);
  const [lastShakeTime, setLastShakeTime] = useState(0);

  // Handle shake detection
  useEffect(() => {
    if (isShaking && detectionEnabled) {
      const now = Date.now();
      if (now - lastShakeTime > 3000) {
        setLastShakeTime(now);
        warningVibration();
        triggerEmergency("shake", { motion, timestamp: now });
      }
    }
  }, [isShaking, detectionEnabled, lastShakeTime, motion, warningVibration]);

  // Handle voice emergency
  useEffect(() => {
    const handleVoiceEmergency = (event: CustomEvent) => {
      if (detectionEnabled) {
        emergencyVibration();
        triggerEmergency("voice", event.detail);
      }
    };

    window.addEventListener("voiceEmergency", handleVoiceEmergency as any);
    return () =>
      window.removeEventListener("voiceEmergency", handleVoiceEmergency as any);
  }, [detectionEnabled, emergencyVibration]);

  const triggerEmergency = useCallback(
    (type: string, data?: any) => {
      setEmergencyMode(true);
      emergencyVibration();
      setSOSCountdown(5);

      const countdownInterval = setInterval(() => {
        setSOSCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            onEmergencyTriggered(type, data);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-get location when emergency triggered
      getCurrentLocation().catch(console.error);
    },
    [onEmergencyTriggered, emergencyVibration, getCurrentLocation],
  );

  const cancelEmergency = useCallback(() => {
    setEmergencyMode(false);
    setSOSCountdown(0);
    successVibration();
  }, [successVibration]);

  const enableDetection = async () => {
    try {
      await requestPermission();
      setDetectionEnabled(true);
      startTracking();
      startListening();
      successVibration();
    } catch (error) {
      console.error("Failed to enable detection:", error);
    }
  };

  const disableDetection = () => {
    setDetectionEnabled(false);
    stopTracking();
    stopListening();
    successVibration();
  };

  const shareLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      const shareData = {
        title: "Guardian Emergency Location",
        text: `Emergency location: https://maps.google.com/?q=${loc.latitude},${loc.longitude}`,
        url: `https://maps.google.com/?q=${loc.latitude},${loc.longitude}`,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (shareError) {
          await copyTextSafe(shareData.text);
          alert("Location copied to clipboard");
        }
      } else {
        await copyTextSafe(shareData.text);
        alert("Location copied to clipboard");
      }
      successVibration();
    } catch (error) {
      console.error("Failed to share location:", error);
    }
  };

  // Safe copy function
  const copyTextSafe = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback method
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error("Copy failed:", error);
      prompt("Please copy this manually:", text);
    }
  };

  const callEmergency = () => {
    window.location.href = "tel:911";
    emergencyVibration();
  };

  if (emergencyMode && sosCountdown > 0) {
    return (
      <Card className="border-emergency bg-emergency/5">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="animate-pulse">
              <AlertTriangle className="h-16 w-16 text-emergency mx-auto" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emergency">
                EMERGENCY ALERT
              </h2>
              <p className="text-lg">Sending alert in {sosCountdown} seconds</p>
            </div>
            <Progress
              value={((5 - sosCountdown) / 5) * 100}
              className="w-full"
            />
            <Button
              onClick={cancelEmergency}
              variant="outline"
              className="border-emergency text-emergency hover:bg-emergency hover:text-emergency-foreground"
            >
              CANCEL ALERT
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Detection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Emergency Detection
            <Badge
              variant={detectionEnabled ? "default" : "secondary"}
              className={detectionEnabled ? "bg-safe text-safe-foreground" : ""}
            >
              {detectionEnabled ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!detectionEnabled ? (
            <Button onClick={enableDetection} className="w-full">
              Enable Smart Detection
            </Button>
          ) : (
            <Button
              onClick={disableDetection}
              variant="outline"
              className="w-full"
            >
              Disable Detection
            </Button>
          )}

          {detectionEnabled && (
            <div className="grid grid-cols-2 gap-3">
              {/* Motion Detection */}
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <Activity
                  className={cn(
                    "h-6 w-6 mx-auto mb-2",
                    isShaking ? "text-warning animate-bounce" : "text-safe",
                  )}
                />
                <p className="text-xs font-medium">Motion</p>
                <p className="text-xs text-muted-foreground">
                  {isShaking ? "Shake detected!" : "Monitoring"}
                </p>
              </div>

              {/* Voice Detection */}
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <Mic
                  className={cn(
                    "h-6 w-6 mx-auto mb-2",
                    isListening
                      ? "text-primary animate-pulse"
                      : "text-muted-foreground",
                  )}
                />
                <p className="text-xs font-medium">Voice</p>
                <p className="text-xs text-muted-foreground">
                  {isListening ? "Listening..." : "Ready"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={shareLocation}
          variant="outline"
          className="h-16 flex-col gap-1"
        >
          <MapPin className="h-5 w-5" />
          <span className="text-xs">Share Location</span>
        </Button>

        <Button
          onClick={callEmergency}
          className="h-16 flex-col gap-1 bg-emergency hover:bg-emergency/90 text-emergency-foreground"
        >
          <Phone className="h-5 w-5" />
          <span className="text-xs">Call 911</span>
        </Button>
      </div>

      {/* Location Status */}
      {location && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-safe" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Location Available</p>
                <p className="text-xs text-muted-foreground truncate">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                GPS
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Transcript */}
      {transcript && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Volume2 className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Voice Activity</p>
                <p className="text-xs text-muted-foreground">{transcript}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
