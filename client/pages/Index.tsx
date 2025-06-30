import { useState, useCallback } from "react";
import { Navigation, MapPin, Route, ArrowRight, Settings } from "lucide-react";
import { GoogleMap } from "@/components/GoogleMap";
import { SlideUpPanel } from "@/components/SlideUpPanel";
import { MagicNavbar } from "@/components/MagicNavbar";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function Index() {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInstructions, setRouteInstructions] = useState<string[]>([]);
  const [routeSettings, setRouteSettings] = useState({
    avoidTolls: false,
    avoidHighways: false,
    preferWellLit: true,
    avoidIsolated: true,
  });

  const { location, getCurrentLocation } = useGeolocation();
  const { userProfile } = useAuth();

  const emergencyContacts = userProfile?.emergencyContacts || [];

  const handleSearch = useCallback(async () => {
    if (!fromLocation || !toLocation) return;

    setIsNavigating(true);

    // Mock route instructions - in real app would use Google Directions API
    const mockInstructions = [
      "Head north on Main Street toward Oak Avenue",
      "Turn right onto Oak Avenue",
      "Continue straight for 0.5 miles",
      "Turn left onto Park Street",
      "Destination will be on your right",
    ];

    setRouteInstructions(mockInstructions);
  }, [fromLocation, toLocation]);

  const handleUseCurrentLocation = useCallback(async () => {
    try {
      const currentLoc = await getCurrentLocation();
      setFromLocation(
        `${currentLoc.latitude.toFixed(4)}, ${currentLoc.longitude.toFixed(4)}`,
      );
    } catch (error) {
      console.error("Error getting current location:", error);
    }
  }, [getCurrentLocation]);

  const handleSOSPress = useCallback(() => {
    console.log("SOS activated");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* To/From Section at Top */}
      <div className="relative z-20 bg-background/95 backdrop-blur-lg border-b border-border/50 p-4">
        <div className="space-y-4">
          <h1 className="text-lg font-semibold text-center">Safe Navigation</h1>

          <div className="space-y-3">
            {/* From Input */}
            <div className="relative">
              <Input
                placeholder="From location"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="pr-10"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleUseCurrentLocation}
                className="absolute right-1 top-1 h-8 w-8 p-0"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>

            {/* To Input */}
            <div className="relative">
              <Input
                placeholder="To destination"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="pr-10"
              />
              <ArrowRight className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              className="w-full"
              disabled={!fromLocation || !toLocation}
            >
              <Route className="h-4 w-4 mr-2" />
              Find Safe Route
            </Button>
          </div>
        </div>
      </div>

      {/* Google Map */}
      <div className="absolute inset-0 top-0 z-10 pt-36">
        <GoogleMap
          location={location}
          emergencyContacts={emergencyContacts.map((contact) => ({
            id: contact.id,
            name: contact.name,
            guardianKey: contact.guardianKey,
            location: {
              lat: 37.7749 + Math.random() * 0.01,
              lng: -122.4194 + Math.random() * 0.01,
            },
          }))}
          onLocationUpdate={(newLocation) => {
            console.log("Location updated:", newLocation);
          }}
        />
      </div>

      {/* Slide Up Panel with Tabs for Navigation, Contacts, and Settings */}
      <SlideUpPanel
        minHeight={200}
        maxHeight={600}
        initialHeight={320}
        bottomOffset={120}
        collapsedHeight={60}
      >
        <Tabs
          defaultValue={isNavigating ? "navigation" : "settings"}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="navigation" className="text-xs">
              <Navigation className="h-4 w-4 mr-1" />
              Routes
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="navigation" className="mt-4 space-y-4">
            {isNavigating && routeInstructions.length > 0 ? (
              // Navigation Instructions
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    Turn-by-Turn Directions
                  </h3>
                  <Badge className="bg-primary/20 text-primary">Active</Badge>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {routeInstructions.map((instruction, index) => (
                    <Card
                      key={index}
                      className={cn(
                        "transition-all duration-200",
                        index === 0
                          ? "border-primary bg-primary/5"
                          : "bg-muted/30",
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                              index === 0
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {index + 1}
                          </div>
                          <p
                            className={cn(
                              "text-sm flex-1",
                              index === 0
                                ? "font-medium text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            {instruction}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setIsNavigating(false);
                    setRouteInstructions([]);
                  }}
                  className="w-full"
                >
                  End Navigation
                </Button>
              </div>
            ) : (
              // Route Planning
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Route Planning</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 flex-col gap-1 text-xs"
                  >
                    <MapPin className="h-4 w-4" />
                    Share Location
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 flex-col gap-1 text-xs"
                  >
                    <Navigation className="h-4 w-4" />
                    Live Tracking
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <h3 className="text-lg font-semibold">Route Preferences</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Prefer well-lit paths</p>
                  <p className="text-xs text-muted-foreground">
                    Choose routes with better lighting
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={routeSettings.preferWellLit}
                  onChange={(e) =>
                    setRouteSettings((prev) => ({
                      ...prev,
                      preferWellLit: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Avoid isolated areas</p>
                  <p className="text-xs text-muted-foreground">
                    Stay in populated areas when possible
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={routeSettings.avoidIsolated}
                  onChange={(e) =>
                    setRouteSettings((prev) => ({
                      ...prev,
                      avoidIsolated: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Avoid highways</p>
                  <p className="text-xs text-muted-foreground">
                    Use local roads instead
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={routeSettings.avoidHighways}
                  onChange={(e) =>
                    setRouteSettings((prev) => ({
                      ...prev,
                      avoidHighways: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Avoid tolls</p>
                  <p className="text-xs text-muted-foreground">
                    Choose toll-free routes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={routeSettings.avoidTolls}
                  onChange={(e) =>
                    setRouteSettings((prev) => ({
                      ...prev,
                      avoidTolls: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SlideUpPanel>

      {/* Magic Navbar */}
      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
