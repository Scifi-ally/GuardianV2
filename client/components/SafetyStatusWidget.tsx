import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-device-apis";

interface SafetyStatus {
  level: "safe" | "warning" | "danger";
  score: number;
  message: string;
}

export function SafetyStatusWidget() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus>({
    level: "safe",
    score: 82,
    message: "All clear in your area",
  });
  const { location } = useGeolocation();

  // Simulate real-time safety updates
  useEffect(() => {
    const interval = setInterval(() => {
      const randomScore = 60 + Math.random() * 40; // 60-100 range
      let level: SafetyStatus["level"] = "safe";
      let message = "All clear in your area";

      if (randomScore < 70) {
        level = "warning";
        message = "Use caution in this area";
      }
      if (randomScore < 50) {
        level = "danger";
        message = "High risk area detected";
      }

      setSafetyStatus({
        level,
        score: Math.round(randomScore),
        message,
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (level: SafetyStatus["level"]) => {
    switch (level) {
      case "safe":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "danger":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (level: SafetyStatus["level"]) => {
    switch (level) {
      case "safe":
        return <Shield className="h-4 w-4 text-white" />;
      case "warning":
      case "danger":
        return <AlertTriangle className="h-4 w-4 text-white" />;
      default:
        return <Shield className="h-4 w-4 text-white" />;
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed top-4 left-4 z-40"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className={cn(
            "h-10 w-10 rounded-full shadow-lg border-2 border-white",
            getStatusColor(safetyStatus.level),
          )}
          size="sm"
        >
          {getStatusIcon(safetyStatus.level)}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-4 z-40"
    >
      <div
        className={cn(
          "rounded-lg shadow-lg border-2 border-white text-white p-3 min-w-[200px]",
          getStatusColor(safetyStatus.level),
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getStatusIcon(safetyStatus.level)}
            <span className="font-semibold text-sm">Safety Status</span>
          </div>
          <Button
            onClick={() => setIsMinimized(true)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-90">Score:</span>
            <span className="font-bold text-lg">{safetyStatus.score}/100</span>
          </div>

          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              className="h-2 bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${safetyStatus.score}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <p className="text-xs opacity-90">{safetyStatus.message}</p>

          {location && (
            <div className="text-xs opacity-75 pt-1 border-t border-white/20">
              📍 Monitoring: {location.latitude.toFixed(4)},{" "}
              {location.longitude.toFixed(4)}
            </div>
          )}
        </div>

        {/* Pulse animation for danger/warning */}
        {safetyStatus.level !== "safe" && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-white"
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
