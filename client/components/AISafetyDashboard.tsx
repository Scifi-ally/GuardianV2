import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Brain,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Zap,
  Users,
  Battery,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { safeAIService } from "@/services/safeAIService";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { enhancedFirebaseService } from "@/services/enhancedFirebaseService";
import { voiceCommandService } from "@/services/voiceCommandService";
import { useAuth } from "@/contexts/AuthContext";
import { notifications } from "@/services/enhancedNotificationService";
import { cn } from "@/lib/utils";

interface SafetyMetrics {
  overallScore: number;
  riskLevel: "very_low" | "low" | "medium" | "high" | "very_high";
  lastUpdate: Date;
  trends: {
    direction: "improving" | "declining" | "stable";
    change: number;
  };
  breakdown: {
    location: number;
    connectivity: number;
    emergency: number;
    time: number;
  };
}

interface AIInsight {
  id: string;
  type: "recommendation" | "warning" | "tip" | "pattern";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  confidence: number;
  timestamp: Date;
  actionable: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface SystemStatus {
  location: {
    active: boolean;
    accuracy: number;
    lastUpdate: Date;
  };
  connectivity: {
    online: boolean;
    quality: "poor" | "fair" | "good" | "excellent";
    firebaseConnected: boolean;
  };
  emergency: {
    contactsCount: number;
    voiceCommands: boolean;
    batteryLevel?: number;
  };
  ai: {
    available: boolean;
    lastAnalysis?: Date;
    insights: number;
  };
}

export function AISafetyDashboard() {
  const { currentUser, userProfile, isOnline } = useAuth();
  const [safetyMetrics, setSafetyMetrics] = useState<SafetyMetrics | null>(
    null,
  );
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  // Initialize dashboard
  useEffect(() => {
    updateSystemStatus();
    performSafetyAnalysis();

    // Set up periodic updates
    const statusInterval = setInterval(updateSystemStatus, 30000); // 30 seconds
    const analysisInterval = setInterval(performSafetyAnalysis, 300000); // 5 minutes

    return () => {
      clearInterval(statusInterval);
      clearInterval(analysisInterval);
    };
  }, [currentUser]);

  // Update system status
  const updateSystemStatus = async () => {
    try {
      const location = enhancedLocationService.current;
      const batteryLevel = await getBatteryLevel();

      const status: SystemStatus = {
        location: {
          active: enhancedLocationService.isActive,
          accuracy: location?.accuracy || 0,
          lastUpdate: location?.timestamp || new Date(),
        },
        connectivity: {
          online: isOnline,
          quality: getConnectionQuality(),
          firebaseConnected: enhancedFirebaseService.isConnected,
        },
        emergency: {
          contactsCount: userProfile?.emergencyContacts?.length || 0,
          voiceCommands: voiceCommandService.isActive,
          batteryLevel,
        },
        ai: {
          available: safeAIService.isAvailable(),
          lastAnalysis: lastAnalysisTime,
          insights: aiInsights.length,
        },
      };

      setSystemStatus(status);
    } catch (error) {
      console.error("Failed to update system status:", error);
    }
  };

  // Perform AI-powered safety analysis
  const performSafetyAnalysis = async () => {
    if (!safeAIService.isAvailable() || isAnalyzing) return;

    setIsAnalyzing(true);

    try {
      const location = enhancedLocationService.current;
      if (!location) {
        setIsAnalyzing(false);
        return;
      }

      // Get weather context (mock data for demo)
      const weather = {
        temperature: 72,
        condition: "clear",
        visibility: 10,
        windSpeed: 5,
        alerts: [],
      };

      // Get safety context
      const safetyContext = getSafetyContext();

      // Perform AI analysis
      const analysis = await safeAIService.analyzeSafety(
        location.latitude,
        location.longitude,
        {
          weather,
          accuracy: location.accuracy,
          address: location.address,
          timestamp: location.timestamp,
          ...safetyContext,
        },
      );

      // Convert analysis to insights
      const insights: AIInsight[] = analysis.recommendations.map(
        (rec, index) => ({
          id: `insight_${Date.now()}_${index}`,
          type: getInsightType(rec.type),
          priority: rec.priority,
          title: rec.title,
          description: rec.description,
          confidence: rec.confidence,
          timestamp: new Date(),
          actionable: rec.actionable,
          actions: [],
        }),
      );

      setAIInsights(insights);

      // Calculate safety metrics
      const metrics = calculateSafetyMetrics(analysis, systemStatus!);
      setSafetyMetrics(metrics);

      setLastAnalysisTime(new Date());

      // Show high-priority insights as notifications
      insights
        .filter(
          (insight) =>
            insight.priority === "high" || insight.priority === "critical",
        )
        .forEach((insight) => {
          const notificationType =
            insight.priority === "critical" ? "error" : "warning";
          notifications[notificationType]({
            title: insight.title,
            description: insight.description,
            vibrate: insight.priority === "critical",
          });
        });
    } catch (error) {
      console.error("AI safety analysis failed:", error);
      notifications.error({
        title: "AI Analysis Failed",
        description: "Unable to analyze current safety conditions",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper functions
  const getSafetyContext = () => {
    const hour = new Date().getHours();
    let timeOfDay: "morning" | "afternoon" | "evening" | "night";

    if (hour >= 6 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "evening";
    else timeOfDay = "night";

    return {
      timeOfDay,
      dayOfWeek: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      userProfile: {
        emergencyContacts: userProfile?.emergencyContacts?.length || 0,
      },
      deviceInfo: {
        batteryLevel: systemStatus?.emergency.batteryLevel,
      },
      travelMode: "walking" as const,
    };
  };

  const getInsightType = (type: string): AIInsight["type"] => {
    switch (type) {
      case "route":
      case "timing":
      case "precaution":
        return "recommendation";
      case "emergency":
        return "warning";
      default:
        return "tip";
    }
  };

  const calculateSafetyMetrics = (
    analysis: any,
    status: SystemStatus,
  ): SafetyMetrics => {
    const riskScores = {
      very_low: 95,
      low: 80,
      medium: 60,
      high: 40,
      very_high: 20,
    };

    const baseScore =
      riskScores[analysis.riskLevel as keyof typeof riskScores] || 60;

    // Adjust based on system status
    let adjustedScore = baseScore;

    if (!status.location.active) adjustedScore -= 15;
    if (!status.connectivity.online) adjustedScore -= 10;
    if (status.emergency.contactsCount === 0) adjustedScore -= 20;
    if (status.emergency.batteryLevel && status.emergency.batteryLevel < 20)
      adjustedScore -= 10;

    adjustedScore = Math.max(0, Math.min(100, adjustedScore));

    return {
      overallScore: adjustedScore,
      riskLevel: analysis.riskLevel,
      lastUpdate: new Date(),
      trends: {
        direction: "stable", // Would be calculated from historical data
        change: 0,
      },
      breakdown: {
        location: status.location.active ? 85 : 30,
        connectivity: status.connectivity.online ? 90 : 20,
        emergency: Math.min(100, status.emergency.contactsCount * 25),
        time: getTimeScore(),
      },
    };
  };

  const getTimeScore = (): number => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 18) return 85; // Daytime
    if (hour >= 19 && hour <= 22) return 70; // Evening
    return 50; // Night
  };

  const getConnectionQuality = (): SystemStatus["connectivity"]["quality"] => {
    if (!isOnline) return "poor";
    const connection = (navigator as any).connection;
    if (!connection) return "good";

    switch (connection.effectiveType) {
      case "4g":
        return "excellent";
      case "3g":
        return "good";
      case "2g":
        return "fair";
      default:
        return "poor";
    }
  };

  const getBatteryLevel = async (): Promise<number | undefined> => {
    try {
      if ("getBattery" in navigator) {
        const battery = await (navigator as any).getBattery();
        return battery.level * 100;
      }
    } catch (error) {
      // Battery API not available
    }
    return undefined;
  };

  const getSafetyScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getRiskLevelBadge = (level: string) => {
    const colors = {
      very_low: "bg-green-100 text-green-800",
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      very_high: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={colors[level as keyof typeof colors] || colors.medium}>
        {level.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Shield className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">AI Safety Dashboard</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to access AI-powered safety insights and recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Safety Score Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Safety Dashboard
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={performSafetyAnalysis}
              disabled={isAnalyzing}
              className="gap-2"
            >
              <RefreshCw
                className={cn("h-4 w-4", isAnalyzing && "animate-spin")}
              />
              {isAnalyzing ? "Analyzing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {safetyMetrics ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold">
                      <span
                        className={getSafetyScoreColor(
                          safetyMetrics.overallScore,
                        )}
                      >
                        {safetyMetrics.overallScore}
                      </span>
                      <span className="text-muted-foreground">/100</span>
                    </span>
                    {getRiskLevelBadge(safetyMetrics.riskLevel)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Last updated:{" "}
                    {safetyMetrics.lastUpdate.toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Stable</span>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Location</span>
                    <span>{safetyMetrics.breakdown.location}%</span>
                  </div>
                  <Progress
                    value={safetyMetrics.breakdown.location}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Connectivity</span>
                    <span>{safetyMetrics.breakdown.connectivity}%</span>
                  </div>
                  <Progress
                    value={safetyMetrics.breakdown.connectivity}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Emergency</span>
                    <span>{safetyMetrics.breakdown.emergency}%</span>
                  </div>
                  <Progress
                    value={safetyMetrics.breakdown.emergency}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Time Context</span>
                    <span>{safetyMetrics.breakdown.time}%</span>
                  </div>
                  <Progress
                    value={safetyMetrics.breakdown.time}
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                {isAnalyzing
                  ? "Analyzing safety conditions..."
                  : "Click refresh to analyze"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      {systemStatus && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Location</span>
                <Badge
                  variant={
                    systemStatus.location.active ? "default" : "secondary"
                  }
                >
                  {systemStatus.location.active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {systemStatus.connectivity.online ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Network</span>
                <Badge
                  variant={
                    systemStatus.connectivity.online ? "default" : "destructive"
                  }
                >
                  {systemStatus.connectivity.quality}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">Contacts</span>
                <Badge
                  variant={
                    systemStatus.emergency.contactsCount > 0
                      ? "default"
                      : "secondary"
                  }
                >
                  {systemStatus.emergency.contactsCount}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4" />
                <span className="text-sm">Battery</span>
                <Badge variant="outline">
                  {systemStatus.emergency.batteryLevel?.toFixed(0) || "Unknown"}
                  %
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            AI Insights ({aiInsights.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {aiInsights.length > 0 ? (
              <div className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "border rounded-lg p-3 cursor-pointer transition-colors",
                      expandedInsight === insight.id && "bg-muted/50",
                    )}
                    onClick={() =>
                      setExpandedInsight(
                        expandedInsight === insight.id ? null : insight.id,
                      )
                    }
                  >
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(insight.priority)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium">
                            {insight.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {(insight.confidence * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                        {expandedInsight === insight.id && insight.actions && (
                          <div className="mt-2 flex gap-2">
                            {insight.actions.map((action, actionIndex) => (
                              <Button
                                key={actionIndex}
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.action();
                                }}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Clock className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm text-muted-foreground">
                  No safety concerns detected
                </p>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

export default AISafetyDashboard;
