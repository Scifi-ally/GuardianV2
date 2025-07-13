import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Shield,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
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
  lastActiveTime: string;
  locationPermission: boolean;
  notificationPermission: boolean;
  profileVisibility: "public" | "contacts" | "private";
  safetyScore: number;
  weeklyActivity: number;
}

export function UserStatsManager() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    emergencyContactsCount: 0,
    activeAlertsCount: 0,
    lastActiveTime: new Date().toISOString(),
    locationPermission: false,
    notificationPermission: false,
    profileVisibility: "contacts",
    safetyScore: 0,
    weeklyActivity: 1, // Default to 1 (current day)
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
          // Continue with default stats
        }
      }

      // Get real emergency contacts count
      const emergencyContacts = userProfile?.emergencyContacts || [];

      // Calculate real weekly activity based on user data with proper date validation
      const now = new Date();
      let lastActive = now; // Default to now
      let weeklyActivity = 1; // Default to 1 day active (today)

      try {
        if (userProfile?.lastActive) {
          // Validate the date before using it
          const lastActiveDate = new Date(userProfile.lastActive);
          if (!isNaN(lastActiveDate.getTime())) {
            lastActive = lastActiveDate;
            const daysSinceActive = Math.floor(
              (now.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000),
            );
            weeklyActivity = Math.max(0, Math.min(7, 7 - daysSinceActive));
          }
        }
      } catch (error) {
        console.warn("Error calculating weekly activity:", error);
        // Use default values
      }

      setStats((prev) => ({
        ...prev,
        emergencyContactsCount: emergencyContacts.length,
        lastActiveTime: lastActive.toISOString(),
        weeklyActivity,
      }));

      // Calculate safety score based on profile completeness
      try {
        const safetyScore = calculateSafetyScore();
        setStats((prev) => ({ ...prev, safetyScore }));
      } catch (scoreError) {
        console.warn("Error calculating safety score:", scoreError);
        setStats((prev) => ({ ...prev, safetyScore: 0 }));
      }
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

  const calculateSafetyScore = (): number => {
    let score = 0;

    // Profile completeness (40 points)
    if (userProfile?.displayName || currentUser?.displayName) score += 10;
    if (userProfile?.email || currentUser?.email) score += 10;
    if (userProfile?.phone) score += 10;
    if (userProfile?.photoURL || currentUser?.photoURL) score += 10;

    // Emergency contacts (30 points)
    const contactsCount = userProfile?.emergencyContacts?.length || 0;
    score += Math.min(contactsCount * 10, 30);

    // Permissions (30 points)
    if (stats.locationPermission) score += 15;
    if (stats.notificationPermission) score += 15;

    return Math.min(score, 100);
  };

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        },
      );

      setStats((prev) => ({ ...prev, locationPermission: true }));
      // Location permission granted silently
    } catch (error) {
      // Location permission denied silently
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setStats((prev) => ({ ...prev, notificationPermission: true }));
        // Notification permission granted silently
      } else {
        // Notification permission denied silently
      }
    } catch (error) {
      // Failed to request notification permission silently
    }
  };

  const toggleProfileVisibility = () => {
    const visibilityOrder: Array<"public" | "contacts" | "private"> = [
      "public",
      "contacts",
      "private",
    ];
    const currentIndex = visibilityOrder.indexOf(stats.profileVisibility);
    const nextIndex = (currentIndex + 1) % visibilityOrder.length;
    const newVisibility = visibilityOrder[nextIndex];

    setStats((prev) => ({ ...prev, profileVisibility: newVisibility }));

    // Save to localStorage
    const updatedStats = { ...stats, profileVisibility: newVisibility };
    localStorage.setItem(
      `user-stats-${currentUser?.uid}`,
      JSON.stringify(updatedStats),
    );

    // Profile visibility set silently
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

  const getSafetyScoreColor = () => {
    if (stats.safetyScore >= 80) return "text-green-600";
    if (stats.safetyScore >= 60) return "text-yellow-600";
    return "text-red-600";
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
      {/* Activity & Permissions */}
      <Card className="border shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Activity className="h-5 w-5" />
            Activity & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center"></div>

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
                  // Profile visibility set silently
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
