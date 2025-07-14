/**
 * Navigation Troubleshooter Component
 * Helps users diagnose and fix navigation issues
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wifi,
  MapPin,
  Key,
  Navigation,
  X,
  Info,
  Zap,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { UnifiedModal } from "@/components/UnifiedModal";
import { navigationFixService } from "@/services/navigationFixService";

interface NavigationTroubleshooterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigationFixed?: () => void;
}

interface DiagnosticResult {
  googleMapsLoaded: boolean;
  locationPermission: boolean;
  currentLocation: boolean;
  internetConnection: boolean;
  apiKey: boolean;
  directionsService: boolean;
}

interface NavigationError {
  code: string;
  message: string;
  solution: string;
  priority: "low" | "medium" | "high" | "critical";
}

export function NavigationTroubleshooter({
  isOpen,
  onClose,
  onNavigationFixed,
}: NavigationTroubleshooterProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [errors, setErrors] = useState<NavigationError[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [fixingError, setFixingError] = useState<string | null>(null);
  const [fixedIssues, setFixedIssues] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  // Auto-run diagnostics when modal opens
  useEffect(() => {
    if (isOpen && !diagnostic) {
      runDiagnostics();
    }
  }, [isOpen]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await navigationFixService.runNavigationTroubleshooter();

      clearInterval(progressInterval);
      setProgress(100);

      setDiagnostic(result.diagnostic);
      setErrors(result.errors);
      setRecommendations(result.recommendations);

      console.log("🔍 Navigation diagnostics completed:", result);
    } catch (error) {
      console.error("❌ Diagnostics failed:", error);
      setErrors([
        {
          code: "DIAGNOSTIC_FAILED",
          message: "Unable to run diagnostics",
          solution: "Refresh the page and try again",
          priority: "high",
        },
      ]);
    } finally {
      setIsRunning(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const fixError = async (errorCode: string) => {
    setFixingError(errorCode);

    try {
      const fixed = await navigationFixService.fixNavigationError(errorCode);

      if (fixed) {
        setFixedIssues((prev) => [...prev, errorCode]);
        // Re-run diagnostics to check if issue is resolved
        await runDiagnostics();
        onNavigationFixed?.();
      }
    } catch (error) {
      console.error(`Failed to fix error ${errorCode}:`, error);
    } finally {
      setFixingError(null);
    }
  };

  const autoFixAll = async () => {
    setFixingError("AUTO_FIX");

    try {
      const result = await navigationFixService.autoFixNavigationIssues();

      if (result.fixed) {
        setFixedIssues((prev) => [...prev, ...result.fixedIssues]);
        await runDiagnostics();
        onNavigationFixed?.();
      }
    } catch (error) {
      console.error("Auto-fix failed:", error);
    } finally {
      setFixingError(null);
    }
  };

  const getDiagnosticIcon = (status: boolean, isLoading = false) => {
    if (isLoading) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    );
  };

  const getErrorIcon = (priority: NavigationError["priority"]) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Info className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getErrorBadgeColor = (priority: NavigationError["priority"]) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const healthScore = diagnostic
    ? Math.round(
        (Object.values(diagnostic).filter(Boolean).length /
          Object.values(diagnostic).length) *
          100,
      )
    : 0;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Navigation Troubleshooter"
      size="lg"
      animationType="slideUp"
      closeAnimation="slideDown"
      className="max-h-[90vh] overflow-hidden"
    >
      <div className="space-y-6">
        {/* Header with Health Score */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Navigation Health Check</h3>
            <p className="text-sm text-gray-600">
              Diagnose and fix navigation issues
            </p>
          </div>
          {diagnostic && (
            <div className="text-center">
              <div
                className={cn(
                  "text-2xl font-bold",
                  healthScore >= 80
                    ? "text-green-600"
                    : healthScore >= 60
                      ? "text-yellow-600"
                      : "text-red-600",
                )}
              >
                {healthScore}%
              </div>
              <div className="text-xs text-gray-500">Health Score</div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Running diagnostics...
              </span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Diagnostic Results */}
        {diagnostic && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Internet Connection</span>
                  </div>
                  {getDiagnosticIcon(diagnostic.internetConnection, isRunning)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Google Maps Loaded</span>
                  </div>
                  {getDiagnosticIcon(diagnostic.googleMapsLoaded, isRunning)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">API Key Valid</span>
                  </div>
                  {getDiagnosticIcon(diagnostic.apiKey, isRunning)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Location Permission</span>
                  </div>
                  {getDiagnosticIcon(diagnostic.locationPermission, isRunning)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Current Location</span>
                  </div>
                  {getDiagnosticIcon(diagnostic.currentLocation, isRunning)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Navigation Service</span>
                  </div>
                  {getDiagnosticIcon(diagnostic.directionsService, isRunning)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Errors and Fixes */}
        {errors.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Issues Found ({errors.length})
                </CardTitle>
                {errors.some((e) => e.priority === "critical") && (
                  <Button
                    onClick={autoFixAll}
                    disabled={fixingError === "AUTO_FIX"}
                    size="sm"
                    className="h-8"
                  >
                    {fixingError === "AUTO_FIX" ? (
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Zap className="h-3 w-3 mr-1" />
                    )}
                    Auto Fix
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {errors.map((error) => (
                <motion.div
                  key={error.code}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-start gap-3">
                    {getErrorIcon(error.priority)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {error.message}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getErrorBadgeColor(error.priority),
                          )}
                        >
                          {error.priority}
                        </Badge>
                      </div>

                      <p className="text-xs text-gray-600 mb-2">
                        {error.solution}
                      </p>

                      {fixedIssues.includes(error.code) ? (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 border-green-200"
                        >
                          Fixed ✓
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => fixError(error.code)}
                          disabled={!!fixingError}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                        >
                          {fixingError === error.code ? (
                            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          Try Fix
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {diagnostic &&
          errors.length === 0 &&
          Object.values(diagnostic).every(Boolean) && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Navigation is working perfectly! All systems are operational.
              </AlertDescription>
            </Alert>
          )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            variant="outline"
            className="flex-1"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Run Again
          </Button>

          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>
      </div>
    </UnifiedModal>
  );
}

export default NavigationTroubleshooter;
