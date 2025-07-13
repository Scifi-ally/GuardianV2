import { useEffect, useRef, useState, useCallback } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  Shield,
  Locate,
  Navigation,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { cn } from "@/lib/utils";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE";

interface GoogleMapsNavigationViewProps {
  location?: { latitude: number; longitude: number; accuracy?: number };
  destination?: { lat: number; lng: number };
  isNavigating?: boolean;
  safetyScore?: number;
  travelMode?: string;
  onDirectionsChange?: (
    directions: google.maps.DirectionsResult | null,
  ) => void;
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  onMapLoad?: (map: google.maps.Map) => void;
}

export function GoogleMapsNavigationView({
  location,
  destination,
  isNavigating = false,
  safetyScore = 75,
  travelMode = "WALKING",
  onDirectionsChange,
  onLocationChange,
  onMapLoad,
}: GoogleMapsNavigationViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] =
    useState<google.maps.Marker | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(location);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentRoute, setCurrentRoute] =
    useState<google.maps.DirectionsResult | null>(null);

  // Initialize map with Google Maps styling
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (map) {
      return;
    }

    try {
      const newMap = new google.maps.Map(mapRef.current, {
        zoom: 17,
        center: currentLocation
          ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
          : { lat: 37.7749, lng: -122.4194 },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        // Google Maps-like styling
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#f5f5f5" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#dadada" }],
          },
          {
            featureType: "road.highway",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "road.arterial",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "road.local",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "transit",
            elementType: "all",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "poi",
            elementType: "all",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9c9c9" }],
          },
        ],
        // Remove all default controls for clean Google Maps look
        disableDefaultUI: true,
        zoomControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        rotateControl: false,
        scaleControl: false,
        panControl: false,
        gestureHandling: "greedy",
        clickableIcons: false,
        backgroundColor: "#e5e3df",
        // Navigation-specific settings
        tilt: 0,
        maxZoom: 20,
        minZoom: 10,
      });

      setMap(newMap);

      // Initialize direction services
      const directionsServiceInstance = new google.maps.DirectionsService();
      const directionsRendererInstance = new google.maps.DirectionsRenderer({
        map: newMap,
        suppressMarkers: true, // We'll handle markers manually
        polylineOptions: {
          strokeColor: "#1E40AF", // Blue color for better visibility
          strokeWeight: 8, // Good thickness for visibility
          strokeOpacity: 0.8,
          geodesic: true,
          icons: [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                fillColor: "#1E40AF",
                fillOpacity: 1,
                scale: 4,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
              offset: "0%",
              repeat: "60px", // Arrows every 60px
            },
          ],
        },
        panel: null,
        draggable: false,
      });

      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);

      // Notify parent component that map is loaded
      onMapLoad?.(newMap);
    } catch (error) {}
  }, [mapRef.current, currentLocation]);

  // Create user location marker (only once)
  useEffect(() => {
    if (!map || !currentLocation || userMarker) return;

    // Create Google Maps-style user marker (only once)
    const marker = new google.maps.Marker({
      position: {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      },
      map,
      title: "Your location",
      icon: {
        url: `data:image/svg+xml,${encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#4285f4" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12),
      },
      zIndex: 10000,
      optimized: false,
    });

    setUserMarker(marker);
  }, [map]); // Only depend on map, not currentLocation

  // Update marker position when location changes (without recreating)
  useEffect(() => {
    if (!userMarker || !currentLocation) return;

    const newPosition = new google.maps.LatLng(
      currentLocation.latitude,
      currentLocation.longitude,
    );

    // Update marker position smoothly without animation
    userMarker.setPosition(newPosition);

    // Update title with new accuracy
    userMarker.setTitle(
      `Your location (±${Math.round(currentLocation.accuracy || 0)}m)`,
    );
  }, [userMarker, currentLocation]);

  // Update marker icon when navigation state changes
  useEffect(() => {
    if (!userMarker) return;

    const icon = {
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" fill="#4285f4" stroke="#ffffff" stroke-width="2"/>
          <circle cx="12" cy="12" r="3" fill="#ffffff"/>
          ${
            isNavigating
              ? `
            <path d="M12 2 L16 10 L12 8 L8 10 Z" fill="#4285f4" stroke="#ffffff" stroke-width="1"
                  transform="rotate(${currentHeading} 12 12)"/>
          `
              : ""
          }
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(24, 24),
      anchor: new google.maps.Point(12, 12),
    };

    userMarker.setIcon(icon);
  }, [userMarker, isNavigating, currentHeading]);

  // Auto-start tracking when navigating
  useEffect(() => {
    if (isNavigating && !isTracking) {
      startLiveTracking();
    }
  }, [isNavigating, isTracking]);

  // Handle destination and route calculation
  useEffect(() => {
    if (
      !map ||
      !destination ||
      !currentLocation ||
      !directionsService ||
      !directionsRenderer
    )
      return;

    // Remove existing destination marker
    if (destinationMarker) {
      destinationMarker.setMap(null);
    }

    // Create Google Maps-style destination marker
    const destMarker = new google.maps.Marker({
      position: { lat: destination.lat, lng: destination.lng },
      map,
      title: "Destination",
      icon: {
        url: `data:image/svg+xml,${encodeURIComponent(`
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#ea4335"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(32, 40),
        anchor: new google.maps.Point(16, 40),
      },
      // Remove animation: google.maps.Animation.DROP to stop drop effect
      zIndex: 9999,
    });

    setDestinationMarker(destMarker);

    // Calculate route
    const request: google.maps.DirectionsRequest = {
      origin: { lat: currentLocation.latitude, lng: currentLocation.longitude },
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode: travelMode as google.maps.TravelMode,
      unitSystem: google.maps.UnitSystem.METRIC,
      optimizeWaypoints: true,
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
        setCurrentRoute(result);
        onDirectionsChange?.(result);

        // Log route details
        const route = result.routes[0];

        if (!isNavigating) {
          // Fit map to route for overview
          const bounds = new google.maps.LatLngBounds();
          bounds.extend({
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
          });
          bounds.extend({ lat: destination.lat, lng: destination.lng });
          map.fitBounds(bounds, { top: 80, right: 40, bottom: 200, left: 40 });
        }
      } else {
      }
    });
  }, [
    map,
    destination,
    currentLocation,
    directionsService,
    directionsRenderer,
    travelMode,
    onDirectionsChange,
    isNavigating,
  ]);

  // Start live tracking with third-person navigation view
  const startLiveTracking = useCallback(async () => {
    try {
      setIsTracking(true);
      setIsNavigationMode(true);

      const unsubscribe = enhancedLocationService.subscribe((locationData) => {
        const newLocation = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
        };

        setCurrentLocation(newLocation);
        onLocationChange?.(newLocation);

        // Update heading for navigation
        if (locationData.heading !== undefined) {
          setCurrentHeading(locationData.heading);
        }

        // Update map view for navigation mode
        if (map && isNavigationMode) {
          const position = new google.maps.LatLng(
            locationData.latitude,
            locationData.longitude,
          );

          // Third-person navigation view - camera behind user
          map.panTo(position);
          map.setZoom(18);

          // Tilt map for 3D effect when navigating
          if (locationData.heading !== undefined) {
            map.setHeading(locationData.heading);
            map.setTilt(45); // 3D perspective
          }
        }

        // Update user marker position smoothly
        if (userMarker) {
          const newPosition = new google.maps.LatLng(
            locationData.latitude,
            locationData.longitude,
          );
          smoothMoveMarker(userMarker, newPosition);
        }
      });

      // Configure location service for high accuracy
      enhancedLocationService.setHighAccuracyMode(true);
      await enhancedLocationService.startTracking();

      return unsubscribe;
    } catch (error) {
      setIsTracking(false);
      setIsNavigationMode(false);
    }
  }, [map, userMarker, onLocationChange, isNavigationMode]);

  // Stop live tracking
  const stopLiveTracking = useCallback(() => {
    enhancedLocationService.stopTracking();
    setIsTracking(false);
    setIsNavigationMode(false);

    if (map) {
      map.setTilt(0);
      map.setHeading(0);
      map.setZoom(16);
    }
  }, [map]);

  // Smooth marker movement animation
  const smoothMoveMarker = useCallback(
    (marker: google.maps.Marker, newPosition: google.maps.LatLng) => {
      const currentPos = marker.getPosition();
      if (!currentPos) return;

      const steps = 60;
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

  // Toggle navigation mode
  const toggleNavigationMode = () => {
    if (isNavigationMode) {
      stopLiveTracking();
    } else {
      startLiveTracking();
    }
  };

  // Recenter map to user location
  const recenterMap = () => {
    if (map && currentLocation) {
      const position = new google.maps.LatLng(
        currentLocation.latitude,
        currentLocation.longitude,
      );
      map.panTo(position);
      map.setZoom(isNavigationMode ? 18 : 16);
    }
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-full bg-red-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 font-semibold">
            Google Maps API key required
          </p>
          <p className="text-xs text-red-500 mt-1">
            Check VITE_GOOGLE_MAPS_API_KEY environment variable
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Wrapper apiKey={GOOGLE_MAPS_API_KEY} libraries={["geometry", "places"]}>
        <div ref={mapRef} className="w-full h-full" />

        {/* Safety Score Indicator - Top Left */}
        <div className="absolute top-4 left-4 z-[1000]">
          <Card className="bg-white/95 backdrop-blur-sm p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Shield
                className={cn(
                  "h-4 w-4",
                  safetyScore >= 80
                    ? "text-green-500"
                    : safetyScore >= 60
                      ? "text-yellow-500"
                      : safetyScore >= 40
                        ? "text-orange-500"
                        : "text-red-500",
                )}
              />
              <div>
                <div className="text-xs text-gray-500">Safety</div>
                <div
                  className={cn(
                    "text-sm font-bold",
                    safetyScore >= 80
                      ? "text-green-600"
                      : safetyScore >= 60
                        ? "text-yellow-600"
                        : safetyScore >= 40
                          ? "text-orange-600"
                          : "text-red-600",
                  )}
                >
                  {safetyScore}%
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation Controls - Top Right */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {isNavigating && (
            <Button
              onClick={() => setIsMuted(!isMuted)}
              size="sm"
              variant="outline"
              className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg h-10 w-10 p-0"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            onClick={toggleNavigationMode}
            size="sm"
            variant={isNavigationMode ? "default" : "outline"}
            className={cn(
              "bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg h-10 w-10 p-0",
              isNavigationMode && "bg-blue-500 text-white hover:bg-blue-600",
            )}
          >
            <Navigation className="h-4 w-4" />
          </Button>

          <Button
            onClick={recenterMap}
            size="sm"
            variant="outline"
            className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg h-10 w-10 p-0"
          >
            <Locate className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Status - Bottom Right */}
        {isNavigating && (
          <div className="absolute bottom-4 right-4 z-[1000]">
            <Card className="bg-white/95 backdrop-blur-sm p-2 shadow-lg">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400",
                  )}
                />
                <span className="text-xs font-medium">
                  {isNavigationMode ? "Navigation" : "Overview"}
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Speed and ETA - Bottom Left (during navigation) */}
        {isNavigating && currentRoute && (
          <div className="absolute bottom-4 left-4 z-[1000]">
            <Card className="bg-white/95 backdrop-blur-sm p-3 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500">ETA</div>
                  <div className="text-sm font-bold">
                    {currentRoute.routes[0].legs[0].duration?.text || "—"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Distance</div>
                  <div className="text-sm font-bold">
                    {currentRoute.routes[0].legs[0].distance?.text || "—"}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Wrapper>
    </div>
  );
}

export default GoogleMapsNavigationView;
