import { useEffect, useRef, useState } from "react";
import { advancedSafetyScoring } from "@/services/advancedSafetyScoring";
import { googleMapsLoader } from "@/services/googleMapsLoader";

interface DynamicGoogleMapsProps {
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  destination?: {
    latitude: number;
    longitude: number;
  } | null;
  onDestinationSet?: (destination: {
    latitude: number;
    longitude: number;
  }) => void;
}

export function DynamicGoogleMaps({
  location,
  onLocationChange,
  destination,
  onDestinationSet,
}: DynamicGoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [mapState, setMapState] = useState<
    "loading" | "ready" | "error" | "no-api"
  >("loading");
  const [searchDestination, setSearchDestination] = useState<{
    latitude: number;
    longitude: number;
  } | null>(destination || null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(location || null);

  // Background safety scoring
  useEffect(() => {
    const runSafetyAnalysis = async () => {
      if (userLocation) {
        try {
          await advancedSafetyScoring.analyzeSafetyForLocation({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          });
        } catch (error) {
          console.error("Background safety analysis failed:", error);
        }
      }
    };

    runSafetyAnalysis();

    // Run analysis every 2 minutes for updated safety data
    const interval = setInterval(runSafetyAnalysis, 120000);
    return () => clearInterval(interval);
  }, [userLocation]);

  // Background safety analysis for destination
  useEffect(() => {
    const runDestinationSafetyAnalysis = async () => {
      if (searchDestination) {
        try {
          await advancedSafetyScoring.analyzeSafetyForLocation({
            latitude: searchDestination.latitude,
            longitude: searchDestination.longitude,
          });
        } catch (error) {
          console.error(
            "Background destination safety analysis failed:",
            error,
          );
        }
      }
    };

    runDestinationSafetyAnalysis();
  }, [searchDestination]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(newLocation);
          onLocationChange?.(newLocation);

          // Center map on user location if map is ready
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({
              lat: newLocation.latitude,
              lng: newLocation.longitude,
            });
          }
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Fallback to default location (San Francisco)
          const fallbackLocation = {
            latitude: 37.7749,
            longitude: -122.4194,
          };
          setUserLocation(fallbackLocation);
          onLocationChange?.(fallbackLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    }
  };

  // Initialize map when Google Maps API is ready
  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const defaultLocation = userLocation || {
        latitude: 37.7749,
        longitude: -122.4194,
      };

      const map = new google.maps.Map(mapRef.current, {
        center: {
          lat: defaultLocation.latitude,
          lng: defaultLocation.longitude,
        },
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
        keyboardShortcuts: false,
        styles: [
          {
            featureType: "poi.business",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "transit",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      mapInstanceRef.current = map;

      // Add user location marker if available
      if (userLocation) {
        new google.maps.Marker({
          position: { lat: userLocation.latitude, lng: userLocation.longitude },
          map: map,
          title: "Your Location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        });
      }

      // Add click listener
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const newLocation = {
            latitude: e.latLng.lat(),
            longitude: e.latLng.lng(),
          };
          onLocationChange?.(newLocation);
        }
      });

      setMapState("ready");
      console.log("✅ Google Maps initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Google Maps:", error);
      setMapState("error");
    }
  };

  // Handle Google Maps API loading with new loader service
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        setMapState("loading");
        const isLoaded = await googleMapsLoader.loadGoogleMaps();

        if (isLoaded && googleMapsLoader.isGoogleMapsLoaded()) {
          setMapState("ready");
          initializeMap();
        } else {
          console.log("📍 Running in demo mode - Google Maps not available");
          setMapState("no-api");
        }
      } catch (error) {
        console.error("❌ Failed to initialize Google Maps:", error);
        setMapState("error");
      }
    };

    // Check if Google Maps is already loaded
    if (googleMapsLoader.isGoogleMapsLoaded()) {
      setMapState("ready");
      initializeMap();
    } else {
      initializeGoogleMaps();
    }

    // Listen for Google Maps events
    const handleGoogleMapsLoad = () => {
      if (googleMapsLoader.isGoogleMapsLoaded()) {
        setMapState("ready");
        initializeMap();
      }
    };

    const handleDemoMode = () => {
      console.log("📍 Google Maps demo mode activated");
      setMapState("no-api");
    };

    window.addEventListener("google-maps-loaded", handleGoogleMapsLoad);
    window.addEventListener("google-maps-demo", handleDemoMode);

    return () => {
      window.removeEventListener("google-maps-loaded", handleGoogleMapsLoad);
      window.removeEventListener("google-maps-demo", handleDemoMode);
    };
  }, []);

  // Get user location on mount
  useEffect(() => {
    if (!userLocation) {
      getCurrentLocation();
    }
  }, []);

  // Handle search
  const handleSearch = async (query: string) => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    const geocoder = new google.maps.Geocoder();

    try {
      const results = await new Promise<google.maps.GeocoderResult[]>(
        (resolve, reject) => {
          geocoder.geocode({ address: query }, (results, status) => {
            if (status === "OK" && results) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        },
      );

      if (results.length > 0) {
        const location = results[0].geometry.location;
        const newDestination = {
          latitude: location.lat(),
          longitude: location.lng(),
        };

        setSearchDestination(newDestination);
        onDestinationSet?.(newDestination);

        // Center map and add marker
        mapInstanceRef.current.setCenter(location);
        mapInstanceRef.current.setZoom(16);

        new google.maps.Marker({
          position: location,
          map: mapInstanceRef.current,
          title: query,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#EA4335",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  // Render map or demo mode
  if (mapState === "no-api") {
    return (
      <div className="relative w-full h-full">
        {/* Demo Mode Fallback */}
        <div
          className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center"
          style={{ minHeight: "400px" }}
        >
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Map Demo Mode
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Google Maps API not configured. The app is running in demo mode.
            </p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>To enable maps:</p>
              <p>1. Get an API key from Google Cloud Console</p>
              <p>2. Add VITE_GOOGLE_MAPS_API_KEY to .env file</p>
              <p>3. Restart the development server</p>
              <p className="mt-2 text-xs text-blue-600">
                Current state: {mapState} | API Key:{" "}
                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                  ? "✅ Found"
                  : "❌ Missing"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mapState === "error") {
    return (
      <div className="relative w-full h-full">
        {/* Error State */}
        <div
          className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center"
          style={{ minHeight: "400px" }}
        >
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-200 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              Map Error
            </h3>
            <p className="text-sm text-red-600 mb-4">
              Failed to load Google Maps. Please check your API key and internet
              connection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mapState === "loading") {
    return (
      <div className="relative w-full h-full">
        {/* Loading State */}
        <div
          className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center"
          style={{ minHeight: "400px" }}
        >
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-200 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
            <h3 className="text-lg font-semibold text-blue-700 mb-2">
              Loading Map
            </h3>
            <p className="text-sm text-blue-600">Initializing Google Maps...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render actual map when ready
  return (
    <div className="relative w-full h-full">
      {/* Map Container - Clean interface without controls */}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: "400px" }}
      />
    </div>
  );
}
