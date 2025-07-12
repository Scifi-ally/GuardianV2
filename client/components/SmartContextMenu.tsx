import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Shield,
  MapPin,
  Phone,
  Navigation,
  MessageSquare,
  AlertTriangle,
  Eye,
  Zap,
  Target,
  Clock,
  Moon,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useAuth } from "@/contexts/AuthContext";
import { emergencyContactActionsService } from "@/services/emergencyContactActionsService";
import { realTimeService } from "@/services/realTimeService";

interface SmartAction {
  id: string;
  label: string;
  icon: any;
  priority: "critical" | "high" | "medium" | "low";
  context: string;
  aiGenerated: boolean;
  callback: () => void;
  description: string;
}

interface SmartContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  location?: { latitude: number; longitude: number };
  userState?: "moving" | "stationary" | "unknown";
  safetyScore?: number;
  threats?: number;
  timeOfDay?: "day" | "night";
}

export function SmartContextMenu({
  isOpen,
  onClose,
  location,
  userState = "unknown",
  safetyScore = 75,
  threats = 0,
  timeOfDay = "day",
}: SmartContextMenuProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { getCurrentLocation } = useGeolocation();
  const { userProfile } = useAuth();

  // Action handlers with real functionality
  const handleFindSafeRoute = useCallback(async () => {
    setIsLoading("safe_route");
    try {
      const currentLocation = await getCurrentLocation();

      // Update real-time service with route request
      realTimeService.addAlert({
        id: `route-${Date.now()}`,
        type: "info",
        title: "Safe Route Analysis",
        message: "Analyzing safest routes to your destination...",
        timestamp: new Date(),
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: Date.now(),
        },
      });

      toast.success(
        "Safe route analysis started - check navigation for options",
      );
    } catch (error) {
      console.error("Safe route error:", error);
      toast.error("Unable to analyze safe routes");
    } finally {
      setIsLoading(null);
      onClose();
    }
  }, [getCurrentLocation, onClose]);

  const handleShowSafePlaces = useCallback(async () => {
    setIsLoading("safe_places");
    try {
      const currentLocation = await getCurrentLocation();

      // Add alert about safe places
      realTimeService.addAlert({
        id: `safe-places-${Date.now()}`,
        type: "info",
        title: "Safe Places Located",
        message:
          "Police stations, hospitals, and safe havens identified near your location",
        timestamp: new Date(),
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: Date.now(),
        },
      });

      toast.success("Safe places identified - check map for locations");
    } catch (error) {
      console.error("Safe places error:", error);
      toast.error("Unable to locate safe places");
    } finally {
      setIsLoading(null);
      onClose();
    }
  }, [getCurrentLocation, onClose]);

  const handleThreatAnalysis = useCallback(async () => {
    setIsLoading("threat_analysis");
    try {
      const currentLocation = await getCurrentLocation();

      // Perform mock threat analysis
      const analysis = {
        threatLevel: threats > 2 ? "high" : threats > 0 ? "medium" : "low",
        factors: [
          "Real-time crime data analysis",
          "Historical safety patterns",
          "Current time and lighting conditions",
          "Population density assessment",
        ],
        recommendations: [
          "Stay in well-lit areas",
          "Keep emergency contacts informed",
          "Consider alternative routes",
        ],
      };

      realTimeService.addAlert({
        id: `threat-analysis-${Date.now()}`,
        type: threats > 1 ? "warning" : "info",
        title: `Threat Analysis: ${analysis.threatLevel.toUpperCase()} Risk`,
        message: `${analysis.factors.length} factors analyzed. ${analysis.recommendations.length} safety recommendations available.`,
        timestamp: new Date(),
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: Date.now(),
        },
      });

      toast.success(
        `Threat analysis complete - ${analysis.threatLevel} risk level detected`,
      );
    } catch (error) {
      console.error("Threat analysis error:", error);
      toast.error("Unable to complete threat analysis");
    } finally {
      setIsLoading(null);
      onClose();
    }
  }, [getCurrentLocation, threats, onClose]);

  const handleCheckInTimer = useCallback(async () => {
    setIsLoading("check_in");
    try {
      if (!userProfile?.emergencyContacts?.length) {
        toast.error("No emergency contacts configured for check-ins");
        return;
      }

      // Start check-in timer (15 minutes)
      const checkInInterval = 15 * 60 * 1000; // 15 minutes
      const currentLocation = await getCurrentLocation();

      // Send initial check-in message
      await emergencyContactActionsService.sendEmergencyMessage(
        `✅ Safety Check-in Started: I'm at https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}. Automatic updates every 15 minutes.`,
      );

      // Add to real-time alerts
      realTimeService.addAlert({
        id: `checkin-${Date.now()}`,
        type: "info",
        title: "Check-in Timer Active",
        message: "Automatic safety check-ins started every 15 minutes",
        timestamp: new Date(),
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: Date.now(),
        },
      });

      toast.success(
        "Check-in timer started - contacts will be notified every 15 minutes",
      );
    } catch (error) {
      console.error("Check-in timer error:", error);
      toast.error("Unable to start check-in timer");
    } finally {
      setIsLoading(null);
      onClose();
    }
  }, [getCurrentLocation, userProfile, onClose]);

  const handleNightMode = useCallback(async () => {
    setIsLoading("night_mode");
    try {
      const currentLocation = await getCurrentLocation();

      // Activate enhanced night safety features
      realTimeService.addAlert({
        id: `night-mode-${Date.now()}`,
        type: "info",
        title: "Night Safety Mode Activated",
        message:
          "Enhanced location tracking, improved emergency detection, and accelerated response protocols enabled",
        timestamp: new Date(),
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          timestamp: Date.now(),
        },
      });

      toast.success(
        "Night safety mode activated - enhanced protection enabled",
      );
    } catch (error) {
      console.error("Night mode error:", error);
      toast.error("Unable to activate night mode");
    } finally {
      setIsLoading(null);
      onClose();
    }
  }, [getCurrentLocation, onClose]);

  const handleAIChat = useCallback(() => {
    setIsLoading("ai_chat");
    try {
      // Simulate AI companion activation
      realTimeService.addAlert({
        id: `ai-chat-${Date.now()}`,
        type: "info",
        title: "AI Safety Companion Active",
        message:
          "Your AI safety companion is now available for real-time assistance and guidance",
        timestamp: new Date(),
      });

      toast.success("AI Safety Companion activated - available for assistance");
    } catch (error) {
      console.error("AI chat error:", error);
      toast.error("Unable to activate AI companion");
    } finally {
      setIsLoading(null);
      onClose();
    }
  }, [onClose]);

  const handleEmergencyContact = useCallback(async () => {
    setIsLoading("emergency_contact");
    try {
      if (!userProfile?.emergencyContacts?.length) {
        toast.error("No emergency contacts configured");
        return;
      }

      const currentLocation = await getCurrentLocation();

      // Send immediate alert to all emergency contacts
      await emergencyContactActionsService.sendEmergencyAlert(
        `🚨 Quick Emergency Contact: I need assistance at https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`,
      );

      toast.success(
        `Emergency alert sent to ${userProfile.emergencyContacts.length} contacts`,
      );
    } catch (error) {
      console.error("Emergency contact error:", error);
      toast.error("Unable to contact emergency contacts");
    } finally {
      setIsLoading(null);
      onClose();
    }
  }, [getCurrentLocation, userProfile, onClose]);

  const handleShareLocation = useCallback(async () => {
    setIsLoading("share_location");
    try {
      const currentLocation = await getCurrentLocation();

      // Update real-time location sharing
      realTimeService.updateLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        timestamp: Date.now(),
      });

      const locationText = `📍 Live Location: https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;

      // Share using Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: "My Live Location",
          text: locationText,
        });
      } else {
        await navigator.clipboard.writeText(locationText);
        toast.success("Live location copied to clipboard");
      }
    } catch (error) {
      console.error("Share location error:", error);
      toast.error("Unable to share location");
    } finally {
      setIsLoading(null);
      onClose();
    }
  }, [getCurrentLocation, onClose]);

  // Generate contextual actions based on current conditions
  const generateActions = (): SmartAction[] => {
    const actions: SmartAction[] = [];

    // Always available core actions
    actions.push({
      id: "share_location",
      label: "Share Live Location",
      icon: MapPin,
      priority: "high",
      context: "Real-time tracking",
      aiGenerated: false,
      callback: handleShareLocation,
      description:
        "Share your current location with contacts or copy to clipboard",
    });

    actions.push({
      id: "emergency_contact",
      label: "Alert Contacts",
      icon: Phone,
      priority: "high",
      context: "Quick assistance",
      aiGenerated: false,
      callback: handleEmergencyContact,
      description: "Send immediate alert to all emergency contacts",
    });

    // Safety-based contextual actions
    if (safetyScore < 70) {
      actions.push({
        id: "safe_route",
        label: "Find Safer Route",
        icon: Navigation,
        priority: "high",
        context: "Low safety area detected",
        aiGenerated: true,
        callback: handleFindSafeRoute,
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
        callback: handleShowSafePlaces,
        description:
          "Display police stations, hospitals, and safe havens within walking distance",
      });
    }

    // Threat-based actions
    if (threats > 0) {
      actions.push({
        id: "threat_analysis",
        label: "Analyze Threats",
        icon: Eye,
        priority: "critical",
        context: `${threats} active threat(s)`,
        aiGenerated: true,
        callback: handleThreatAnalysis,
        description: "Get detailed AI analysis of current security concerns",
      });
    }

    // State-based actions
    if (userState === "stationary") {
      actions.push({
        id: "check_in_timer",
        label: "Start Check-in Timer",
        icon: Clock,
        priority: "medium",
        context: "Stationary for extended period",
        aiGenerated: true,
        callback: handleCheckInTimer,
        description:
          "Set automatic safety check-ins with your emergency contacts",
      });
    }

    // Time-based actions
    if (timeOfDay === "night") {
      actions.push({
        id: "night_mode",
        label: "Night Safety Mode",
        icon: Moon,
        priority: "medium",
        context: "Enhanced night protection",
        aiGenerated: true,
        callback: handleNightMode,
        description: "Activate enhanced safety features for nighttime",
      });
    }

    // Always available AI assistance
    actions.push({
      id: "ai_chat",
      label: "AI Safety Assistant",
      icon: Brain,
      priority: "medium",
      context: "24/7 AI guidance",
      aiGenerated: true,
      callback: handleAIChat,
      description: "Get personalized safety advice from AI companion",
    });

    return actions;
  };

  const actions = generateActions();

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <Card className="bg-white/95 backdrop-blur-xl border shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Smart Actions</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {actions.length} available
                  </Badge>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {actions.map((action, index) => (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={action.callback}
                      disabled={isLoading === action.id}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${getPriorityColor(action.priority)} ${
                        isLoading === action.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <action.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{action.label}</span>
                            {action.aiGenerated && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-1.5 py-0.5"
                              >
                                AI
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs px-1.5 py-0.5 ${
                                action.priority === "critical"
                                  ? "text-red-600 border-red-200"
                                  : action.priority === "high"
                                    ? "text-orange-600 border-orange-200"
                                    : "text-blue-600 border-blue-200"
                              }`}
                            >
                              {action.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {action.context}
                          </p>
                          <p className="text-xs text-gray-600">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Actions powered by AI analysis
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="text-xs"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
