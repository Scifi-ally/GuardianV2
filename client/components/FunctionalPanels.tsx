import { useState, useEffect } from "react";
import {
  X,
  Phone,
  Camera,
  Clock,
  Shield,
  Navigation,
  Bell,
  Settings,
  Users,
  MapPin,
  AlertTriangle,
  Video,
  Mic,
  Route,
  CheckCircle,
  UserPlus,
  VolumeX,
  Volume2,
  Vibrate,
  Moon,
  Sun,
  HelpCircle,
  MessageSquare,
  Share,
  Download,
  Upload,
  Trash2,
  Edit,
  Save,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function SlidePanel({ isOpen, onClose, title, children }: PanelProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-all duration-300",
        isOpen ? "visible" : "invisible",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl transition-transform duration-300 overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// Settings Panel
export function SettingsPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: true,
    location: true,
    autoAlert: true,
    sosCountdown: 3,
    vibration: true,
    soundAlerts: true,
    darkMode: false,
    shareLocation: true,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    toast({
      description: "Setting updated successfully",
    });
  };

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Emergency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Emergency Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-alert contacts</Label>
                <p className="text-sm text-gray-600">
                  Automatically notify emergency contacts
                </p>
              </div>
              <Switch
                checked={settings.autoAlert}
                onCheckedChange={(checked) =>
                  updateSetting("autoAlert", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>SOS countdown (seconds)</Label>
              <Slider
                value={[settings.sosCountdown]}
                onValueChange={([value]) =>
                  updateSetting("sosCountdown", value)
                }
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-gray-600">
                {settings.sosCountdown} seconds
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Share location automatically</Label>
                <p className="text-sm text-gray-600">
                  Share location when SOS is triggered
                </p>
              </div>
              <Switch
                checked={settings.shareLocation}
                onCheckedChange={(checked) =>
                  updateSetting("shareLocation", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Push notifications</Label>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) =>
                  updateSetting("notifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Sound alerts</Label>
              <Switch
                checked={settings.soundAlerts}
                onCheckedChange={(checked) =>
                  updateSetting("soundAlerts", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Vibration</Label>
              <Switch
                checked={settings.vibration}
                onCheckedChange={(checked) =>
                  updateSetting("vibration", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Location services</Label>
              <Switch
                checked={settings.location}
                onCheckedChange={(checked) =>
                  updateSetting("location", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Dark mode</Label>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) =>
                  updateSetting("darkMode", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => toast({ description: "Settings saved successfully!" })}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </SlidePanel>
  );
}

// Emergency Camera Panel
export function CameraPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = (type: "photo" | "video" | "audio") => {
    setIsRecording(true);
    setRecordingTime(0);
    toast({
      description: `Started ${type} recording`,
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    toast({
      description: "Recording saved securely",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Emergency Recording">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {isRecording && (
                <div className="space-y-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full mx-auto animate-pulse" />
                  <p className="text-lg font-mono">
                    {formatTime(recordingTime)}
                  </p>
                  <Badge className="bg-red-100 text-red-800">RECORDING</Badge>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() =>
                    isRecording ? stopRecording() : startRecording("photo")
                  }
                  className={cn(
                    "h-20 flex-col gap-2",
                    isRecording ? "bg-red-500 hover:bg-red-600" : "",
                  )}
                >
                  <Camera className="h-8 w-8" />
                  {isRecording ? "Stop" : "Photo"}
                </Button>

                <Button
                  onClick={() =>
                    isRecording ? stopRecording() : startRecording("video")
                  }
                  className={cn(
                    "h-20 flex-col gap-2",
                    isRecording ? "bg-red-500 hover:bg-red-600" : "",
                  )}
                  variant="outline"
                >
                  <Video className="h-8 w-8" />
                  {isRecording ? "Stop" : "Video"}
                </Button>

                <Button
                  onClick={() =>
                    isRecording ? stopRecording() : startRecording("audio")
                  }
                  className={cn(
                    "h-20 flex-col gap-2",
                    isRecording ? "bg-red-500 hover:bg-red-600" : "",
                  )}
                  variant="outline"
                >
                  <Mic className="h-8 w-8" />
                  {isRecording ? "Stop" : "Audio"}
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() =>
                    toast({
                      description:
                        "Stealth mode activated - recording without notification",
                    })
                  }
                >
                  <VolumeX className="h-8 w-8" />
                  Stealth
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Recordings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  <span className="text-sm">Evidence_{i}.jpg</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost">
                    <Share className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-xs text-gray-600 text-center">
          All recordings are automatically encrypted and shared with emergency
          contacts
        </p>
      </div>
    </SlidePanel>
  );
}

// Check-in Timer Panel
export function CheckInPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [selectedTime, setSelectedTime] = useState(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            toast({
              title: "Check-in Timer Expired",
              description: "Emergency contacts have been notified",
              variant: "destructive",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  const startTimer = () => {
    setTimeRemaining(selectedTime * 60);
    setTimerActive(true);
    toast({
      description: `Check-in timer started for ${selectedTime} minutes`,
    });
  };

  const stopTimer = () => {
    setTimerActive(false);
    toast({
      description: "Check-in timer cancelled",
    });
  };

  const checkIn = () => {
    setTimerActive(false);
    toast({
      description: "Checked in successfully - contacts notified you're safe",
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Check-in Timer">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            {timerActive ? (
              <>
                <div className="space-y-2">
                  <Clock className="h-12 w-12 mx-auto text-orange-500" />
                  <div className="text-3xl font-mono font-bold">
                    {formatTime(timeRemaining)}
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">
                    TIMER ACTIVE
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Button onClick={checkIn} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check In - I'm Safe
                  </Button>
                  <Button
                    onClick={stopTimer}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel Timer
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <Clock className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="font-semibold mb-2">Set Check-in Time</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[15, 30, 60, 120, 180, 240].map((time) => (
                        <Button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          variant={
                            selectedTime === time ? "default" : "outline"
                          }
                          size="sm"
                        >
                          {time < 60 ? `${time}m` : `${time / 60}h`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={startTimer} className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    Start {selectedTime}min Timer
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>• Set a timer for when you expect to be safe</p>
            <p>• If you don't check in, contacts are automatically alerted</p>
            <p>• Check in anytime to cancel the timer</p>
            <p>• Great for walking alone, dates, or risky situations</p>
          </CardContent>
        </Card>
      </div>
    </SlidePanel>
  );
}

// Notifications Panel
export function NotificationsPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [notifications] = useState([
    {
      id: 1,
      type: "safety",
      title: "Safety check completed",
      message: "Your safety network is active and monitoring",
      time: "2 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "contact",
      title: "Emergency contact added",
      message: "John Doe has been added to your emergency contacts",
      time: "1 hour ago",
      read: true,
    },
    {
      id: 3,
      type: "location",
      title: "Location shared",
      message: "Your location was shared with 3 emergency contacts",
      time: "3 hours ago",
      read: true,
    },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case "safety":
        return <Shield className="h-4 w-4 text-green-600" />;
      case "contact":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "location":
        return <MapPin className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Notifications">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button size="sm" variant="outline">
            Mark all read
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toast({ description: "All notifications cleared" })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "cursor-pointer hover:bg-gray-50 transition-colors",
                !notification.read && "border-blue-200 bg-blue-50",
              )}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications</p>
          </div>
        )}
      </div>
    </SlidePanel>
  );
}

// Safe Routes Panel
export function SafeRoutesPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [destination, setDestination] = useState("");
  const [routePreferences, setRoutePreferences] = useState({
    wellLit: true,
    avoidIsolated: true,
    publicTransport: false,
    shortest: false,
  });

  const planRoute = () => {
    if (!destination.trim()) {
      toast({
        title: "Destination required",
        description: "Please enter a destination",
        variant: "destructive",
      });
      return;
    }

    toast({
      description: `Planning safe route to ${destination}...`,
    });

    // Simulate route planning
    setTimeout(() => {
      toast({
        description: "Safe route calculated! Opening in maps...",
      });
    }, 2000);
  };

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Safe Routes">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="Enter destination address..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>Route Preferences</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Well-lit paths</span>
                  <Switch
                    checked={routePreferences.wellLit}
                    onCheckedChange={(checked) =>
                      setRoutePreferences((prev) => ({
                        ...prev,
                        wellLit: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avoid isolated areas</span>
                  <Switch
                    checked={routePreferences.avoidIsolated}
                    onCheckedChange={(checked) =>
                      setRoutePreferences((prev) => ({
                        ...prev,
                        avoidIsolated: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Near public transport</span>
                  <Switch
                    checked={routePreferences.publicTransport}
                    onCheckedChange={(checked) =>
                      setRoutePreferences((prev) => ({
                        ...prev,
                        publicTransport: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shortest route</span>
                  <Switch
                    checked={routePreferences.shortest}
                    onCheckedChange={(checked) =>
                      setRoutePreferences((prev) => ({
                        ...prev,
                        shortest: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <Button onClick={planRoute} className="w-full">
              <Route className="h-4 w-4 mr-2" />
              Plan Safe Route
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Safe Routes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              "Home → Work",
              "Shopping Mall → Home",
              "University → Library",
            ].map((route, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{route}</span>
                </div>
                <Button size="sm" variant="ghost">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SlidePanel>
  );
}
