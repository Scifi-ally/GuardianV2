import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Navigation,
  Layers,
  MoreVertical,
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  MyLocation,
  DirectionsWalk,
  DirectionsCar,
  DirectionsTransit,
  DirectionsBike,
  Close,
  Star,
  Share,
  Phone,
  Globe,
  Clock,
  Route,
  Warning,
  Shield,
  Zap,
  MapPin,
} from "lucide-react";
import { googleMapsLoader } from "@/services/googleMapsLoader";
import { advancedSafetyScoring } from "@/services/advancedSafetyScoring";
import { cn } from "@/lib/utils";

interface RealTimeGoogleMapsCloneProps {
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  onDestinationSet?: (destination: {
    latitude: number;
    longitude: number;
  }) => void;
  className?: string;
}

interface PlaceDetails {
  name: string;
  address: string;
  rating?: number;
  reviews?: number;
  phone?: string;
  website?: string;
  hours?: string;
  photos?: string[];
}

export function RealTimeGoogleMapsClone({
  onLocationChange,
  onDestinationSet,
  className,
}: RealTimeGoogleMapsCloneProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null,
  );
  const locationWatchRef = useRef<number | null>(null);

  // State management
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    google.maps.places.PlaceResult[]
  >([]);
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [directionsMode, setDirectionsMode] = useState<google.maps.TravelMode>(
    google.maps.TravelMode.DRIVING,
  );
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [safetyScore, setSafetyScore] = useState<number>(0);
  const [safetyLevel, setSafetyLevel] = useState<"high" | "medium" | "low">(
    "medium",
  );
  const [showMenu, setShowMenu] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">(
    "roadmap",
  );
  const [showTraffic, setShowTraffic] = useState(true);
  const [trafficLayer, setTrafficLayer] =
    useState<google.maps.TrafficLayer | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const loaded = await googleMapsLoader.loadGoogleMaps();
        if (!loaded || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 37.7749, lng: -122.4194 }, // San Francisco default
          zoom: 15,
          disableDefaultUI: true,
          gestureHandling: "greedy",
          styles: [
            {
              featureType: "poi.business",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstanceRef.current = map;
        setIsLoaded(true);

        // Start real-time location tracking
        startLocationTracking();

        // Initialize directions renderer
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          suppressMarkers: false,
          draggable: true,
        });
        directionsRendererRef.current.setMap(map);

        // Initialize traffic layer
        const traffic = new google.maps.TrafficLayer();
        traffic.setMap(map);
        setTrafficLayer(traffic);

        // Add click listener for setting destinations
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            handleMapClick(lat, lng);
          }
        });

        console.log("✅ Real-time Google Maps initialized");
      } catch (error) {
        console.error("❌ Failed to initialize Google Maps:", error);
      }
    };

    initializeMap();

    return () => {
      if (locationWatchRef.current) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, []);

  // Real-time location tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1000,
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(newLocation);
        updateMapLocation(newLocation);
        runSafetyAnalysis(newLocation);
        onLocationChange?.({
          latitude: newLocation.lat,
          longitude: newLocation.lng,
        });
      },
      (error) => console.warn("Location error:", error),
      options,
    );

    // Watch position changes
    locationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(newLocation);
        updateMapLocation(newLocation);
        runSafetyAnalysis(newLocation);
        onLocationChange?.({
          latitude: newLocation.lat,
          longitude: newLocation.lng,
        });
      },
      (error) => console.warn("Location tracking error:", error),
      options,
    );
  }, [onLocationChange]);

  // Update map with current location (smooth tracking)
  const updateMapLocation = useCallback(
    (location: { lat: number; lng: number }) => {
      if (!mapInstanceRef.current) return;

      // Find existing user location marker
      const existingUserMarker = markersRef.current.find(
        (marker) => marker.getTitle() === "Your Location",
      );

      if (existingUserMarker) {
        // Smooth animation to new position
        const currentPos = existingUserMarker.getPosition();
        if (currentPos) {
          // Animate marker position
          existingUserMarker.setPosition(location);
        }
      } else {
        // Create new user location marker with pulsing animation
        const marker = new google.maps.Marker({
          position: location,
          map: mapInstanceRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 4,
          },
          title: "Your Location",
          animation: google.maps.Animation.DROP,
        });

        // Add pulsing effect
        const pulseMarker = new google.maps.Marker({
          position: location,
          map: mapInstanceRef.current,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 20,
            fillColor: "#4285F4",
            fillOpacity: 0.1,
            strokeColor: "#4285F4",
            strokeWeight: 1,
          },
          title: "Location Pulse",
        });

        markersRef.current.push(marker, pulseMarker);

        // Smooth pan to location instead of instant center
        mapInstanceRef.current.panTo(location);
      }

      // Update accuracy circle if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          if (position.coords.accuracy < 100) {
            const accuracyCircle = new google.maps.Circle({
              center: location,
              radius: position.coords.accuracy,
              map: mapInstanceRef.current,
              fillColor: "#4285F4",
              fillOpacity: 0.1,
              strokeColor: "#4285F4",
              strokeOpacity: 0.3,
              strokeWeight: 1,
            });

            // Remove after 5 seconds
            setTimeout(() => {
              accuracyCircle.setMap(null);
            }, 5000);
          }
        });
      }
    },
    [],
  );

  // Run safety analysis
  const runSafetyAnalysis = useCallback(
    async (location: { lat: number; lng: number }) => {
      try {
        const score = await advancedSafetyScoring.analyzeSafetyForLocation({
          latitude: location.lat,
          longitude: location.lng,
        });

        setSafetyScore(score);
        setSafetyLevel(score >= 70 ? "high" : score >= 50 ? "medium" : "low");
      } catch (error) {
        console.error("Safety analysis failed:", error);
      }
    },
    [],
  );

  // Handle map click
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (!mapInstanceRef.current) return;

      // Add destination marker
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#EA4335",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        title: "Destination",
      });

      markersRef.current.push(marker);

      onDestinationSet?.({ latitude: lat, longitude: lng });

      // Get place details
      try {
        const geocoder = new google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult[]>(
          (resolve, reject) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === "OK" && results) resolve(results);
              else reject(new Error(status));
            });
          },
        );

        if (result.length > 0) {
          setSelectedPlace({
            geometry: { location: new google.maps.LatLng(lat, lng) },
            name: result[0].formatted_address,
            formatted_address: result[0].formatted_address,
          } as google.maps.places.PlaceResult);
        }
      } catch (error) {
        console.error("Geocoding failed:", error);
      }
    },
    [onDestinationSet],
  );

  // Search places
  const searchPlaces = useCallback(
    async (query: string) => {
      if (!mapInstanceRef.current || !query.trim()) return;

      setIsSearching(true);
      try {
        const service = new google.maps.places.PlacesService(
          mapInstanceRef.current,
        );

        const request = {
          query,
          location: currentLocation || { lat: 37.7749, lng: -122.4194 },
          radius: 50000,
        };

        const results = await new Promise<google.maps.places.PlaceResult[]>(
          (resolve, reject) => {
            service.textSearch(request, (results, status) => {
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                results
              ) {
                resolve(results);
              } else {
                reject(new Error(status));
              }
            });
          },
        );

        setSearchResults(results.slice(0, 5));
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [currentLocation],
  );

  // Get directions
  const getDirections = useCallback(
    async (destination: google.maps.places.PlaceResult) => {
      if (
        !mapInstanceRef.current ||
        !currentLocation ||
        !directionsRendererRef.current
      )
        return;

      try {
        const directionsService = new google.maps.DirectionsService();

        const result = await new Promise<google.maps.DirectionsResult>(
          (resolve, reject) => {
            directionsService.route(
              {
                origin: currentLocation,
                destination: destination.geometry?.location!,
                travelMode: directionsMode,
              },
              (result, status) => {
                if (status === "OK" && result) resolve(result);
                else reject(new Error(status));
              },
            );
          },
        );

        directionsRendererRef.current.setDirections(result);

        const route = result.routes[0];
        if (route.legs[0]) {
          setRouteInfo({
            distance: route.legs[0].distance?.text || "",
            duration: route.legs[0].duration?.text || "",
          });
        }

        setShowDirections(true);
      } catch (error) {
        console.error("Directions failed:", error);
      }
    },
    [currentLocation, directionsMode],
  );

  // Change map type
  const changeMapType = useCallback(
    (type: "roadmap" | "satellite" | "terrain") => {
      if (!mapInstanceRef.current) return;

      mapInstanceRef.current.setMapTypeId(type);
      setMapType(type);
    },
    [],
  );

  // Center on current location
  const centerOnLocation = useCallback(() => {
    if (!mapInstanceRef.current || !currentLocation) return;

    mapInstanceRef.current.setCenter(currentLocation);
    mapInstanceRef.current.setZoom(16);
  }, [currentLocation]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom() || 15;
    mapInstanceRef.current.setZoom(currentZoom + 1);
  }, []);

  const zoomOut = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const currentZoom = mapInstanceRef.current.getZoom() || 15;
    mapInstanceRef.current.setZoom(currentZoom - 1);
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {/* Google Maps Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Google Maps Style Header */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="bg-white shadow-lg">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </motion.button>

            <h1 className="text-xl font-medium text-gray-800">Maps</h1>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="h-6 w-6 text-gray-700" />
            </motion.button>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-4">
            <div className="relative">
              <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
                <Search className="h-5 w-5 text-gray-400 ml-3" />
                <input
                  type="text"
                  placeholder="Search Google Maps"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length > 2) {
                      searchPlaces(e.target.value);
                    }
                  }}
                  className="flex-1 px-3 py-3 bg-transparent outline-none text-gray-800 placeholder-gray-500"
                />
                {searchQuery && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="p-2 mr-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <Close className="h-4 w-4 text-gray-400" />
                  </motion.button>
                )}
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-y-auto z-30"
                  >
                    {searchResults.map((place, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ backgroundColor: "#f3f4f6" }}
                        onClick={() => {
                          setSelectedPlace(place);
                          setSearchQuery(place.name || "");
                          setSearchResults([]);
                          if (place.geometry?.location) {
                            const lat = place.geometry.location.lat();
                            const lng = place.geometry.location.lng();
                            handleMapClick(lat, lng);
                          }
                        }}
                        className="p-4 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 truncate">
                              {place.name}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {place.formatted_address}
                            </p>
                            {place.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm text-gray-600">
                                  {place.rating} ({place.user_ratings_total}{" "}
                                  reviews)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Live Data Indicators */}
      <div className="absolute top-24 right-4 z-20 space-y-2">
        {/* Safety Score Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "bg-white rounded-lg shadow-lg border-2 p-3",
            safetyLevel === "high"
              ? "border-green-400"
              : safetyLevel === "medium"
                ? "border-yellow-400"
                : "border-red-400",
          )}
        >
          <div className="flex items-center gap-2">
            <Shield
              className={cn(
                "h-4 w-4",
                safetyLevel === "high"
                  ? "text-green-600"
                  : safetyLevel === "medium"
                    ? "text-yellow-600"
                    : "text-red-600",
              )}
            />
            <span className="text-xs font-medium text-gray-700">
              Safety: {safetyScore}/100
            </span>
          </div>
        </motion.div>

        {/* Live Traffic Toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (trafficLayer) {
              if (showTraffic) {
                trafficLayer.setMap(null);
              } else {
                trafficLayer.setMap(mapInstanceRef.current);
              }
              setShowTraffic(!showTraffic);
            }
          }}
          className={cn(
            "bg-white rounded-lg shadow-lg border-2 p-3 transition-colors",
            showTraffic
              ? "border-orange-400 bg-orange-50"
              : "border-gray-300 hover:border-orange-300",
          )}
        >
          <div className="flex items-center gap-2">
            <Zap
              className={cn(
                "h-4 w-4",
                showTraffic ? "text-orange-600" : "text-gray-500",
              )}
            />
            <span className="text-xs font-medium text-gray-700">
              {showTraffic ? "Live Traffic" : "Traffic Off"}
            </span>
          </div>
        </motion.button>

        {/* Real-time Update Indicator */}
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="bg-blue-600 text-white rounded-lg shadow-lg p-2"
        >
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-medium">LIVE</span>
          </div>
        </motion.div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-20 right-4 z-20 space-y-2">
        {/* Location Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={centerOnLocation}
          className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-shadow"
        >
          <MyLocation className="h-5 w-5 text-blue-600" />
        </motion.button>

        {/* Zoom Controls */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={zoomIn}
            className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors border-b border-gray-200"
          >
            <Plus className="h-5 w-5 text-gray-700" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={zoomOut}
            className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Minus className="h-5 w-5 text-gray-700" />
          </motion.button>
        </div>
      </div>

      {/* Google Maps Style FAB Menu */}
      <div className="absolute bottom-32 left-4 z-20">
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="space-y-3 mb-4"
            >
              {/* Layer Toggle */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const nextType =
                    mapType === "roadmap"
                      ? "satellite"
                      : mapType === "satellite"
                        ? "terrain"
                        : "roadmap";
                  changeMapType(nextType);
                }}
                className="w-14 h-14 bg-white rounded-full shadow-xl border border-gray-200 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow"
              >
                <Layers className="h-5 w-5 text-gray-700" />
                <span className="text-xs text-gray-600 mt-0.5">
                  {mapType === "roadmap"
                    ? "Map"
                    : mapType === "satellite"
                      ? "Sat"
                      : "Ter"}
                </span>
              </motion.button>

              {/* Your Timeline */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 bg-white rounded-full shadow-xl border border-gray-200 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow"
              >
                <Clock className="h-5 w-5 text-gray-700" />
                <span className="text-xs text-gray-600 mt-0.5">Time</span>
              </motion.button>

              {/* Explore */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 bg-white rounded-full shadow-xl border border-gray-200 flex flex-col items-center justify-center hover:shadow-2xl transition-shadow"
              >
                <Globe className="h-5 w-5 text-gray-700" />
                <span className="text-xs text-gray-600 mt-0.5">Explore</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            "w-16 h-16 rounded-full shadow-xl border border-gray-200 flex items-center justify-center hover:shadow-2xl transition-all duration-300",
            showMenu
              ? "bg-blue-600 text-white rotate-45"
              : "bg-white text-gray-700",
          )}
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </div>

      {/* Place Details Modal */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-2xl max-h-[50vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

              {/* Place Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedPlace.name}
                  </h2>
                  <p className="text-gray-600">
                    {selectedPlace.formatted_address}
                  </p>
                </div>

                {selectedPlace.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-medium">
                        {selectedPlace.rating}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      ({selectedPlace.user_ratings_total} reviews)
                    </span>
                  </div>
                )}

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => getDirections(selectedPlace)}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-1">
                      <Navigation className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      Directions
                    </span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mb-1">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      Call
                    </span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mb-1">
                      <Share className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      Share
                    </span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mb-1">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      Save
                    </span>
                  </motion.button>
                </div>

                {/* Website Link */}
                {selectedPlace.website && (
                  <motion.a
                    href={selectedPlace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-600 font-medium">
                      Visit website
                    </span>
                  </motion.a>
                )}

                {/* Travel Mode Selector */}
                {showDirections && (
                  <div className="flex gap-2 p-4 bg-gray-50 rounded-lg">
                    {[
                      {
                        mode: google.maps.TravelMode.DRIVING,
                        icon: DirectionsCar,
                        label: "Car",
                      },
                      {
                        mode: google.maps.TravelMode.WALKING,
                        icon: DirectionsWalk,
                        label: "Walk",
                      },
                      {
                        mode: google.maps.TravelMode.BICYCLING,
                        icon: DirectionsBike,
                        label: "Bike",
                      },
                      {
                        mode: google.maps.TravelMode.TRANSIT,
                        icon: DirectionsTransit,
                        label: "Transit",
                      },
                    ].map(({ mode, icon: Icon, label }) => (
                      <motion.button
                        key={mode}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setDirectionsMode(mode);
                          getDirections(selectedPlace);
                        }}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-1 p-3 rounded-lg transition-colors",
                          directionsMode === mode
                            ? "bg-blue-100 text-blue-700"
                            : "hover:bg-gray-100",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{label}</span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Route Info */}
                {routeInfo && (
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                    <Route className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-800">
                        {routeInfo.duration}
                      </div>
                      <div className="text-sm text-green-600">
                        {routeInfo.distance}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Search Indicator */}
      {isSearching && (
        <div className="absolute top-32 left-4 right-4 z-20">
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
            <span className="text-gray-600">Searching...</span>
          </div>
        </div>
      )}
    </div>
  );
}
