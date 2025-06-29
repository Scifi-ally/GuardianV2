import { useEffect, useState, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Shield, AlertTriangle, Users } from "lucide-react";
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
    lat: userLocation?.lat || 28.6139, // Default to New Delhi
    lng: userLocation?.lng || 77.209,
  });
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

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: currentLocation,
      zoom: 15,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#1f2937" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#000000" }, { lightness: 13 }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#374151" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#1e40af" }],
        },
      ],
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
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

    setMap(mapInstance);
    setDirectionsService(dirService);
    setDirectionsRenderer(dirRenderer);
  }, [isLoaded, currentLocation, emergencyMode]);

  // Update user location
  useEffect(() => {
    if (userLocation) {
      setCurrentLocation(userLocation);
      if (map) {
        map.setCenter(userLocation);
      }
    }
  }, [userLocation, map]);

  // Add markers
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add user location marker
    const userMarker = new google.maps.Marker({
      position: currentLocation,
      map: map,
      title: "Your Location",
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="32" height="32">
            <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16),
      },
    });

    markersRef.current.push(userMarker);

    // Add safety location markers
    const mockSafetyLocations: SafetyLocation[] = [
      {
        id: "police1",
        name: "Police Station",
        lat: currentLocation.lat + 0.01,
        lng: currentLocation.lng + 0.01,
        type: "police",
      },
      {
        id: "hospital1",
        name: "General Hospital",
        lat: currentLocation.lat - 0.01,
        lng: currentLocation.lng + 0.015,
        type: "hospital",
      },
      {
        id: "safe1",
        name: "Safe Zone - Shopping Mall",
        lat: currentLocation.lat + 0.005,
        lng: currentLocation.lng - 0.008,
        type: "safe",
      },
    ];

    const allLocations = [...safetyLocations, ...mockSafetyLocations];

    allLocations.forEach((location) => {
      const iconColors = {
        safe: "#22c55e",
        emergency: "#ef4444",
        police: "#3b82f6",
        hospital: "#f59e0b",
      };

      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${iconColors[location.type]}" width="24" height="24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32),
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: black; padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-weight: bold;">${location.name}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">${location.type.charAt(0).toUpperCase() + location.type.slice(1)}</p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
        onLocationSelect?.(location);
      });

      markersRef.current.push(marker);
    });
  }, [map, isLoaded, currentLocation, safetyLocations, onLocationSelect]);

  // Handle emergency navigation
  useEffect(() => {
    if (
      !map ||
      !directionsService ||
      !directionsRenderer ||
      !destinationLocation
    )
      return;

    const request: google.maps.DirectionsRequest = {
      origin: currentLocation,
      destination: destinationLocation,
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: false,
      avoidTolls: false,
    };

    directionsService.route(request, (result, status) => {
      if (status === "OK" && result) {
        directionsRenderer.setDirections(result);
      }
    });
  }, [
    map,
    directionsService,
    directionsRenderer,
    currentLocation,
    destinationLocation,
  ]);

  const handleGetLocation = () => {
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

  const findNearestHospital = () => {
    if (!map) return;

    const request = {
      location: currentLocation,
      radius: 5000,
      type: "hospital",
    };

    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const nearest = results[0];
        if (nearest.geometry?.location) {
          const hospitalLocation = {
            lat: nearest.geometry.location.lat(),
            lng: nearest.geometry.location.lng(),
          };

          // Start navigation to nearest hospital
          const request: google.maps.DirectionsRequest = {
            origin: currentLocation,
            destination: hospitalLocation,
            travelMode: google.maps.TravelMode.DRIVING,
            avoidHighways: false,
            avoidTolls: false,
          };

          directionsService?.route(request, (result, status) => {
            if (status === "OK" && result) {
              directionsRenderer?.setDirections(result);
            }
          });
        }
      }
    });
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
            Loading Google Maps...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-lg overflow-hidden border",
        className,
      )}
    >
      {/* Custom Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <Button
          onClick={handleGetLocation}
          className="bg-black/80 hover:bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
        >
          <Navigation className="h-4 w-4" />
          My Location
        </Button>
        {emergencyMode && (
          <Button
            onClick={findNearestHospital}
            className="bg-emergency/90 hover:bg-emergency text-emergency-foreground px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
          >
            <AlertTriangle className="h-4 w-4" />
            Nearest Hospital
          </Button>
        )}
      </div>

      {/* Emergency Mode Indicator */}
      {emergencyMode && (
        <div className="absolute top-4 right-4 z-[1000]">
          <Badge className="bg-emergency text-emergency-foreground animate-pulse shadow-lg">
            <AlertTriangle className="h-3 w-3 mr-1" />
            EMERGENCY MODE
          </Badge>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
