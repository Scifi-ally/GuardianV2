import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  Phone,
  Check,
  X,
  Clock,
  MessageSquare,
} from "lucide-react";
import {
  SOSService,
  type SOSAlert,
  type SOSResponse,
} from "@/services/sosService";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/use-device-apis";
import { cn } from "@/lib/utils";

interface SOSNotificationPanelProps {
  alert: SOSAlert;
  onClose: () => void;
  className?: string;
}

export function SOSNotificationPanel({
  alert,
  onClose,
  className,
}: SOSNotificationPanelProps) {
  const [responses, setResponses] = useState<SOSResponse[]>([]);
  const [responding, setResponding] = useState(false);
  const { userProfile } = useAuth();
  const { getCurrentLocation } = useGeolocation();

  useEffect(() => {
    if (!alert.id) return;

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = SOSService.subscribeToSOSResponses(alert.id, setResponses);
    } catch (error) {
      console.warn("Failed to subscribe to SOS responses:", error);
      setResponses([]);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn("Error unsubscribing from SOS responses:", error);
        }
      }
    };
  }, [alert.id]);

  const handleResponse = async (response: SOSResponse["response"]) => {
    if (!alert.id || !userProfile) return;

    setResponding(true);
    try {
      const location = await getCurrentLocation().catch(() => undefined);

      await SOSService.respondToSOS(
        alert.id,
        userProfile.uid,
        userProfile.displayName,
        response,
        undefined,
        location,
      );
    } catch (error) {
      console.error("Error responding to SOS:", error);
    } finally {
      setResponding(false);
    }
  };

  const handleNavigate = async () => {
    if (!alert.location) return;

    try {
      // Get current location first
      const currentLocation = await getCurrentLocation();

      // Create navigation URL with both from and to locations
      const fromLat = currentLocation.latitude;
      const fromLng = currentLocation.longitude;
      const toLat = alert.location.latitude;
      const toLng = alert.location.longitude;

      // Use internal navigation within the app
      const routeInfo = `Route from ${fromLat.toFixed(6)}, ${fromLng.toFixed(6)} to ${toLat.toFixed(6)}, ${toLng.toFixed(6)}`;

      // Copy route info to clipboard
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(
            `Navigate to: ${toLat.toFixed(6)}, ${toLng.toFixed(6)}`,
          );
        }
        window.alert(
          `Navigation info copied to clipboard:\n${routeInfo}\n\nUse your preferred navigation app.`,
        );
      } catch (error) {
        window.alert(
          `Navigate to:\n${toLat.toFixed(6)}, ${toLng.toFixed(6)}\n\nUse your preferred navigation app.`,
        );
      }

      // Also respond that we're navigating
      if (userProfile && alert.id) {
        // Convert LocationData to GeolocationPosition format
        const geolocationPosition: GeolocationPosition | undefined =
          currentLocation
            ? {
                coords: {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  accuracy: currentLocation.accuracy,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                  toJSON: () => ({
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    accuracy: currentLocation.accuracy,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                  }),
                },
                timestamp: currentLocation.timestamp,
                toJSON: () => ({
                  coords: {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    accuracy: currentLocation.accuracy,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                  },
                  timestamp: currentLocation.timestamp,
                }),
              }
            : undefined;

        await SOSService.respondToSOS(
          alert.id,
          userProfile.uid,
          userProfile.displayName,
          "enroute",
          "Navigating to your location",
          geolocationPosition,
        );
      }
    } catch (error) {
      console.error("Error getting current location for navigation:", error);

      // Fallback: just navigate to destination without current location
      const { latitude, longitude } = alert.location;

      // Copy destination to clipboard
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(
            `Navigate to: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          );
        }
        window.alert(
          `Destination copied to clipboard:\n${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nUse your preferred navigation app.`,
        );
      } catch (error) {
        window.alert(
          `Navigate to:\n${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nUse your preferred navigation app.`,
        );
      }
    }
  };

  const handleCall = () => {
    // In a real app, you'd call the sender's phone number
    console.log("Calling emergency contact...");
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-warning/20 text-warning-foreground",
    high: "bg-emergency/20 text-emergency-foreground",
    critical: "bg-emergency text-emergency-foreground animate-pulse",
  };

  const userResponse = responses.find(
    (r) => r.responderId === userProfile?.uid,
  );

  return (
    <Card
      className={cn(
        "border-l-4 shadow-lg",
        alert.priority === "critical"
          ? "border-l-emergency animate-pulse"
          : "border-l-warning",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emergency/10">
              <AlertTriangle className="h-5 w-5 text-emergency" />
            </div>
            <div>
              <CardTitle className="text-lg text-emergency">
                Emergency Alert
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={priorityColors[alert.priority]}>
                  {alert.priority.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {timeAgo(alert.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            aria-label="Close emergency alert"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sender Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {alert.senderName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{alert.senderName}</p>
            <p className="text-sm text-muted-foreground">
              Key: {alert.senderKey}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {alert.type}
          </Badge>
        </div>

        {/* Message */}
        <div className="p-3 bg-muted/20 rounded-lg">
          <p className="text-sm">{alert.message}</p>
        </div>

        {/* Location */}
        {alert.location && (
          <div className="flex items-center gap-2 p-3 bg-safe/10 rounded-lg">
            <MapPin className="h-4 w-4 text-safe" />
            <div className="flex-1">
              <p className="text-sm font-medium">Location Available</p>
              <p className="text-xs text-muted-foreground">
                {alert.location.latitude.toFixed(6)},{" "}
                {alert.location.longitude.toFixed(6)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleNavigate}
              className="h-8 bg-safe hover:bg-safe/90"
            >
              <Navigation className="h-3 w-3 mr-1" />
              Navigate
            </Button>
          </div>
        )}

        {/* Response Buttons */}
        {!userResponse && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleResponse("acknowledged")}
              disabled={responding}
              className="h-10"
            >
              <Check className="h-4 w-4 mr-2" />
              Acknowledge
            </Button>
            <Button
              onClick={() => handleResponse("enroute")}
              disabled={responding}
              variant="outline"
              className="h-10 border-safe text-safe hover:bg-safe hover:text-safe-foreground"
            >
              <Navigation className="h-4 w-4 mr-2" />
              On Way
            </Button>
          </div>
        )}

        {/* User's Response Status */}
        {userResponse && (
          <div className="p-3 bg-safe/10 rounded-lg border border-safe/20">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-safe" />
              <span className="text-sm font-medium">
                You responded: {userResponse.response}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {timeAgo(userResponse.timestamp)}
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleCall}
            size="sm"
            variant="outline"
            className="flex-1 border-emergency text-emergency hover:bg-emergency hover:text-emergency-foreground"
          >
            <Phone className="h-3 w-3 mr-2" />
            Call
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <MessageSquare className="h-3 w-3 mr-2" />
            Message
          </Button>
        </div>

        {/* Other Responses */}
        {responses.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Other Responses:</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {responses
                .filter((r) => r.responderId !== userProfile?.uid)
                .map((response, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs p-2 bg-muted/20 rounded"
                  >
                    <span>{response.responderName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {response.response}
                      </Badge>
                      <span className="text-muted-foreground">
                        {timeAgo(response.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
