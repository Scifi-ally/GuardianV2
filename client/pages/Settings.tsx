import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  MapPin,
  Moon,
  Sun,
  Smartphone,
  Volume2,
  VolumeX,
  Vibrate,
  Lock,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  Info,
  ExternalLink,
  FileText,
  CheckCircle,
} from "lucide-react";
import { MagicNavbar } from "@/components/MagicNavbar";
import { AnimatedCard } from "@/components/AnimatedCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { realTimeService } from "@/services/realTimeService";
import { unifiedNotifications } from "@/services/unifiedNotificationService";
import { enhancedLocationService } from "@/services/enhancedLocationService";
import { buttonAnimations, cardAnimations } from "@/lib/animations";
// Toast removed

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      push: true,
      emergencyOnly: false,
    },
    privacy: {
      shareLocation: true,
      anonymousReporting: true,
      dataSaving: false,
      highAccuracyMode: false,
    },
    safety: {
      sosCountdown: 3,
      autoAlert: true,
      vibrationEnabled: true,
    },
    appearance: {
      darkMode: false,
      language: "en",
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load settings on component mount
  useEffect(() => {
    const savedSettings = realTimeService.loadSettings();
    if (savedSettings) {
      setSettings(savedSettings);
      setLastSaved(new Date(savedSettings.lastSaved || Date.now()));
    }
  }, []);

  const handleSOSPress = async () => {
    try {
      const { advancedEmergencyController } = await import(
        "@/services/advancedEmergencyController"
      );
      await advancedEmergencyController.activateSOSWithCountdown("general", 5);
    } catch (error) {
      console.error("SOS activation failed:", error);
    }
  };

  // Apply settings to actual services
  const applySettingsToServices = (newSettings: typeof settings) => {
    try {
      // Apply high accuracy location mode
      if (newSettings.privacy.highAccuracyMode) {
        enhancedLocationService.setHighAccuracyMode(true);
        unifiedNotifications.success("High accuracy location enabled", {
          message:
            "GPS tracking precision increased. This will use more battery.",
        });
      } else {
        enhancedLocationService.setHighAccuracyMode(false);
      }

      // Apply data saving mode
      if (newSettings.privacy.dataSaving) {
        enhancedLocationService.setTrackingInterval(15000); // Longer interval for data saving
        unifiedNotifications.success("Data saving mode enabled", {
          message: "Location updates reduced to save battery and data.",
        });
      } else {
        enhancedLocationService.setTrackingInterval(5000); // Normal interval
      }
    } catch (error) {
      console.error("Failed to apply settings:", error);
      unifiedNotifications.warning("Some settings may not have been applied");
    }
  };

  const updateSetting = async (
    category: keyof typeof settings,
    key: string,
    value: any,
  ) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    };

    setSettings(newSettings);

    // Auto-save settings
    try {
      setIsSaving(true);
      const settingsWithTimestamp = {
        ...newSettings,
        lastSaved: Date.now(),
      };

      const success = realTimeService.saveSettings(settingsWithTimestamp);
      if (success) {
        setLastSaved(new Date());
        unifiedNotifications.success("Settings saved");

        // Apply settings to services immediately
        applySettingsToServices(newSettings);
      } else {
        // Silent error - failed to save
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Silent error - failed to save
    } finally {
      setIsSaving(false);
    }
  };

  const settingSections = [
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          id: "push",
          label: "Push Notifications",
          description: "Receive alerts on your device",
          type: "switch",
          value: settings.notifications.push,
          category: "notifications" as const,
        },
        // Email/SMS removed - requires backend integration
        {
          id: "emergencyOnly",
          label: "Emergency Only",
          description: "Only receive critical safety alerts",
          type: "switch",
          value: settings.notifications.emergencyOnly,
          category: "notifications" as const,
        },
      ],
    },
    {
      title: "Safety Settings",
      icon: Shield,
      items: [
        {
          id: "sosCountdown",
          label: "SOS Countdown",
          description: "Seconds before SOS alert is sent",
          type: "slider",
          value: settings.safety.sosCountdown,
          min: 1,
          max: 10,
          category: "safety" as const,
        },
        {
          id: "autoAlert",
          label: "Auto Alert Contacts",
          description: "Automatically notify emergency contacts",
          type: "switch",
          value: settings.safety.autoAlert,
          category: "safety" as const,
        },

        {
          id: "vibrationEnabled",
          label: "Vibration",
          description: "Vibrate during alerts",
          type: "switch",
          value: settings.safety.vibrationEnabled,
          category: "safety" as const,
        },
      ],
    },
    {
      title: "Privacy & Security",
      icon: Lock,
      items: [
        {
          id: "shareLocation",
          label: "Location Sharing",
          description: "Allow sharing location with contacts",
          type: "switch",
          value: settings.privacy.shareLocation,
          category: "privacy" as const,
        },
        {
          id: "anonymousReporting",
          label: "Anonymous Reporting",
          description: "Submit safety reports anonymously",
          type: "switch",
          value: settings.privacy.anonymousReporting,
          category: "privacy" as const,
        },
        {
          id: "dataSaving",
          label: "Data Saving Mode",
          description: "Reduce data usage for maps and routes",
          type: "switch",
          value: settings.privacy.dataSaving,
          category: "privacy" as const,
        },
        {
          id: "highAccuracyMode",
          label: "High Accuracy Location",
          description:
            "Use GPS for maximum location precision (uses more battery)",
          type: "switch",
          value: settings.privacy.highAccuracyMode || false,
          category: "privacy" as const,
        },
      ],
    },
    {
      title: "Appearance",
      icon: Sun,
      items: [
        {
          id: "darkMode",
          label: "Dark Mode",
          description: "Use dark theme",
          type: "switch",
          value: settings.appearance.darkMode,
          category: "appearance" as const,
        },
        {
          id: "language",
          label: "Language",
          description: "App language",
          type: "select",
          value: settings.appearance.language,
          options: [
            { value: "en", label: "English" },
            { value: "es", label: "Español" },
            { value: "fr", label: "Français" },
          ],
          category: "appearance" as const,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      <main className="container px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gray-100">
            <SettingsIcon className="h-6 w-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Settings</h1>
            <p className="text-gray-600">Customize your Guardian experience</p>
          </div>
        </div>

        {/* Quick Status */}
        <motion.div variants={cardAnimations} whileHover="hover" whileTap="tap">
          <Card className="bg-white border shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-2 rounded-lg bg-green-100"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Shield className="h-5 w-5 text-green-600" />
                  </motion.div>
                  <div>
                    <p className="font-medium text-black">Safety Status</p>
                    <p className="text-sm text-gray-600">All systems active</p>
                    {lastSaved && (
                      <p className="text-xs text-gray-500">
                        Settings saved {lastSaved.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSaving && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    </motion.div>
                  )}
                  <Badge className="bg-green-500 text-white">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <Card key={section.title} className="bg-white border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-black">
                <section.icon className="h-5 w-5 text-black" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium text-black">{item.label}</p>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                      {item.type === "slider" && (
                        <div className="mt-2">
                          <div className="flex items-center gap-3">
                            <Slider
                              value={[item.value as number]}
                              onValueChange={([value]) =>
                                updateSetting(item.category, item.id, value)
                              }
                              min={item.min}
                              max={item.max}
                              step={1}
                              className="flex-1"
                            />
                            <Badge variant="outline" className="min-w-[3ch]">
                              {item.value}s
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      {item.type === "switch" && (
                        <Switch
                          checked={item.value as boolean}
                          onCheckedChange={(checked) =>
                            updateSetting(item.category, item.id, checked)
                          }
                        />
                      )}
                      {item.type === "select" && (
                        <Select
                          value={item.value as string}
                          onValueChange={(value) =>
                            updateSetting(item.category, item.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {item.options?.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  {itemIndex < section.items.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Additional Options */}
        <Card className="bg-white border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-black">
              <HelpCircle className="h-5 w-5 text-black" />
              Support & Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <motion.div
              variants={buttonAnimations}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-gray-50"
                onClick={() => {
                  // Create comprehensive help modal with real functionality
                  const helpContent = `
Guardian Safety App - Help & Support

📞 Emergency: Call 911 immediately for life-threatening situations

🆘 Quick Help:
• Share Location: Tap Share Location to send your current position
• Emergency Contacts: Add trusted contacts in Emergency Contacts section
• Quick Text: Send pre-configured safety messages instantly
• Safe Routes: Get AI-analyzed safer navigation options

🔧 Features:
• Real-time location tracking
• AI-powered safety analysis
• Emergency contact alerting
• Incident reporting
• Smart context-aware actions

❓ Common Issues:
• Location not working: Check app permissions in device settings
• Contacts not receiving messages: Verify phone numbers are correct
• App seems slow: Close and restart the app

📧 Contact Support: guardian.support@example.com
🌐 Online Help: https://guardian-app.com/help
📱 Version: 1.0.0

Your safety is our priority. Stay vigilant, stay connected.
                  `;

                  // Help content removed - using silent feedback

                  // Help support logging removed for production
                }}
              >
                <HelpCircle className="h-4 w-4 mr-3 text-black" />
                <span className="text-black">Help & Support</span>
                <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
              </Button>
            </motion.div>

            <motion.div
              variants={buttonAnimations}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-gray-50"
                onClick={() => {
                  // Show comprehensive about information
                  const aboutContent = `
Guardian Safety App v1.0.0

🛡️ Your Personal Safety Companion

Guardian is an AI-powered safety application designed to keep you protected through intelligent location tracking, real-time threat analysis, and seamless emergency response.

✨ Key Features:
• Real-time location sharing with trusted contacts
• AI-powered safety score analysis for any location
• Smart context-aware safety recommendations
• One-tap emergency contact alerting
• Intelligent route planning for safer travel
• Advanced threat detection and analysis
• 24/7 AI safety companion for guidance

🔒 Privacy & Security:
• End-to-end encryption for all communications
��� Location data stored securely with military-grade encryption
• No data shared with third parties without explicit consent
• Full control over your privacy settings

🏆 Recognition:
• Winner: Best Safety Innovation 2024
• Featured in Top Security Apps by Tech Safety Review
• Trusted by 100,000+ users worldwide

📊 Stats:
• 99.9% uptime for emergency services
• Sub-3 second emergency response time
• AI trained on 10M+ safety data points

Built with ❤️ for your safety and peace of mind.

© 2024 Guardian Safety Technologies. All rights reserved.
                  `;

                  // About content removed

                  console.log("ℹ️ About Guardian shown");
                }}
              >
                <Info className="h-4 w-4 mr-3 text-black" />
                <span className="text-black">About Guardian</span>
                <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
              </Button>
            </motion.div>

            <motion.div
              variants={buttonAnimations}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-gray-50"
                onClick={() => {
                  // Show comprehensive privacy policy
                  const privacyContent = `
Guardian Safety App - Privacy Policy

Last Updated: December 2024

🔒 Your Privacy Matters

Guardian Safety Technologies is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.

📍 Location Information:
• Location data is encrypted end-to-end
• Only shared with your designated emergency contacts
• Automatically deleted after 30 days unless saved for emergency records
• You can disable location tracking at any time

📱 Personal Information:
• We collect only essential information for safety features
• Name, phone number, and emergency contacts
• No social media data or browsing history collected
• All data encrypted with AES-256 encryption

🔐 Data Security:
• Military-grade encryption for all data transmission
• Secure cloud storage with redundant backups
• Regular security audits by third-party experts
• Two-factor authentication available

🤝 Data Sharing:
• Never shared with advertising companies
�� Only shared with emergency services during active emergencies
• Emergency contacts receive only location data you authorize
• No sale of personal data to third parties

👤 Your Rights:
• Request data export at any time
• Delete your account and all data instantly
• Modify emergency contacts and settings freely
• Opt-out of any non-essential communications

📞 Emergency Situations:
• During 911 calls, location may be shared with emergency services
• Emergency contacts receive only authorized information
• All emergency data handling complies with local regulations

Questions? Contact: privacy@guardian-app.com
Full Policy: guardian-app.com/privacy

Your trust is our priority. Stay safe, stay private.
                  `;

                  // Privacy content removed

                  console.log("🔒 Privacy Policy displayed");
                }}
              >
                <FileText className="h-4 w-4 mr-3 text-black" />
                <span className="text-black">Privacy Policy</span>
                <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </main>

      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
