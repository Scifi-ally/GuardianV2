import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  MapPin,
  AlertTriangle,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UserStats {
  emergencyContactsCount: number;
  activeAlertsCount: number;
  locationPermission: boolean;
  notificationPermission: boolean;
  profileVisibility: "public" | "contacts" | "private";
}

export function UserStatsManager() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    emergencyContactsCount: 0,
    activeAlertsCount: 0,
    locationPermission: false,
    notificationPermission: false,
    profileVisibility: "contacts",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
      checkPermissions();
    }
  }, [currentUser]);

  const loadUserStats = async () => {
    try {
      setLoading(true);

      // Load stats from localStorage as fallback
      const savedStats = localStorage.getItem(`user-stats-${currentUser?.uid}`);
      if (savedStats) {
        try {
          const parsedStats = JSON.parse(savedStats);
          // Validate the parsed stats before using them
          if (parsedStats && typeof parsedStats === "object") {
            setStats((prev) => ({ ...prev, ...parsedStats }));
          }
        } catch (parseError) {
          console.warn("Error parsing saved stats:", parseError);
        }
      }

      // Get real emergency contacts count
      const emergencyContacts = userProfile?.emergencyContacts || [];

      setStats((prev) => ({
        ...prev,
        emergencyContactsCount: emergencyContacts.length,
      }));
    } catch (error) {
      console.error("Error loading user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      // Check geolocation permission
      if ("geolocation" in navigator) {
        const locationPermission = await navigator.permissions.query({
          name: "geolocation",
        });
        setStats((prev) => ({
          ...prev,
          locationPermission: locationPermission.state === "granted",
        }));
      }

      // Check notification permission
      if ("Notification" in window) {
        setStats((prev) => ({
          ...prev,
          notificationPermission: Notification.permission === "granted",
        }));
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        },
      );

      setStats((prev) => ({ ...prev, locationPermission: true }));
      toast.success("Location permission granted!");
    } catch (error) {
      toast.error("Location permission denied");
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setStats((prev) => ({ ...prev, notificationPermission: true }));
        toast.success("Notification permission granted!");
      } else {
        toast.error("Notification permission denied");
      }
    } catch (error) {
      toast.error("Failed to request notification permission");
    }
  };

  const getVisibilityIcon = () => {
    switch (stats.profileVisibility) {
      case "public":
        return <Eye className="h-4 w-4" />;
      case "contacts":
        return <Users className="h-4 w-4" />;
      case "private":
        return <EyeOff className="h-4 w-4" />;
    }
  };

  const getVisibilityColor = () => {
    switch (stats.profileVisibility) {
      case "public":
        return "bg-blue-500";
      case "contacts":
        return "bg-green-500";
      case "private":
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <Card className="border shadow-lg bg-white">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Permissions & Privacy */}
      <Card className="border shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Settings className="h-5 w-5" />
            Permissions & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-black" />
                <div className="flex flex-col">
                  <span className="text-sm text-black">Location Services</span>
                  <span className="text-xs text-gray-500">
                    {stats.locationPermission
                      ? "GPS enabled for safety tracking"
                      : "Enable for emergency features"}
                  </span>
                </div>
              </div>
              {stats.locationPermission ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Badge className="bg-green-500 text-white">Active</Badge>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={requestLocationPermission}
                  className="text-xs bg-black text-white hover:bg-gray-800"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Turn On
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-black" />
                <div className="flex flex-col">
                  <span className="text-sm text-black">Notifications</span>
                  <span className="text-xs text-gray-500">
                    {stats.notificationPermission
                      ? "Receiving emergency alerts"
                      : "Enable for emergency alerts"}
                  </span>
                </div>
              </div>
              {stats.notificationPermission ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Badge className="bg-green-500 text-white">Active</Badge>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={requestNotificationPermission}
                  className="text-xs bg-black text-white hover:bg-gray-800"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Turn On
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getVisibilityIcon()}
                <span className="text-sm text-black">Profile Visibility</span>
              </div>
              <Select
                value={stats.profileVisibility}
                onValueChange={(value: "public" | "contacts" | "private") => {
                  setStats((prev) => ({ ...prev, profileVisibility: value }));
                  const updatedStats = { ...stats, profileVisibility: value };
                  localStorage.setItem(
                    `user-stats-${currentUser?.uid}`,
                    JSON.stringify(updatedStats),
                  );
                  toast.success(`Profile visibility set to ${value}`);
                }}
              >
                <SelectTrigger className="w-32 h-8 text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getVisibilityColor()}`}
                    ></div>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="w-40">
                  <SelectItem value="public" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Public</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="contacts" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Contacts Only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private" className="text-xs">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-3 w-3" />
                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                      <span>Private</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
