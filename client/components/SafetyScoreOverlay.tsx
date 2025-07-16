import { useState, useEffect } from "react";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SafetyData {
  score: number;
  level: "high" | "medium" | "low";
  factors: {
    crime: number;
    traffic: number;
    lighting: number;
    population: number;
  };
  insights: string[];
  lastUpdated: string;
}

interface SafetyScoreOverlayProps {
  location: {
    latitude: number;
    longitude: number;
  };
  searchDestination?: {
    latitude: number;
    longitude: number;
  } | null;
  className?: string;
}

export function SafetyScoreOverlay({
  location,
  searchDestination,
  className,
}: SafetyScoreOverlayProps) {
  const [currentSafety, setCurrentSafety] = useState<SafetyData | null>(null);
  const [destinationSafety, setDestinationSafety] = useState<SafetyData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Analyze safety score for a location
  const analyzeSafety = async (coords: {
    latitude: number;
    longitude: number;
  }): Promise<SafetyData> => {
    // Simulate real safety analysis with various factors
    const timeOfDay = new Date().getHours();
    const isNightTime = timeOfDay < 6 || timeOfDay > 20;

    // Mock analysis based on location and time
    const baseScore = Math.floor(Math.random() * 40) + 50; // 50-90 base score
    const timeAdjustment = isNightTime ? -10 : 5;
    const finalScore = Math.max(10, Math.min(100, baseScore + timeAdjustment));

    const level: "high" | "medium" | "low" =
      finalScore >= 70 ? "high" : finalScore >= 50 ? "medium" : "low";

    const factors = {
      crime: Math.floor(Math.random() * 30) + 70,
      traffic: Math.floor(Math.random() * 40) + 60,
      lighting: isNightTime
        ? Math.floor(Math.random() * 30) + 40
        : Math.floor(Math.random() * 20) + 80,
      population: Math.floor(Math.random() * 35) + 65,
    };

    const insights = [];
    if (factors.crime < 60)
      insights.push("Higher crime rate reported in this area");
    if (factors.traffic < 50) insights.push("Heavy traffic conditions");
    if (factors.lighting < 60) insights.push("Limited street lighting");
    if (isNightTime) insights.push("Consider extra caution during nighttime");
    if (finalScore >= 80) insights.push("Well-monitored safe area");

    return {
      score: finalScore,
      level,
      factors,
      insights,
      lastUpdated: new Date().toLocaleTimeString(),
    };
  };

  // Load safety data for current location
  useEffect(() => {
    if (!location) return;

    setLoading(true);
    analyzeSafety(location)
      .then(setCurrentSafety)
      .finally(() => setLoading(false));
  }, [location]);

  // Load safety data for search destination
  useEffect(() => {
    if (!searchDestination) {
      setDestinationSafety(null);
      return;
    }

    analyzeSafety(searchDestination).then(setDestinationSafety);
  }, [searchDestination]);

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

  const getSafetyIcon = (level: "high" | "medium" | "low") => {
    switch (level) {
      case "high":
        return <Shield className="h-4 w-4" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4" />;
      case "low":
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading || !currentSafety) {
    return (
      <div
        className={cn(
          "bg-white rounded-lg shadow-lg border border-gray-200 p-4",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-gray-600">Analyzing safety...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden",
        className,
      )}
    >
      {/* Main Safety Score */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                getSafetyColor(currentSafety.level),
              )}
            >
              {getSafetyIcon(currentSafety.level)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  Safety Score
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    currentSafety.level === "high"
                      ? "text-green-600"
                      : currentSafety.level === "medium"
                        ? "text-yellow-600"
                        : "text-red-600",
                  )}
                >
                  {currentSafety.score}/100
                </span>
              </div>
              <p className="text-xs text-gray-500">Current location</p>
            </div>
          </div>
          <Info className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Safety Factors */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Safety Factors
            </h4>
            <div className="space-y-2">
              {Object.entries(currentSafety.factors).map(([factor, score]) => (
                <div key={factor} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 capitalize">
                    {factor}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          score >= 70
                            ? "bg-green-500"
                            : score >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500",
                        )}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8">{score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          {currentSafety.insights.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Insights
              </h4>
              <div className="space-y-1">
                {currentSafety.insights.map((insight, index) => (
                  <p
                    key={index}
                    className="text-xs text-gray-600 flex items-start gap-1"
                  >
                    <span className="text-gray-400 mt-0.5">•</span>
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Destination Comparison */}
          {destinationSafety && (
            <div className="border-t border-gray-100 pt-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Destination Safety
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "p-1.5 rounded",
                      getSafetyColor(destinationSafety.level),
                    )}
                  >
                    {getSafetyIcon(destinationSafety.level)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {destinationSafety.score}/100
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {destinationSafety.score > currentSafety.score ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">
                        +{destinationSafety.score - currentSafety.score}
                      </span>
                    </>
                  ) : destinationSafety.score < currentSafety.score ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">
                        {destinationSafety.score - currentSafety.score}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500">Same level</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs text-gray-400">
              Last updated: {currentSafety.lastUpdated}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
