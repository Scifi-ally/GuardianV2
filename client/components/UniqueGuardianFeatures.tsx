import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Eye,
  Users,
  Waves,
  Footprints,
  Zap,
  Brain,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";

// Import our unique components
import { InvisibleSOS } from "./InvisibleSOS";
import { GuardianBuddySystem } from "./GuardianBuddySystem";
import { SafetyAura } from "./SafetyAura";

// Import services
import { panicDetectionService } from "@/services/panicDetectionService";
import { safetyBreadcrumbsService } from "@/services/safetyBreadcrumbsService";
import { geminiService } from "@/services/geminiService";

export function UniqueGuardianFeatures() {
  const [activeFeatures, setActiveFeatures] = useState<string[]>([]);

  const features = [
    {
      id: "panic-detection",
      name: "Panic Pattern Detection",
      description: "AI detects emergency situations from device sensors",
      icon: <Brain className="h-5 w-5" />,
      status: panicDetectionService.isRunning() ? "active" : "inactive",
      uniqueness: 95,
    },
    {
      id: "invisible-sos",
      name: "Invisible SOS",
      description: "Disguised emergency activation through normal interactions",
      icon: <Eye className="h-5 w-5" />,
      status: "available",
      uniqueness: 98,
    },
    {
      id: "buddy-system",
      name: "Guardian Buddy Network",
      description: "Peer-to-peer safety monitoring and check-ins",
      icon: <Users className="h-5 w-5" />,
      status: "active",
      uniqueness: 92,
    },
    {
      id: "safety-aura",
      name: "Safety Aura",
      description: "Real-time visual safety radius with environmental data",
      icon: <Waves className="h-5 w-5" />,
      status: "available",
      uniqueness: 96,
    },
    {
      id: "safety-breadcrumbs",
      name: "Safety Breadcrumbs",
      description: "Automated location trail for emergency tracking",
      icon: <Footprints className="h-5 w-5" />,
      status: safetyBreadcrumbsService.isTrackingActive()
        ? "active"
        : "inactive",
      uniqueness: 89,
    },
    {
      id: "ai-safety-coach",
      name: "AI Safety Coach",
      description: "Intelligent safety recommendations powered by Gemini AI",
      icon: <Zap className="h-5 w-5" />,
      status: geminiService.isConfigured() ? "available" : "setup-required",
      uniqueness: 94,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "available":
        return "bg-blue-100 text-blue-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "setup-required":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUniquenessColor = (score: number) => {
    if (score >= 95) return "text-purple-600";
    if (score >= 90) return "text-blue-600";
    if (score >= 85) return "text-green-600";
    return "text-gray-600";
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            Unique Guardian Features
            <Badge className="bg-purple-100 text-purple-800">
              🚀 World's First
            </Badge>
          </CardTitle>
          <p className="text-gray-600">
            Cutting-edge safety features that make your Guardian app truly
            unique and powerful.
          </p>
        </CardHeader>
      </Card>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-blue-600">{feature.icon}</div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={getStatusColor(feature.status)}>
                      {feature.status.replace("-", " ")}
                    </Badge>
                    <div
                      className={`text-xs font-semibold ${getUniquenessColor(feature.uniqueness)}`}
                    >
                      {feature.uniqueness}% unique
                    </div>
                  </div>
                </div>
                <h4 className="font-semibold text-sm mb-1">{feature.name}</h4>
                <p className="text-xs text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="invisible-sos" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
              <TabsTrigger
                value="invisible-sos"
                className="text-xs p-2 data-[state=active]:bg-red-100 data-[state=active]:text-red-800"
              >
                <Eye className="h-4 w-4 mr-1" />
                Invisible SOS
              </TabsTrigger>
              <TabsTrigger
                value="buddy-system"
                className="text-xs p-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
              >
                <Users className="h-4 w-4 mr-1" />
                Buddy System
              </TabsTrigger>
              <TabsTrigger
                value="safety-aura"
                className="text-xs p-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800"
              >
                <Waves className="h-4 w-4 mr-1" />
                Safety Aura
              </TabsTrigger>
              <TabsTrigger
                value="panic-detection"
                className="text-xs p-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
              >
                <Brain className="h-4 w-4 mr-1" />
                Panic AI
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="invisible-sos" className="mt-0">
                <div className="space-y-4">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="font-semibold text-red-800">
                      🕵️ Invisible SOS System
                    </h3>
                    <p className="text-sm text-gray-600">
                      Activate emergency mode through normal phone interactions
                      that won't raise suspicion. Perfect for situations where
                      you can't openly call for help.
                    </p>
                  </div>
                  <InvisibleSOS />
                </div>
              </TabsContent>

              <TabsContent value="buddy-system" className="mt-0">
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-blue-800">
                      👥 Guardian Buddy Network
                    </h3>
                    <p className="text-sm text-gray-600">
                      Connect with friends and family for mutual safety
                      monitoring. Automated check-ins and real-time status
                      sharing.
                    </p>
                  </div>
                  <GuardianBuddySystem />
                </div>
              </TabsContent>

              <TabsContent value="safety-aura" className="mt-0">
                <div className="space-y-4">
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-purple-800">
                      🌊 Smart Safety Aura
                    </h3>
                    <p className="text-sm text-gray-600">
                      Real-time environmental safety analysis with visual
                      feedback. See your safety radius and get instant alerts
                      about changing conditions.
                    </p>
                  </div>
                  <SafetyAura />
                </div>
              </TabsContent>

              <TabsContent value="panic-detection" className="mt-0">
                <div className="space-y-4">
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="font-semibold text-orange-800">
                      🧠 AI Panic Detection
                    </h3>
                    <p className="text-sm text-gray-600">
                      Advanced AI monitors your device sensors to automatically
                      detect panic situations and emergency behaviors.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Detection Status</h4>
                          <Badge
                            className={
                              panicDetectionService.isRunning()
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {panicDetectionService.isRunning()
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="font-medium">
                              Monitored Patterns:
                            </div>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>• Shake patterns</li>
                              <li>• Rapid screen taps</li>
                              <li>• Erratic movement</li>
                              <li>• Biometric changes</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <div className="font-medium">AI Confidence:</div>
                            <div className="text-xs text-gray-600">
                              Requires 75%+ confidence before triggering
                              emergency protocols.
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <button
                            onClick={() => {
                              if (panicDetectionService.isRunning()) {
                                panicDetectionService.stop();
                              } else {
                                panicDetectionService.start();
                              }
                            }}
                            className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                              panicDetectionService.isRunning()
                                ? "bg-red-100 text-red-800 hover:bg-red-200"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                          >
                            {panicDetectionService.isRunning()
                              ? "Stop Detection"
                              : "Start Detection"}
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">6</div>
              <div className="text-xs text-gray-500">Unique Features</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">94%</div>
              <div className="text-xs text-gray-500">Avg Uniqueness</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {features.filter((f) => f.status === "active").length}
              </div>
              <div className="text-xs text-gray-500">Active Now</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">AI</div>
              <div className="text-xs text-gray-500">Powered</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h3 className="font-bold text-lg mb-2">
            World's Most Advanced Safety App
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            These features are completely unique to Guardian and represent the
            cutting edge of personal safety technology.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge className="bg-purple-100 text-purple-800">
              🥇 Industry First
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">🤖 AI Powered</Badge>
            <Badge className="bg-green-100 text-green-800">
              🛡️ Privacy First
            </Badge>
            <Badge className="bg-orange-100 text-orange-800">
              ⚡ Real-time
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UniqueGuardianFeatures;
