import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SOSService } from "@/services/sosService";
import { RealTimeLocationService } from "@/services/realTimeLocationService";
import type { LocationData } from "@/services/locationService";

interface RealTimeSOSTrackerProps {
  alertId?: string;
  isEmergency?: boolean;
  onLocationUpdate?: (location: LocationData) => void;
  className?: string;
}

export function RealTimeSOSTracker({
  alertId,
  isEmergency = false,
  onLocationUpdate,
  className,
}: RealTimeSOSTrackerProps) {
  const { currentUser, userProfile } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopTrackingRef = useRef<(() => void) | null>(null);

  // Start tracking when component mounts or alertId changes
  useEffect(() => {
    if (!currentUser || !alertId) return;

    const startTracking = () => {
      setIsTracking(true);
      setError(null);

      const stopTracking = RealTimeLocationService.startTracking(
        currentUser.uid,
        async (location: LocationData) => {
          setLastLocation(location);

          // Update SOS alert location silently
          try {
            await SOSService.updateSOSLocation(alertId, {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              timestamp: new Date(location.timestamp),
            });
          } catch (updateError) {
            console.warn("Failed to update SOS location:", updateError);
            // Don't show error to user - keep tracking silently
          }

          // Call parent callback if provided
          onLocationUpdate?.(location);
        },
        (error: string) => {
          setError(error);
          console.warn("Location tracking error:", error);
        },
        {
          interval: isEmergency ? 10000 : 30000, // 10s for emergency, 30s for normal
          silentUpdates: true,
          emergencyMode: isEmergency,
        },
      );

      stopTrackingRef.current = stopTracking;
    };

    startTracking();

    // Cleanup on unmount or alertId change
    return () => {
      if (stopTrackingRef.current) {
        stopTrackingRef.current();
        stopTrackingRef.current = null;
      }
      setIsTracking(false);
    };
  }, [currentUser, alertId, isEmergency, onLocationUpdate]);

  // Update tracking mode when emergency status changes
  useEffect(() => {
    if (!currentUser || !isTracking) return;

    if (isEmergency) {
      RealTimeLocationService.enableEmergencyMode(currentUser.uid);
    } else {
      RealTimeLocationService.disableEmergencyMode(currentUser.uid);
    }
  }, [currentUser, isEmergency, isTracking]);

  // Stop tracking when alert is resolved
  useEffect(() => {
    if (!alertId && stopTrackingRef.current) {
      stopTrackingRef.current();
      stopTrackingRef.current = null;
      setIsTracking(false);
    }
  }, [alertId]);

  // Don't render anything - this is a background service component
  if (!currentUser || !alertId) {
    return null;
  }

  // Only show status if there's an error (optional debug info)
  if (error && import.meta.env.DEV) {
    return (
      <div className={`text-xs text-red-500 ${className}`}>
        Location tracking error: {error}
      </div>
    );
  }

  return null;
}

// Hook for using real-time SOS tracking
export function useRealTimeSOSTracking(alertId?: string, isEmergency = false) {
  const { currentUser } = useAuth();
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !alertId) {
      setIsTracking(false);
      return;
    }

    setIsTracking(true);
    setError(null);

    const stopTracking = RealTimeLocationService.startTracking(
      currentUser.uid,
      async (location: LocationData) => {
        setLastLocation(location);

        // Update SOS alert location
        try {
          await SOSService.updateSOSLocation(alertId, {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: new Date(location.timestamp),
          });
        } catch (updateError) {
          console.warn("Failed to update SOS location:", updateError);
        }
      },
      (error: string) => {
        setError(error);
      },
      {
        interval: isEmergency ? 10000 : 30000,
        silentUpdates: true,
        emergencyMode: isEmergency,
      },
    );

    return () => {
      stopTracking();
      setIsTracking(false);
    };
  }, [currentUser, alertId, isEmergency]);

  return {
    lastLocation,
    isTracking,
    error,
  };
}
