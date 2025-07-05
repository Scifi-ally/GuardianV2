import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Navigation,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  MapPin,
  Clock,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NavigationInstructionsProps {
  directionsResult?: google.maps.DirectionsResult | null;
  currentLocation?: { latitude: number; longitude: number };
  isVisible?: boolean;
  onClose?: () => void;
}

export function NavigationInstructions({
  directionsResult,
  currentLocation,
  isVisible = true,
  onClose,
}: NavigationInstructionsProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nextInstruction, setNextInstruction] = useState<any>(null);
  const [remainingDistance, setRemainingDistance] = useState<string>("");
  const [estimatedTime, setEstimatedTime] = useState<string>("");

  useEffect(() => {
    if (!directionsResult || !currentLocation) return;

    const route = directionsResult.routes[0];
    const leg = route.legs[0];
    const steps = leg.steps;

    // Find current step based on location (simplified)
    const currentStep = steps[currentStepIndex] || steps[0];
    if (currentStep) {
      setNextInstruction({
        instruction: currentStep.instructions,
        distance: currentStep.distance?.text || "",
        maneuver: currentStep.maneuver || "straight",
      });
    }

    // Update remaining distance and time
    setRemainingDistance(leg.distance?.text || "");
    setEstimatedTime(leg.duration?.text || "");
  }, [directionsResult, currentLocation, currentStepIndex]);

  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case "turn-left":
        return ArrowLeft;
      case "turn-right":
        return ArrowRight;
      case "straight":
      default:
        return ArrowUp;
    }
  };

  if (!isVisible || !nextInstruction) {
    return null;
  }

  const ManeuverIcon = getManeuverIcon(nextInstruction.maneuver);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 left-4 right-4 z-[1000] max-w-md mx-auto"
    >
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Maneuver Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
                <ManeuverIcon className="h-6 w-6" />
              </div>
            </div>

            {/* Instruction Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {nextInstruction.distance}
                </Badge>
              </div>
              <p
                className="text-sm font-medium text-gray-900 leading-tight"
                dangerouslySetInnerHTML={{
                  __html: nextInstruction.instruction,
                }}
              />
            </div>

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm"
              >
                ×
              </button>
            )}
          </div>

          {/* Route Summary */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{remainingDistance} remaining</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{estimatedTime} ETA</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default NavigationInstructions;
