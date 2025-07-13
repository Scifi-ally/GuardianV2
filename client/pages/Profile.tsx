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
import { EditProfileModal } from "@/components/EditProfileModal";
import { AdvancedSettingsModal } from "@/components/AdvancedSettingsModal";
import { UserStatsManager } from "@/components/UserStatsManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InteractiveSafetyTutorial } from "@/components/InteractiveSafetyTutorial";
import { GuardianKeyCard } from "@/components/GuardianKeyCard";

import { useAuth } from "@/contexts/AuthContext";
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
  const { currentUser, userProfile, logout, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [showSafetyTutorial, setShowSafetyTutorial] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  // Debug logging
  useEffect(() => {
    console.log("🔍 Profile Debug:", {
      currentUser,
      userProfile,
      hasLogout: typeof logout === "function",
      loading,
    });
  }, [currentUser, userProfile, logout, loading]);

  useEffect(() => {
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

  // Guardian Key functionality moved to GuardianKeyCard component

  const handleEditProfile = () => {
    setEditProfileOpen(true);
  };

  const handleAdvancedSettings = () => {
    setAdvancedSettingsOpen(true);
  };

  const handleLogout = async () => {
    console.log("🔄 Attempting logout...");
    try {
      if (typeof logout !== "function") {
        console.error("❌ Logout is not a function:", logout);
        toast.error("Logout function not available");
        return;
      }

      console.log("✅ Calling logout function...");
      await logout();
      console.log("✅ Logout completed");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("❌ Failed to logout:", error);
      toast.error("Failed to logout");
    }
  };

  const emergencyContacts = userProfile?.emergencyContacts || [];

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Handle missing user data
  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">
              Account Not Found
            </h2>
            <p className="text-gray-600">Unable to load your profile data.</p>
            <p className="text-sm text-gray-500">
              This might be due to authentication issues or missing profile
              data.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Reload Page
            </Button>

            <Button
              onClick={async () => {
                try {
                  await logout();
                  window.location.href = "/signin";
                } catch (error) {
                  console.error("Logout error:", error);
                  // Force navigation even if logout fails
                  window.location.href = "/signin";
                }
              }}
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out & Go to Login
            </Button>

            <Button
              onClick={() => (window.location.href = "/signin")}
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50"
            >
              <User className="h-4 w-4 mr-2" />
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Navigation */}
      <MagicNavbar />

      {/* SOS notifications now handled by unified notification system */}

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

        {/* Guardian Key Section with QR Code */}
        <GuardianKeyCard />

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
        <ErrorBoundary>
          <UserStatsManager />
        </ErrorBoundary>

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
