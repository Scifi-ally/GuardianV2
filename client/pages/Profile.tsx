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

import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { EditProfileModal } from "@/components/EditProfileModal";
import { EnhancedAdvancedSettings } from "@/components/EnhancedAdvancedSettings";
import { UserStatsManager } from "@/components/UserStatsManager";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GuardianKeyCard } from "@/components/GuardianKeyCard";
import { QRScanner } from "@/components/QRScanner";
import { ProfileLoading } from "@/components/ProfessionalLoading";
import {
  LazyComponentWrapper,
  LoadingSkeleton,
  dynamicLoadingService,
} from "@/services/dynamicLoadingService";

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
// Toast removed
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
  tap: { scale: 0.98 },
};

export default function Profile() {
  const { currentUser, userProfile, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Preload components for optimal performance
  useEffect(() => {
    dynamicLoadingService.preloadForRoute("/profile");
  }, []);

  // Debug logging removed for production

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
        // Silent error - logout function not available
        return;
      }

      console.log("✅ Calling logout function...");
      await logout();
      console.log("✅ Logout completed");
      // Silent success - logged out
    } catch (error) {
      console.error("❌ Failed to logout:", error);
      // Silent error - failed to logout
    }
  };

  const emergencyContacts = userProfile?.emergencyContacts || [];

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white safe-bottom-spacing">
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
              onClick={() => {
                // Force profile refresh without page reload
                window.dispatchEvent(new Event("profileRefresh"));
              }}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Refresh Data
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 safe-bottom-spacing pb-20">
      {/* SOS notifications now handled by unified notification system */}

      <main className="container px-4 py-8 space-y-8 max-w-4xl mx-auto flex flex-col items-center">
        {/* Profile Header */}
        <Card className="border-2 border-gray-100 shadow-2xl bg-white w-full max-w-2xl rounded-3xl hover:shadow-3xl transition-all duration-300">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
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

              <div className="flex gap-4 w-full max-w-md">
                <Button
                  onClick={handleEditProfile}
                  className="flex-1 h-12 text-sm bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg rounded-xl"
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  onClick={handleAdvancedSettings}
                  className="flex-1 h-12 text-sm bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 transition-all duration-200 shadow-md hover:shadow-lg rounded-xl"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Key Section with QR Code */}
        <div className="w-full max-w-2xl">
          <GuardianKeyCard />
        </div>

        {/* QR Scanner - Moved to bottom */}
        <div className="flex justify-center">
          <Card
            className="text-center p-4 bg-white border transition-shadow cursor-pointer group max-w-sm"
            onClick={() => setShowQRScanner(true)}
          >
            <div className="text-2xl font-bold text-blue-500 transition-colors">
              <QrCode className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-sm text-gray-600 transition-colors">
              QR Scanner
            </div>
            <div className="mt-1">
              <span className="text-xs text-blue-600">Scan QR codes</span>
            </div>
          </Card>
        </div>

        {/* User Stats & Activity */}
        <div className="w-full max-w-2xl">
          <ErrorBoundary>
            <UserStatsManager />
          </ErrorBoundary>
        </div>

        {/* Emergency Contacts Section */}
        <div className="w-full max-w-2xl">
          <EmergencyContactManager />
        </div>

        {/* Sign Out */}
        <Card className="border-2 border-gray-100 shadow-xl bg-white w-full max-w-2xl rounded-2xl hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-6">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-center h-12 text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
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
          <EnhancedAdvancedSettings
            isOpen={advancedSettingsOpen}
            onClose={() => setAdvancedSettingsOpen(false)}
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
            // Silent success - QR scanned
          }
        }}
      />
    </div>
  );
}
