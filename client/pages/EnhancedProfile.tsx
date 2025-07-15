import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Shield,
  Users,
  MapPin,
  Activity,
  Bell,
  Phone,
  MessageSquare,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GuardianKeyCard } from "@/components/GuardianKeyCard";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { SimpleNavbar } from "@/components/SimpleNavbar";
import { SimpleBottomNav } from "@/components/SimpleBottomNav";
import { CompactProfileHeader } from "@/components/CompactProfileHeader";
import { cn } from "@/lib/utils";
import { useRealTimeData } from "@/services/realTimeService";

import {
  staggerContainer,
  staggerItem,
  cardAnimations,
} from "@/lib/animations";

export default function EnhancedProfile() {
  const [activeTab, setActiveTab] = useState("profile");

  const { userProfile } = useAuth();
  const { stats, isConnected } = useRealTimeData();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const emergencyContacts = userProfile?.emergencyContacts || [];

  return (
    <div className="min-h-screen bg-background safe-bottom-spacing">
      <SimpleNavbar />

      <main className="container px-4 py-6 space-y-6 pb-32">
        {/* Compact Profile Header */}
        <CompactProfileHeader />

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem}>
            <Card className="relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"
                animate={{
                  background: isConnected
                    ? [
                        "linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1))",
                        "linear-gradient(to bottom right, rgba(147, 51, 234, 0.05), rgba(147, 51, 234, 0.1))",
                      ]
                    : "linear-gradient(to bottom right, rgba(156, 163, 175, 0.05), rgba(156, 163, 175, 0.1))",
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
              <CardContent className="p-4 text-center relative z-10">
                <motion.div
                  className="text-2xl font-bold text-primary"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {stats?.emergencyContacts ?? emergencyContacts.length}
                </motion.div>
                <div className="text-sm text-muted-foreground">
                  Emergency Contacts
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Card className="relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50"
                animate={{
                  opacity: stats?.activeAlerts ? [0.5, 0.8, 0.5] : 0.3,
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <CardContent className="p-4 text-center relative z-10">
                <motion.div
                  className={cn(
                    "text-2xl font-bold",
                    (stats?.activeAlerts ?? 0) > 0
                      ? "text-red-600"
                      : "text-safe",
                  )}
                  animate={{
                    scale: (stats?.activeAlerts ?? 0) > 0 ? [1, 1.1, 1] : 1,
                    color:
                      (stats?.activeAlerts ?? 0) > 0
                        ? ["#dc2626", "#ef4444", "#dc2626"]
                        : "#059669",
                  }}
                  transition={{
                    duration: 1,
                    repeat:
                      (stats?.activeAlerts ?? 0) > 0 ? Infinity : undefined,
                  }}
                >
                  {stats?.activeAlerts ?? 0}
                </motion.div>
                <div className="text-sm text-muted-foreground">
                  Active Alerts
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Card className="relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <CardContent className="p-4 text-center relative z-10">
                <motion.div
                  className="text-2xl font-bold text-green-600"
                  animate={{
                    scale: [1, 1.05, 1],
                    textShadow: [
                      "0 0 0px rgba(34, 197, 94, 0)",
                      "0 0 8px rgba(34, 197, 94, 0.3)",
                      "0 0 0px rgba(34, 197, 94, 0)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {stats?.safeTrips ?? 0}
                </motion.div>
                <div className="text-sm text-muted-foreground">Safe Trips</div>
                {isConnected && (
                  <motion.div
                    className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Guardian Key Section */}
        <GuardianKeyCard />

        {/* Emergency Contacts Section */}
        <EmergencyContactManager />

        {/* Safety Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-warning" />
                  <span className="text-sm">Auto SOS</span>
                </div>
                <Badge variant="outline" className="bg-safe/10 text-safe">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm">Location Services</span>
                </div>
                <Badge variant="outline" className="bg-safe/10 text-safe">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emergency" />
                  <span className="text-sm">Emergency Call</span>
                </div>
                <Badge variant="outline" className="bg-safe/10 text-safe">
                  Ready
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-protection" />
                  <span className="text-sm">Silent Alerts</span>
                </div>
                <Badge variant="outline" className="bg-safe/10 text-safe">
                  Ready
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="p-2 rounded-full bg-safe/10">
                  <Shield className="h-4 w-4 text-safe" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Profile created</p>
                  <p className="text-xs text-muted-foreground">
                    Guardian key generated and secured
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {userProfile?.createdAt && formatDate(userProfile.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Account verified</p>
                  <p className="text-xs text-muted-foreground">
                    Email address confirmed
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {userProfile?.createdAt && formatDate(userProfile.createdAt)}
                </span>
              </div>

              {emergencyContacts.length > 0 && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 rounded-full bg-warning/10">
                    <Users className="h-4 w-4 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Emergency contacts added
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {emergencyContacts.length} contact
                      {emergencyContacts.length > 1 ? "s" : ""} configured
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Recent</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <SimpleBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSOSPress={() => {}}
      />
    </div>
  );
}
