import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Shield,
  MapPin,
  Phone,
  Navigation,
  Camera,
  MessageSquare,
  AlertTriangle,
  Eye,
  Zap,
  Target,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartAction {
  id: string;
  label: string;
  icon: typeof Brain;
  priority: "low" | "medium" | "high" | "critical";
  context: string;
  aiGenerated: boolean;
  callback: () => void;
  description?: string;
}

interface SmartContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  context: {
    location?: { lat: number; lng: number };
    safetyScore: number;
    timeOfDay: string;
    userState: "moving" | "stationary" | "navigating" | "emergency";
    threats: number;
  };
}

export function SmartContextMenu({
  isVisible,
  position,
  onClose,
  context,
}: SmartContextMenuProps) {
  const [smartActions, setSmartActions] = useState<SmartAction[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) {
      generateSmartActions();
    }
  }, [isVisible, context]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible, onClose]);

  const generateSmartActions = () => {
    const actions: SmartAction[] = [];
    const { safetyScore, userState, threats, timeOfDay } = context;

    // AI-generated contextual actions based on current situation
    if (safetyScore < 60) {
      actions.push({
        id: "find_safe_route",
        label: "Find Safer Route",
        icon: Navigation,
        priority: "high",
        context: "Low safety area detected",
        aiGenerated: true,
        callback: () => handleFindSafeRoute(),
        description:
          "AI will analyze and suggest the safest route to your destination",
      });

      actions.push({
        id: "nearest_safe_places",
        label: "Show Safe Places",
        icon: Shield,
        priority: "high",
        context: "Emergency services nearby",
        aiGenerated: true,
        callback: () => handleShowSafePlaces(),
        description:
          "Display police stations, hospitals, and safe havens within walking distance",
      });
    }

    if (threats > 0) {
      actions.push({
        id: "threat_analysis",
        label: "Analyze Threats",
        icon: Eye,
        priority: "critical",
        context: `${threats} active threat(s)`,
        aiGenerated: true,
        callback: () => handleThreatAnalysis(),
        description: "Get detailed AI analysis of current security concerns",
      });
    }

    if (userState === "stationary") {
      actions.push({
        id: "check_in_timer",
        label: "Start Check-in Timer",
        icon: Clock,
        priority: "medium",
        context: "Stationary for extended period",
        aiGenerated: true,
        callback: () => handleCheckInTimer(),
        description:
          "Set automatic safety check-ins with your emergency contacts",
      });
    }

    // Time-based suggestions
    const hour = new Date().getHours();
    if (hour >= 20 || hour <= 6) {
      actions.push({
        id: "night_mode",
        label: "Activate Night Safety",
        icon: Zap,
        priority: "medium",
        context: "Late hours detected",
        aiGenerated: true,
        callback: () => handleNightMode(),
        description:
          "Enhanced monitoring and emergency preparedness for night travel",
      });
    }

    // Universal actions always available
    actions.push({
      id: "ai_companion",
      label: "Talk to AI Guardian",
      icon: Brain,
      priority: "low",
      context: "Always available",
      aiGenerated: false,
      callback: () => handleAIChat(),
      description: "Get personalized safety guidance from your AI companion",
    });

    actions.push({
      id: "emergency_contacts",
      label: "Quick Contact",
      icon: Phone,
      priority: "medium",
      context: "Emergency ready",
      aiGenerated: false,
      callback: () => handleEmergencyContact(),
      description: "Instantly call or message your emergency contacts",
    });

    actions.push({
      id: "evidence_capture",
      label: "Capture Evidence",
      icon: Camera,
      priority: "medium",
      context: "Documentation ready",
      aiGenerated: false,
      callback: () => handleEvidenceCapture(),
      description:
        "Quickly take photos or videos that are automatically shared with contacts",
    });

    actions.push({
      id: "share_location",
      label: "Share Live Location",
      icon: MapPin,
      priority: "medium",
      context: "Real-time tracking",
      aiGenerated: false,
      callback: () => handleShareLocation(),
      description:
        "Send your current location and start live tracking for contacts",
    });

    // Sort by priority and relevance
    actions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    setSmartActions(actions);
  };

  // Action handlers
  const handleFindSafeRoute = () => {
    console.log("🗺️ Finding safer route with AI analysis...");
    // This would integrate with AI navigation service
    onClose();
  };

  const handleShowSafePlaces = () => {
    console.log("🏥 Showing nearest safe places...");
    // This would display safe locations on the map
    onClose();
  };

  const handleThreatAnalysis = () => {
    console.log("🔍 Opening detailed threat analysis...");
    // This would open the AI insights panel focused on threats
    onClose();
  };

  const handleCheckInTimer = () => {
    console.log("⏰ Starting automated check-in timer...");
    // This would set up periodic safety check-ins
    onClose();
  };

  const handleNightMode = () => {
    console.log("🌙 Activating night safety mode...");
    // This would enable enhanced night-time features
    onClose();
  };

  const handleAIChat = () => {
    console.log("🤖 Opening AI companion chat...");
    // This would open the AI companion interface
    onClose();
  };

  const handleEmergencyContact = () => {
    console.log("📞 Opening emergency contacts...");
    // This would show quick contact options
    onClose();
  };

  const handleEvidenceCapture = () => {
    console.log("📸 Starting evidence capture mode...");
    // This would activate camera/recording features
    onClose();
  };

  const handleShareLocation = () => {
    console.log("📍 Sharing live location...");
    // This would start location sharing
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-300 bg-red-50 hover:bg-red-100";
      case "high":
        return "border-orange-300 bg-orange-50 hover:bg-orange-100";
      case "medium":
        return "border-blue-300 bg-blue-50 hover:bg-blue-100";
      default:
        return "border-gray-300 bg-gray-50 hover:bg-gray-100";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[1300] w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200"
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.min(position.y, window.innerHeight - 400),
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-black" />
            <span className="font-medium text-black text-sm">
              Smart Actions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-xs bg-gray-200 text-gray-700">
              Safety: {context.safetyScore}
            </Badge>
            {context.threats > 0 && (
              <Badge className="text-xs bg-red-100 text-red-800">
                {context.threats} Alert{context.threats > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-2 space-y-1">
        {smartActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto p-3 border transition-all duration-200",
                getPriorityColor(action.priority),
              )}
              onClick={action.callback}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{action.label}</span>
                    {action.aiGenerated && (
                      <Badge className="text-xs bg-purple-100 text-purple-800">
                        AI
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        "text-xs",
                        getPriorityBadgeColor(action.priority),
                      )}
                    >
                      {action.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    {action.context}
                  </div>
                  {action.description && (
                    <div className="text-xs text-gray-500">
                      {action.description}
                    </div>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Actions are AI-generated based on your current situation and safety
          context
        </div>
      </div>
    </div>
  );
}

export default SmartContextMenu;
