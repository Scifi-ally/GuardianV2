import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain,
  Shield,
  AlertTriangle,
  MessageSquare,
  Activity,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Eye,
  Zap,
  Target,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  aiThreatDetection,
  type ThreatAlert,
} from "@/services/aiThreatDetection";
import {
  aiCompanion,
  type CompanionMessage,
} from "@/services/aiCompanionService";

interface AIInsightsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  currentLocation?: { latitude: number; longitude: number };
  safetyScore: number;
}

export function AIInsightsPanel({
  isVisible,
  onClose,
  currentLocation,
  safetyScore,
}: AIInsightsPanelProps) {
  const [threats, setThreats] = useState<ThreatAlert[]>([]);
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [activeTab, setActiveTab] = useState<
    "threats" | "companion" | "analytics"
  >("threats");
  const [threatStats, setThreatStats] = useState({
    totalThreats: 0,
    highPriority: 0,
    recentActivity: 0,
  });

  useEffect(() => {
    if (!isVisible) return;

    // Subscribe to threat updates
    const unsubscribeThreats = aiThreatDetection.subscribe((newThreats) => {
      setThreats(newThreats);

      // Update stats
      const highPriority = newThreats.filter(
        (t) => t.level.level === "high" || t.level.level === "critical",
      ).length;
      const recentActivity = newThreats.filter(
        (t) => Date.now() - t.timestamp < 300000, // Last 5 minutes
      ).length;

      setThreatStats({
        totalThreats: newThreats.length,
        highPriority,
        recentActivity,
      });
    });

    // Subscribe to companion messages
    const unsubscribeMessages = aiCompanion.subscribe((newMessages) => {
      setMessages(newMessages);
    });

    // Start monitoring if not already active
    if (!aiThreatDetection.isMonitoring()) {
      aiThreatDetection.startMonitoring();
    }

    if (!aiCompanion.isActiveCompanion()) {
      aiCompanion.activate();
    }

    // Update current context
    if (currentLocation) {
      aiThreatDetection.addLocationData(currentLocation);
      aiCompanion.updateContext({
        currentLocation: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        safetyScore,
        isMoving: true, // Simplified for now
      });
    }

    return () => {
      unsubscribeThreats();
      unsubscribeMessages();
    };
  }, [isVisible, currentLocation, safetyScore]);

  if (!isVisible) return null;

  const getThreatIcon = (type: string) => {
    switch (type) {
      case "environmental":
        return <Eye className="h-4 w-4" />;
      case "behavioral":
        return <Activity className="h-4 w-4" />;
      case "social":
        return <Target className="h-4 w-4" />;
      case "infrastructure":
        return <MapPin className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 border-red-300 text-red-800";
      case "high":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "guidance":
        return <Brain className="h-4 w-4 text-blue-500" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "comfort":
        return <Shield className="h-4 w-4 text-green-500" />;
      case "navigation":
        return <MapPin className="h-4 w-4 text-purple-500" />;
      case "emergency":
        return <Zap className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const dismissThreat = (threatId: string) => {
    aiThreatDetection.dismissThreat(threatId);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const analytics = aiThreatDetection.getAnalytics();

  return (
    <div className="fixed top-4 right-4 z-[1200] w-96 max-h-[80vh] bg-white border border-gray-200 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-black" />
          <h3 className="font-semibold text-black">AI Insights</h3>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-gray-500 hover:text-black"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-black">Analysis</div>
            <div className="text-xs text-gray-600">AI Status</div>
          </div>
          <div>
            <div className="text-lg font-bold text-black">
              {threatStats.totalThreats}
            </div>
            <div className="text-xs text-gray-600">Active Threats</div>
          </div>
          <div>
            <div className="text-lg font-bold text-black">
              {messages.length}
            </div>
            <div className="text-xs text-gray-600">AI Messages</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("threats")}
          className={cn(
            "flex-1 py-2 px-3 text-sm font-medium transition-colors",
            activeTab === "threats"
              ? "bg-black text-white"
              : "bg-white text-gray-600 hover:text-black",
          )}
        >
          Threats{" "}
          {threatStats.totalThreats > 0 && (
            <Badge className="ml-1 bg-red-500 text-white text-xs">
              {threatStats.totalThreats}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("companion")}
          className={cn(
            "flex-1 py-2 px-3 text-sm font-medium transition-colors",
            activeTab === "companion"
              ? "bg-black text-white"
              : "bg-white text-gray-600 hover:text-black",
          )}
        >
          AI Companion
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={cn(
            "flex-1 py-2 px-3 text-sm font-medium transition-colors",
            activeTab === "analytics"
              ? "bg-black text-white"
              : "bg-white text-gray-600 hover:text-black",
          )}
        >
          Analytics
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="h-96 p-4">
        {activeTab === "threats" && (
          <div className="space-y-3">
            {threats.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  All clear! No active threats detected.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  AI monitoring is active and scanning for potential risks.
                </p>
              </div>
            ) : (
              threats.map((threat) => (
                <Card
                  key={threat.id}
                  className={cn(
                    "border transition-all duration-200 hover:shadow-md",
                    getThreatColor(threat.level.level),
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getThreatIcon(threat.type)}
                        <span className="font-medium text-sm">
                          {threat.threat}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className="text-xs border-current"
                        >
                          {threat.level.level.toUpperCase()}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissThreat(threat.id)}
                          className="h-6 w-6 p-0 text-current hover:bg-current/20"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs mb-2">{threat.recommendation}</p>

                    <div className="flex items-center justify-between text-xs text-current/70">
                      <span className="capitalize">{threat.type}</span>
                      <span>{formatTime(threat.timestamp)}</span>
                    </div>

                    {threat.aiAnalysis && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer hover:underline">
                          AI Analysis
                        </summary>
                        <p className="text-xs mt-1 text-current/80">
                          {threat.aiAnalysis}
                        </p>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "companion" && (
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Your AI companion is ready to help!
                </p>
                <Button
                  size="sm"
                  className="mt-2 bg-black text-white hover:bg-gray-800"
                  onClick={() => {
                    aiCompanion.askQuestion("How are you doing?");
                  }}
                >
                  Start Conversation
                </Button>
              </div>
            ) : (
              messages.map((message) => (
                <Card
                  key={message.id}
                  className="border-gray-200 bg-white hover:shadow-sm transition-shadow"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      {getMessageIcon(message.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <Badge
                            variant="outline"
                            className="text-xs border-gray-300"
                          >
                            {message.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {message.message}
                        </p>
                        {message.actionable && message.action && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 text-xs border-gray-300 text-black hover:bg-gray-100"
                            onClick={message.action.callback}
                          >
                            {message.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Quick Actions */}
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-3">
                <p className="text-xs text-gray-600 mb-2">Quick Questions:</p>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-gray-300 text-gray-700 hover:bg-white"
                    onClick={() => aiCompanion.askQuestion("Am I safe here?")}
                  >
                    Am I safe?
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-gray-300 text-gray-700 hover:bg-white"
                    onClick={() => aiCompanion.askQuestion("Best route home?")}
                  >
                    Best route?
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-gray-300 text-gray-700 hover:bg-white"
                    onClick={() => aiCompanion.askQuestion("Safety tips?")}
                  >
                    Safety tips
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-gray-300 text-gray-700 hover:bg-white"
                    onClick={() => aiCompanion.askQuestion("Emergency help")}
                  >
                    Emergency
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-4">
            <Card className="border-gray-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-black">
                  Monitoring Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Threat Detection:</span>
                  <span
                    className={`font-medium ${analytics.isActive ? "text-green-600" : "text-red-600"}`}
                  >
                    {analytics.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Data Points:</span>
                  <span className="font-medium text-black">
                    {analytics.movementDataPoints}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Analysis:</span>
                  <span className="font-medium text-black">
                    {analytics.lastAnalysis
                      ? formatTime(analytics.lastAnalysis)
                      : "Never"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-black">
                  Threat Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(analytics.threatsByType).length === 0 ? (
                  <p className="text-sm text-gray-600">No threats detected</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(analytics.threatsByType).map(
                      ([type, count]) => (
                        <div
                          key={type}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600 capitalize">
                            {type}:
                          </span>
                          <span className="font-medium text-black">
                            {count}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-black">
                  AI Companion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-medium ${aiCompanion.isActiveCompanion() ? "text-green-600" : "text-red-600"}`}
                  >
                    {aiCompanion.isActiveCompanion() ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Messages:</span>
                  <span className="font-medium text-black">
                    {messages.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="space-y-2">
              <Button
                size="sm"
                className="w-full bg-black text-white hover:bg-gray-800"
                onClick={() => {
                  if (analytics.isActive) {
                    aiThreatDetection.stopMonitoring();
                  } else {
                    aiThreatDetection.startMonitoring();
                  }
                }}
              >
                {analytics.isActive ? "Stop" : "Start"} Threat Detection
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-gray-300 text-black hover:bg-gray-100"
                onClick={() => {
                  if (aiCompanion.isActiveCompanion()) {
                    aiCompanion.deactivate();
                  } else {
                    aiCompanion.activate();
                  }
                }}
              >
                {aiCompanion.isActiveCompanion() ? "Deactivate" : "Activate"} AI
                Companion
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default AIInsightsPanel;
