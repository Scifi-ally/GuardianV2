import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useAuth } from "@/contexts/AuthContext";
import { enhancedNavigationService } from "@/services/enhancedNavigationService";
import { newsAnalysisService } from "@/services/newsAnalysisService";

interface SafetyMetrics {
  overallScore: number;
  locationSafety: number;
  weatherSafety: number;
  timeFactors: number;
  emergencyReadiness: number;
  deviceHealth: number;
  lastUpdate: number;
}

export function SafetyTab() {
  const [safetyMetrics, setSafetyMetrics] = useState<SafetyMetrics>({
    overallScore: 85,
    locationSafety: 90,
    weatherSafety: 95,
    timeFactors: 80,
    emergencyReadiness: 75,
    deviceHealth: 88,
    lastUpdate: Date.now(),
  });

  const [isCalculating, setIsCalculating] = useState(false);

  const { getCurrentLocation, location } = useGeolocation();
  const { userProfile } = useAuth();

  // Initialize background safety calculation for routes
  useEffect(() => {
    initializeSafetyCalculation();
  }, []);

  const initializeSafetyCalculation = useCallback(async () => {
    try {
      // Get current location for safety analysis
      const currentLocation = await getCurrentLocation();

      // Analyze current safety conditions for route calculation
      await analyzeSafetyConditions(currentLocation);
    } catch (error) {
      console.error("Failed to initialize safety calculation:", error);
    }
  }, [getCurrentLocation]);

  const analyzeSafetyConditions = async (location: any) => {
    try {
      // Time-based safety analysis
      const currentHour = new Date().getHours();
      const timeScore = calculateTimeScore(currentHour);

      // Weather safety analysis
      const weatherScore = await analyzeWeatherSafety(location);

      // Location safety analysis
      const locationScore = await analyzeLocationSafety(location);

      // Emergency readiness check
      const emergencyScore = calculateEmergencyReadiness();

      // Device health assessment
      const deviceScore = await assessDeviceHealth();

      // Calculate overall safety score
      const overallScore = Math.round(
        (timeScore +
          weatherScore +
          locationScore +
          emergencyScore +
          deviceScore) /
          5,
      );

      setSafetyMetrics({
        overallScore,
        locationSafety: locationScore,
        weatherSafety: weatherScore,
        timeFactors: timeScore,
        emergencyReadiness: emergencyScore,
        deviceHealth: deviceScore,
        lastUpdate: Date.now(),
      });
    } catch (error) {
      console.error("Safety analysis failed:", error);
    }
  };

  const calculateTimeScore = (hour: number): number => {
    // Higher risk during late night/early morning hours
    if (hour >= 22 || hour <= 5) return 60;
    if (hour >= 6 && hour <= 8) return 85; // Morning commute
    if (hour >= 17 && hour <= 19) return 80; // Evening commute
    return 95; // Safe daytime hours
  };

  const analyzeWeatherSafety = async (location: any): Promise<number> => {
    try {
      // In a real implementation, this would use weather APIs
      const season = getCurrentSeason();
      const hour = new Date().getHours();

      let score = 90;

      // Adjust for seasonal factors
      if (season === "winter") score -= 10;
      if (season === "summer" && hour >= 12 && hour <= 16) score -= 5; // Hot afternoon

      // Simulate weather conditions
      const isRainy = Math.random() < 0.2;
      const isStormy = Math.random() < 0.05;

      if (isStormy) score -= 30;
      else if (isRainy) score -= 15;

      return Math.max(score, 20);
    } catch {
      return 75; // Default score
    }
  };

  const analyzeLocationSafety = async (location: any): Promise<number> => {
    try {
      // Simulate location-based safety analysis
      // In reality, this would use crime data, emergency services proximity, etc.
      const baseScore = 85;

      // Random factors for demo (in reality, use real data)
      const crimeRate = Math.random() * 0.3; // 0-30% crime adjustment
      const emergencyProximity = Math.random() * 0.2; // 0-20% emergency services bonus

      const score = baseScore - crimeRate * 100 + emergencyProximity * 100;
      return Math.max(Math.min(score, 100), 20);
    } catch {
      return 75;
    }
  };

  const calculateEmergencyReadiness = (): number => {
    let score = 50; // Base score

    // Check emergency contacts
    if (userProfile?.emergencyContacts?.length) {
      score += 30;
    }

    // Check if GPS is available
    if (location) {
      score += 20;
    }

    return Math.min(score, 100);
  };

  const assessDeviceHealth = async (): Promise<number> => {
    try {
      let score = 70; // Base score

      // Battery level
      if ("getBattery" in navigator) {
        const battery = await (navigator as any).getBattery();
        const batteryLevel = battery.level * 100;
        if (batteryLevel > 50) score += 15;
        else if (batteryLevel > 20) score += 5;
        else score -= 10;
      }

      // Network connectivity
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        if (connection.effectiveType === "4g") score += 15;
        else if (connection.effectiveType === "3g") score += 5;
      }

      return Math.min(score, 100);
    } catch {
      return 75;
    }
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "autumn";
    return "winter";
  };

  const calculateSafeRoute = async () => {
    setIsCalculating(true);
    try {
      const currentLocation = await getCurrentLocation();

      // Perform comprehensive safety analysis
      await analyzeSafetyConditions(currentLocation);

      // Analyze news and safety factors for the area
      const newsAnalysis = await newsAnalysisService.analyzeSafetyNews(
        {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        5,
      );

      // Update metrics with comprehensive analysis
      setSafetyMetrics((prev) => ({
        ...prev,
        overallScore: newsAnalysis.overallSafetyScore,
        locationSafety: newsAnalysis.areaAnalysis.crimeRate,
        weatherSafety: 85, // Weather analysis placeholder
        timeFactors: newsAnalysis.areaAnalysis.timeBasedRisk,
        emergencyReadiness: newsAnalysis.areaAnalysis.politicalStability,
        deviceHealth: 88, // Device health placeholder
        lastUpdate: Date.now(),
      }));

      console.log("✅ Comprehensive safety calculation completed", {
        newsAnalysis,
        location: currentLocation,
        safetyMetrics: safetyMetrics,
      });

      // Show success notification with safety insights
      console.log(
        `Safety analysis complete! Overall score: ${newsAnalysis.overallSafetyScore}/100`,
      );
    } catch (error) {
      console.error("❌ Failed to calculate safe route:", error);
      console.log("Safety calculation failed. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="mobile-container mobile-safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="mobile-padding-md space-y-4 w-full max-w-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Route Safety Calculator
            </h1>
            <p className="text-gray-600">
              Background safety analysis for navigation
            </p>
          </div>
        </div>

        {/* Safety Calculation Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-100">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Safety Analysis Engine
                  </h3>
                  <p className="text-sm text-gray-600">
                    Calculates route safety factors for navigation
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={calculateSafeRoute}
                disabled={isCalculating}
                className="w-full flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                {isCalculating
                  ? "Analyzing Safety Factors..."
                  : "Analyze Area Safety"}
              </Button>

              {safetyMetrics.lastUpdate > 0 && (
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Overall Safety Score:</span>
                    <span
                      className={`font-bold ${
                        safetyMetrics.overallScore >= 80
                          ? "text-green-600"
                          : safetyMetrics.overallScore >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {safetyMetrics.overallScore}/100
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Analysis includes: Crime data, News incidents, Time factors,
                    Emergency access
                  </div>
                  <div className="text-xs text-gray-500">
                    Last updated:{" "}
                    {new Date(safetyMetrics.lastUpdate).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
