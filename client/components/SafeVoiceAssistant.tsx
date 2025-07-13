/**
 * Safe Voice Assistant
 * Simple voice commands without external API dependencies
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notifications } from "@/services/enhancedNotificationService";
import { cn } from "@/lib/utils";

interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
}

export function SafeVoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [lastCommand, setLastCommand] = useState<string>("");

  // Simple voice commands without external AI
  const voiceCommands: VoiceCommand[] = [
    {
      command: "emergency",
      action: () => {
        notifications.error({
          title: "Emergency Command Detected",
          description: "Voice emergency trigger activated",
          vibrate: true,
        });
      },
      description: "Trigger emergency alert",
    },
    {
      command: "help",
      action: () => {
        notifications.info({
          title: "Voice Commands Available",
          description: "Say 'emergency' or 'help' for assistance",
        });
      },
      description: "Show available commands",
    },
  ];

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionStatus("denied");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionStatus("granted");
      stream.getTracks().forEach((track) => track.stop()); // Stop immediately after permission check
    } catch (error) {
      setPermissionStatus("denied");
    }
  };

  const startListening = async () => {
    if (permissionStatus !== "granted") {
      await checkMicrophonePermission();
      return;
    }

    try {
      // Simple browser speech recognition if available
      if (
        "webkitSpeechRecognition" in window ||
        "SpeechRecognition" in window
      ) {
        const SpeechRecognition =
          (window as any).webkitSpeechRecognition ||
          (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const command = event.results[0][0].transcript.toLowerCase();
          setLastCommand(command);
          processCommand(command);
        };

        recognition.onerror = () => {
          setIsListening(false);
          notifications.error({
            title: "Voice Recognition Error",
            description: "Could not process voice command",
          });
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        notifications.info({
          title: "Voice Recognition Unavailable",
          description: "Your browser doesn't support voice commands",
        });
      }
    } catch (error) {
      setIsListening(false);
      notifications.error({
        title: "Microphone Access Error",
        description: "Could not access microphone",
      });
    }
  };

  const stopListening = () => {
    setIsListening(false);
    // Speech recognition will stop automatically
  };

  const processCommand = (command: string) => {
    const matchedCommand = voiceCommands.find((cmd) =>
      command.includes(cmd.command),
    );

    if (matchedCommand) {
      matchedCommand.action();
      notifications.success({
        title: "Voice Command Recognized",
        description: `Executed: ${matchedCommand.description}`,
      });
    } else {
      notifications.info({
        title: "Command Not Recognized",
        description: "Try saying 'emergency' or 'help'",
      });
    }
  };

  const toggleAssistant = () => {
    if (!isEnabled) {
      if (permissionStatus === "denied") {
        notifications.error({
          title: "Microphone Permission Required",
          description: "Please allow microphone access for voice commands",
        });
        return;
      }
      setIsEnabled(true);
      notifications.success({
        title: "Voice Assistant Enabled",
        description: "Say 'emergency' or 'help' to get started",
      });
    } else {
      setIsEnabled(false);
      setIsListening(false);
      notifications.info({
        title: "Voice Assistant Disabled",
        description: "Voice commands are now turned off",
      });
    }
  };

  const getStatusColor = () => {
    if (!isEnabled) return "text-gray-400";
    if (isListening) return "text-blue-500";
    return "text-green-500";
  };

  const getStatusText = () => {
    if (!isEnabled) return "Disabled";
    if (isListening) return "Listening...";
    return "Ready";
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">Voice Assistant</span>
          </div>
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Toggle Button */}
          <Button
            onClick={toggleAssistant}
            variant={isEnabled ? "default" : "outline"}
            className="w-full"
          >
            {isEnabled ? "Disable Voice Commands" : "Enable Voice Commands"}
          </Button>

          {/* Microphone Button */}
          {isEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center space-y-3"
            >
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={permissionStatus !== "granted"}
                className={cn(
                  "h-16 w-16 rounded-full transition-all duration-200",
                  isListening
                    ? "bg-red-500 hover:bg-red-600 scale-110"
                    : "bg-blue-500 hover:bg-blue-600",
                )}
              >
                <div className={isListening ? "animate-pulse" : ""}>
                  {isListening ? (
                    <MicOff className="h-6 w-6 text-white" />
                  ) : (
                    <Mic className="h-6 w-6 text-white" />
                  )}
                </div>
              </Button>

              <p className="text-sm text-center text-gray-600">
                {isListening
                  ? "Listening for commands..."
                  : "Tap to start voice commands"}
              </p>

              {lastCommand && (
                <div className="text-xs text-center bg-gray-100 p-2 rounded">
                  Last: "{lastCommand}"
                </div>
              )}
            </motion.div>
          )}

          {/* Available Commands */}
          {isEnabled && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Available Commands:</h4>
              <div className="space-y-1">
                {voiceCommands.map((cmd, index) => (
                  <div
                    key={index}
                    className="text-xs bg-gray-50 p-2 rounded flex justify-between"
                  >
                    <span className="font-medium">"{cmd.command}"</span>
                    <span className="text-gray-600">{cmd.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {permissionStatus === "denied" && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              Microphone access is required for voice commands. Please check
              your browser settings.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
