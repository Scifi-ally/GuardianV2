import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  Brain,
  Zap,
  Check,
  X,
  MapPin,
  Navigation,
  Shield,
  Volume2,
  Route,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import NavigationIntegrationService, {
  navigationModes,
  NavigationMode,
} from "@/services/navigationIntegrationService";

interface NavigationModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onModeSelect: (mode: string) => void;
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
}

export function NavigationModeSelector({
  isOpen,
  onClose,
  onModeSelect,
  origin,
  destination,
}: NavigationModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<string>("realtime");
  const [isStarting, setIsStarting] = useState(false);

  const getModeIcon = (modeId: string) => {
    switch (modeId) {
      case "basic":
        return <Map className="h-6 w-6" />;
      case "enhanced":
        return <Brain className="h-6 w-6" />;
      case "realtime":
        return <Zap className="h-6 w-6" />;
      default:
        return <Navigation className="h-6 w-6" />;
    }
  };

  const getModeColor = (modeId: string) => {
    switch (modeId) {
      case "basic":
        return "from-gray-500 to-gray-600";
      case "enhanced":
        return "from-purple-500 to-purple-600";
      case "realtime":
        return "from-blue-500 to-blue-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const handleStartNavigation = async () => {
    if (!origin || !destination) {
      return;
    }

    setIsStarting(true);
    try {
      const integrationService = NavigationIntegrationService.getInstance();
      const success = await integrationService.startNavigation(
        selectedMode,
        origin,
        destination,
        {
          voiceEnabled: selectedMode === "realtime",
        },
      );

      if (success) {
        onModeSelect(selectedMode);
        onClose();
      }
    } catch (error) {
      console.error("Failed to start navigation:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleQuickStart = async () => {
    if (!origin || !destination) {
      return;
    }

    setIsStarting(true);
    try {
      const integrationService = NavigationIntegrationService.getInstance();
      const chosenMode = await integrationService.quickStart(
        origin,
        destination,
        {
          preferSafety: true,
          needVoiceGuidance: true,
          hasGoodConnection: navigator.onLine,
        },
      );

      if (chosenMode !== "none") {
        onModeSelect(chosenMode);
        onClose();
      }
    } catch (error) {
      console.error("Quick start failed:", error);
    } finally {
      setIsStarting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Choose Navigation Mode
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select the navigation experience that fits your needs
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {/* Quick Start Option */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900">
                      Smart Auto-Select
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      Let AI choose the best mode for your journey
                    </p>
                  </div>
                  <Button
                    onClick={handleQuickStart}
                    disabled={isStarting || !origin || !destination}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 h-auto"
                  >
                    {isStarting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Quick Start"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Modes */}
            {navigationModes.map((mode) => (
              <motion.div
                key={mode.id}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative cursor-pointer transition-all duration-200",
                  selectedMode === mode.id
                    ? "ring-2 ring-blue-500 ring-opacity-50"
                    : "",
                )}
                onClick={() => setSelectedMode(mode.id)}
              >
                <Card
                  className={cn(
                    "border-2 transition-all duration-200",
                    selectedMode === mode.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-full bg-gradient-to-r text-white",
                          getModeColor(mode.id),
                        )}
                      >
                        {getModeIcon(mode.id)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {mode.name}
                          </h3>
                          {selectedMode === mode.id && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {mode.description}
                        </p>

                        <div className="flex flex-wrap gap-1 mt-3">
                          {mode.features.map((feature, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isStarting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartNavigation}
                disabled={isStarting || !origin || !destination}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isStarting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Starting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    <span>Start Navigation</span>
                  </div>
                )}
              </Button>
            </div>

            {(!origin || !destination) && (
              <p className="text-xs text-red-500 mt-2 text-center">
                Please select both origin and destination first
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default NavigationModeSelector;
