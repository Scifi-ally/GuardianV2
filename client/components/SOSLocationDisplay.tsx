import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  Clock,
  User,
  Copy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SOSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

interface SOSDisplayData {
  id: string;
  userId: string;
  userName: string;
  location: SOSLocation;
  message: string;
  status: "active" | "cancelled" | "resolved";
  lastUpdate: Date;
}

interface SOSLocationDisplayProps {
  sosLocations: SOSDisplayData[];
  map?: google.maps.Map | null;
  onNavigateToSOS?: (location: SOSLocation) => void;
  onDismissSOS?: (sosId: string) => void;
  onStartNavigation?: (location: SOSLocation) => void;
  className?: string;
}

export function SOSLocationDisplay({
  sosLocations,
  map,
  onNavigateToSOS,
  onDismissSOS,
  onStartNavigation,
  className,
}: SOSLocationDisplayProps) {
  const sosMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const [selectedSOS, setSelectedSOS] = useState<SOSDisplayData | null>(null);

  // Create SOS markers on the map
  useEffect(() => {
    if (!map || !window.google) return;

    const currentMarkers = sosMarkersRef.current;

    // Remove markers that are no longer in the list
    currentMarkers.forEach((marker, sosId) => {
      if (!sosLocations.find((sos) => sos.id === sosId)) {
        marker.setMap(null);
        currentMarkers.delete(sosId);
      }
    });

    // Add or update markers for current SOS locations
    sosLocations.forEach((sosData) => {
      let marker = currentMarkers.get(sosData.id);

      if (!marker) {
        // Create new marker
        marker = new google.maps.Marker({
          position: {
            lat: sosData.location.latitude,
            lng: sosData.location.longitude,
          },
          map: map,
          title: `🚨 Emergency: ${sosData.userName}`,
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#dc2626" stroke="#fff" stroke-width="4"/>
                <circle cx="20" cy="20" r="12" fill="#fca5a5" opacity="0.8"/>
                <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">⚠</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
          },
          animation: google.maps.Animation.BOUNCE,
          zIndex: 1000, // High z-index for visibility
        });

        // Add click listener
        marker.addListener("click", () => {
          setSelectedSOS(sosData);
          map.panTo(marker!.getPosition()!);
          map.setZoom(16);
        });

        currentMarkers.set(sosData.id, marker);
      } else {
        // Update existing marker position
        marker.setPosition({
          lat: sosData.location.latitude,
          lng: sosData.location.longitude,
        });
        marker.setTitle(`🚨 Emergency: ${sosData.userName}`);
      }

      // Update marker style based on status
      if (sosData.status === "cancelled" || sosData.status === "resolved") {
        marker.setIcon({
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#10b981" stroke="#fff" stroke-width="4"/>
              <circle cx="20" cy="20" r="12" fill="#86efac" opacity="0.8"/>
              <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">✓</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        });
        marker.setAnimation(null);
      } else {
        // Keep animation for active alerts
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
    });

    // Cleanup function
    return () => {
      currentMarkers.forEach((marker) => {
        marker.setMap(null);
      });
      currentMarkers.clear();
    };
  }, [map, sosLocations]);

  const copyLocationToClipboard = async (location: SOSLocation) => {
    const text = `📍 Emergency Location\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n${location.address ? `Address: ${location.address}\n` : ""}Time: ${new Date(location.timestamp).toLocaleString()}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
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
      }
      toast.success("Location copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy location");
    }
  };

  const navigateToLocation = (location: SOSLocation) => {
    if (map) {
      map.panTo({
        lat: location.latitude,
        lng: location.longitude,
      });
      map.setZoom(16);
    }
    onNavigateToSOS?.(location);
  };

  const startAutoNavigation = async (location: SOSLocation) => {
    try {
      // Start automatic navigation using the app's internal navigation
      onStartNavigation?.(location);

      // Also pan to location on map
      if (map) {
        map.panTo({
          lat: location.latitude,
          lng: location.longitude,
        });
        map.setZoom(17);
      }

      toast.success("Navigation started to emergency location");
    } catch (error) {
      console.error("Failed to start navigation:", error);
      toast.error("Failed to start navigation");
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return "Just now";
    }
  };

  if (sosLocations.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* SOS List Panel */}
      <div className="fixed top-20 right-4 z-40 max-w-sm space-y-2">
        <AnimatePresence>
          {sosLocations.map((sosData) => (
            <motion.div
              key={sosData.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="relative"
            >
              <Card
                className={cn(
                  "shadow-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-xl",
                  sosData.status === "active"
                    ? "border-red-500 bg-red-50"
                    : "border-green-500 bg-green-50",
                )}
                onClick={() => navigateToLocation(sosData.location)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={cn(
                          "h-5 w-5",
                          sosData.status === "active"
                            ? "text-red-600 animate-pulse"
                            : "text-green-600",
                        )}
                      />
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          {sosData.status === "active"
                            ? "🚨 Emergency Alert"
                            : "✅ Resolved"}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {sosData.userName}
                        </p>
                      </div>
                    </div>
                    {onDismissSOS && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismissSOS(sosData.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">
                        {sosData.location.address ||
                          `${sosData.location.latitude.toFixed(4)}, ${sosData.location.longitude.toFixed(4)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{formatTimeAgo(sosData.location.timestamp)}</span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToLocation(sosData.location);
                      }}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs px-2 bg-blue-600 hover:bg-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        startAutoNavigation(sosData.location);
                      }}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Navigate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyLocationToClipboard(sosData.location);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  <Badge
                    variant={
                      sosData.status === "active" ? "destructive" : "default"
                    }
                    className="text-xs"
                  >
                    {sosData.status.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Detailed SOS Modal */}
      <AnimatePresence>
        {selectedSOS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSOS(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-red-100 text-red-600">
                          {selectedSOS.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedSOS.status === "active"
                            ? "🚨 Emergency Alert"
                            : "✅ Emergency Resolved"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          From {selectedSOS.userName}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSelectedSOS(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Location Details */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Location</h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {selectedSOS.location.address ||
                              "Address not available"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedSOS.location.latitude.toFixed(6)},{" "}
                            {selectedSOS.location.longitude.toFixed(6)}
                          </p>
                          {selectedSOS.location.accuracy && (
                            <p className="text-xs text-muted-foreground">
                              Accuracy: ±
                              {Math.round(selectedSOS.location.accuracy)}m
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Time</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(
                          selectedSOS.location.timestamp,
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  {selectedSOS.message && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Message</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm whitespace-pre-wrap">
                          {selectedSOS.message}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        startAutoNavigation(selectedSOS.location);
                        setSelectedSOS(null);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Start Navigation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigateToLocation(selectedSOS.location);
                        setSelectedSOS(null);
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        copyLocationToClipboard(selectedSOS.location)
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
