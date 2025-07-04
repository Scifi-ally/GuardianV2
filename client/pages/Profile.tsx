import { useState, useEffect } from "react";
import {
  User,
  Edit,
  Settings,
  LogOut,
  Copy,
  Key,
  Shield,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Users,
  Activity,
  Bell,
  Heart,
  Zap,
} from "lucide-react";
import { MagicNavbar } from "@/components/MagicNavbar";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { SOSNotificationManager } from "@/components/SOSNotification";
import { EditProfileModal } from "@/components/EditProfileModal";
import { AdvancedSettingsModal } from "@/components/AdvancedSettingsModal";
import { UserStatsManager } from "@/components/UserStatsManager";
import { ProfileErrorBoundary } from "@/components/ProfileErrorBoundary";
import { InteractiveSafetyTutorial } from "@/components/InteractiveSafetyTutorial";
import { useAuth } from "@/contexts/AuthContext";
import { EmergencyKeyService } from "@/services/emergencyKeyService";
import { SOSService } from "@/services/sosService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { copyToClipboard } from "@/lib/clipboard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      mass: 0.8,
    },
  },
};

const floatingVariants = {
  initial: { y: 0 },
  animate: {
    y: [-2, 2, -2],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const buttonVariants = {
  hover: { scale: 1.02, y: -2 },
  tap: { scale: 0.98 },
};

export default function Profile() {
  const { currentUser, userProfile, logout } = useAuth();
  const [guardianKey, setGuardianKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [showSafetyTutorial, setShowSafetyTutorial] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  useEffect(() => {
    loadGuardianKey();
    loadActiveAlerts();
  }, [currentUser]);

  const loadActiveAlerts = () => {
    if (!currentUser) {
      setActiveAlertsCount(0);
      return;
    }

    try {
      // Subscribe to active SOS alerts for this user
      const unsubscribe = SOSService.subscribeToSOSAlerts(
        currentUser.uid,
        (alerts) => {
          try {
            const activeAlerts = alerts.filter(
              (alert) => alert.status === "active",
            );
            setActiveAlertsCount(activeAlerts.length);
          } catch (filterError) {
            console.warn("Error filtering active alerts:", filterError);
            setActiveAlertsCount(0);
          }
        },
      );

      return unsubscribe;
    } catch (subscribeError) {
      console.warn("Error subscribing to active alerts:", subscribeError);
      setActiveAlertsCount(0);
      return () => {}; // Return no-op cleanup function
    }
  };

  const loadGuardianKey = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      let key = await EmergencyKeyService.getUserGuardianKey(currentUser.uid);

      if (!key) {
        const result = await EmergencyKeyService.createGuardianKey(
          currentUser.uid,
          userProfile?.displayName || currentUser.displayName || "User",
          userProfile?.email || currentUser.email || "",
        );

        if (result.success && result.guardianKey) {
          key = result.guardianKey;
          toast.success("Guardian key created successfully!");
        } else {
          toast.error("Failed to create guardian key");
        }
      }

      setGuardianKey(key || "");
    } catch (error) {
      console.error("Error loading guardian key:", error);
      toast.error("Failed to load guardian key");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (!guardianKey) {
      toast.error("No guardian key to copy");
      return;
    }

    const success = await copyToClipboard(guardianKey);
    if (success) {
      toast.success("Guardian key copied to clipboard!");
    } else {
      toast.error("Failed to copy key");
    }
  };

  const handleEditProfile = () => {
    setEditProfileOpen(true);
  };

  const handleAdvancedSettings = () => {
    setAdvancedSettingsOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const emergencyContacts = userProfile?.emergencyContacts || [];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Navigation */}
      <MagicNavbar />

      {/* SOS Notification Manager */}
      {currentUser && userProfile && (
        <SOSNotificationManager
          userId={currentUser.uid}
          userName={userProfile.displayName || "Guardian User"}
        />
      )}

      <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="border shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-gray-200">
                  <AvatarImage
                    src={userProfile?.photoURL || currentUser?.photoURL}
                    alt={
                      userProfile?.displayName ||
                      currentUser?.displayName ||
                      "User"
                    }
                  />
                  <AvatarFallback className="text-2xl font-bold bg-gray-100 text-black">
                    {(userProfile?.displayName || currentUser?.displayName)
                      ?.charAt(0)
                      ?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Shield className="h-3 w-3 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-black">
                  {userProfile?.displayName ||
                    currentUser?.displayName ||
                    "User"}
                </h1>
                {(userProfile?.email || currentUser?.email) && (
                  <div className="flex items-center gap-2 justify-center">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <p className="text-gray-600">
                      {userProfile?.email || currentUser?.email}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 w-full max-w-sm">
                <Button
                  onClick={handleEditProfile}
                  className="flex-1 h-10 text-sm"
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  onClick={handleAdvancedSettings}
                  className="flex-1 h-10 text-sm bg-black text-white hover:bg-gray-800"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Key Section */}
        <div className="space-y-4">
          <Alert className="border-gray-200 bg-gray-50">
            <Key className="h-4 w-4" />
            <AlertDescription className="text-sm text-gray-700">
              <strong>Share this unique key with trusted contacts</strong> so
              they can add you to their emergency network. When they add your
              key, you'll receive their emergency alerts.
            </AlertDescription>
          </Alert>

          <Card className="border shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <Key className="h-5 w-5 text-black" />
                Your Guardian Key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {loading ? (
                  <div className="flex-1 h-16 bg-gray-100 rounded-lg animate-pulse" />
                ) : (
                  <>
                    <div className="flex-1 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-w-0">
                      <div className="text-center">
                        <div className="font-mono text-lg sm:text-2xl tracking-widest font-bold text-black mb-1 break-all">
                          {guardianKey || "NO-KEY"}
                        </div>
                        <p className="text-xs text-gray-600">
                          Your unique Guardian identifier
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleCopyKey}
                      variant="outline"
                      size="icon"
                      disabled={!guardianKey}
                      className="h-16 w-16 rounded-lg border-gray-300 hover:bg-black hover:text-white"
                    >
                      <Copy className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>

              <p className="text-xs text-gray-600 text-center">
                Keep this key private and only share with people you trust for
                emergencies. They will receive notifications when you press the
                SOS button.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <Card className="text-center p-4 bg-white border hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="text-2xl font-bold text-black group-hover:text-blue-600 transition-colors">
              {emergencyContacts.length}
            </div>
            <div className="text-sm text-gray-600 group-hover:text-blue-500 transition-colors">
              Emergency Contacts
            </div>
            <div className="mt-1">
              {emergencyContacts.length === 0 ? (
                <span className="text-xs text-red-500">
                  ⚠ Add contacts for safety
                </span>
              ) : emergencyContacts.length < 3 ? (
                <span className="text-xs text-yellow-600">
                  👥 Add more for better coverage
                </span>
              ) : (
                <span className="text-xs text-green-600">✓ Good coverage</span>
              )}
            </div>
          </Card>
          <Card className="text-center p-4 bg-white border hover:shadow-lg transition-shadow cursor-pointer group">
            <div
              className={`text-2xl font-bold transition-colors ${
                activeAlertsCount > 0
                  ? "text-red-500 group-hover:text-red-600"
                  : "text-green-500 group-hover:text-green-600"
              }`}
            >
              {activeAlertsCount}
            </div>
            <div
              className={`text-sm transition-colors ${
                activeAlertsCount > 0
                  ? "text-gray-600 group-hover:text-red-500"
                  : "text-gray-600 group-hover:text-green-500"
              }`}
            >
              Active Alerts
            </div>
            <div className="mt-1">
              {activeAlertsCount > 0 ? (
                <span className="text-xs text-red-600">
                  ⚠ {activeAlertsCount} active emergency alert
                  {activeAlertsCount > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-xs text-green-600">✓ All clear</span>
              )}
            </div>
          </Card>
        </div>

        {/* User Stats & Activity */}
        <ProfileErrorBoundary>
          <UserStatsManager />
        </ProfileErrorBoundary>

        {/* Emergency Contacts Section */}
        <EmergencyContactManager />

        {/* Quick Actions */}
        <Card className="border shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => setShowSafetyTutorial(true)}
                variant="outline"
                className="w-full justify-start h-14 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-black">
                      Safety Tutorial
                    </div>
                    <div className="text-xs text-gray-600">
                      Learn safety features
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            <Separator />

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start h-14 text-left text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <LogOut className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">Sign Out</div>
                  <div className="text-xs text-gray-600">
                    Securely log out of your account
                  </div>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {editProfileOpen && (
          <EditProfileModal
            isOpen={editProfileOpen}
            onClose={() => setEditProfileOpen(false)}
          />
        )}
        {advancedSettingsOpen && (
          <AdvancedSettingsModal
            isOpen={advancedSettingsOpen}
            onClose={() => setAdvancedSettingsOpen(false)}
          />
        )}
        {showSafetyTutorial && (
          <InteractiveSafetyTutorial
            isOpen={showSafetyTutorial}
            onClose={() => setShowSafetyTutorial(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
