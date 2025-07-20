import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TestTube,
  Users,
  QrCode,
  Smartphone,
  Shield,
  Zap,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { ModernEmergencyContactManager } from "@/components/ModernEmergencyContactManager";
import { EmergencyContactTester } from "@/components/EmergencyContactTester";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function EmergencyContactTest() {
  const [activeDemo, setActiveDemo] = useState<"modern" | "legacy" | "tester">(
    "modern",
  );
  const navigate = useNavigate();

  const features = [
    {
      icon: QrCode,
      title: "QR Code Integration",
      description: "Scan Guardian Keys with camera or upload images",
      status: "implemented",
    },
    {
      icon: Smartphone,
      title: "Capacitor Ready",
      description: "Full mobile app compatibility with native features",
      status: "implemented",
    },
    {
      icon: Shield,
      title: "Extreme Case Handling",
      description: "Robust error handling and edge case management",
      status: "implemented",
    },
    {
      icon: Zap,
      title: "Modern UI/UX",
      description: "Compact, intuitive design with smooth animations",
      status: "implemented",
    },
    {
      icon: Users,
      title: "Priority System",
      description: "Organize contacts by emergency response priority",
      status: "implemented",
    },
    {
      icon: TestTube,
      title: "Comprehensive Testing",
      description: "Full test suite for reliability and performance",
      status: "implemented",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "implemented":
        return "bg-green-100 text-green-800 border-green-300";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "planned":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "implemented":
        return <CheckCircle className="h-4 w-4" />;
      case "in-progress":
        return <AlertTriangle className="h-4 w-4" />;
      case "planned":
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Emergency Contact System
                </h1>
                <p className="text-sm text-gray-600">
                  Modern, Capacitor-ready contact management
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-green-300 text-green-700"
            >
              Development Build
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Features Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Implementation Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {feature.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                getStatusColor(feature.status),
                              )}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(feature.status)}
                                {feature.status}
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Demo Tabs */}
        <Tabs value={activeDemo} onValueChange={(v) => setActiveDemo(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modern" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Modern Design
            </TabsTrigger>
            <TabsTrigger value="legacy" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Legacy Design
            </TabsTrigger>
            <TabsTrigger value="tester" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test Suite
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modern" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  Modern Emergency Contact Manager
                </CardTitle>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>✅ Compact, mobile-first design with white/black theme</p>
                  <p>✅ QR code scanning for Guardian Keys</p>
                  <p>✅ Capacitor-ready with native camera integration</p>
                  <p>✅ Extreme case handling and error recovery</p>
                  <p>✅ Smooth animations and intuitive UX</p>
                </div>
              </CardHeader>
              <CardContent>
                <ModernEmergencyContactManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legacy" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-600" />
                  Legacy Emergency Contact Manager
                </CardTitle>
                <div className="text-sm text-gray-600">
                  <p>Previous implementation for comparison</p>
                </div>
              </CardHeader>
              <CardContent>
                <EmergencyContactManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tester" className="mt-6">
            <EmergencyContactTester />
          </TabsContent>
        </Tabs>

        {/* Technical Notes */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Technical Implementation Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  QR Code Implementation
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Enhanced QR service with Capacitor camera integration</li>
                  <li>
                    Support for multiple QR formats (JSON, legacy, direct key)
                  </li>
                  <li>File upload scanning as fallback option</li>
                  <li>Comprehensive error handling for malformed codes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Capacitor Compatibility
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Native camera permissions handling</li>
                  <li>Platform-specific optimizations (iOS/Android/Web)</li>
                  <li>Graceful fallbacks for web environments</li>
                  <li>Device capability detection and adaptation</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Extreme Case Handling
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Input validation with comprehensive sanitization</li>
                  <li>Memory pressure testing and optimization</li>
                  <li>Network connectivity edge cases</li>
                  <li>Concurrent operations and race condition prevention</li>
                  <li>Performance monitoring and timeout handling</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Modern Design Features
                </h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Compact layout optimized for mobile screens</li>
                  <li>Black and white theme with strategic color accents</li>
                  <li>Smooth micro-interactions and loading states</li>
                  <li>Priority-based visual hierarchy</li>
                  <li>Accessibility-focused design patterns</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
