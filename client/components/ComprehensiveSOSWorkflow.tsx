import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  Phone,
  MessageSquare,
  Copy,
  Check,
  X,
  Clock,
  Navigation,
  Volume2,
  VolumeX,
  Settings,
  Users,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useSlideDownNotifications } from "@/components/SlideDownNotifications";
import { EnhancedSOSSystem } from "@/components/EnhancedSOSSystem";
import { SOSLocationDisplay } from "@/components/SOSLocationDisplay";
import {
  notificationSettingsService,
  shouldShowNotification,
} from "@/services/notificationSettingsService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SOSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
}

interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  message: string;
  location: SOSLocation;
  timestamp: Date;
  status: "active" | "cancelled" | "resolved";
  responses: any[];
}

interface ComprehensiveSOSWorkflowProps {
  map?: google.maps.Map | null;
  onStartNavigation?: (location: SOSLocation) => void;
  className?: string;
}

export function ComprehensiveSOSWorkflow({
  map,
  onStartNavigation,
  className,
}: ComprehensiveSOSWorkflowProps) {
  const { userProfile } = useAuth();
  const { addNotification } = useSlideDownNotifications();

  const [sosLocations, setSOSLocations] = useState<
    Array<{
      id: string;
      userId: string;
      userName: string;
      location: SOSLocation;
      message: string;
      status: "active" | "cancelled" | "resolved";
      lastUpdate: Date;
    }>
  >([]);

  const [notificationSettings, setNotificationSettings] = useState(
    notificationSettingsService.getSettings(),
  );
  const [emergencyContacts, setEmergencyContacts] = useState(
    userProfile?.emergencyContacts || [],
  );

  useEffect(() => {
    // Load notification settings
    const settings = notificationSettingsService.getSettings();
    setNotificationSettings(settings);

    // Update emergency contacts
    if (userProfile?.emergencyContacts) {
      setEmergencyContacts(userProfile.emergencyContacts);
    }
  }, [userProfile]);

  const handleSOSLocationReceived = useCallback(
    (location: SOSLocation) => {
      console.log("📍 SOS Location received:", location);

      // Show on map if available
      if (map) {
        map.panTo({
          lat: location.latitude,
          lng: location.longitude,
        });
        map.setZoom(16);
      }

      // Only show notification if enabled
      if (shouldShowNotification("sosAlerts")) {
        addNotification({
          type: "error",
          title: "🚨 SOS Location Update",
          message: `Location updated: ${location.address || "Coordinates available"}`,
          persistent: true,
        });
      }
    },
    [map, addNotification],
  );

  const handleSOSAlert = useCallback(
    (alert: SOSAlert) => {
      console.log("🚨 SOS Alert:", alert);

      // Add to SOS locations for map display
      setSOSLocations((prev) => [
        ...prev.filter((item) => item.id !== alert.id),
        {
          id: alert.id,
          userId: alert.userId,
          userName: alert.userName,
          location: alert.location,
          message: alert.message,
          status: alert.status,
          lastUpdate: alert.timestamp,
        },
      ]);

      // Show high-priority notification
      if (shouldShowNotification("sosAlerts")) {
        addNotification({
          type: "error",
          title: "🚨 EMERGENCY ALERT SENT",
          message: `SOS sent to ${emergencyContacts.length} contacts. Location sharing active.`,
          persistent: true,
          action: {
            label: "View on Map",
            onClick: () => {
              if (map) {
                map.panTo({
                  lat: alert.location.latitude,
                  lng: alert.location.longitude,
                });
                map.setZoom(16);
              }
            },
          },
        });
      }
    },
    [emergencyContacts.length, map, addNotification],
  );

  const handleNavigateToSOS = useCallback(
    (location: SOSLocation) => {
      if (map) {
        map.panTo({
          lat: location.latitude,
          lng: location.longitude,
        });
        map.setZoom(17);
      }
      toast.success("Viewing SOS location on map");
    },
    [map],
  );

  const handleStartNavigation = useCallback(
    (location: SOSLocation) => {
      // Trigger the parent navigation handler
      onStartNavigation?.(location);

      // Also pan to location on map
      if (map) {
        map.panTo({
          lat: location.latitude,
          lng: location.longitude,
        });
        map.setZoom(17);
      }

      toast.success("Navigation started to emergency location!");
    },
    [map, onStartNavigation],
  );

  const handleDismissSOS = useCallback((sosId: string) => {
    setSOSLocations((prev) => prev.filter((item) => item.id !== sosId));
    toast.success("SOS alert dismissed");
  }, []);

  const updateNotificationSetting = (
    key: keyof typeof notificationSettings,
    value: boolean,
  ) => {
    notificationSettingsService.updateSetting(key, value);
    setNotificationSettings(notificationSettingsService.getSettings());
    toast.success(
      `${notificationSettingsService.getSettingLabel(key)} ${value ? "enabled" : "disabled"}`,
    );
  };

  const testEmergencyWorkflow = async () => {
    toast.info("Testing emergency workflow...");

    // Simulate an SOS alert for testing
    const testAlert: SOSAlert = {
      id: `test_${Date.now()}`,
      userId: "test_user",
      userName: "Test User",
      message: "🚨 TEST EMERGENCY ALERT - This is a test of the SOS system",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        timestamp: Date.now(),
        address: "Test Location, San Francisco, CA",
      },
      timestamp: new Date(),
      status: "active",
      responses: [],
    };

    handleSOSAlert(testAlert);
    setTimeout(() => {
      setSOSLocations((prev) =>
        prev.map((item) =>
          item.id === testAlert.id ? { ...item, status: "resolved" } : item,
        ),
      );
      toast.success("Test emergency workflow completed");
    }, 5000);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* SOS Location Display on Map */}
      <SOSLocationDisplay
        sosLocations={sosLocations}
        map={map}
        onNavigateToSOS={handleNavigateToSOS}
        onDismissSOS={handleDismissSOS}
        onStartNavigation={handleStartNavigation}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Emergency SOS System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sos">SOS</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            <TabsContent value="sos" className="space-y-4">
              <EnhancedSOSSystem
                onSOSLocationReceived={handleSOSLocationReceived}
                onSOSAlert={handleSOSAlert}
              />

              {/* Test Button for Development */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Test Emergency System
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Test the complete SOS workflow to ensure everything works
                    correctly.
                  </p>
                  <Button
                    onClick={testEmergencyWorkflow}
                    variant="outline"
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Test Emergency Workflow
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {notificationSettingsService.getSettingLabel(
                            key as keyof typeof notificationSettings,
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notificationSettingsService.getSettingDescription(
                            key as keyof typeof notificationSettings,
                          )}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) =>
                          updateNotificationSetting(
                            key as keyof typeof notificationSettings,
                            checked,
                          )
                        }
                      />
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => {
                        notificationSettingsService.resetToDefaults();
                        setNotificationSettings(
                          notificationSettingsService.getSettings(),
                        );
                        toast.success("Settings reset to defaults");
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    🔇 Location Notifications Disabled
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Location sharing notifications are turned OFF by default to
                    reduce notification noise. SOS alerts remain enabled for
                    safety.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Emergency Contacts ({emergencyContacts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {emergencyContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-muted-foreground mb-2">
                        No Emergency Contacts
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add emergency contacts to enable SOS functionality
                      </p>
                      <Button variant="outline">Add Emergency Contact</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {emergencyContacts.map((contact, index) => (
                        <div
                          key={contact.id || index}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold">
                                {contact.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {contact.phone}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(contact as any).relationship ||
                                  "Emergency Contact"}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-green-800 mb-2">
                    📱 Internal Sharing Only
                  </h3>
                  <p className="text-sm text-green-700">
                    SOS messages are copied to your clipboard for manual
                    sharing. No external apps (mail, etc.) are opened
                    automatically, giving you full control.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
