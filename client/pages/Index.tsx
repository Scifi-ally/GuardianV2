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
    showTraffic: true,
    satelliteView: false,
  });
  const [mapStyle, setMapStyle] = useState<"normal" | "gray" | "satellite">(
    "gray",
  );

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
      <div className="relative z-20 bg-background/98 backdrop-blur-xl border-b border-border/30 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-safe bg-clip-text text-transparent">
                Safe Navigation
              </h1>
              <p className="text-xs text-muted-foreground">
                Plan your journey with safety-first routing
              </p>
            </div>

            <div className="space-y-4">
              {/* From Input */}
              <div className="relative group">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <div className="w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm"></div>
                </div>
                <Input
                  placeholder="From location"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="pl-9 pr-12 h-12 text-sm border-2 focus:border-primary/50 bg-background/80 backdrop-blur-sm transition-all duration-200 group-hover:shadow-md"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleUseCurrentLocation}
                  className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
                  title="Use current location"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                </Button>
              </div>

              {/* Connection Line */}
              <div className="flex justify-center">
                <div className="w-px h-4 bg-gradient-to-b from-primary to-safe"></div>
              </div>

              {/* To Input */}
              <div className="relative group">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <div className="w-3 h-3 bg-safe rounded-full border-2 border-background shadow-sm"></div>
                </div>
                <Input
                  placeholder="To destination"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="pl-9 pr-12 h-12 text-sm border-2 focus:border-safe/50 bg-background/80 backdrop-blur-sm transition-all duration-200 group-hover:shadow-md"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                className="w-full h-12 bg-gradient-to-r from-primary to-safe hover:from-primary/90 hover:to-safe/90 text-white font-medium shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                disabled={!fromLocation || !toLocation}
              >
                <Route className="h-5 w-5 mr-2" />
                Find Safe Route
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Google Map */}
      <div className="absolute inset-0 top-0 z-10 pt-36">
        <GoogleMap
          location={location}
          mapStyle={mapStyle}
          showTraffic={routeSettings.showTraffic}
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
            <div className="space-y-4">
              {/* Map Style Settings */}
              <div>
                <h4 className="text-sm font-medium mb-3">Map Display</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Map Style</p>
                      <p className="text-xs text-muted-foreground">
                        Choose your preferred map appearance
                      </p>
                    </div>
                    <select
                      value={mapStyle}
                      onChange={(e) =>
                        setMapStyle(
                          e.target.value as "normal" | "gray" | "satellite",
                        )
                      }
                      className="text-sm border rounded-md px-2 py-1 bg-background"
                    >
                      <option value="normal">Normal</option>
                      <option value="gray">Gray</option>
                      <option value="satellite">Satellite</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Show Traffic</p>
                      <p className="text-xs text-muted-foreground">
                        Display real-time traffic conditions
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={routeSettings.showTraffic}
                      onChange={(e) =>
                        setRouteSettings((prev) => ({
                          ...prev,
                          showTraffic: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              </div>

              {/* Route Preferences */}
              <div>
                <h4 className="text-sm font-medium mb-3">Route Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">
                        Prefer well-lit paths
                      </p>
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
                      <p className="text-sm font-medium">
                        Avoid isolated areas
                      </p>
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
