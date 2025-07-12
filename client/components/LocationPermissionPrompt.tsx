import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  AlertTriangle,
  Settings,
  RefreshCw,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface LocationPermissionPromptProps {
  permissionStatus: "prompt" | "granted" | "denied" | "unsupported";
  onLocationRequest: () => Promise<void>;
  className?: string;
}

export function LocationPermissionPrompt({
  permissionStatus,
  onLocationRequest,
  className = "",
}: LocationPermissionPromptProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestLocation = async () => {
    setIsRequesting(true);
    try {
      await onLocationRequest();
      toast.success("Location access granted!");
    } catch (error: any) {
      console.error("Location permission error:", error);

      if (error.message?.includes("denied")) {
        toast.error(
          "Location access denied. Please enable in browser settings.",
        );
      } else if (error.message?.includes("timeout")) {
        toast.error("Location request timed out. Please try again.");
      } else {
        toast.error("Unable to access location. Please check permissions.");
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const openLocationSettings = () => {
    toast.info(
      "To enable location:\n1. Click the location icon in address bar\n2. Select 'Allow'\n3. Refresh the page",
      {
        duration: 8000,
      },
    );
  };

  if (permissionStatus === "granted") {
    return null; // Don't show when location is already granted
  }

  const getPromptContent = () => {
    switch (permissionStatus) {
      case "denied":
        return {
          icon: AlertTriangle,
          iconColor: "text-red-500",
          title: "Location Access Blocked",
          description:
            "Enable location access to use safety features and navigation",
          buttonText: "Open Settings",
          buttonAction: openLocationSettings,
          buttonVariant: "outline" as const,
          showRetry: true,
        };

      case "unsupported":
        return {
          icon: AlertTriangle,
          iconColor: "text-orange-500",
          title: "Location Not Supported",
          description: "Your browser doesn't support location services",
          buttonText: "Learn More",
          buttonAction: () =>
            toast.info("Please use a modern browser with location support"),
          buttonVariant: "outline" as const,
          showRetry: false,
        };

      default: // "prompt"
        return {
          icon: MapPin,
          iconColor: "text-blue-500",
          title: "Enable Location Access",
          description:
            "Allow location access to see your position on the map and enable safety features",
          buttonText: "Enable Location",
          buttonAction: handleRequestLocation,
          buttonVariant: "default" as const,
          showRetry: false,
        };
    }
  };

  const content = getPromptContent();
  const IconComponent = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute inset-4 z-20 flex items-center justify-center ${className}`}
    >
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl border-2">
        <CardContent className="p-6 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div
                className={`p-4 rounded-full bg-gray-100 ${content.iconColor}`}
              >
                <IconComponent className="h-8 w-8" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900">
              {content.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {content.description}
            </p>

            {/* Benefits */}
            <div className="bg-blue-50 p-3 rounded-lg text-left">
              <p className="text-xs text-blue-700 font-medium mb-2">
                With location access, you can:
              </p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Get real-time safety analysis
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Share location with emergency contacts
                </li>
                <li className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3" />
                  Receive live navigation guidance
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={content.buttonAction}
                variant={content.buttonVariant}
                className="w-full"
                disabled={isRequesting}
              >
                {isRequesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <IconComponent className="h-4 w-4 mr-2" />
                    {content.buttonText}
                  </>
                )}
              </Button>

              {content.showRetry && (
                <Button
                  onClick={handleRequestLocation}
                  variant="ghost"
                  size="sm"
                  className="w-full text-gray-600"
                  disabled={isRequesting}
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Try Again
                </Button>
              )}
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-500 border-t pt-3">
              <p>
                <strong>Stuck?</strong> Look for the location icon (📍) in your
                browser's address bar and click "Allow"
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
