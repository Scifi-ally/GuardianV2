import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-device-apis";
import {
  getSafetyLevel,
  debugColorScheme,
  getSafetyCssClass,
} from "@/utils/safetyColors";

interface ValidationResult {
  category: string;
  status: "pass" | "warning" | "error";
  message: string;
  details?: string;
}

export function SafetyScoreValidator() {
  const { location } = useGeolocation();
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([]);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const runValidation = async () => {
    setIsValidating(true);
    const results: ValidationResult[] = [];

    try {
      // Test 1: AI News Analysis Service
      try {
        const { aiNewsAnalysis } = await import("@/services/aiNewsAnalysis");
        if (location) {
          const analysis = await aiNewsAnalysis.getLocationSafetyScore(
            location.latitude,
            location.longitude,
          );

          setCurrentScore(analysis.finalScore);

          // Validate score range
          if (analysis.finalScore >= 0 && analysis.finalScore <= 100) {
            results.push({
              category: "Score Range",
              status: "pass",
              message: `Valid score: ${analysis.finalScore}/100`,
            });
          } else {
            results.push({
              category: "Score Range",
              status: "error",
              message: `Invalid score: ${analysis.finalScore}/100`,
              details: "Score must be between 0-100",
            });
          }

          // Validate calculation components
          const components = [
            "baseScore",
            "newsImpact",
            "timeOfDayAdjustment",
            "weatherImpact",
          ];
          let calculationValid = true;

          components.forEach((component) => {
            const value = analysis[component as keyof typeof analysis];
            if (typeof value !== "number" || isNaN(value)) {
              calculationValid = false;
            }
          });

          results.push({
            category: "Calculation Components",
            status: calculationValid ? "pass" : "error",
            message: calculationValid
              ? "All components valid"
              : "Some components invalid",
            details: calculationValid
              ? `Base: ${analysis.baseScore}, News: ${analysis.newsImpact}, Time: ${analysis.timeOfDayAdjustment}, Weather: ${analysis.weatherImpact}`
              : "Check console for detailed breakdown",
          });

          // Validate confidence level
          if (analysis.confidence >= 20 && analysis.confidence <= 95) {
            results.push({
              category: "Confidence Level",
              status: "pass",
              message: `Confidence: ${analysis.confidence}%`,
            });
          } else {
            results.push({
              category: "Confidence Level",
              status: "warning",
              message: `Unusual confidence: ${analysis.confidence}%`,
              details: "Expected range: 20-95%",
            });
          }
        }
      } catch (error) {
        results.push({
          category: "AI Analysis",
          status: "error",
          message: "AI analysis failed",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Test 2: Area-based Safety Service
      try {
        const { areaBasedSafety } = await import("@/services/areaBasedSafety");
        if (location) {
          const { area } = await areaBasedSafety.getSafetyScore({
            latitude: location.latitude,
            longitude: location.longitude,
          });

          if (area.safetyScore >= 0 && area.safetyScore <= 100) {
            results.push({
              category: "Area Safety",
              status: "pass",
              message: `Area score: ${area.safetyScore}/100`,
            });
          } else {
            results.push({
              category: "Area Safety",
              status: "error",
              message: `Invalid area score: ${area.safetyScore}`,
            });
          }
        }
      } catch (error) {
        results.push({
          category: "Area Safety",
          status: "error",
          message: "Area safety calculation failed",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Test 3: Color System Validation
      try {
        const testScores = [10, 30, 45, 60, 75, 90];
        let colorSystemValid = true;

        testScores.forEach((score) => {
          const level = getSafetyLevel(score);
          if (!level.color || !level.label || !level.description) {
            colorSystemValid = false;
          }
        });

        results.push({
          category: "Color System",
          status: colorSystemValid ? "pass" : "error",
          message: colorSystemValid
            ? "Color mapping valid"
            : "Color mapping issues",
          details: colorSystemValid
            ? "All score ranges have proper colors"
            : "Some scores missing color mappings",
        });
      } catch (error) {
        results.push({
          category: "Color System",
          status: "error",
          message: "Color system validation failed",
        });
      }

      // Test 4: Real-time Data Service
      try {
        const { realTimeDataService } = await import(
          "@/services/realTimeDataService"
        );
        const status = realTimeDataService.getLocationStatus();

        results.push({
          category: "Real-time Data",
          status: status.hasLocation ? "pass" : "warning",
          message: status.hasLocation
            ? "Location data available"
            : "No location data",
          details: `Tracking: ${status.isTracking}, Last update: ${status.lastUpdate?.toLocaleTimeString() || "Never"}`,
        });
      } catch (error) {
        results.push({
          category: "Real-time Data",
          status: "error",
          message: "Real-time service failed",
        });
      }
    } catch (error) {
      results.push({
        category: "Overall Validation",
        status: "error",
        message: "Validation process failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setValidationResults(results);
    setIsValidating(false);
  };

  const getStatusIcon = (status: ValidationResult["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ValidationResult["status"]) => {
    switch (status) {
      case "pass":
        return "text-green-800 bg-green-100 border-green-200";
      case "warning":
        return "text-yellow-800 bg-yellow-100 border-yellow-200";
      case "error":
        return "text-red-800 bg-red-100 border-red-200";
    }
  };

  useEffect(() => {
    if (location) {
      runValidation();
    }
  }, [location]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            Safety System Validation
          </CardTitle>
          <Button
            onClick={runValidation}
            variant="outline"
            size="sm"
            disabled={isValidating}
            className="h-6 px-2 text-xs"
          >
            {isValidating ? "Checking..." : "Validate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentScore !== null && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Safety Score</span>
              <div className="flex items-center gap-2">
                <Badge className={getSafetyCssClass(currentScore)}>
                  {currentScore}/100
                </Badge>
                <span className="text-xs text-gray-600">
                  {getSafetyLevel(currentScore).label}
                </span>
              </div>
            </div>
          </div>
        )}

        {validationResults.length === 0 && !isValidating ? (
          <div className="text-center py-4 text-sm text-gray-500">
            Click "Validate" to check safety scoring system
          </div>
        ) : (
          <div className="space-y-2">
            {validationResults.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start gap-2">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{result.category}</div>
                    <div className="text-sm opacity-90">{result.message}</div>
                    {result.details && (
                      <div className="text-xs opacity-75 mt-1">
                        {result.details}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <Button
          onClick={() => debugColorScheme()}
          variant="outline"
          size="sm"
          className="w-full h-6 text-xs"
        >
          Debug Color Scheme (Check Console)
        </Button>
      </CardContent>
    </Card>
  );
}
