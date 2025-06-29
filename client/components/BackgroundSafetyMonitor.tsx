import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Activity,
  Mic,
  Volume2,
  AlertTriangle,
  Eye,
  Zap,
  Clock,
  Heart,
  MicOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BackgroundSafetyMonitorProps {
  onEmergencyDetected: (type: string, data?: any) => void;
  className?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function BackgroundSafetyMonitor({
  onEmergencyDetected,
  className,
}: BackgroundSafetyMonitorProps) {
  const [isActive, setIsActive] = useState(true);
  const [motionSensitivity, setMotionSensitivity] = useState(3);
  const [voiceDetection, setVoiceDetection] = useState(true);
  const [ambientMonitoring, setAmbientMonitoring] = useState(true);
  const [lastActivity, setLastActivity] = useState(new Date());
  const [batteryOptimized, setBatteryOptimized] = useState(true);
  const [detectionCount, setDetectionCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [emergencyCountdown, setEmergencyCountdown] = useState(0);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const [lastError, setLastError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Emergency keywords that trigger SOS
  const emergencyKeywords = [
    "help",
    "emergency",
    "call 911",
    "call police",
    "i'm in danger",
    "help me",
    "emergency help",
    "need help",
    "救命", // Help in Chinese
    "ayuda", // Help in Spanish
    "hilfe", // Help in German
    "aide", // Help in French
  ];

  // Check microphone permission
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permission = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          setMicrophonePermission(permission.state);

          permission.onchange = () => {
            setMicrophonePermission(permission.state);
          };
        } else {
          // Fallback for browsers that don't support permissions API
          setMicrophonePermission("unknown");
        }
      } catch (error) {
        console.log("Could not check microphone permission:", error);
        setMicrophonePermission("unknown");
      }
    };

    checkMicrophonePermission();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Restart recognition if voice detection is enabled and not manually stopped
        if (voiceDetection && isActive && !lastError) {
          // Use a shorter timeout for seamless listening
          setTimeout(() => {
            try {
              if (voiceDetection && isActive && !lastError) {
                recognition.start();
              }
            } catch (error) {
              // Only log if it's not an "already started" error
              if (
                error instanceof Error &&
                !error.message.includes("already started")
              ) {
                console.log("Speech recognition restart failed:", error);
              }

              // Wait longer before next retry if there's an error
              setTimeout(() => {
                if (voiceDetection && isActive && !lastError) {
                  try {
                    recognition.start();
                  } catch (retryError) {
                    // Silently fail after retry
                  }
                }
              }, 3000);
            }
          }, 500); // Shorter timeout for better continuity
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = (finalTranscript + interimTranscript)
          .toLowerCase()
          .trim();
        setCurrentTranscript(fullTranscript);

        // Check for emergency keywords
        const containsEmergencyKeyword = emergencyKeywords.some((keyword) =>
          fullTranscript.includes(keyword.toLowerCase()),
        );

        if (containsEmergencyKeyword && !emergencyCountdown) {
          triggerVoiceEmergency(fullTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        const errorType = event.error;

        // Handle different types of errors
        switch (errorType) {
          case "no-speech":
            // This is completely normal - just means no speech was detected
            // Don't log anything, don't set listening to false, just ignore
            return; // Exit early without any logging or state changes

          case "audio-capture":
            console.error(
              "Audio capture failed - microphone may not be available",
            );
            setIsListening(false);
            setLastError("Microphone unavailable");
            setVoiceDetection(false);
            break;

          case "not-allowed":
            console.error("Microphone permission denied");
            setIsListening(false);
            setLastError("Microphone permission denied");
            setVoiceDetection(false);
            setMicrophonePermission("denied");
            break;

          case "network":
            console.error("Network error in speech recognition");
            setIsListening(false);
            setLastError("Network error");
            // Will retry automatically through onend handler
            break;

          case "service-not-allowed":
            console.error("Speech recognition service not allowed");
            setIsListening(false);
            setLastError("Speech service unavailable");
            setVoiceDetection(false);
            break;

          case "aborted":
            // Speech recognition was aborted, this is normal when stopping
            setIsListening(false);
            return; // Don't log this as an error

          default:
            console.error("Speech recognition error:", errorType);
            setIsListening(false);
            setLastError(`Recognition error: ${errorType}`);
            break;
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, []);

  // Start/stop voice recognition based on settings
  useEffect(() => {
    if (!voiceSupported || !recognitionRef.current) return;

    if (voiceDetection && isActive) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.log("Speech recognition already running");
      }
    } else {
      recognitionRef.current.stop();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [voiceDetection, isActive, voiceSupported]);

  // Update activity and detection count
  useEffect(() => {
    const interval = setInterval(() => {
      setLastActivity(new Date());
      // Simulate occasional detection activity
      if (Math.random() > 0.95) {
        setDetectionCount((prev) => prev + 1);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const triggerVoiceEmergency = (transcript: string) => {
    setEmergencyCountdown(5);

    countdownRef.current = setInterval(() => {
      setEmergencyCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          // Trigger emergency
          onEmergencyDetected("voice", {
            transcript,
            timestamp: new Date().toISOString(),
            source: "voice_detection",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelVoiceEmergency = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setEmergencyCountdown(0);
  };

  const handleToggleMonitoring = () => {
    setIsActive(!isActive);
    if (!isActive) {
      console.log("Background safety monitoring enabled");
      setLastError(null); // Clear any previous errors
    } else {
      console.log("Background safety monitoring disabled");
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        setEmergencyCountdown(0);
      }
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission("granted");
      setLastError(null);
      setVoiceDetection(true);
    } catch (error) {
      console.error("Microphone permission request failed:", error);
      setMicrophonePermission("denied");
      setLastError("Microphone permission denied");
    }
  };

  const handleTestEmergency = () => {
    onEmergencyDetected("test", {
      type: "manual_test",
      timestamp: new Date().toISOString(),
      source: "background_monitor",
    });
  };

  const sensitivityLabels = ["Low", "Normal", "High", "Maximum"];
  const currentSensitivity = sensitivityLabels[motionSensitivity - 1];

  // Emergency countdown overlay
  if (emergencyCountdown > 0) {
    return (
      <Card className="border-2 border-emergency bg-gradient-to-br from-emergency/10 to-emergency/20 shadow-xl">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="animate-pulse">
              <AlertTriangle className="h-16 w-16 text-emergency mx-auto" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emergency mb-2">
                🚨 VOICE EMERGENCY DETECTED
              </h2>
              <p className="text-lg font-medium">
                SOS Alert in {emergencyCountdown} seconds
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Detected: "{currentTranscript}"
              </p>
            </div>
            <Progress
              value={((5 - emergencyCountdown) / 5) * 100}
              className="w-full h-3"
            />
            <Button
              onClick={cancelVoiceEmergency}
              variant="outline"
              className="border-2 border-emergency text-emergency hover:bg-emergency hover:text-emergency-foreground font-bold px-8 py-3"
            >
              CANCEL ALERT
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Monitor Card */}
      <Card
        className={cn(
          "border-2 transition-all duration-300",
          isActive
            ? "border-safe/30 bg-gradient-to-br from-safe/5 to-safe/10 shadow-lg"
            : "border-muted/30 bg-muted/10",
        )}
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-3 rounded-full border-2 transition-all duration-300",
                  isActive
                    ? "bg-safe/20 border-safe/30"
                    : "bg-muted/20 border-muted/30",
                )}
              >
                <Shield
                  className={cn(
                    "h-6 w-6 transition-all duration-300",
                    isActive
                      ? "text-safe animate-pulse"
                      : "text-muted-foreground",
                  )}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold">Smart Safety Monitor</h3>
                <p className="text-sm text-muted-foreground">
                  {isActive ? "Actively protecting" : "Monitoring disabled"}
                </p>
              </div>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggleMonitoring}
            />
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/20 border">
              <Activity
                className={cn(
                  "h-6 w-6 mx-auto mb-2",
                  isActive
                    ? "text-primary animate-pulse"
                    : "text-muted-foreground",
                )}
              />
              <div className="text-sm font-medium">Motion</div>
              <div className="text-xs text-muted-foreground">
                {isActive ? "Monitoring" : "Disabled"}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/20 border">
              {isListening ? (
                <Mic
                  className={cn(
                    "h-6 w-6 mx-auto mb-2",
                    voiceDetection && isActive
                      ? "text-safe animate-pulse"
                      : "text-muted-foreground",
                  )}
                />
              ) : (
                <MicOff className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              )}
              <div className="text-sm font-medium">Voice</div>
              <div className="text-xs text-muted-foreground">
                {voiceDetection && isActive
                  ? isListening
                    ? "Listening"
                    : "Starting..."
                  : "Disabled"}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/20 border">
              <Eye
                className={cn(
                  "h-6 w-6 mx-auto mb-2",
                  ambientMonitoring && isActive
                    ? "text-protection animate-pulse"
                    : "text-muted-foreground",
                )}
              />
              <div className="text-sm font-medium">Ambient</div>
              <div className="text-xs text-muted-foreground">
                {ambientMonitoring && isActive ? "Sensing" : "Disabled"}
              </div>
            </div>
          </div>

          {/* Voice Recognition Status */}
          {voiceSupported ? (
            <div
              className={cn(
                "p-4 rounded-lg border",
                lastError
                  ? "bg-warning/10 border-warning/20"
                  : "bg-primary/10 border-primary/20",
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Volume2
                  className={cn(
                    "h-5 w-5",
                    lastError ? "text-warning" : "text-primary",
                  )}
                />
                <span className="font-medium">Voice Emergency Detection</span>
                <Badge
                  className={cn(
                    "text-xs",
                    isListening && voiceDetection && isActive && !lastError
                      ? "bg-safe text-safe-foreground"
                      : lastError
                        ? "bg-warning text-warning-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {lastError
                    ? "ERROR"
                    : isListening && voiceDetection && isActive
                      ? "ACTIVE"
                      : "INACTIVE"}
                </Badge>
              </div>
              {lastError ? (
                <div className="space-y-2">
                  <p className="text-sm text-warning font-medium">
                    {lastError}
                  </p>
                  {microphonePermission === "denied" && (
                    <Button
                      size="sm"
                      onClick={requestMicrophonePermission}
                      className="bg-warning hover:bg-warning/90 text-warning-foreground"
                    >
                      Request Microphone Permission
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    Listening for emergency keywords like "help", "emergency",
                    "call 911"
                  </p>
                  {currentTranscript && (
                    <div className="text-xs bg-muted/30 p-2 rounded border">
                      <span className="font-medium">Last heard: </span>"
                      {currentTranscript}"
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="font-medium">
                  Voice Recognition Unavailable
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your browser doesn't support voice recognition. Other safety
                features remain active.
              </p>
            </div>
          )}

          {/* Detection Settings */}
          {isActive && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Voice Detection</p>
                    <p className="text-sm text-muted-foreground">
                      Auto-trigger SOS after 5 seconds when emergency keywords
                      detected
                    </p>
                    {lastError && (
                      <p className="text-xs text-destructive mt-1">
                        {lastError}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={voiceDetection}
                    onCheckedChange={(checked) => {
                      if (checked && microphonePermission === "denied") {
                        requestMicrophonePermission();
                      } else {
                        setVoiceDetection(checked);
                        if (checked) {
                          setLastError(null);
                        }
                      }
                    }}
                    disabled={!voiceSupported}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ambient Monitoring</p>
                    <p className="text-sm text-muted-foreground">
                      Detect environmental changes and unusual patterns
                    </p>
                  </div>
                  <Switch
                    checked={ambientMonitoring}
                    onCheckedChange={setAmbientMonitoring}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Battery Optimization</p>
                    <p className="text-sm text-muted-foreground">
                      Balance protection with battery life
                    </p>
                  </div>
                  <Switch
                    checked={batteryOptimized}
                    onCheckedChange={setBatteryOptimized}
                  />
                </div>
              </div>

              {/* Motion Sensitivity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Motion Sensitivity</p>
                  <Badge variant="outline" className="text-xs">
                    {currentSensitivity}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((level) => (
                      <Button
                        key={level}
                        size="sm"
                        variant={
                          motionSensitivity === level ? "default" : "outline"
                        }
                        onClick={() => setMotionSensitivity(level)}
                        className="flex-1 text-xs"
                      >
                        {sensitivityLabels[level - 1]}
                      </Button>
                    ))}
                  </div>
                  <Progress value={motionSensitivity * 25} className="h-2" />
                </div>
              </div>
            </div>
          )}

          {/* Activity Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Last Check</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {lastActivity.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-safe/10 border border-safe/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-safe" />
                <span className="text-sm font-medium">Detections</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {detectionCount} today
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleTestEmergency}
              variant="outline"
              className="flex-1 border-2 border-warning/30 text-warning hover:bg-warning hover:text-warning-foreground"
              disabled={!isActive}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Test Emergency
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-2"
              disabled={!isActive}
            >
              <Activity className="h-4 w-4 mr-2" />
              View Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Keywords Card */}
      {voiceDetection && isActive && voiceSupported && (
        <Card className="border-2 border-protection/30 bg-gradient-to-br from-protection/5 to-protection/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Volume2 className="h-5 w-5 text-protection mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-2">
                  Active Emergency Keywords
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {emergencyKeywords.slice(0, 6).map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="outline"
                      className="text-xs border-protection/30 text-protection"
                    >
                      "{keyword}"
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  🎤 Guardian listens for these keywords and automatically
                  triggers SOS after 5 seconds. Voice data is processed locally
                  for privacy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Tips */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold mb-2">Smart Monitoring Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Say "help" clearly to trigger automatic SOS alerts</li>
                <li>• Keep Guardian running in background for protection</li>
                <li>• Test emergency features regularly</li>
                <li>• Voice detection works best in quiet environments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disabled State Info */}
      {!isActive && (
        <Card className="border-2 border-warning/30 bg-gradient-to-br from-warning/10 to-warning/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-3" />
            <h3 className="font-bold mb-2">Safety Monitoring Disabled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Background monitoring is currently disabled. Enable it to get
              automatic emergency detection and enhanced protection.
            </p>
            <Button
              onClick={handleToggleMonitoring}
              className="bg-safe hover:bg-safe/90 text-safe-foreground"
            >
              <Shield className="h-4 w-4 mr-2" />
              Enable Protection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
