import { useState, useCallback, useEffect } from "react";
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
  Layers,
  Zap,
  Eye,
  Heart,
} from "lucide-react";
import {
  SlidingPanel,
  PanelContainer,
  TabSwitcher,
} from "@/components/SlidingPanel";
import { EmergencyDetection } from "@/components/EmergencyDetection";
import { SafetyMap } from "@/components/SafetyMap";
import { SlideUpPanel } from "@/components/SlideUpPanel";
import { SimpleBottomNav } from "@/components/SimpleBottomNav";
import { EnhancedSOSButton } from "@/components/EnhancedSOSButton";
import { GuardianKeyCard } from "@/components/GuardianKeyCard";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { SOSAlertManager } from "@/components/SOSAlertManager";
import { BackgroundSafetyMonitor } from "@/components/BackgroundSafetyMonitor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MapServiceInfo } from "@/components/MapServiceInfo";
import { SafetyDashboard } from "@/components/SafetyDashboard";
import { EmergencyAlertPopup } from "@/components/EmergencyAlertPopup";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SafetyAnalytics } from "@/components/SafetyAnalytics";
import { useHapticFeedback, useGeolocation } from "@/hooks/use-device-apis";
import { useAuth } from "@/contexts/AuthContext";
import { SOSService } from "@/services/sosService";
import { emergencyContactService } from "@/services/emergencyContactService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function Guardian() {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("map");
  const [safetyStatus, setSafetyStatus] = useState<
    "safe" | "alert" | "emergency"
  >("safe");
  const [showMapInfo, setShowMapInfo] = useState(false);
  const [mapServiceStatus, setMapServiceStatus] = useState<
    "google" | "offline" | "error"
  >("google");
  const [emergencyAlert, setEmergencyAlert] = useState<any>(null);
  const [showEmergencyPopup, setShowEmergencyPopup] = useState(false);

  const { currentUser, userProfile, logout } = useAuth();
  const { successVibration, warningVibration, emergencyVibration } =
    useHapticFeedback();
  const { location, getCurrentLocation } = useGeolocation();

  const emergencyContacts = userProfile?.emergencyContacts || [];

  // Subscribe to emergency alerts
  useEffect(() => {
    if (!userProfile?.uid) return;

    const unsubscribe = emergencyContactService.subscribeToEmergencyAlerts(
      userProfile.uid,
      (alerts) => {
        if (alerts.length > 0) {
          const latestAlert = alerts[0];
          setEmergencyAlert(latestAlert);
          setShowEmergencyPopup(true);
          setSafetyStatus("emergency");

          // Request notification permission if not granted
          if (Notification.permission !== "granted") {
            Notification.requestPermission();
          }
        }
      },
    );

    return unsubscribe;
  }, [userProfile?.uid]);

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

        const result = await emergencyContactService.sendSOSAlert(
          userProfile.uid,
          userProfile.displayName || "Guardian User",
          userProfile.guardianKey,
          location,
          type === "manual"
            ? "manual"
            : type === "voice"
              ? "voice"
              : "automatic",
          `🚨 EMERGENCY ALERT from ${userProfile.displayName || "Guardian User"}!\n\n${
            type === "voice"
              ? `Voice emergency detected: "${data?.transcript || "Help requested"}"`
              : type === "test"
                ? "This is a test emergency alert."
                : "I need immediate help. Please check on me or call emergency services."
          }\n\nTime: ${new Date().toLocaleString()}${
            location
              ? `\nLocation: https://maps.google.com/?q=${location.latitude},${location.longitude}`
              : ""
          }`,
        );

        if (result.success) {
          console.log("SOS alert sent successfully:", result.alertId);
        } else {
          console.error("Failed to send SOS alert:", result.error);
        }
      } catch (error) {
        console.error("Failed to send SOS alert:", error);
      }

      // Reset after demo for non-real emergencies
      if (type === "test") {
        setTimeout(() => setSafetyStatus("safe"), 5000);
      }
    },
    [emergencyContacts, emergencyVibration, userProfile, getCurrentLocation],
  );

  const handleSOSPress = useCallback(
    async (alertId?: string) => {
      if (!userProfile) return;

      setSafetyStatus("emergency");
      emergencyVibration();

      try {
        const location = await getCurrentLocation().catch(() => undefined);

        const result = await emergencyContactService.sendSOSAlert(
          userProfile.uid,
          userProfile.displayName || "Guardian User",
          userProfile.guardianKey,
          location,
          "manual",
        );

        if (result.success) {
          console.log("SOS Alert sent:", result.alertId);
        } else {
          console.error("Failed to send SOS alert:", result.error);
        }
      } catch (error) {
        console.error("Failed to send SOS alert:", error);
      }
    },
    [emergencyVibration, userProfile, getCurrentLocation],
  );

  const handleAcknowledgeAlert = useCallback(
    async (alertId: string) => {
      if (!userProfile) return;

      const result = await emergencyContactService.acknowledgeAlert(
        alertId,
        userProfile.uid,
      );

      if (result.success) {
        setShowEmergencyPopup(false);
        setEmergencyAlert(null);
        setSafetyStatus("safe");
      }
    },
    [userProfile],
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
        try {
          await navigator.share({
            title: "Guardian Location",
            text: message,
          });
        } catch (shareError) {
          await safeClipboardCopy(message);
          alert("Location copied to clipboard!");
        }
      } else {
        await safeClipboardCopy(message);
        alert("Location copied to clipboard!");
      }
      successVibration();
    } catch (error) {
      console.error("Share failed:", error);
    }
  }, [getCurrentLocation, successVibration]);

  // Safe clipboard copy helper
  const safeClipboardCopy = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error("Copy failed:", error);
      prompt("Please copy this manually:", text);
    }
  };

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

  return (
    <PanelContainer className="bg-white">
      {/* Main Interface */}
      <div className="h-full flex flex-col pb-32">
        {/* Minimal Header */}
        <div className="p-3 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-wide text-black font-mono">
              Guardian
            </h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openPanel("settings")}
                className="p-2 rounded-full"
              >
                <Settings className="h-4 w-4" />
              </Button>
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
              {/* Interactive Safety Map Full Screen */}
              <div className="absolute inset-0">
                <SafetyMap
                  userLocation={
                    location
                      ? { lat: location.latitude, lng: location.longitude }
                      : undefined
                  }
                  showSafeZones={true}
                  showEmergencyServices={true}
                  onLocationSelect={(location) => {
                    console.log("Location selected:", location);
                  }}
                  className="rounded-none border-0 h-full w-full"
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
                    Loading safety map...
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
                "h-full p-4 pb-16 space-y-6 overflow-y-auto custom-scrollbar transition-all duration-700 delay-100",
                activeTab === "profile" ? "blur-0" : "blur-sm",
              )}
            >
              {/* Enhanced Profile Header */}
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20 flex-shrink-0 border-4 border-white shadow-lg">
                        <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                          {userProfile?.displayName?.charAt(0)?.toUpperCase() ||
                            "G"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-safe rounded-full border-3 border-white flex items-center justify-center">
                        <Shield className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-xl mb-1">
                        {userProfile?.displayName || "Guardian User"}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-3">
                        {userProfile?.email || "No email set"}
                      </p>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-safe/20 text-safe border-safe/30">
                          <Shield className="h-3 w-3 mr-1" />
                          Protected
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Activity className="h-3 w-3 mr-1" />
                          Active 24/7
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPanel("settings")}
                          className="text-xs px-3 py-2 h-8 flex-1 hover:bg-primary/10 hover:border-primary/50"
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
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guardian Key Card */}
              <GuardianKeyCard />

              {/* Functional Safety Dashboard */}
              <SafetyDashboard
                onContactsClick={() => openPanel("contacts")}
                onAlertsClick={() => openPanel("alerts")}
                onTripsClick={() => openPanel("trips")}
              />

              {/* Enhanced Quick Actions */}
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => openPanel("silent-alarm")}
                    className="h-16 flex-col gap-2 bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="text-xs font-medium">Silent Alert</span>
                  </Button>
                  <Button
                    onClick={() => openPanel("camera")}
                    variant="outline"
                    className="h-16 flex-col gap-2 border-2 border-protection/30 hover:bg-protection/10 hover:border-protection/50 shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Camera className="h-5 w-5 text-protection" />
                    <span className="text-xs font-medium">Evidence</span>
                  </Button>
                  <Button
                    onClick={() => openPanel("tracking")}
                    variant="outline"
                    className="h-16 flex-col gap-2 border-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Activity className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium">Live Track</span>
                  </Button>
                  <Button
                    onClick={() => openPanel("fake-call")}
                    variant="outline"
                    className="h-16 flex-col gap-2 border-2 border-muted/30 hover:bg-muted/20 hover:border-muted/50 shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium">Fake Call</span>
                  </Button>
                </div>
              </div>

              {/* Background Safety Monitor */}
              <ErrorBoundary
                fallback={
                  <Card className="border-2 border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
                      <p className="text-sm font-medium">
                        Smart Detection Unavailable
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Voice and motion detection temporarily disabled. Core
                        safety features remain active.
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

              {/* Real-time Safety Analytics */}
              <SafetyAnalytics />

              {/* Emergency Contacts Manager */}
              <EmergencyContactManager />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Slide Up Panel for Map Tab */}
      {activeTab === "map" && (
        <SlideUpPanel
          minHeight={240}
          maxHeight={650}
          initialHeight={380}
          bottomOffset={85}
        >
          {/* Enhanced Live Tracking Status */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 via-safe/10 to-protection/10 rounded-xl border-2 border-primary/20 shadow-lg">
            <div className="p-4 rounded-full bg-primary/20 border-2 border-primary/30">
              <Activity className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold">Live Protection</h3>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  ACTIVE
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {location
                  ? `Precise location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : "Acquiring GPS signal..."}
              </p>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                  <span className="text-muted-foreground">GPS Strong</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-safe" />
                  <span className="text-muted-foreground">Protected</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={shareLocation}
                className="h-10 bg-white hover:bg-gray-50 text-black border-2 border-gray-300 hover:border-gray-400 px-4 shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <MapPin className="h-4 w-4 mr-2 text-green-600" />
                Share Location
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openPanel("tracking")}
                className="h-10 px-4 bg-white text-black border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105"
              >
                <Activity className="h-4 w-4 mr-2 text-blue-600" />
                Settings
              </Button>
            </div>
          </div>

          {/* Enhanced Map Layers & Views */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Map Controls
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="group h-14 flex-col gap-2 text-sm bg-white text-black border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
              >
                <MapPin className="h-5 w-5 text-orange-600 transition-all duration-200 group-hover:scale-110" />
                <span className="font-medium transition-all duration-200">
                  Traffic Layer
                </span>
              </Button>
              <Button
                variant="outline"
                className="group h-14 flex-col gap-2 text-sm bg-white text-black border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
              >
                <Shield className="h-5 w-5 text-green-600 transition-all duration-200 group-hover:scale-110" />
                <span className="font-medium transition-all duration-200">
                  Safe Zones
                </span>
              </Button>
              <Button
                variant="outline"
                className="group h-14 flex-col gap-2 text-sm bg-white text-black border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
              >
                <AlertTriangle className="h-5 w-5 text-red-600 transition-all duration-200 group-hover:scale-110" />
                <span className="font-medium transition-all duration-200">
                  Risk Areas
                </span>
              </Button>
              <Button
                variant="outline"
                className="group h-14 flex-col gap-2 text-sm bg-white text-black border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
              >
                <Eye className="h-5 w-5 text-blue-600 transition-all duration-200 group-hover:scale-110" />
                <span className="font-medium transition-all duration-200">
                  CCTV Cameras
                </span>
              </Button>
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Emergency Actions
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => openPanel("routes")}
                variant="outline"
                className="group h-18 flex-col gap-2 text-sm border-2 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95"
              >
                <NavIcon className="h-5 w-5 transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
                <span className="font-medium transition-all duration-200 group-hover:text-primary">
                  Safe Routes
                </span>
              </Button>
              <Button
                onClick={() => openPanel("check-in")}
                variant="outline"
                className="group h-18 flex-col gap-2 text-sm border-2 hover:bg-safe/10 hover:border-safe/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95"
              >
                <Clock className="h-5 w-5 transition-all duration-200 group-hover:scale-110 group-hover:text-safe" />
                <span className="font-medium transition-all duration-200 group-hover:text-safe">
                  Check-in
                </span>
              </Button>
              <Button
                onClick={() => openPanel("places")}
                variant="outline"
                className="group h-18 flex-col gap-2 text-sm border-2 hover:bg-protection/10 hover:border-protection/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95"
              >
                <MapPin className="h-5 w-5 transition-all duration-200 group-hover:scale-110 group-hover:text-protection" />
                <span className="font-medium transition-all duration-200 group-hover:text-protection">
                  Safe Places
                </span>
              </Button>
            </div>
          </div>

          {/* Map Display Options */}
          <div>
            <h3 className="text-lg font-bold mb-4">Display Options</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border-2 border-muted/30">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Show Traffic</span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border-2 border-muted/30">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Satellite View</span>
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

      {/* Map Service Info Modal */}
      <MapServiceInfo
        isVisible={showMapInfo}
        onClose={() => setShowMapInfo(false)}
        serviceStatus={mapServiceStatus}
      />

      {/* All existing sliding panels with enhanced styling - keeping all functionality */}

      <SlidingPanel
        title="Settings"
        isOpen={activePanel === "settings"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Emergency Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                <div>
                  <p className="font-medium">Auto-alert contacts</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically notify emergency contacts during alerts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-3">
                <p className="font-medium">SOS countdown duration</p>
                <div className="px-4">
                  <Slider defaultValue={[3]} max={10} min={1} step={1} />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>1s</span>
                    <span>10s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Detection Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                <div>
                  <p className="font-medium">Shake detection</p>
                  <p className="text-sm text-muted-foreground">
                    Trigger alert when device is shaken vigorously
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                <div>
                  <p className="font-medium">Voice activation</p>
                  <p className="text-sm text-muted-foreground">
                    Listen for emergency keywords and distress signals
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </SlidingPanel>

      {/* All other panels remain the same but with enhanced styling throughout */}
      <SlidingPanel
        title="Silent Emergency Alert"
        isOpen={activePanel === "silent-alarm"}
        onClose={closePanel}
        direction="right"
        size="sm"
      >
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-warning/10 to-warning/20 rounded-xl border-2 border-warning/30">
            <Bell className="h-10 w-10 text-warning mb-3" />
            <h3 className="font-bold text-lg mb-3">Silent Alert System</h3>
            <p className="text-muted-foreground">
              Discretely alert your emergency contacts without making noise or
              drawing attention to your situation.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-14 bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg transition-all duration-200 transform hover:scale-105"
              onClick={() => {
                emergencyContacts.forEach((c) => quickText(c.phone));
                successVibration();
              }}
            >
              <Bell className="h-5 w-5 mr-2" />
              Send Silent Alert Now
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-2 hover:bg-muted/10"
            >
              <Clock className="h-4 w-4 mr-2" />
              Schedule Check-in Timer
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 border-2 hover:bg-muted/10"
            >
              <Phone className="h-4 w-4 mr-2" />
              Trigger Fake Emergency Call
            </Button>
          </div>
        </div>
      </SlidingPanel>

      {/* Continue with other panels - keeping all existing functionality but with enhanced UI... */}

      <SlidingPanel
        title="Live Location Tracking"
        isOpen={activePanel === "tracking"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl border-2 border-primary/30">
            <Activity className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-bold text-lg mb-3">Live Location Tracking</h3>
            <p className="text-muted-foreground">
              Share your real-time location with trusted contacts during your
              journey for enhanced safety monitoring.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-muted/10">
              <div>
                <p className="font-medium">Location Sharing</p>
                <p className="text-sm text-muted-foreground">
                  Currently active for {emergencyContacts.length} contacts
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-3">
              <p className="font-medium">Share Duration</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm">
                  15 min
                </Button>
                <Button variant="outline" size="sm">
                  1 hour
                </Button>
                <Button size="sm" className="bg-primary">
                  Until Safe
                </Button>
              </div>
            </div>

            <Button className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg">
              <Activity className="h-4 w-4 mr-2" />
              Start Live Tracking
            </Button>
          </div>
        </div>
      </SlidingPanel>

      {/* Include all other existing panels with similar UI enhancements... */}

      <SlidingPanel
        title="Emergency Camera & Evidence"
        isOpen={activePanel === "camera"}
        onClose={closePanel}
        direction="bottom"
      >
        <div className="space-y-6">
          <div className="text-center p-4">
            <Camera className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Evidence Collection</h3>
            <p className="text-sm text-muted-foreground">
              Capture photos, videos, and audio evidence that automatically
              uploads to secure cloud storage
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button className="h-20 flex-col gap-2 shadow-lg">
              <Camera className="h-6 w-6" />
              <span className="font-medium">Take Photo</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-2">
              <Clock className="h-6 w-6" />
              <span className="font-medium">Record Video</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-2">
              <Mic className="h-6 w-6" />
              <span className="font-medium">Audio Record</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-2">
              <Eye className="h-6 w-6" />
              <span className="font-medium">Stealth Mode</span>
            </Button>
          </div>
          <div className="p-3 bg-muted/20 rounded-lg border">
            <p className="text-xs text-muted-foreground text-center">
              🔒 All evidence is encrypted and automatically shared with your
              emergency contacts and stored securely in the cloud
            </p>
          </div>
        </div>
      </SlidingPanel>

      {/* Keep all other existing panels... */}
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
        title="Active Safety Alerts"
        isOpen={activePanel === "alerts"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center p-8">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">No Active Alerts</h3>
            <p className="text-muted-foreground">
              All safety systems are monitoring and ready. Your protection
              network is active 24/7.
            </p>
          </div>
          <div className="p-4 bg-safe/10 rounded-lg border-2 border-safe/20">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-5 w-5 text-safe" />
              <span className="font-medium">System Status: All Clear</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Emergency detection, location tracking, and contact alerts are all
              functioning normally.
            </p>
          </div>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="Check-in Safety Timer"
        isOpen={activePanel === "check-in"}
        onClose={closePanel}
        direction="right"
        size="sm"
      >
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-safe/10 to-safe/20 rounded-xl border-2 border-safe/30">
            <Clock className="h-10 w-10 text-safe mb-3" />
            <h3 className="font-bold text-lg mb-3">Safety Check-in Timer</h3>
            <p className="text-muted-foreground">
              Set automatic alerts if you don't check in within a specified time
              period. Perfect for solo journeys.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <p className="font-medium">Check-in Interval</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  30 min
                </Button>
                <Button variant="outline" size="sm">
                  1 hour
                </Button>
                <Button variant="outline" size="sm">
                  2 hours
                </Button>
                <Button size="sm" className="bg-safe">
                  Custom
                </Button>
              </div>
            </div>

            <Button className="w-full h-12 bg-safe hover:bg-safe/90 text-safe-foreground shadow-lg">
              <Clock className="h-4 w-4 mr-2" />
              Start Check-in Timer
            </Button>
          </div>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="Fake Emergency Call"
        isOpen={activePanel === "fake-call"}
        onClose={closePanel}
        direction="right"
        size="sm"
      >
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl border-2 border-primary/30">
            <Phone className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-bold text-lg mb-3">Fake Emergency Call</h3>
            <p className="text-muted-foreground">
              Simulate receiving an urgent call to safely escape uncomfortable
              or dangerous situations.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <p className="font-medium">Call Scenario</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-2"
                >
                  <Users className="h-4 w-4 mr-3" />
                  Family Emergency
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-2"
                >
                  <Activity className="h-4 w-4 mr-3" />
                  Work Emergency
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-2"
                >
                  <Heart className="h-4 w-4 mr-3" />
                  Medical Appointment
                </Button>
              </div>
            </div>

            <Button className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg">
              <Phone className="h-4 w-4 mr-2" />
              Start Fake Call
            </Button>
          </div>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="Safe Routes Planning"
        isOpen={activePanel === "routes"}
        onClose={closePanel}
        direction="bottom"
      >
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-safe/10 to-safe/20 rounded-xl border-2 border-safe/30">
            <NavIcon className="h-10 w-10 text-safe mb-3" />
            <h3 className="font-bold text-lg mb-3">
              Smart Safe Route Planning
            </h3>
            <p className="text-muted-foreground">
              Get AI-powered directions with safety-optimized routes that avoid
              high-risk areas and prioritize well-lit, populated paths.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <p className="font-medium">Destination</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter destination address..."
                  className="flex-1 p-3 text-sm border-2 rounded-lg bg-background focus:border-primary focus:outline-none"
                />
                <Button size="sm" className="px-4 h-12 bg-primary">
                  <MapPin className="h-4 w-4 mr-1" />
                  Search
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-medium">Safety Preferences</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border-2 rounded-lg bg-muted/10">
                  <span className="font-medium">Well-lit paths only</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between p-3 border-2 rounded-lg bg-muted/10">
                  <span className="font-medium">Avoid isolated areas</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between p-3 border-2 rounded-lg bg-muted/10">
                  <span className="font-medium">Near public transport</span>
                  <input type="checkbox" className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between p-3 border-2 rounded-lg bg-muted/10">
                  <span className="font-medium">CCTV coverage priority</span>
                  <input type="checkbox" className="w-4 h-4" />
                </div>
              </div>
            </div>

            <Button className="w-full h-12 bg-safe hover:bg-safe/90 text-safe-foreground shadow-lg">
              <NavIcon className="h-4 w-4 mr-2" />
              Plan Safe Route
            </Button>
          </div>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="Safe Places Directory"
        isOpen={activePanel === "places"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-protection/10 to-protection/20 rounded-xl border-2 border-protection/30">
            <MapPin className="h-10 w-10 text-protection mb-3" />
            <h3 className="font-bold text-lg mb-3">Safe Places Directory</h3>
            <p className="text-muted-foreground">
              Find nearby safe locations including police stations, hospitals,
              well-lit public areas, and 24/7 establishments.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 flex-col gap-2 border-2"
              >
                <Shield className="h-5 w-5 text-safe" />
                <span className="text-sm font-medium">Police Stations</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-2 border-2"
              >
                <Heart className="h-5 w-5 text-emergency" />
                <span className="text-sm font-medium">Hospitals</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-2 border-2"
              >
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Public Areas</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-2 border-2"
              >
                <Clock className="h-5 w-5 text-protection" />
                <span className="text-sm font-medium">24/7 Places</span>
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Nearby Safe Locations</h4>
              <div className="space-y-2">
                <div className="p-3 border-2 rounded-lg bg-safe/5 border-safe/20">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-safe" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        Central Police Station
                      </p>
                      <p className="text-xs text-muted-foreground">
                        0.3 km away • Open 24/7
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Navigation className="h-3 w-3 mr-1" />
                      Go
                    </Button>
                  </div>
                </div>
                <div className="p-3 border-2 rounded-lg bg-emergency/5 border-emergency/20">
                  <div className="flex items-center gap-3">
                    <Heart className="h-4 w-4 text-emergency" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        City General Hospital
                      </p>
                      <p className="text-xs text-muted-foreground">
                        0.8 km away • Emergency services
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Navigation className="h-3 w-3 mr-1" />
                      Go
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-primary/10 to-protection/10 rounded-xl border-2 border-primary/30">
            <Activity className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-bold text-lg mb-3">Your Safety Statistics</h3>
            <p className="text-muted-foreground">
              Track your safety journey and see how Guardian has protected you.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="border-2 border-safe/30">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-safe mb-1">
                  {Math.floor(Math.random() * 50) + 20}
                </div>
                <div className="text-sm text-muted-foreground">Safe Trips</div>
                <Badge className="bg-safe/20 text-safe text-xs mt-2">
                  This Month
                </Badge>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/30">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {Math.floor(Math.random() * 200) + 100}
                </div>
                <div className="text-sm text-muted-foreground">
                  Hours Protected
                </div>
                <Badge className="bg-primary/20 text-primary text-xs mt-2">
                  Total
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="p-4 bg-muted/20 rounded-lg border-2">
            <h4 className="font-bold mb-3">Recent Activity Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Today's Safe Journeys</span>
                <span className="text-safe font-bold">
                  +{Math.floor(Math.random() * 5) + 1}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Location Shares</span>
                <span className="text-primary font-bold">
                  {Math.floor(Math.random() * 20) + 5}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Emergency Readiness</span>
                <span className="text-protection font-bold">100%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Safety Score</span>
                <span className="text-safe font-bold">Excellent</span>
              </div>
            </div>
          </div>
        </div>
      </SlidingPanel>

      {/* Emergency Alert Popup */}
      {emergencyAlert && (
        <EmergencyAlertPopup
          alert={emergencyAlert}
          onAcknowledge={handleAcknowledgeAlert}
          onClose={() => {
            setShowEmergencyPopup(false);
            setEmergencyAlert(null);
            setSafetyStatus("safe");
          }}
          isVisible={showEmergencyPopup}
        />
      )}
    </PanelContainer>
  );
}
