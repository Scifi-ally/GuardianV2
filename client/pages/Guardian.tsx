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
} from "lucide-react";
import { GoogleMap } from "@/components/GoogleMap";
import { ModernBottomNav } from "@/components/ModernBottomNav";
import { ModernSOSButton } from "@/components/ModernSOSButton";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation, useHapticFeedback } from "@/hooks/use-device-apis";
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

  const { currentUser, userProfile, logout } = useAuth();
  const { successVibration, warningVibration, emergencyVibration } =
    useHapticFeedback();
  const { location, getCurrentLocation } = useGeolocation();

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
                    <Badge variant="outline" className="text-xs">
                      {location
                        ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                        : "Getting location..."}
                    </Badge>
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
                      onClick={() => setShowPanel("emergency")}
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

            {/* Safety Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Safety Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {emergencyContacts.length}
                    </div>
                    <div className="text-sm text-gray-600">Contacts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {safetyStatus === "emergency" ? "1" : "0"}
                    </div>
                    <div className="text-sm text-gray-600">Active Alerts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.floor(Math.random() * 50) + 10}
                    </div>
                    <div className="text-sm text-gray-600">Safe Trips</div>
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
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4" />
                        </Button>
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
                    <Button size="sm" onClick={() => setShowPanel("contacts")}>
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

      {/* Side Panels */}
      {showPanel === "contacts" && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowPanel(null)}
        >
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">Emergency Contacts</h3>
            <EmergencyContactManager />
          </div>
        </div>
      )}

      {showPanel === "settings" && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setShowPanel(null)}
        >
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6">
            <h3 className="text-xl font-bold mb-6">Settings</h3>
            <div className="space-y-4">
              <p className="text-gray-600">Settings panel content goes here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
