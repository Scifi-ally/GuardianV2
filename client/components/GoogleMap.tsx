import { useEffect, useRef, useState } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield, Locate, Layers } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE";

interface GoogleMapProps {
  location?: { latitude: number; longitude: number; accuracy?: number };
  emergencyContacts?: Array<{
    id: string;
    name: string;
    guardianKey: string;
    location?: { lat: number; lng: number };
  }>;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  className?: string;
}

function MapComponent({
  location,
  emergencyContacts = [],
  onLocationUpdate,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [contactMarkers, setContactMarkers] = useState<google.maps.Marker[]>(
    [],
  );
  const [mapStyle, setMapStyle] = useState<"normal" | "dark">("normal");

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initialLocation = location
      ? { lat: location.latitude, lng: location.longitude }
      : { lat: 37.7749, lng: -122.4194 }; // Default to San Francisco

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: initialLocation,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      styles:
        mapStyle === "dark"
          ? [
              { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
              {
                elementType: "labels.text.stroke",
                stylers: [{ color: "#242f3e" }],
              },
              {
                elementType: "labels.text.fill",
                stylers: [{ color: "#746855" }],
              },
              {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
              },
              {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
              },
              {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
              },
              {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
              },
              {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }],
              },
              {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }],
              },
              {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }],
              },
              {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }],
              },
              {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }],
              },
              {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }],
              },
              {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
              },
              {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
              },
              {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
              },
              {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }],
              },
            ]
          : [],
    });

    setMap(mapInstance);

    // Add click listener for location updates
    mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (event.latLng && onLocationUpdate) {
        onLocationUpdate({
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        });
      }
    });

    return () => {
      // Cleanup
      contactMarkers.forEach((marker) => marker.setMap(null));
      if (userMarker) userMarker.setMap(null);
    };
  }, [mapRef.current]);

  // Update user location marker
  useEffect(() => {
    if (!map || !location) return;

    const position = { lat: location.latitude, lng: location.longitude };

    if (userMarker) {
      userMarker.setPosition(position);
    } else {
      const marker = new google.maps.Marker({
        position,
        map,
        title: "Your Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#7c3aed",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        animation: google.maps.Animation.BOUNCE,
      });

      // Stop bouncing after 3 seconds
      setTimeout(() => marker.setAnimation(null), 3000);

      setUserMarker(marker);
    }

    // Center map on user location
    map.setCenter(position);
  }, [map, location, userMarker]);

  // Update emergency contact markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    contactMarkers.forEach((marker) => marker.setMap(null));

    // Add new markers for contacts with locations
    const newMarkers = emergencyContacts
      .filter((contact) => contact.location)
      .map((contact) => {
        const marker = new google.maps.Marker({
          position: contact.location!,
          map,
          title: contact.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: "#10b981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${contact.name}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">Guardian Key: ${contact.guardianKey}</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        return marker;
      });

    setContactMarkers(newMarkers);
  }, [map, emergencyContacts]);

  // Toggle map style
  const toggleMapStyle = () => {
    const newStyle = mapStyle === "normal" ? "dark" : "normal";
    setMapStyle(newStyle);

    if (map) {
      map.setOptions({
        styles:
          newStyle === "dark"
            ? [
                // Dark style configuration (same as above)
              ]
            : [],
      });
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          if (map) {
            map.setCenter(pos);
            map.setZoom(16);
          }

          if (onLocationUpdate) {
            onLocationUpdate(pos);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute top-6 right-6 space-y-3 z-10">
        <Button
          size="sm"
          variant="outline"
          className="h-10 w-10 p-0 bg-background/90 backdrop-blur border-white/20 shadow-lg"
          onClick={toggleMapStyle}
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-10 w-10 p-0 bg-background/90 backdrop-blur border-white/20 shadow-lg"
          onClick={getCurrentLocation}
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>

      {/* Safety Status Overlay */}
      <div className="absolute top-6 left-6 z-10">
        <Badge className="bg-safe/90 text-safe-foreground backdrop-blur shadow-lg">
          <Shield className="h-3 w-3 mr-1" />
          Safe Zone
        </Badge>
      </div>

      {/* Location Accuracy Display */}
      {location?.accuracy && (
        <div className="absolute bottom-6 left-6 z-10">
          <div className="bg-background/90 backdrop-blur rounded-lg p-3 shadow-lg border border-white/20">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="font-medium">Live Location</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Accuracy: ±{Math.round(location.accuracy)}m
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function GoogleMap(props: GoogleMapProps) {
  const render = (status: string) => {
    switch (status) {
      case "LOADING":
        return (
          <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        );
      case "FAILURE":
        return (
          <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-2">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Failed to load map
              </p>
            </div>
          </div>
        );
      default:
        return <MapComponent {...props} />;
    }
  };

  return (
    <Wrapper
      apiKey={GOOGLE_MAPS_API_KEY}
      render={render}
      libraries={["places", "geometry"]}
    />
  );
}
