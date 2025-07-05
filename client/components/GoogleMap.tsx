import { useEffect, useRef, useState } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield, Locate, Layers, AlertTriangle } from "lucide-react";
import { MockMap } from "@/components/MockMap";
import RoadBasedSafetyAreas from "@/components/RoadBasedSafetyAreas";
import { useNotifications } from "@/components/NotificationSystem";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE";

// Safe zones data - in a real app, this would come from an API
const SAFE_ZONES = [
  {
    id: "police-1",
    name: "Central Police Station",
    type: "police",
    lat: 37.7849,
    lng: -122.4094,
    phone: "(415) 555-0101",
  },
  {
    id: "hospital-1",
    name: "SF General Hospital",
    type: "hospital",
    lat: 37.7582,
    lng: -122.4058,
    phone: "(415) 555-0102",
  },
  {
    id: "fire-1",
    name: "Fire Station 1",
    type: "fire",
    lat: 37.7949,
    lng: -122.4194,
    phone: "(415) 555-0103",
  },
  {
    id: "police-2",
    name: "Mission Police Station",
    type: "police",
    lat: 37.7449,
    lng: -122.4194,
    phone: "(415) 555-0104",
  },
];

interface GoogleMapProps {
  location?: { latitude: number; longitude: number; accuracy?: number };
  emergencyContacts?: Array<{
    id: string;
    name: string;
    guardianKey: string;
    location?: { lat: number; lng: number };
  }>;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  onDirectionsChange?: (
    directions: google.maps.DirectionsResult | null,
  ) => void;
  mapTheme?: "light" | "dark";
  mapType?: "normal" | "satellite";
  showTraffic?: boolean;
  showSafeZones?: boolean;
  showEmergencyServices?: boolean;
  showSafeAreaCircles?: boolean;
  enableSatelliteView?: boolean;
  zoomLevel?: number;
  routePath?: Array<{ lat: number; lng: number }>;
  destination?: { lat: number; lng: number };
  trackUserLocation?: boolean;
  travelMode?: "WALKING" | "DRIVING" | "BICYCLING";
  className?: string;
}

