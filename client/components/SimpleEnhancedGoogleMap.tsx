import { useEffect, useRef, useState, useCallback } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Locate, AlertTriangle } from "lucide-react";
import { useNotifications } from "@/components/NotificationSystem";
import {
  realTimeMapData,
  type RealTimeMapData,
} from "@/services/realTimeMapData";

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE";

interface GoogleMapProps {
  location?: { latitude: number; longitude: number; accuracy?: number };
  destination?: { lat: number; lng: number };
  showTraffic?: boolean;
  showSafeZones?: boolean;
  showEmergencyServices?: boolean;
  showSafeAreaCircles?: boolean;
  showDebug?: boolean;
  mapTheme?: "light" | "dark" | "safety" | "night";
  mapType?: "normal" | "satellite" | "terrain";
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

export function GoogleMap({
  location,
  destination,
  showTraffic = false,
  showSafeZones = false,
  showEmergencyServices = false,
  showSafeAreaCircles = false,
  showDebug = false,
  mapTheme = "light",
  mapType = "normal",
  zoomLevel = 15,
  onDirectionsChange,
  onLocationChange,
  onEmergencyServiceClick,
  travelMode = "WALKING",
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [isTracking, setIsTracking] = useState(true); // Always tracking now
  const [trackingInterval, setTrackingInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [realTimeData, setRealTimeData] = useState<RealTimeMapData | null>(
    null,
  );
  const [emergencyMarkers, setEmergencyMarkers] = useState<
    google.maps.Marker[]
  >([]);
  const [trafficLayers, setTrafficLayers] = useState<google.maps.Polyline[]>(
    [],
  );
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);
  const [destinationMarker, setDestinationMarker] =
    useState<google.maps.Marker | null>(null);
  // Safety polygons removed - no map coloring
  const { addNotification } = useNotifications();

  console.log(
    "🗺️ SimpleEnhancedGoogleMap - API Key available:",
    !!GOOGLE_MAPS_API_KEY,
  );

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map || !GOOGLE_MAPS_API_KEY) {
      console.log(
        "🗺️ Map init skipped - mapRef:",
        !!mapRef.current,
        "map exists:",
        !!map,
        "API key:",
        !!GOOGLE_MAPS_API_KEY,
      );
      return;
    }

    console.log("🗺️ Initializing Simple Enhanced Google Map...");

    try {
      const newMap = new google.maps.Map(mapRef.current, {
        zoom: zoomLevel,
        center: location
          ? { lat: location.latitude, lng: location.longitude }
          : { lat: 37.7749, lng: -122.4194 },
        mapTypeId: (mapType === "normal"
          ? "roadmap"
          : mapType === "terrain"
            ? "terrain"
            : mapType) as google.maps.MapTypeId,
        styles: getMapStyles(mapTheme),
        disableDefaultUI: true,
        zoomControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        gestureHandling: "greedy",
        clickableIcons: true,
        backgroundColor: "#f5f5f5",
      });

      // Initialize directions services
      const directionsServiceInstance = new google.maps.DirectionsService();
      const directionsRendererInstance = new google.maps.DirectionsRenderer({
        map: newMap,
        suppressMarkers: true, // We'll handle markers manually
        polylineOptions: {
          strokeColor: "#1E40AF", // Blue color for visibility
          strokeWeight: 8,
          strokeOpacity: 0.8,
          geodesic: true,
          icons: [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                fillColor: "#1E40AF",
                fillOpacity: 1,
                scale: 4,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
              },
              offset: "0%",
              repeat: "100px",
            },
          ],
        },
        panel: null,
        draggable: false,
      });

      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);

      console.log("🗺️ Google Map created successfully with directions service");
      setMap(newMap);

      // Auto-center on current location when available
      if (location) {
        newMap.setCenter({ lat: location.latitude, lng: location.longitude });
        newMap.setZoom(16); // Closer zoom for current location
        console.log("📍 Map centered on current location");
      }

      // Initialize real-time data
      const bounds = newMap.getBounds();
      if (bounds) {
        realTimeMapData.startRealTimeUpdates(bounds);
      }
    } catch (error) {
      console.error("❌ Failed to create Google Map:", error);
    }
  }, [mapRef.current, mapTheme, mapType, zoomLevel]);

  // Subscribe to real-time data updates
  useEffect(() => {
    if (!map) return;

    const unsubscribe = realTimeMapData.subscribe((data) => {
      setRealTimeData(data);
      console.log("📡 Real-time data updated:", data);
    });

    return unsubscribe;
  }, [map]);

  // Update real-time data when map bounds change
  useEffect(() => {
    if (!map) return;

    const boundsListener = map.addListener("bounds_changed", () => {
      const bounds = map.getBounds();
      if (bounds) {
        // Debounce the update to avoid too many API calls
        setTimeout(() => {
          realTimeMapData.updateBounds(bounds);
        }, 2000);
      }
    });

    return () => {
      google.maps.event.removeListener(boundsListener);
    };
  }, [map]);

  // Force current location detection when map loads
  useEffect(() => {
    if (!map) return;

    console.log("🗺️ Map loaded, forcing current location detection...");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          console.log("📍 FORCED current location:", currentPos);
          onLocationChange?.(currentPos);

          // Immediately center and zoom to current location
          map.setCenter({
            lat: currentPos.latitude,
            lng: currentPos.longitude,
          });
          map.setZoom(17);
        },
        (error) => {
          console.error("❌ Failed to get current location:", error);
          // Try again with less strict settings
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const currentPos = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              };
              console.log("📍 Got current location (retry):", currentPos);
              onLocationChange?.(currentPos);
              map.setCenter({
                lat: currentPos.latitude,
                lng: currentPos.longitude,
              });
              map.setZoom(16);
            },
            (retryError) => {
              console.error("❌ Retry failed:", retryError);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
      );
    }
  }, [map, onLocationChange]);

  // Enhanced user location marker
  useEffect(() => {
    if (!map || !location) {
      console.log("🗺️ Skipping marker - map:", !!map, "location:", !!location);
      return;
    }

    const newPosition = { lat: location.latitude, lng: location.longitude };

    // If marker already exists, just update its position smoothly
    if (userMarker) {
      console.log("📍 Updating existing marker position:", location);
      userMarker.setPosition(newPosition);
      userMarker.setTitle(
        `📍 ${isTracking ? "Live Location" : "Your Location"}\nAccuracy: ±${Math.round(location.accuracy || 0)}m`,
      );
      return;
    }

    console.log("📍 Creating initial location marker for:", location);

    // Create enhanced marker (only once)
    const customIcon = {
      url: `data:image/svg+xml,${encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="15" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" stroke-width="2"/>
          <circle cx="16" cy="16" r="10" fill="${isTracking ? "#22c55e" : "#3b82f6"}" stroke="white" stroke-width="3"/>
          <circle cx="16" cy="16" r="5" fill="white"/>
          <circle cx="16" cy="16" r="3" fill="${isTracking ? "#22c55e" : "#3b82f6"}"/>
          ${isTracking ? '<circle cx="26" cy="6" r="3" fill="#ef4444" stroke="white" stroke-width="1"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/></circle>' : ""}
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16),
    };

    const marker = new google.maps.Marker({
      position: newPosition,
      map,
      title: `📍 ${isTracking ? "Live Location" : "Your Location"}\nAccuracy: ±${Math.round(location.accuracy || 0)}m`,
      icon: customIcon,
      animation: google.maps.Animation.DROP, // Only animate on initial creation
      zIndex: 10000,
      optimized: false,
    });

    // Add accuracy circle
    if (location.accuracy && location.accuracy < 1000) {
      new google.maps.Circle({
        strokeColor: isTracking ? "#22c55e" : "#3b82f6",
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: isTracking ? "#22c55e" : "#3b82f6",
        fillOpacity: 0.1,
        map,
        center: { lat: location.latitude, lng: location.longitude },
        radius: location.accuracy,
        zIndex: 9999,
      });
    }

    // Info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="p-3 max-w-xs">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full ${isTracking ? "bg-green-500 animate-pulse" : "bg-blue-500"}"></div>
            <h3 class="font-semibold text-gray-800">${isTracking ? "Live Location" : "Your Location"}</h3>
          </div>
          <div class="text-sm text-gray-600 space-y-1">
            <div>��� ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}</div>
            <div>🎯 Accuracy: ±${Math.round(location.accuracy || 0)}m</div>
            <div>⏰ Updated: ${new Date().toLocaleTimeString()}</div>
            ${isTracking ? '<div class="text-green-600 font-medium">�� Live tracking active</div>' : ""}
          </div>
        </div>
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    setUserMarker(marker);
  }, [map, location, isTracking]);

  // Ensure marker is always visible by getting location when map loads
  useEffect(() => {
    if (map && !location && navigator.geolocation) {
      console.log("🗺️ Map loaded, getting current location for marker...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          console.log("📍 Got location for initial marker:", currentPos);
          onLocationChange?.(currentPos);

          // Center map on current location
          if (map) {
            map.setCenter({
              lat: currentPos.latitude,
              lng: currentPos.longitude,
            });
            map.setZoom(16);
          }
        },
        (error) => {
          console.warn("❌ Failed to get initial location:", error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
      );
    }
  }, [map, location, onLocationChange]);

  // Render real-time emergency services
  useEffect(() => {
    if (!map || !showEmergencyServices || !realTimeData) return;

    // Clear existing markers
    emergencyMarkers.forEach((marker) => marker.setMap(null));

    const newMarkers = realTimeData.emergencyServices.map((service) => {
      const iconColor =
        service.availability === "available"
          ? "#22c55e"
          : service.availability === "busy"
            ? "#f59e0b"
            : "#ef4444";

      const icon = {
        url: `data:image/svg+xml,${encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="${iconColor}" stroke="white" stroke-width="2"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
              ${service.type === "police" ? "🚔" : service.type === "hospital" ? "🏥" : service.type === "fire" ? "🚒" : "🚑"}
            </text>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12),
      };

      const marker = new google.maps.Marker({
        position: service.position,
        map,
        icon,
        title: `${service.name} - ${service.availability}`,
        zIndex: 2000,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-xs">
            <h3 class="font-semibold mb-2">${service.name}</h3>
            <div class="space-y-1 text-sm">
              <div>Type: <span class="font-medium capitalize">${service.type}</span></div>
              <div>Status: <span class="font-medium" style="color: ${iconColor}">${service.availability}</span></div>
              <div>Response Time: <span class="font-medium">${service.responseTime} min</span></div>
              <div>Phone: <span class="font-medium">${service.phone}</span></div>
              <div class="text-xs text-gray-500 mt-2">
                Last Update: ${new Date(service.lastUpdate).toLocaleTimeString()}
              </div>
            </div>
          </div>
        `,
      });

      marker.addListener("click", () => infoWindow.open(map, marker));

      return marker;
    });

    setEmergencyMarkers(newMarkers);
    console.log(`🚨 Rendered ${newMarkers.length} emergency services`);
  }, [map, showEmergencyServices, realTimeData]);

  // Render real-time traffic data
  useEffect(() => {
    if (!map || !showTraffic || !realTimeData) return;

    // Clear existing traffic layers
    trafficLayers.forEach((layer) => layer.setMap(null));

    const newLayers = realTimeData.trafficData.map((traffic) => {
      const getTrafficColor = (level: string) => {
        switch (level) {
          case "low":
            return "#22c55e";
          case "moderate":
            return "#eab308";
          case "high":
            return "#f59e0b";
          case "severe":
            return "#ef4444";
          default:
            return "#6b7280";
        }
      };

      const polyline = new google.maps.Polyline({
        path: traffic.coords,
        strokeColor: getTrafficColor(traffic.congestionLevel),
        strokeOpacity: 0.8,
        strokeWeight: 6,
        map,
        zIndex: 1500,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-3">
            <h3 class="font-semibold mb-2">Traffic Info</h3>
            <div class="space-y-1 text-sm">
              <div>Congestion: <span class="font-medium capitalize">${traffic.congestionLevel}</span></div>
              <div>Speed: <span class="font-medium">${Math.round(traffic.averageSpeed)} km/h</span></div>
              ${
                traffic.incidents.length > 0
                  ? `
                <div class="mt-2">
                  <div class="text-red-600 font-medium">⚠️ Incidents:</div>
                  ${traffic.incidents
                    .map(
                      (incident) => `
                    <div class="text-xs">• ${incident.description}</div>
                  `,
                    )
                    .join("")}
                </div>
              `
                  : ""
              }
              <div class="text-xs text-gray-500 mt-2">
                Updated: ${new Date(traffic.lastUpdate).toLocaleTimeString()}
              </div>
            </div>
          </div>
        `,
      });

      polyline.addListener("click", (event: google.maps.PolyMouseEvent) => {
        infoWindow.setPosition(event.latLng);
        infoWindow.open(map);
      });

      return polyline;
    });

    setTrafficLayers(newLayers);
    console.log(`🚦 Rendered ${newLayers.length} traffic segments`);
  }, [map, showTraffic, realTimeData]);

  // Safety area rendering completely removed per user request

  // Auto-start live tracking when component mounts
  useEffect(() => {
    if (!isTracking) {
      startLiveTracking();
    }

    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, []);

  // Handle destination and calculate directions
  useEffect(() => {
    console.log("🗺️ Directions effect triggered:", {
      hasMap: !!map,
      hasDestination: !!destination,
      hasLocation: !!location,
      hasDirectionsService: !!directionsService,
      hasDirectionsRenderer: !!directionsRenderer,
      destination,
      location,
    });

    if (
      !map ||
      !destination ||
      !location ||
      !directionsService ||
      !directionsRenderer
    ) {
      console.log("🗺️ Skipping directions - missing requirements");
      return;
    }

    console.log("🗺️ Calculating route to destination:", destination);

    // Remove existing destination marker
    if (destinationMarker) {
      destinationMarker.setMap(null);
    }

    // Create destination marker
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
      zIndex: 9999,
    });

    setDestinationMarker(destMarker);

    // Calculate route
    const request: google.maps.DirectionsRequest = {
      origin: { lat: location.latitude, lng: location.longitude },
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode: travelMode as google.maps.TravelMode,
      unitSystem: google.maps.UnitSystem.METRIC,
      optimizeWaypoints: true,
    };

    console.log("🗺️ Requesting directions:", request);

    directionsService.route(request, (result, status) => {
      console.log("🗺️ Directions response:", { status, result });

      if (status === google.maps.DirectionsStatus.OK && result) {
        console.log("✅ Setting directions on renderer");
        directionsRenderer.setDirections(result);
        onDirectionsChange?.(result);

        // Fit map to route
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: location.latitude, lng: location.longitude });
        bounds.extend({ lat: destination.lat, lng: destination.lng });
        map.fitBounds(bounds, { top: 80, right: 40, bottom: 200, left: 40 });

        console.log("✅ Route calculated and displayed in blue");
      } else {
        console.error("❌ Directions request failed:", { status, result });
        addNotification({
          type: "error",
          title: "Navigation Error",
          message: "Could not calculate route. Please try again.",
        });
      }
    });
  }, [
    map,
    destination,
    location,
    directionsService,
    directionsRenderer,
    travelMode,
    onDirectionsChange,
    addNotification,
  ]);

  // Detect navigation state
  useEffect(() => {
    setIsNavigating(!!destination);
  }, [destination]);

  // Enhanced live tracking functionality
  const startLiveTracking = useCallback(() => {
    console.log("🎯 Starting automatic live location tracking...");
    setIsTracking(true);

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };

            console.log("📍 Auto live location update:", newLocation);
            onLocationChange?.(newLocation);

            // Update AI navigation service with new location
            import("@/services/aiEnhancedNavigation").then(
              ({ aiEnhancedNavigation }) => {
                aiEnhancedNavigation.updateLocation(newLocation);
              },
            );
          },
          (error) => {
            console.warn("📍 Auto tracking error:", error);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
        );
      }
    }, 3000); // Update every 3 seconds for better accuracy

    setTrackingInterval(interval);
    addNotification({
      type: "info",
      title: "Live Tracking",
      message: "Automatic live tracking active",
    });
  }, [onLocationChange, addNotification]);

  const getMapStyles = (theme: string): google.maps.MapTypeStyle[] => {
    const styles = {
      light: [
        // Clean, bright theme for daytime use
        { elementType: "geometry", stylers: [{ color: "#ffffff" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#333333" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#f8f8f8" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#e8e8e8" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#b3d9ff" }],
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#f0f0f0" }],
        },
      ],
      dark: [
        // Dark theme for low-light conditions
        { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#cccccc" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#2d2d2d" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#404040" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#0d47a1" }],
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#262626" }],
        },
      ],
      safety: [
        // High-contrast safety theme with emphasis on important features
        { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#000000" }] },
        {
          elementType: "labels.text.stroke",
          stylers: [{ color: "#ffffff", weight: 2 }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#000000" }],
        },
        {
          featureType: "road.arterial",
          elementType: "geometry",
          stylers: [{ color: "#666666" }],
        },
        {
          featureType: "poi.medical",
          elementType: "geometry",
          stylers: [{ color: "#ff0000" }],
        },
        {
          featureType: "poi.school",
          elementType: "geometry",
          stylers: [{ color: "#333333" }],
        },
        {
          featureType: "transit.station",
          elementType: "geometry",
          stylers: [{ color: "#888888" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#000000" }],
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#f0f0f0" }],
        },
      ],
      night: [
        // Optimized for nighttime navigation
        { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#ff6b6b" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0a" }] },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#1a1a1a" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#333333" }],
        },
        {
          featureType: "road.arterial",
          elementType: "geometry",
          stylers: [{ color: "#444444" }],
        },
        {
          featureType: "poi.medical",
          elementType: "geometry",
          stylers: [{ color: "#ff0000" }],
        },
        {
          featureType: "poi.school",
          elementType: "geometry",
          stylers: [{ color: "#666666" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#001122" }],
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#111111" }],
        },
      ],
    };
    return styles[theme as keyof typeof styles] || styles.light;
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Google Maps API key not configured
          </p>
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Wrapper apiKey={GOOGLE_MAPS_API_KEY} libraries={["geometry", "places"]}>
        <div ref={mapRef} className="w-full h-full" />

        {/* Navigation Status Indicator */}
        {map && isNavigating && (
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <Badge
              variant="default"
              className="bg-blue-500 text-white animate-pulse text-center justify-center"
            >
              🧭 Navigating
            </Badge>
            <Badge
              variant="default"
              className="bg-green-500 text-white text-center justify-center"
            >
              📍 Live Tracking
            </Badge>
          </div>
        )}
      </Wrapper>
    </div>
  );
}

export default GoogleMap;
