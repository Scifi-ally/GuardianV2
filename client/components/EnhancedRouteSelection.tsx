import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
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
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RouteOption {
  id: string;
  type: "safest" | "quickest" | "recommended";
  title: string;
  duration: string;
  distance: string;
  safetyLevel: "high" | "medium" | "low";
  features: string[];
  warnings?: string[];
  traffic?: "light" | "moderate" | "heavy";
}

interface EnhancedRouteSelectionProps {
  routes: RouteOption[];
  onRouteSelect: (route: RouteOption) => void;
  onClose?: () => void;
  autoSelectQuickest?: boolean;
}

export function EnhancedRouteSelection({
  routes,
  onRouteSelect,
  onClose,
  autoSelectQuickest = true,
}: EnhancedRouteSelectionProps) {
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [autoSelectCountdown, setAutoSelectCountdown] = useState(5);

  // Find the quickest route
  const quickestRoute =
    routes.find((route) => route.type === "quickest") || routes[0];

  useEffect(() => {
    if (autoSelectQuickest && quickestRoute) {
      setSelectedRoute(quickestRoute.id);

      // Auto-select countdown
      const countdown = setInterval(() => {
        setAutoSelectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            onRouteSelect(quickestRoute);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [autoSelectQuickest, quickestRoute, onRouteSelect]);

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

  const getTrafficColor = (traffic?: "light" | "moderate" | "heavy") => {
    switch (traffic) {
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

  const handleStartRoute = () => {
    const route = routes.find((r) => r.id === selectedRoute) || quickestRoute;
    onRouteSelect(route);
  };

  const handleShowAlternatives = () => {
    setShowAlternatives(true);
    setAutoSelectCountdown(0);
  };

  if (!showAlternatives && autoSelectQuickest) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-auto"
      >
        {/* Auto-select UI */}
        <div className="text-center space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Quickest Route Selected
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Starting navigation in {autoSelectCountdown} seconds
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Duration</span>
              </div>
              <span className="font-semibold">{quickestRoute.duration}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Distance</span>
              </div>
              <span className="font-semibold">{quickestRoute.distance}</span>
            </div>
            {quickestRoute.traffic && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Traffic</span>
                </div>
                <Badge
                  className={cn(
                    "text-xs",
                    getTrafficColor(quickestRoute.traffic),
                  )}
                >
                  {quickestRoute.traffic}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleStartRoute}
              className="flex-1 h-12 text-base font-medium"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Start Now
            </Button>
            <Button
              onClick={handleShowAlternatives}
              variant="outline"
              className="h-12 px-4"
            >
              <Route className="h-4 w-4" />
            </Button>
          </div>

          <button
            onClick={handleShowAlternatives}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all routes
          </button>
        </div>
      </motion.div>
    );
  }

  const RouteCard = ({ route }: { route: RouteOption }) => {
    const isSelected = selectedRoute === route.id;
    const isQuickest = route.type === "quickest";

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
          {isQuickest && (
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg font-medium">
              Fastest
            </div>
          )}

          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              {route.type === "safest" ? (
                <Shield className="h-5 w-5 text-green-600" />
              ) : route.type === "quickest" ? (
                <Zap className="h-5 w-5 text-blue-600" />
              ) : (
                <Route className="h-5 w-5 text-purple-600" />
              )}
              <span className="text-lg font-semibold">{route.title}</span>
              {isSelected && (
                <CheckCircle className="h-5 w-5 text-blue-600 ml-auto" />
              )}
            </div>

            {/* Route Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-lg">
                    {route.duration}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Duration</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-lg">
                    {route.distance}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Distance</p>
              </div>
            </div>

            {/* Safety and Traffic */}
            <div className="flex items-center justify-between">
              <Badge
                className={cn(
                  "border text-xs",
                  getSafetyColor(route.safetyLevel),
                )}
              >
                <Shield className="h-3 w-3 mr-1" />
                {route.safetyLevel} safety
              </Badge>
              {route.traffic && (
                <Badge
                  className={cn("text-xs", getTrafficColor(route.traffic))}
                >
                  {route.traffic} traffic
                </Badge>
              )}
            </div>

            {/* Warnings */}
            {route.warnings && route.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Notices
                  </span>
                </div>
                <div className="space-y-1">
                  {route.warnings.slice(0, 2).map((warning, index) => (
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Route className="h-6 w-6" />
            Route Options
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose the route that works best for you
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Route Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleStartRoute}
          className="px-8 h-14 text-lg font-medium bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Navigation className="h-5 w-5 mr-3" />
          Start Navigation
          <ArrowRight className="h-5 w-5 ml-3" />
        </Button>
      </div>
    </motion.div>
  );
}
