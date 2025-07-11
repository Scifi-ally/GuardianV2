import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Power, Settings, Shield, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const [activationMethods, setActivationMethods] = useState<SOSMethod[]>([
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
  const powerButtonPresses = useRef<number[]>([]);

  useEffect(() => {
    if (isListening) {
      startInvisibleListening();
    } else {
      stopInvisibleListening();
    }

    return () => stopInvisibleListening();
  }, [isListening]);

  const startInvisibleListening = () => {
    console.log("👻 Emergency detection started - power button only");
    setupPowerButtonDetection();
  };

  const stopInvisibleListening = () => {
    console.log("👻 Emergency detection stopped");
    document.removeEventListener("keydown", handleKeyDown);
  };

  const setupPowerButtonDetection = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detect power button simulation (F8 key for testing)
      if (event.key === "F8" || event.code === "F8") {
        event.preventDefault();
        const now = Date.now();
        powerButtonPresses.current.push(now);

        // Keep only recent presses (within 5 seconds)
        powerButtonPresses.current = powerButtonPresses.current.filter(
          (press) => now - press < 5000,
        );

        if (powerButtonPresses.current.length >= 5) {
          console.log("⚡ Power button SOS detected!");
          triggerInvisibleSOS("power-button", 100);
          powerButtonPresses.current = [];
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Global key handler
  }, []);

  const triggerInvisibleSOS = useCallback(
    (method: string, confidence: number) => {
      console.log(`🚨 Invisible SOS triggered: ${method} (${confidence}%)`);

      const activation: SOSActivation = {
        method,
        timestamp: new Date(),
        confidence,
      };

      setRecentActivations((prev) => [activation, ...prev.slice(0, 4)]);
      setIsSOSMode(true);

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setIsSOSMode(false);
      }, 10000);
    },
    [],
  );

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  const toggleMethod = (methodId: string) => {
    setActivationMethods((prev) =>
      prev.map((method) =>
        method.id === methodId
          ? { ...method, isActive: !method.isActive }
          : method,
      ),
    );
  };

  return (
    <div className="space-y-4">
      {/* Emergency Detection Status */}
      <Card className="border-2 border-dashed border-orange-300 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-full",
                  isListening
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                {isListening ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">Emergency Detection</h3>
                <p className="text-xs text-gray-600">
                  {isListening
                    ? "Monitoring for emergency patterns"
                    : "Detection paused"}
                </p>
              </div>
            </div>
            <Button
              onClick={toggleListening}
              size="sm"
              className={cn(
                "h-8 px-3 text-xs",
                isListening
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-600 hover:bg-gray-700 text-white",
              )}
            >
              {isListening ? "Active" : "Paused"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SOS Activation Alert */}
      <AnimatePresence>
        {isSOSMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <Card className="w-11/12 max-w-md border-red-500 bg-red-50">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className="p-4 bg-red-100 rounded-full w-fit mx-auto">
                    <ShieldAlert className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-800">
                      Emergency Detected
                    </h3>
                    <p className="text-sm text-red-600">
                      Invisible SOS pattern recognized
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsSOSMode(false)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Dismiss Alert
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activation Methods */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Detection Methods
          </h4>
          <div className="space-y-3">
            {activationMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-gray-100 rounded">{method.icon}</div>
                  <div>
                    <p className="text-sm font-medium">{method.name}</p>
                    <p className="text-xs text-gray-600">
                      {method.description}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => toggleMethod(method.id)}
                  size="sm"
                  variant={method.isActive ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                >
                  {method.isActive ? "ON" : "OFF"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activations */}
      {recentActivations.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3">Recent Detections</h4>
            <div className="space-y-2">
              {recentActivations.map((activation, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div>
                    <p className="text-xs font-medium">{activation.method}</p>
                    <p className="text-xs text-gray-600">
                      {activation.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activation.confidence}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <h4 className="font-semibold text-sm text-blue-800">
              Emergency Detection Help
            </h4>
            <p className="text-xs text-blue-600">
              Press F8 five times quickly to test power button emergency
              detection. This simulates real device power button detection.
            </p>
            <p className="text-xs text-blue-500">
              Real implementation would detect actual device power button
              presses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
