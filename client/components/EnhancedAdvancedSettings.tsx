import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Brain,
  Smartphone,
  Globe,
  Zap,
  Eye,
  MapPin,
  Users,
  Settings,
  Save,
  RotateCcw,
  AlertTriangle,
  Phone,
  Mic,
  Camera,
  Battery,
  Wifi,
  Bell,
  Lock,
  Activity,
  Gauge,
  Headphones,
  Watch,
  Car,
  Plane,
  CloudRain,
  Radio,
  Fingerprint,
  Volume2,
  Languages,
  RefreshCw,
  CheckCircle,
  X,
} from "lucide-react";
import { advancedSettingsService } from "@/services/advancedSettingsService";
import { unifiedNotifications } from "@/services/unifiedNotificationService";
import { cn } from "@/lib/utils";

interface EnhancedAdvancedSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancedAdvancedSettings({
  isOpen,
  onClose,
}: EnhancedAdvancedSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("location");
  const [settings, setSettings] = useState(
    advancedSettingsService.getSettings(),
  );
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    battery: 100,
    signal: "strong",
    memory: "normal",
    performance: "optimal",
  });

  useEffect(() => {
    // Subscribe to settings updates
    const unsubscribe = advancedSettingsService.onSettingsUpdate(setSettings);

    // Start real-time metrics monitoring
    const metricsInterval = setInterval(updateRealTimeMetrics, 3000);

    return () => {
      unsubscribe();
      clearInterval(metricsInterval);
    };
  }, []);

  const updateRealTimeMetrics = async () => {
    // Get real device metrics
    let battery = 100;
    let signal = "strong";

    try {
      if ("getBattery" in navigator) {
        const batteryManager = await (navigator as any).getBattery();
        battery = Math.round(batteryManager.level * 100);
      }

      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        switch (connection.effectiveType) {
          case "slow-2g":
          case "2g":
            signal = "weak";
            break;
          case "3g":
            signal = "medium";
            break;
          case "4g":
          default:
            signal = "strong";
            break;
        }
      }
    } catch (error) {
      console.warn("Could not get device metrics:", error);
    }

    setRealTimeMetrics({
      battery,
      signal,
      memory: battery > 50 ? "normal" : "low",
      performance: battery > 30 && signal !== "weak" ? "optimal" : "reduced",
    });
  };

  const handleSettingChange = async (key: string, value: any) => {
    try {
      setLoading(true);
      await advancedSettingsService.updateSetting(key as any, value);
    } catch (error) {
      unifiedNotifications.error("Failed to update setting");
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefaults = async () => {
    try {
      setLoading(true);
      await advancedSettingsService.resetToDefaults();
    } catch (error) {
      unifiedNotifications.error("Failed to reset settings");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    {
      id: "location",
      label: "Location & AI",
      icon: MapPin,
      color: "text-blue-600",
      description: "Smart location tracking and AI predictions",
    },
    {
      id: "emergency",
      label: "Emergency",
      icon: Shield,
      color: "text-red-600",
      description: "Advanced emergency response features",
    },
    {
      id: "communication",
      label: "Communication",
      icon: Phone,
      color: "text-green-600",
      description: "Multi-device sync and connectivity",
    },
    {
      id: "innovation",
      label: "Innovation",
      icon: Zap,
      color: "text-purple-600",
      description: "Cutting-edge features and integrations",
    },
    {
      id: "performance",
      label: "Performance",
      icon: Gauge,
      color: "text-orange-600",
      description: "Battery and performance optimization",
    },
  ];

  const SettingCard = ({
    icon: Icon,
    title,
    description,
    value,
    onChange,
    type = "switch",
    options = [],
    min = 0,
    max = 100,
    disabled = false,
    badge = null,
  }: {
    icon: any;
    title: string;
    description: string;
    value: any;
    onChange: (value: any) => void;
    type?: "switch" | "slider" | "select";
    options?: string[];
    min?: number;
    max?: number;
    disabled?: boolean;
    badge?: string | null;
  }) => (
    <Card
      className={cn("transition-all duration-200", disabled && "opacity-50")}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-gray-100">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{title}</h4>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
              {badge && (
                <Badge variant="outline" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              {type === "switch" && (
                <Switch
                  checked={value}
                  onCheckedChange={onChange}
                  disabled={disabled}
                />
              )}
              {type === "slider" && (
                <div className="flex-1 px-2">
                  <Slider
                    value={[value]}
                    onValueChange={(vals) => onChange(vals[0])}
                    min={min}
                    max={max}
                    step={1}
                    disabled={disabled}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">
                    {value} {max > 10 ? "days" : "sec"}
                  </span>
                </div>
              )}
              {type === "select" && (
                <Select
                  value={value}
                  onValueChange={onChange}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RealTimeMetrics = () => (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Real-time Device Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Battery
              className={cn(
                "h-3 w-3",
                realTimeMetrics.battery > 50
                  ? "text-green-600"
                  : realTimeMetrics.battery > 20
                    ? "text-yellow-600"
                    : "text-red-600",
              )}
            />
            <span>{realTimeMetrics.battery}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi
              className={cn(
                "h-3 w-3",
                realTimeMetrics.signal === "strong"
                  ? "text-green-600"
                  : realTimeMetrics.signal === "medium"
                    ? "text-yellow-600"
                    : "text-red-600",
              )}
            />
            <span>{realTimeMetrics.signal}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="h-3 w-3 text-blue-600" />
            <span>{realTimeMetrics.memory}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle
              className={cn(
                "h-3 w-3",
                realTimeMetrics.performance === "optimal"
                  ? "text-green-600"
                  : "text-yellow-600",
              )}
            />
            <span>{realTimeMetrics.performance}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] overflow-hidden p-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col h-full"
        >
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Settings
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <div className="px-6 pt-4">
                <RealTimeMetrics />
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="text-xs"
                    >
                      <category.icon className="h-3 w-3 mr-1" />
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4 pb-6"
                  >
                    {/* Location & AI Tab */}
                    <TabsContent value="location" className="mt-0 space-y-4">
                      <SettingCard
                        icon={MapPin}
                        title="High Accuracy GPS"
                        description="Maximum precision location tracking"
                        value={settings.highAccuracyGPS}
                        onChange={(value) =>
                          handleSettingChange("highAccuracyGPS", value)
                        }
                        badge="Real-time"
                      />
                      <SettingCard
                        icon={Brain}
                        title="AI Safety Predictions"
                        description="Machine learning powered safety analysis"
                        value={settings.aiSafetyPredictions}
                        onChange={(value) =>
                          handleSettingChange("aiSafetyPredictions", value)
                        }
                        badge="AI"
                      />
                      <SettingCard
                        icon={Activity}
                        title="Predictive Location Tracking"
                        description="Anticipate routes and preload safety data"
                        value={settings.predictiveLocationTracking}
                        onChange={(value) =>
                          handleSettingChange(
                            "predictiveLocationTracking",
                            value,
                          )
                        }
                        badge="ML"
                      />
                      <SettingCard
                        icon={Eye}
                        title="Behavior Analysis"
                        description="Learn patterns to improve safety recommendations"
                        value={settings.behaviorAnalysis}
                        onChange={(value) =>
                          handleSettingChange("behaviorAnalysis", value)
                        }
                      />
                      <SettingCard
                        icon={Activity}
                        title="Location History Retention"
                        description="How long to keep location history"
                        value={settings.locationHistoryRetention}
                        onChange={(value) =>
                          handleSettingChange("locationHistoryRetention", value)
                        }
                        type="slider"
                        min={7}
                        max={365}
                      />
                    </TabsContent>

                    {/* Emergency Tab */}
                    <TabsContent value="emergency" className="mt-0 space-y-4">
                      <SettingCard
                        icon={Mic}
                        title="Voice Activated SOS"
                        description="Say 'Guardian Help' or 'Emergency' to trigger SOS"
                        value={settings.voiceActivatedSOS}
                        onChange={(value) =>
                          handleSettingChange("voiceActivatedSOS", value)
                        }
                        badge="Voice"
                      />
                      <SettingCard
                        icon={Fingerprint}
                        title="Biometric Emergency Trigger"
                        description="Use fingerprint/face recognition for instant SOS"
                        value={settings.biometricEmergencyTrigger}
                        onChange={(value) =>
                          handleSettingChange(
                            "biometricEmergencyTrigger",
                            value,
                          )
                        }
                        badge="New"
                      />
                      <SettingCard
                        icon={Radio}
                        title="Emergency Broadcast"
                        description="Broadcast emergency to nearby Guardian users"
                        value={settings.emergencyBroadcast}
                        onChange={(value) =>
                          handleSettingChange("emergencyBroadcast", value)
                        }
                        badge="Experimental"
                      />
                      <SettingCard
                        icon={CheckCircle}
                        title="Automatic Check-in"
                        description="Automatically check in with contacts periodically"
                        value={settings.automaticCheckIn}
                        onChange={(value) =>
                          handleSettingChange("automaticCheckIn", value)
                        }
                      />
                      <SettingCard
                        icon={Brain}
                        title="Emergency Risk Assessment"
                        description="AI-powered risk analysis of current situation"
                        value={settings.emergencyRiskAssessment}
                        onChange={(value) =>
                          handleSettingChange("emergencyRiskAssessment", value)
                        }
                        badge="AI"
                      />
                    </TabsContent>

                    {/* Communication Tab */}
                    <TabsContent
                      value="communication"
                      className="mt-0 space-y-4"
                    >
                      <SettingCard
                        icon={Smartphone}
                        title="Multi-Device Sync"
                        description="Sync across all your devices in real-time"
                        value={settings.multiDeviceSync}
                        onChange={(value) =>
                          handleSettingChange("multiDeviceSync", value)
                        }
                        badge="Cloud"
                      />
                      <SettingCard
                        icon={Radio}
                        title="Mesh Networking"
                        description="Connect with nearby devices when no internet"
                        value={settings.meshNetworking}
                        onChange={(value) =>
                          handleSettingChange("meshNetworking", value)
                        }
                        badge="Offline"
                      />
                      <SettingCard
                        icon={Languages}
                        title="Auto Translation"
                        description="Automatically translate emergency communications"
                        value={settings.autoTranslation}
                        onChange={(value) =>
                          handleSettingChange("autoTranslation", value)
                        }
                      />
                      <SettingCard
                        icon={Radio}
                        title="Emergency Beacon"
                        description="Broadcast location via multiple protocols"
                        value={settings.emergencyBeacon}
                        onChange={(value) =>
                          handleSettingChange("emergencyBeacon", value)
                        }
                      />
                      <SettingCard
                        icon={Users}
                        title="Crowdsourced Safety Data"
                        description="Share and receive real-time safety updates from community"
                        value={settings.crowdsourcedSafetyData}
                        onChange={(value) =>
                          handleSettingChange("crowdsourcedSafetyData", value)
                        }
                        badge="Community"
                      />
                    </TabsContent>

                    {/* Innovation Tab */}
                    <TabsContent value="innovation" className="mt-0 space-y-4">
                      <SettingCard
                        icon={Eye}
                        title="Augmented Reality Navigation"
                        description="AR overlays for enhanced navigation and safety"
                        value={settings.augmentedRealityNavigation}
                        onChange={(value) =>
                          handleSettingChange(
                            "augmentedRealityNavigation",
                            value,
                          )
                        }
                        badge="AR"
                        disabled={!("xr" in navigator)}
                      />
                      <SettingCard
                        icon={Watch}
                        title="Smart Wearable Integration"
                        description="Connect with smartwatches and fitness trackers"
                        value={settings.smartWearableIntegration}
                        onChange={(value) =>
                          handleSettingChange("smartWearableIntegration", value)
                        }
                        badge="IoT"
                      />
                      <SettingCard
                        icon={CloudRain}
                        title="Environmental Alerts"
                        description="Weather, air quality, and environmental warnings"
                        value={settings.environmentalAlerts}
                        onChange={(value) =>
                          handleSettingChange("environmentalAlerts", value)
                        }
                        badge="Weather"
                      />
                      <SettingCard
                        icon={Car}
                        title="Route Optimization"
                        description="AI-powered route planning for maximum safety"
                        value={settings.routeOptimization}
                        onChange={(value) =>
                          handleSettingChange("routeOptimization", value)
                        }
                        badge="AI"
                      />
                    </TabsContent>

                    {/* Performance Tab */}
                    <TabsContent value="performance" className="mt-0 space-y-4">
                      <SettingCard
                        icon={Gauge}
                        title="Adaptive Performance"
                        description="Automatically adjust based on device capabilities"
                        value={settings.adaptivePerformance}
                        onChange={(value) =>
                          handleSettingChange("adaptivePerformance", value)
                        }
                        badge="Smart"
                      />
                      <SettingCard
                        icon={Battery}
                        title="Intelligent Battery Management"
                        description="AI-powered battery optimization for emergencies"
                        value={settings.intelligentBatteryManagement}
                        onChange={(value) =>
                          handleSettingChange(
                            "intelligentBatteryManagement",
                            value,
                          )
                        }
                        badge="AI"
                      />
                      <SettingCard
                        icon={Plane}
                        title="Offline Mode Preparation"
                        description="Preload essential data for offline situations"
                        value={settings.offlineModePreparation}
                        onChange={(value) =>
                          handleSettingChange("offlineModePreparation", value)
                        }
                      />
                      <SettingCard
                        icon={Lock}
                        title="Encrypted Location Storage"
                        description="End-to-end encryption for all location data"
                        value={settings.encryptedLocationStorage}
                        onChange={(value) =>
                          handleSettingChange("encryptedLocationStorage", value)
                        }
                        badge="Security"
                      />
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </ScrollArea>
            </Tabs>
          </div>

          <div className="border-t p-4 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleResetToDefaults}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
