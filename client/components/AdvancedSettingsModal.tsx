import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Bell,
  Smartphone,
  Lock,
  Eye,
  MapPin,
  Users,
  Settings,
  Save,
  RotateCcw,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsState {
  // Privacy Settings
  profileVisibility: boolean;
  locationTracking: boolean;
  activityStatus: boolean;
  contactsAccess: boolean;

  // Notification Settings
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  emergencyAlerts: boolean;
  weeklyReports: boolean;

  // Security Settings
  twoFactorAuth: boolean;
  sessionTimeout: number;
  autoLock: boolean;
  biometricAuth: boolean;

  // Emergency Settings
  emergencyTimeout: number;
  silentMode: boolean;
  autoShareLocation: boolean;
  emergencyRecording: boolean;

  // Performance Settings
  backgroundRefresh: boolean;
  dataUsage: boolean;
  crashReports: boolean;
  analytics: boolean;
}

export function AdvancedSettingsModal({
  isOpen,
  onClose,
}: AdvancedSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("privacy");
  const [settings, setSettings] = useState<SettingsState>({
    // Privacy Settings
    profileVisibility: true,
    locationTracking: true,
    activityStatus: true,
    contactsAccess: true,

    // Notification Settings
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: true,
    emergencyAlerts: true,
    weeklyReports: false,

    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    autoLock: true,
    biometricAuth: false,

    // Emergency Settings
    emergencyTimeout: 5,
    silentMode: false,
    autoShareLocation: true,
    emergencyRecording: true,

    // Performance Settings
    backgroundRefresh: true,
    dataUsage: false,
    crashReports: true,
    analytics: true,
  });

  const categories = [
    {
      id: "privacy",
      label: "Privacy",
      icon: Eye,
      color: "text-blue-600",
      description: "Control your data and visibility",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      color: "text-orange-600",
      description: "Manage alerts and messages",
    },
    {
      id: "security",
      label: "Security",
      icon: Lock,
      color: "text-red-600",
      description: "Authentication and protection",
    },
    {
      id: "emergency",
      label: "Emergency",
      icon: Shield,
      color: "text-green-600",
      description: "Safety and response settings",
    },
    {
      id: "performance",
      label: "Performance",
      icon: Zap,
      color: "text-purple-600",
      description: "App behavior and optimization",
    },
  ];

  const handleSettingChange = (
    key: keyof SettingsState,
    value: boolean | number,
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Save to localStorage as fallback
      localStorage.setItem(
        "guardian-advanced-settings",
        JSON.stringify(settings),
      );

      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      profileVisibility: true,
      locationTracking: true,
      activityStatus: true,
      contactsAccess: true,
      pushNotifications: true,
      emailNotifications: false,
      smsNotifications: true,
      emergencyAlerts: true,
      weeklyReports: false,
      twoFactorAuth: false,
      sessionTimeout: 30,
      autoLock: true,
      biometricAuth: false,
      emergencyTimeout: 5,
      silentMode: false,
      autoShareLocation: true,
      emergencyRecording: true,
      backgroundRefresh: true,
      dataUsage: false,
      crashReports: true,
      analytics: true,
    });
    toast.success("Settings reset to defaults");
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
  };

  const SettingItem = ({
    icon: Icon,
    title,
    description,
    settingKey,
    type = "switch",
    min = 1,
    max = 60,
    step = 1,
  }: {
    icon: any;
    title: string;
    description: string;
    settingKey: keyof SettingsState;
    type?: "switch" | "slider";
    min?: number;
    max?: number;
    step?: number;
  }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 rounded-lg bg-gray-100 flex-shrink-0">
          <Icon className="h-4 w-4 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-black">{title}</h4>
          <p className="text-xs text-gray-600 mt-1 leading-tight">
            {description}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        {type === "switch" ? (
          <Switch
            checked={settings[settingKey] as boolean}
            onCheckedChange={(checked) =>
              handleSettingChange(settingKey, checked)
            }
          />
        ) : (
          <div className="w-24">
            <Slider
              value={[settings[settingKey] as number]}
              onValueChange={(value) =>
                handleSettingChange(settingKey, value[0])
              }
              max={max}
              min={min}
              step={step}
              className="w-full"
            />
            <div className="text-xs text-center text-gray-600 mt-1">
              {settings[settingKey]}
              {type === "slider" && settingKey.includes("timeout") ? "s" : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case "privacy":
        return (
          <motion.div
            key="privacy"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <SettingItem
              icon={Eye}
              title="Profile Visibility"
              description="Control who can see your profile information"
              settingKey="profileVisibility"
            />
            <SettingItem
              icon={MapPin}
              title="Location Tracking"
              description="Allow the app to track your location for safety features"
              settingKey="locationTracking"
            />
            <SettingItem
              icon={Users}
              title="Activity Status"
              description="Share your online status with emergency contacts"
              settingKey="activityStatus"
            />
            <SettingItem
              icon={Smartphone}
              title="Contacts Access"
              description="Allow access to your device contacts for emergency features"
              settingKey="contactsAccess"
            />
          </motion.div>
        );

      case "notifications":
        return (
          <motion.div
            key="notifications"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <SettingItem
              icon={Smartphone}
              title="Push Notifications"
              description="Receive notifications on this device"
              settingKey="pushNotifications"
            />
            <SettingItem
              icon={Bell}
              title="Email Notifications"
              description="Receive updates via email"
              settingKey="emailNotifications"
            />
            <SettingItem
              icon={Smartphone}
              title="SMS Notifications"
              description="Receive critical alerts via SMS"
              settingKey="smsNotifications"
            />
            <SettingItem
              icon={AlertTriangle}
              title="Emergency Alerts"
              description="Critical safety notifications"
              settingKey="emergencyAlerts"
            />
            <SettingItem
              icon={Bell}
              title="Weekly Reports"
              description="Receive weekly safety activity reports"
              settingKey="weeklyReports"
            />
          </motion.div>
        );

      case "security":
        return (
          <motion.div
            key="security"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <SettingItem
              icon={Lock}
              title="Session Timeout"
              description="Automatically log out after period of inactivity"
              settingKey="sessionTimeout"
              type="slider"
              min={5}
              max={120}
              step={5}
            />
            <SettingItem
              icon={Smartphone}
              title="Auto Lock"
              description="Automatically lock the app when not in use"
              settingKey="autoLock"
            />
            <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Security Note
                </span>
              </div>
              <p className="text-xs text-yellow-700">
                Advanced security features like 2FA and biometric authentication
                require additional setup and will be available in future
                updates.
              </p>
            </div>
          </motion.div>
        );

      case "emergency":
        return (
          <motion.div
            key="emergency"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <SettingItem
              icon={Shield}
              title="Emergency Timeout"
              description="Delay before triggering emergency alert"
              settingKey="emergencyTimeout"
              type="slider"
              min={1}
              max={30}
              step={1}
            />
            <SettingItem
              icon={Bell}
              title="Silent Mode"
              description="Trigger alerts without sound or vibration"
              settingKey="silentMode"
            />
            <SettingItem
              icon={MapPin}
              title="Auto Share Location"
              description="Automatically share location during emergencies"
              settingKey="autoShareLocation"
            />
            <SettingItem
              icon={Smartphone}
              title="Emergency Recording"
              description="Automatically start recording during emergencies"
              settingKey="emergencyRecording"
            />
          </motion.div>
        );

      case "performance":
        return (
          <motion.div
            key="performance"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <SettingItem
              icon={Zap}
              title="Background Refresh"
              description="Keep the app updated when not in use"
              settingKey="backgroundRefresh"
            />
            <SettingItem
              icon={Smartphone}
              title="Data Usage Optimization"
              description="Reduce data usage for better performance"
              settingKey="dataUsage"
            />
            <SettingItem
              icon={AlertTriangle}
              title="Crash Reports"
              description="Send anonymous crash reports to improve the app"
              settingKey="crashReports"
            />
            <SettingItem
              icon={Settings}
              title="Analytics"
              description="Share anonymous usage data to improve features"
              settingKey="analytics"
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col h-full"
            >
              <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-white">
                <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-black">
                  <Settings className="h-5 w-5 text-black" />
                  Advanced Settings
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-hidden">
                <div className="flex flex-col sm:flex-row h-full">
                  {/* Mobile Category Selector */}
                  <div className="sm:hidden border-b bg-gray-50 p-3">
                    <Select
                      value={activeCategory}
                      onValueChange={setActiveCategory}
                    >
                      <SelectTrigger className="w-full bg-white border-gray-300 text-black">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const activeCategory_ = categories.find(
                              (cat) => cat.id === activeCategory,
                            );
                            const IconComponent = activeCategory_?.icon;
                            return (
                              <>
                                {IconComponent && (
                                  <IconComponent className="h-4 w-4 text-black" />
                                )}
                                <SelectValue />
                              </>
                            );
                          })()}
                        </div>
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {categories.map((category) => {
                          const IconComponent = category.icon;
                          return (
                            <SelectItem
                              key={category.id}
                              value={category.id}
                              className="text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4 text-gray-600" />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {category.label}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {category.description}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desktop Sidebar Categories */}
                  <div className="hidden sm:block w-56 border-r bg-gray-50 p-4 flex-shrink-0">
                    <nav className="space-y-1">
                      {categories.map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                              activeCategory === category.id
                                ? "bg-black text-white"
                                : "text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <IconComponent className="h-4 w-4 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm">
                                {category.label}
                              </div>
                              <div className="text-xs opacity-70 truncate">
                                {category.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6">
                      <AnimatePresence mode="wait">
                        {renderCategoryContent()}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-4 border-t bg-white flex flex-col sm:flex-row gap-3 sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetSettings}
                  disabled={loading}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Defaults
                </Button>
                <div className="flex gap-3 order-1 sm:order-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="flex-1 sm:flex-none bg-black text-white hover:bg-gray-800"
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