function MapComponent({
  location,
  emergencyContacts = [],
  onLocationUpdate,
  onDirectionsChange,
  mapTheme = "light",
  mapType = "normal",
  showTraffic = true,
  showSafeZones = true,
  showEmergencyServices = true,
  showSafeAreaCircles = true,
  enableSatelliteView = false,
  zoomLevel = 15,
  routePath = [],
  destination,
  trackUserLocation = true,
  travelMode = "WALKING",
}: GoogleMapProps) {
  const { addNotification } = useNotifications();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [contactMarkers, setContactMarkers] = useState<google.maps.Marker[]>(
    [],
  );
  const [trafficLayer, setTrafficLayer] =
    useState<google.maps.TrafficLayer | null>(null);
  const [safeZoneMarkers, setSafeZoneMarkers] = useState<google.maps.Marker[]>(
    [],
  );
  const [routePolyline, setRoutePolyline] =
    useState<google.maps.Polyline | null>(null);
  const [destinationMarker, setDestinationMarker] =
    useState<google.maps.Marker | null>(null);
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const [locationWatcher, setLocationWatcher] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initialLocation = location
      ? { lat: location.latitude, lng: location.longitude }
      : { lat: 37.7749, lng: -122.4194 }; // Default to San Francisco

    // Try to get user's location if not provided
    if (!location && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map?.panTo(userLocation);
          if (onLocationUpdate) {
            onLocationUpdate(userLocation);
          }
        },
        (error) => {
          console.log(
            "Initial location request failed, using default location",
          );
        },
        {
          enableHighAccuracy: false, // Use less accurate but faster method for initial load
          timeout: 3000,
          maximumAge: 600000, // 10 minutes
        },
      );
    }

    const getMapStyles = (theme: "light" | "dark") => {
      if (theme === "light") {
        return [
          { elementType: "geometry", stylers: [{ color: "#F8F9FA" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#333333" }] },
          {
            elementType: "labels.text.stroke",
            stylers: [{ color: "#FFFFFF" }],
          },
          {
            featureType: "administrative.land_parcel",
            elementType: "labels.text.fill",
            stylers: [{ color: "#777777" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#F1F3F4" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#777777" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#E8F5E8" }],
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#777777" }],
          },
          {
            featureType: "landscape.natural",
            elementType: "geometry",
            stylers: [{ color: "#F8F9FA" }],
          },
          {
            featureType: "landscape.natural.landcover",
            elementType: "geometry",
            stylers: [{ color: "#F8F9FA" }],
          },
          {
            featureType: "landscape.natural.terrain",
            elementType: "geometry",
            stylers: [{ color: "#F8F9FA" }],
          },
          {
            featureType: "landscape.man_made",
            elementType: "geometry",
            stylers: [{ color: "#F1F3F4" }],
          },
          // Gray roads
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#9CA3AF" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#6B7280" }],
          },
          {
            featureType: "road.arterial",
            elementType: "geometry",
            stylers: [{ color: "#9CA3AF" }],
          },
          {
            featureType: "road.arterial",
            elementType: "labels.text.fill",
            stylers: [{ color: "#333333" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#9CA3AF" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#6B7280" }],
          },
          {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#1A1A1A" }],
          },
          {
            featureType: "road.local",
            elementType: "geometry",
            stylers: [{ color: "#9CA3AF" }],
          },
          {
            featureType: "road.local",
            elementType: "labels.text.fill",
            stylers: [{ color: "#777777" }],
          },
          {
            featureType: "transit.line",
            elementType: "geometry",
            stylers: [{ color: "#E0E0E0" }],
          },
          {
            featureType: "transit.station",
            elementType: "geometry",
            stylers: [{ color: "#E0E0E0" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#D4E7F5" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#333333" }],
          },
        ];
      } else {
        return [
          { elementType: "geometry", stylers: [{ color: "#1A1A1A" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#E0E0E0" }] },
          {
            elementType: "labels.text.stroke",
            stylers: [{ color: "#333333" }],
          },
          {
            featureType: "administrative.land_parcel",
            elementType: "labels.text.fill",
            stylers: [{ color: "#777777" }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#333333" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#E0E0E0" }],
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#2C2C2C" }],
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#E0E0E0" }],
          },
          {
            featureType: "landscape.natural",
            elementType: "geometry",
            stylers: [{ color: "#2C2C2C" }],
          },
          {
            featureType: "landscape.natural.landcover",
            elementType: "geometry",
            stylers: [{ color: "#2C2C2C" }],
          },
          {
            featureType: "landscape.natural.terrain",
            elementType: "geometry",
            stylers: [{ color: "#2C2C2C" }],
          },
          {
            featureType: "landscape.man_made",
            elementType: "geometry",
            stylers: [{ color: "#333333" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#E0E0E0" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#777777" }],
          },
          {
            featureType: "road.arterial",
            elementType: "labels.text.fill",
            stylers: [{ color: "#E0E0E0" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#777777" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#555555" }],
          },
          {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#FFFFFF" }],
          },
          {
            featureType: "road.local",
            elementType: "labels.text.fill",
            stylers: [{ color: "#E0E0E0" }],
          },
          {
            featureType: "transit.line",
            elementType: "geometry",
            stylers: [{ color: "#777777" }],
          },
          {
            featureType: "transit.station",
            elementType: "geometry",
            stylers: [{ color: "#777777" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#495057" }],
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#E0E0E0" }],
          },
        ];
      }
    };

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: initialLocation,
      zoom: zoomLevel,
      disableDefaultUI: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      scaleControl: false,
      rotateControl: false,
      // Enable gesture handling for mobile
      gestureHandling: "auto",
      // Enable touch controls
      disableDoubleClickZoom: false,
      draggable: true,
      scrollwheel: true,
      // Smooth zoom settings like Google Maps
      minZoom: 3,
      maxZoom: 20,
      mapTypeId:
        mapType === "satellite"
          ? google.maps.MapTypeId.SATELLITE
          : google.maps.MapTypeId.ROADMAP,
      styles: mapType !== "satellite" ? getMapStyles(mapTheme) : [],
    });

    setMap(mapInstance);

    // Initialize traffic layer
    const traffic = new google.maps.TrafficLayer();
    setTrafficLayer(traffic);

    // Initialize directions service and renderer
    const directionsServiceInstance = new google.maps.DirectionsService();
    const directionsRendererInstance = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#1DA1F2", // Twitter blue color
        strokeWeight: 6,
        strokeOpacity: 0.8,
      },
    });

    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);
    directionsRendererInstance.setMap(mapInstance);

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

    // Enhanced touch support for mobile devices
    const mapElement = mapRef.current;
    if (mapElement) {
      // Prevent default browser gestures that might interfere
      mapElement.style.touchAction = "pan-x pan-y";

      // Add zoom event listeners for feedback and smooth animations
      mapInstance.addListener("zoom_changed", () => {
        // Haptic feedback for zoom changes
        if ("vibrate" in navigator) {
          navigator.vibrate(10);
        }
      });

      // Add drag event listeners for smooth panning
      mapInstance.addListener("dragstart", () => {
        mapElement.style.cursor = "grabbing";
        mapElement.style.transition = "none";
      });

      mapInstance.addListener("dragend", () => {
        mapElement.style.cursor = "grab";
        mapElement.style.transition = "all 0.3s ease-out";
      });

      // Add double-tap zoom like Google Maps
      let lastTap = 0;
      mapElement.addEventListener("touchend", (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;

        if (tapLength < 300 && tapLength > 0) {
          // Double tap detected
          e.preventDefault();
          const currentZoom = mapInstance.getZoom() || 15;
          const newZoom = Math.min(currentZoom + 2, 20);

          // Get tap location for zoom center
          const rect = mapElement.getBoundingClientRect();
          const touch = e.changedTouches[0];
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;

          // Convert pixel coordinates to lat/lng
          const projection = mapInstance.getProjection();
          if (projection) {
            const bounds = mapInstance.getBounds();
            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();

              const lat =
                sw.lat() + (ne.lat() - sw.lat()) * (1 - y / rect.height);
              const lng = sw.lng() + (ne.lng() - sw.lng()) * (x / rect.width);

              // Smooth zoom to tap location
              mapInstance.panTo({ lat, lng });
              setTimeout(() => mapInstance.setZoom(newZoom), 100);
            }
          }

          // Haptic feedback for double tap
          if ("vibrate" in navigator) {
            navigator.vibrate([30, 50, 30]);
          }
        }
        lastTap = currentTime;
      });
    }

    return () => {
      // Cleanup
      contactMarkers.forEach((marker) => marker.setMap(null));
      if (userMarker) userMarker.setMap(null);
      if (traffic) traffic.setMap(null);
      if (directionsRendererInstance) directionsRendererInstance.setMap(null);
      if (routePolyline) routePolyline.setMap(null);
      if (destinationMarker) destinationMarker.setMap(null);
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

  // Manage safe zone markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    safeZoneMarkers.forEach((marker) => marker.setMap(null));

    if (showSafeZones) {
      const newMarkers = SAFE_ZONES.map((zone) => {
        const icon = {
          url: `data:image/svg+xml,${encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="${
                zone.type === "police"
                  ? "#3b82f6"
                  : zone.type === "hospital"
                    ? "#ef4444"
                    : "#10b981"
              }" stroke="white" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
                ${zone.type === "police" ? "👮" : zone.type === "hospital" ? "🏥" : "🚒"}
              </text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        };

        const marker = new google.maps.Marker({
          position: { lat: zone.lat, lng: zone.lng },
          map: map,
          title: zone.name,
          icon: icon,
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #333;">${zone.name}</h3>
              <p style="margin: 4px 0; color: #666; text-transform: capitalize;">
                <strong>Type:</strong> ${zone.type}
              </p>
              <p style="margin: 4px 0; color: #666;">
                <strong>Phone:</strong> <a href="tel:${zone.phone}" style="color: #2563eb;">${zone.phone}</a>
              </p>
              <div style="margin-top: 8px;">
                <a href="https://maps.google.com/?daddr=${zone.lat},${zone.lng}"
                   target="_blank"
                   style="color: #2563eb; text-decoration: none; font-weight: 500;">
                  Get Directions →
                </a>
              </div>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        return marker;
      });

      setSafeZoneMarkers(newMarkers);
    } else {
      setSafeZoneMarkers([]);
    }
  }, [map, showSafeZones]);

  // Update map style when theme or type changes
  useEffect(() => {
    if (map) {
      const getMapStylesForTheme = (theme: "light" | "dark") => {
        if (theme === "light") {
          return [
            { elementType: "geometry", stylers: [{ color: "#F5F5F5" }] },
            { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
            {
              elementType: "labels.text.fill",
              stylers: [{ color: "#333333" }],
            },
            {
              elementType: "labels.text.stroke",
              stylers: [{ color: "#FFFFFF" }],
            },
            {
              featureType: "administrative.land_parcel",
              elementType: "labels.text.fill",
              stylers: [{ color: "#777777" }],
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#777777" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#CCCCCC" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#777777" }],
            },
            {
              featureType: "landscape.natural",
              elementType: "geometry",
              stylers: [{ color: "#F5F5F5" }],
            },
            {
              featureType: "landscape.natural.landcover",
              elementType: "geometry",
              stylers: [{ color: "#F5F5F5" }],
            },
            {
              featureType: "landscape.natural.terrain",
              elementType: "geometry",
              stylers: [{ color: "#F5F5F5" }],
            },
            {
              featureType: "landscape.man_made",
              elementType: "geometry",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#FFFFFF" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              featureType: "road.arterial",
              elementType: "labels.text.fill",
              stylers: [{ color: "#333333" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#CCCCCC" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#1A1A1A" }],
            },
            {
              featureType: "road.local",
              elementType: "labels.text.fill",
              stylers: [{ color: "#777777" }],
            },
            {
              featureType: "transit.line",
              elementType: "geometry",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              featureType: "transit.station",
              elementType: "geometry",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#D4E7F5" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#333333" }],
            },
          ];
        } else {
          return [
            { elementType: "geometry", stylers: [{ color: "#1A1A1A" }] },
            { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
            {
              elementType: "labels.text.fill",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              elementType: "labels.text.stroke",
              stylers: [{ color: "#333333" }],
            },
            {
              featureType: "administrative.land_parcel",
              elementType: "labels.text.fill",
              stylers: [{ color: "#777777" }],
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [{ color: "#333333" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#2C2C2C" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              featureType: "landscape.natural",
              elementType: "geometry",
              stylers: [{ color: "#2C2C2C" }],
            },
            {
              featureType: "landscape.natural.landcover",
              elementType: "geometry",
              stylers: [{ color: "#2C2C2C" }],
            },
            {
              featureType: "landscape.natural.terrain",
              elementType: "geometry",
              stylers: [{ color: "#2C2C2C" }],
            },
            {
              featureType: "landscape.man_made",
              elementType: "geometry",
              stylers: [{ color: "#333333" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#777777" }],
            },
            {
              featureType: "road.arterial",
              elementType: "labels.text.fill",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#777777" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#555555" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#FFFFFF" }],
            },
            {
              featureType: "road.local",
              elementType: "labels.text.fill",
              stylers: [{ color: "#E0E0E0" }],
            },
            {
              featureType: "transit.line",
              elementType: "geometry",
              stylers: [{ color: "#777777" }],
            },
            {
              featureType: "transit.station",
              elementType: "geometry",
              stylers: [{ color: "#777777" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#495057" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#E0E0E0" }],
            },
          ];
        }
      };

      const styles = getMapStylesForTheme(mapTheme);
      if (mapType === "satellite") {
        map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
        map.setOptions({ styles: [] });
      } else {
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        map.setOptions({ styles });
      }
    }
  }, [map, mapTheme, mapType]);

  // Enhanced user location marker with better visibility
  useEffect(() => {
    if (!map || !location) {
      console.log("🗺️ Map or location not available yet");
      return;
    }

    console.log("📍 Creating location marker for:", {
      lat: location.latitude.toFixed(6),
      lng: location.longitude.toFixed(6),
      accuracy: Math.round(location.accuracy || 0) + "m",
    });

    // Remove existing marker and its elements
    if (userMarker) {
      userMarker.setMap(null);
      if ((userMarker as any).pulseCircle) {
        (userMarker as any).pulseCircle.setMap(null);
      }
      if ((userMarker as any).accuracyCircle) {
        (userMarker as any).accuracyCircle.setMap(null);
      }
      if ((userMarker as any).pulseInterval) {
        clearInterval((userMarker as any).pulseInterval);
      }
    }

    // Enhanced location marker icon
    const customIcon = {
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Outer ring -->
          <circle cx="16" cy="16" r="15" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" stroke-width="2"/>
          <!-- Main blue dot -->
          <circle cx="16" cy="16" r="10" fill="#3b82f6" stroke="white" stroke-width="3"/>
          <!-- Inner white dot -->
          <circle cx="16" cy="16" r="5" fill="white"/>
          <!-- Center blue dot -->
          <circle cx="16" cy="16" r="3" fill="#3b82f6"/>
          <!-- Directional indicator (if heading available) -->
          ${
            location.heading !== undefined
              ? `
            <path d="M16 6 L20 14 L16 12 L12 14 Z" fill="#3b82f6" transform="rotate(${location.heading} 16 16)"/>
          `
              : ""
          }
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16),
    };

    // Create new enhanced marker
    const marker = new google.maps.Marker({
      position: { lat: location.latitude, lng: location.longitude },
      map,
      title: `📍 Your Location\nAccuracy: ±${Math.round(location.accuracy || 0)}m\nTimestamp: ${new Date(location.timestamp).toLocaleTimeString()}`,
      icon: customIcon,
      animation: google.maps.Animation.DROP,
      zIndex: 10000, // Highest priority
      optimized: false, // Better for custom SVG
    });

    // Add accuracy circle if available
    let accuracyCircle: google.maps.Circle | null = null;
    if (location.accuracy && location.accuracy < 1000) {
      // Only show if accuracy is reasonable
      accuracyCircle = new google.maps.Circle({
        strokeColor: "#3b82f6",
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        map,
        center: { lat: location.latitude, lng: location.longitude },
        radius: location.accuracy,
        zIndex: 9999,
      });
    }

    // Enhanced pulsing animation
    const pulseCircle = new google.maps.Circle({
      strokeColor: "#3b82f6",
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: "#3b82f6",
      fillOpacity: 0.3,
      map,
      center: { lat: location.latitude, lng: location.longitude },
      radius: 30,
      zIndex: 9998,
    });

    // Smooth pulsing animation
    let pulseRadius = 20;
    let growing = true;
    const pulseInterval = setInterval(() => {
      if (growing) {
        pulseRadius += 1.5;
        if (pulseRadius >= 60) growing = false;
      } else {
        pulseRadius -= 1.5;
        if (pulseRadius <= 20) growing = true;
      }

      pulseCircle.setRadius(pulseRadius);
      const opacity = 0.4 - ((pulseRadius - 20) / 40) * 0.3;
      pulseCircle.setOptions({
        fillOpacity: Math.max(0.1, opacity),
        strokeOpacity: Math.max(0.3, opacity * 2),
      });
    }, 50); // Smoother animation

    // Add click listener for location details
    marker.addListener("click", () => {
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; font-family: system-ui; min-width: 250px;">
            <h3 style="margin: 0 0 10px 0; color: #3b82f6; font-size: 16px;">
              📍 Your Current Location
            </h3>
            <div style="margin-bottom: 8px;">
              <strong>Coordinates:</strong><br/>
              <span style="font-family: monospace; font-size: 12px;">
                ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
              </span>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>Accuracy:</strong> ±${Math.round(location.accuracy || 0)}m
            </div>
            ${
              location.speed !== undefined && location.speed > 0
                ? `
              <div style="margin-bottom: 8px;">
                <strong>Speed:</strong> ${Math.round(location.speed * 3.6)} km/h
              </div>
            `
                : ""
            }
            ${
              location.heading !== undefined
                ? `
              <div style="margin-bottom: 8px;">
                <strong>Heading:</strong> ${Math.round(location.heading)}°
              </div>
            `
                : ""
            }
            <div style="margin-bottom: 8px;">
              <strong>Last Updated:</strong><br/>
              <span style="font-size: 12px;">
                ${new Date(location.timestamp).toLocaleString()}
              </span>
            </div>
            <div style="margin-top: 10px; padding: 8px; background: #f0f9ff; border-radius: 6px; border-left: 3px solid #3b82f6;">
              <small style="color: #1e40af;">
                ✅ Real-time location tracking active
              </small>
            </div>
          </div>
        `,
        position: { lat: location.latitude, lng: location.longitude },
      });
      infoWindow.open(map);
    });

    // Store all references for cleanup
    const enhancedMarker = Object.assign(marker, {
      pulseCircle,
      pulseInterval,
      accuracyCircle,
    });

    setUserMarker(enhancedMarker);

    // Smart map centering - only pan if location changed significantly
    const currentCenter = map.getCenter();
    if (currentCenter) {
      // Simple distance calculation without geometry library
      const lat1 = location.latitude;
      const lng1 = location.longitude;
      const lat2 = currentCenter.lat();
      const lng2 = currentCenter.lng();

      const R = 6371e3; // Earth's radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lng2 - lng1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in meters

      // Only pan if moved more than 100m or this is the first location
      if (distance > 100 || !currentCenter) {
        console.log("🎯 Centering map on current location");
        map.panTo({ lat: location.latitude, lng: location.longitude });

        // Ensure appropriate zoom level
        const currentZoom = map.getZoom() || 15;
        if (currentZoom < 14) {
          map.setZoom(15);
        }
      }
    }

    // Cleanup function
    return () => {
      if (pulseInterval) {
        clearInterval(pulseInterval);
      }
      if (pulseCircle) {
        pulseCircle.setMap(null);
      }
      if (accuracyCircle) {
        accuracyCircle.setMap(null);
      }
    };
  }, [map, location]);

  // Continuous location tracking
  useEffect(() => {
    if (!map || !trackUserLocation) return;

    if ("geolocation" in navigator) {
      // Check if location access is supported and request permission
      navigator.permissions
        ?.query({ name: "geolocation" })
        .then((permissionStatus) => {
          console.log("Geolocation permission status:", permissionStatus.state);
        })
        .catch(() => {
          console.log("Permission API not supported");
        });

      setIsTracking(true);

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          console.log("Location update:", newLocation);

          // Update user marker
          if (userMarker) {
            userMarker.setPosition({
              lat: newLocation.latitude,
              lng: newLocation.longitude,
            });
          }

          // Keep map centered on user location (gentle pan, not aggressive)
          map.panTo({
            lat: newLocation.latitude,
            lng: newLocation.longitude,
          });

          // Call location update callback
          if (onLocationUpdate) {
            onLocationUpdate({
              lat: newLocation.latitude,
              lng: newLocation.longitude,
            });
          }
        },
        (error) => {
          let errorMessage = "Unknown location error";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location access denied by user. Please enable location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage =
                "Location information unavailable. Please check your GPS/network.";
              break;

            default:
              errorMessage = `Location error: ${error.message}`;
              break;
          }

          console.warn("Location tracking error:", errorMessage);
          setIsTracking(false);
          setLocationError(errorMessage);

          // Clear error after 5 seconds
          setTimeout(() => {
            setLocationError(null);
          }, 5000);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000, // Allow cached location up to 30 seconds old
        },
      );

      setLocationWatcher(watchId);
    } else {
      console.warn("Geolocation not supported by this browser");
      setIsTracking(false);
    }

    return () => {
      if (locationWatcher) {
        navigator.geolocation.clearWatch(locationWatcher);
        setLocationWatcher(null);
        setIsTracking(false);
      }
    };
  }, [map, trackUserLocation]);

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
            fillColor: "#8b5cf6", // Purple for contacts instead of green
            fillOpacity: 1,
            strokeColor: "#7c3aed",
            strokeWeight: 2,
          },
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
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

  // Handle route rendering
  useEffect(() => {
    if (
      !map ||
      !directionsService ||
      !directionsRenderer ||
      !location ||
      !destination
    )
      return;

    const origin = { lat: location.latitude, lng: location.longitude };

    // Calculate distance to avoid ZERO_RESULTS for very close destinations
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(origin.lat, origin.lng),
      new google.maps.LatLng(destination.lat, destination.lng),
    );

    // If destination is too close (less than 50 meters), don't request directions
    if (distance < 50) {
      console.log("Destination too close, skipping directions");
      return;
    }

    // Convert string travel mode to Google Maps enum
    const getTravelMode = (mode: string): google.maps.TravelMode => {
      switch (mode) {
        case "DRIVING":
          return google.maps.TravelMode.DRIVING;
        case "BICYCLING":
          return google.maps.TravelMode.BICYCLING;
        case "WALKING":
        default:
          return google.maps.TravelMode.WALKING;
      }
    };

    // Try directions with selected travel mode, fallback to others if needed
    const tryDirections = (mode: google.maps.TravelMode) => {
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: mode,
          avoidHighways:
            mode === google.maps.TravelMode.WALKING ||
            mode === google.maps.TravelMode.BICYCLING,
          avoidTolls: mode !== google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
            // Pass directions to parent component for turn-by-turn instructions
            if (onDirectionsChange) {
              onDirectionsChange(result);
            }
          } else if (mode === getTravelMode(travelMode)) {
            // Try fallback modes if primary mode fails
            console.log(`${travelMode} directions failed, trying fallback`);
            if (travelMode === "BICYCLING") {
              tryDirections(google.maps.TravelMode.WALKING);
            } else if (travelMode === "WALKING") {
              tryDirections(google.maps.TravelMode.DRIVING);
            } else {
              tryDirections(google.maps.TravelMode.WALKING);
            }
          } else {
            console.log("All directions failed, drawing simple line");

            // Clear any existing directions
            directionsRenderer.setDirections({
              routes: [],
            } as google.maps.DirectionsResult);

            // Fallback: Draw a simple polyline
            if (routePolyline) {
              routePolyline.setMap(null);
            }

            const path = [origin, destination];
            const polyline = new google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: "#1DA1F2", // Twitter blue
              strokeOpacity: 0.8,
              strokeWeight: 4,
            });

            polyline.setMap(map);
            setRoutePolyline(polyline);

            // Add destination marker since directions failed
            if (destinationMarker) {
              destinationMarker.setMap(null);
            }

            const marker = new google.maps.Marker({
              position: destination,
              map: map,
              title: "Destination",
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#1DA1F2",
                fillOpacity: 1,
                strokeColor: "#0d7eb8",
                strokeWeight: 2,
              },
            });
            setDestinationMarker(marker);
          }
        },
      );
    };

    // Start with selected travel mode
    tryDirections(getTravelMode(travelMode));

    // Cleanup function
    return () => {
      if (routePolyline) {
        routePolyline.setMap(null);
        setRoutePolyline(null);
      }
      if (destinationMarker) {
        destinationMarker.setMap(null);
        setDestinationMarker(null);
      }
    };
  }, [
    map,
    directionsService,
    directionsRenderer,
    location,
    destination,
    travelMode,
  ]);

  // Clear route when destination is removed
  useEffect(() => {
    if (!destination && directionsRenderer) {
      directionsRenderer.setDirections({
        routes: [],
      } as google.maps.DirectionsResult);
      if (routePolyline) {
        routePolyline.setMap(null);
        setRoutePolyline(null);
      }
      if (destinationMarker) {
        destinationMarker.setMap(null);
        setDestinationMarker(null);
      }
    }
  }, [destination, directionsRenderer]);

  // Handle custom route path rendering (if provided instead of destination)
  useEffect(() => {
    if (!map || routePath.length === 0) return;

    // Clear existing route polyline
    if (routePolyline) {
      routePolyline.setMap(null);
    }

    // Create polyline for custom route path
    const polyline = new google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: "#1DA1F2", // Twitter blue
      strokeOpacity: 1.0,
      strokeWeight: 6,
    });

    polyline.setMap(map);
    setRoutePolyline(polyline);

    // Fit map bounds to show entire route
    const bounds = new google.maps.LatLngBounds();
    routePath.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds);

    return () => {
      polyline.setMap(null);
    };
  }, [map, routePath]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Road-Based Safety Areas with Dynamic Shapes */}
      <RoadBasedSafetyAreas
        map={map}
        userLocation={
          location
            ? { latitude: location.latitude, longitude: location.longitude }
            : undefined
        }
        showSafeAreaCircles={showSafeAreaCircles}
        onAreaUpdate={(areas) => {
          // Real-time road-based safety monitoring
          console.log(
            `Updated ${areas.length} road-based safety areas with real-time data`,
          );
        }}
      />

      {/* Location error notification */}
      {locationError && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-destructive/90 text-destructive-foreground px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{locationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom touch-friendly zoom controls */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-2 z-10">
        <Button
          size="sm"
          variant="secondary"
          className="w-10 h-10 rounded-full shadow-lg hover:scale-110 transition-all duration-200 text-lg font-bold bg-white/90 backdrop-blur-sm border border-black/10"
          onClick={() => {
            if (map) {
              const currentZoom = map.getZoom() || 15;
              const newZoom = Math.min(currentZoom + 1, 20);

              // Smooth zoom animation
              map.setZoom(newZoom);

              // Add haptic feedback if available
              if ("vibrate" in navigator) {
                navigator.vibrate(20);
              }
            }
          }}
          aria-label="Zoom in"
        >
          +
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="w-10 h-10 rounded-full shadow-lg hover:scale-110 transition-all duration-200 text-lg font-bold bg-white/90 backdrop-blur-sm border border-black/10"
          onClick={() => {
            if (map) {
              const currentZoom = map.getZoom() || 15;
              const newZoom = Math.max(currentZoom - 1, 3);

              // Smooth zoom animation
              map.setZoom(newZoom);

              // Add haptic feedback if available
              if ("vibrate" in navigator) {
                navigator.vibrate(20);
              }
            }
          }}
          aria-label="Zoom out"
        >
          −
        </Button>
      </div>

      {/* My Location button */}
      <div className="absolute right-4 bottom-32 z-10">
        <Button
          size="sm"
          variant="secondary"
          className={`w-10 h-10 rounded-full shadow-lg hover:scale-110 transition-all duration-300 bg-white/90 backdrop-blur-sm border border-black/10 ${
            isTracking
              ? "bg-primary text-primary-foreground shadow-primary/20"
              : ""
          }`}
          onClick={() => {
            if (map && location) {
              // Smooth pan and zoom to user location
              map.panTo({ lat: location.latitude, lng: location.longitude });
              setTimeout(() => {
                map.setZoom(16);
              }, 200);

              // Haptic feedback
              if ("vibrate" in navigator) {
                navigator.vibrate(30);
              }
            } else {
              // Request location permission
              if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const newLocation = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    };
                    map?.panTo(newLocation);
                    map?.setZoom(16);
                    if (onLocationUpdate) {
                      onLocationUpdate(newLocation);
                    }
                  },
                  (error) => {
                    console.error("One-time location request failed:", error);
                  },
                  {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 300000, // 5 minutes
                  },
                );
              }
            }
          }}
          aria-label="Center on my location"
        >
          <Locate
            className={`h-4 w-4 transition-transform duration-300 ${
              isTracking ? "animate-pulse scale-110" : ""
            }`}
          />
        </Button>

        {/* Location status indicator */}
        {isTracking && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>
    </div>
  );
}

function MapError() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-muted">
      <div className="text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <h3 className="text-lg font-semibold">Map Unavailable</h3>
          <p className="text-sm text-muted-foreground">
            Unable to load Google Maps. Using offline mode.
          </p>
        </div>
        <MockMap />
      </div>
    </div>
  );
}

export function GoogleMap(props: GoogleMapProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    return <MapError />;
  }

  return (
    <Wrapper
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={["geometry"]}
      render={MapError}
    >
      <MapComponent {...props} />
    </Wrapper>
  );
}
