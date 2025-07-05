import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  AlertTriangle,
  Navigation,
  Clock,
  MapPin,
  Brain,
  Route,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  aiEnhancedNavigation,
  type LiveNavigationState,
  type RouteSegment,
} from "@/services/aiEnhancedNavigation";

interface AINavigationPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AINavigationPanel({
  isVisible,
  onClose,
}: AINavigationPanelProps) {
  const [navigationState, setNavigationState] =
    useState<LiveNavigationState | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const unsubscribe = aiEnhancedNavigation.subscribe((state) => {
      setNavigationState(state);
    });

    // Get initial state
    setNavigationState(aiEnhancedNavigation.getNavigationState());

    return unsubscribe;
  }, [isVisible]);

  if (!isVisible || !navigationState?.isNavigating) {
    return null;
  }

  const { route, nextAlert, currentLocation, destination } = navigationState;

  const getSafetyColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getSafetyBgColor = (score: number): string => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    if (score >= 40) return "bg-orange-100";
    return "bg-red-100";
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case "danger":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "caution":
        return <Eye className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="fixed top-4 left-4 z-[1100] max-w-sm w-full">
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border">
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-base">
              <Brain className="h-4 w-4 text-blue-600" />
              AI Guide
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 py-3">
          {/* Overall Route Safety */}
          {route && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Safety</span>
                <Badge
                  className={`${getSafetyBgColor(route.overallSafetyScore)} ${getSafetyColor(route.overallSafetyScore)} border-0 text-xs px-2 py-0.5`}
                >
                  {route.overallSafetyScore}/100
                </Badge>
              </div>
              <Progress
                value={route.overallSafetyScore}
                className="h-1.5"
                color={
                  route.overallSafetyScore >= 80
                    ? "bg-green-500"
                    : route.overallSafetyScore >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }
              />
            </div>
          )}

          {/* Next Alert */}
          {nextAlert && (
            <div className="p-2 rounded-md bg-red-50 border border-red-200">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-red-800">
                    Alert in {Math.round(nextAlert.distance)}m
                  </div>
                  <div className="text-xs text-red-600 mt-0.5 leading-tight">
                    {nextAlert.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Alerts */}
          {route?.dynamicAlerts && route.dynamicAlerts.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-blue-500" />
                Live
              </div>
              {route.dynamicAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="p-1.5 rounded-sm bg-blue-50 border border-blue-200"
                >
                  <div className="text-xs text-blue-800 leading-tight">
                    {alert}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Insights */}
          {route?.aiInsights && route.aiInsights.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium flex items-center gap-1.5">
                <Brain className="h-3 w-3 text-purple-500" />
                AI Tips
              </div>
              <div className="space-y-1">
                {route.aiInsights.slice(0, 2).map((insight, index) => (
                  <div
                    key={index}
                    className="text-xs text-gray-600 p-1.5 rounded-sm bg-gray-50 leading-tight"
                  >
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route Segments */}
          {route?.segments && route.segments.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium flex items-center gap-1.5">
                <Route className="h-3 w-3 text-green-500" />
                Route ({route.segments.length})
              </div>
              <div className="space-y-0.5 max-h-24 overflow-y-auto">
                {route.segments.map((segment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-1.5 rounded-sm bg-gray-50 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      {getAlertIcon(segment.alertLevel)}
                      <span>Seg {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-xs px-1 py-0 ${getSafetyColor(segment.safetyScore)}`}
                      >
                        {segment.safetyScore}
                      </Badge>
                      <span className="text-gray-500 text-xs">
                        {Math.round(segment.distance)}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route Stats */}
          {route && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
              <div className="text-center">
                <div className="text-xs text-gray-500">Time</div>
                <div className="text-xs font-medium flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.round(route.totalTime / 60)}min
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Distance</div>
                <div className="text-xs font-medium flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {(route.totalDistance / 1000).toFixed(1)}km
                </div>
              </div>
            </div>
          )}

          {/* Stop Navigation */}
          <Button
            onClick={() => {
              aiEnhancedNavigation.stopNavigation();
              onClose();
            }}
            variant="destructive"
            size="sm"
            className="w-full h-8 text-xs"
          >
            Stop Navigation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AINavigationPanel;
