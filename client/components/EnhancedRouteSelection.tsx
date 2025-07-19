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
        className="component-elevated max-w-sm mx-auto spacing-unified-sm"
      >
        {/* Compact Auto-select UI */}
        <div className="text-center space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Zap className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <h3 className="text-base font-semibold text-gray-900">
              Starting in {autoSelectCountdown}s
            </h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex justify-center gap-4 text-sm">
            <span className="font-medium">{quickestRoute.duration}</span>
            <span className="text-gray-400">•</span>
            <span className="font-medium">{quickestRoute.distance}</span>
            {quickestRoute.traffic && (
              <>
                <span className="text-gray-400">•</span>
                <Badge
                  className={cn(
                    "text-xs h-4",
                    getTrafficColor(quickestRoute.traffic),
                  )}
                >
                  {quickestRoute.traffic}
                </Badge>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleStartRoute} className="flex-1 h-10 text-sm">
              <Navigation className="h-4 w-4 mr-1" />
              Start
            </Button>
            <Button
              onClick={handleShowAlternatives}
              variant="outline"
              size="sm"
              className="h-10 px-3"
            >
              <Route className="h-4 w-4" />
            </Button>
          </div>

          <button
            onClick={handleShowAlternatives}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            More options
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
        whileTap={{ scale: 0.99 }}
        onClick={() => setSelectedRoute(route.id)}
        className={cn(
          "cursor-pointer transition-all duration-200",
          isSelected && "ring-2 ring-blue-500",
        )}
      >
        <Card
          className={cn(
            "card-unified-compact relative overflow-hidden",
            isSelected ? "border-blue-500 bg-blue-50/30" : "",
          )}
        >
          {isQuickest && (
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-bl font-medium">
              Fast
            </div>
          )}

          <CardContent className="flow-tight">
            <div className="flex items-center gap-2">
              {route.type === "safest" ? (
                <Shield className="h-4 w-4 text-green-600" />
              ) : route.type === "quickest" ? (
                <Zap className="h-4 w-4 text-blue-600" />
              ) : (
                <Route className="h-4 w-4 text-purple-600" />
              )}
              <span className="text-sm font-semibold">{route.title}</span>
              {isSelected && (
                <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />
              )}
            </div>

            {/* Compact Route Stats */}
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span className="font-medium">{route.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-500" />
                <span className="font-medium">{route.distance}</span>
              </div>
            </div>

            {/* Compact Safety and Traffic */}
            <div className="flex items-center justify-between">
              <Badge
                className={cn("text-xs h-5", getSafetyColor(route.safetyLevel))}
              >
                <Shield className="h-3 w-3 mr-1" />
                {route.safetyLevel}
              </Badge>
              {route.traffic && (
                <Badge
                  className={cn("text-xs h-5", getTrafficColor(route.traffic))}
                >
                  {route.traffic}
                </Badge>
              )}
            </div>

            {/* Compact Warnings */}
            {route.warnings && route.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="flex items-center gap-1 text-xs text-yellow-700">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{route.warnings[0]}</span>
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
      className="flow-seamless max-w-2xl mx-auto"
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Route className="h-5 w-5" />
            Routes
          </h2>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Compact Route Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {routes.map((route) => (
          <RouteCard key={route.id} route={route} />
        ))}
      </div>

      {/* Compact Action Button */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={handleStartRoute}
          className="px-6 h-10 text-sm font-medium bg-blue-600 hover:bg-blue-700"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Start Navigation
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
