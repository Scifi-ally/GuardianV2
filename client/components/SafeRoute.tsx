import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/CustomButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Navigation,
  MapPin,
  Clock,
  Shield,
  Route,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoutePoint {
  lat: number;
  lng: number;
}

interface SafeRouteInfo {
  distance: string;
  duration: string;
  safetyScore: number;
  warnings: string[];
  route: RoutePoint[];
}

interface SafeRouteProps {
  className?: string;
}

export function SafeRoute({ className }: SafeRouteProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([
    28.6139, 77.209,
  ]);
  const [routeInfo, setRouteInfo] = useState<SafeRouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
          setFrom("Current Location");
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  }, []);

  const calculateSafeRoute = async () => {
    if (!from || !to) return;

    setIsLoading(true);

    // Simulate route calculation with mock data
    setTimeout(() => {
      const mockRoute: SafeRouteInfo = {
        distance: "2.5 km",
        duration: "8 minutes",
        safetyScore: 85,
        warnings: [
          "Avoid dark streets after 9 PM",
          "Well-lit area recommended",
        ],
        route: [
          { lat: currentLocation[0], lng: currentLocation[1] },
          { lat: currentLocation[0] + 0.01, lng: currentLocation[1] + 0.005 },
          { lat: currentLocation[0] + 0.015, lng: currentLocation[1] + 0.012 },
          { lat: currentLocation[0] + 0.02, lng: currentLocation[1] + 0.015 },
        ],
      };
      setRouteInfo(mockRoute);
      setIsLoading(false);
    }, 1500);
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return "text-safe";
    if (score >= 60) return "text-warning";
    return "text-emergency";
  };

  const getSafetyBadge = (score: number) => {
    if (score >= 80) return { label: "Very Safe", className: "bg-safe" };
    if (score >= 60)
      return { label: "Moderately Safe", className: "bg-warning" };
    return { label: "Use Caution", className: "bg-emergency" };
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Route Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Plan Safe Route
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Enter starting point..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Enter destination..."
              />
            </div>
          </div>
          <CustomButton
            onClick={calculateSafeRoute}
            disabled={!from || !to || isLoading}
            variant="black"
            size="lg"
            className="w-full"
            icon={isLoading ? undefined : Navigation}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Calculating Safe Route...
              </>
            ) : (
              "Get Safe Route"
            )}
          </CustomButton>
        </CardContent>
      </Card>

      {/* Route Information */}
      {routeInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Route Safety Analysis
              </span>
              <Badge
                className={getSafetyBadge(routeInfo.safetyScore).className}
              >
                {getSafetyBadge(routeInfo.safetyScore).label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{routeInfo.distance}</p>
                <p className="text-sm text-muted-foreground">Distance</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{routeInfo.duration}</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
              <div>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    getSafetyColor(routeInfo.safetyScore),
                  )}
                >
                  {routeInfo.safetyScore}%
                </p>
                <p className="text-sm text-muted-foreground">Safety Score</p>
              </div>
            </div>

            {routeInfo.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Safety Recommendations
                </h4>
                <ul className="space-y-1">
                  {routeInfo.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-safe mt-0.5 flex-shrink-0" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[60vh] w-full">
            <MapContainer
              center={currentLocation}
              zoom={13}
              className="h-full w-full rounded-lg bw-map"
              zoomControl={false}
              attributionControl={false}
              style={{ background: "#000000" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="bw-tiles"
              />

              {/* Current Location */}
              <Marker position={currentLocation}>
                <Popup>
                  <div className="text-center p-2">
                    <MapPin className="h-4 w-4 mx-auto mb-2 text-blue-500" />
                    <strong>Your Location</strong>
                  </div>
                </Popup>
              </Marker>

              {/* Route Path */}
              {routeInfo && (
                <>
                  <Polyline
                    positions={routeInfo.route.map((point) => [
                      point.lat,
                      point.lng,
                    ])}
                    color={
                      routeInfo.safetyScore >= 80
                        ? "#22c55e"
                        : routeInfo.safetyScore >= 60
                          ? "#f59e0b"
                          : "#ef4444"
                    }
                    weight={4}
                    opacity={0.8}
                  />

                  {/* Destination Marker */}
                  <Marker
                    position={[
                      routeInfo.route[routeInfo.route.length - 1].lat,
                      routeInfo.route[routeInfo.route.length - 1].lng,
                    ]}
                  >
                    <Popup>
                      <div className="text-center p-2">
                        <MapPin className="h-4 w-4 mx-auto mb-2 text-green-500" />
                        <strong>Destination</strong>
                        <p className="text-sm">{to}</p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {routeInfo && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Clock className="h-4 w-4 mr-2" />
            Start Navigation
          </Button>
          <Button variant="outline" className="flex-1">
            <Shield className="h-4 w-4 mr-2" />
            Share Route
          </Button>
        </div>
      )}
    </div>
  );
}
