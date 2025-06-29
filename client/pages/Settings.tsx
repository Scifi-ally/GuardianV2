import { useState } from "react";
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
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
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

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      push: true,
      email: true,
      sms: false,
      emergencyOnly: false,
    },
    privacy: {
      shareLocation: true,
      anonymousReporting: true,
      dataSaving: false,
    },
    safety: {
      sosCountdown: 3,
      autoAlert: true,
      soundEnabled: true,
      vibrationEnabled: true,
    },
    appearance: {
      darkMode: false,
      language: "en",
    },
  });

  const handleSOSPress = () => {
    console.log("SOS triggered from settings");
  };

  const updateSetting = (
    category: keyof typeof settings,
    key: string,
    value: any,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
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
        {
          id: "email",
          label: "Email Alerts",
          description: "Emergency notifications via email",
          type: "switch",
          value: settings.notifications.email,
          category: "notifications" as const,
        },
        {
          id: "sms",
          label: "SMS Alerts",
          description: "Text message notifications",
          type: "switch",
          value: settings.notifications.sms,
          category: "notifications" as const,
        },
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
          id: "soundEnabled",
          label: "Sound Alerts",
          description: "Play sound during emergency",
          type: "switch",
          value: settings.safety.soundEnabled,
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
    <div className="min-h-screen bg-background pb-24">
      <main className="container px-4 py-6 space-y-6">
        {/* Header */}
        <AnimatedCard direction="fade" delay={100}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Customize your Guardian experience
              </p>
            </div>
          </div>
        </AnimatedCard>

        {/* Quick Status */}
        <AnimatedCard direction="up" delay={200}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-safe/10">
                    <Shield className="h-5 w-5 text-safe" />
                  </div>
                  <div>
                    <p className="font-medium">Safety Status</p>
                    <p className="text-sm text-muted-foreground">
                      All systems active
                    </p>
                  </div>
                </div>
                <Badge className="bg-safe text-safe-foreground">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <AnimatedCard
            key={section.title}
            direction="up"
            delay={300 + sectionIndex * 100}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <section.icon className="h-5 w-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">
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
          </AnimatedCard>
        ))}

        {/* Additional Options */}
        <AnimatedCard direction="up" delay={700}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="h-5 w-5" />
                Support & Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start transition-all duration-200 hover:scale-105"
              >
                <HelpCircle className="h-4 w-4 mr-3" />
                Help & Support
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start transition-all duration-200 hover:scale-105"
              >
                <Info className="h-4 w-4 mr-3" />
                About Guardian
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start transition-all duration-200 hover:scale-105"
              >
                <Shield className="h-4 w-4 mr-3" />
                Privacy Policy
              </Button>
            </CardContent>
          </Card>
        </AnimatedCard>
      </main>

      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
