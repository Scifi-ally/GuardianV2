import { useState, useCallback } from "react";
import {
  Home,
  Users,
  MapPin,
  Settings,
  AlertTriangle,
  Menu,
  Shield,
  Navigation as NavIcon,
  Phone,
  MessageSquare,
  Camera,
  Clock,
  Activity,
  User,
  Bell,
  Mic,
  LogOut,
  Key,
} from "lucide-react";
import {
  SlidingPanel,
  PanelContainer,
  TabSwitcher,
} from "@/components/SlidingPanel";
import { EmergencyDetection } from "@/components/EmergencyDetection";
import { SafetyMap } from "@/components/SafetyMap";
import { MockMap } from "@/components/MockMap";
import { SlideUpPanel } from "@/components/SlideUpPanel";
import { SimpleBottomNav } from "@/components/SimpleBottomNav";
import { EnhancedSOSButton } from "@/components/EnhancedSOSButton";
import { GuardianKeyCard } from "@/components/GuardianKeyCard";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { SOSAlertManager } from "@/components/SOSAlertManager";
import { useHapticFeedback, useGeolocation } from "@/hooks/use-device-apis";
import { useAuth } from "@/contexts/AuthContext";
import { SOSService } from "@/services/sosService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export default function Guardian() {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("map");
  const [safetyStatus, setSafetyStatus] = useState<
    "safe" | "alert" | "emergency"
  >("safe");

  const { currentUser, userProfile, logout } = useAuth();
  const { successVibration, warningVibration, emergencyVibration } =
    useHapticFeedback();
  const { location, getCurrentLocation } = useGeolocation();

  const emergencyContacts = userProfile?.emergencyContacts || [];

  const openPanel = useCallback(
    (panelId: string) => {
      setActivePanel(panelId);
      successVibration();
    },
    [successVibration],
  );

  const closePanel = useCallback(() => {
    setActivePanel(null);
    successVibration();
  }, [successVibration]);

  const handleEmergencyTriggered = useCallback(
    async (type: string, data?: any) => {
      if (!userProfile) return;

      setSafetyStatus("emergency");
      emergencyVibration();

      try {
        const location = await getCurrentLocation().catch(() => undefined);

        const result = await SOSService.sendSOSAlert(
          userProfile.uid,
          userProfile.displayName,
          userProfile.guardianKey,
          emergencyContacts,
          location,
          type === "manual" ? "manual" : "automatic",
          `Emergency detected: ${type}. Immediate assistance needed.`,
        );

        if (result.success) {
          console.log("SOS alert sent successfully:", result.alertId);
        }
      } catch (error) {
        console.error("Failed to send SOS alert:", error);
      }

      // Reset after demo
      setTimeout(() => setSafetyStatus("safe"), 10000);
    },
    [emergencyContacts, emergencyVibration, userProfile, getCurrentLocation],
  );

  const handleSOSPress = useCallback(
    (alertId?: string) => {
      setSafetyStatus("emergency");
      emergencyVibration();
      if (alertId) {
        console.log("SOS Alert sent:", alertId);
      }
    },
    [emergencyVibration],
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  }, [logout]);

  const shareLocation = useCallback(async () => {
    try {
      const loc = await getCurrentLocation();
      const message = `Guardian Alert: I'm at https://maps.google.com/?q=${loc.latitude},${loc.longitude}`;

      if (navigator.share) {
        await navigator.share({
          title: "Guardian Location",
          text: message,
        });
      } else {
        await navigator.clipboard.writeText(message);
        alert("Location copied to clipboard!");
      }
      successVibration();
    } catch (error) {
      console.error("Share failed:", error);
    }
  }, [getCurrentLocation, successVibration]);

  const quickCall = useCallback(
    (phone: string) => {
      window.location.href = `tel:${phone}`;
      warningVibration();
    },
    [warningVibration],
  );

  const quickText = useCallback(
    (phone: string) => {
      window.location.href = `sms:${phone}?body=Guardian Alert: I need help!`;
      warningVibration();
    },
    [warningVibration],
  );

  const statusColors = {
    safe: "bg-safe text-safe-foreground",
    alert: "bg-warning text-warning-foreground",
    emergency: "bg-emergency text-emergency-foreground animate-pulse",
  };

  // Only map and profile tabs now - controlled by bottom nav

  return (
    <PanelContainer className="bg-background">
      {/* Main Interface */}
      <div className="h-full flex flex-col pb-24">
        {/* Status Bar */}
        <div className="p-4 border-b border-border/50 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[safetyStatus]}>
                  <Activity className="h-3 w-3 mr-1" />
                  {safetyStatus.toUpperCase()}
                </Badge>
                {location && (
                  <Badge
                    variant="outline"
                    className="text-xs border-safe/20 text-safe"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    GPS
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("profile")}
              className="text-xs px-3 py-2 h-8 hover:bg-muted/50"
            >
              <User className="h-4 w-4 mr-1" />
              Profile
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "map" && (
            <div className="relative h-full">
              {/* Interactive Mock Map Full Screen */}
              <div className="absolute inset-0">
                <MockMap
                  location={location}
                  emergencyContacts={emergencyContacts.map((contact) => ({
                    id: contact.id,
                    name: contact.name,
                    guardianKey: contact.guardianKey,
                    location: {
                      lat: 37.7749 + Math.random() * 0.01,
                      lng: -122.4194 + Math.random() * 0.01,
                    }, // Mock locations for demo
                  }))}
                  onLocationUpdate={(newLocation) => {
                    console.log("Location updated:", newLocation);
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="h-full p-4 space-y-4 overflow-y-auto">
              {/* Profile Header */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {userProfile?.displayName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {userProfile?.displayName || "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userProfile?.email || "No email"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPanel("settings")}
                        className="text-xs px-2 py-1 h-7"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLogout}
                        className="text-xs px-2 py-1 h-7 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <LogOut className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guardian Key Card */}
              <GuardianKeyCard />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-lg font-bold">
                      {emergencyContacts.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Contacts
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-lg font-bold">0</div>
                    <div className="text-xs text-muted-foreground">Alerts</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-lg font-bold">24</div>
                    <div className="text-xs text-muted-foreground">
                      Safe Trips
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Emergency Contacts Manager */}
              <EmergencyContactManager />

              {/* Emergency Actions */}
              <div>
                <h3 className="text-sm font-medium mb-3">Emergency Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => quickCall("911")}
                    className="h-16 flex-col gap-1 text-xs bg-emergency hover:bg-emergency/90"
                  >
                    <Phone className="h-4 w-4" />
                    Call 911
                  </Button>
                  <Button
                    onClick={() => openPanel("silent-alarm")}
                    className="h-16 flex-col gap-1 text-xs bg-warning hover:bg-warning/90"
                  >
                    <Bell className="h-4 w-4" />
                    Silent Alert
                  </Button>
                  <Button
                    onClick={() => openPanel("tracking")}
                    variant="outline"
                    className="h-16 flex-col gap-1 text-xs hover:bg-protection/10 hover:border-protection/30"
                  >
                    <Activity className="h-4 w-4" />
                    Live Track
                  </Button>
                  <Button
                    onClick={() => openPanel("features")}
                    variant="outline"
                    className="h-16 flex-col gap-1 text-xs hover:bg-primary/10 hover:border-primary/30"
                  >
                    <Shield className="h-4 w-4" />
                    All Features
                  </Button>
                </div>
              </div>

              {/* Menu Options */}
              <div>
                <h3 className="text-sm font-medium mb-3">Menu</h3>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12"
                    onClick={() => openPanel("settings")}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings & Preferences
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12"
                    onClick={() => openPanel("notifications")}
                  >
                    <Bell className="h-4 w-4 mr-3" />
                    Notifications
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12"
                    onClick={() => openPanel("help")}
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    Help & Support
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12"
                    onClick={() => openPanel("camera")}
                  >
                    <Camera className="h-4 w-4 mr-3" />
                    Camera & Evidence
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12"
                    onClick={() => openPanel("fake-call")}
                  >
                    <Phone className="h-4 w-4 mr-3" />
                    Fake Emergency Call
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide Up Panel for Map Tab */}
      {activeTab === "map" && (
        <SlideUpPanel
          minHeight={200}
          maxHeight={500}
          initialHeight={300}
          bottomOffset={96}
        >
          {/* Current Location */}
          <div className="flex items-center gap-3 p-3 bg-safe/10 rounded-xl border border-safe/20">
            <div className="p-2 rounded-full bg-safe/20">
              <MapPin className="h-4 w-4 text-safe" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Current Location</p>
              <p className="text-xs text-muted-foreground">
                {location
                  ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : "Getting location..."}
              </p>
            </div>
            <Button
              size="sm"
              onClick={shareLocation}
              className="h-8 bg-safe hover:bg-safe/90"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Share
            </Button>
          </div>

          {/* Map Functions */}
          <div>
            <h3 className="text-sm font-medium mb-3">Map Functions</h3>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => openPanel("routes")}
                variant="outline"
                className="h-16 flex-col gap-1 text-xs hover:bg-primary/10 hover:border-primary/30"
              >
                <NavIcon className="h-4 w-4" />
                Safe Routes
              </Button>
              <Button
                onClick={() => openPanel("tracking")}
                variant="outline"
                className="h-16 flex-col gap-1 text-xs hover:bg-warning/10 hover:border-warning/30"
              >
                <Activity className="h-4 w-4" />
                Live Track
              </Button>
              <Button
                onClick={() => openPanel("places")}
                variant="outline"
                className="h-16 flex-col gap-1 text-xs hover:bg-protection/10 hover:border-protection/30"
              >
                <MapPin className="h-4 w-4" />
                Safe Places
              </Button>
            </div>
          </div>

          {/* Map Settings */}
          <div>
            <h3 className="text-sm font-medium mb-3">Map Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                <span className="text-sm">Show Traffic</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                <span className="text-sm">Satellite View</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                <span className="text-sm">3D Buildings</span>
                <Switch />
              </div>
            </div>
          </div>
        </SlideUpPanel>
      )}

      {/* Simple Bottom Navigation */}
      <SimpleBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSOSPress={handleSOSPress}
      />

      {/* SOS Alert Manager */}
      <SOSAlertManager />

      {/* Sliding Panels */}

      <SlidingPanel
        title="Settings"
        isOpen={activePanel === "settings"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Emergency Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-alert contacts</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically notify emergency contacts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">SOS countdown (seconds)</p>
                <Slider defaultValue={[3]} max={10} min={1} step={1} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Detection Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Shake detection</p>
                  <p className="text-xs text-muted-foreground">
                    Trigger alert when device is shaken
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Voice activation</p>
                  <p className="text-xs text-muted-foreground">
                    Listen for emergency keywords
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </SlidingPanel>

      {/* Enhanced Safety Panels */}

      <SlidingPanel
        title="Silent Alarm"
        isOpen={activePanel === "silent-alarm"}
        onClose={closePanel}
        direction="right"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
            <Bell className="h-8 w-8 text-warning mb-2" />
            <h3 className="font-medium mb-2">Silent Alert System</h3>
            <p className="text-sm text-muted-foreground">
              Discretely alert your contacts without making noise or drawing
              attention.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12 bg-warning hover:bg-warning/90 text-warning-foreground"
              onClick={() => {
                emergencyContacts.forEach((c) => quickText(c.phone));
                successVibration();
              }}
            >
              Send Silent Alert
            </Button>
            <Button variant="outline" className="w-full">
              Schedule Check-in
            </Button>
            <Button variant="outline" className="w-full">
              Fake Emergency Call
            </Button>
          </div>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="Live Tracking"
        isOpen={activePanel === "tracking"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Activity className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium mb-2">Live Location Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Share your real-time location with trusted contacts during your
              journey.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Location Sharing</p>
                <p className="text-xs text-muted-foreground">
                  Active for 2 contacts
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Share Duration</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  15 min
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  1 hour
                </Button>
                <Button size="sm" className="text-xs">
                  Until Safe
                </Button>
              </div>
            </div>

            <Button className="w-full">Start Live Tracking</Button>
          </div>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="Check-in Timer"
        isOpen={activePanel === "check-in"}
        onClose={closePanel}
        direction="right"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-safe/5 rounded-lg border border-safe/20">
            <Clock className="h-8 w-8 text-safe mb-2" />
            <h3 className="font-medium mb-2">Safety Check-in</h3>
            <p className="text-sm text-muted-foreground">
              Set a timer to automatically alert contacts if you don't check in.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Check-in Time</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  30 min
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  1 hour
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  2 hours
                </Button>
                <Button size="sm" className="text-xs">
                  Custom
                </Button>
              </div>
            </div>

            <Button className="w-full bg-safe hover:bg-safe/90 text-safe-foreground">
              Start Check-in Timer
            </Button>
          </div>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="Camera & Evidence"
        isOpen={activePanel === "camera"}
        onClose={closePanel}
        direction="bottom"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button className="h-16 flex-col gap-1">
              <Camera className="h-5 w-5" />
              <span className="text-xs">Take Photo</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-1">
              <Clock className="h-5 w-5" />
              <span className="text-xs">Record Video</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-1">
              <Mic className="h-5 w-5" />
              <span className="text-xs">Audio Record</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-1">
              <Shield className="h-5 w-5" />
              <span className="text-xs">Stealth Mode</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Evidence automatically uploaded to secure cloud and shared with
            emergency contacts
          </p>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="Fake Call"
        isOpen={activePanel === "fake-call"}
        onClose={closePanel}
        direction="right"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Phone className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium mb-2">Fake Emergency Call</h3>
            <p className="text-sm text-muted-foreground">
              Simulate receiving an urgent call to escape uncomfortable
              situations.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Call Type</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs"
                >
                  Family Emergency
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs"
                >
                  Work Emergency
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs"
                >
                  Medical Appointment
                </Button>
              </div>
            </div>

            <Button className="w-full">Start Fake Call</Button>
          </div>
        </div>
      </SlidingPanel>

      {/* All Safety Features Panel */}
      <SlidingPanel
        title="Safe Routes"
        isOpen={activePanel === "routes"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-safe/5 rounded-lg border border-safe/20">
            <NavIcon className="h-8 w-8 text-safe mb-2" />
            <h3 className="font-medium mb-2">Safe Route Planning</h3>
            <p className="text-sm text-muted-foreground">
              Get directions with safety-optimized routes that avoid high-risk
              areas and include well-lit, populated paths.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Destination</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter destination..."
                  className="flex-1 p-2 text-sm border rounded-lg bg-background"
                />
                <Button size="sm" className="px-3">
                  Search
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Route Preferences</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="text-sm">Well-lit paths</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="text-sm">Avoid isolated areas</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-2 border rounded-lg">
                  <span className="text-sm">Public transport nearby</span>
                  <input type="checkbox" />
                </div>
              </div>
            </div>

            <Button className="w-full bg-safe hover:bg-safe/90 text-safe-foreground">
              Plan Safe Route
            </Button>
          </div>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="All Safety Features"
        isOpen={activePanel === "features"}
        onClose={closePanel}
        direction="bottom"
      >
        <div className="space-y-4">
          {/* Emergency Detection */}
          <div className="max-h-48 overflow-auto">
            <EmergencyDetection
              onEmergencyTriggered={handleEmergencyTriggered}
            />
          </div>

          {/* Quick Features Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => openPanel("camera")}
              variant="outline"
              className="h-16 flex-col gap-1 text-xs"
            >
              <Camera className="h-4 w-4" />
              Evidence
            </Button>
            <Button
              onClick={() => openPanel("tracking")}
              variant="outline"
              className="h-16 flex-col gap-1 text-xs"
            >
              <Activity className="h-4 w-4" />
              Live Track
            </Button>
            <Button
              onClick={() => openPanel("silent-alarm")}
              className="h-16 flex-col gap-1 text-xs bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              <Bell className="h-4 w-4" />
              Silent Alarm
            </Button>
            <Button
              onClick={() => openPanel("check-in")}
              variant="outline"
              className="h-16 flex-col gap-1 text-xs"
            >
              <Clock className="h-4 w-4" />
              Check-in
            </Button>
            <Button
              onClick={() => openPanel("fake-call")}
              variant="outline"
              className="h-16 flex-col gap-1 text-xs"
            >
              <Phone className="h-4 w-4" />
              Fake Call
            </Button>
            <Button
              onClick={() => openPanel("routes")}
              variant="outline"
              className="h-16 flex-col gap-1 text-xs hover:bg-safe/10 hover:border-safe/30"
            >
              <NavIcon className="h-4 w-4" />
              Safe Routes
            </Button>
          </div>
        </div>
      </SlidingPanel>
    </PanelContainer>
  );
}
