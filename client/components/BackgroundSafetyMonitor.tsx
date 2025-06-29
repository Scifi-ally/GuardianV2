import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Shield, Activity, MapPin } from "lucide-react";
import { useVoiceActivation, useGeolocation } from "@/hooks/use-device-apis";
import { useAuth } from "@/contexts/AuthContext";
import { SOSService } from "@/services/sosService";
import { cn } from "@/lib/utils";

interface BackgroundSafetyMonitorProps {
  onEmergencyDetected?: (type: string) => void;
  className?: string;
}

export function BackgroundSafetyMonitor({
  onEmergencyDetected,
  className,
}: BackgroundSafetyMonitorProps) {
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(
    null,
  );
  const [safetyServices, setSafetyServices] = useState({
    voiceActivation: false,
    locationTracking: false,
    emergencyDetection: true,
    backgroundMonitoring: true,
  });

  const { userProfile } = useAuth();
  const { location, isTracking } = useGeolocation();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: voiceSupported,
  } = useVoiceActivation();

  // Voice activation for emergency keywords with proper state management
  useEffect(() => {
    if (safetyServices.voiceActivation && voiceSupported) {
      if (!isListening && !isVoiceListening) {
        startListening();
        setIsVoiceListening(true);
      }
    } else if (!safetyServices.voiceActivation) {
      if (isListening || isVoiceListening) {
        stopListening();
        setIsVoiceListening(false);
      }
    }
  }, [safetyServices.voiceActivation, voiceSupported]);

  // Sync local state with hook state
  useEffect(() => {
    setIsVoiceListening(isListening);
  }, [isListening]);

  // Monitor voice commands for emergency keywords
  useEffect(() => {
    if (transcript) {
      const emergencyKeywords = [
        "help me",
        "emergency",
        "call 911",
        "im in danger",
        "help",
        "sos",
        "call for help",
        "im scared",
        "danger",
      ];

      const transcriptLower = transcript.toLowerCase();
      const detectedKeyword = emergencyKeywords.find((keyword) =>
        transcriptLower.includes(keyword),
      );

      if (detectedKeyword) {
        console.log("Emergency keyword detected:", detectedKeyword);
        onEmergencyDetected?.("voice-activation");
        triggerVoiceEmergency(detectedKeyword);
      }
    }
  }, [transcript, onEmergencyDetected]);

  // Update location tracking status
  useEffect(() => {
    if (location) {
      setLastLocationUpdate(new Date());
      setSafetyServices((prev) => ({ ...prev, locationTracking: true }));
    }
  }, [location]);

  const triggerVoiceEmergency = useCallback(
    async (keyword: string) => {
      if (!userProfile) return;

      try {
        const locationData = location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              timestamp: new Date(),
            }
          : undefined;

        await SOSService.sendSOSAlert(
          userProfile.uid,
          userProfile.displayName,
          userProfile.guardianKey,
          userProfile.emergencyContacts,
          locationData,
          "voice-activation",
          `Voice emergency detected: "${keyword}". Automatic alert triggered.`,
        );
      } catch (error) {
        console.error("Failed to send voice-activated SOS:", error);
      }
    },
    [userProfile, location],
  );

  const toggleService = useCallback((service: keyof typeof safetyServices) => {
    setSafetyServices((prev) => ({
      ...prev,
      [service]: !prev[service],
    }));
  }, []);

  return (
    <Card
      className={cn(
        "border-primary/20 bg-gradient-to-r from-primary/5 to-safe/5",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/20">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Safety Monitor</h3>
              <p className="text-xs text-muted-foreground">
                Active background protection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                safetyServices.backgroundMonitoring ? "bg-safe" : "bg-muted",
              )}
            />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Voice Activation */}
          <div
            className={cn(
              "p-2 rounded-lg border cursor-pointer transition-all duration-200",
              safetyServices.voiceActivation
                ? "bg-primary/10 border-primary/30"
                : "bg-muted/30 border-border",
            )}
            onClick={() => toggleService("voiceActivation")}
          >
            <div className="flex items-center gap-2">
              <Mic
                className={cn(
                  "h-3 w-3",
                  safetyServices.voiceActivation
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
              <div className="flex-1">
                <p className="text-xs font-medium">Voice Alert</p>
                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      "w-1 h-1 rounded-full",
                      isVoiceListening
                        ? "bg-primary animate-pulse"
                        : "bg-muted",
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {voiceSupported
                      ? isVoiceListening
                        ? "Listening"
                        : "Ready"
                      : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Location Tracking */}
          <div
            className={cn(
              "p-2 rounded-lg border cursor-pointer transition-all duration-200",
              safetyServices.locationTracking
                ? "bg-safe/10 border-safe/30"
                : "bg-muted/30 border-border",
            )}
            onClick={() => toggleService("locationTracking")}
          >
            <div className="flex items-center gap-2">
              <MapPin
                className={cn(
                  "h-3 w-3",
                  safetyServices.locationTracking
                    ? "text-safe"
                    : "text-muted-foreground",
                )}
              />
              <div className="flex-1">
                <p className="text-xs font-medium">Location</p>
                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      "w-1 h-1 rounded-full",
                      isTracking ? "bg-safe animate-pulse" : "bg-muted",
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {lastLocationUpdate
                      ? `${Math.round((Date.now() - lastLocationUpdate.getTime()) / 1000)}s ago`
                      : "Getting..."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Detection */}
          <div
            className={cn(
              "p-2 rounded-lg border cursor-pointer transition-all duration-200",
              safetyServices.emergencyDetection
                ? "bg-warning/10 border-warning/30"
                : "bg-muted/30 border-border",
            )}
            onClick={() => toggleService("emergencyDetection")}
          >
            <div className="flex items-center gap-2">
              <Activity
                className={cn(
                  "h-3 w-3",
                  safetyServices.emergencyDetection
                    ? "text-warning"
                    : "text-muted-foreground",
                )}
              />
              <div className="flex-1">
                <p className="text-xs font-medium">Auto Detect</p>
                <span className="text-xs text-muted-foreground">
                  {safetyServices.emergencyDetection ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          {/* Background Monitor */}
          <div
            className={cn(
              "p-2 rounded-lg border cursor-pointer transition-all duration-200",
              safetyServices.backgroundMonitoring
                ? "bg-protection/10 border-protection/30"
                : "bg-muted/30 border-border",
            )}
            onClick={() => toggleService("backgroundMonitoring")}
          >
            <div className="flex items-center gap-2">
              <Shield
                className={cn(
                  "h-3 w-3",
                  safetyServices.backgroundMonitoring
                    ? "text-protection"
                    : "text-muted-foreground",
                )}
              />
              <div className="flex-1">
                <p className="text-xs font-medium">Guardian</p>
                <span className="text-xs text-muted-foreground">
                  {safetyServices.backgroundMonitoring
                    ? "Monitoring"
                    : "Paused"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {transcript && (
          <div className="mt-3 p-2 bg-muted/50 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Last heard:</p>
            <p className="text-xs font-mono">{transcript}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
