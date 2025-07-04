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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Navigation
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Overall Route Safety */}
          {route && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Route Safety</span>
                <Badge
                  className={`${getSafetyBgColor(route.overallSafetyScore)} ${getSafetyColor(route.overallSafetyScore)} border-0`}
                >
                  {route.overallSafetyScore}/100
                </Badge>
              </div>
              <Progress
                value={route.overallSafetyScore}
                className="h-2"
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
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-800">
                    Alert in {Math.round(nextAlert.distance)}m
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {nextAlert.message}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Alerts */}
          {route?.dynamicAlerts && route.dynamicAlerts.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Live Updates
              </div>
              {route.dynamicAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="p-2 rounded bg-blue-50 border border-blue-200"
                >
                  <div className="text-xs text-blue-800">{alert}</div>
                </div>
              ))}
            </div>
          )}

          {/* AI Insights */}
          {route?.aiInsights && route.aiInsights.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                AI Insights
              </div>
              <div className="space-y-1">
                {route.aiInsights.slice(0, 3).map((insight, index) => (
                  <div
                    key={index}
                    className="text-xs text-gray-600 p-2 rounded bg-gray-50"
                  >
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route Segments */}
          {route?.segments && route.segments.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Route className="h-4 w-4 text-green-500" />
                Route Segments ({route.segments.length})
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {route.segments.map((segment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {getAlertIcon(segment.alertLevel)}
                      <span>Segment {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getSafetyColor(segment.safetyScore)}`}
                      >
                        {segment.safetyScore}
                      </Badge>
                      <span className="text-gray-500">
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
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="text-center">
                <div className="text-xs text-gray-500">Total Time</div>
                <div className="text-sm font-medium flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.round(route.totalTime / 60)}min
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Distance</div>
                <div className="text-sm font-medium flex items-center justify-center gap-1">
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
            className="w-full"
          >
            Stop Navigation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AINavigationPanel;
