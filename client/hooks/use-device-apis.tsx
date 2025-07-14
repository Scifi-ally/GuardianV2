import { useState, useEffect, useCallback, useRef } from "react";

interface DeviceMotion {
  acceleration: { x: number; y: number; z: number } | null;
  rotationRate: { alpha: number; beta: number; gamma: number } | null;
}

interface DeviceOrientation {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export function useDeviceMotion() {
  const [motion, setMotion] = useState<DeviceMotion>({
    acceleration: null,
    rotationRate: null,
  });
  // Removed shake detection functionality

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.acceleration;
      const rot = event.rotationRate;

      if (acc) {
        setMotion({
          acceleration: { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 },
          rotationRate: rot
            ? {
                alpha: rot.alpha || 0,
                beta: rot.beta || 0,
                gamma: rot.gamma || 0,
              }
            : null,
        });

        // Removed shake detection for safety
      }
    };

    if (typeof DeviceMotionEvent !== "undefined") {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => {
      if (typeof DeviceMotionEvent !== "undefined") {
        window.removeEventListener("devicemotion", handleMotion);
      }
    };
  }, []);

  const requestPermission = async () => {
    if (typeof (DeviceMotionEvent as any)?.requestPermission === "function") {
      const permission = await (DeviceMotionEvent as any).requestPermission();
      return permission === "granted";
    }
    return true;
  };

  return { motion, requestPermission };
}

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>("unknown");
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Import the enhanced location service
  const getEnhancedLocationService = async () => {
    const { enhancedLocationService } = await import(
      "@/services/enhancedLocationService"
    );
    return enhancedLocationService;
  };

  // Initialize location tracking on mount
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const locationService = await getEnhancedLocationService();

        // Check permission status
        const permission = await locationService.getPermissionStatus();
        setPermissionStatus(permission);

        // Subscribe to location updates
        unsubscribeRef.current = locationService.subscribe((locationData) => {
          // Convert enhanced location data to legacy format
          const legacyData = {
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
            accuracy: locationData.coords.accuracy,
            timestamp: locationData.timestamp,
          };
          setLocation(legacyData);
          setError(null);
          console.log("📍 Location updated:", {
            lat: legacyData.latitude.toFixed(6),
            lng: legacyData.longitude.toFixed(6),
            accuracy: Math.round(legacyData.accuracy) + "m",
          });
        });

        // Error handling is built into the enhanced location service

        // Get current location immediately (non-blocking)
        locationService.getCurrentLocation().catch((err) => {
          console.log("ℹ️ Initial location request completed with fallback");
        });

        // Start tracking
        await locationService.startTracking();
        setIsTracking(true);
      } catch (err: any) {
        console.error("Failed to initialize location service:", err);
        setError(err.message || "Failed to initialize location service");
      }
    };

    initializeLocation();

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const startTracking = useCallback(async () => {
    try {
      const locationService = await getEnhancedLocationService();
      await locationService.startTracking();
      setIsTracking(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to start tracking");
      setIsTracking(false);
    }
  }, []);

  const stopTracking = useCallback(async () => {
    try {
      const locationService = await getEnhancedLocationService();
      locationService.stopTracking();
      setIsTracking(false);
    } catch (err: any) {
      console.warn("Failed to stop tracking:", err);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      const locationService = await getEnhancedLocationService();
      const locationData = await locationService.getCurrentLocation();
      // Convert EnhancedLocationData to LocationData format
      const convertedLocation: LocationData = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp.getTime(), // Convert Date to number
      };
      setLocation(convertedLocation);
      setError(null);
      return locationData;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get current location";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      // First check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      // Check current permission status
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        setPermissionStatus(permission.state);

        if (permission.state === "denied") {
          throw new Error(
            "Location permission was denied. Please enable it in your browser settings.",
          );
        }
      }

      // Try to get current location which will trigger permission prompt if needed
      const locationService = await getEnhancedLocationService();
      await locationService.getCurrentLocation();
      setPermissionStatus("granted");
      return true;
    } catch (err: any) {
      console.error("Permission request failed:", err);
      setError(err.message || "Failed to request location permission");
      setPermissionStatus("denied");
      return false;
    }
  }, []);

  return {
    location,
    error,
    isTracking,
    permissionStatus,
    startTracking,
    stopTracking,
    getCurrentLocation,
    requestPermission,
  };
}

// Extend the Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoiceActivation() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognition = useRef<any>(null);
  const isStarting = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onstart = () => {
        setIsListening(true);
        isStarting.current = false;
      };

      recognition.current.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript);

        // Check for emergency keywords
        const emergencyWords = ["help", "emergency", "sos", "danger"];
        const lowerTranscript = finalTranscript.toLowerCase();
        if (emergencyWords.some((word) => lowerTranscript.includes(word))) {
          // Trigger emergency action
          triggerEmergency();
        }
      };

      recognition.current.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        isStarting.current = false;
      };

      recognition.current.onend = () => {
        setIsListening(false);
        isStarting.current = false;
      };
    }

    return () => {
      if (recognition.current) {
        try {
          recognition.current.stop();
        } catch (error) {
          console.warn("Error stopping speech recognition on cleanup:", error);
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognition.current && !isListening && !isStarting.current) {
      try {
        isStarting.current = true;
        setTranscript("");
        recognition.current.start();
      } catch (error) {
        console.warn("Failed to start speech recognition:", error);
        isStarting.current = false;
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognition.current && (isListening || isStarting.current)) {
      try {
        recognition.current.stop();
        setIsListening(false);
        isStarting.current = false;
      } catch (error) {
        console.warn("Failed to stop speech recognition:", error);
        setIsListening(false);
        isStarting.current = false;
      }
    }
  }, [isListening]);

  const triggerEmergency = useCallback(() => {
    // Emergency action triggered by voice
    const event = new CustomEvent("voiceEmergency", {
      detail: { trigger: "voice", transcript },
    });
    window.dispatchEvent(event);
  }, [transcript]);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
  };
}

export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const emergencyVibration = useCallback(() => {
    // Strong vibration pattern for emergency
    vibrate([500, 200, 500, 200, 500]);
  }, [vibrate]);

  const successVibration = useCallback(() => {
    vibrate([100, 50, 100]);
  }, [vibrate]);

  const warningVibration = useCallback(() => {
    vibrate([200, 100, 200]);
  }, [vibrate]);

  return {
    vibrate,
    emergencyVibration,
    successVibration,
    warningVibration,
  };
}

export function useScreenWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLock.current = await (navigator as any).wakeLock.request("screen");
        setIsActive(true);

        wakeLock.current.addEventListener("release", () => {
          setIsActive(false);
        });
      }
    } catch (err) {
      console.error("Wake lock failed:", err);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock.current) {
      await wakeLock.current.release();
      wakeLock.current = null;
      setIsActive(false);
    }
  }, []);

  return { isActive, requestWakeLock, releaseWakeLock };
}
