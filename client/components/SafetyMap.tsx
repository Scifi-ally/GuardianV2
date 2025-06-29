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
  Eye,
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
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
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
  const [zoom, setZoom] = useState(15);
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");
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

  // Initialize map with white background and better styling
  useEffect(() => {
    if (!isLoaded || !mapRef.current || typeof google === "undefined") return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: currentLocation,
      zoom: zoom,
      mapTypeId: mapType,
      disableDefaultUI: true,
      backgroundColor: "#ffffff",
      styles: [
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#000000" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#ffffff" }, { weight: 2 }],
        },
      ],
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

    // Initialize traffic layer
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayerRef.current = trafficLayer;

    // Custom zoom controls
    mapInstance.addListener("zoom_changed", () => {
      setZoom(mapInstance.getZoom() || 15);
    });

    setMap(mapInstance);
    setDirectionsService(dirService);
    setDirectionsRenderer(dirRenderer);
  }, [isLoaded, currentLocation, emergencyMode, zoom, mapType]);

  // Handle traffic layer toggle
  const toggleTraffic = () => {
    if (!map || !trafficLayerRef.current) return;

    if (showTraffic) {
      trafficLayerRef.current.setMap(null);
    } else {
      trafficLayerRef.current.setMap(map);
    }
    setShowTraffic(!showTraffic);
  };

  // Handle map type toggle
  const toggleSatellite = () => {
    if (!map) return;

    const newType = mapType === "roadmap" ? "satellite" : "roadmap";
    setMapType(newType);
    map.setMapTypeId(newType);
  };

  // Handle routing
  const calculateRoute = async () => {
    if (
      !directionsService ||
      !directionsRenderer ||
      !fromLocation ||
      !toLocation ||
      !isLoaded ||
      typeof google === "undefined"
    )
      return;

    const googleTravelMode =
      travelMode === "DRIVING"
        ? google.maps.TravelMode.DRIVING
        : travelMode === "WALKING"
          ? google.maps.TravelMode.WALKING
          : travelMode === "TRANSIT"
            ? google.maps.TravelMode.TRANSIT
            : google.maps.TravelMode.DRIVING;

    const request: google.maps.DirectionsRequest = {
      origin: fromLocation,
      destination: toLocation,
      travelMode: googleTravelMode,
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
          "relative h-full w-full rounded-lg overflow-hidden border bg-white flex items-center justify-center",
          className,
        )}
      >
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-black font-mono">
            Loading Guardian Maps...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-lg overflow-hidden bg-white",
        className,
      )}
    >
      {/* Routing Controls */}
      <div className="absolute top-4 left-4 right-4 z-[1000] space-y-3">
        {!showRouting ? (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowRouting(true)}
              className="bg-white hover:bg-gray-50 text-black px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105"
            >
              <Route className="h-4 w-4" />
              Get Directions
            </Button>
            {emergencyMode && (
              <Badge className="bg-red-500 text-white animate-pulse shadow-lg">
                <AlertTriangle className="h-3 w-3 mr-1" />
                EMERGENCY MODE
              </Badge>
            )}
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-black font-semibold flex items-center gap-2 font-mono">
                <Navigation2 className="h-4 w-4" />
                Route Planning
              </h3>
              <Button
                onClick={() => setShowRouting(false)}
                variant="ghost"
                size="sm"
                className="text-black hover:bg-gray-100 p-1"
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
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500 pr-10"
                />
                <Button
                  onClick={getCurrentLocation}
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 text-black hover:bg-gray-100 p-1"
                >
                  <Locate className="h-3 w-3" />
                </Button>
              </div>

              <div className="relative">
                <Input
                  placeholder="To destination..."
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setTravelMode("DRIVING")}
                variant={travelMode === "DRIVING" ? "default" : "ghost"}
                size="sm"
                className="text-xs"
              >
                <Car className="h-3 w-3 mr-1" />
                Drive
              </Button>
              <Button
                onClick={() => setTravelMode("WALKING")}
                variant={travelMode === "WALKING" ? "default" : "ghost"}
                size="sm"
                className="text-xs"
              >
                <Users className="h-3 w-3 mr-1" />
                Walk
              </Button>
              <Button
                onClick={calculateRoute}
                className="bg-black hover:bg-gray-800 text-white text-xs flex-1"
                disabled={!fromLocation || !toLocation}
              >
                <Navigation className="h-3 w-3 mr-1" />
                Calculate Route
              </Button>
            </div>

            {routeInfo && (
              <div className="bg-gray-100 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between text-black text-sm font-mono">
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

      {/* Left Side Controls */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-[1000] space-y-2">
        {/* Zoom Controls */}
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-lg overflow-hidden shadow-lg">
          <Button
            onClick={() => adjustZoom(1)}
            variant="ghost"
            size="sm"
            className="text-black hover:bg-gray-100 w-10 h-10 p-0 rounded-none border-b border-gray-200"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => adjustZoom(-1)}
            variant="ghost"
            size="sm"
            className="text-black hover:bg-gray-100 w-10 h-10 p-0 rounded-none"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        {/* Location Button */}
        <Button
          onClick={getCurrentLocation}
          className="bg-white hover:bg-gray-50 text-black w-10 h-10 p-0 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105"
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>

      {/* Right Side Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] space-y-2">
        {/* Traffic Toggle */}
        <Button
          onClick={toggleTraffic}
          className={cn(
            "w-10 h-10 p-0 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105",
            showTraffic
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-white hover:bg-gray-50 text-black",
          )}
        >
          <Navigation className="h-4 w-4" />
        </Button>

        {/* Satellite Toggle */}
        <Button
          onClick={toggleSatellite}
          className={cn(
            "w-10 h-10 p-0 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105",
            mapType === "satellite"
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-white hover:bg-gray-50 text-black",
          )}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full" />

      {/* Bottom Status */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-lg px-3 py-1 shadow-lg">
          <span className="text-black text-xs font-mono">
            Zoom: {zoom} | {mapType === "satellite" ? "Satellite" : "Map"} |
            Traffic: {showTraffic ? "ON" : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
}
