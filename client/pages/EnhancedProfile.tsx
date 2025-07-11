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
  Star,
  CheckCircle,
  Crown,
  Lock,
  Sparkles,
} from "lucide-react";
import { MagicNavbar } from "@/components/MagicNavbar";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { SOSNotificationManager } from "@/components/SOSNotification";
import { EditProfileModal } from "@/components/EditProfileModal";
import { AdvancedSettingsModal } from "@/components/AdvancedSettingsModal";
import { UserStatsManager } from "@/components/UserStatsManager";
import { ProfileErrorBoundary } from "@/components/ProfileErrorBoundary";
import { InteractiveSafetyTutorial } from "@/components/InteractiveSafetyTutorial";
import { SettingsStatusIndicator } from "@/components/SettingsStatusIndicator";
import {
  AnimatedSection,
  AnimatedCard,
  FloatingElement,
  PulsingElement,
  CounterAnimation,
  GlowingElement,
} from "@/components/AnimatedComponents";

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
import { cn } from "@/lib/utils";

const ProfileFeatureCard = ({
  icon: Icon,
  title,
  description,
  value,
  status = "active",
  onClick,
  gradient = "from-blue-500 to-purple-600",
}) => {
  return (
    <AnimatedCard className="group">
      <Card className="relative overflow-hidden bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300">
        {/* Animated background gradient */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
          animate={{
            background: [
              `linear-gradient(45deg, var(--tw-gradient-stops))`,
              `linear-gradient(225deg, var(--tw-gradient-stops))`,
              `linear-gradient(45deg, var(--tw-gradient-stops))`,
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <CardContent className="relative p-6" onClick={onClick}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className={`p-3 rounded-2xl bg-gradient-to-r ${gradient} shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon className="h-6 w-6 text-white" />
              </motion.div>

              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
                {value && (
                  <div className="text-lg font-bold text-gray-900">
                    <CounterAnimation from={0} to={value} duration={1.5} />
                  </div>
                )}
              </div>
            </div>

            <motion.div
              animate={{
                scale: status === "active" ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: status === "active" ? Infinity : 0,
              }}
            >
              <Badge
                variant={status === "active" ? "default" : "secondary"}
                className={cn(
                  "capitalize",
                  status === "active" && "bg-green-500 hover:bg-green-600",
                )}
              >
                {status}
              </Badge>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
};

export function EnhancedProfile() {
  const { currentUser, logout, userProfile, refreshProfile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [guardianKey, setGuardianKey] = useState<string>("");
  const [safetyScore, setSafetyScore] = useState(95);
  const [notifications, setNotifications] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (userProfile?.guardianKey) {
      setGuardianKey(userProfile.guardianKey);
    }
  }, [userProfile]);

  const handleCopyKey = async () => {
    if (guardianKey) {
      const success = await copyToClipboard(guardianKey);
      if (success) {
        toast.success("Guardian Key copied to clipboard!");
      } else {
        toast.error("Failed to copy Guardian Key");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <ProfileErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <FloatingElement key={i} intensity={15 + i * 5}>
              <motion.div
                className="absolute w-4 h-4 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${15 + (i % 3) * 30}%`,
                }}
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 8 + i,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </FloatingElement>
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 py-6 pb-24">
          {/* Header Section */}
          <AnimatedSection className="mb-8">
            <motion.div
              className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl overflow-hidden"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Animated background pattern */}
              <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <div className="relative z-10 flex items-center space-x-6">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Avatar className="h-24 w-24 border-4 border-white/30 shadow-xl">
                    <AvatarImage
                      src={userProfile.photoURL || ""}
                      alt={userProfile.displayName}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl font-bold">
                      {userProfile.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>

                <div className="flex-1 space-y-2">
                  <motion.h1
                    className="text-3xl font-bold"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {userProfile.displayName}
                  </motion.h1>

                  <motion.p
                    className="text-blue-100 flex items-center space-x-2"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Mail className="h-4 w-4" />
                    <span>{userProfile.email}</span>
                  </motion.p>

                  <motion.div
                    className="flex items-center space-x-4 pt-2"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center space-x-2">
                      <Crown className="h-5 w-5 text-yellow-400" />
                      <span className="font-semibold">Safety Guardian</span>
                    </div>

                    <PulsingElement>
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <Heart className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </PulsingElement>
                  </motion.div>
                </div>

                <motion.div
                  className="text-right space-y-2"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-sm text-blue-100">Safety Score</div>
                  <motion.div
                    className="text-4xl font-bold text-yellow-400"
                    whileHover={{ scale: 1.1 }}
                  >
                    <CounterAnimation from={0} to={safetyScore} duration={2} />%
                  </motion.div>
                  <div className="flex items-center justify-end space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            i < 4
                              ? "text-yellow-400 fill-current"
                              : "text-white/30",
                          )}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="absolute top-4 right-4 flex space-x-2">
                <motion.button
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="h-5 w-5" />
                </motion.button>

                <motion.button
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSettingsModalOpen(true)}
                >
                  <Settings className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>
          </AnimatedSection>

          {/* Guardian Key Section */}
          <AnimatedSection className="mb-8" variant="slideUp">
            <GlowingElement glowColor="rgba(59, 130, 246, 0.3)">
              <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-indigo-900">
                    <Key className="h-5 w-5" />
                    <span>Your Guardian Key</span>
                    <Lock className="h-4 w-4 text-indigo-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-indigo-200">
                    <motion.div
                      className="font-mono text-2xl font-bold text-indigo-900 tracking-wider"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {guardianKey || "Loading..."}
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        onClick={handleCopyKey}
                        variant="outline"
                        size="sm"
                        className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </motion.div>
                  </div>

                  <motion.p
                    className="text-sm text-indigo-700 mt-3 flex items-center space-x-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>
                      Share this key with trusted contacts for emergency access
                    </span>
                  </motion.p>
                </CardContent>
              </Card>
            </GlowingElement>
          </AnimatedSection>

          {/* Feature Cards Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            <ProfileFeatureCard
              icon={Users}
              title="Emergency Contacts"
              description="Trusted people who can help"
              value={userProfile.emergencyContacts?.length || 0}
              status="active"
              gradient="from-emerald-500 to-teal-600"
            />

            <ProfileFeatureCard
              icon={Shield}
              title="Safety Status"
              description="Real-time monitoring"
              value={safetyScore}
              status="active"
              gradient="from-blue-500 to-indigo-600"
            />

            <ProfileFeatureCard
              icon={Bell}
              title="Alert Settings"
              description="Notification preferences"
              status={notifications ? "active" : "inactive"}
              gradient="from-purple-500 to-pink-600"
            />

            <ProfileFeatureCard
              icon={Activity}
              title="Activity Monitor"
              description="Movement tracking"
              status="active"
              gradient="from-orange-500 to-red-600"
            />
          </motion.div>

          {/* Stats and Settings Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <AnimatedSection variant="slideLeft">
              <UserStatsManager />
            </AnimatedSection>

            <AnimatedSection variant="slideRight">
              <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Quick Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingsStatusIndicator />

                  <motion.div
                    className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Notifications</span>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Dark Mode</span>
                    </div>
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={setIsDarkMode}
                    />
                  </motion.div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>

          {/* Emergency Contacts Section */}
          <AnimatedSection variant="fadeScale" className="mb-8">
            <EmergencyContactManager />
          </AnimatedSection>

          {/* Logout Button */}
          <AnimatedSection className="text-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 px-8 py-3"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </motion.div>
          </AnimatedSection>
        </div>

        {/* Modals */}
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />

        <AdvancedSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />

        {/* Navigation */}
        <MagicNavbar />

        {/* SOS Notifications */}
        <SOSNotificationManager />

        {/* Tutorial */}
        <InteractiveSafetyTutorial />
      </div>
    </ProfileErrorBoundary>
  );
}

export default EnhancedProfile;
