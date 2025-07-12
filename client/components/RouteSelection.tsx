import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  Clock,
  Shield,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Route,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RouteOption {
  id: string;
  type: "safest" | "quickest";
  title: string;
  duration: string;
  distance: string;
  safetyLevel: "high" | "medium" | "low";
  features: string[];
  warnings?: string[];
}

interface RouteSelectionProps {
  safestRoute: RouteOption;
  quickestRoute: RouteOption;
  recommendedRoute: "safest" | "quickest";
  onRouteSelect: (route: RouteOption) => void;
  onClose?: () => void;
}

export function RouteSelection({
  safestRoute,
  quickestRoute,
  recommendedRoute,
  onRouteSelect,
  onClose,
}: RouteSelectionProps) {
  const [selectedRoute, setSelectedRoute] = useState<string>(recommendedRoute);

  const getSafetyColor = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-red-600 bg-red-50 border-red-200";
    }
  };

  const getSafetyIcon = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return <Shield className="h-4 w-4 text-green-600" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "low":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const RouteCard = ({ route }: { route: RouteOption }) => {
    const isSelected = selectedRoute === route.id;
    const isRecommended = route.id === recommendedRoute;

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedRoute(route.id)}
        className={cn(
          "cursor-pointer transition-all duration-200",
          isSelected && "ring-2 ring-blue-500 ring-offset-2",
        )}
      >
        <Card
          className={cn(
            "relative overflow-hidden border-2",
            isSelected
              ? "border-blue-500 bg-blue-50/50"
              : "border-gray-200 hover:border-gray-300",
          )}
        >
          {isRecommended && (
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg font-medium">
              Recommended
            </div>
          )}

          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              {route.type === "safest" ? (
                <Shield className="h-5 w-5 text-green-600" />
              ) : (
                <Zap className="h-5 w-5 text-blue-600" />
              )}
              <span className="text-lg">{route.title}</span>
              {isSelected && (
                <CheckCircle className="h-5 w-5 text-blue-600 ml-auto" />
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Route Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-semibold text-sm">{route.duration}</div>
                  <div className="text-xs text-gray-500">Duration</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-semibold text-sm">{route.distance}</div>
                  <div className="text-xs text-gray-500">Distance</div>
                </div>
              </div>
            </div>

            {/* Safety Level */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Safety Level:</span>
              <Badge
                className={cn(
                  "border capitalize",
                  getSafetyColor(route.safetyLevel),
                )}
              >
                {getSafetyIcon(route.safetyLevel)}
                <span className="ml-1">{route.safetyLevel}</span>
              </Badge>
            </div>

            {/* Features */}
            <div>
              <div className="text-sm font-medium mb-2">Route Features:</div>
              <div className="space-y-1">
                {route.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs text-gray-600"
                  >
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {route.warnings && route.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Safety Notices
                  </span>
                </div>
                <div className="space-y-1">
                  {route.warnings.map((warning, index) => (
                    <div key={index} className="text-xs text-yellow-700">
                      • {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const handleStartRoute = () => {
    const route = selectedRoute === "safest" ? safestRoute : quickestRoute;
    onRouteSelect(route);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Route className="h-5 w-5" />
          Choose Your Route
        </h2>
        <p className="text-sm text-gray-600">
          Select the route that best fits your needs
        </p>
      </div>

      {/* Route Comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <RouteCard route={safestRoute} />
        <RouteCard route={quickestRoute} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleStartRoute}
          className="flex-1 h-12 text-base font-medium"
          size="lg"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Start {selectedRoute === "safest" ? "Safest Route" : "Quickest Route"}
        </Button>
        {onClose && (
          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
            className="px-6"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-blue-900 mb-1">
              Safety Analysis
            </div>
            <div className="text-xs text-blue-700 leading-relaxed">
              Routes are analyzed using real-time data including crime
              statistics, lighting conditions, foot traffic, emergency service
              proximity, and current events to provide the safest navigation
              options.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
