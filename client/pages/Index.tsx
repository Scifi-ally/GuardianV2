import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Users,
  Settings,
  Activity,
  Clock,
  Shield,
  Heart,
  Phone,
  AlertTriangle,
  Camera,
  MessageSquare,
  Zap,
  Eye,
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
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const [safetyStatus, setSafetyStatus] = useState<
    "safe" | "alert" | "emergency"
  >("safe");
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { userProfile } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const handleEmergencyTrigger = () => {
    setSafetyStatus("emergency");
    console.log("Emergency triggered!");
    setTimeout(() => setSafetyStatus("safe"), 5000);
  };

  const shareLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const message = `Guardian Emergency: I'm at https://maps.google.com/?q=${latitude},${longitude}`;

          if (navigator.share) {
            await navigator.share({
              title: "Guardian Location",
              text: message,
            });
          } else {
            await navigator.clipboard.writeText(message);
            alert("Location copied to clipboard!");
          }
        });
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const quickCall = () => {
    window.location.href = "tel:911";
  };

  const statusColors = {
    safe: "bg-safe text-safe-foreground",
    alert: "bg-warning text-warning-foreground",
    emergency: "bg-emergency text-emergency-foreground animate-pulse",
  };

  const statusLabels = {
    safe: "Safe",
    alert: "On Alert",
    emergency: "Emergency Active",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-6">
          <LoadingAnimation size="xl" variant="guardian" />
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading Guardian...</p>
            <p className="text-sm text-muted-foreground">
              Securing your safety experience...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-safe/5">
      <ScrollProgress />
      <NavHeader />

      <main className="container px-4 py-6 space-y-6 pb-32">
        {/* Enhanced Status Header */}
        <AnimatedCard direction="fade" delay={100}>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-card via-card/95 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 rounded-full bg-primary/10 border-2 border-primary/20">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-safe rounded-full border-2 border-background animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">
                      Hello, {userProfile?.displayName || "Guardian"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {currentTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      • {currentTime.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className={statusColors[safetyStatus]} variant="outline">
                  <Activity className="h-3 w-3 mr-1" />
                  {statusLabels[safetyStatus]}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Emergency Quick Access */}
        <AnimatedCard direction="up" delay={200}>
          <Card className="border-2 border-emergency/20 bg-gradient-to-br from-emergency/5 to-emergency/10 shadow-xl">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-emergency" />
                  <h2 className="text-lg font-bold">Emergency Access</h2>
                </div>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Quick access to emergency features. Tap any button for
                  immediate assistance.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={quickCall}
                    className="h-14 bg-emergency hover:bg-emergency/90 text-emergency-foreground shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Call 911
                  </Button>
                  <Button
                    onClick={shareLocation}
                    variant="outline"
                    className="h-14 border-2 border-warning hover:bg-warning hover:text-warning-foreground shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <MapPin className="h-5 w-5 mr-2" />
                    Share Location
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Enhanced Quick Actions */}
        <AnimatedCard direction="up" delay={300}>
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                Quick Safety Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:bg-safe/10 hover:border-safe/50 transition-all duration-300 transform hover:scale-105"
                  onClick={() => console.log("Emergency contacts")}
                >
                  <Users className="h-6 w-6 text-safe" />
                  <span className="text-xs font-medium">Contacts</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 transform hover:scale-105"
                  onClick={() => console.log("Safe routes")}
                >
                  <Navigation className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">Safe Route</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:bg-protection/10 hover:border-protection/50 transition-all duration-300 transform hover:scale-105"
                  onClick={() => console.log("Evidence camera")}
                >
                  <Camera className="h-6 w-6 text-protection" />
                  <span className="text-xs font-medium">Evidence</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:bg-warning/10 hover:border-warning/50 transition-all duration-300 transform hover:scale-105"
                  onClick={() => console.log("Silent alert")}
                >
                  <MessageSquare className="h-6 w-6 text-warning" />
                  <span className="text-xs font-medium">Silent Alert</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:bg-safe/10 hover:border-safe/50 transition-all duration-300 transform hover:scale-105"
                  onClick={() => console.log("Check-in timer")}
                >
                  <Clock className="h-6 w-6 text-safe" />
                  <span className="text-xs font-medium">Check-in</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:bg-muted/50 hover:border-muted-foreground/50 transition-all duration-300 transform hover:scale-105"
                  onClick={() => console.log("Stealth mode")}
                >
                  <Eye className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs font-medium">Stealth</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Safety Statistics */}
        <AnimatedCard direction="up" delay={400}>
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Safety Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-safe/10 border border-safe/20">
                  <div className="text-2xl font-bold text-safe mb-1">
                    {userProfile?.emergencyContacts?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Emergency Contacts
                  </div>
                  {!userProfile?.emergencyContacts?.length && (
                    <Badge
                      variant="outline"
                      className="text-xs mt-2 border-warning text-warning"
                    >
                      Add Now
                    </Badge>
                  )}
                </div>
                <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="text-2xl font-bold text-primary mb-1">
                    24/7
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Protection Active
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs mt-2 border-primary text-primary"
                  >
                    Online
                  </Badge>
                </div>
                <div className="text-center p-4 rounded-xl bg-protection/10 border border-protection/20">
                  <div className="text-2xl font-bold text-protection mb-1">
                    {Math.floor(Math.random() * 50) + 20}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Safe Journeys
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs mt-2 border-protection text-protection"
                  >
                    This Month
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Enhanced Safety Features */}
        <div>
          <AnimatedCard direction="up" delay={500}>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Safety Features
            </h3>
          </AnimatedCard>
          <div className="grid gap-6 md:grid-cols-2">
            <AnimatedCard direction="up" delay={600}>
              <SafetyFeatureCard
                title="Live Location Sharing"
                description="Share your real-time location with trusted contacts during journeys"
                icon={MapPin}
                buttonText="Start Sharing"
                variant="safe"
                onClick={() => console.log("Start location sharing")}
                className="transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-safe/20 bg-gradient-to-br from-safe/5 to-safe/10"
              />
            </AnimatedCard>

            <AnimatedCard direction="up" delay={700}>
              <SafetyFeatureCard
                title="Smart Route Planning"
                description="Get AI-powered safe routes with well-lit paths and populated areas"
                icon={Navigation}
                buttonText="Plan Route"
                variant="primary"
                onClick={() => console.log("Plan safe route")}
                className="transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
              />
            </AnimatedCard>

            <AnimatedCard direction="up" delay={800}>
              <SafetyFeatureCard
                title="Emergency Network"
                description="Manage trusted contacts who receive instant alerts during emergencies"
                icon={Users}
                buttonText="Manage Contacts"
                variant="default"
                onClick={() => console.log("Manage emergency contacts")}
                className="transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-muted/20 bg-gradient-to-br from-muted/5 to-muted/10"
              />
            </AnimatedCard>

            <AnimatedCard direction="up" delay={900}>
              <SafetyFeatureCard
                title="Evidence Recording"
                description="Discreet photo, video, and audio recording with automatic cloud backup"
                icon={Camera}
                buttonText="Open Camera"
                variant="default"
                onClick={() => console.log("Open evidence camera")}
                className="transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-protection/20 bg-gradient-to-br from-protection/5 to-protection/10"
              />
            </AnimatedCard>
          </div>
        </div>

        {/* Recent Activity - Enhanced */}
        <AnimatedCard direction="up" delay={1000}>
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </div>
                <Badge variant="outline" className="text-xs">
                  Last 24h
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-safe/5 border border-safe/20 transition-all duration-200 hover:bg-safe/10">
                  <div className="p-2 rounded-full bg-safe/20">
                    <MapPin className="h-4 w-4 text-safe" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Location shared with 2 contacts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      2 hours ago • Downtown area
                    </p>
                  </div>
                  <Badge className="bg-safe/20 text-safe text-xs">Safe</Badge>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl bg-primary/5 border border-primary/20 transition-all duration-200 hover:bg-primary/10">
                  <div className="p-2 rounded-full bg-primary/20">
                    <Navigation className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Safe route completed to home
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Yesterday • 2.3 km journey
                    </p>
                  </div>
                  <Badge className="bg-primary/20 text-primary text-xs">
                    Complete
                  </Badge>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/20 border border-muted/20 transition-all duration-200 hover:bg-muted/30">
                  <div className="p-2 rounded-full bg-muted/40">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Emergency contact added
                    </p>
                    <p className="text-xs text-muted-foreground">
                      3 days ago • Family member
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Added
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Safety Tips */}
        <AnimatedCard direction="up" delay={1100}>
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-primary" />
                Safety Tip of the Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm">
                  <strong>Share your journey:</strong> Always let trusted
                  contacts know your planned route and expected arrival time,
                  especially during late hours.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Tip updates daily to keep you informed</span>
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
