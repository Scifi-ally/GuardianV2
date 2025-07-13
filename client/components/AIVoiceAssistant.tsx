import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Brain,
  Zap,
  Shield,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { voiceCommandService } from "@/services/voiceCommandService";
import { geminiAIService } from "@/services/geminiAIService";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { notifications } from "@/services/enhancedNotificationService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface VoiceAssistantState {
  isListening: boolean;
  isProcessing: boolean;
  isResponding: boolean;
  lastCommand: string;
  confidence: number;
}

export function AIVoiceAssistant() {
  const { currentUser } = useAuth();
  const [assistantState, setAssistantState] = useState<VoiceAssistantState>({
    isListening: false,
    isProcessing: false,
    isResponding: false,
    lastCommand: "",
    confidence: 0,
  });
  const [isEnabled, setIsEnabled] = useState(false);
  const [voiceResponsesEnabled, setVoiceResponsesEnabled] = useState(true);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<
    "unknown" | "granted" | "denied" | "prompt"
  >("unknown");

  useEffect(() => {
    checkMicrophonePermission();
    updateAssistantState();

    const interval = setInterval(updateAssistantState, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        setPermissionStatus(permission.state);

        permission.addEventListener("change", () => {
          setPermissionStatus(permission.state);
        });
      }
    } catch (error) {
      console.warn("Unable to check microphone permission:", error);
    }
  };

  const updateAssistantState = () => {
    setAssistantState({
      isListening: voiceCommandService.isActive,
      isProcessing: false, // Would be set by voice service
      isResponding: false, // Would be set by voice service
      lastCommand: "", // Would come from voice service
      confidence: 0, // Would come from voice service
    });
    setIsEnabled(voiceCommandService.currentSettings.enabled);
  };

  const handleToggleVoiceCommands = async () => {
    if (!voiceCommandService.isSupported) {
      notifications.error({
        title: "Voice Commands Not Supported",
        description: "Your browser doesn't support voice recognition",
      });
      return;
    }

    try {
      if (isEnabled) {
        voiceCommandService.disableVoiceCommands();
        setIsEnabled(false);
      } else {
        await voiceCommandService.enableVoiceCommands();
        setIsEnabled(true);

        // Provide initial guidance
        if (voiceResponsesEnabled) {
          voiceCommandService.speak(
            `Voice assistant activated. Say "guardian" followed by your command. Available commands include: emergency, help me, where am I, share location, and safety check.`,
          );
        }

        notifications.success({
          title: "Voice Assistant Activated",
          description: 'Say "guardian" followed by your command',
          vibrate: true,
        });
      }
    } catch (error) {
      notifications.error({
        title: "Voice Assistant Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to enable voice commands",
      });
    }
  };

  const handleToggleVoiceResponses = () => {
    const newSetting = !voiceResponsesEnabled;
    setVoiceResponsesEnabled(newSetting);

    voiceCommandService.updateSettings({
      voiceResponses: newSetting,
    });

    notifications.success({
      title: newSetting
        ? "Voice Responses Enabled"
        : "Voice Responses Disabled",
      description: newSetting
        ? "The assistant will now speak responses"
        : "The assistant will only show text responses",
    });
  };

  const handleTestCommand = async () => {
    if (!isEnabled) {
      notifications.warning({
        title: "Voice Assistant Disabled",
        description: "Please enable voice commands first",
      });
      return;
    }

    try {
      const location = await enhancedLocationService.getCurrentLocation();
      const address =
        location.address ||
        `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

      if (voiceResponsesEnabled) {
        voiceCommandService.speak(`Your current location is ${address}`);
      }

      setRecentCommands((prev) => [
        `Test: Current location - ${address}`,
        ...prev.slice(0, 4),
      ]);

      notifications.success({
        title: "Voice Test Successful",
        description: address,
      });
    } catch (error) {
      notifications.error({
        title: "Voice Test Failed",
        description: "Unable to get location for test",
      });
    }
  };

  const handleEmergencyTest = () => {
    if (!isEnabled) {
      notifications.warning({
        title: "Voice Assistant Disabled",
        description: "Please enable voice commands first",
      });
      return;
    }

    if (voiceResponsesEnabled) {
      voiceCommandService.speak(
        "Emergency test activated. In a real emergency, say 'guardian emergency' or 'guardian help me' to trigger emergency protocols.",
        "high",
      );
    }

    setRecentCommands((prev) => [
      "Emergency test - protocols explained",
      ...prev.slice(0, 4),
    ]);

    notifications.warning({
      title: "Emergency Test",
      description: "Voice emergency commands explained",
      vibrate: true,
    });
  };

  const getStatusColor = () => {
    if (assistantState.isProcessing) return "text-yellow-500";
    if (assistantState.isListening) return "text-green-500";
    if (isEnabled) return "text-blue-500";
    return "text-gray-500";
  };

  const getStatusText = () => {
    if (assistantState.isProcessing) return "Processing...";
    if (assistantState.isListening) return "Listening...";
    if (isEnabled) return "Ready";
    return "Disabled";
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">AI Voice Assistant</h3>
          <p className="text-muted-foreground">
            Sign in to access voice-controlled safety features
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Brain className="h-6 w-6" />
                <motion.div
                  className={cn(
                    "absolute -top-1 -right-1 w-3 h-3 rounded-full",
                    assistantState.isListening
                      ? "bg-green-500"
                      : isEnabled
                        ? "bg-blue-500"
                        : "bg-gray-400",
                  )}
                  animate={
                    assistantState.isListening
                      ? { scale: [1, 1.2, 1] }
                      : { scale: 1 }
                  }
                  transition={{
                    duration: 1,
                    repeat: assistantState.isListening ? Infinity : undefined,
                    ease: "linear",
                  }}
                />
              </div>
              <div>
                <h3 className="font-semibold">AI Voice Assistant</h3>
                <p className={cn("text-sm", getStatusColor())}>
                  {getStatusText()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {voiceCommandService.isSupported ? (
                <Badge variant="outline" className="text-green-600">
                  Supported
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600">
                  Not Supported
                </Badge>
              )}
            </div>
          </div>

          {/* Permission Status */}
          {permissionStatus === "denied" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <MicOff className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Microphone Access Denied
                </span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Please allow microphone access in your browser settings to use
                voice commands.
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleToggleVoiceCommands}
              disabled={
                !voiceCommandService.isSupported ||
                permissionStatus === "denied"
              }
              className={cn(
                "flex items-center gap-2",
                isEnabled && "bg-green-600 hover:bg-green-700",
              )}
            >
              {assistantState.isListening ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
              {isEnabled ? "Disable" : "Enable"}
            </Button>

            <Button
              variant="outline"
              onClick={handleToggleVoiceResponses}
              disabled={!isEnabled}
              className="flex items-center gap-2"
            >
              {voiceResponsesEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              Audio
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick Tests</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestCommand}
                disabled={!isEnabled}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-3 w-3" />
                Test Location
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmergencyTest}
                disabled={!isEnabled}
                className="flex items-center gap-2"
              >
                <Shield className="h-3 w-3" />
                Emergency Info
              </Button>
            </div>
          </div>

          {/* Available Commands */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Voice Commands</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium">"guardian emergency"</span> -
                Trigger SOS alert
              </p>
              <p>
                <span className="font-medium">"guardian where am i"</span> - Get
                location
              </p>
              <p>
                <span className="font-medium">"guardian share location"</span> -
                Share with contacts
              </p>
              <p>
                <span className="font-medium">"guardian safety check"</span> -
                Check in
              </p>
              <p>
                <span className="font-medium">"guardian help"</span> - List all
                commands
              </p>
            </div>
          </div>

          {/* Recent Commands */}
          {recentCommands.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Activity</h4>
              <div className="space-y-1">
                <AnimatePresence>
                  {recentCommands.map((command, index) => (
                    <motion.div
                      key={`${command}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="text-xs bg-muted rounded p-2"
                    >
                      {command}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* AI Integration Status */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span>AI Analysis</span>
              <Badge
                variant={geminiAIService.isAvailable() ? "default" : "outline"}
              >
                {geminiAIService.isAvailable() ? "Active" : "Offline"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AIVoiceAssistant;
