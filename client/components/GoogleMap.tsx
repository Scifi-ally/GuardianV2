import { useEffect, useRef, useState } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield, Locate, Layers, AlertTriangle } from "lucide-react";
import { MockMap } from "@/components/MockMap";

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
  mapStyle?: "normal" | "gray" | "satellite";
  showTraffic?: boolean;
  className?: string;
}

function MapComponent({
  location,
  emergencyContacts = [],
  onLocationUpdate,
  mapStyle: propMapStyle = "gray",
  showTraffic = true,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [contactMarkers, setContactMarkers] = useState<google.maps.Marker[]>(
    [],
  );
  const [trafficLayer, setTrafficLayer] =
    useState<google.maps.TrafficLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initialLocation = location
      ? { lat: location.latitude, lng: location.longitude }
      : { lat: 37.7749, lng: -122.4194 }; // Default to San Francisco

    const getMapStyles = (style: string) => {
      switch (style) {
        case "gray":
          return [
            { elementType: "geometry", stylers: [{ color: "#f8f9fa" }] },
            { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
            {
              elementType: "labels.text.fill",
              stylers: [{ color: "#495057" }],
            },
            {
              elementType: "labels.text.stroke",
              stylers: [{ color: "#ffffff" }],
            },
            {
              featureType: "administrative.land_parcel",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6c757d" }],
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [{ color: "#e9ecef" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6c757d" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#dee2e6" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6c757d" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#ffffff" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#dee2e6" }],
            },
            {
              featureType: "road.arterial",
              elementType: "labels.text.fill",
              stylers: [{ color: "#495057" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#e9ecef" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#ced4da" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#212529" }],
            },
            {
              featureType: "road.local",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6c757d" }],
            },
            {
              featureType: "transit.line",
              elementType: "geometry",
              stylers: [{ color: "#dee2e6" }],
            },
            {
              featureType: "transit.station",
              elementType: "geometry",
              stylers: [{ color: "#e9ecef" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#adb5bd" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#495057" }],
            },
          ];
        case "satellite":
          return [];
        default:
          return [];
      }
    };

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
      mapTypeId:
        propMapStyle === "satellite"
          ? google.maps.MapTypeId.SATELLITE
          : google.maps.MapTypeId.ROADMAP,
      styles: propMapStyle !== "satellite" ? getMapStyles(propMapStyle) : [],
    });

    setMap(mapInstance);

    // Initialize traffic layer
    const traffic = new google.maps.TrafficLayer();
    setTrafficLayer(traffic);

    // Add traffic layer if enabled
    if (showTraffic) {
      traffic.setMap(mapInstance);
    }

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
      if (traffic) traffic.setMap(null);
    };
  }, [mapRef.current]);

  // Update traffic layer when showTraffic changes
  useEffect(() => {
    if (map && trafficLayer) {
      if (showTraffic) {
        trafficLayer.setMap(map);
      } else {
        trafficLayer.setMap(null);
      }
    }
  }, [map, trafficLayer, showTraffic]);

  // Update map style when propMapStyle changes
  useEffect(() => {
    if (map) {
      const getMapStyles = (style: string) => {
        switch (style) {
          case "gray":
            return [
              { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
              { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
              {
                elementType: "labels.text.fill",
                stylers: [{ color: "#616161" }],
              },
              {
                elementType: "labels.text.stroke",
                stylers: [{ color: "#f5f5f5" }],
              },
              {
                featureType: "administrative.land_parcel",
                elementType: "labels.text.fill",
                stylers: [{ color: "#bdbdbd" }],
              },
              {
                featureType: "poi",
                elementType: "geometry",
                stylers: [{ color: "#eeeeee" }],
              },
              {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#757575" }],
              },
              {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#e5e5e5" }],
              },
              {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9e9e9e" }],
              },
              {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#ffffff" }],
              },
              {
                featureType: "road.arterial",
                elementType: "labels.text.fill",
                stylers: [{ color: "#757575" }],
              },
              {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#dadada" }],
              },
              {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#616161" }],
              },
              {
                featureType: "road.local",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9e9e9e" }],
              },
              {
                featureType: "transit.line",
                elementType: "geometry",
                stylers: [{ color: "#e5e5e5" }],
              },
              {
                featureType: "transit.station",
                elementType: "geometry",
                stylers: [{ color: "#eeeeee" }],
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#c9c9c9" }],
              },
              {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9e9e9e" }],
              },
            ];
          case "satellite":
            return [];
          default:
            return [];
        }
      };

      map.setMapTypeId(
        propMapStyle === "satellite"
          ? google.maps.MapTypeId.SATELLITE
          : google.maps.MapTypeId.ROADMAP,
      );
      if (propMapStyle !== "satellite") {
        map.setOptions({ styles: getMapStyles(propMapStyle) });
      }
    }
  }, [map, propMapStyle]);

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
  const [useFallback, setUseFallback] = useState(false); // Enable Google Maps by default
  const [showTransition, setShowTransition] = useState(false);

  // Use real Google Maps with provided API key
  if (useFallback) {
    return (
      <div className="relative w-full h-full">
        <MockMap {...props} />

        {/* Enhanced fallback indicator */}
        <div className="absolute top-4 left-4 z-50">
          <Badge className="bg-primary/90 text-primary-foreground backdrop-blur shadow-lg border border-primary/20">
            <Shield className="h-3 w-3 mr-1" />
            Guardian Map
          </Badge>
        </div>
      </div>
    );
  }

  const render = (status: string) => {
    switch (status) {
      case "LOADING":
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-safe/5">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="absolute inset-0 w-12 h-12 border-3 border-primary/30 rounded-full animate-ping" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Loading Guardian Map...</p>
                <p className="text-xs text-muted-foreground">
                  Securing your location
                </p>
              </div>
            </div>
          </div>
        );
      case "FAILURE":
        // Immediate fallback to MockMap
        setUseFallback(true);
        return null; // Will re-render with MockMap
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
