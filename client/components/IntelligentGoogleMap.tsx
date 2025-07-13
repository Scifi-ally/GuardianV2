import { useEffect, useRef, useState, useCallback } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Navigation,
  Locate,
  Volume2,
  VolumeX,
  MapPin,
  Shield,
  AlertTriangle,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { enhancedFirebaseService } from "@/services/enhancedFirebaseService";
import { safeAIService } from "@/services/safeAIService";
import { notifications } from "@/services/enhancedNotificationService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE";

interface IntelligentGoogleMapProps {
  location?: { latitude: number; longitude: number; accuracy?: number };
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  onMapLoad?: (map: google.maps.Map) => void;
  className?: string;
}

interface NavigationState {
  isNavigating: boolean;
  destination: google.maps.LatLng | null;
  currentRoute: google.maps.DirectionsResult | null;
  safetyScore: number;
  estimatedTime: string;
  totalDistance: string;
  nextInstruction?: string;
}

interface SafetyHeatmapData {
  location: google.maps.LatLng;
  weight: number;
  color: string;
}

export function IntelligentGoogleMap({
  location,
  onLocationChange,
  onMapLoad,
  className,
}: IntelligentGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] =
    useState<google.maps.Marker | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    destination: null,
    currentRoute: null,
    safetyScore: 75,
    estimatedTime: "",
    totalDistance: "",
  });
  const [isTracking, setIsTracking] = useState(false);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [safetyOverlay, setSafetyOverlay] = useState<SafetyHeatmapData[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [autoZoom, setAutoZoom] = useState(true);

  // Initialize enhanced map
  useEffect(() => {
    if (!mapRef.current || map) return;

    try {
      const newMap = new google.maps.Map(mapRef.current, {
        zoom: 15,
        center: location
          ? { lat: location.latitude, lng: location.longitude }
          : { lat: 37.7749, lng: -122.4194 },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          // Enhanced map styling for better visibility
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#f8f9fa" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#e9ecef" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#adb5bd" }],
          },
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "simplified" }],
          },
          {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "simplified" }],
          },
        ],
        disableDefaultUI: true,
        zoomControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        gestureHandling: "greedy",
        clickableIcons: false,
        backgroundColor: "#f8f9fa",
        maxZoom: 20,
        minZoom: 3,
      });

      // Initialize direction services
      const directionsServiceInstance = new google.maps.DirectionsService();
      const directionsRendererInstance = new google.maps.DirectionsRenderer({
        map: newMap,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#2563eb", // Blue color for routes
          strokeWeight: 6,
          strokeOpacity: 0.8,
          geodesic: true,
          icons: [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                fillColor: "#2563eb",
                fillOpacity: 1,
                scale: 3,
                strokeColor: "#ffffff",
                strokeWeight: 1,
              },
              offset: "0%",
              repeat: "80px",
            },
          ],
        },
        panel: null,
        draggable: false,
      });

      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);
      setMap(newMap);
      onMapLoad?.(newMap);
    } catch (error) {
      console.error("❌ Failed to initialize map:", error);
    }
  }, [mapRef.current, location]);

  // Create and update user location marker
  useEffect(() => {
    if (!map || !location) return;

    if (userMarker) {
      // Update existing marker position smoothly
      const newPosition = new google.maps.LatLng(
        location.latitude,
        location.longitude,
      );

      // Smooth animation to new position
      animateMarkerToPosition(userMarker, newPosition);
    } else {
      // Create new user marker
      const marker = new google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map,
        title: `Your location (±${Math.round(location.accuracy || 0)}m)`,
        icon: createUserLocationIcon(false),
        zIndex: 10000,
        optimized: false,
      });

      setUserMarker(marker);
    }
  }, [map, location]);

  // Update marker icon when navigation state changes
  useEffect(() => {
    if (!userMarker) return;

    const icon = createUserLocationIcon(navigationState.isNavigating);
    userMarker.setIcon(icon);
  }, [userMarker, navigationState.isNavigating, currentHeading]);

  // Handle navigation start
  const startNavigation = useCallback(
    async (
      destination: google.maps.LatLng,
      routeAnalysis: any,
    ): Promise<void> => {
      if (!map || !directionsService || !directionsRenderer || !location) {
        console.warn("Navigation services not ready");
        return;
      }

      try {
        // Calculate route
        const result = await new Promise<google.maps.DirectionsResult>(
          (resolve, reject) => {
            directionsService.route(
              {
                origin: { lat: location.latitude, lng: location.longitude },
                destination: destination,
                travelMode: google.maps.TravelMode.WALKING,
                unitSystem: google.maps.UnitSystem.METRIC,
                optimizeWaypoints: true,
              },
              (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(new Error(`Directions failed: ${status}`));
                }
              },
            );
          },
        );

        // Display route
        directionsRenderer.setDirections(result);

        // Create destination marker
        if (destinationMarker) {
          destinationMarker.setMap(null);
        }

        const destMarker = new google.maps.Marker({
          position: destination,
          map,
          title: "Destination",
          icon: createDestinationIcon(),
          zIndex: 9999,
        });

        setDestinationMarker(destMarker);

        // Update navigation state
        const route = result.routes[0];
        const leg = route.legs[0];

        setNavigationState({
          isNavigating: true,
          destination,
          currentRoute: result,
          safetyScore: routeAnalysis.overallSafety,
          estimatedTime: leg.duration?.text || "Unknown",
          totalDistance: leg.distance?.text || "Unknown",
          nextInstruction: leg.steps[0]?.instructions || "",
        });

        // Enable navigation mode
        setIsNavigationMode(true);
        setIsTracking(true);

        // Auto-zoom to route if enabled
        if (autoZoom) {
          const bounds = new google.maps.LatLngBounds();
          bounds.extend({ lat: location.latitude, lng: location.longitude });
          bounds.extend(destination);
          map.fitBounds(bounds, { top: 80, right: 40, bottom: 200, left: 40 });

          // Zoom in after fitting bounds
          setTimeout(() => {
            map.setZoom(18);
            map.setCenter({ lat: location.latitude, lng: location.longitude });
          }, 1000);
        }

        // Start enhanced location tracking
        startEnhancedTracking();

        // Navigation started successfully
      } catch (error) {
        console.error("❌ Navigation start failed:", error);
        console.error("Failed to start navigation:", error);
      }
    },
    [map, directionsService, directionsRenderer, location, autoZoom],
  );

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setNavigationState({
      isNavigating: false,
      destination: null,
      currentRoute: null,
      safetyScore: 75,
      estimatedTime: "",
      totalDistance: "",
    });

    setIsNavigationMode(false);
    setIsTracking(false);

    // Clear map elements
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] } as any);
    }

    if (destinationMarker) {
      destinationMarker.setMap(null);
      setDestinationMarker(null);
    }

    // Reset map view
    if (map && location) {
      map.setZoom(15);
      map.setCenter({ lat: location.latitude, lng: location.longitude });
      map.setTilt(0);
      map.setHeading(0);
    }

    enhancedLocationService.stopTracking();
    // Navigation stopped successfully
  }, [directionsRenderer, destinationMarker, map, location]);

  // Enhanced location tracking
  const startEnhancedTracking = useCallback(() => {
    enhancedLocationService.startTracking();

    const unsubscribe = enhancedLocationService.subscribe((locationData) => {
      const newLocation = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      };

      onLocationChange?.(newLocation);

      // Update heading for navigation
      if (locationData.heading !== undefined) {
        setCurrentHeading(locationData.heading);
      }

      // Auto-follow during navigation
      if (map && isNavigationMode && autoZoom) {
        const position = new google.maps.LatLng(
          locationData.latitude,
          locationData.longitude,
        );

        map.panTo(position);

        // 3D navigation view
        if (locationData.heading !== undefined) {
          map.setHeading(locationData.heading);
          map.setTilt(45);
        }
      }
    });

    return unsubscribe;
  }, [map, isNavigationMode, autoZoom, onLocationChange]);

  // Generate safety heatmap
  const generateSafetyHeatmap = useCallback(async () => {
    if (!map) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const heatmapData: SafetyHeatmapData[] = [];
    const gridSize = 0.005; // ~500m grid

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    for (let lat = sw.lat(); lat <= ne.lat(); lat += gridSize) {
      for (let lng = sw.lng(); lng <= ne.lng(); lng += gridSize) {
        // Mock safety score (in production, this would be real AI analysis)
        const hour = new Date().getHours();
        const baseScore = 70 + (hour >= 6 && hour <= 18 ? 15 : -10);
        const variation = Math.floor((lat * lng * 1000) % 30) - 15;
        const score = Math.max(30, Math.min(95, baseScore + variation));

        heatmapData.push({
          location: new google.maps.LatLng(lat, lng),
          weight: (100 - score) / 100, // Higher weight for less safe areas
          color: score >= 70 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444",
        });
      }
    }

    setSafetyOverlay(heatmapData);
  }, [map]);

  // Helper functions
  const animateMarkerToPosition = (
    marker: google.maps.Marker,
    newPosition: google.maps.LatLng,
  ) => {
    const currentPosition = marker.getPosition();
    if (!currentPosition) return;

    const steps = 20;
    const deltaLat = (newPosition.lat() - currentPosition.lat()) / steps;
    const deltaLng = (newPosition.lng() - currentPosition.lng()) / steps;

    let step = 0;
    const animateStep = () => {
      if (step <= steps) {
        const intermediatePosition = new google.maps.LatLng(
          currentPosition.lat() + deltaLat * step,
          currentPosition.lng() + deltaLng * step,
        );
        marker.setPosition(intermediatePosition);
        step++;
        requestAnimationFrame(animateStep);
      }
    };

    animateStep();
  };

  const createUserLocationIcon = (isNavigating: boolean) => {
    const size = isNavigating ? 28 : 24;
    const pulseColor = isNavigating ? "#2563eb" : "#22c55e";

    return {
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="rgba(37, 99, 235, 0.2)" stroke="${pulseColor}" stroke-width="2"/>
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="${pulseColor}" stroke="white" stroke-width="2"/>
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 6}" fill="white"/>
          ${
            isNavigating
              ? `
            <path d="M${size / 2} 4 L${size / 2 + 4} ${size / 2 + 2} L${size / 2} ${size / 2 - 1} L${size / 2 - 4} ${size / 2 + 2} Z"
                  fill="${pulseColor}" stroke="white" stroke-width="1"
                  transform="rotate(${currentHeading} ${size / 2} ${size / 2})"/>
          `
              : ""
          }
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size / 2, size / 2),
    };
  };

  const createDestinationIcon = () => {
    return {
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40S32 28 32 16C32 7.16 24.84 0 16 0Z" fill="#dc2626"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
          <circle cx="16" cy="16" r="3" fill="#dc2626"/>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(32, 40),
      anchor: new google.maps.Point(16, 40),
    };
  };

  const recenterMap = () => {
    if (map && location) {
      const position = new google.maps.LatLng(
        location.latitude,
        location.longitude,
      );
      map.panTo(position);
      map.setZoom(isNavigationMode ? 18 : 15);
    }
  };

  const toggleNavigationMode = () => {
    if (isNavigationMode) {
      stopNavigation();
    } else {
      setIsNavigationMode(true);
      setIsTracking(true);
      startEnhancedTracking();
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
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Wrapper apiKey={GOOGLE_MAPS_API_KEY} libraries={["geometry", "places"]}>
        <div ref={mapRef} className="w-full h-full" />

        {/* Navigation Status - Top Left */}
        {navigationState.isNavigating && (
          <Card className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Navigating</span>
                <Badge
                  variant={
                    navigationState.safetyScore >= 70
                      ? "default"
                      : "destructive"
                  }
                  className={
                    navigationState.safetyScore >= 70
                      ? "bg-green-600"
                      : "bg-orange-600"
                  }
                >
                  {navigationState.safetyScore}/100
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  Distance: {navigationState.totalDistance} •{" "}
                  {navigationState.estimatedTime}
                </div>
                {navigationState.nextInstruction && (
                  <div className="font-medium text-foreground">
                    {navigationState.nextInstruction.replace(/<[^>]*>/g, "")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Safety Score - Top Right */}
        {!navigationState.isNavigating && location && (
          <Card className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <div className="text-xs">
                  <div className="text-muted-foreground">Area Safety</div>
                  <div className="font-medium text-green-600">Safe Zone</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Controls - Bottom Right */}
        {showControls && (
          <div className="absolute bottom-20 right-4 z-[1000] flex flex-col gap-2">
            <Button
              onClick={recenterMap}
              size="sm"
              variant="outline"
              className="bg-white/95 backdrop-blur-sm shadow-lg h-10 w-10 p-0"
            >
              <Locate className="h-4 w-4" />
            </Button>

            {navigationState.isNavigating && (
              <>
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  size="sm"
                  variant="outline"
                  className="bg-white/95 backdrop-blur-sm shadow-lg h-10 w-10 p-0"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  onClick={() => setAutoZoom(!autoZoom)}
                  size="sm"
                  variant={autoZoom ? "default" : "outline"}
                  className="bg-white/95 backdrop-blur-sm shadow-lg h-10 w-10 p-0"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>

                <Button
                  onClick={stopNavigation}
                  size="sm"
                  variant="destructive"
                  className="h-10 w-10 p-0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Real-time Location Status - Bottom Left */}
        {isTracking && (
          <Card className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm shadow-lg">
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium">Live Tracking</span>
              </div>
            </CardContent>
          </Card>
        )}
      </Wrapper>

      {/* Component ready for navigation */}
    </div>
  );
}

export default IntelligentGoogleMap;
