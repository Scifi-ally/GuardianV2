import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Shield,
  AlertTriangle,
  Crosshair,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GOOGLE_MAPS_API_KEY = "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE";

interface GoogleMapProps {
  userLocation?: { lat: number; lng: number };
  className?: string;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  showSafeZones?: boolean;
  showEmergencyServices?: boolean;
}

export function GoogleMap({
  userLocation,
  className,
  onLocationSelect,
  showSafeZones = true,
  showEmergencyServices = true,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  }>(
    userLocation || { lat: 28.6139, lng: 77.209 }, // Default to New Delhi
  );

  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (userLocation) {
      setCurrentLocation(userLocation);
    }
  }, [userLocation]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places", "geometry"],
      });

      await loader.load();

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: currentLocation,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#f5f5f5" }],
          },
          {
            featureType: "water",
            elementType: "all",
            stylers: [{ color: "#c9d6e8" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#e8e8e8" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text",
            stylers: [{ visibility: "simplified" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry.fill",
            stylers: [{ color: "#e8f5e8" }],
          },
        ],
      });

      setMap(mapInstance);

      // Add user location marker
      if (currentLocation) {
        addUserLocationMarker(mapInstance, currentLocation);
      }

      // Add safe zones and emergency services
      if (showSafeZones) {
        addSafeZones(mapInstance);
      }

      if (showEmergencyServices) {
        addEmergencyServices(mapInstance);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error loading Google Maps:", err);
      setError("Failed to load map");
      setIsLoading(false);
    }
  };

  const addUserLocationMarker = (
    mapInstance: google.maps.Map,
    location: { lat: number; lng: number },
  ) => {
    const marker = new google.maps.Marker({
      position: location,
      map: mapInstance,
      title: "Your Location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: "#ffffff",
      },
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; font-family: system-ui;">
          <h3 style="margin: 0 0 4px 0; color: #1f2937; font-size: 14px; font-weight: 600;">Your Location</h3>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">You are here</p>
        </div>
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(mapInstance, marker);
    });

    markersRef.current.push(marker);
  };

  const addSafeZones = (mapInstance: google.maps.Map) => {
    const safeZones = [
      {
        lat: currentLocation.lat + 0.005,
        lng: currentLocation.lng - 0.008,
        name: "Shopping Mall",
      },
      {
        lat: currentLocation.lat - 0.003,
        lng: currentLocation.lng + 0.006,
        name: "Public Library",
      },
      {
        lat: currentLocation.lat + 0.008,
        lng: currentLocation.lng + 0.004,
        name: "Community Center",
      },
    ];

    safeZones.forEach((zone) => {
      const marker = new google.maps.Marker({
        position: { lat: zone.lat, lng: zone.lng },
        map: mapInstance,
        title: `Safe Zone: ${zone.name}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#22c55e",
          fillOpacity: 0.8,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      });

      const circle = new google.maps.Circle({
        strokeColor: "#22c55e",
        strokeOpacity: 0.3,
        strokeWeight: 2,
        fillColor: "#22c55e",
        fillOpacity: 0.1,
        map: mapInstance,
        center: { lat: zone.lat, lng: zone.lng },
        radius: 200,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: system-ui;">
            <h3 style="margin: 0 0 4px 0; color: #22c55e; font-size: 14px; font-weight: 600;">Safe Zone</h3>
            <p style="margin: 0; color: #1f2937; font-size: 13px;">${zone.name}</p>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 11px;">Well-lit area with security</p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(mapInstance, marker);
      });

      markersRef.current.push(marker);
    });
  };

  const addEmergencyServices = (mapInstance: google.maps.Map) => {
    const emergencyServices = [
      {
        lat: currentLocation.lat + 0.01,
        lng: currentLocation.lng + 0.01,
        name: "Police Station",
        type: "police",
      },
      {
        lat: currentLocation.lat - 0.01,
        lng: currentLocation.lng + 0.015,
        name: "General Hospital",
        type: "hospital",
      },
      {
        lat: currentLocation.lat + 0.006,
        lng: currentLocation.lng - 0.012,
        name: "Fire Station",
        type: "fire",
      },
    ];

    emergencyServices.forEach((service) => {
      const color =
        service.type === "police"
          ? "#3b82f6"
          : service.type === "hospital"
            ? "#ef4444"
            : "#f97316";

      const marker = new google.maps.Marker({
        position: { lat: service.lat, lng: service.lng },
        map: mapInstance,
        title: service.name,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: color,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: system-ui;">
            <h3 style="margin: 0 0 4px 0; color: ${color}; font-size: 14px; font-weight: 600;">${service.name}</h3>
            <p style="margin: 0; color: #1f2937; font-size: 13px;">Emergency Service</p>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 11px;">Available 24/7</p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(mapInstance, marker);
      });

      markersRef.current.push(marker);
    });
  };

  const getCurrentUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(newLocation);
          if (map) {
            map.setCenter(newLocation);
            // Clear existing markers and add new ones
            markersRef.current.forEach((marker) => marker.setMap(null));
            markersRef.current = [];
            addUserLocationMarker(map, newLocation);
            if (showSafeZones) addSafeZones(map);
            if (showEmergencyServices) addEmergencyServices(map);
          }
          onLocationSelect?.(newLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    }
  };

  useEffect(() => {
    initializeMap();

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (map && currentLocation) {
      map.setCenter(currentLocation);
    }
  }, [map, currentLocation]);

  if (error) {
    return (
      <Card className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm font-medium">Map Error</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      {/* Location Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Button
          onClick={getCurrentUserLocation}
          size="sm"
          className="bg-white/90 hover:bg-white text-gray-900 shadow-lg border"
        >
          <Crosshair className="h-4 w-4 mr-2" />
          My Location
        </Button>
      </div>

      {/* Map Status */}
      <div className="absolute top-4 right-4 z-10">
        <Badge variant="outline" className="bg-white/90">
          <MapPin className="h-3 w-3 mr-1" />
          Google Maps
        </Badge>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full rounded-lg" />
    </div>
  );
}
