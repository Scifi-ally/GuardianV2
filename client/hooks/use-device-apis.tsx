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
  const [isShaking, setIsShaking] = useState(false);
  const lastShakeTime = useRef<number>(0);

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

        // Shake detection
        const totalAcceleration = Math.sqrt(
          (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2,
        );

        if (totalAcceleration > 15) {
          const now = Date.now();
          if (now - lastShakeTime.current > 1000) {
            setIsShaking(true);
            lastShakeTime.current = now;
            setTimeout(() => setIsShaking(false), 2000);
          }
        }
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

  return { motion, isShaking, requestPermission };
}

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchId = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setIsTracking(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (err) => {
        setError(err.message);
        setIsTracking(false);
      },
      options,
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
  }, []);

  const getCurrentLocation = useCallback(() => {
    return new Promise<LocationData>((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error("Geolocation not supported by this browser");
        setError(error.message);
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          setLocation(locationData);
          setError(null); // Clear any previous errors
          resolve(locationData);
        },
        (err) => {
          let errorMessage = "Unknown location error";

          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage =
                "Location access denied. Please enable location permissions in your browser settings.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage =
                "Location information unavailable. Please check your GPS and network connection.";
              break;
            case err.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = err.message || "Failed to get current location";
              break;
          }

          console.warn("Geolocation error:", errorMessage);
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 60000, // Allow cached location up to 1 minute old
        },
      );
    });
  }, []);

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return {
    location,
    error,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentLocation,
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
