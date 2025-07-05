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
  Brain,
} from "lucide-react";
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
import { GuardianKeyCard } from "@/components/GuardianKeyCard";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { SOSAlertManager } from "@/components/SOSAlertManager";
import { BackgroundSafetyMonitor } from "@/components/BackgroundSafetyMonitor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MapServiceInfo } from "@/components/MapServiceInfo";
import AIInsightsPanel from "@/components/AIInsightsPanel";
import { useHapticFeedback, useGeolocation } from "@/hooks/use-device-apis";
import { useAuth } from "@/contexts/AuthContext";
import { SOSService } from "@/services/sosService";
import { useMapTheme } from "@/hooks/use-map-theme";
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
  const [showAIInsights, setShowAIInsights] = useState(false);

  const { currentUser, userProfile, logout } = useAuth();
  const { successVibration, warningVibration, emergencyVibration } =
    useHapticFeedback();
  const { location, getCurrentLocation } = useGeolocation();
  const { mapTheme, mapType, toggleTheme, toggleMapType } = useMapTheme();

  const emergencyContacts = userProfile?.emergencyContacts || [];

  // Real-time AI safety analysis with enhanced features
  useEffect(() => {
    if (location) {
      const analyzeCurrentLocation = async () => {
        try {
          const { geminiNewsAnalysisService } = await import(
            "@/services/geminiNewsAnalysisService"
          );
          const { aiThreatDetection } = await import(
            "@/services/aiThreatDetection"
          );
          const { aiCompanion } = await import("@/services/aiCompanionService");

          const analysis = await geminiNewsAnalysisService.analyzeAreaSafety(
            location.latitude,
            location.longitude,
          );

          setCurrentSafetyScore(analysis.score);

          // Update AI services with new location data
          aiThreatDetection.addLocationData({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          });

          aiCompanion.updateContext({
            currentLocation: {
              lat: location.latitude,
              lng: location.longitude,
            },
            safetyScore: analysis.score,
            isMoving: true,
          });

          // Update safety status based on score
          if (analysis.score < 40) {
            setSafetyStatus("alert");
            warningVibration();

            // Notify AI companion of safety concern
            aiCompanion.processEvent({
              type: "safety_score_change",
              data: { oldScore: currentSafetyScore, newScore: analysis.score },
            });
          } else if (analysis.score >= 80) {
            setSafetyStatus("safe");
          }

          console.log("🛡️ Current area safety analysis:", analysis);
        } catch (error) {
          console.warn("Failed to analyze current location safety:", error);
        }
      };

      // Analyze on location change with debounce
      const timeout = setTimeout(analyzeCurrentLocation, 2000);
      return () => clearTimeout(timeout);
    }
  }, [location, warningVibration, currentSafetyScore]);

  // Monitor navigation state
  useEffect(() => {
    const checkNavigationState = async () => {
      try {
        const { aiEnhancedNavigation } = await import(
          "@/services/aiEnhancedNavigation"
        );
        const navState = aiEnhancedNavigation.getNavigationState();

        if (navState?.isNavigating && !isNavigating) {
          setIsNavigating(true);
          setNavigationRoute(navState.route);
          console.log("🧭 Navigation state activated");
        } else if (!navState?.isNavigating && isNavigating) {
          setIsNavigating(false);
          setNavigationRoute(null);
          console.log("🛑 Navigation state deactivated");
        }
      } catch (error) {
        console.warn("Failed to check navigation state:", error);
      }
    };

    const interval = setInterval(checkNavigationState, 3000);
    return () => clearInterval(interval);
  }, [isNavigating]);

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
          alert("Location copied to clipboard!");
        } catch (error) {
          console.error("Copy failed:", error);
          alert("Failed to copy location");
        }
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

  const statusColors = {
    safe: "bg-safe text-safe-foreground",
    alert: "bg-warning text-warning-foreground",
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
            {/* Real-time AI Status Indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">AI Active</span>
              </div>
              <Badge
                variant="outline"
                className="text-xs border-gray-300 text-black bg-gray-50"
              >
                Score: {currentSafetyScore}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="h-7 px-2 text-xs border-gray-300 text-black hover:bg-gray-100"
              >
                <Brain className="h-3 w-3 mr-1" />
                Insights
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
              {/* Interactive Enhanced Google Map Full Screen */}
              <div className="absolute inset-0">
                <EnhancedGoogleMap
                  location={location}
                  mapTheme={mapTheme}
                  mapType={mapType}
                  showTraffic={true}
                  showSafeZones={true}
                  showEmergencyServices={true}
                  zoomLevel={15}
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
                    onClick={() => setShowAIInsights(true)}
                    className="text-xs px-2 py-1 h-6 text-gray-600 hover:text-black"
                  >
                    AI Details
                  </Button>
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <Card
                    className="group border-gray-200 bg-white cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-gray-400 transform hover:scale-105 hover:-translate-y-1 active:scale-95"
                    onClick={() => openPanel("contacts")}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-full bg-gray-100 transition-all duration-200 group-hover:bg-gray-200 group-hover:scale-110">
                          <Users className="h-4 w-4 text-black transition-all duration-200 group-hover:scale-110" />
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
                    onClick={() => openPanel("ai-analysis")}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-full bg-gray-100 transition-all duration-200 group-hover:bg-gray-200 group-hover:scale-110">
                          <Brain className="h-4 w-4 text-black transition-all duration-200 group-hover:scale-110" />
                        </div>
                        <div className="text-lg font-bold text-black transition-all duration-200 group-hover:scale-110">
                          {currentSafetyScore}
                        </div>
                        <div className="text-xs text-gray-600 transition-all duration-200 group-hover:text-black">
                          AI Safety Score
                        </div>
                        <Badge
                          className={`text-xs mt-1 transition-all duration-200 group-hover:scale-105 ${
                            currentSafetyScore >= 80
                              ? "bg-black text-white"
                              : currentSafetyScore >= 60
                                ? "bg-gray-600 text-white"
                                : "bg-gray-800 text-white"
                          }`}
                        >
                          {currentSafetyScore >= 80
                            ? "SAFE"
                            : currentSafetyScore >= 60
                              ? "CAUTION"
                              : "ALERT"}
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
                        <div className="p-2 rounded-full bg-gray-100 transition-all duration-200 group-hover:bg-gray-200 group-hover:scale-110">
                          <NavIcon className="h-4 w-4 text-black transition-all duration-200 group-hover:scale-110" />
                        </div>
                        <div className="text-lg font-bold text-black transition-all duration-200 group-hover:scale-110">
                          {isNavigating ? "ON" : "OFF"}
                        </div>
                        <div className="text-xs text-gray-600 transition-all duration-200 group-hover:text-black">
                          AI Navigation
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
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12"
                    onClick={() => openPanel("camera")}
                  >
                    <Camera className="h-4 w-4 mr-3" />
                    Camera & Evidence
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
                className="group h-12 flex-col gap-1 text-xs hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 transform hover:scale-105 hover:shadow-md active:scale-95"
              >
                <MapPin className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-primary" />
                <span className="transition-all duration-200 group-hover:text-primary group-hover:font-medium">
                  Traffic
                </span>
              </Button>
              <Button
                variant="outline"
                className="group h-12 flex-col gap-1 text-xs hover:bg-safe/10 hover:border-safe/30 transition-all duration-300 transform hover:scale-105 hover:shadow-md active:scale-95"
              >
                <Shield className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-safe" />
                <span className="transition-all duration-200 group-hover:text-safe group-hover:font-medium">
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
                className="group h-12 flex-col gap-1 text-xs hover:bg-protection/10 hover:border-protection/30 transition-all duration-300 transform hover:scale-105 hover:shadow-md active:scale-95"
              >
                <Camera className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-protection" />
                <span className="transition-all duration-200 group-hover:text-protection group-hover:font-medium">
                  CCTV
                </span>
              </Button>
            </div>
          </div>

          {/* Map Theme Controls */}
          <div>
            <h3 className="text-sm font-medium mb-3">Map Style</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={mapTheme === "light" ? "default" : "outline"}
                onClick={toggleTheme}
                className="h-10 text-xs"
              >
                {mapTheme === "light" ? "🌞" : "🌙"}{" "}
                {mapTheme === "light" ? "Light" : "Dark"}
              </Button>
              <Button
                variant={mapType === "normal" ? "default" : "outline"}
                onClick={toggleMapType}
                className="h-10 text-xs"
              >
                {mapType === "normal" ? "🗺️" : "🛰️"}{" "}
                {mapType === "normal" ? "Map" : "Satellite"}
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
                <Clock className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-safe" />
                <span className="transition-all duration-200 group-hover:text-safe group-hover:font-medium">
                  Check-in Timer
                </span>
              </Button>
              <Button
                onClick={() => openPanel("places")}
                variant="outline"
                className="group h-16 flex-col gap-1 text-xs hover:bg-protection/10 hover:border-protection/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:-translate-y-1 active:scale-95"
              >
                <MapPin className="h-4 w-4 transition-all duration-200 group-hover:scale-110 group-hover:text-protection" />
                <span className="transition-all duration-200 group-hover:text-protection group-hover:font-medium">
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

      {/* AI Insights Panel */}
      <AIInsightsPanel
        isVisible={showAIInsights}
        onClose={() => setShowAIInsights(false)}
        currentLocation={location}
        safetyScore={currentSafetyScore}
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
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <NavIcon className="h-8 w-8 text-black mb-2" />
            <h3 className="font-medium mb-2 text-black">
              AI-Powered Safe Route Planning
            </h3>
            <p className="text-sm text-gray-600">
              Get AI-analyzed routes with real-time safety scoring, avoiding
              high-risk areas and prioritizing well-lit, populated paths.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-black">Destination</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter destination..."
                  className="flex-1 p-2 text-sm border border-gray-300 rounded-lg bg-white text-black placeholder:text-gray-500"
                  onChange={async (e) => {
                    const destination = e.target.value;
                    if (destination.length > 3) {
                      console.log("🎯 Setting destination:", destination);
                      // You could add geocoding here to convert address to coordinates
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="px-3 bg-black hover:bg-gray-800 text-white border-0"
                  onClick={async () => {
                    const destinationInput = document.querySelector(
                      'input[placeholder="Enter destination..."]',
                    ) as HTMLInputElement;
                    if (destinationInput?.value) {
                      console.log(
                        "🗺️ Starting AI navigation to:",
                        destinationInput.value,
                      );

                      try {
                        const location = await getCurrentLocation();
                        // Mock destination coordinates (in real app, use geocoding)
                        const mockDestination = {
                          lat: location.latitude + 0.01,
                          lng: location.longitude + 0.01,
                        };

                        // Import and use AI enhanced navigation
                        const { aiEnhancedNavigation } = await import(
                          "@/services/aiEnhancedNavigation"
                        );
                        const route =
                          await aiEnhancedNavigation.startNavigation(
                            { lat: location.latitude, lng: location.longitude },
                            mockDestination,
                          );

                        console.log("✅ AI route created:", route);
                        successVibration();

                        // You could show a notification or update UI here
                        alert(
                          `AI Route planned! Safety score: ${route.overallSafetyScore}/100`,
                        );
                      } catch (error) {
                        console.error("❌ Navigation failed:", error);
                        warningVibration();
                        alert("Failed to plan route. Please try again.");
                      }
                    }
                  }}
                >
                  Plan Route
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-black">
                AI Safety Preferences
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
                    Real-time AI analysis
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
                  console.log(
                    "🎯 Starting quick AI navigation from current location",
                  );

                  // Quick navigation to a nearby safe point
                  const { aiEnhancedNavigation } = await import(
                    "@/services/aiEnhancedNavigation"
                  );
                  const route = await aiEnhancedNavigation.startNavigation(
                    { lat: location.latitude, lng: location.longitude },
                    {
                      lat: location.latitude + 0.005,
                      lng: location.longitude + 0.005,
                    },
                  );

                  console.log("✅ Quick AI route created:", route);
                  successVibration();

                  const insights = route.aiInsights.join(". ");
                  alert(
                    `AI Route ready! Safety: ${route.overallSafetyScore}/100\n\nAI Insights: ${insights}`,
                  );
                } catch (error) {
                  console.error("❌ Quick navigation failed:", error);
                  warningVibration();
                }
              }}
            >
              Start AI-Guided Navigation
            </Button>
          </div>
        </div>
      </SlidingPanel>

      <SlidingPanel
        title="AI Safety Analysis"
        isOpen={activePanel === "ai-analysis"}
        onClose={closePanel}
        direction="right"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-6 w-6 text-black" />
              <h3 className="font-semibold text-black">
                Current Location Analysis
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AI Safety Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-500"
                      style={{ width: `${currentSafetyScore}%` }}
                    />
                  </div>
                  <span className="font-bold text-black">
                    {currentSafetyScore}/100
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-600">
                {currentSafetyScore >= 80
                  ? "✅ Excellent safety conditions detected. Area shows high population density, good lighting, and low incident rates."
                  : currentSafetyScore >= 60
                    ? "⚠️ Moderate safety conditions. Standard precautions recommended. Stay aware of surroundings."
                    : "🚨 Enhanced caution advised. Consider alternative routes or travel with others."}
              </div>
            </div>
          </div>

          {isNavigating && navigationRoute && (
            <div className="p-4 bg-black rounded-lg text-white">
              <div className="flex items-center gap-2 mb-3">
                <NavIcon className="h-5 w-5" />
                <h4 className="font-medium">Active AI Navigation</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  Route Safety: {navigationRoute.overallSafetyScore}/100
                </div>
                <div>
                  Distance: {(navigationRoute.totalDistance / 1000).toFixed(1)}
                  km
                </div>
                <div>
                  Est. Time: {Math.round(navigationRoute.totalTime / 60)}min
                </div>
                {navigationRoute.aiInsights &&
                  navigationRoute.aiInsights.length > 0 && (
                    <div className="mt-2 text-xs">
                      <div className="font-medium mb-1">AI Insights:</div>
                      <div>{navigationRoute.aiInsights[0]}</div>
                    </div>
                  )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-black">AI Features</h4>
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
                      successVibration();
                      console.log("🔄 AI analysis refreshed:", analysis);
                    } catch (error) {
                      console.error("Failed to refresh analysis:", error);
                    }
                  }
                }}
              >
                Refresh Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-gray-300 text-black hover:bg-gray-100"
                onClick={() => openPanel("routes")}
              >
                AI Routes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-gray-300 text-black hover:bg-gray-100"
                onClick={() => {
                  console.log("🎯 AI Insights:", {
                    safetyScore: currentSafetyScore,
                    isNavigating,
                    location,
                    timestamp: new Date().toISOString(),
                  });
                  alert(
                    `AI Safety Insights:\n\nCurrent Score: ${currentSafetyScore}/100\nLocation: ${location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Unknown"}\nNavigation: ${isNavigating ? "Active" : "Inactive"}`,
                  );
                }}
              >
                View Insights
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
              className="h-16 flex-col gap-1 text-xs border-gray-300 text-black hover:bg-gray-100"
            >
              <Camera className="h-4 w-4" />
              Evidence
            </Button>
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
              AI Routes
            </Button>
          </div>
        </div>
      </SlidingPanel>
    </PanelContainer>
  );
}
