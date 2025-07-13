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
  QrCode,
} from "lucide-react";
import { MagicNavbar } from "@/components/MagicNavbar";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { EditProfileModal } from "@/components/EditProfileModal";
import { AdvancedSettingsModal } from "@/components/AdvancedSettingsModal";
import { UserStatsManager } from "@/components/UserStatsManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InteractiveSafetyTutorial } from "@/components/InteractiveSafetyTutorial";
import { GuardianKeyCard } from "@/components/GuardianKeyCard";
import { QRScanner } from "@/components/QRScanner";
import { ProfileLoading } from "@/components/ProfessionalLoading";

import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [showSafetyTutorial, setShowSafetyTutorial] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("🔍 Profile Debug:", {
      currentUser,
      userProfile,
      hasLogout: typeof logout === "function",
      loading,
    });
  }, [currentUser, userProfile, logout, loading]);

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
      <div className="min-h-screen bg-white pb-24">
        <MagicNavbar />
        <main className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
          <ProfileLoading />
        </main>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <Card
            className="text-center p-4 bg-white border hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => setShowQRScanner(true)}
          >
            <div className="text-2xl font-bold text-blue-500 group-hover:text-blue-600 transition-colors">
              <QrCode className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-sm text-gray-600 group-hover:text-blue-500 transition-colors">
              QR Scanner
            </div>
            <div className="mt-1">
              <span className="text-xs text-blue-600">Scan QR codes</span>
            </div>
          </Card>
          <Card
            className="text-center p-4 bg-white border hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => setShowSafetyTutorial(true)}
          >
            <div className="text-2xl font-bold text-green-500 group-hover:text-green-600 transition-colors">
              <Shield className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-sm text-gray-600 group-hover:text-green-500 transition-colors">
              Safety Guide
            </div>
            <div className="mt-1">
              <span className="text-xs text-green-600">Learn features</span>
            </div>
          </Card>
        </div>

        {/* User Stats & Activity */}
        <ErrorBoundary>
          <UserStatsManager />
        </ErrorBoundary>

        {/* Emergency Contacts Section */}
        <EmergencyContactManager />

        {/* Sign Out */}
        <Card className="border shadow-lg bg-white">
          <CardContent className="p-6">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-center h-12 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
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

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanResult={(data, parsedData) => {
          console.log("QR Scanned:", data, parsedData);
          // Handle different types of QR codes
          if (parsedData.latitude && parsedData.longitude) {
            // Location QR code - navigate to map with location
            setShowQRScanner(false);
            navigate("/", {
              state: {
                targetLocation: {
                  lat: parsedData.latitude,
                  lng: parsedData.longitude,
                },
              },
            });
          } else if (parsedData.guardianKey) {
            // Guardian key QR code
            setShowQRScanner(false);
            toast.success(`Guardian Key scanned: ${parsedData.guardianKey}`);
          }
        }}
      />
    </div>
  );
}
