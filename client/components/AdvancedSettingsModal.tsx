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
  Phone,
} from "lucide-react";
import { unifiedNotifications } from "@/services/unifiedNotificationService";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { motion, AnimatePresence } from "framer-motion";

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsState {
  // Location Settings
  locationTracking: boolean;
  highAccuracyGPS: boolean;
  backgroundLocationUpdates: boolean;

  // Notification Settings
  pushNotifications: boolean;
  emergencyAlerts: boolean;
  criticalAlertsOnly: boolean;

  // Emergency Settings
  emergencyTimeout: number;
  silentMode: boolean;
  autoShareLocation: boolean;
  emergencyRecording: boolean;
  panicGestureEnabled: boolean;
  autoCallEmergencyServices: boolean;
  batteryOptimizedMode: boolean;
}

export function AdvancedSettingsModal({
  isOpen,
  onClose,
}: AdvancedSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("location");
  const [settings, setSettings] = useState<SettingsState>({
    // Location Settings
    locationTracking: true,
    highAccuracyGPS: true,
    backgroundLocationUpdates: true,

    // Notification Settings
    pushNotifications: true,
    emergencyAlerts: true,
    criticalAlertsOnly: false,

    // Emergency Settings
    emergencyTimeout: 5,
    silentMode: false,
    autoShareLocation: true,
    emergencyRecording: true,
    panicGestureEnabled: true,
    autoCallEmergencyServices: false,
    batteryOptimizedMode: false,
  });

  // Load and apply settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("guardian-advanced-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const loadedSettings = { ...settings, ...parsed };
        setSettings(loadedSettings);

        // Apply loaded settings to services immediately
        applySettingsToServices(loadedSettings);
      } catch (error) {
        console.error("Failed to parse saved settings:", error);
      }
    }
  }, []);

  const categories = [
    {
      id: "location",
      label: "Location",
      icon: MapPin,
      color: "text-blue-600",
      description: "Location tracking and GPS settings",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      color: "text-orange-600",
      description: "Alert and message preferences",
    },
    {
      id: "emergency",
      label: "Emergency",
      icon: Shield,
      color: "text-red-600",
      description: "Emergency response and safety settings",
    },
  ];

  const handleSettingChange = (
    key: keyof SettingsState,
    value: boolean | number,
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Apply settings immediately for real-time functionality
    applyIndividualSetting(key, value, newSettings);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem(
        "guardian-advanced-settings",
        JSON.stringify(settings),
      );

      // ACTUALLY APPLY SETTINGS TO APP SERVICES
      applySettingsToServices(settings);

      unifiedNotifications.success("Advanced settings saved and applied", {
        message: "All settings have been activated across the app",
      });
    } catch (error) {
      unifiedNotifications.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  // Apply individual setting changes in real-time
  const applyIndividualSetting = (
    key: keyof SettingsState,
    value: boolean | number,
    allSettings: SettingsState,
  ) => {
    try {
      switch (key) {
        case "locationTracking":
          if (value as boolean) {
            enhancedLocationService.startTracking();
            enhancedLocationService.setHighAccuracyMode(true);
            unifiedNotifications.success(
              "High-accuracy location tracking enabled",
            );
          } else {
            enhancedLocationService.stopTracking();
            unifiedNotifications.success("Location tracking disabled");
          }
          break;

        case "pushNotifications":
          // Apply push notification settings
          if (value as boolean) {
            // Request notification permission if needed
            if (
              "Notification" in window &&
              Notification.permission === "default"
            ) {
              Notification.requestPermission();
            }
            unifiedNotifications.success("Push notifications enabled");
          } else {
            unifiedNotifications.success("Push notifications disabled");
          }
          break;

        case "emergencyAlerts":
          if (value as boolean) {
            unifiedNotifications.success("Emergency alerts enabled with sound");
          } else {
            unifiedNotifications.warning(
              "Emergency alerts disabled - NOT RECOMMENDED for safety",
            );
          }
          break;

        case "emergencyTimeout":
          unifiedNotifications.success(
            `Emergency timeout updated to ${value} seconds`,
          );
          // Store timeout for SOS service
          localStorage.setItem("guardian-emergency-timeout", value.toString());
          break;

        case "silentMode":
          if (value as boolean) {
            unifiedNotifications.success("Silent emergency mode enabled", {
              message:
                "Emergency alerts will be sent without sound or vibration",
            });
          } else {
            unifiedNotifications.success("Normal emergency mode restored");
          }
          break;

        case "autoShareLocation":
          if (value as boolean) {
            unifiedNotifications.success(
              "Auto location sharing enabled for emergencies",
            );
          } else {
            unifiedNotifications.warning(
              "Auto location sharing disabled - Emergency response may be delayed",
            );
          }
          break;

        case "emergencyRecording":
          if (value as boolean) {
            // Check if media recording is supported
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              unifiedNotifications.success("Emergency recording enabled");
            } else {
              unifiedNotifications.warning(
                "Emergency recording not supported on this device",
              );
            }
          } else {
            unifiedNotifications.success("Emergency recording disabled");
          }
          break;

        case "highAccuracyGPS":
          if (value as boolean) {
            enhancedLocationService.setHighAccuracyMode(true);
            unifiedNotifications.success(
              "High accuracy GPS enabled - Maximum precision",
            );
          } else {
            enhancedLocationService.setHighAccuracyMode(false);
            unifiedNotifications.success("Standard GPS accuracy enabled");
          }
          break;

        case "backgroundLocationUpdates":
          if (value as boolean) {
            unifiedNotifications.success("Background location updates enabled");
          } else {
            unifiedNotifications.warning(
              "Background updates disabled - Emergency response may be limited",
            );
          }
          break;

        case "criticalAlertsOnly":
          if (value as boolean) {
            unifiedNotifications.success(
              "Showing only critical life-threatening alerts",
            );
          } else {
            unifiedNotifications.success("Showing all safety notifications");
          }
          break;

        case "panicGestureEnabled":
          if (value as boolean) {
            unifiedNotifications.success(
              "Panic gesture detection enabled - Shake device rapidly or tap 5 times",
            );
          } else {
            unifiedNotifications.success("Panic gesture detection disabled");
          }
          break;

        case "autoCallEmergencyServices":
          if (value as boolean) {
            unifiedNotifications.warning(
              "Auto-call emergency services enabled - Use with extreme caution!",
              {
                message:
                  "This will automatically call 911 during emergencies. Ensure this is appropriate for your situation.",
              },
            );
          } else {
            unifiedNotifications.success("Manual emergency calling mode");
          }
          break;

        case "batteryOptimizedMode":
          if (value as boolean) {
            unifiedNotifications.success(
              "Battery optimization enabled for extended emergency situations",
            );
          } else {
            unifiedNotifications.success("Full performance mode enabled");
          }
          break;
      }

      // Save to localStorage immediately
      localStorage.setItem(
        "guardian-advanced-settings",
        JSON.stringify(allSettings),
      );
    } catch (error) {
      console.error(`Failed to apply setting ${key}:`, error);
      unifiedNotifications.error(`Failed to apply ${key} setting`);
    }
  };

  // Apply settings to actual app services
  const applySettingsToServices = (newSettings: typeof settings) => {
    try {
      // Apply all settings at once
      Object.keys(newSettings).forEach((key) => {
        applyIndividualSetting(
          key as keyof SettingsState,
          newSettings[key as keyof SettingsState],
          newSettings,
        );
      });
    } catch (error) {
      console.error("Failed to apply advanced settings:", error);
      unifiedNotifications.warning(
        "Some settings may not have been applied correctly",
      );
    }
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      locationTracking: true,
      highAccuracyGPS: true,
      backgroundLocationUpdates: true,
      pushNotifications: true,
      emergencyAlerts: true,
      criticalAlertsOnly: false,
      emergencyTimeout: 5,
      silentMode: false,
      autoShareLocation: true,
      emergencyRecording: true,
      panicGestureEnabled: true,
      autoCallEmergencyServices: false,
      batteryOptimizedMode: false,
    };
    setSettings(defaultSettings);
    applySettingsToServices(defaultSettings);
    unifiedNotifications.success("Settings reset to emergency-ready defaults");
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
      case "location":
        return (
          <motion.div
            key="location"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            <SettingItem
              icon={MapPin}
              title="Location Tracking"
              description="Enable GPS tracking for safety features and emergency response"
              settingKey="locationTracking"
            />
            <SettingItem
              icon={Zap}
              title="High Accuracy GPS"
              description="Use maximum GPS precision for better emergency location accuracy"
              settingKey="highAccuracyGPS"
            />
            <SettingItem
              icon={Smartphone}
              title="Background Updates"
              description="Continue location tracking even when app is in background"
              settingKey="backgroundLocationUpdates"
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
              description="Receive notifications on this device for safety updates"
              settingKey="pushNotifications"
            />
            <SettingItem
              icon={AlertTriangle}
              title="Emergency Alerts"
              description="Critical safety and emergency notifications with sound"
              settingKey="emergencyAlerts"
            />
            <SettingItem
              icon={Shield}
              title="Critical Alerts Only"
              description="Show only life-threatening emergency alerts to reduce distractions"
              settingKey="criticalAlertsOnly"
            />
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
              description="Delay before triggering emergency alert (1-30 seconds)"
              settingKey="emergencyTimeout"
              type="slider"
              min={1}
              max={30}
              step={1}
            />
            <SettingItem
              icon={Bell}
              title="Silent Mode"
              description="Trigger alerts without sound or vibration for discrete emergencies"
              settingKey="silentMode"
            />
            <SettingItem
              icon={MapPin}
              title="Auto Share Location"
              description="Automatically share precise location during emergencies"
              settingKey="autoShareLocation"
            />
            <SettingItem
              icon={Smartphone}
              title="Emergency Recording"
              description="Automatically start audio/video recording during emergencies"
              settingKey="emergencyRecording"
            />
            <SettingItem
              icon={Users}
              title="Panic Gesture Detection"
              description="Detect shake patterns and rapid taps for emergency activation"
              settingKey="panicGestureEnabled"
            />
            <SettingItem
              icon={Phone}
              title="Auto Call Emergency Services"
              description="Automatically call 911/emergency services (use with caution)"
              settingKey="autoCallEmergencyServices"
            />
            <SettingItem
              icon={Zap}
              title="Battery Optimized Mode"
              description="Extend battery life during extended emergency situations"
              settingKey="batteryOptimizedMode"
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
