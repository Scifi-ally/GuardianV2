import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  Clock,
  MapPin,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  Phone,
  AlertTriangle,
  CheckCircle,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationStep {
  id: string;
  instruction: string;
  direction: "straight" | "left" | "right" | "u-turn" | "roundabout";
  distance: string;
  duration?: string;
  streetName?: string;
  isCompleted?: boolean;
}

interface NavigationSummary {
  totalDistance: string;
  estimatedTime: string;
  remainingDistance: string;
  remainingTime: string;
  currentSpeed?: string;
  trafficStatus: "clear" | "light" | "moderate" | "heavy";
}

interface EnhancedNavigationDisplayProps {
  steps: NavigationStep[];
  summary: NavigationSummary;
  isActive: boolean;
  onStop: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function EnhancedNavigationDisplay({
  steps,
  summary,
  isActive,
  onStop,
  isMinimized = false,
  onToggleMinimize,
}: EnhancedNavigationDisplayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);

  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "left":
        return ArrowLeft;
      case "right":
        return ArrowRight;
      case "straight":
        return ArrowUp;
      case "u-turn":
        return RotateCcw;
      default:
        return Navigation;
    }
  };

  const getTrafficColor = (status: string) => {
    switch (status) {
      case "clear":
        return "text-green-600 bg-green-50";
      case "light":
        return "text-green-600 bg-green-50";
      case "moderate":
        return "text-yellow-600 bg-yellow-50";
      case "heavy":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  useEffect(() => {
    // Simulate step progression for demo
    if (isActive && steps.length > 0) {
      const interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 10000); // Change step every 10 seconds for demo

      return () => clearInterval(interval);
    }
  }, [isActive, steps.length]);

  if (!isActive) {
    return null;
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <Card className="bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                {currentStep && (
                  <motion.div
                    key={currentStep.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 20 }}
                  >
                    {React.createElement(
                      getDirectionIcon(currentStep.direction),
                      {
                        className: "h-5 w-5 text-blue-600",
                      },
                    )}
                  </motion.div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentStep?.instruction || "Navigate to destination"}
                </p>
                <p className="text-xs text-gray-500">
                  {currentStep?.distance} • {summary.remainingTime} remaining
                </p>
              </div>
              <Button
                onClick={onToggleMinimize}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Navigation className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Navigation</h3>
            <Badge
              className={cn("text-xs", getTrafficColor(summary.trafficStatus))}
            >
              {summary.trafficStatus} traffic
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            {voiceEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          {onToggleMinimize && (
            <Button
              onClick={onToggleMinimize}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => setEmergencyMode(!emergencyMode)}
            variant={emergencyMode ? "destructive" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Route Summary */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-lg font-bold text-gray-900">
                  {summary.remainingTime}
                </span>
              </div>
              <p className="text-xs text-gray-600">Remaining</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-lg font-bold text-gray-900">
                  {summary.remainingDistance}
                </span>
              </div>
              <p className="text-xs text-gray-600">Distance</p>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                {summary.currentSpeed || "0 mph"}
              </div>
              <p className="text-xs text-gray-600">Current Speed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-600 rounded-2xl shadow-lg">
                    {React.createElement(
                      getDirectionIcon(currentStep.direction),
                      {
                        className: "h-8 w-8 text-white",
                      },
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-semibold text-gray-900 mb-1">
                      {currentStep.instruction}
                    </p>
                    {currentStep.streetName && (
                      <p className="text-sm text-gray-600 mb-2">
                        on {currentStep.streetName}
                      </p>
                    )}
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="text-sm">
                        {currentStep.distance}
                      </Badge>
                      {currentStep.duration && (
                        <Badge variant="outline" className="text-sm">
                          {currentStep.duration}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Step Preview */}
      {nextStep && (
        <Card className="border border-gray-200 bg-gray-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-200 rounded-lg">
                {React.createElement(getDirectionIcon(nextStep.direction), {
                  className: "h-4 w-4 text-gray-600",
                })}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  Then: {nextStep.instruction}
                </p>
                <p className="text-xs text-gray-500">{nextStep.distance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Steps List */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            All Directions
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {steps.map((step, index) => {
              const isPast = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-all",
                    isPast && "opacity-50 bg-green-50",
                    isCurrent && "bg-blue-50 border border-blue-200",
                    !isPast && !isCurrent && "hover:bg-gray-50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        isPast && "bg-green-500 text-white",
                        isCurrent && "bg-blue-500 text-white",
                        !isPast && !isCurrent && "bg-gray-200 text-gray-600",
                      )}
                    >
                      {isPast ? <CheckCircle className="h-3 w-3" /> : index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-relaxed">
                      {step.instruction}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {step.distance}
                      </span>
                      {step.duration && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {step.duration}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Mode */}
      <AnimatePresence>
        {emergencyMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="text-sm font-semibold text-red-900">
                  Emergency Mode Active
                </h4>
                <p className="text-xs text-red-700">
                  Route prioritized for emergency services access
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stop Navigation */}
      <Button
        onClick={onStop}
        variant="destructive"
        className="w-full h-12 text-base font-medium"
      >
        <X className="h-5 w-5 mr-2" />
        Stop Navigation
      </Button>
    </motion.div>
  );
}
