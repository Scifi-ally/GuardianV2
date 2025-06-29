import { useState, useEffect } from "react";
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

  const handleToggleMonitoring = () => {
    setIsActive(!isActive);
    if (!isActive) {
      // Simulate enabling monitoring
      console.log("Background safety monitoring enabled");
    } else {
      console.log("Background safety monitoring disabled");
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
              <Mic
                className={cn(
                  "h-6 w-6 mx-auto mb-2",
                  voiceDetection && isActive
                    ? "text-safe animate-pulse"
                    : "text-muted-foreground",
                )}
              />
              <div className="text-sm font-medium">Voice</div>
              <div className="text-xs text-muted-foreground">
                {voiceDetection && isActive ? "Listening" : "Disabled"}
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

          {/* Detection Settings */}
          {isActive && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Voice Detection</p>
                    <p className="text-sm text-muted-foreground">
                      Listen for distress calls and emergency keywords
                    </p>
                  </div>
                  <Switch
                    checked={voiceDetection}
                    onCheckedChange={setVoiceDetection}
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
      {voiceDetection && isActive && (
        <Card className="border-2 border-protection/30 bg-gradient-to-br from-protection/5 to-protection/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Volume2 className="h-5 w-5 text-protection mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-2">
                  Voice Activation Keywords
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["Help", "Emergency", "Call 911", "I'm in danger"].map(
                    (keyword) => (
                      <Badge
                        key={keyword}
                        variant="outline"
                        className="text-xs border-protection/30 text-protection"
                      >
                        "{keyword}"
                      </Badge>
                    ),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Guardian listens for these keywords and phrases to
                  automatically trigger emergency alerts. Your privacy is
                  protected - voice data is processed locally.
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
                <li>
                  • Keep Guardian running in background for continuous
                  protection
                </li>
                <li>• Test emergency features regularly to ensure they work</li>
                <li>• Adjust sensitivity based on your environment</li>
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
