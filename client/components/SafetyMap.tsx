import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Shield,
  AlertTriangle,
  Users,
  Eye,
  Zap,
} from "lucide-react";
import { useGeolocation } from "@/hooks/use-device-apis";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SafetyMapProps {
  onLocationShare?: (location: any) => void;
  emergencyContacts?: any[];
  fullScreen?: boolean;
}

export function SafetyMap({
  onLocationShare,
  emergencyContacts = [],
  fullScreen = false,
}: SafetyMapProps) {
  const {
    location,
    getCurrentLocation,
    startTracking,
    stopTracking,
    isTracking,
  } = useGeolocation();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [safeZones] = useState([
    { id: 1, name: "Police Station", type: "police", distance: "0.3 miles" },
    { id: 2, name: "Hospital", type: "medical", distance: "0.7 miles" },
    { id: 3, name: "Fire Station", type: "fire", distance: "0.5 miles" },
    { id: 4, name: "Safe Haven Cafe", type: "safe", distance: "0.2 miles" },
  ]);

  const [routes] = useState([
    {
      id: "route1",
      name: "Home → Work",
      safety: "high",
      time: "15 min",
      features: ["Well-lit", "CCTV", "Busy area"],
    },
    {
      id: "route2",
      name: "University Route",
      safety: "medium",
      time: "12 min",
      features: ["Some dark areas", "Emergency stations"],
    },
    {
      id: "route3",
      name: "Night Safe Route",
      safety: "high",
      time: "18 min",
      features: ["24/7 security", "Well-populated"],
    },
  ]);

  useEffect(() => {
    if (location && onLocationShare) {
      onLocationShare(location);
    }
  }, [location, onLocationShare]);

  const handleLocationToggle = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const handleQuickShare = async () => {
    try {
      const loc = await getCurrentLocation();
      const shareText = `Guardian Safety: I'm currently at https://maps.google.com/?q=${loc.latitude},${loc.longitude}`;

      if (navigator.share) {
        await navigator.share({
          title: "Guardian Location",
          text: shareText,
        });
      } else {
        // Copy to clipboard with fallback
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareText);
          } else {
            const textArea = document.createElement("textarea");
            textArea.value = shareText;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
          }
          alert("Location copied to clipboard!");
        } catch (error) {
          console.error("Copy failed:", error);
          alert("Failed to copy location");
        }
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const safetyColors = {
    high: "bg-safe text-safe-foreground",
    medium: "bg-warning text-warning-foreground",
    low: "bg-emergency text-emergency-foreground",
  };

  const zoneIcons = {
    police: Shield,
    medical: Zap,
    fire: AlertTriangle,
    safe: Eye,
  };

  // Full screen map view
  if (fullScreen) {
    return (
      <div className="absolute inset-0 w-full h-full">
        {/* Full Screen Map Background */}
        <div className="relative w-full h-full bg-gradient-to-br from-primary/5 to-safe/5">
          {/* Enhanced map grid pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-16 h-full">
              {Array.from({ length: 256 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "border border-muted/10",
                    Math.random() > 0.7 && "bg-primary/10",
                    Math.random() > 0.8 && "bg-safe/10",
                    Math.random() > 0.9 && "bg-warning/10",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Street-like pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(-45deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "30px 30px",
            }}
          />

          {/* Current location with enhanced animation */}
          {location && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="relative">
                <div className="w-6 h-6 bg-primary rounded-full border-4 border-white shadow-2xl animate-pulse flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div className="absolute inset-0 w-6 h-6 bg-primary/30 rounded-full animate-ping" />
                <div className="absolute -inset-2 w-10 h-10 bg-primary/20 rounded-full animate-ping animation-delay-75" />
                <div className="absolute -inset-4 w-14 h-14 bg-primary/10 rounded-full animate-ping animation-delay-150" />
              </div>
            </div>
          )}

          {/* Emergency contacts on map with enhanced visibility */}
          {emergencyContacts.slice(0, 3).map((contact, index) => {
            const positions = [
              "top-1/4 right-1/3",
              "bottom-1/3 left-1/4",
              "top-2/3 right-1/4",
            ];
            return (
              <div
                key={contact.id}
                className={cn("absolute z-10", positions[index])}
              >
                <div className="relative">
                  <div className="w-4 h-4 bg-safe rounded-full border-2 border-white shadow-lg" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white" />
                </div>
              </div>
            );
          })}

          {/* Safe zones scattered on map */}
          {safeZones.slice(0, 4).map((zone, index) => {
            const Icon = zoneIcons[zone.type as keyof typeof zoneIcons];
            const positions = [
              "top-1/5 left-1/5",
              "top-1/4 right-1/5",
              "bottom-1/4 left-1/3",
              "bottom-1/5 right-1/3",
            ];
            return (
              <div
                key={zone.id}
                className={cn("absolute z-10", positions[index])}
              >
                <div className="p-1 bg-background/90 rounded border border-muted/20 shadow-md">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            );
          })}

          {/* Map controls positioned for full screen */}
          <div className="absolute top-6 right-6 space-y-2 z-30">
            <Button
              size="sm"
              variant={isTracking ? "default" : "outline"}
              onClick={handleLocationToggle}
              className="h-10 px-3 bg-background/90 backdrop-blur border-white/20 shadow-lg"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {isTracking ? "Live" : "Track"}
            </Button>
          </div>

          {/* Location accuracy indicator */}
          {location && (
            <div className="absolute bottom-6 right-6 z-30">
              <div className="bg-background/90 backdrop-blur rounded-lg p-2 shadow-lg border border-white/20">
                <Badge variant="outline" className="text-xs">
                  GPS: ±{Math.round(location.accuracy)}m
                </Badge>
              </div>
            </div>
          )}

          {/* Safety status overlay */}
          <div className="absolute top-6 left-6 z-30">
            <Badge className="bg-safe/90 text-safe-foreground backdrop-blur shadow-lg">
              <Shield className="h-3 w-3 mr-1" />
              Safe Zone
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  // Regular compact map view
  return (
    <div className="space-y-3">
      {/* Map Placeholder with Location Status */}
      <Card className="relative overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary/5 to-safe/5 relative">
          {/* Simulated map background */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 h-full">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "border border-muted/20",
                    Math.random() > 0.7 && "bg-primary/10",
                    Math.random() > 0.8 && "bg-safe/10",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Current location indicator */}
          {location && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse" />
                <div className="absolute inset-0 w-4 h-4 bg-primary/30 rounded-full animate-ping" />
              </div>
            </div>
          )}

          {/* Emergency contacts on map */}
          {emergencyContacts.slice(0, 2).map((contact, index) => (
            <div
              key={contact.id}
              className={cn(
                "absolute w-3 h-3 bg-safe rounded-full border border-white shadow-sm",
                index === 0 ? "top-4 right-6" : "bottom-6 left-8",
              )}
            />
          ))}

          {/* Location controls overlay */}
          <div className="absolute top-2 left-2 flex gap-2">
            <Button
              size="sm"
              variant={isTracking ? "default" : "outline"}
              onClick={handleLocationToggle}
              className="h-7 px-2 text-xs"
            >
              <MapPin className="h-3 w-3 mr-1" />
              {isTracking ? "Live" : "Track"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickShare}
              className="h-7 px-2 text-xs"
            >
              Share
            </Button>
          </div>

          {/* Accuracy indicator */}
          {location && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="outline" className="text-xs px-1 py-0">
                ±{Math.round(location.accuracy)}m
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuickShare}
          className="h-10 text-xs"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Share Location
        </Button>
        <Button variant="outline" size="sm" className="h-10 text-xs">
          <Navigation className="h-4 w-4 mr-2" />
          Get Directions
        </Button>
      </div>

      {/* Nearby Safe Zones */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Nearby Safe Zones</p>
        <div className="space-y-1">
          {safeZones.slice(0, 3).map((zone) => {
            const Icon = zoneIcons[zone.type as keyof typeof zoneIcons];
            return (
              <div
                key={zone.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">{zone.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {zone.distance}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                  Go
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Route Selection */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Safe Routes</p>
        <div className="space-y-1">
          {routes.slice(0, 2).map((route) => (
            <div
              key={route.id}
              className={cn(
                "p-2 rounded-lg border transition-all cursor-pointer",
                selectedRoute === route.id
                  ? "border-primary bg-primary/5"
                  : "border-muted/20 hover:border-muted/40",
              )}
              onClick={() =>
                setSelectedRoute(selectedRoute === route.id ? null : route.id)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-xs px-1 py-0",
                        safetyColors[route.safety as keyof typeof safetyColors],
                      )}
                    >
                      {route.safety.toUpperCase()}
                    </Badge>
                    <p className="text-xs font-medium">{route.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{route.time}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                  Use
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
