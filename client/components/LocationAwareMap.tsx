import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Locate, AlertCircle, Settings } from "lucide-react";
import { IntelligentGoogleMap } from "@/components/IntelligentGoogleMap";
import { useGeolocation } from "@/hooks/use-device-apis";
import { enhancedFirebaseService } from "@/services/enhancedFirebaseService";
import { emergencyServicesLocator } from "@/services/emergencyServicesLocator";
import { cn } from "@/lib/utils";

interface LocationAwareMapProps {
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
  onMapLoad?: (map: google.maps.Map) => void;
  className?: string;
  showDebug?: boolean;
  zoomLevel?: number;
  onLocationUpdate?: (newLocation: any) => void;
  showEmergencyServices?: boolean;
  destination?: {
    latitude: number;
    longitude: number;
  } | null;
  showTraffic?: boolean;
  showSafeZones?: boolean;
  mapType?: "normal" | "satellite";
  showSharedLocations?: boolean;
  currentUserId?: string;
  emergencyContacts?: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    avatar?: string;
  }>;
}

export function LocationAwareMap({
  onLocationChange,
  onMapLoad,
  className,
  showTraffic = false,
  showSafeZones = false,
  showEmergencyServices = false,
  mapType = "normal",
  destination,
  zoomLevel,
}: LocationAwareMapProps) {
  const {
    location,
    error,
    isTracking,
    permissionStatus,
    startTracking,
    getCurrentLocation,
    requestPermission,
  } = useGeolocation();

  const [lastKnownLocation, setLastKnownLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationOverride, setLocationOverride] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);

  // Load last known location from Firebase on mount and when user changes
  useEffect(() => {
    const loadLastLocation = async () => {
      try {
        const profile = enhancedFirebaseService.profile;
        if (profile?.lastLocation) {
          setLastKnownLocation({
            latitude: profile.lastLocation.latitude,
            longitude: profile.lastLocation.longitude,
          });
        } else {
          // Check localStorage as fallback
          const stored = localStorage.getItem("lastKnownLocation");
          if (stored) {
            setLastKnownLocation(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.debug("No last known location available");
      }
    };

    loadLastLocation();
  }, [enhancedFirebaseService.currentUser]);

  // Save location to localStorage when it changes
  useEffect(() => {
    if (location) {
      localStorage.setItem(
        "lastKnownLocation",
        JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      );
      setLastKnownLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [location]);

  const handleRequestLocation = async () => {
    setIsRequestingLocation(true);
    try {
      const success = await requestPermission();
      if (success) {
        await startTracking();
      }
    } catch (err) {
      console.error("Failed to request location:", err);
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsRequestingLocation(true);
    try {
      await getCurrentLocation();
    } catch (err) {
      console.error("Failed to get current location:", err);
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const currentLocation = locationOverride || location || lastKnownLocation;

  // Show map if we have location permission and current location
  if (permissionStatus === "granted" && currentLocation) {
    return (
      <div className={cn("relative w-full h-full", className)}>
        <IntelligentGoogleMap
          location={currentLocation}
          onLocationChange={onLocationChange}
          onMapLoad={onMapLoad}
          showTraffic={showTraffic}
          showSafeZones={showSafeZones}
          showEmergencyServices={showEmergencyServices}
          mapType={mapType}
          destination={destination}
          zoomLevel={zoomLevel}
          className="w-full h-full"
        />
      </div>
    );
  }

  // Show location request screen when permission is denied or not available
  return (
    <div
      className={cn(
        "w-full h-full bg-gray-50 flex items-center justify-center",
        className,
      )}
    >
      <Card className="max-w-md mx-4">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>

          <h3 className="text-lg font-semibold mb-2">Location Required</h3>

          {permissionStatus === "denied" ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Location access has been denied. Please enable location
                permissions in your browser settings to view the map.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    // Retry permission request instead of reload
                    handleRequestLocation();
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Retry Permission
                </Button>
                {lastKnownLocation && (
                  <div className="text-xs text-muted-foreground">
                    Last known location available from previous session
                  </div>
                )}
              </div>
            </>
          ) : error ? (
            <>
              <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button
                onClick={handleRequestLocation}
                disabled={isRequestingLocation}
                className="w-full"
              >
                <Locate className="h-4 w-4 mr-2" />
                {isRequestingLocation ? "Requesting..." : "Try Again"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                This app needs access to your location to show you the map and
                provide location-based safety features.
              </p>
              <Button
                onClick={handleRequestLocation}
                disabled={isRequestingLocation}
                className="w-full"
              >
                <Locate className="h-4 w-4 mr-2" />
                {isRequestingLocation ? "Requesting..." : "Enable Location"}
              </Button>

              {lastKnownLocation && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-2">
                    We can show your last known location while waiting for
                    permission
                  </p>
                  <Button
                    onClick={() => {
                      // Use last known location immediately
                      if (lastKnownLocation) {
                        setLocationOverride({
                          latitude: lastKnownLocation.latitude,
                          longitude: lastKnownLocation.longitude,
                          accuracy: 1000, // Approximate accuracy for stored location
                        });
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <MapPin className="h-3 w-3 mr-2" />
                    Show Last Location
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LocationAwareMap;
