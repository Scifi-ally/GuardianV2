import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { SAFETY_COLOR_SCHEME, getSafetyLevel } from "@/utils/safetyColors";

interface SafetyColorLegendProps {
  currentScore?: number;
  className?: string;
}

export function SafetyColorLegend({
  currentScore,
  className,
}: SafetyColorLegendProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600" />
          Safety Color Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {SAFETY_COLOR_SCHEME.map((scheme, index) => {
          const isCurrentLevel =
            currentScore !== undefined &&
            getSafetyLevel(currentScore).score === scheme.score;

          return (
            <motion.div
              key={scheme.score}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                isCurrentLevel ? "bg-gray-50 border border-gray-200" : ""
              }`}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: scheme.color }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{scheme.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {scheme.score === 0
                      ? `0-${SAFETY_COLOR_SCHEME[index - 1]?.score - 1 || 24}`
                      : `${scheme.score}+`}
                  </Badge>
                  {isCurrentLevel && (
                    <Badge className="text-xs bg-blue-100 text-blue-800">
                      Current: {currentScore}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {scheme.description}
                </p>
              </div>
            </motion.div>
          );
        })}

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-xs font-semibold text-blue-800 mb-1">
            How Safety Scores Work
          </h4>
          <p className="text-xs text-blue-700">
            Scores are calculated using AI analysis of real-time news, weather,
            lighting, foot traffic, and emergency services proximity.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
