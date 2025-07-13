import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Waves,
  Zap,
  Eye,
  Activity,
  Settings,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SafetyFactor {
  id: string;
  name: string;
  value: number; // 0-100
  weight: number; // How much this affects overall score
  icon: React.ReactNode;
  description: string;
  trend: "up" | "down" | "stable";
}

interface AuraZone {
  id: string;
  name: string;
  radius: number; // in meters
  color: string;
  opacity: number;
  safetyLevel: "safe" | "caution" | "danger";
  description: string;
}

interface AuraReading {
  timestamp: Date;
  overallScore: number;
  factors: SafetyFactor[];
  zones: AuraZone[];
  alerts: string[];
}

export function SafetyAura() {
  const [isActive, setIsActive] = useState(false);
  const [currentReading, setCurrentReading] = useState<AuraReading | null>(
    null,
  );
  const [history, setHistory] = useState<AuraReading[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start/stop aura monitoring
  const toggleAura = useCallback(() => {
    if (isActive) {
      // Stop monitoring
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsActive(false);
      console.log("🛡️ Safety Aura deactivated");
    } else {
      // Start monitoring
      setIsActive(true);
      console.log("🛡️ Safety Aura activated");

      // Initial reading
      generateAuraReading();

      // Update every 30 seconds
      intervalRef.current = setInterval(() => {
        generateAuraReading();
      }, 30000);
    }
  }, [isActive]);

  const generateAuraReading = useCallback(async () => {
    // Simulate gathering real-time safety data
    const factors: SafetyFactor[] = [
      {
        id: "crowd-density",
        name: "Crowd Density",
        value: Math.random() * 100,
        weight: 0.2,
        icon: <Eye className="h-4 w-4" />,
        description: "Number of people in immediate area",
        trend: Math.random() > 0.5 ? "up" : "down",
      },
      {
        id: "lighting",
        name: "Lighting Level",
        value: getCurrentTimeScore(),
        weight: 0.25,
        icon: <Zap className="h-4 w-4" />,
        description: "Ambient light and visibility",
        trend: "stable",
      },
      {
        id: "emergency-services",
        name: "Emergency Access",
        value: 60 + Math.random() * 40,
        weight: 0.15,
        icon: <Shield className="h-4 w-4" />,
        description: "Proximity to police, hospitals, fire stations",
        trend: "stable",
      },
      {
        id: "crime-reports",
        name: "Recent Incidents",
        value: 90 - Math.random() * 30,
        weight: 0.3,
        icon: <AlertTriangle className="h-4 w-4" />,
        description: "Crime reports in the last 24 hours",
        trend: Math.random() > 0.7 ? "down" : "stable",
      },
      {
        id: "network-signal",
        name: "Network Strength",
        value: getNetworkStrength(),
        weight: 0.1,
        icon: <Activity className="h-4 w-4" />,
        description: "Cell tower and WiFi connectivity",
        trend: "stable",
      },
    ];

    // Calculate overall safety score
    const overallScore = Math.round(
      factors.reduce((sum, factor) => sum + factor.value * factor.weight, 0),
    );

    // Generate safety zones based on score
    const zones: AuraZone[] = generateSafetyZones(overallScore);

    // Generate alerts based on factors
    const alerts: string[] = [];
    factors.forEach((factor) => {
      if (factor.value < 30 && factor.weight > 0.2) {
        alerts.push(`Low ${factor.name.toLowerCase()} detected`);
      }
    });

    if (overallScore < 50) {
      alerts.push("Overall safety level is concerning");
    }

    const reading: AuraReading = {
      timestamp: new Date(),
      overallScore,
      factors,
      zones,
      alerts,
    };

    setCurrentReading(reading);
    setHistory((prev) => [reading, ...prev.slice(0, 9)]); // Keep last 10 readings

    console.log("🛡️ Safety Aura updated:", {
      score: overallScore,
      alerts: alerts.length,
    });
  }, []);

  const getCurrentTimeScore = (): number => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 18) return 85 + Math.random() * 15; // Daytime
    if (hour >= 19 && hour <= 21) return 70 + Math.random() * 20; // Evening
    return 40 + Math.random() * 30; // Night
  };

  const getNetworkStrength = (): number => {
    try {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        switch (effectiveType) {
          case "4g":
            return 90 + Math.random() * 10;
          case "3g":
            return 70 + Math.random() * 20;
          case "2g":
            return 40 + Math.random() * 30;
          default:
            return 60 + Math.random() * 20;
        }
      }
    } catch (error) {
      // Fallback
    }
    return 70 + Math.random() * 30;
  };

  const generateSafetyZones = (overallScore: number): AuraZone[] => {
    const zones: AuraZone[] = [];

    // Inner zone (immediate area)
    zones.push({
      id: "inner",
      name: "Immediate Area",
      radius: 25,
      color:
        overallScore > 70
          ? "#10B981"
          : overallScore > 40
            ? "#F59E0B"
            : "#EF4444",
      opacity: 0.6,
      safetyLevel:
        overallScore > 70 ? "safe" : overallScore > 40 ? "caution" : "danger",
      description: "Your immediate 25m safety bubble",
    });

    // Middle zone (walking distance)
    zones.push({
      id: "middle",
      name: "Walking Area",
      radius: 100,
      color:
        overallScore > 60
          ? "#10B981"
          : overallScore > 30
            ? "#F59E0B"
            : "#EF4444",
      opacity: 0.3,
      safetyLevel:
        overallScore > 60 ? "safe" : overallScore > 30 ? "caution" : "danger",
      description: "100m radius - your walking area",
    });

    // Outer zone (extended area)
    zones.push({
      id: "outer",
      name: "Extended Area",
      radius: 250,
      color:
        overallScore > 50
          ? "#10B981"
          : overallScore > 25
            ? "#F59E0B"
            : "#EF4444",
      opacity: 0.15,
      safetyLevel:
        overallScore > 50 ? "safe" : overallScore > 25 ? "caution" : "danger",
      description: "250m radius - your extended area",
    });

    return zones;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-blue-600 bg-blue-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "↗️";
      case "down":
        return "↘️";
      default:
        return "➡️";
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Main Aura Display */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {/* Aura Visualization */}
            <div className="relative w-48 h-48 mx-auto">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-gray-200"
                animate={{
                  scale: isActive ? [1, 1.05, 1] : 1,
                  borderColor: isActive
                    ? currentReading?.overallScore! > 70
                      ? "#10B981"
                      : currentReading?.overallScore! > 40
                        ? "#F59E0B"
                        : "#EF4444"
                    : "#E5E7EB",
                }}
                transition={{
                  duration: 2,
                  repeat: isActive ? Infinity : undefined,
                  ease: "easeInOut",
                }}
              >
                {/* Animated rings */}
                {isActive &&
                  currentReading?.zones.map((zone, index) => (
                    <motion.div
                      key={zone.id}
                      className="absolute rounded-full border-2"
                      style={{
                        borderColor: zone.color,
                        backgroundColor: zone.color,
                        opacity: zone.opacity,
                        width: `${40 + index * 30}%`,
                        height: `${40 + index * 30}%`,
                        top: `${30 - index * 15}%`,
                        left: `${30 - index * 15}%`,
                      }}
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [
                          zone.opacity,
                          zone.opacity * 0.7,
                          zone.opacity,
                        ],
                      }}
                      transition={{
                        duration: 3 + index,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.5,
                      }}
                    />
                  ))}

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center",
                      isActive
                        ? currentReading?.overallScore! > 70
                          ? "bg-green-500 text-white"
                          : currentReading?.overallScore! > 40
                            ? "bg-yellow-500 text-white"
                            : "bg-red-500 text-white"
                        : "bg-gray-300 text-gray-600",
                    )}
                    animate={{
                      scale: isActive ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                      duration: 2,
                      repeat: isActive ? Infinity : undefined,
                    }}
                  >
                    {isActive ? (
                      <Waves className="h-8 w-8" />
                    ) : (
                      <Shield className="h-8 w-8" />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Score Display */}
            {currentReading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div
                  className={cn(
                    "text-3xl font-bold px-4 py-2 rounded-full mx-auto w-fit",
                    getScoreColor(currentReading.overallScore),
                  )}
                >
                  {currentReading.overallScore}
                </div>
                <div className="text-sm text-gray-600">Area Assessment</div>
                <div className="text-xs text-gray-500">
                  Last updated: {currentReading.timestamp.toLocaleTimeString()}
                </div>
              </motion.div>
            )}

            {/* Control Button */}
            <Button
              onClick={toggleAura}
              className={cn(
                "w-full",
                isActive
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white",
              )}
            >
              {isActive ? (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Deactivate Aura
                </>
              ) : (
                <>
                  <Waves className="h-4 w-4 mr-2" />
                  Activate Safety Aura
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {currentReading?.alerts && currentReading.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Safety Alerts
              </h4>
              <div className="space-y-1">
                {currentReading.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="text-sm text-red-700 bg-red-100 px-2 py-1 rounded"
                  >
                    {alert}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Safety Factors */}
      <AnimatePresence>
        {showDetails && currentReading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Safety Factors
                </h4>
                <div className="space-y-3">
                  {currentReading.factors.map((factor) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-gray-600">{factor.icon}</div>
                        <div>
                          <div className="text-sm font-medium">
                            {factor.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {factor.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          {getTrendIcon(factor.trend)}
                        </span>
                        <Badge className={getScoreColor(factor.value)}>
                          {Math.round(factor.value)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1"
        >
          <Settings className="h-4 w-4 mr-2" />
          {showDetails ? "Hide" : "Show"} Details
        </Button>
        {isActive && (
          <Button
            variant="outline"
            onClick={generateAuraReading}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      {/* History */}
      {history.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">Recent Readings</h4>
            <div className="space-y-2">
              {history.slice(1, 4).map((reading, index) => (
                <div
                  key={reading.timestamp.getTime()}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">
                    {reading.timestamp.toLocaleTimeString()}
                  </span>
                  <Badge className={getScoreColor(reading.overallScore)}>
                    {reading.overallScore}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
