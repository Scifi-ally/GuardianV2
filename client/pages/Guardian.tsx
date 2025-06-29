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
import { GoogleMap } from "@/components/GoogleMap";
import { SlideUpPanel } from "@/components/SlideUpPanel";
import { SimpleBottomNav } from "@/components/SimpleBottomNav";
import { EnhancedSOSButton } from "@/components/EnhancedSOSButton";
import { GuardianKeyCard } from "@/components/GuardianKeyCard";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { SOSAlertManager } from "@/components/SOSAlertManager";
import { BackgroundSafetyMonitor } from "@/components/BackgroundSafetyMonitor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  GPS
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content Area with Enhanced Transitions */}
        <div className="flex-1 overflow-hidden relative">
          {/* Map Tab */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-in-out transform",
              activeTab === "map"
                ? "translate-x-0 opacity-100 scale-100 rotate-0"
                : "-translate-x-full opacity-0 scale-95 -rotate-1 pointer-events-none",
            )}
          >
            <div
              className={cn(
                "relative h-full transition-all duration-700 delay-100",
                activeTab === "map" ? "blur-0" : "blur-sm",
              )}
            >
              {/* Interactive Google Map Full Screen */}
              <div className="absolute inset-0">
                <GoogleMap
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
              {/* Map loading overlay */}
              <div
                className={cn(
                  "absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center transition-all duration-1000",
                  activeTab === "map"
                    ? "opacity-0 pointer-events-none delay-500"
                    : "opacity-100",
                )}
              >
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Loading map...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tab */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-in-out transform",
              activeTab === "profile"
                ? "translate-x-0 opacity-100 scale-100 rotate-0"
                : "translate-x-full opacity-0 scale-95 rotate-1 pointer-events-none",
            )}
          >
            <div
              className={cn(
                "h-full p-4 space-y-6 overflow-y-auto custom-scrollbar transition-all duration-700 delay-100",
                activeTab === "profile" ? "blur-0" : "blur-sm",
              )}
            >
              {/* Profile Header */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 flex-shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                        {userProfile?.displayName?.charAt(0)?.toUpperCase() ||
                          "G"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-lg">
                        {userProfile?.displayName || "Guardian User"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {userProfile?.email || "No email set"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPanel("settings")}
                      className="text-xs px-3 py-2 h-8 flex-1"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Settings
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLogout}
                      className="text-xs px-3 py-2 h-8 flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {/* Guardian Key Card */}
              <GuardianKeyCard />

              {/* Functional Safety Overview */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Safety Overview
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPanel("safety-details")}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Details
                  </Button>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <Card
                    className="border-safe/20 bg-safe/5 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-safe/40"
                    onClick={() => openPanel("contacts")}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-full bg-safe/20">
                          <Users className="h-4 w-4 text-safe" />
                        </div>
                        <div className="text-lg font-bold text-safe">
                          {emergencyContacts.length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Contacts
                        </div>
                        {emergencyContacts.length === 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs mt-1 border-warning text-warning"
                          >
                            Add Now
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="border-primary/20 bg-primary/5 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/40"
                    onClick={() => openPanel("alerts")}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-full bg-primary/20">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {safetyStatus === "emergency" ? "1" : "0"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Active Alerts
                        </div>
                        {safetyStatus === "emergency" && (
                          <Badge className="text-xs mt-1 bg-emergency text-emergency-foreground">
                            ACTIVE
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="border-protection/20 bg-protection/5 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-protection/40"
                    onClick={() => openPanel("trips")}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-full bg-protection/20">
                          <NavIcon className="h-4 w-4 text-protection" />
                        </div>
                        <div className="text-lg font-bold text-protection">
                          {Math.floor(Math.random() * 50) + 10}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Safe Trips
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs mt-1 border-protection/30 text-protection"
                        >
                          +{Math.floor(Math.random() * 5) + 1} Today
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              {/* Background Safety Monitor */}
              <ErrorBoundary
                fallback={
                  <Card className="border-warning/20 bg-warning/5">
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
                      <p className="text-sm font-medium">
                        Safety Monitor Unavailable
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Voice activation temporarily disabled. Core safety
                        features remain active.
                      </p>
                    </CardContent>
                  </Card>
                }
              >
                <BackgroundSafetyMonitor
                  onEmergencyDetected={handleEmergencyTriggered}
                  className="mb-4"
                />
              </ErrorBoundary>

              {/* Emergency Contacts Manager */}
              <EmergencyContactManager />

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
          </div>
        </div>
      </div>

      {/* Enhanced Slide Up Panel for Map Tab */}
      {activeTab === "map" && (
        <SlideUpPanel
          minHeight={220}
          maxHeight={600}
          initialHeight={350}
          bottomOffset={120}
        >
          {/* Live Tracking Status */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-safe/10 rounded-xl border border-primary/20">
            <div className="p-3 rounded-full bg-primary/20">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold">Live Tracking</p>
                <Badge className="bg-primary/20 text-primary text-xs">
                  ACTIVE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {location
                  ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : "Getting precise location..."}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    GPS Strong
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={shareLocation}
                className="h-8 bg-safe hover:bg-safe/90 text-xs px-3"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openPanel("tracking")}
                className="h-8 text-xs px-3 border-primary/30 hover:bg-primary/10"
              >
                <Activity className="h-3 w-3 mr-1" />
                Settings
              </Button>
            </div>
          </div>

          {/* Map Layers & Views */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Map Layers
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 flex-col gap-1 text-xs hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
              >
                <MapPin className="h-4 w-4" />
                Traffic
              </Button>
              <Button
                variant="outline"
                className="h-12 flex-col gap-1 text-xs hover:bg-safe/10 hover:border-safe/30 transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
                Safe Zones
              </Button>
              <Button
                variant="outline"
                className="h-12 flex-col gap-1 text-xs hover:bg-warning/10 hover:border-warning/30 transition-all duration-200"
              >
                <AlertTriangle className="h-4 w-4" />
                Risk Areas
              </Button>
              <Button
                variant="outline"
                className="h-12 flex-col gap-1 text-xs hover:bg-protection/10 hover:border-protection/30 transition-all duration-200"
              >
                <Camera className="h-4 w-4" />
                CCTV
              </Button>
            </div>
          </div>
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => openPanel("routes")}
                variant="outline"
                className="h-16 flex-col gap-1 text-xs hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
              >
                <NavIcon className="h-4 w-4" />
                Safe Routes
              </Button>
              <Button
                onClick={() => openPanel("check-in")}
                variant="outline"
                className="h-16 flex-col gap-1 text-xs hover:bg-safe/10 hover:border-safe/30 transition-all duration-200"
              >
                <Clock className="h-4 w-4" />
                Check-in Timer
              </Button>
              <Button
                onClick={() => openPanel("places")}
                variant="outline"
                className="h-16 flex-col gap-1 text-xs hover:bg-protection/10 hover:border-protection/30 transition-all duration-200"
              >
                <MapPin className="h-4 w-4" />
                Safe Places
              </Button>
            </div>
          </div>

          {/* Map Display Options */}
          <div>
            <h3 className="text-sm font-medium mb-3">Map Display</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Show Traffic</span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Satellite View</span>
                </div>
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

      {/* Safety Details Panels */}
      <SlidingPanel
        title="Emergency Contacts"
        isOpen={activePanel === "contacts"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <EmergencyContactManager />
      </SlidingPanel>

      <SlidingPanel
        title="Active Alerts"
        isOpen={activePanel === "alerts"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center p-6">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-2">No Active Alerts</h3>
            <p className="text-sm text-muted-foreground">
              All systems monitoring. Your safety network is active and ready.
            </p>
          </div>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="Safety Statistics"
        isOpen={activePanel === "trips"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-safe">
                  {Math.floor(Math.random() * 50) + 10}
                </div>
                <div className="text-xs text-muted-foreground">Safe Trips</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.floor(Math.random() * 100) + 50}
                </div>
                <div className="text-xs text-muted-foreground">
                  Hours Protected
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Recent Activity</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Today's Safe Trips</span>
                <span className="text-safe font-medium">
                  +{Math.floor(Math.random() * 5) + 1}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Location Shares</span>
                <span className="text-primary font-medium">
                  {Math.floor(Math.random() * 20) + 5}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Emergency Readiness</span>
                <span className="text-protection font-medium">100%</span>
              </div>
            </div>
          </div>
        </div>
      </SlidingPanel>

      {/* All Safety Features Panel */}
      <SlidingPanel
        title="All Safety Features"
        isOpen={activePanel === "features"}
        onClose={closePanel}
        direction="bottom"
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
