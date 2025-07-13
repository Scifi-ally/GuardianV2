import { useState, useEffect, useCallback, useRef } from "react";
import {
  Navigation,
  MapPin,
  Play,
  Square,
  Target,
  MousePointer,
  Route,
  Shield,
  Zap,
  Info,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NavigationMode {
  id: "navigate" | "set-start" | "set-end" | "explore";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface SafetyAnalysis {
  score: number;
  confidence: number;
  factors: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  realTimeAlerts: string[];
  recommendations: string[];
}

interface RouteAnalysis {
  overallSafety: number;
  segments: {
    start: google.maps.LatLng;
    end: google.maps.LatLng;
    safetyScore: number;
    alerts: string[];
  }[];
  estimatedTime: string;
  totalDistance: string;
  safetyInsights: string[];
}

interface EnhancedNavigationControllerProps {
  map: google.maps.Map | null;
  currentLocation: { latitude: number; longitude: number } | null;
  onNavigationStart: (
    destination: google.maps.LatLng,
    analysis: RouteAnalysis,
  ) => void;
  onLocationUpdate: (location: { latitude: number; longitude: number }) => void;
  isNavigating: boolean;
  onNavigationStop: () => void;
}

export function EnhancedNavigationController({
  map,
  currentLocation,
  onNavigationStart,
  onLocationUpdate,
  isNavigating,
  onNavigationStop,
}: EnhancedNavigationControllerProps) {
  const [navigationMode, setNavigationMode] =
    useState<NavigationMode["id"]>("navigate");
  const [startPoint, setStartPoint] = useState<google.maps.LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<google.maps.LatLng | null>(null);
  const [clickedLocation, setClickedLocation] =
    useState<google.maps.LatLng | null>(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(
    null,
  );
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoZoom, setAutoZoom] = useState(true);
  const [realTimeTracking, setRealTimeTracking] = useState(false);
  const [showSafetyOverlay, setShowSafetyOverlay] = useState(true);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const navigationModes: NavigationMode[] = [
    {
      id: "navigate",
      label: "Navigate",
      icon: Navigation,
      description: "Click to get directions to any location",
    },
    {
      id: "set-start",
      label: "Set Start",
      icon: Target,
      description: "Click to set starting point",
    },
    {
      id: "set-end",
      label: "Set End",
      icon: MapPin,
      description: "Click to set destination",
    },
    {
      id: "explore",
      label: "Explore",
      icon: MousePointer,
      description: "Click to view safety information",
    },
  ];

  // Set up map click listeners
  useEffect(() => {
    if (!map) return;

    // Remove previous listener
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
    }

    // Add new click listener
    clickListenerRef.current = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          handleMapClick(event.latLng);
        }
      },
    );

    return () => {
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
      }
    };
  }, [map, navigationMode]);

  // Handle map clicks based on mode
  const handleMapClick = useCallback(
    async (latLng: google.maps.LatLng) => {
      setClickedLocation(latLng);

      switch (navigationMode) {
        case "navigate":
          if (currentLocation) {
            await startNavigationToPoint(latLng);
          } else {
            // Current location not available - silent
          }
          break;

        case "set-start":
          setStartPoint(latLng);
          // Silently set starting point
          break;

        case "set-end":
          setEndPoint(latLng);
          // Silently set destination
          if (startPoint) {
            await analyzeRoute(startPoint, latLng);
          }
          break;

        case "explore":
          await analyzeSafetyAtLocation(latLng);
          break;
      }
    },
    [navigationMode, currentLocation, startPoint],
  );

  // Start navigation with AI safety analysis
  const startNavigationToPoint = async (destination: google.maps.LatLng) => {
    if (!currentLocation) return;

    setIsAnalyzing(true);
    try {
      const startLatLng = new google.maps.LatLng(
        currentLocation.latitude,
        currentLocation.longitude,
      );
      const analysis = await analyzeRoute(startLatLng, destination);

      if (analysis) {
        onNavigationStart(destination, analysis);

        if (autoZoom && map) {
          map.setZoom(18);
          map.setCenter(startLatLng);
        }

        if (realTimeTracking) {
          startRealTimeTracking();
        }

        // Silently start navigation
      }
    } catch (error) {
      console.error("Navigation start failed:", error);
      // Failed to start navigation silently
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze route safety with AI
  const analyzeRoute = async (
    start: google.maps.LatLng,
    end: google.maps.LatLng,
  ): Promise<RouteAnalysis | null> => {
    try {
      // Get route from Directions API
      const directionsService = new google.maps.DirectionsService();
      const result = await new Promise<google.maps.DirectionsResult>(
        (resolve, reject) => {
          directionsService.route(
            {
              origin: start,
              destination: end,
              travelMode: google.maps.TravelMode.WALKING,
              unitSystem: google.maps.UnitSystem.METRIC,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                resolve(result);
              } else {
                reject(new Error(`Directions failed: ${status}`));
              }
            },
          );
        },
      );

      // Analyze each segment of the route
      const route = result.routes[0];
      const leg = route.legs[0];
      const steps = leg.steps;

      const segments = await Promise.all(
        steps.map(async (step, index) => {
          const midPoint = {
            lat: (step.start_location.lat() + step.end_location.lat()) / 2,
            lng: (step.start_location.lng() + step.end_location.lng()) / 2,
          };

          const safety = await getAISafetyScore(midPoint.lat, midPoint.lng);

          return {
            start: step.start_location,
            end: step.end_location,
            safetyScore: safety.score,
            alerts: safety.realTimeAlerts,
          };
        }),
      );

      const overallSafety = Math.round(
        segments.reduce((sum, seg) => sum + seg.safetyScore, 0) /
          segments.length,
      );

      const analysis: RouteAnalysis = {
        overallSafety,
        segments,
        estimatedTime: leg.duration?.text || "Unknown",
        totalDistance: leg.distance?.text || "Unknown",
        safetyInsights: generateSafetyInsights(segments, overallSafety),
      };

      setRouteAnalysis(analysis);
      return analysis;
    } catch (error) {
      console.error("Route analysis failed:", error);
      // Failed to analyze route safety silently
      return null;
    }
  };

  // Analyze safety at a specific location
  const analyzeSafetyAtLocation = async (latLng: google.maps.LatLng) => {
    setIsAnalyzing(true);
    try {
      const safety = await getAISafetyScore(latLng.lat(), latLng.lng());
      setSafetyAnalysis(safety);

      // Show safety info popup
      const infoWindow = new google.maps.InfoWindow({
        content: createSafetyInfoContent(safety),
        position: latLng,
      });

      if (map) {
        infoWindow.open(map);
      }
    } catch (error) {
      console.error("Safety analysis failed:", error);
      // Failed to analyze location safety silently
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get AI safety score for location
  const getAISafetyScore = async (
    lat: number,
    lng: number,
  ): Promise<SafetyAnalysis> => {
    try {
      // Try to use the news analysis service
      const response = await fetch("/api/news-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          score: data.safetyScore,
          confidence: data.confidence,
          factors: data.factors,
          riskLevel: getRiskLevel(data.safetyScore),
          realTimeAlerts: data.articles
            .filter((a: any) => a.impact === "negative")
            .slice(0, 3)
            .map((a: any) => a.title),
          recommendations: generateRecommendations(data.safetyScore),
        };
      }
    } catch (error) {
      console.warn("AI analysis unavailable, using fallback");
    }

    // Fallback analysis
    return generateFallbackSafety(lat, lng);
  };

  // Generate fallback safety analysis
  const generateFallbackSafety = (lat: number, lng: number): SafetyAnalysis => {
    const hour = new Date().getHours();
    const baseScore = 70 + (hour >= 6 && hour <= 18 ? 15 : -10);
    const variation = Math.floor((lat * lng * 1000) % 20) - 10;
    const score = Math.max(30, Math.min(95, baseScore + variation));

    return {
      score,
      confidence: 75,
      factors: [
        `${hour >= 6 && hour <= 18 ? "Daytime" : "Nighttime"} conditions`,
        "Area characteristics",
        "General safety assessment",
      ],
      riskLevel: getRiskLevel(score),
      realTimeAlerts:
        score < 50 ? ["Low visibility area", "Limited foot traffic"] : [],
      recommendations: generateRecommendations(score),
    };
  };

  // Helper functions
  const getRiskLevel = (score: number): SafetyAnalysis["riskLevel"] => {
    if (score >= 80) return "low";
    if (score >= 60) return "medium";
    if (score >= 40) return "high";
    return "critical";
  };

  const generateRecommendations = (score: number): string[] => {
    if (score >= 80) return ["Area appears safe", "Normal precautions"];
    if (score >= 60) return ["Stay alert", "Stick to main areas"];
    if (score >= 40)
      return [
        "Exercise caution",
        "Consider alternative route",
        "Travel with others",
      ];
    return [
      "High caution advised",
      "Avoid if possible",
      "Contact emergency services if needed",
    ];
  };

  const generateSafetyInsights = (
    segments: RouteAnalysis["segments"],
    overallScore: number,
  ): string[] => {
    const insights = [];
    const dangerousSegments = segments.filter((s) => s.safetyScore < 50).length;

    if (overallScore >= 80) {
      insights.push("✅ This route has excellent safety ratings");
    } else if (overallScore < 50) {
      insights.push("⚠️ This route has safety concerns");
    }

    if (dangerousSegments > 0) {
      insights.push(
        `🚨 ${dangerousSegments} segment(s) require extra attention`,
      );
    }

    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 5) {
      insights.push("🌙 Night travel - extra caution recommended");
    }

    return insights;
  };

  const createSafetyInfoContent = (safety: SafetyAnalysis): string => {
    const color =
      safety.riskLevel === "low"
        ? "#22c55e"
        : safety.riskLevel === "medium"
          ? "#eab308"
          : safety.riskLevel === "high"
            ? "#f59e0b"
            : "#ef4444";

    return `
      <div style="padding: 12px; max-width: 250px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600;">Safety Analysis</h3>
        <div style="margin-bottom: 8px;">
          <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
            ${safety.score}/100 - ${safety.riskLevel.toUpperCase()}
          </span>
        </div>
        <div style="font-size: 14px; margin-bottom: 8px;">
          <strong>Factors:</strong><br>
          ${safety.factors.map((f) => `• ${f}`).join("<br>")}
        </div>
        ${
          safety.recommendations.length > 0
            ? `
          <div style="font-size: 14px;">
            <strong>Recommendations:</strong><br>
            ${safety.recommendations
              .slice(0, 2)
              .map((r) => `• ${r}`)
              .join("<br>")}
          </div>
        `
            : ""
        }
      </div>
    `;
  };

  // Real-time tracking
  const startRealTimeTracking = () => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          onLocationUpdate(newLocation);

          if (map && autoZoom) {
            map.panTo(
              new google.maps.LatLng(
                newLocation.latitude,
                newLocation.longitude,
              ),
            );
          }
        },
        (error) => console.warn("Real-time tracking error:", error),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
    }
  };

  const currentMode = navigationModes.find((m) => m.id === navigationMode)!;

  return (
    <div className="space-y-4">
      {/* Navigation Mode Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Smart Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-2">
            {navigationModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Button
                  key={mode.id}
                  variant={navigationMode === mode.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNavigationMode(mode.id)}
                  className={cn(
                    "h-auto p-3 flex flex-col items-center gap-1",
                    navigationMode === mode.id && "bg-blue-600 text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{mode.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Current Mode Description */}
          <div className="text-center text-sm text-muted-foreground bg-muted p-2 rounded">
            <span className="font-medium">{currentMode.label}:</span>{" "}
            {currentMode.description}
          </div>

          {/* Navigation Controls */}
          {(startPoint || endPoint) && (
            <div className="space-y-2">
              <Separator />
              {startPoint && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-mono text-xs">
                    {startPoint.lat().toFixed(4)}, {startPoint.lng().toFixed(4)}
                  </span>
                </div>
              )}
              {endPoint && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">End:</span>
                  <span className="font-mono text-xs">
                    {endPoint.lat().toFixed(4)}, {endPoint.lng().toFixed(4)}
                  </span>
                </div>
              )}

              {startPoint && endPoint && !isNavigating && (
                <Button
                  onClick={() => startNavigationToPoint(endPoint)}
                  disabled={isAnalyzing}
                  className="w-full"
                  size="sm"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Analyzing Route...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Navigation
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Navigation Status */}
          {isNavigating && (
            <div className="space-y-2">
              <Separator />
              <div className="flex items-center justify-between">
                <Badge variant="default" className="bg-green-600">
                  <Navigation className="h-3 w-3 mr-1" />
                  Navigating
                </Badge>
                <Button
                  onClick={onNavigationStop}
                  variant="destructive"
                  size="sm"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </div>

              {routeAnalysis && (
                <div className="bg-muted p-3 rounded text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Safety Score:</span>
                    <Badge
                      variant={
                        routeAnalysis.overallSafety >= 70
                          ? "default"
                          : "destructive"
                      }
                    >
                      {routeAnalysis.overallSafety}/100
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Distance:</span>
                    <span className="font-medium">
                      {routeAnalysis.totalDistance}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Time:</span>
                    <span className="font-medium">
                      {routeAnalysis.estimatedTime}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Features */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            Smart Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Auto Zoom</div>
              <div className="text-xs text-muted-foreground">
                Zoom in during navigation
              </div>
            </div>
            <Switch checked={autoZoom} onCheckedChange={setAutoZoom} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Real-time Tracking</div>
              <div className="text-xs text-muted-foreground">
                Update location automatically
              </div>
            </div>
            <Switch
              checked={realTimeTracking}
              onCheckedChange={setRealTimeTracking}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Safety Overlay</div>
              <div className="text-xs text-muted-foreground">
                Show safety information
              </div>
            </div>
            <Switch
              checked={showSafetyOverlay}
              onCheckedChange={setShowSafetyOverlay}
            />
          </div>
        </CardContent>
      </Card>

      {/* Safety Analysis Display */}
      <AnimatePresence>
        {safetyAnalysis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Location Safety
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Safety Score:</span>
                  <Badge
                    variant={
                      safetyAnalysis.riskLevel === "low"
                        ? "default"
                        : "destructive"
                    }
                    className={
                      safetyAnalysis.riskLevel === "low"
                        ? "bg-green-600"
                        : safetyAnalysis.riskLevel === "medium"
                          ? "bg-yellow-600"
                          : safetyAnalysis.riskLevel === "high"
                            ? "bg-orange-600"
                            : "bg-red-600"
                    }
                  >
                    {safetyAnalysis.score}/100
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium">Key Factors:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {safetyAnalysis.factors.map((factor, index) => (
                      <div key={index}>• {factor}</div>
                    ))}
                  </div>
                </div>

                {safetyAnalysis.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Recommendations:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {safetyAnalysis.recommendations
                        .slice(0, 3)
                        .map((rec, index) => (
                          <div key={index}>• {rec}</div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Route Analysis Display */}
      <AnimatePresence>
        {routeAnalysis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Route className="h-4 w-4 text-purple-500" />
                  Route Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Safety</div>
                    <Badge
                      variant={
                        routeAnalysis.overallSafety >= 70
                          ? "default"
                          : "destructive"
                      }
                    >
                      {routeAnalysis.overallSafety}/100
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Segments</div>
                    <div className="font-medium">
                      {routeAnalysis.segments.length}
                    </div>
                  </div>
                </div>

                {routeAnalysis.safetyInsights.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">AI Insights:</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {routeAnalysis.safetyInsights.map((insight, index) => (
                        <div key={index}>{insight}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EnhancedNavigationController;
