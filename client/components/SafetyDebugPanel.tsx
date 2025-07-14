import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Info,
  Clock,
  MapPin,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  safetyDebugService,
  SafetyCalculationBasis,
} from "@/services/safetyDebugService";

interface SafetyDebugPanelProps {
  className?: string;
}

export function SafetyDebugPanel({ className }: SafetyDebugPanelProps) {
  const [debugData, setDebugData] =
    useState<ReturnType<typeof safetyDebugService.getDebugDisplayData>>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SafetyCalculationBasis[]>([]);

  useEffect(() => {
    const updateDebugData = () => {
      const data = safetyDebugService.getDebugDisplayData();
      setDebugData(data);

      if (data?.enabled) {
        setHistory(safetyDebugService.getCalculationHistory());
      }
    };

    // Initial load
    updateDebugData();

    // Update every 5 seconds when debug is enabled
    const interval = setInterval(updateDebugData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!debugData?.enabled) {
    return (
      <Card className={cn("border-yellow-200 bg-yellow-50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-700">
            <Info className="h-4 w-4" />
            <span className="text-sm font-mono">
              Safety Score Debug Mode: DISABLED
            </span>
          </div>
          <p className="text-xs text-yellow-600 mt-1">
            This feature is controlled by admin settings
          </p>
        </CardContent>
      </Card>
    );
  }

  const { latest, summary } = debugData;

  const getSafetyLevelIcon = (level: string) => {
    switch (level) {
      case "very safe":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "safe":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "moderate":
        return <Shield className="h-4 w-4 text-yellow-500" />;
      case "caution":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "unsafe":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSafetyLevelColor = (level: string) => {
    switch (level) {
      case "very safe":
        return "bg-green-100 text-green-800 border-green-200";
      case "safe":
        return "bg-green-50 text-green-700 border-green-200";
      case "moderate":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "caution":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "unsafe":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <BarChart3 className="h-5 w-5" />
            Safety Score Debug Panel
            <Badge variant="outline" className="ml-auto">
              ADMIN MODE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-mono">
                Total Calculations:
              </span>
              <p className="font-bold text-blue-800">
                {summary.totalCalculations}
              </p>
            </div>
            <div>
              <span className="text-blue-600 font-mono">Average Score:</span>
              <p className="font-bold text-blue-800">{summary.averageScore}</p>
            </div>
            <div>
              <span className="text-blue-600 font-mono">Debug Mode:</span>
              <p className="font-bold text-green-600">ACTIVE</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Calculation */}
      {latest && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Latest Safety Calculation
              </CardTitle>
              <Badge className={getSafetyLevelColor(latest.safetyLevel)}>
                {getSafetyLevelIcon(latest.safetyLevel)}
                {latest.safetyLevel.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Info */}
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-slate-600" />
                <span className="font-mono text-sm text-slate-700">
                  Location Data
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Latitude:</span>
                  <span className="ml-2 font-bold">
                    {latest.location.latitude.toFixed(6)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Longitude:</span>
                  <span className="ml-2 font-bold">
                    {latest.location.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                <Clock className="h-3 w-3 inline mr-1" />
                {latest.location.timestamp.toLocaleString()}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-800">
                    Base Score
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-800">
                  {latest.baseScore}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-slate-600" />
                  <span className="font-semibold text-slate-800">
                    Final Score
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-800">
                  {latest.finalScore}
                </div>
              </div>
            </div>

            {/* Calculation Steps */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Calculation Steps
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {latest.calculations.map((calc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-50 p-2 rounded text-xs"
                  >
                    <span className="font-mono">{calc.step}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{calc.value}</span>
                      {calc.contribution !== 0 && (
                        <span
                          className={cn(
                            "px-1 rounded text-xs",
                            calc.contribution > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700",
                          )}
                        >
                          {calc.contribution > 0 ? "+" : ""}
                          {calc.contribution.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Factor Analysis */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Factor Analysis</h4>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(latest.factors).map(([key, factor]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between bg-slate-50 p-2 rounded text-xs"
                  >
                    <div className="flex-1">
                      <span className="font-mono capitalize">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <div className="text-slate-500">
                        Weight: {(factor.weight * 100).toFixed(0)}% | Source:{" "}
                        {factor.source}
                      </div>
                    </div>
                    <div className="font-bold">{factor.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis (if available) */}
            {latest.aiAnalysis && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  🤖 AI Analysis Factors
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-purple-50 p-2 rounded">
                    <span className="text-purple-600">News Impact:</span>
                    <div className="font-bold">
                      {latest.aiAnalysis.newsImpact}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <span className="text-purple-600">Time Adjustment:</span>
                    <div className="font-bold">
                      {latest.aiAnalysis.timeOfDayAdjustment}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <span className="text-purple-600">Weather Impact:</span>
                    <div className="font-bold">
                      {latest.aiAnalysis.weatherImpact}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <span className="text-purple-600">Confidence:</span>
                    <div className="font-bold">
                      {latest.aiAnalysis.confidence}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History Toggle */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? "Hide" : "Show"} Calculation History (
          {summary.totalCalculations})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            safetyDebugService.clearHistory();
            setHistory([]);
          }}
        >
          Clear History
        </Button>
      </div>

      {/* History */}
      {showHistory && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Calculation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((calc, index) => (
                <div
                  key={`${calc.location.latitude}-${calc.location.timestamp.getTime()}`}
                  className="flex items-center justify-between bg-slate-50 p-2 rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    {getSafetyLevelIcon(calc.safetyLevel)}
                    <span className="font-mono">
                      {calc.location.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="text-slate-500">
                      ({calc.location.latitude.toFixed(4)},{" "}
                      {calc.location.longitude.toFixed(4)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getSafetyLevelColor(calc.safetyLevel)}
                      variant="outline"
                    >
                      {calc.finalScore}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SafetyDebugPanel;
