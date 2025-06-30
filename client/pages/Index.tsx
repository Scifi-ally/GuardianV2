import { useState } from "react";
import {
  MapPin,
  Navigation,
  Users,
  Settings,
  Activity,
  Clock,
  Shield,
  Heart,
} from "lucide-react";
import { Navigation as NavHeader } from "@/components/Navigation";
import { MagicNavbar } from "@/components/MagicNavbar";
import { ScrollProgress } from "@/components/ScrollProgress";
import { AnimatedCard } from "@/components/AnimatedCard";
import { LoadingAnimation, CardSkeleton } from "@/components/LoadingAnimation";
import { SafetyFeatureCard } from "@/components/SafetyFeatureCard";
import { QuickActions } from "@/components/QuickActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Index() {
  const [lastLocation, setLastLocation] = useState("Downtown Coffee Shop");
  const [safetyStatus, setSafetyStatus] = useState<
    "safe" | "alert" | "emergency"
  >("safe");
  const [isLoading, setIsLoading] = useState(true);

  useState(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  });

  const handleEmergencyTrigger = () => {
    setSafetyStatus("emergency");
    console.log("Emergency triggered!");
    setTimeout(() => setSafetyStatus("safe"), 5000);
  };

  const handleMapPress = () => {
    console.log("Map pressed");
  };

  const handleProfilePress = () => {
    console.log("Profile pressed");
  };

  const statusColors = {
    safe: "bg-safe text-safe-foreground",
    alert: "bg-warning text-warning-foreground",
    emergency: "bg-emergency text-emergency-foreground",
  };

  const statusLabels = {
    safe: "Safe",
    alert: "On Alert",
    emergency: "Emergency Active",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingAnimation size="lg" />
          <p className="text-muted-foreground">Loading Guardian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <NavHeader />

      <main className="container px-4 py-6 space-y-8 pb-32">
        {/* Welcome Section */}
        <AnimatedCard direction="fade" delay={200}>
          <Card className="text-center py-8 bg-gradient-to-br from-background to-muted/10 border-0 shadow-sm">
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">Stay Safe</h2>
                  <p className="text-muted-foreground max-w-md mx-auto text-lg">
                    Your personal safety companion. Use the SOS button below for
                    emergencies.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 bg-safe/10 px-3 py-2 rounded-full">
                  <Shield className="h-4 w-4 text-safe" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-full">
                  <Heart className="h-4 w-4 text-primary" />
                  <span>Trusted</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Quick Actions */}
        <AnimatedCard direction="up" delay={300}>
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Safety Features */}
        <div>
          <AnimatedCard direction="up" delay={400}>
            <h3 className="text-xl font-semibold mb-6">Safety Features</h3>
          </AnimatedCard>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatedCard direction="up" delay={500}>
              <SafetyFeatureCard
                title="Share Location"
                description="Share your real-time location with trusted contacts via secure link"
                icon={MapPin}
                buttonText="Share Now"
                variant="safe"
                onClick={() => console.log("Share location")}
                className="transition-all duration-300 hover:scale-105"
              />
            </AnimatedCard>

            <AnimatedCard direction="up" delay={600}>
              <SafetyFeatureCard
                title="Safe Route"
                description="Get navigation with safety-optimized routes for walking or driving"
                icon={Navigation}
                buttonText="Plan Route"
                variant="primary"
                onClick={() => console.log("Plan route")}
                className="transition-all duration-300 hover:scale-105"
              />
            </AnimatedCard>

            <AnimatedCard direction="up" delay={700}>
              <SafetyFeatureCard
                title="Emergency Contacts"
                description="Manage your trusted contacts who will be notified during emergencies"
                icon={Users}
                buttonText="Manage"
                variant="default"
                onClick={() => console.log("Manage contacts")}
                className="transition-all duration-300 hover:scale-105"
              />
            </AnimatedCard>
          </div>
        </div>

        {/* Recent Activity */}
        <AnimatedCard direction="up" delay={800}>
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 transition-all duration-200 hover:bg-muted/50 rounded-lg px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-safe/10">
                      <MapPin className="h-4 w-4 text-safe" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location shared</p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Safe
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-3 transition-all duration-200 hover:bg-muted/50 rounded-lg px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Navigation className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Safe route completed
                      </p>
                      <p className="text-xs text-muted-foreground">Yesterday</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Complete
                  </Badge>
                </div>

                <div className="flex items-center justify-between py-3 transition-all duration-200 hover:bg-muted/50 rounded-lg px-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Contact added</p>
                      <p className="text-xs text-muted-foreground">
                        3 days ago
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Added
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </main>

      <MagicNavbar onSOSPress={handleEmergencyTrigger} />
    </div>
  );
}
