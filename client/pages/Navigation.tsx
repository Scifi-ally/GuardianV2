import { useState } from "react";
import { Navigation as NavHeader } from "@/components/Navigation";
import { SafetyMap } from "@/components/SafetyMap";
import { SafeRoute } from "@/components/SafeRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Route,
  Shield,
  Navigation as NavigationIcon,
  Users,
  AlertTriangle,
  Clock,
  Star,
} from "lucide-react";
import { AnimatedCard } from "@/components/AnimatedCard";

interface SafetyLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "safe" | "emergency" | "police" | "hospital";
  distance?: number;
  rating?: number;
}

export default function Navigation() {
  const [selectedLocation, setSelectedLocation] =
    useState<SafetyLocation | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const handleLocationSelect = (location: SafetyLocation) => {
    setSelectedLocation(location);
  };

  const nearbyLocations: SafetyLocation[] = [
    {
      id: "police1",
      name: "Central Police Station",
      lat: 28.6139,
      lng: 77.209,
      type: "police",
      distance: 450,
      rating: 4.2,
    },
    {
      id: "hospital1",
      name: "City General Hospital",
      lat: 28.6129,
      lng: 77.211,
      type: "hospital",
      distance: 680,
      rating: 4.5,
    },
    {
      id: "safe1",
      name: "Metro Station - Safe Zone",
      lat: 28.6149,
      lng: 77.207,
      type: "safe",
      distance: 320,
      rating: 4.8,
    },
    {
      id: "safe2",
      name: "Shopping Mall - Safe Zone",
      lat: 28.6159,
      lng: 77.213,
      type: "safe",
      distance: 520,
      rating: 4.6,
    },
  ];

  const getLocationIcon = (type: string) => {
    switch (type) {
      case "police":
        return <AlertTriangle className="h-4 w-4" />;
      case "hospital":
        return <Users className="h-4 w-4" />;
      case "safe":
        return <Shield className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getLocationColor = (type: string) => {
    switch (type) {
      case "police":
        return "bg-blue-500";
      case "hospital":
        return "bg-red-500";
      case "safe":
        return "bg-safe";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="container px-4 py-6 space-y-6 pb-32">
        {/* Header */}
        <AnimatedCard direction="down" delay={100}>
          <div className="text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
              <NavigationIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Safe Navigation</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Plan safe routes and discover nearby safety resources for secure
                travel
              </p>
            </div>
          </div>
        </AnimatedCard>

        {/* Main Content */}
        <AnimatedCard direction="up" delay={200}>
          <Tabs defaultValue="map" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Safety Map
              </TabsTrigger>
              <TabsTrigger value="route" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                Plan Route
              </TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="space-y-6">
              {/* Interactive Map */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Safety Map
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[70vh]">
                  <SafetyMap
                    userLocation={userLocation || undefined}
                    safetyLocations={nearbyLocations}
                    onLocationSelect={handleLocationSelect}
                    className="rounded-none border-0 h-full"
                  />
                </CardContent>
              </Card>

              {/* Nearby Locations */}
              <Card>
                <CardHeader>
                  <CardTitle>Nearby Safety Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nearbyLocations.map((location) => (
                      <div
                        key={location.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleLocationSelect(location)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full text-white ${getLocationColor(location.type)}`}
                          >
                            {getLocationIcon(location.type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{location.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{location.distance}m away</span>
                              {location.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{location.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {location.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="route" className="space-y-6">
              <SafeRoute />
            </TabsContent>
          </Tabs>
        </AnimatedCard>

        {/* Selected Location Details */}
        {selectedLocation && (
          <AnimatedCard direction="up" delay={300}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getLocationIcon(selectedLocation.type)}
                  {selectedLocation.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge className={getLocationColor(selectedLocation.type)}>
                    {selectedLocation.type.toUpperCase()}
                  </Badge>
                  {selectedLocation.distance && (
                    <span className="text-sm text-muted-foreground">
                      {selectedLocation.distance}m away
                    </span>
                  )}
                  {selectedLocation.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {selectedLocation.rating}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <NavigationIcon className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Shield className="h-4 w-4 mr-2" />
                    Share Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        )}

        {/* Quick Emergency Actions */}
        <AnimatedCard direction="up" delay={400}>
          <Card className="border-emergency/20 bg-emergency/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emergency">
                <AlertTriangle className="h-5 w-5" />
                Emergency Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-emergency text-emergency hover:bg-emergency hover:text-emergency-foreground"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Call Police
                </Button>
                <Button
                  variant="outline"
                  className="border-emergency text-emergency hover:bg-emergency hover:text-emergency-foreground"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Emergency Services
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </main>
    </div>
  );
}
