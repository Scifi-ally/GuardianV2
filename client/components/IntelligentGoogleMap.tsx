import { useEffect, useRef, useState, useCallback } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, AlertTriangle } from "lucide-react";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { enhancedFirebaseService } from "@/services/enhancedFirebaseService";
import { safeAIService } from "@/services/safeAIService";
import { notifications } from "@/services/enhancedNotificationService";
import { advancedSafeZonesController } from "@/services/advancedSafeZonesController";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE";

// Load Google Maps with basic libraries (visualization removed as per requirements)
const GOOGLE_MAPS_LIBRARIES: ("geometry" | "places")[] = ["geometry", "places"];

interface IntelligentGoogleMapProps {
  location?: { latitude: number; longitude: number; accuracy?: number };
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  onMapLoad?: (map: google.maps.Map) => void;
  className?: string;
  showTraffic?: boolean;
  showSafeZones?: boolean;
  showEmergencyServices?: boolean;
}

// Navigation state interface
interface NavigationState {
  isNavigating: boolean;
  destination: google.maps.LatLng | null;
  currentRoute: google.maps.DirectionsRoute | null;
  safetyScore: number;
  estimatedTime: string;
  totalDistance: string;
  nextInstruction?: string;
}

function IntelligentGoogleMap({
  location,
  onLocationChange,
  onMapLoad,
  className,
  showTraffic = false,
  showSafeZones = false,
  showEmergencyServices = false,
}: IntelligentGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] =
    useState<google.maps.Marker | null>(null);
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
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
  const [autoZoom, setAutoZoom] = useState(true);
  const [currentMapTheme, setCurrentMapTheme] = useState<"light" | "dark">(
    "light",
  );
  const [currentMapType, setCurrentMapType] = useState<"normal" | "satellite">(
    "normal",
  );
  const [trafficLayer, setTrafficLayer] =
    useState<google.maps.TrafficLayer | null>(null);

  // Define map styles for different themes
  const getMapStyles = useCallback((theme: "light" | "dark") => {
    if (theme === "dark") {
      return [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
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
      ];
    } else {
      return [
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
      ];
    }
  }, []);

  // Apply theme to existing map
  const applyMapTheme = useCallback(
    (theme: "light" | "dark") => {
      if (map) {
        map.setOptions({
          styles: getMapStyles(theme),
        });
        setCurrentMapTheme(theme);
        console.log("Map theme applied:", theme);
      }
    },
    [map, getMapStyles],
  );

  // Detect system theme and apply
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e: MediaQueryListEvent) => {
      applyMapTheme(e.matches ? "dark" : "light");
    };

    // Apply initial theme
    applyMapTheme(mediaQuery.matches ? "dark" : "light");

    // Listen for theme changes
    mediaQuery.addEventListener("change", handleThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleThemeChange);
    };
  }, [map, applyMapTheme]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      zoom: 15,
      center: location
        ? { lat: location.latitude, lng: location.longitude }
        : { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
      mapTypeId: currentMapType === "satellite" ? "satellite" : "roadmap",
      styles: getMapStyles(currentMapTheme),
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: true,
      fullscreenControl: false,
      gestureHandling: "greedy",
      clickableIcons: false,
      disableDefaultUI: false,
      keyboardShortcuts: true,
    });

    setMap(newMap);

    // Initialize directions service and renderer
    const dirService = new google.maps.DirectionsService();
    const dirRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#2563eb",
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });

    dirRenderer.setMap(newMap);
    setDirectionsService(dirService);
    setDirectionsRenderer(dirRenderer);

    // Initialize safe zones controller
    advancedSafeZonesController.initialize(newMap);

    // Call onMapLoad callback
    onMapLoad?.(newMap);

    console.log("🗺️ Map initialized successfully");
  }, [mapRef.current, location]);

  // Handle map settings changes (traffic, safe zones, etc.)
  useEffect(() => {
    if (!map) return;

    // Traffic Layer
    if (showTraffic) {
      if (!trafficLayer) {
        const newTrafficLayer = new google.maps.TrafficLayer();
        newTrafficLayer.setMap(map);
        setTrafficLayer(newTrafficLayer);
        console.log("Traffic layer enabled");
      }
    } else {
      if (trafficLayer) {
        trafficLayer.setMap(null);
        setTrafficLayer(null);
        console.log("Traffic layer disabled");
      }
    }

    // Safe Zones - Advanced Controller
    advancedSafeZonesController.toggleSafeZones(showSafeZones);

    // Emergency Services (would show markers for hospitals, police, fire stations)
    if (showEmergencyServices) {
      // In a real implementation, this would fetch emergency services data
      console.log("Emergency services enabled");
    }
  }, [map, showTraffic, showSafeZones, showEmergencyServices, trafficLayer]);

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
                if (status === "OK" && result) {
                  resolve(result);
                } else {
                  reject(new Error(`Route calculation failed: ${status}`));
                }
              },
            );
          },
        );

        if (result.routes.length === 0) {
          throw new Error("No routes found");
        }

        const route = result.routes[0];
        const leg = route.legs[0];

        // Set navigation state
        setNavigationState({
          isNavigating: true,
          destination,
          currentRoute: route,
          safetyScore: routeAnalysis?.overallSafety || 75,
          estimatedTime: leg.duration?.text || "",
          totalDistance: leg.distance?.text || "",
          nextInstruction: leg.steps[0]?.instructions || "",
        });

        setIsNavigationMode(true);
        setIsTracking(true);

        // Display route
        directionsRenderer.setDirections(result);

        // Create destination marker
        const destMarker = new google.maps.Marker({
          position: destination,
          map,
          title: "Destination",
          icon: createDestinationIcon(),
          zIndex: 9999,
        });
        setDestinationMarker(destMarker);

        // Adjust map view for navigation
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
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size / 2, size / 2),
    };
  };

  const createDestinationIcon = () => {
    return {
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#dc2626" stroke="white" stroke-width="3"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
          <circle cx="16" cy="16" r="3" fill="#dc2626"/>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16),
    };
  };

  // Check if API key is available
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-full bg-red-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-red-800 font-medium">
            Google Maps API Key Missing
          </h3>
          <p className="text-red-600 text-sm">
            Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Wrapper apiKey={GOOGLE_MAPS_API_KEY} libraries={GOOGLE_MAPS_LIBRARIES}>
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
      </Wrapper>
    </div>
  );
}

export { IntelligentGoogleMap };
export default IntelligentGoogleMap;
