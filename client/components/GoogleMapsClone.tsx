import { useEffect, useRef, useState } from "react";
import { GoogleMapsSearchBar } from "./GoogleMapsSearchBar";
import { SafetyScoreOverlay } from "./SafetyScoreOverlay";

interface GoogleMapsCloneProps {
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  showSafetyScore?: boolean;
  destination?: {
    latitude: number;
    longitude: number;
  } | null;
  onDestinationSet?: (destination: {
    latitude: number;
    longitude: number;
  }) => void;
}

export function GoogleMapsClone({
  location,
  onLocationChange,
  showSafetyScore = true,
  destination,
  onDestinationSet,
}: GoogleMapsCloneProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchDestination, setSearchDestination] = useState<{
    latitude: number;
    longitude: number;
  } | null>(destination || null);
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);

  // Initialize Google Map exactly like Google Maps
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = () => {
      const defaultLocation = location || {
        latitude: 37.7749,
        longitude: -122.4194,
      };

      const map = new google.maps.Map(mapRef.current!, {
        center: {
          lat: defaultLocation.latitude,
          lng: defaultLocation.longitude,
        },
        zoom: 15,
        // Remove all default controls to match clean Google Maps look
        disableDefaultUI: true,
        // Enable only zoom control like Google Maps
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false,
        // Clean Google Maps styling
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
        // Interaction options
        gestureHandling: "greedy",
        keyboardShortcuts: false,
      });

      mapInstanceRef.current = map;
      setMapLoaded(true);

      // Initialize directions service and renderer
      const dirService = new google.maps.DirectionsService();
      const dirRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: "#4285F4",
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      });
      dirRenderer.setMap(map);
      setDirectionsService(dirService);
      setDirectionsRenderer(dirRenderer);

      // Add click listener to detect location changes
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const newLocation = {
            latitude: e.latLng.lat(),
            longitude: e.latLng.lng(),
          };
          onLocationChange?.(newLocation);
        }
      });

      // Center changed listener
      map.addListener("center_changed", () => {
        const center = map.getCenter();
        if (center) {
          const newLocation = {
            latitude: center.lat(),
            longitude: center.lng(),
          };
          onLocationChange?.(newLocation);
        }
      });
    };

    if (window.google?.maps) {
      initMap();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkGoogleMaps);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, [location, onLocationChange]);

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
        const newLocation = {
          latitude: location.lat(),
          longitude: location.lng(),
        };

        setSearchDestination(newLocation);
        onDestinationSet?.(newLocation);

        // Center map on search result
        mapInstanceRef.current.setCenter(location);
        mapInstanceRef.current.setZoom(16);

        // Calculate and display directions if we have user location
        if (directionsService && directionsRenderer && location) {
          directionsService.route(
            {
              origin: { lat: location.latitude, lng: location.longitude },
              destination: {
                lat: newLocation.latitude,
                lng: newLocation.longitude,
              },
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                directionsRenderer.setDirections(result);
              } else {
                // Fallback: just add a marker
                new google.maps.Marker({
                  position: location,
                  map: mapInstanceRef.current!,
                  title: query,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  },
                });
              }
            },
          );
        }

        onLocationChange?.(newLocation);
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Google Maps Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <GoogleMapsSearchBar
          onSearch={handleSearch}
          location={location}
          className="max-w-md"
        />
      </div>

      {/* Safety Score Overlay */}
      {showSafetyScore && mapLoaded && location && (
        <SafetyScoreOverlay
          location={location}
          searchDestination={searchDestination}
          className="absolute top-20 right-4 z-10"
        />
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{
          minHeight: "400px",
        }}
      />

      {/* Custom Zoom Controls - Google Maps Style */}
      {mapLoaded && (
        <div className="absolute bottom-6 right-4 z-10">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  const currentZoom = mapInstanceRef.current.getZoom() || 10;
                  mapInstanceRef.current.setZoom(currentZoom + 1);
                }
              }}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-200"
            >
              <span className="text-lg font-medium">+</span>
            </button>
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  const currentZoom = mapInstanceRef.current.getZoom() || 10;
                  mapInstanceRef.current.setZoom(currentZoom - 1);
                }
              }}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg font-medium">−</span>
            </button>
          </div>
        </div>
      )}

      {/* Street View Button - Google Maps Style */}
      {mapLoaded && (
        <div className="absolute bottom-6 right-16 z-10">
          <button
            onClick={() => {
              // Enable street view
              if (mapInstanceRef.current && location) {
                const panorama = new google.maps.StreetViewPanorama(
                  document.createElement("div"),
                  {
                    position: {
                      lat: location.latitude,
                      lng: location.longitude,
                    },
                    pov: { heading: 165, pitch: 0 },
                  },
                );
                mapInstanceRef.current.setStreetView(panorama);
              }
            }}
            className="w-10 h-10 bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <div className="w-5 h-5 bg-yellow-400 rounded-sm"></div>
          </button>
        </div>
      )}
    </div>
  );
}
