import { useEffect, useRef, useState, useCallback } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield, Locate, Layers, AlertTriangle } from "lucide-react";
import { MockMap } from "@/components/MockMap";
import EnhancedSafetyAreas from "@/components/EnhancedSafetyAreas";
import { useNotifications } from "@/components/NotificationSystem";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { geminiNewsAnalysisService } from "@/services/geminiNewsAnalysisService";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE";

console.log("🗺️ EnhancedGoogleMap - API Key available:", !!GOOGLE_MAPS_API_KEY);

interface EnhancedGoogleMapProps {
  location?: { latitude: number; longitude: number; accuracy?: number };
  destination?: { lat: number; lng: number };
  showTraffic?: boolean;
  showSafeZones?: boolean;
  showEmergencyServices?: boolean;
  showSafeAreaCircles?: boolean;
  mapTheme?: "standard" | "silver" | "dark" | "retro" | "night";
  mapType?: "roadmap" | "satellite" | "hybrid" | "terrain";
  zoomLevel?: number;
  onDirectionsChange?: (
    directions: google.maps.DirectionsResult | null,
  ) => void;
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  onEmergencyServiceClick?: (service: any) => void;
  travelMode?: string;
}

export function EnhancedGoogleMap({
  location,
  destination,
  showTraffic = false,
  showSafeZones = false,
  showEmergencyServices = false,
  showSafeAreaCircles = false,
  mapTheme = "standard",
  mapType = "roadmap",
  zoomLevel = 15,
  onDirectionsChange,
  onLocationChange,
  onEmergencyServiceClick,
  travelMode = "WALKING",
}: EnhancedGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(location);
  const { addNotification } = useNotifications();

  // Enhanced live location tracking
  const startLiveTracking = useCallback(async () => {
    try {
      setIsTracking(true);

      // Subscribe to location updates
      const unsubscribe = enhancedLocationService.subscribe((locationData) => {
        const newLocation = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
        };

        setCurrentLocation(newLocation);
        onLocationChange?.(newLocation);

        // Update marker with smooth animation
        if (userMarker && map) {
          const newPosition = new google.maps.LatLng(
            locationData.latitude,
            locationData.longitude,
          );

          // Smooth marker movement animation
          smoothMoveMarker(userMarker, newPosition);

          // Update accuracy circle if it exists
          if ((userMarker as any).accuracyCircle) {
            (userMarker as any).accuracyCircle.setRadius(locationData.accuracy);
            (userMarker as any).accuracyCircle.setCenter(newPosition);
          }
        }
      });

      // Start tracking
      await enhancedLocationService.startTracking({
        enableHighAccuracy: true,
        maximumAge: 5000, // 5 seconds for live tracking
        timeout: 15000,
      });

      addNotification({
        type: "info",
        title: "Location Tracking",
        message: "Live location tracking started",
      });

      return unsubscribe;
    } catch (error) {
      console.error("Failed to start live tracking:", error);
      setIsTracking(false);
      addNotification({
        type: "error",
        title: "Location Error",
        message: "Failed to start location tracking",
      });
    }
  }, [userMarker, map, onLocationChange, addNotification]);

  const stopLiveTracking = useCallback(() => {
    enhancedLocationService.stopTracking();
    setIsTracking(false);
    addNotification({
      type: "info",
      title: "Location Tracking",
      message: "Live location tracking stopped",
    });
  }, [addNotification]);

  // Smooth marker movement animation
  const smoothMoveMarker = useCallback(
    (marker: google.maps.Marker, newPosition: google.maps.LatLng) => {
      const currentPos = marker.getPosition();
      if (!currentPos) return;

      const steps = 30;
      const deltaLat = (newPosition.lat() - currentPos.lat()) / steps;
      const deltaLng = (newPosition.lng() - currentPos.lng()) / steps;

      let step = 0;
      const animateStep = () => {
        if (step <= steps) {
          const intermediatePos = new google.maps.LatLng(
            currentPos.lat() + deltaLat * step,
            currentPos.lng() + deltaLng * step,
          );
          marker.setPosition(intermediatePos);
          step++;
          requestAnimationFrame(animateStep);
        }
      };

      animateStep();
    },
    [],
  );

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) {
      console.log(
        "🗺️ Map init skipped - mapRef:",
        !!mapRef.current,
        "map exists:",
        !!map,
      );
      return;
    }

    console.log("🗺️ Initializing Google Map...");

    const newMap = new google.maps.Map(mapRef.current, {
      zoom: zoomLevel,
      center: currentLocation
        ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
        : { lat: 37.7749, lng: -122.4194 },
      mapTypeId: mapType as google.maps.MapTypeId,
      styles: getMapStyles(mapTheme),
      disableDefaultUI: true,
      zoomControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      rotateControl: false,
      gestureHandling: "greedy",
      clickableIcons: true,
      backgroundColor: "#f5f5f5",
    });

    console.log("🗺️ Google Map created successfully");
    setMap(newMap);
  }, [mapRef.current, mapTheme, mapType, zoomLevel, currentLocation]);

  // Enhanced user location marker with live updates
  useEffect(() => {
    if (!map || !currentLocation) return;

    // Remove existing marker
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

    // Create enhanced marker with live tracking indicator
    const customIcon = {
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Outer glow for live tracking -->
          ${isTracking ? '<circle cx="20" cy="20" r="19" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" stroke-width="2"/>' : ""}
          <!-- Main location circle -->
          <circle cx="20" cy="20" r="12" fill="${isTracking ? "#22c55e" : "#3b82f6"}" stroke="white" stroke-width="3"/>
          <!-- Inner pulse dot -->
          <circle cx="20" cy="20" r="6" fill="white" opacity="${isTracking ? "0.8" : "1"}"/>
          <!-- Center dot -->
          <circle cx="20" cy="20" r="3" fill="${isTracking ? "#22c55e" : "#3b82f6"}"/>
          <!-- Live indicator -->
          ${isTracking ? '<circle cx="32" cy="8" r="4" fill="#ef4444" stroke="white" stroke-width="2"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/></circle>' : ""}
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20),
    };

    const marker = new google.maps.Marker({
      position: {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      },
      map,
      title: `📍 ${isTracking ? "Live Location" : "Your Location"}\nAccuracy: ±${Math.round(currentLocation.accuracy || 0)}m`,
      icon: customIcon,
      animation: google.maps.Animation.DROP,
      zIndex: 10000,
      optimized: false,
    });

    // Add accuracy circle
    let accuracyCircle: google.maps.Circle | null = null;
    if (currentLocation.accuracy && currentLocation.accuracy < 1000) {
      accuracyCircle = new google.maps.Circle({
        strokeColor: isTracking ? "#22c55e" : "#3b82f6",
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: isTracking ? "#22c55e" : "#3b82f6",
        fillOpacity: 0.1,
        map,
        center: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        radius: currentLocation.accuracy,
        zIndex: 9999,
      });
      (marker as any).accuracyCircle = accuracyCircle;
    }

    // Enhanced pulse animation for live tracking
    if (isTracking) {
      const pulseCircle = new google.maps.Circle({
        strokeColor: "#22c55e",
        strokeOpacity: 1,
        strokeWeight: 3,
        fillColor: "#22c55e",
        fillOpacity: 0.2,
        map,
        center: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        radius: 50,
        zIndex: 9998,
      });

      let pulseRadius = 30;
      let growing = true;
      const pulseInterval = setInterval(() => {
        if (growing) {
          pulseRadius += 3;
          if (pulseRadius >= 80) growing = false;
        } else {
          pulseRadius -= 3;
          if (pulseRadius <= 30) growing = true;
        }

        pulseCircle.setRadius(pulseRadius);
        pulseCircle.setOptions({
          fillOpacity: 0.3 - (pulseRadius - 30) / 200,
          strokeOpacity: 0.8 - (pulseRadius - 30) / 150,
        });
      }, 100);

      (marker as any).pulseCircle = pulseCircle;
      (marker as any).pulseInterval = pulseInterval;
    }

    // Info window with live tracking info
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="p-3 max-w-xs">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full ${isTracking ? "bg-green-500 animate-pulse" : "bg-blue-500"}"></div>
            <h3 class="font-semibold text-gray-800">${isTracking ? "Live Location" : "Your Location"}</h3>
          </div>
          <div class="text-sm text-gray-600 space-y-1">
            <div>📍 ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}</div>
            <div>🎯 Accuracy: ±${Math.round(currentLocation.accuracy || 0)}m</div>
            <div>⏰ Updated: ${new Date().toLocaleTimeString()}</div>
            ${isTracking ? '<div class="text-green-600 font-medium">🔴 Live tracking active</div>' : ""}
          </div>
        </div>
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    setUserMarker(marker);
  }, [map, currentLocation, isTracking]);

  // Auto-start live tracking when component mounts
  useEffect(() => {
    if (map && currentLocation && !isTracking) {
      startLiveTracking();
    }

    return () => {
      if (isTracking) {
        stopLiveTracking();
      }
    };
  }, [map, currentLocation]);

  const getMapStyles = (theme: string): google.maps.MapTypeStyle[] => {
    const styles = {
      standard: [],
      silver: [
        { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
      ],
      dark: [
        { elementType: "geometry", stylers: [{ color: "#212121" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
      ],
      retro: [
        { elementType: "geometry", stylers: [{ color: "#ebe3cd" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1e6" }] },
      ],
      night: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      ],
    };
    return styles[theme as keyof typeof styles] || [];
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Google Maps API key not configured
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Wrapper apiKey={GOOGLE_MAPS_API_KEY} libraries={["geometry", "places"]}>
        <div ref={mapRef} className="w-full h-full" />

        {/* Live tracking controls - positioned relative to map container */}
        {map && (
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Button
              onClick={isTracking ? stopLiveTracking : startLiveTracking}
              size="sm"
              variant={isTracking ? "destructive" : "default"}
              className={`shadow-lg bg-white text-black hover:bg-gray-100 border border-gray-300 ${isTracking ? "!bg-red-500 !text-white hover:!bg-red-600" : ""}`}
            >
              <Locate className="h-4 w-4 mr-2" />
              {isTracking ? "Stop Live" : "Start Live"}
            </Button>

            {isTracking && (
              <Badge
                variant="default"
                className="bg-green-500 text-white animate-pulse text-center"
              >
                🔴 Live
              </Badge>
            )}
          </div>
        )}

        {/* Enhanced Safety Areas */}
        {map && showSafeAreaCircles && (
          <EnhancedSafetyAreas
            map={map}
            userLocation={currentLocation}
            showSafeAreaCircles={showSafeAreaCircles}
            onAreaUpdate={(areas) => {
              console.log(`Updated ${areas.length} enhanced safety areas`);
            }}
          />
        )}
      </Wrapper>
    </div>
  );
}

// Fallback component when Google Maps is not available
function MapError() {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Unable to load Google Maps. Using offline mode.
        </p>
      </div>
    </div>
  );
}

export { EnhancedGoogleMap as GoogleMap };
