import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Search,
  Navigation,
  MapPin,
  X,
  Menu,
  Star,
  Clock,
  Route,
  ArrowUp,
  ArrowDown,
  Car,
  Directions,
  MoreHorizontal,
  Phone,
  Globe,
  Share,
  AlertTriangle,
  Target,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EnhancedSlideUpPanel } from "@/components/EnhancedSlideUpPanel";
import { MapFocusedPanel } from "@/components/MapFocusedPanel";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LocationSharingInfoButton } from "@/components/LocationSharingInfo";
import { EmergencyAlerts } from "@/components/EmergencyAlerts";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import { EnhancedRouteSelection } from "@/components/EnhancedRouteSelection";
import { EnhancedNavigationDisplay } from "@/components/EnhancedNavigationDisplay";
import { routeCalculationService } from "@/services/routeCalculationService";
import { notifications } from "@/services/enhancedNotificationService";
import { unifiedNotifications } from "@/services/unifiedNotificationService";
import { useRealTime } from "@/hooks/useRealTime";
import { SimpleNavigationSearch } from "@/components/SimpleNavigationSearch";
import AINavigationPanel from "@/components/AINavigationPanel";

// Extend window interface for Google Maps
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

interface PlaceDetails {
  name: string;
  address: string;
  rating?: number;
  photos?: string[];
  phone?: string;
  website?: string;
  hours?: string;
  priceLevel?: number;
}

// Helper function for location error messages
const getLocationErrorMessage = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location access denied by user";
    case error.POSITION_UNAVAILABLE:
      return "Location information unavailable";
    case error.TIMEOUT:
      return "Location request timed out";
    default:
      return error.message || "Unknown location error";
  }
};

const AdvancedMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { currentUser, userProfile } = useAuth();

  // Real-time data management
  const {
    location: realTimeLocation,
    isLocationTracking,
    stats,
    traffic,
    connectionState,
  } = useRealTime();

  // Legacy location state (for compatibility with existing components)
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);

  // Update legacy location when real-time location changes
  useEffect(() => {
    if (realTimeLocation) {
      setLocation({
        latitude: realTimeLocation.latitude,
        longitude: realTimeLocation.longitude,
      });
    }
  }, [realTimeLocation]);

  // Core Map State
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [placesService, setPlacesService] = useState<any>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);

  // Location State
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<LocationData | null>(null);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);

  // Search State
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Navigation State from original Index.tsx
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeInstructions, setRouteInstructions] = useState<string[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [destination, setDestination] = useState<
    { latitude: number; longitude: number } | undefined
  >(undefined);

  // Enhanced Navigation State
  const [navigationData, setNavigationData] = useState<any>(null);
  const [turnByTurnInstructions, setTurnByTurnInstructions] = useState<any[]>(
    [],
  );
  const [routeSummary, setRouteSummary] = useState<any>(null);
  const [routeOptions, setRouteOptions] = useState<any>(null);
  const [showRouteSelection, setShowRouteSelection] = useState(false);
  const [isNavigationMinimized, setIsNavigationMinimized] = useState(false);

  // Map Control State
  const [mapType, setMapType] = useState("roadmap");
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [satelliteEnabled, setSatelliteEnabled] = useState(false);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationError, setShowLocationError] = useState(false);

  // Map initialization
  const initializeMap = useCallback(() => {
    if (!mapRef.current) {
      console.error("Map container not found");
      setIsLoading(false);
      return;
    }

    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded");
      setIsLoading(false);
      return;
    }

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.006 },
        zoom: 15,
        mapTypeId: "roadmap",
        disableDefaultUI: true,
        gestureHandling: "greedy",
        backgroundColor: "#e5e3df",
        clickableIcons: true,
        keyboardShortcuts: false,
        mapTypeControl: false,
        scaleControl: false,
        scrollwheel: true,
        streetViewControl: false,
        zoomControl: false,
        fullscreenControl: false,
      });

      setMap(mapInstance);

      // Initialize services
      const directionsServiceInstance =
        new window.google.maps.DirectionsService();
      const directionsRendererInstance =
        new window.google.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: "#1a73e8",
            strokeWeight: 6,
            strokeOpacity: 0.8,
          },
        });

      const placesServiceInstance = new window.google.maps.places.PlacesService(
        mapInstance,
      );

      directionsRendererInstance.setMap(mapInstance);
      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);
      setPlacesService(placesServiceInstance);

      // Get user location with improved error handling
      if (navigator.geolocation) {
        // First try a quick, less accurate location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: LocationData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(location);
            mapInstance.setCenter(location);

            // Add user location marker
            new window.google.maps.Marker({
              position: location,
              map: mapInstance,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285f4",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
              },
              title: "Your location",
              zIndex: 1000,
            });

            setIsLoading(false);
          },
          (error) => {
            const errorMessage = getLocationErrorMessage(error);
            console.warn("Location error:", errorMessage);

            // Show user-friendly error message only for permission denied
            if (error.code === error.PERMISSION_DENIED) {
              setLocationError(
                "Please enable location access for the best experience",
              );
              setShowLocationError(true);
              // Hide error after 5 seconds
              setTimeout(() => setShowLocationError(false), 5000);
            }

            // Always stop loading even if location fails
            setIsLoading(false);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 600000, // 10 minutes cache
          },
        );
      } else {
        console.warn("Geolocation not supported");
        setIsLoading(false);
      }

      // Initialize autocomplete
      if (searchInputRef.current && window.google.maps.places) {
        try {
          const autocompleteInstance =
            new window.google.maps.places.Autocomplete(searchInputRef.current, {
              fields: [
                "place_id",
                "geometry",
                "name",
                "formatted_address",
                "rating",
                "photos",
                "international_phone_number",
                "website",
                "opening_hours",
                "price_level",
              ],
            });

          autocompleteInstance.addListener("place_changed", () => {
            const place = autocompleteInstance.getPlace();
            if (place.geometry?.location) {
              handlePlaceSelect(place);
            }
          });

          setAutocomplete(autocompleteInstance);
        } catch (error) {
          console.error("Failed to initialize autocomplete:", error);
        }
      }

      // Add click listener for places
      mapInstance.addListener("click", (event: any) => {
        if (event.placeId) {
          event.stop();
          getPlaceDetails(event.placeId);
        }
      });

      // Add event listeners for map controls
      const handleRecenterMap = (event: any) => {
        try {
          if (event?.detail && mapInstance) {
            mapInstance.setCenter(event.detail);
            mapInstance.setZoom(16);
            console.log("✅ Map recentered to:", event.detail);
          } else if (userLocation && mapInstance) {
            mapInstance.setCenter(userLocation);
            mapInstance.setZoom(16);
            console.log("✅ Map recentered to user location:", userLocation);
          } else {
            console.warn(
              "⚠️ Recenter failed: missing location or map instance",
            );
          }
        } catch (error) {
          console.error("❌ Recenter error:", error);
        }
      };

      const handleToggle3D = () => {
        try {
          if (mapInstance) {
            const currentTilt = mapInstance.getTilt() || 0;
            const newTilt = currentTilt === 0 ? 45 : 0;
            mapInstance.setTilt(newTilt);
            console.log(`✅ 3D view toggled: ${newTilt}° tilt`);
          } else {
            console.warn("⚠️ 3D toggle failed: no map instance");
          }
        } catch (error) {
          console.error("❌ 3D toggle error:", error);
        }
      };

      // Handle emergency navigation from SOS notifications
      const handleEmergencyNavigation = (event: any) => {
        const { destination, coordinates, senderName } = event.detail;

        // Set destination and start navigation
        setToLocation(destination);
        setFromLocation("Current Location");

        // Auto-start the search/navigation
        setTimeout(() => {
          handleSearch();
        }, 500);

        unifiedNotifications.success("🚨 Emergency Navigation", {
          message: `Navigating to ${senderName}'s location`,
        });
      };

      window.addEventListener("recenterMap", handleRecenterMap);
      window.addEventListener("toggle3DView", handleToggle3D);
      window.addEventListener(
        "startEmergencyNavigation",
        handleEmergencyNavigation,
      );

      // Store cleanup function
      const cleanup = () => {
        window.removeEventListener("recenterMap", handleRecenterMap);
        window.removeEventListener("toggle3DView", handleToggle3D);
        window.removeEventListener(
          "startEmergencyNavigation",
          handleEmergencyNavigation,
        );
      };

      // Store cleanup in map instance for later use
      (mapInstance as any).cleanup = cleanup;
    } catch (error) {
      console.error("Failed to initialize map:", error);
      setIsLoading(false);
    }
  }, []);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]',
      );
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (window.google && window.google.maps) {
            initializeMap();
          }
        });
        return;
      }

      // Create new script
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Global callback function
      window.initGoogleMaps = () => {
        if (window.google && window.google.maps) {
          initializeMap();
        } else {
          console.error("Google Maps API failed to load");
          setIsLoading(false);
        }
      };

      script.onerror = () => {
        console.error("Failed to load Google Maps script");
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();

    // Cleanup
    return () => {
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps;
      }

      // Cleanup map event listeners
      if (map && (map as any).cleanup) {
        (map as any).cleanup();
      }
    };
  }, [initializeMap]);

  const handlePlaceSelect = useCallback(
    (place: any) => {
      const location: LocationData = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address,
        name: place.name,
      };

      setSelectedPlace(location);
      setSearchValue(place.name || place.formatted_address || "");

      const details: PlaceDetails = {
        name: place.name || "Unknown Place",
        address: place.formatted_address || "",
        rating: place.rating,
        phone: place.international_phone_number,
        website: place.website,
        hours: place.opening_hours?.weekday_text?.[0],
        priceLevel: place.price_level,
      };

      setPlaceDetails(details);

      if (map) {
        map.setCenter(location);
        map.setZoom(17);

        // Add place marker
        new window.google.maps.Marker({
          position: location,
          map: map,
          title: place.name,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 7,
            fillColor: "#ea4335",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
      }

      setPanelHeight(400);
    },
    [map],
  );

  const getPlaceDetails = useCallback(
    (placeId: string) => {
      if (!placesService) return;

      placesService.getDetails(
        {
          placeId: placeId,
          fields: [
            "name",
            "formatted_address",
            "geometry",
            "rating",
            "photos",
            "international_phone_number",
            "website",
            "opening_hours",
            "price_level",
          ],
        },
        (place: any, status: any) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place
          ) {
            handlePlaceSelect(place);
          }
        },
      );
    },
    [placesService, handlePlaceSelect],
  );

  const startNavigation = useCallback(() => {
    if (
      !map ||
      !directionsService ||
      !directionsRenderer ||
      !userLocation ||
      !selectedPlace
    ) {
      return;
    }

    setIsNavigating(true);

    directionsService.route(
      {
        origin: userLocation,
        destination: selectedPlace,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === "OK" && result) {
          directionsRenderer.setDirections(result);

          const route = result.routes[0];
          const leg = route.legs[0];

          setNavigationData({
            distance: leg.distance?.text,
            duration: leg.duration?.text,
            steps: leg.steps,
          });

          // Extract instructions
          const instructions = leg.steps.map((step: any, index: number) => ({
            instruction:
              step.instructions?.replace(/<[^>]*>/g, "") || `Step ${index + 1}`,
            distance: step.distance?.text || "",
            duration: step.duration?.text || "",
          }));

          setRouteInstructions(instructions);
          setPanelHeight(500);
        }
      },
    );
  }, [map, directionsService, directionsRenderer, userLocation, selectedPlace]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setNavigationData(null);
    setRouteInstructions([]);
    setTurnByTurnInstructions([]);
    setRouteSummary(null);

    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
    }

    setPanelHeight(300);
  }, [directionsRenderer]);

  // Handle map type changes
  const handleMapTypeChange = useCallback(
    (type: string) => {
      setMapType(type);
      if (map) {
        map.setMapTypeId(type);
      }
    },
    [map],
  );

  // Handle traffic overlay toggle
  const handleTrafficToggle = useCallback(
    (enabled: boolean) => {
      setTrafficEnabled(enabled);
      if (map) {
        try {
          // Clear existing traffic layer first
          if (window.currentTrafficLayer) {
            window.currentTrafficLayer.setMap(null);
          }

          if (enabled) {
            const trafficLayer = new window.google.maps.TrafficLayer();
            trafficLayer.setMap(map);
            window.currentTrafficLayer = trafficLayer;
            console.log("✅ Traffic layer enabled");
          } else {
            console.log("✅ Traffic layer disabled");
          }
        } catch (error) {
          console.error("❌ Traffic toggle error:", error);
        }
      }
    },
    [map],
  );

  // Handle satellite/POI toggle
  const handleSatelliteToggle = useCallback(
    (enabled: boolean) => {
      setSatelliteEnabled(enabled);
      if (map) {
        try {
          // Toggle POI visibility - when enabled, show POIs
          const styles = enabled
            ? [
                // Show POIs when enabled
                {
                  featureType: "poi",
                  stylers: [{ visibility: "on" }],
                },
              ]
            : [
                // Hide POIs when disabled
                {
                  featureType: "poi",
                  stylers: [{ visibility: "off" }],
                },
              ];

          map.setOptions({ styles });
          console.log(`✅ POI visibility: ${enabled ? "enabled" : "disabled"}`);
        } catch (error) {
          console.error("❌ POI toggle error:", error);
        }
      }
    },
    [map],
  );

  // Route handling methods from original Index.tsx
  const handleUseCurrentLocation = useCallback(() => {
    if (location) {
      const currentLocationString = `${location.latitude.toFixed(
        6,
      )}, ${location.longitude.toFixed(6)}`;
      setFromLocation(currentLocationString);

      unifiedNotifications.success("Current location set", {
        message: "Using your current location as starting point",
      });
    } else {
      notifications.warning({
        title: "Location Unavailable",
        description: "Please enable location services",
      });
    }
  }, [location]);

  const handleRouteSelect = useCallback((route: any) => {
    if (!route) return;

    // Update the route instructions and summary
    const leg = route.legs[0];
    setRouteSummary({
      distance: leg.distance?.text || "Unknown",
      duration: leg.duration?.text || "Unknown",
      overview: route.summary || "Route calculated",
    });

    // Extract step-by-step instructions
    const steps =
      leg.steps?.map((step: any, index: number) => ({
        instruction:
          step.instructions?.replace(/<[^>]*>/g, "") || `Step ${index + 1}`,
        distance: step.distance?.text || "",
        duration: step.duration?.text || "",
        maneuver: step.maneuver || undefined,
      })) || [];

    setTurnByTurnInstructions(steps);

    // Also update the basic route instructions for backward compatibility
    const basicInstructions = steps.map(
      (step: any, index: number) =>
        `${index + 1}. ${step.instruction} (${step.distance})`,
    );
    setRouteInstructions(basicInstructions);

    setShowRouteSelection(false);
    setIsNavigating(true);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!fromLocation || !toLocation) {
      notifications.warning({
        title: "Missing Information",
        description: "Please enter both starting point and destination.",
        vibrate: true,
      });
      return;
    }

    setIsNavigating(true);

    try {
      // If destination is already set from autocomplete, use it directly
      let destinationCoords = destination;

      // Otherwise, geocode the address
      if (!destinationCoords) {
        const geocoder = new window.google.maps.Geocoder();
        const geocodeResult = await new Promise<any[]>((resolve, reject) => {
          geocoder.geocode(
            { address: toLocation },
            (results: any, status: any) => {
              if (status === window.google.maps.GeocoderStatus.OK && results) {
                resolve(results);
              } else {
                reject(new Error(`Could not find "${toLocation}"`));
              }
            },
          );
        });

        if (geocodeResult.length > 0) {
          const coords = {
            latitude: geocodeResult[0].geometry.location.lat(),
            longitude: geocodeResult[0].geometry.location.lng(),
          };
          destinationCoords = coords;
          setDestination(coords);
        }
      }

      if (!destinationCoords || !location) {
        throw new Error("Destination coordinates not available");
      }

      // Show route selection modal after calculating routes
      try {
        const routes = await routeCalculationService.calculateRoutes(
          { latitude: location.latitude, longitude: location.longitude },
          {
            latitude: destinationCoords.latitude,
            longitude: destinationCoords.longitude,
          },
        );

        setRouteOptions(routes);
        setShowRouteSelection(true);
      } catch (routeError) {
        console.error("Route calculation failed:", routeError);
        notifications.error({
          title: "Route Calculation Failed",
          description: "Unable to calculate route. Please try again.",
        });
        setIsNavigating(false);
      }
    } catch (error) {
      console.error("Search failed:", error);
      notifications.error({
        title: "Search Failed",
        description: "Please check your destination and try again.",
      });
      setIsNavigating(false);
    }
  }, [fromLocation, toLocation, destination, location]);

  return (
    <ErrorBoundary>
      <div className="relative h-screen w-full overflow-hidden bg-[#e5e3df]">
        {/* Clean Google Maps Container */}
        <div ref={mapRef} className="h-full w-full" />

        {/* Google Maps Style Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="bg-white rounded-lg shadow-lg border border-gray-300">
            <div className="flex items-center p-3">
              <Menu className="h-5 w-5 text-gray-600 mr-3 cursor-pointer" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search Google Maps"
                className="flex-1 outline-none text-gray-800 placeholder-gray-500 text-base"
              />
              {searchValue && (
                <button onClick={() => setSearchValue("")} className="ml-2 p-1">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Simple Navigation Search */}
        <SimpleNavigationSearch
          toLocation={toLocation}
          setToLocation={setToLocation}
          onSearch={(destination) => {
            setFromLocation("Current Location");
            handleSearch();
          }}
          onPlaceSelect={(place) => {
            console.log("🎯 Place selected:", place);
            if (place.geometry?.location || place.coordinates) {
              setToLocation(
                place.formatted_address || place.name || "Selected location",
              );
            }
          }}
          location={
            location
              ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                }
              : null
          }
          isSearching={isNavigating}
        />

        {/* Clear Route Button */}
        {destination && (
          <div className="container mx-auto px-3 py-1">
            <Button
              onClick={() => {
                setDestination(undefined);
                setIsNavigating(false);
                setRouteInstructions([]);
                setTurnByTurnInstructions([]);
                setRouteSummary(null);

                unifiedNotifications.success("Route cleared", {
                  message: "Navigation route has been removed",
                });
              }}
              size="sm"
              variant="outline"
              className="w-full h-8 text-sm bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
            >
              Clear Route
            </Button>
          </div>
        )}

        {/* Emergency Alerts */}
        <EmergencyAlerts />

        {/* AI Navigation Panel */}
        <AINavigationPanel
          isVisible={showAIPanel}
          onClose={() => setShowAIPanel(false)}
        />

        {/* Notification Permission Prompt */}
        <NotificationPermissionPrompt
          onClose={() => setShowNotificationPrompt(false)}
          autoShow={true}
        />

        {/* Enhanced Route Selection Modal */}
        {showRouteSelection && routeOptions && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <EnhancedRouteSelection
                routes={[
                  routeOptions.safestRoute,
                  routeOptions.quickestRoute,
                  ...(routeOptions.recommendedRoute
                    ? [routeOptions.recommendedRoute]
                    : []),
                ]}
                onRouteSelect={handleRouteSelect}
                onClose={() => setShowRouteSelection(false)}
                autoSelectQuickest={true}
              />
            </div>
          </div>
        )}

        {/* Enhanced Map-Focused Slide Up Panel */}
        <EnhancedSlideUpPanel
          minHeight={200}
          navbarHeight={96}
          safeAreaBottom={0}
          collapsedHeight={56}
          onTouchOutside={() => {}}
        >
          <MapFocusedPanel
            // Navigation props
            isNavigating={isNavigating}
            routeSummary={
              routeSummary
                ? {
                    distance: routeSummary.distance,
                    duration: routeSummary.duration,
                    traffic: "moderate",
                  }
                : undefined
            }
            currentStep={
              turnByTurnInstructions.length > 0
                ? {
                    instruction: turnByTurnInstructions[0]?.instruction || "",
                    distance: turnByTurnInstructions[0]?.distance || "0 m",
                    direction:
                      turnByTurnInstructions[0]?.direction || "straight",
                  }
                : undefined
            }
            onStopNavigation={stopNavigation}
            // Map control props
            mapType={mapType}
            onMapTypeChange={handleMapTypeChange}
            trafficEnabled={trafficEnabled}
            onTrafficToggle={handleTrafficToggle}
            satelliteEnabled={satelliteEnabled}
            onSatelliteToggle={handleSatelliteToggle}
          />
        </EnhancedSlideUpPanel>

        {/* Professional Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-white z-50 flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Loading Navigation
                </h3>
                <p className="text-sm text-gray-600">
                  Initializing map and location services...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Location Error State */}
        {showLocationError && locationError && (
          <div className="absolute top-20 left-4 right-4 z-30">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-amber-800 font-medium text-sm">
                    {locationError}
                  </p>
                  <p className="text-amber-700 text-xs mt-1">
                    You can still search for places and get directions
                  </p>
                </div>
                <button
                  onClick={() => setShowLocationError(false)}
                  className="ml-2 p-1 rounded hover:bg-amber-100 transition-colors"
                >
                  <X className="h-4 w-4 text-amber-600" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AdvancedMap;
