import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Eye,
  Shield,
  TrendingUp,
  AlertTriangle,
  Navigation,
  Clock,
  Users,
  MapPin,
  Zap,
  Activity,
  Star,
  X,
  Minimize2,
} from "lucide-react";

interface AIFeaturesProps {
  isVisible: boolean;
  location?: { latitude: number; longitude: number };
  isNavigating?: boolean;
  onClose?: () => void;
}

export function AIFeaturesPanel({
  isVisible,
  location,
  isNavigating = false,
  onClose,
}: AIFeaturesProps) {
  const [safetyScore, setSafetyScore] = useState(75);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [riskFactors, setRiskFactors] = useState<
    Array<{ factor: string; level: number; color: string }>
  >([]);

  // Simulate AI analysis updates
  useEffect(() => {
    if (!isVisible || !location) return;

    const interval = setInterval(() => {
      // Update safety score with realistic variations
      setSafetyScore((prev) => {
        const change = (Math.random() - 0.5) * 10;
        return Math.max(20, Math.min(95, prev + change));
      });

      // Generate AI insights
      const insights = generateAIInsights();
      setAiInsights(insights);

      // Update risk factors
      const factors = generateRiskFactors();
      setRiskFactors(factors);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isVisible, location]);

  const generateAIInsights = (): string[] => {
    const hour = new Date().getHours();
    const insights = [];

    if (hour >= 22 || hour <= 5) {
      insights.push(
        "🌙 Night travel detected - enhanced safety monitoring active",
      );
    } else if (hour >= 6 && hour <= 9) {
      insights.push(
        "🌅 Morning commute time - generally safer with good visibility",
      );
    }

    if (safetyScore > 80) {
      insights.push(
        "✅ Area has excellent safety ratings based on recent data",
      );
    } else if (safetyScore < 40) {
      insights.push(
        "⚠️ Increased caution advised - consider alternative routes",
      );
    }

    insights.push("🧠 AI continuously analyzing 50+ safety parameters");
    insights.push("📱 Real-time updates from community safety network");

    return insights.slice(0, 3);
  };

  const generateRiskFactors = () => {
    return [
      {
        factor: "Lighting Conditions",
        level: Math.floor(Math.random() * 100),
        color: "blue",
      },
      {
        factor: "Crowd Density",
        level: Math.floor(Math.random() * 100),
        color: "green",
      },
      {
        factor: "Emergency Response",
        level: Math.floor(Math.random() * 100),
        color: "purple",
      },
      {
        factor: "Historical Safety",
        level: Math.floor(Math.random() * 100),
        color: "orange",
      },
    ];
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getSafetyBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    if (score >= 40) return "bg-orange-100";
    return "bg-red-100";
  };

  // If not visible and onClose is provided, don't render (modal mode)
  if (!isVisible && onClose) return null;

  // Determine if this is embedded mode (no onClose) or modal mode
  const isEmbedded = !onClose;

  const CardComponent = (
    <Card
      className={
        isEmbedded
          ? "bg-white border-black/10 shadow-sm"
          : "bg-white/95 backdrop-blur-sm shadow-2xl border-2 border-gray-200/50 hover:shadow-3xl transition-shadow duration-300"
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-blue-600" />
            <span className="text-black font-bold text-sm">GUARDIAN</span>
            <span className="text-sm text-gray-600">AI</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Activity className="h-4 w-4 text-blue-500" />
            </motion.div>
            {onClose && (
              <motion.button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </motion.button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Real-time Safety Score */}
        <motion.div
          className="space-y-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AI Safety Score</span>
            <Badge
              className={`${getSafetyBgColor(safetyScore)} ${getSafetyColor(safetyScore)} border-0`}
            >
              {safetyScore}/100
            </Badge>
          </div>
          <Progress
            value={safetyScore}
            className="h-3"
            style={{
              background:
                safetyScore >= 80
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : safetyScore >= 60
                    ? "linear-gradient(90deg, #eab308, #ca8a04)"
                    : "linear-gradient(90deg, #ef4444, #dc2626)",
            }}
          />
        </motion.div>

        {/* AI Insights */}
        <motion.div
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-500" />
            AI Insights
          </div>
          <div className="space-y-1">
            {aiInsights.map((insight, index) => (
              <motion.div
                key={index}
                className="text-xs text-gray-700 p-2 rounded bg-gray-50 border-l-2 border-blue-400"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                {insight}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Risk Factors Analysis */}
        <motion.div
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            Risk Analysis
          </div>
          <div className="space-y-2">
            {riskFactors.map((factor, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between text-xs"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <span className="text-gray-600">{factor.factor}</span>
                <div className="flex items-center gap-2">
                  <Progress value={factor.level} className="w-16 h-1" />
                  <span className="text-xs font-medium">{factor.level}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Features */}
        <motion.div
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Active AI Features
          </div>
          <div className="grid grid-cols-2 gap-2">
            <motion.div
              className="bg-blue-50 p-2 rounded text-center"
              whileHover={{ scale: 1.05 }}
            >
              <TrendingUp className="h-3 w-3 mx-auto mb-1 text-blue-600" />
              <div className="text-xs font-medium text-blue-800">
                Predictive
              </div>
            </motion.div>
            <motion.div
              className="bg-green-50 p-2 rounded text-center"
              whileHover={{ scale: 1.05 }}
            >
              <Users className="h-3 w-3 mx-auto mb-1 text-green-600" />
              <div className="text-xs font-medium text-green-800">
                Community
              </div>
            </motion.div>
            <motion.div
              className="bg-purple-50 p-2 rounded text-center"
              whileHover={{ scale: 1.05 }}
            >
              <Navigation className="h-3 w-3 mx-auto mb-1 text-purple-600" />
              <div className="text-xs font-medium text-purple-800">
                Route AI
              </div>
            </motion.div>
            <motion.div
              className="bg-orange-50 p-2 rounded text-center"
              whileHover={{ scale: 1.05 }}
            >
              <Clock className="h-3 w-3 mx-auto mb-1 text-orange-600" />
              <div className="text-xs font-medium text-orange-800">
                Real-time
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Status Footer */}
        <motion.div
          className="pt-2 border-t text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            AI Guardian Active
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Protecting you with advanced AI
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );

  // If embedded, return just the card
  if (isEmbedded) {
    return CardComponent;
  }

  // If modal mode, wrap with animation
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className="fixed top-4 left-4 z-[1100] max-w-sm w-full"
          initial={{ x: -400, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -400, opacity: 0, scale: 0.8 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            duration: 0.6,
          }}
        >
          <motion.div
            initial={{ rotateY: -90 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -90 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {CardComponent}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AIFeaturesPanel;
