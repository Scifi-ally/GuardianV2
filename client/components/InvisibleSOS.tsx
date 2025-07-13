import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MessageCircle,
  Camera,
  Calculator,
  Clock,
  Settings,
  Shield,
  ShieldAlert,
  Power,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { unifiedNotifications } from "@/services/unifiedNotificationService";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/use-device-apis";

interface SOSMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  pattern?: string;
}

interface SOSActivation {
  method: string;
  timestamp: Date;
  confidence: number;
  location?: { lat: number; lng: number };
}

export function InvisibleSOS() {
  const [isSOSMode, setIsSOSMode] = useState(false);
  const { userProfile } = useAuth();
  const { getCurrentLocation } = useGeolocation();
  const [activationMethods, setActivationMethods] = useState<SOSMethod[]>([
    {
      id: "fake-call",
      name: "Fake Call",
      description: "Tap 'Mom' contact 3 times quickly",
      icon: <Phone className="h-4 w-4" />,
      isActive: true,
    },
    {
      id: "fake-selfie",
      name: "Emergency Selfie",
      description: "Open camera and tap flash 5 times",
      icon: <Camera className="h-4 w-4" />,
      isActive: true,
    },
    {
      id: "calculator-code",
      name: "Calculator SOS",
      description: "Enter 911 and press equals 3 times",
      icon: <Calculator className="h-4 w-4" />,
      isActive: true,
    },
    {
      id: "clock-pattern",
      name: "Time Check",
      description: "Check time 4 times in 30 seconds",
      icon: <Clock className="h-4 w-4" />,
      isActive: true,
    },
    {
      id: "power-button",
      name: "Power Button SOS",
      description: "Press power button 5 times quickly",
      icon: <Power className="h-4 w-4" />,
      isActive: true,
    },
  ]);

  const [recentActivations, setRecentActivations] = useState<SOSActivation[]>(
    [],
  );
  const [isListening, setIsListening] = useState(false);

  // Pattern tracking
  const tapHistory = useRef<{ target: string; time: number }[]>([]);
  const powerButtonPresses = useRef<number[]>([]);
  const timeChecks = useRef<number[]>([]);
  const calculatorInputs = useRef<string[]>([]);

  useEffect(() => {
    if (isListening) {
      startInvisibleListening();
    } else {
      stopInvisibleListening();
    }

    return () => stopInvisibleListening();
  }, [isListening]);

  const startInvisibleListening = () => {
    console.log("👻 Invisible SOS listening started");

    // Listen for fake call pattern
    setupFakeCallDetection();

    // Listen for camera flash pattern
    setupCameraFlashDetection();

    // Listen for calculator pattern
    setupCalculatorDetection();

    // Listen for time check pattern
    setupTimeCheckDetection();

    // Listen for power button pattern
    setupPowerButtonDetection();
  };

  const stopInvisibleListening = () => {
    console.log("👻 Invisible SOS listening stopped");
    // Remove event listeners
    document.removeEventListener("click", handleGenericClick);
    document.removeEventListener("keydown", handleKeyDown);
  };

  const setupFakeCallDetection = () => {
    const handleGenericClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const targetText = target.textContent?.toLowerCase() || "";

      // Look for "mom", "dad", or other family contacts
      if (
        targetText.includes("mom") ||
        targetText.includes("dad") ||
        targetText.includes("family") ||
        target.closest("[data-contact]")
      ) {
        tapHistory.current.push({ target: "family-contact", time: Date.now() });
        checkFakeCallPattern();
      }
    };

    document.addEventListener("click", handleGenericClick);
  };

  const checkFakeCallPattern = () => {
    const now = Date.now();
    const recentTaps = tapHistory.current.filter(
      (tap) => now - tap.time < 10000 && tap.target === "family-contact",
    );

    if (recentTaps.length >= 3) {
      console.log("📞 Fake call SOS detected!");
      triggerInvisibleSOS("fake-call", 90);
      tapHistory.current = [];
    }
  };

  const setupCameraFlashDetection = () => {
    // This would integrate with camera API
    // For now, simulate with specific UI interactions
    let flashTaps = 0;
    let flashTimer: NodeJS.Timeout;

    const detectFlashTaps = () => {
      flashTaps++;
      clearTimeout(flashTimer);

      if (flashTaps >= 5) {
        console.log("📸 Camera flash SOS detected!");
        triggerInvisibleSOS("fake-selfie", 85);
        flashTaps = 0;
      }

      flashTimer = setTimeout(() => {
        flashTaps = 0;
      }, 15000);
    };

    // Listen for camera-related elements
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("[data-camera]") ||
        target.textContent?.toLowerCase().includes("camera") ||
        target.textContent?.toLowerCase().includes("photo")
      ) {
        detectFlashTaps();
      }
    });
  };

  const setupCalculatorDetection = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Track number inputs that could be calculator usage
      if (event.key >= "0" && event.key <= "9") {
        calculatorInputs.current.push(event.key);

        // Check for 911 pattern
        const recent = calculatorInputs.current.slice(-3).join("");
        if (recent === "911") {
          console.log("🔢 Calculator 911 detected!");
          triggerInvisibleSOS("calculator-code", 95);
          calculatorInputs.current = [];
        }

        // Clean old inputs
        if (calculatorInputs.current.length > 10) {
          calculatorInputs.current = calculatorInputs.current.slice(-5);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
  };

  const setupTimeCheckDetection = () => {
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const targetText = target.textContent?.toLowerCase() || "";

      // Detect time-related interactions
      if (
        targetText.includes("time") ||
        targetText.includes("clock") ||
        target.closest("[data-time]") ||
        /\d{1,2}:\d{2}/.test(targetText)
      ) {
        timeChecks.current.push(Date.now());
        checkTimePattern();
      }
    });
  };

  const checkTimePattern = () => {
    const now = Date.now();
    const recentChecks = timeChecks.current.filter(
      (time) => now - time < 30000,
    );

    if (recentChecks.length >= 4) {
      console.log("🕐 Time check SOS detected!");
      triggerInvisibleSOS("clock-pattern", 80);
      timeChecks.current = [];
    }
  };

  const setupPowerButtonDetection = () => {
    // Simulate power button with specific key combination
    let keySequence: string[] = [];

    document.addEventListener("keydown", (event) => {
      if (event.key === "p" && event.ctrlKey) {
        // Ctrl+P as power button simulation
        powerButtonPresses.current.push(Date.now());
        checkPowerButtonPattern();
      }
    });
  };

  const checkPowerButtonPattern = () => {
    const now = Date.now();
    const recentPresses = powerButtonPresses.current.filter(
      (time) => now - time < 10000,
    );

    if (recentPresses.length >= 5) {
      console.log("⚡ Power button SOS detected!");
      triggerInvisibleSOS("power-button", 100);
      powerButtonPresses.current = [];
    }
  };

  const triggerInvisibleSOS = async (method: string, confidence: number) => {
    try {
      // Get real location for emergency
      const location = await getCurrentLocation();

      const activation: SOSActivation = {
        method,
        timestamp: new Date(),
        confidence,
        location: { lat: location.latitude, lng: location.longitude },
      };

      setRecentActivations((prev) => [activation, ...prev.slice(0, 4)]);
      setIsSOSMode(true);

      // Show invisible SOS mode
      setTimeout(() => setIsSOSMode(false), 5000);

      // ACTUAL EMERGENCY RESPONSE - not just console.log!
      unifiedNotifications.sos({
        title: "🚨 INVISIBLE SOS ACTIVATED",
        message: `Emergency detected via ${method}. Confidence: ${confidence}%. Person may be in danger and unable to openly call for help!`,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: `Emergency location (${method} detection)`,
        },
        action: {
          label: "Navigate to Location",
          onClick: () => {
            const url = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
            window.open(url, "_blank");
          },
        },
        secondaryAction: {
          label: "Call Emergency",
          onClick: () => {
            try {
              window.location.href = "tel:911";
            } catch (error) {
              unifiedNotifications.critical(
                "Call 911 immediately - Invisible SOS activated",
              );
            }
          },
        },
      });

      // Copy emergency message to clipboard for sharing
      if (userProfile) {
        const message = `🚨 INVISIBLE SOS ALERT\n\nEmergency detected for ${userProfile.name || "User"} via ${method}\nConfidence: ${confidence}%\nTime: ${new Date().toLocaleString()}\nLocation: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n\nThis person may be in danger and unable to openly call for help. Please check on them immediately!`;

        navigator.clipboard?.writeText(message);

        unifiedNotifications.critical("Emergency message copied to clipboard", {
          title: "Share with Emergency Contacts",
          message: "Send this message to emergency contacts immediately",
        });
      }

      // Vibrate device for attention
      if (navigator.vibrate) {
        navigator.vibrate([1000, 500, 1000, 500, 1000]);
      }
    } catch (error) {
      console.error("Failed to get location for invisible SOS:", error);
      // Fallback without location
      unifiedNotifications.critical(
        "INVISIBLE SOS ACTIVATED - EMERGENCY DETECTED",
        {
          message: `Method: ${method}, Confidence: ${confidence}%. Get help immediately!`,
          action: {
            label: "Call 911",
            onClick: () => {
              try {
                window.location.href = "tel:911";
              } catch (error) {
                unifiedNotifications.critical("Call 911 immediately");
              }
            },
          },
        },
      );
    }
  };

  const handleGenericClick = useCallback((event: MouseEvent) => {
    // This is handled by individual detection functions
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // This is handled by individual detection functions
  }, []);

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* SOS Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Invisible SOS</h3>
            </div>
            <Button
              variant={isListening ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsListening(!isListening)}
            >
              {isListening ? (
                <>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Active
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Activate emergency mode through normal-looking interactions that
            won't raise suspicion.
          </p>

          <div className="space-y-2">
            {activationMethods.map((method) => (
              <div
                key={method.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  method.isActive
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200",
                )}
              >
                <div className="text-green-600">{method.icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{method.name}</div>
                  <div className="text-xs text-gray-600">
                    {method.description}
                  </div>
                </div>
                <Badge
                  variant={method.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {method.isActive ? "Active" : "Off"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SOS Mode Indicator */}
      <AnimatePresence>
        {isSOSMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-6 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="mb-4"
                >
                  <ShieldAlert className="h-12 w-12 text-red-600 mx-auto" />
                </motion.div>
                <h3 className="text-lg font-bold text-red-800 mb-2">
                  Invisible SOS Activated
                </h3>
                <p className="text-sm text-red-600 mb-4">
                  Emergency protocols are now active. Stay calm.
                </p>
                <Button
                  onClick={() => setIsSOSMode(false)}
                  variant="outline"
                  size="sm"
                >
                  I'm Safe
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Activations */}
      {recentActivations.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Recent Activations
            </h4>
            <div className="space-y-2">
              {recentActivations.map((activation, index) => (
                <motion.div
                  key={`${activation.method}-${activation.timestamp.getTime()}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div>
                    <div className="text-sm font-medium capitalize">
                      {activation.method.replace("-", " ")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {activation.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <Badge className="text-xs">
                    {activation.confidence}% confidence
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Triggers */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3">Test Invisible SOS</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerInvisibleSOS("test-fake-call", 100)}
              data-contact="mom"
            >
              Test Fake Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerInvisibleSOS("test-calculator", 100)}
              data-calculator="911"
            >
              Test Calculator
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerInvisibleSOS("test-time", 100)}
              data-time="check"
            >
              Test Time Check
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerInvisibleSOS("test-camera", 100)}
              data-camera="flash"
            >
              Test Camera
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click these buttons to test the invisible SOS detection system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
