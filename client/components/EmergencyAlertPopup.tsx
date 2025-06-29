import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Phone,
  Navigation,
  MapPin,
  MessageSquare,
  X,
  Clock,
  Shield,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafetyMap } from "@/components/SafetyMap";
import { cn } from "@/lib/utils";

interface EmergencyAlert {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromGuardianKey: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp: Date;
  type: "manual" | "automatic" | "voice";
  status: "active" | "acknowledged" | "resolved";
}

interface EmergencyAlertPopupProps {
  alert: EmergencyAlert;
  onAcknowledge: (alertId: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export function EmergencyAlertPopup({
  alert,
  onAcknowledge,
  onClose,
  isVisible,
}: EmergencyAlertPopupProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - alert.timestamp.getTime()) / 1000,
      );
      setTimeElapsed(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, alert.timestamp]);

  // Auto-start navigation if location is available
  useEffect(() => {
    if (isVisible && alert.location && !isNavigating) {
      setIsNavigating(true);
      setShowMap(true);

      // Try to open in Google Maps app/website
      const url = `https://www.google.com/maps/dir/?api=1&destination=${alert.location.latitude},${alert.location.longitude}&travelmode=driving`;

      // For mobile devices, try to open the native maps app
      if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/)) {
        window.open(url, "_blank");
      } else {
        // For desktop, show in our map component
        setShowMap(true);
      }
    }
  }, [isVisible, alert.location, isNavigating]);

  const handleCall = () => {
    // In a real app, you'd get the phone number from the user profile
    window.location.href = `tel:911`; // Emergency services
  };

  const handleMessage = () => {
    const message = `I received your emergency alert. Are you safe? I'm on my way to help.`;
    // In a real app, you'd send this through your messaging system
    console.log("Sending message:", message);
  };

  const handleAcknowledge = () => {
    onAcknowledge(alert.id);
  };

  const formatTimeElapsed = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  const getAlertIcon = () => {
    switch (alert.type) {
      case "voice":
        return "🎤";
      case "automatic":
        return "🤖";
      default:
        return "🚨";
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 border-4 border-emergency shadow-2xl animate-pulse-slow">
        <CardHeader className="bg-gradient-to-r from-emergency/10 to-emergency/20 border-b border-emergency/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-full bg-emergency/20 animate-pulse">
                <AlertTriangle className="h-6 w-6 text-emergency" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span>🚨 EMERGENCY ALERT</span>
                  <span className="text-xl">{getAlertIcon()}</span>
                </div>
                <p className="text-sm font-normal text-muted-foreground">
                  {formatTimeElapsed(timeElapsed)}
                </p>
              </div>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Alert Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emergency/20 border-2 border-emergency/30 flex items-center justify-center">
                <span className="text-lg font-bold text-emergency">
                  {alert.fromUserName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{alert.fromUserName}</h3>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emergency/20 text-emergency">
                    {alert.type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Guardian: {alert.fromGuardianKey.slice(-6)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/20 rounded-lg border-l-4 border-l-emergency">
              <p className="font-medium mb-2">Emergency Message:</p>
              <p className="text-sm">{alert.message}</p>
            </div>
          </div>

          {/* Location Info */}
          {alert.location && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Location Available</span>
                <Badge className="bg-safe/20 text-safe text-xs">GPS</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Coordinates: {alert.location.latitude.toFixed(4)},{" "}
                {alert.location.longitude.toFixed(4)}
                {alert.location.accuracy && (
                  <span className="block">
                    Accuracy: ±{Math.round(alert.location.accuracy)}m
                  </span>
                )}
              </div>

              {/* Mini Map */}
              {showMap && (
                <div className="h-32 rounded-lg overflow-hidden border">
                  <SafetyMap
                    userLocation={{
                      lat: alert.location.latitude,
                      lng: alert.location.longitude,
                    }}
                    emergencyMode={true}
                    className="h-full"
                  />
                </div>
              )}
            </div>
          )}

          {/* Navigation Status */}
          {isNavigating && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary animate-pulse" />
                <span className="font-medium text-primary">
                  Navigation Started
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Route to emergency location has been opened in your maps app
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCall}
                className="bg-emergency hover:bg-emergency/90 text-emergency-foreground font-bold"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call 911
              </Button>
              <Button
                onClick={() => {
                  if (alert.location) {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${alert.location.latitude},${alert.location.longitude}&travelmode=driving`;
                    window.open(url, "_blank");
                  }
                }}
                variant="outline"
                className="border-2 border-primary hover:bg-primary hover:text-primary-foreground font-bold"
                disabled={!alert.location}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate
              </Button>
            </div>

            <Button
              onClick={handleMessage}
              variant="outline"
              className="w-full border-2 border-safe hover:bg-safe hover:text-safe-foreground"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>

            <Button
              onClick={handleAcknowledge}
              className="w-full bg-safe hover:bg-safe/90 text-safe-foreground font-bold"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Acknowledge Alert
            </Button>
          </div>

          {/* Alert Status */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Alert ID: {alert.id.slice(-8)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Guardian Protected</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
