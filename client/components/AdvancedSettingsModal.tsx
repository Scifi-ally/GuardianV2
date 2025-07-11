import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
  Lock,
  Eye,
  MapPin,
  Settings,
  Save,
  RotateCcw,
  Clock,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvancedSettingsModal({
  isOpen,
  onClose,
}: AdvancedSettingsModalProps) {
  const {
    settings,
    loading,
    updateSetting,
    resetSettings,
    saveAllSettings,
    isLocationTrackingActive,
    isPushNotificationsActive,
    isSessionTimeoutActive,
    isAutoLockActive,
  } = useSettings();

  const [activeCategory, setActiveCategory] = useState("privacy");
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync local settings with context settings
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      setHasUnsavedChanges(false);
    }
  }, [settings]);

  const categories = [
    {
      id: "privacy",
      label: "Privacy",
      icon: Eye,
      description: "Control your data and visibility",
      count: 2,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Manage alerts",
      count: 2,
    },
    {
      id: "security",
      label: "Security",
      icon: Lock,
      description: "Authentication and protection",
      count: 2,
    },
    {
      id: "emergency",
      label: "Emergency",
      icon: Shield,
      description: "Safety settings",
      count: 2,
    },
  ];

  const handleLocalSettingChange = (
    key: keyof typeof localSettings,
    value: any,
  ) => {
    if (!localSettings) return;

    setLocalSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
    setHasUnsavedChanges(true);
  };

  const handleInstantUpdate = async (
    key: keyof typeof localSettings,
    value: any,
  ) => {
    try {
      await updateSetting(key, value);
    } catch (error) {
      toast.error(`Failed to update ${key}`);
    }
  };

  const handleSaveAllChanges = async () => {
    if (!localSettings || !hasUnsavedChanges) return;

    try {
      await saveAllSettings(localSettings);
      setHasUnsavedChanges(false);
    } catch (error) {
      // Error already handled in context
    }
  };

  const handleResetSettings = async () => {
    try {
      await resetSettings();
      setHasUnsavedChanges(false);
    } catch (error) {
      // Error already handled in context
    }
  };

  const StatusIndicator = ({ isActive }: { isActive: boolean }) => (
    <div className="flex items-center gap-1">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          isActive ? "bg-green-500 animate-pulse" : "bg-gray-400",
        )}
      />
      <span className="text-xs text-gray-600">
        {isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );

  const SettingItem = ({
    icon: Icon,
    title,
    description,
    settingKey,
    type = "switch",
    min = 1,
    max = 60,
    step = 1,
    instant = false,
    statusIndicator = false,
    getStatusActive,
  }: {
    icon: any;
    title: string;
    description: string;
    settingKey: keyof typeof localSettings;
    type?: "switch" | "slider" | "select";
    min?: number;
    max?: number;
    step?: number;
    instant?: boolean;
    statusIndicator?: boolean;
    getStatusActive?: () => boolean;
  }) => {
    if (!localSettings) return null;

    const value = localSettings[settingKey];
    const isStatusActive =
      statusIndicator && getStatusActive ? getStatusActive() : false;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-gray-100 flex-shrink-0">
            <Icon className="h-4 w-4 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-black">{title}</h4>
              {statusIndicator && <StatusIndicator isActive={isStatusActive} />}
            </div>
            <p className="text-xs text-gray-600 mt-1 leading-tight">
              {description}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 ml-4">
          {type === "switch" ? (
            <Switch
              checked={value as boolean}
              onCheckedChange={(checked) => {
                if (instant) {
                  handleInstantUpdate(settingKey, checked);
                } else {
                  handleLocalSettingChange(settingKey, checked);
                }
              }}
              disabled={loading}
            />
          ) : type === "slider" ? (
            <div className="w-24">
              <Slider
                value={[value as number]}
                onValueChange={(newValue) => {
                  if (instant) {
                    handleInstantUpdate(settingKey, newValue[0]);
                  } else {
                    handleLocalSettingChange(settingKey, newValue[0]);
                  }
                }}
                max={max}
                min={min}
                step={step}
                className="w-full"
                disabled={loading}
              />
              <div className="text-xs text-center text-gray-600 mt-1">
                {value}
                {settingKey.includes("timeout")
                  ? "s"
                  : settingKey.includes("session")
                    ? "m"
                    : ""}
              </div>
            </div>
          ) : type === "select" ? (
            <Select
              value={value as string}
              onValueChange={(newValue) => {
                if (instant) {
                  handleInstantUpdate(settingKey, newValue);
                } else {
                  handleLocalSettingChange(settingKey, newValue);
                }
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="contacts">Contacts</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </motion.div>
    );
  };

  const renderCategoryContent = () => {
    if (!localSettings) return null;

    switch (activeCategory) {
      case "privacy":
        return (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <SettingItem
              icon={Eye}
              title="Profile Visibility"
              description="Control who can see your profile information"
              settingKey="profileVisibility"
              type="select"
              instant={true}
            />
            <SettingItem
              icon={MapPin}
              title="Location Tracking"
              description="Allow the app to track your location for safety features"
              settingKey="locationTracking"
              instant={true}
              statusIndicator={true}
              getStatusActive={() => isLocationTrackingActive}
            />
          </motion.div>
        );

      case "notifications":
        return (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <SettingItem
              icon={Bell}
              title="Push Notifications"
              description="Receive notifications on this device"
              settingKey="pushNotifications"
              instant={true}
              statusIndicator={true}
              getStatusActive={() => isPushNotificationsActive}
            />
            <SettingItem
              icon={Shield}
              title="Emergency Alerts"
              description="Critical safety notifications (always enabled)"
              settingKey="emergencyAlerts"
              instant={true}
            />
          </motion.div>
        );

      case "security":
        return (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <SettingItem
              icon={Clock}
              title="Session Timeout"
              description="Auto logout after inactivity (minutes)"
              settingKey="sessionTimeout"
              type="slider"
              min={5}
              max={120}
              step={5}
              instant={true}
              statusIndicator={true}
              getStatusActive={() => isSessionTimeoutActive}
            />
            <SettingItem
              icon={Lock}
              title="Auto Lock"
              description="Automatically lock the app when not in use"
              settingKey="autoLock"
              instant={true}
              statusIndicator={true}
              getStatusActive={() => isAutoLockActive}
            />
          </motion.div>
        );

      case "emergency":
        return (
          <motion.div
            key="emergency"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <SettingItem
              icon={Shield}
              title="Emergency Timeout"
              description="Delay before triggering emergency alert (seconds)"
              settingKey="emergencyTimeout"
              type="slider"
              min={1}
              max={30}
              step={1}
              instant={true}
            />
            <SettingItem
              icon={MapPin}
              title="Auto Share Location"
              description="Automatically share location during emergencies"
              settingKey="autoShareLocation"
              instant={true}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!settings) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-w-[95vw] max-h-[90vh] overflow-hidden p-0">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="flex flex-col h-full"
            >
              <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-white">
                <DialogTitle className="text-lg font-semibold flex items-center justify-between text-black">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-black" />
                    Settings
                  </div>
                  {hasUnsavedChanges && (
                    <Badge
                      variant="outline"
                      className="text-orange-600 border-orange-300"
                    >
                      Unsaved Changes
                    </Badge>
                  )}
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
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desktop Sidebar Categories */}
                  <div className="hidden sm:block w-48 border-r bg-gray-50 p-4 flex-shrink-0">
                    <nav className="space-y-1">
                      {categories.map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                              activeCategory === category.id
                                ? "bg-black text-white"
                                : "text-gray-700 hover:bg-gray-200",
                            )}
                          >
                            <IconComponent className="h-4 w-4 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm">
                                {category.label}
                              </div>
                              <div className="text-xs opacity-70 truncate">
                                {category.description}
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {category.count}
                            </Badge>
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
                  {hasUnsavedChanges && (
                    <Button
                      onClick={handleSaveAllChanges}
                      disabled={loading}
                      className="flex-1 sm:flex-none bg-black text-white hover:bg-gray-800"
                    >
                      {loading ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
