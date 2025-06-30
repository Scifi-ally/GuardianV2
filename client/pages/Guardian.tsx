import { useState, useCallback } from "react";
import {
  Home,
  Users,
  MapPin,
  Settings,
  AlertTriangle,
  Shield,
  Navigation as NavIcon,
  Phone,
  Camera,
  Activity,
  User,
  Bell,
  LogOut,
  ChevronRight,
  Clock,
  Zap,
  Map,
  MessageSquare,
  Route,
  Share,
  HelpCircle,
  X,
} from "lucide-react";
import { GoogleMap } from "@/components/GoogleMap";
import { ModernBottomNav } from "@/components/ModernBottomNav";
import { ModernSOSButton } from "@/components/ModernSOSButton";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import {
  SettingsPanel,
  CameraPanel,
  CheckInPanel,
  NotificationsPanel,
  SafeRoutesPanel,
} from "@/components/FunctionalPanels";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation, useHapticFeedback } from "@/hooks/use-device-apis";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Guardian() {
  const [activeTab, setActiveTab] = useState("map");
  const [safetyStatus, setSafetyStatus] = useState<
    "safe" | "alert" | "emergency"
  >("safe");
  const [showPanel, setShowPanel] = useState<string | null>(null);
  const [locationSharing, setLocationSharing] = useState(false);

  const { currentUser, userProfile, logout } = useAuth();
  const { successVibration, warningVibration, emergencyVibration } =
    useHapticFeedback();
  const { location, getCurrentLocation } = useGeolocation();
  const { toast } = useToast();

  const emergencyContacts = userProfile?.emergencyContacts || [];

  const handleSOSPress = useCallback(
    (alertId?: string) => {
      setSafetyStatus("emergency");
      emergencyVibration();
      if (alertId) {
        console.log("SOS Alert sent:", alertId);
      }
      // Reset after demo
      setTimeout(() => setSafetyStatus("safe"), 10000);
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
        toast({
          description: "Location copied to clipboard!",
        });
      }
      successVibration();
    } catch (error) {
      console.error("Share failed:", error);
      toast({
        title: "Share failed",
        description: "Could not share location",
        variant: "destructive",
      });
    }
  }, [getCurrentLocation, successVibration, toast]);

  const toggleLocationSharing = useCallback(() => {
    setLocationSharing((prev) => !prev);
    toast({
      description: locationSharing
        ? "Location sharing disabled"
        : "Location sharing enabled",
    });
    successVibration();
  }, [locationSharing, toast, successVibration]);

  const callEmergency = useCallback(() => {
    window.location.href = "tel:911";
    emergencyVibration();
    toast({
      description: "Calling emergency services...",
    });
  }, [emergencyVibration, toast]);

  const sendQuickAlert = useCallback(() => {
    toast({
      description: "Quick alert sent to emergency contacts",
    });
    warningVibration();
  }, [toast, warningVibration]);

  const openMapsApp = useCallback(() => {
    if (location) {
      const url = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      window.open(url, "_blank");
      toast({
        description: "Opening in Google Maps...",
      });
    }
  }, [location, toast]);

  const openContactsManager = useCallback(() => {
    setShowPanel("contacts");
    successVibration();
  }, [successVibration]);

  const statusColors = {
    safe: "bg-green-100 text-green-800 border-green-200",
    alert: "bg-orange-100 text-orange-800 border-orange-200",
    emergency: "bg-red-100 text-red-800 border-red-200",
  };

  const statusIcons = {
    safe: Shield,
    alert: AlertTriangle,
    emergency: AlertTriangle,
  };

  const StatusIcon = statusIcons[safetyStatus];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Guardian</h1>
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs", statusColors[safetyStatus])}>
                  <StatusIcon className="h-3 w-3 mr-1" />
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPanel("settings")}
            className="p-2"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden pb-20">
        {/* Map Tab */}
        {activeTab === "map" && (
          <div className="h-full flex flex-col">
            {/* Map */}
            <div className="flex-1">
              <GoogleMap
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
                className="h-full"
              />
            </div>

            {/* Quick Actions Overlay */}
            <div className="absolute bottom-24 left-4 right-4">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium">
                        Live Tracking Active
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {location
                          ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                          : "Getting location..."}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={shareLocation}
                        className="h-6 px-2"
                      >
                        <Share className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-12 flex-col gap-1 text-xs"
                      onClick={() => setShowPanel("routes")}
                    >
                      <NavIcon className="h-4 w-4" />
                      Routes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-12 flex-col gap-1 text-xs"
                      onClick={() => setShowPanel("checkin")}
                    >
                      <Clock className="h-4 w-4" />
                      Check-in
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-12 flex-col gap-1 text-xs"
                      onClick={() => setShowPanel("camera")}
                    >
                      <Camera className="h-4 w-4" />
                      Record
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-12 flex-col gap-1 text-xs"
                      onClick={callEmergency}
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="h-full overflow-y-auto p-4 space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-bold">
                      {userProfile?.displayName?.charAt(0)?.toUpperCase() ||
                        "G"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {userProfile?.displayName || "Guardian User"}
                    </h2>
                    <p className="text-gray-600 mb-3">
                      {userProfile?.email || "No email set"}
                    </p>
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guardian Key Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Your Guardian Key
                    </h3>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-primary/20">
                      <div className="text-3xl font-mono font-bold text-primary tracking-wider">
                        {userProfile?.guardianKey || "LOADING..."}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      Share this key with trusted contacts so they can connect
                      to your safety network
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (userProfile?.guardianKey) {
                          navigator.clipboard.writeText(
                            userProfile.guardianKey,
                          );
                          toast({
                            description: "Guardian Key copied to clipboard",
                          });
                        }
                      }}
                      className="flex-1"
                    >
                      Copy Key
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (userProfile?.guardianKey && navigator.share) {
                          navigator.share({
                            title: "My Guardian Key",
                            text: `My Guardian safety key is: ${userProfile.guardianKey}`,
                          });
                        }
                      }}
                      className="flex-1"
                    >
                      <Share className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency SOS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Emergency SOS
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <ModernSOSButton
                  onEmergencyTrigger={handleSOSPress}
                  emergencyContacts={emergencyContacts}
                  size="lg"
                />
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Emergency Contacts
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emergencyContacts.length > 0 ? (
                  <div className="space-y-3">
                    {emergencyContacts.slice(0, 3).map((contact, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{contact.name}</div>
                          <div className="text-sm text-gray-600">
                            {contact.phone}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              (window.location.href = `tel:${contact.phone}`)
                            }
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              (window.location.href = `sms:${contact.phone}?body=Guardian Alert: I need help!`)
                            }
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {emergencyContacts.length > 3 && (
                      <p className="text-sm text-gray-600 text-center">
                        +{emergencyContacts.length - 3} more contacts
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-3">
                      No emergency contacts added
                    </p>
                    <Button size="sm" onClick={openContactsManager}>
                      Add Contacts
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                  onClick={() => setShowPanel("settings")}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5" />
                    Settings & Preferences
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                  onClick={() => setShowPanel("notifications")}
                >
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                  onClick={() => setShowPanel("camera")}
                >
                  <div className="flex items-center gap-3">
                    <Camera className="h-5 w-5" />
                    Emergency Recording
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                  onClick={() => setShowPanel("routes")}
                >
                  <div className="flex items-center gap-3">
                    <Route className="h-5 w-5" />
                    Safe Routes
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                  onClick={sendQuickAlert}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5" />
                    Send Quick Alert
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-12"
                  onClick={() =>
                    toast({ description: "Help center opening..." })
                  }
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5" />
                    Help & Support
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-between h-12 text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <ModernBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSOSPress={handleSOSPress}
      />

      {/* Functional Panels */}
      <SettingsPanel
        isOpen={showPanel === "settings"}
        onClose={() => setShowPanel(null)}
      />

      <CameraPanel
        isOpen={showPanel === "camera"}
        onClose={() => setShowPanel(null)}
      />

      <CheckInPanel
        isOpen={showPanel === "checkin"}
        onClose={() => setShowPanel(null)}
      />

      <NotificationsPanel
        isOpen={showPanel === "notifications"}
        onClose={() => setShowPanel(null)}
      />

      <SafeRoutesPanel
        isOpen={showPanel === "routes"}
        onClose={() => setShowPanel(null)}
      />

      {/* Emergency Contacts Panel */}
      {showPanel === "contacts" && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowPanel(null)}
        >
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Emergency Contacts</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPanel(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <EmergencyContactManager />
          </div>
        </div>
      )}
    </div>
  );
}
