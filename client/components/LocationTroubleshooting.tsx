import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  AlertTriangle,
  Smartphone,
  Wifi,
  Settings,
  RefreshCw,
  CheckCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LocationTroubleshootingProps {
  isVisible: boolean;
  onClose: () => void;
  onRetry: () => void;
  lastError?: string;
}

export function LocationTroubleshooting({
  isVisible,
  onClose,
  onRetry,
  lastError,
}: LocationTroubleshootingProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const troubleshootingSteps = [
    {
      icon: Settings,
      title: "Check Location Permissions",
      description: "Ensure location access is enabled for this website",
      action: "Check browser settings",
    },
    {
      icon: Smartphone,
      title: "Enable Device GPS",
      description: "Make sure GPS/Location Services are turned on",
      action: "Check device settings",
    },
    {
      icon: Wifi,
      title: "Improve Signal",
      description: "Move near a window or go outside for better GPS signal",
      action: "Change location",
    },
    {
      icon: RefreshCw,
      title: "Refresh and Retry",
      description: "Sometimes a fresh start helps with location services",
      action: "Try again",
    },
  ];

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Location Issue
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {lastError && (
            <Badge variant="destructive" className="text-xs">
              {lastError.includes("TIMEOUT")
                ? "Location Timeout"
                : "Location Error"}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            We're having trouble getting your location. Here are some steps that
            might help:
          </div>

          <div className="space-y-3">
            {troubleshootingSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <step.icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{step.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {step.description}
                  </p>
                  <span className="text-xs text-blue-600 font-medium">
                    {step.action}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex-1"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Use Default
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center pt-2">
            <MapPin className="h-3 w-3 inline mr-1" />
            We'll use a default location if GPS isn't available
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
