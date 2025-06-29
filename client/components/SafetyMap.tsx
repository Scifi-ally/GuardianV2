import { useEffect, useState, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Navigation,
  Shield,
  AlertTriangle,
  Users,
  Plus,
  Minus,
  Locate,
  Route,
  X,
  Search,
  Clock,
  Car,
  Navigation2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GOOGLE_MAPS_API_KEY = "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE";

interface SafetyLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "safe" | "emergency" | "police" | "hospital";
  distance?: number;
}

interface SafetyMapProps {
  userLocation?: { lat: number; lng: number };
  safetyLocations?: SafetyLocation[];
  showSafeZones?: boolean;
  showEmergencyServices?: boolean;
  onLocationSelect?: (location: SafetyLocation) => void;
  className?: string;
  emergencyMode?: boolean;
  destinationLocation?: { lat: number; lng: number };
}

export function SafetyMap({
  userLocation,
  safetyLocations = [],
  showSafeZones = true,
  showEmergencyServices = true,
  onLocationSelect,
  className,
  emergencyMode = false,
  destinationLocation,
}: SafetyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: userLocation?.lat || 28.6139,
    lng: userLocation?.lng || 77.209,
  });
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [showRouting, setShowRouting] = useState(false);
  const [travelMode, setTravelMode] = useState<string>("DRIVING");
  const [routeInfo, setRouteInfo] = useState<{
    duration: string;
    distance: string;
  } | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [zoom, setZoom] = useState(15);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Load Google Maps
  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "geometry"],
    });

    loader
      .load()
      .then(() => {
        setIsLoaded(true);
      })
      .catch(console.error);
  }, []);

  // Check for dark theme
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Initialize map with custom styling
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const darkMapStyles = [
      { elementType: "geometry", stylers: [{ color: "#212121" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
      {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{ color: "#757575" }],
      },
      {
        featureType: "road",
        elementType: "geometry.fill",
        stylers: [{ color: "#2c2c2c" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#8a8a8a" }],
      },
      {
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [{ color: "#373737" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#3c3c3c" }],
      },
      {
        featureType: "road.highway.controlled_access",
        elementType: "geometry",
        stylers: [{ color: "#4e4e4e" }],
      },
      {
        featureType: "road.local",
        elementType: "labels.text.fill",
        stylers: [{ color: "#616161" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#000000" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#3d3d3d" }],
      },
    ];

    const lightMapStyles = [
      {
        featureType: "all",
        elementType: "geometry",
        stylers: [{ color: "#f5f5f5" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#c9c9c9" }],
      },
    ];

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: currentLocation,
      zoom: zoom,
      styles: isDarkTheme ? darkMapStyles : lightMapStyles,
      disableDefaultUI: true,
      mapTypeControl: false,
      zoomControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      gestureHandling: "greedy",
    });

    const dirService = new google.maps.DirectionsService();
    const dirRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: emergencyMode ? "#ef4444" : "#22c55e",
        strokeWeight: 6,
        strokeOpacity: 0.8,
      },
    });

    dirRenderer.setMap(mapInstance);

    // Custom zoom controls
    mapInstance.addListener("zoom_changed", () => {
      setZoom(mapInstance.getZoom() || 15);
    });

    setMap(mapInstance);
    setDirectionsService(dirService);
    setDirectionsRenderer(dirRenderer);
  }, [isLoaded, currentLocation, emergencyMode, isDarkTheme, zoom]);

  // Handle routing
  const calculateRoute = async () => {
    if (
      !directionsService ||
      !directionsRenderer ||
      !fromLocation ||
      !toLocation
    )
      return;

    const request: google.maps.DirectionsRequest = {
      origin: fromLocation,
      destination: toLocation,
      travelMode: travelMode,
      avoidHighways: false,
      avoidTolls: false,
    };

    directionsService.route(request, (result, status) => {
      if (status === "OK" && result) {
        directionsRenderer.setDirections(result);
        const route = result.routes[0];
        const leg = route.legs[0];
        setRouteInfo({
          duration: leg.duration?.text || "",
          distance: leg.distance?.text || "",
        });
      } else {
        console.error("Directions request failed:", status);
      }
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setCurrentLocation(newLocation);
          if (map) {
            map.setCenter(newLocation);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  };

  const adjustZoom = (delta: number) => {
    if (map) {
      const newZoom = Math.max(1, Math.min(20, zoom + delta));
      map.setZoom(newZoom);
    }
  };

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "relative h-full w-full rounded-lg overflow-hidden border bg-muted flex items-center justify-center",
          className,
        )}
      >
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading Guardian Maps...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-lg overflow-hidden",
        className,
      )}
    >
      {/* Routing Controls */}
      <div className="absolute top-4 left-4 right-4 z-[1000] space-y-3">
        {!showRouting ? (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowRouting(true)}
              className="bg-black/80 hover:bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
            >
              <Route className="h-4 w-4" />
              Get Directions
            </Button>
            {emergencyMode && (
              <Badge className="bg-emergency text-emergency-foreground animate-pulse shadow-lg">
                <AlertTriangle className="h-3 w-3 mr-1" />
                EMERGENCY MODE
              </Badge>
            )}
          </div>
        ) : (
          <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Navigation2 className="h-4 w-4" />
                Route Planning
              </h3>
              <Button
                onClick={() => setShowRouting(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder="From location..."
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pr-10"
                />
                <Button
                  onClick={getCurrentLocation}
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 text-white hover:bg-white/10 p-1"
                >
                  <Locate className="h-3 w-3" />
                </Button>
              </div>

              <div className="relative">
                <Input
                  placeholder="To destination..."
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setTravelMode(google.maps.TravelMode.DRIVING)}
                variant={
                  travelMode === google.maps.TravelMode.DRIVING
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="text-xs"
              >
                <Car className="h-3 w-3 mr-1" />
                Drive
              </Button>
              <Button
                onClick={() => setTravelMode(google.maps.TravelMode.WALKING)}
                variant={
                  travelMode === google.maps.TravelMode.WALKING
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="text-xs"
              >
                <Users className="h-3 w-3 mr-1" />
                Walk
              </Button>
              <Button
                onClick={calculateRoute}
                className="bg-primary hover:bg-primary/90 text-xs flex-1"
                disabled={!fromLocation || !toLocation}
              >
                <Navigation className="h-3 w-3 mr-1" />
                Calculate Route
              </Button>
            </div>

            {routeInfo && (
              <div className="bg-white/10 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between text-white text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>{routeInfo.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{routeInfo.distance}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Map Controls */}
      <div className="absolute bottom-4 right-4 z-[1000] space-y-2">
        {/* Zoom Controls */}
        <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden">
          <Button
            onClick={() => adjustZoom(1)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 w-10 h-10 p-0 rounded-none border-b border-white/20"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => adjustZoom(-1)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 w-10 h-10 p-0 rounded-none"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        {/* Location Button */}
        <Button
          onClick={getCurrentLocation}
          className="bg-black/80 hover:bg-black text-white w-10 h-10 p-0 rounded-lg shadow-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
        >
          <Locate className="h-4 w-4" />
        </Button>

        {/* Layers Button */}
        <Button
          onClick={() => {
            if (map) {
              const currentType = map.getMapTypeId();
              map.setMapTypeId(
                currentType === "roadmap" ? "satellite" : "roadmap",
              );
            }
          }}
          className="bg-black/80 hover:bg-black text-white w-10 h-10 p-0 rounded-lg shadow-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full" />

      {/* Zoom Level Indicator */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-lg px-3 py-1">
          <span className="text-white text-xs font-mono">Zoom: {zoom}</span>
        </div>
      </div>
    </div>
  );
}
