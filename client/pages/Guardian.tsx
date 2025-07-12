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
  Clock,
  Activity,
  User,
  Bell,
  Mic,
  LogOut,
  Key,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  SlidingPanel,
  PanelContainer,
  TabSwitcher,
} from "@/components/SlidingPanel";
import { EmergencyDetection } from "@/components/EmergencyDetection";
import { SafetyMap } from "@/components/SafetyMap";
import { GoogleMap as EnhancedGoogleMap } from "@/components/SimpleEnhancedGoogleMap";
import { SlideUpPanel } from "@/components/SlideUpPanel";
import { MagicNavbar } from "@/components/MagicNavbar";
import { RealTimeSOSTracker } from "@/components/RealTimeSOSTracker";
import { EnhancedSOSButton } from "@/components/EnhancedSOSButton";

import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { SOSAlertManager } from "@/components/SOSAlertManager";
import { BackgroundSafetyMonitor } from "@/components/BackgroundSafetyMonitor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MapServiceInfo } from "@/components/MapServiceInfo";

import { useHapticFeedback, useGeolocation } from "@/hooks/use-device-apis";
import { useAuth } from "@/contexts/AuthContext";
import { SOSService } from "@/services/sosService";
import { useMapTheme } from "@/hooks/use-map-theme";
import {
  routeCalculationService,
  type RouteOption,
  type RouteCalculationResult,
} from "@/services/routeCalculationService";
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
  const [showMapInfo, setShowMapInfo] = useState(false);
  const [mapServiceStatus, setMapServiceStatus] = useState<
    "google" | "offline" | "error"
  >("google");
  const [currentSafetyScore, setCurrentSafetyScore] = useState(85);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationRoute, setNavigationRoute] = useState<any>(null);
  const [routeOptions, setRouteOptions] =
    useState<RouteCalculationResult | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const [showTraffic, setShowTraffic] = useState(false);
  const [enableSatelliteView, setEnableSatelliteView] = useState(false);

  const { currentUser, userProfile, logout } = useAuth();
  const { successVibration, warningVibration, emergencyVibration } =
    useHapticFeedback();
  const { location, getCurrentLocation } = useGeolocation();
  const { mapTheme, mapType, toggleTheme, toggleMapType } = useMapTheme();

  const emergencyContacts = userProfile?.emergencyContacts || [];

  // Gemini API-based safety analysis
  useEffect(() => {
    if (location) {
      const analyzeLocationSafety = async () => {
        try {
          const { geminiNewsAnalysisService } = await import(
            "@/services/geminiNewsAnalysisService"
          );

          const analysis = await geminiNewsAnalysisService.analyzeAreaSafety(
            location.latitude,
            location.longitude,
          );

          setCurrentSafetyScore(analysis.score);

          // Update safety status based on Gemini analysis
          if (analysis.score >= 70) {
            setSafetyStatus("safe");
          } else if (analysis.score >= 40) {
            setSafetyStatus("alert");
          } else {
            setSafetyStatus("emergency");
            warningVibration();
          }

          console.log("🧠 Gemini safety analysis:", analysis);
        } catch (error) {
          console.warn("Gemini analysis failed, using fallback:", error);
          // Fallback safety logic
          const hour = new Date().getHours();
          if (hour >= 6 && hour <= 20) {
            setSafetyStatus("safe");
            setCurrentSafetyScore(75);
          } else {
            setSafetyStatus("alert");
            setCurrentSafetyScore(60);
          }
        }
      };

      const timeout = setTimeout(analyzeLocationSafety, 2000);
      return () => clearTimeout(timeout);
    }
  }, [location, warningVibration]);

  // Basic navigation state monitoring
  useEffect(() => {
    // Simple navigation state updates
    const updateNavigationState = () => {
      // Navigation state will be controlled by user actions
      console.log("Navigation monitoring active");
    };

    const interval = setInterval(updateNavigationState, 10000);
    return () => clearInterval(interval);
  }, []);

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
      const message = `Guardian Alert: I'm at coordinates ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;

      if (navigator.share) {
        await navigator.share({
          title: "Guardian Location",
          text: message,
        });
      } else {
        // Copy to clipboard with fallback
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(message);
          } else {
            const textArea = document.createElement("textarea");
            textArea.value = message;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
          }
          toast.success("Location copied to clipboard!");
        } catch (error) {
          console.error("Copy failed:", error);
          toast.error("Failed to copy location");
        }
      }
      successVibration();
    } catch (error) {
      console.error("Share failed:", error);
    }
  }, [getCurrentLocation, successVibration]);

  const quickCall = useCallback(
    (phone: string) => {
      // Internal call handling - copy number to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(phone);
        toast.success(`Phone number ${phone} copied to clipboard`);
      } else {
        toast.info(`Emergency number: ${phone}`);
      }
      warningVibration();
    },
    [warningVibration],
  );

  const statusColors = {
    safe: "bg-black text-white",
    alert: "bg-black text-white",
    emergency: "bg-emergency text-emergency-foreground animate-pulse",
  };

  // Only map and profile tabs now - controlled by bottom nav

  return (
    <PanelContainer className="bg-white">
      {/* Main Interface */}
      <div className="h-full flex flex-col pb-20 px-4">
        {/* Status Bar */}
        <div className="py-4 px-2 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
                <Shield className="h-4 w-4 text-black" />
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`${safetyStatus === "safe" ? "bg-black text-white" : safetyStatus === "alert" ? "bg-gray-600 text-white" : "bg-black text-white animate-pulse"}`}
                >
                  <Activity className="h-3 w-3 mr-1" />
                  {safetyStatus.toUpperCase()}
                </Badge>
                {location && (
                  <Badge
                    variant="outline"
                    className="text-xs border-gray-300 text-black"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    GPS
                  </Badge>
                )}
              </div>
            </div>
            {/* Location Status */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs border-black text-black bg-white"
              >
                <MapPin className="h-3 w-3 mr-1" />
                Location Active
              </Badge>
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
              {/* Interactive Enhanced Google Map Full Screen */}
              <div className="absolute inset-0">
                <EnhancedGoogleMap
                  location={location}
                  mapTheme={mapTheme}
                  mapType={mapType}
                  showTraffic={showTraffic}
                  showSafeZones={false}
                  showEmergencyServices={true}
                  zoomLevel={15}
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
                "h-full px-2 py-4 space-y-4 overflow-y-auto custom-scrollbar transition-all duration-700 delay-100",
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

              {/* Functional Safety Overview */}
              <div className="px-1">
                <h3 className="text-sm font-medium mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-black" />
                    <span className="text-black">Safety Overview</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPanel("safety-overview")}
                    className="text-xs px-2 py-1 h-6 text-gray-600 hover:text-black"
                  >
                    Details
                  </Button>
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <Card
                    className="group border-gray-200 bg-white cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-gray-400 transform hover:scale-105 hover:-translate-y-1 active:scale-95"
                    onClick={() => openPanel("contacts")}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-full bg-white border-2 border-black transition-all duration-200 group-hover:bg-black group-hover:scale-110">
                          <Users className="h-4 w-4 text-black transition-all duration-200 group-hover:text-white group-hover:scale-110" />
                        </div>
                        <div className="text-lg font-bold text-black transition-all duration-200 group-hover:scale-110">
                          {emergencyContacts.length}
                        </div>
                        <div className="text-xs text-gray-600 transition-all duration-200 group-hover:text-black">
                          Contacts
                        </div>
                        {emergencyContacts.length === 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs mt-1 border-gray-400 text-gray-700 transition-all duration-200 group-hover:scale-105"
                          >
                            Add Now
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="group border-gray-200 bg-white cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-gray-400 transform hover:scale-105 hover:-translate-y-1 active:scale-95"
                    onClick={() => openPanel("safety-overview")}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-full bg-white border-2 border-black transition-all duration-200 group-hover:bg-black group-hover:scale-110">
                          <Shield className="h-4 w-4 text-black transition-all duration-200 group-hover:text-white group-hover:scale-110" />
                        </div>
                        <div className="text-lg font-bold text-black transition-all duration-200 group-hover:scale-110">
                          {safetyStatus.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-600 transition-all duration-200 group-hover:text-black">
                          Safety Status
                        </div>
                        <Badge
                          className={`text-xs mt-1 transition-all duration-200 group-hover:scale-105 ${
                            safetyStatus === "safe"
                              ? "bg-black text-white"
                              : safetyStatus === "alert"
                                ? "bg-gray-600 text-white"
                                : "bg-gray-800 text-white"
                          }`}
                        >
                          {safetyStatus === "safe"
                            ? "SECURE"
                            : safetyStatus === "alert"
                              ? "CAUTION"
                              : "EMERGENCY"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="group border-gray-200 bg-white cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-gray-400 transform hover:scale-105 hover:-translate-y-1 active:scale-95"
                    onClick={() => openPanel("navigation")}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-full bg-white border-2 border-black transition-all duration-200 group-hover:bg-black group-hover:scale-110">
                          <NavIcon className="h-4 w-4 text-black transition-all duration-200 group-hover:text-white group-hover:scale-110" />
                        </div>
                        <div className="text-lg font-bold text-black transition-all duration-200 group-hover:scale-110">
                          {isNavigating ? "ON" : "OFF"}
                        </div>
                        <div className="text-xs text-gray-600 transition-all duration-200 group-hover:text-black">
                          Navigation
                        </div>
                        <Badge
                          className={`text-xs mt-1 transition-all duration-200 group-hover:scale-105 ${
                            isNavigating
                              ? "bg-black text-white animate-pulse"
                              : "bg-gray-400 text-white"
                          }`}
                        >
                          {isNavigating ? "ACTIVE" : "READY"}
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
          maxHeight={Math.floor(window.innerHeight * 0.8)}
          initialHeight={Math.floor(window.innerHeight * 0.45)}
          bottomOffset={100}
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
                Location tracking is enabled
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
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
                className="h-8 bg-black hover:bg-black/90 text-white text-xs px-3"
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
                className="group h-12 flex-col gap-1 text-xs hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 transform hover:scale-105 hover:shadow-md active:scale-95"
              >
                <MapPin className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
                <span className="transition-all duration-200 group-hover:text-primary group-hover:font-medium">
                  Traffic
                </span>
              </Button>
              <Button
                variant="outline"
                className="group h-12 flex-col gap-1 text-xs hover:bg-black/10 hover:border-black/30 transition-all duration-300 transform hover:scale-105 hover:shadow-md active:scale-95"
              >
                <Shield className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-black" />
                <span className="transition-all duration-200 group-hover:text-black group-hover:font-medium">
                  Safe Zones
                </span>
              </Button>
              <Button
                variant="outline"
                className="group h-12 flex-col gap-1 text-xs hover:bg-warning/10 hover:border-warning/30 transition-all duration-300 transform hover:scale-105 hover:shadow-md active:scale-95"
              >
                <AlertTriangle className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-warning" />
                <span className="transition-all duration-200 group-hover:text-warning group-hover:font-medium">
                  Risk Areas
                </span>
              </Button>
              <Button
                variant="outline"
                className="group h-12 flex-col gap-1 text-xs hover:bg-black/10 hover:border-black/30 transition-all duration-300 transform hover:scale-105 hover:shadow-md active:scale-95"
              >
                <Camera className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-black" />
                <span className="transition-all duration-200 group-hover:text-black group-hover:font-medium">
                  CCTV
                </span>
              </Button>
            </div>
          </div>

          {/* Enhanced Map Theme Controls */}
          <div>
            <h3 className="text-sm font-medium mb-3">Map Style & View</h3>
            <div className="space-y-3">
              {/* Theme Selector */}
              <div>
                <p className="text-xs text-gray-600 mb-2">Theme</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={toggleTheme}
                    className="h-12 flex-col gap-1 text-xs hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="text-base">
                      {mapTheme === "light"
                        ? "����"
                        : mapTheme === "dark"
                          ? "🌙"
                          : mapTheme === "safety"
                            ? "🛡️"
                            : "🌌"}
                    </span>
                    <span className="text-xs font-medium">
                      {mapTheme === "light"
                        ? "Light"
                        : mapTheme === "dark"
                          ? "Dark"
                          : mapTheme === "safety"
                            ? "Safety"
                            : "Night"}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={toggleMapType}
                    className="h-12 flex-col gap-1 text-xs hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="text-base">
                      {mapType === "normal"
                        ? "🗺️"
                        : mapType === "satellite"
                          ? "🛰️"
                          : "🏔️"}
                    </span>
                    <span className="text-xs font-medium">
                      {mapType === "normal"
                        ? "Standard"
                        : mapType === "satellite"
                          ? "Satellite"
                          : "Terrain"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Theme Description */}
              <div className="p-2 bg-gray-50 rounded-lg border">
                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-1">
                    {mapTheme === "light"
                      ? "Light Mode"
                      : mapTheme === "dark"
                        ? "Dark Mode"
                        : mapTheme === "safety"
                          ? "Safety Mode"
                          : "Night Mode"}
                  </div>
                  <div>
                    {mapTheme === "light"
                      ? "Standard daylight view with clear details"
                      : mapTheme === "dark"
                        ? "Low-light display for evening use"
                        : mapTheme === "safety"
                          ? "High-contrast view highlighting safety features"
                          : "Optimized for nighttime navigation"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => openPanel("routes")}
                variant="outline"
                className="group h-16 flex-col gap-1 text-xs hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95"
              >
                <NavIcon className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
                <span className="transition-all duration-200 group-hover:text-primary group-hover:font-medium">
                  Safe Routes
                </span>
              </Button>
              <Button
                onClick={() => openPanel("check-in")}
                variant="outline"
                className="group h-16 flex-col gap-1 text-xs hover:bg-safe/10 hover:border-safe/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95"
              >
                <Clock className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-black" />
                <span className="transition-all duration-200 group-hover:text-black group-hover:font-medium">
                  Check-in Timer
                </span>
              </Button>
              <Button
                onClick={() => openPanel("places")}
                variant="outline"
                className="group h-16 flex-col gap-1 text-xs hover:bg-protection/10 hover:border-protection/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95"
              >
                <MapPin className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-black" />
                <span className="transition-all duration-200 group-hover:text-black group-hover:font-medium">
                  Safe Places
                </span>
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
                <Switch
                  checked={showTraffic}
                  onCheckedChange={setShowTraffic}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Satellite View</span>
                </div>
                <Switch
                  checked={enableSatelliteView}
                  onCheckedChange={(checked) => {
                    setEnableSatelliteView(checked);
                    if (checked && mapType !== "satellite") {
                      toggleMapType();
                    } else if (!checked && mapType === "satellite") {
                      toggleMapType();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </SlideUpPanel>
      )}

      {/* Navigation */}
      <MagicNavbar onSOSPress={handleSOSPress} />

      {/* SOS Alert Manager */}
      <SOSAlertManager />

      {/* Map Service Info Modal */}
      <MapServiceInfo
        isVisible={showMapInfo}
        onClose={() => setShowMapInfo(false)}
        serviceStatus={mapServiceStatus}
      />

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

          <div className="space-y-4">
            <h3 className="font-medium">Developer Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Debug Console</p>
                  <p className="text-xs text-muted-foreground">
                    Show location and technical information
                  </p>
                </div>
                <Switch checked={showDebug} onCheckedChange={setShowDebug} />
              </div>

              {/* Debug Content */}
              {showDebug && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Debug Information
                  </h4>

                  {location ? (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Lat:</span>{" "}
                          {location.latitude.toFixed(6)}
                        </div>
                        <div>
                          <span className="font-medium">Lng:</span>{" "}
                          {location.longitude.toFixed(6)}
                        </div>
                        <div>
                          <span className="font-medium">Accuracy:</span> ±
                          {Math.round(location.accuracy || 0)}m
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>{" "}
                          {safetyStatus.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span>{" "}
                        {new Date().toLocaleTimeString()}
                      </div>
                      <div>
                        <span className="font-medium">Navigation:</span>{" "}
                        {isNavigating ? "Active" : "Inactive"}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600">
                      Location not available
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Platform:</span>{" "}
                        {navigator.platform}
                      </div>
                      <div>
                        <span className="font-medium">Language:</span>{" "}
                        {navigator.language}
                      </div>
                      <div>
                        <span className="font-medium">Online:</span>{" "}
                        {navigator.onLine ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
              className="w-full h-12 bg-black hover:bg-black/90 text-white"
              onClick={() => {
                successVibration();
              }}
            >
              Send Silent Alert
            </Button>
            <Button variant="outline" className="w-full">
              Schedule Check-in
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
          <div className="p-4 bg-black/5 rounded-lg border border-black/20">
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
          <div className="p-4 bg-black/5 rounded-lg border border-black/20">
            <Clock className="h-8 w-8 text-black mb-2" />
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

            <Button className="w-full bg-black hover:bg-black/90 text-white">
              Start Check-in Timer
            </Button>
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
                <div className="text-2xl font-bold text-black">
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
                <span className="text-black font-medium">
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
                <span className="text-black font-medium">100%</span>
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
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <NavIcon className="h-8 w-8 text-black mb-2" />
            <h3 className="font-medium mb-2 text-black">Safe Route Planning</h3>
            <p className="text-sm text-gray-600">
              Plan safe routes prioritizing well-lit, populated paths and
              avoiding high-risk areas based on time and location factors.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-black">
                Quick Route Planning
              </p>
              <div className="flex gap-2">
                <input
                  id="quick-route-destination"
                  type="text"
                  placeholder="Enter destination..."
                  className="flex-1 p-2 text-sm border border-gray-300 rounded-lg bg-white text-black placeholder:text-gray-500"
                />
                <Button
                  size="sm"
                  className="px-3 bg-black hover:bg-gray-800 text-white border-0"
                  onClick={async () => {
                    const destinationInput = document.getElementById(
                      "quick-route-destination",
                    ) as HTMLInputElement;
                    if (!destinationInput?.value || !location) {
                      toast.error(
                        "Please enter a destination and ensure location is available",
                      );
                      return;
                    }

                    try {
                      // Simulate destination coordinates (in real app, would use geocoding)
                      const destination = {
                        latitude:
                          location.latitude + (Math.random() - 0.5) * 0.02,
                        longitude:
                          location.longitude + (Math.random() - 0.5) * 0.02,
                      };

                      console.log(
                        "🎯 Calculating routes to:",
                        destinationInput.value,
                      );
                      const routes =
                        await routeCalculationService.calculateRoutes(
                          location,
                          destination,
                        );
                      const recommended =
                        routes.recommendedRoute === "safest"
                          ? routes.safestRoute
                          : routes.quickestRoute;

                      setIsNavigating(true);
                      setNavigationRoute(recommended);
                      successVibration();

                      toast.success(
                        `Route planned to: ${destinationInput.value}\nUsing: ${recommended.title}\nDuration: ${recommended.duration}\nDistance: ${recommended.distance}\n\nFor more options, use the Routes panel.`,
                      );
                    } catch (error) {
                      console.error("❌ Navigation failed:", error);
                      warningVibration();
                      toast.error("Failed to plan route. Please try again.");
                    }
                  }}
                >
                  Quick Plan
                </Button>
              </div>
              <div className="text-xs text-gray-600">
                Uses intelligent route selection. For full options, tap “Routes”
                below.
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-black">
                Safety Preferences
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-white">
                  <span className="text-sm text-black">
                    Prioritize well-lit paths
                  </span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-white">
                  <span className="text-sm text-black">
                    Avoid isolated areas
                  </span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-white">
                  <span className="text-sm text-black">
                    High population density preferred
                  </span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-white">
                  <span className="text-sm text-black">
                    Real-time monitoring
                  </span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-black hover:bg-gray-800 text-white border-0"
              onClick={async () => {
                try {
                  const location = await getCurrentLocation();
                  console.log("🎯 Starting navigation from current location");

                  // Start basic navigation
                  setIsNavigating(true);
                  successVibration();

                  toast.success(
                    `Navigation started from: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
                  );
                } catch (error) {
                  console.error("❌ Navigation failed:", error);
                  warningVibration();
                }
              }}
            >
              Start Safe Navigation
            </Button>
          </div>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="Safety Overview"
        isOpen={activePanel === "safety-overview"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-6 w-6 text-black" />
              <h3 className="font-semibold text-black">
                Current Safety Status
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge
                  className={`text-xs ${
                    safetyStatus === "safe"
                      ? "bg-black text-white"
                      : safetyStatus === "alert"
                        ? "bg-gray-600 text-white"
                        : "bg-red-500 text-white"
                  }`}
                >
                  {safetyStatus.toUpperCase()}
                </Badge>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  {safetyStatus === "safe"
                    ? "�� Area monitoring shows normal conditions. Standard precautions recommended."
                    : safetyStatus === "alert"
                      ? "⚠️ Elevated monitoring detected. Exercise additional caution."
                      : "🚨 Safety concerns detected. Consider alternative routes or seek assistance."}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-black">Safety Features</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-gray-300 text-black hover:bg-gray-100"
                onClick={async () => {
                  if (location) {
                    try {
                      const { geminiNewsAnalysisService } = await import(
                        "@/services/geminiNewsAnalysisService"
                      );
                      const analysis =
                        await geminiNewsAnalysisService.analyzeAreaSafety(
                          location.latitude,
                          location.longitude,
                        );
                      setCurrentSafetyScore(analysis.score);

                      // Update safety status based on analysis but don't show score
                      if (analysis.score >= 70) {
                        setSafetyStatus("safe");
                      } else if (analysis.score >= 40) {
                        setSafetyStatus("alert");
                      } else {
                        setSafetyStatus("emergency");
                      }

                      successVibration();
                      toast.success(
                        `Safety analysis updated!\nStatus: ${safetyStatus.toUpperCase()}\nKey factors: ${analysis.factors.slice(0, 2).join(", ")}`,
                      );
                    } catch (error) {
                      console.error("Failed to update analysis:", error);
                      toast.error("Failed to update safety analysis");
                    }
                  }
                }}
              >
                Update Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-gray-300 text-black hover:bg-gray-100"
                onClick={() => openPanel("routes")}
              >
                Safe Routes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-gray-300 text-black hover:bg-gray-100"
                onClick={async () => {
                  if (location) {
                    try {
                      const { geminiNewsAnalysisService } = await import(
                        "@/services/geminiNewsAnalysisService"
                      );
                      const analysis =
                        await geminiNewsAnalysisService.analyzeAreaSafety(
                          location.latitude,
                          location.longitude,
                        );

                      const details = `Safety Analysis:\n\nStatus: ${safetyStatus.toUpperCase()}\nConfidence: ${analysis.confidence}%\n\nKey Factors:\n${analysis.factors.slice(0, 3).join("\n")}\n\nLocation: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}\nTime: ${new Date().toLocaleTimeString()}`;

                      toast.info(details);
                    } catch (error) {
                      const fallbackDetails = `Safety Status: ${safetyStatus.toUpperCase()}\nLocation: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}\nTime: ${new Date().toLocaleTimeString()}`;
                      toast.info(fallbackDetails);
                    }
                  }
                }}
              >
                View Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-gray-300 text-black hover:bg-gray-100"
                onClick={() => openPanel("tracking")}
              >
                Live Tracking
              </Button>
            </div>
          </div>
        </div>
      </SlidingPanel>

      {/* Enhanced Routes Panel */}
      <SlidingPanel
        title="Route Planning"
        isOpen={activePanel === "routes"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <NavIcon className="h-6 w-6 text-black" />
              <h3 className="font-semibold text-black">Smart Route Planning</h3>
            </div>
            <p className="text-sm text-gray-600">
              Get personalized route recommendations with real-time safety
              analysis and optimization.
            </p>
          </div>

          {/* Destination Input */}
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-black">Destination</p>
              <div className="flex gap-2">
                <input
                  id="route-destination"
                  type="text"
                  placeholder="Enter destination address..."
                  className="flex-1 p-3 text-sm border border-gray-300 rounded-lg bg-white text-black placeholder:text-gray-500 focus:border-black focus:outline-none"
                />
                <Button
                  size="sm"
                  disabled={isCalculatingRoutes}
                  className="px-4 bg-black hover:bg-gray-800 text-white border-0 disabled:opacity-50"
                  onClick={async () => {
                    const destinationInput = document.getElementById(
                      "route-destination",
                    ) as HTMLInputElement;
                    if (!destinationInput?.value || !location) {
                      toast.error(
                        "Please enter a destination and ensure location is available",
                      );
                      return;
                    }

                    setIsCalculatingRoutes(true);
                    try {
                      // Simulate destination coordinates (in real app, would use geocoding)
                      const destination = {
                        latitude:
                          location.latitude + (Math.random() - 0.5) * 0.02,
                        longitude:
                          location.longitude + (Math.random() - 0.5) * 0.02,
                      };

                      console.log(
                        "🎯 Calculating routes to:",
                        destinationInput.value,
                      );
                      const routes =
                        await routeCalculationService.calculateRoutes(
                          location,
                          destination,
                        );
                      setRouteOptions(routes);
                      setSelectedRoute(
                        routes.recommendedRoute === "safest"
                          ? routes.safestRoute
                          : routes.quickestRoute,
                      );
                      successVibration();
                    } catch (error) {
                      console.error("❌ Route calculation failed:", error);
                      warningVibration();
                      toast.error(
                        "Failed to calculate routes. Please try again.",
                      );
                    } finally {
                      setIsCalculatingRoutes(false);
                    }
                  }}
                >
                  {isCalculatingRoutes ? "Calculating..." : "Plan Routes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Route Options */}
          {routeOptions && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-black">Route Options</h4>
                <Badge className="bg-black text-white text-xs">
                  Recommended:{" "}
                  {routeOptions.recommendedRoute === "safest"
                    ? "Safest"
                    : "Quickest"}
                </Badge>
              </div>

              <div className="space-y-3">
                {/* Safest Route */}
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedRoute?.id === "safest"
                      ? "border-black bg-black/5"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedRoute(routeOptions.safestRoute)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-black" />
                      <h5 className="font-medium text-black">Safest Route</h5>
                      {routeOptions.recommendedRoute === "safest" && (
                        <Badge className="bg-black text-white text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-black">
                        {routeOptions.safestRoute.duration}
                      </div>
                      <div className="text-xs text-gray-600">
                        {routeOptions.safestRoute.distance}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        routeOptions.safestRoute.safetyLevel === "high"
                          ? "bg-green-500"
                          : routeOptions.safestRoute.safetyLevel === "medium"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs text-gray-600 capitalize">
                      {routeOptions.safestRoute.safetyLevel} Safety Level
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {routeOptions.safestRoute.features
                        .slice(0, 2)
                        .map((feature, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 px-2 py-1 rounded text-xs"
                          >
                            {feature}
                          </span>
                        ))}
                    </div>
                    {routeOptions.safestRoute.warnings &&
                      routeOptions.safestRoute.warnings.length > 0 && (
                        <div className="text-orange-600 mt-1">
                          ⚠️ {routeOptions.safestRoute.warnings[0]}
                        </div>
                      )}
                  </div>
                </div>

                {/* Quickest Route */}
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedRoute?.id === "quickest"
                      ? "border-black bg-black/5"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedRoute(routeOptions.quickestRoute)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-black" />
                      <h5 className="font-medium text-black">Quickest Route</h5>
                      {routeOptions.recommendedRoute === "quickest" && (
                        <Badge className="bg-black text-white text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-black">
                        {routeOptions.quickestRoute.duration}
                      </div>
                      <div className="text-xs text-gray-600">
                        {routeOptions.quickestRoute.distance}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        routeOptions.quickestRoute.safetyLevel === "high"
                          ? "bg-green-500"
                          : routeOptions.quickestRoute.safetyLevel === "medium"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs text-gray-600 capitalize">
                      {routeOptions.quickestRoute.safetyLevel} Safety Level
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {routeOptions.quickestRoute.features
                        .slice(0, 2)
                        .map((feature, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 px-2 py-1 rounded text-xs"
                          >
                            {feature}
                          </span>
                        ))}
                    </div>
                    {routeOptions.quickestRoute.warnings &&
                      routeOptions.quickestRoute.warnings.length > 0 && (
                        <div className="text-orange-600 mt-1">
                          ⚠️ {routeOptions.quickestRoute.warnings[0]}
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Start Navigation */}
              <div className="space-y-2">
                <Button
                  className="w-full bg-black hover:bg-gray-800 text-white border-0 h-12"
                  disabled={!selectedRoute}
                  onClick={() => {
                    if (selectedRoute) {
                      setIsNavigating(true);
                      setNavigationRoute(selectedRoute);
                      successVibration();
                      toast.success(
                        `Navigation started using ${selectedRoute.title}\nDuration: ${selectedRoute.duration}\nDistance: ${selectedRoute.distance}`,
                      );
                      closePanel();
                    }
                  }}
                >
                  <NavIcon className="h-4 w-4 mr-2" />
                  Start Navigation {selectedRoute && `(${selectedRoute.type})`}
                </Button>

                <div className="text-xs text-gray-600 text-center">
                  {selectedRoute
                    ? `Selected: ${selectedRoute.title} • ${selectedRoute.duration}`
                    : "Select a route to begin navigation"}
                </div>
              </div>
            </div>
          )}

          {/* Safety Preferences */}
          <div className="space-y-2">
            <h4 className="font-medium text-black">Safety Preferences</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-white">
                <span className="text-sm text-black">
                  Avoid poorly lit areas
                </span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-white">
                <span className="text-sm text-black">
                  Prioritize busy streets
                </span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-white">
                <span className="text-sm text-black">
                  Real-time safety monitoring
                </span>
                <Switch defaultChecked />
              </div>
            </div>
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
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => openPanel("tracking")}
              variant="outline"
              className="h-16 flex-col gap-1 text-xs border-gray-300 text-black hover:bg-gray-100"
            >
              <Activity className="h-4 w-4" />
              Live Track
            </Button>
            <Button
              onClick={() => openPanel("silent-alarm")}
              className="h-16 flex-col gap-1 text-xs bg-black hover:bg-gray-800 text-white"
            >
              <Bell className="h-4 w-4" />
              Silent Alarm
            </Button>
            <Button
              onClick={() => openPanel("check-in")}
              variant="outline"
              className="h-16 flex-col gap-1 text-xs border-gray-300 text-black hover:bg-gray-100"
            >
              <Clock className="h-4 w-4" />
              Check-in
            </Button>

            <Button
              onClick={() => openPanel("routes")}
              variant="outline"
              className="h-16 flex-col gap-1 text-xs border-gray-300 text-black hover:bg-gray-100"
            >
              <NavIcon className="h-4 w-4" />
              Routes
            </Button>
          </div>
        </div>
      </SlidingPanel>
    </PanelContainer>
  );
}
