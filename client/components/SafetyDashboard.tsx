import { useState, useEffect } from "react";
import {
  Users,
  Activity,
  Shield,
  Heart,
  MapPin,
  Clock,
  Phone,
  Bell,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SafetyMetrics {
  safetyScore: number;
  emergencyContactsCount: number;
  protectionHours: number;
  safeTripsCount: number;
  alertsToday: number;
  locationShares: number;
  lastCheckIn: Date | null;
  activeSince: Date;
}

interface SafetyDashboardProps {
  onContactsClick?: () => void;
  onAlertsClick?: () => void;
  onTripsClick?: () => void;
  className?: string;
}

export function SafetyDashboard({
  onContactsClick,
  onAlertsClick,
  onTripsClick,
  className,
}: SafetyDashboardProps) {
  const { userProfile } = useAuth();
  const [metrics, setMetrics] = useState<SafetyMetrics>({
    safetyScore: 0,
    emergencyContactsCount: 0,
    protectionHours: 0,
    safeTripsCount: 0,
    alertsToday: 0,
    locationShares: 0,
    lastCheckIn: null,
    activeSince: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);

  // Calculate safety metrics
  useEffect(() => {
    const calculateMetrics = () => {
      const emergencyContacts = userProfile?.emergencyContacts || [];
      const accountCreated = userProfile?.createdAt
        ? new Date(userProfile.createdAt)
        : new Date();

      // Ensure valid date
      const createdTime = accountCreated.getTime();
      const currentTime = Date.now();

      // Calculate protection hours (time since account creation)
      const protectionHours = isNaN(createdTime)
        ? 24
        : Math.max(
            1,
            Math.floor((currentTime - createdTime) / (1000 * 60 * 60)),
          );

      // Calculate safety score based on various factors
      let safetyScore = 0;

      // Base score for having the app
      safetyScore += 20;

      // Emergency contacts (up to 40 points)
      const contactsCount = Array.isArray(emergencyContacts)
        ? emergencyContacts.length
        : 0;
      safetyScore += Math.min(contactsCount * 10, 40);

      // Verified contacts bonus (up to 20 points)
      const verifiedContacts = Array.isArray(emergencyContacts)
        ? emergencyContacts.filter((contact) => contact?.isVerified).length
        : 0;
      safetyScore += Math.min(verifiedContacts * 5, 20);

      // Profile completion (up to 10 points)
      if (userProfile?.displayName) safetyScore += 5;
      if (userProfile?.phone) safetyScore += 5;

      // Time-based bonus (up to 10 points)
      if (protectionHours > 24) safetyScore += 5;
      if (protectionHours > 168) safetyScore += 5; // 1 week

      // Simulate some activity data with safe defaults
      const safeTripsCount = Math.max(
        15,
        Math.floor(protectionHours / 24) + 15,
      );
      const locationShares = Math.max(5, Math.floor(Math.random() * 20) + 5);

      // Ensure all values are valid numbers
      const finalMetrics = {
        safetyScore: Math.max(0, Math.min(safetyScore || 0, 100)),
        emergencyContactsCount: contactsCount,
        protectionHours: protectionHours,
        safeTripsCount: safeTripsCount,
        alertsToday: 0, // Would come from alert history
        locationShares: locationShares,
        lastCheckIn: null, // Would come from check-in history
        activeSince: accountCreated,
      };

      // Validate all numeric values
      Object.keys(finalMetrics).forEach((key) => {
        const value = finalMetrics[key as keyof typeof finalMetrics];
        if (typeof value === "number" && (isNaN(value) || !isFinite(value))) {
          console.warn(`Invalid numeric value for ${key}:`, value);
          // Set safe defaults
          switch (key) {
            case "safetyScore":
              (finalMetrics as any)[key] = 20;
              break;
            case "protectionHours":
              (finalMetrics as any)[key] = 24;
              break;
            case "safeTripsCount":
              (finalMetrics as any)[key] = 15;
              break;
            case "locationShares":
              (finalMetrics as any)[key] = 5;
              break;
            default:
              (finalMetrics as any)[key] = 0;
          }
        }
      });

      setMetrics(finalMetrics);
      setIsLoading(false);
    };

    if (userProfile) {
      calculateMetrics();
    } else {
      // Set safe defaults when no user profile
      setMetrics({
        safetyScore: 20,
        emergencyContactsCount: 0,
        protectionHours: 24,
        safeTripsCount: 15,
        alertsToday: 0,
        locationShares: 5,
        lastCheckIn: null,
        activeSince: new Date(),
      });
      setIsLoading(false);
    }
  }, [userProfile]);

  const getSafetyGrade = (score: number) => {
    // Ensure score is a valid number
    const validScore =
      typeof score === "number" && !isNaN(score) && isFinite(score) ? score : 0;

    if (validScore >= 90)
      return { grade: "A+", color: "text-safe", bg: "bg-safe/10" };
    if (validScore >= 80)
      return { grade: "A", color: "text-safe", bg: "bg-safe/10" };
    if (validScore >= 70)
      return { grade: "B", color: "text-primary", bg: "bg-primary/10" };
    if (validScore >= 60)
      return { grade: "C", color: "text-warning", bg: "bg-warning/10" };
    return { grade: "D", color: "text-destructive", bg: "bg-destructive/10" };
  };

  const grade = getSafetyGrade(metrics.safetyScore);

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w`;
    const months = Math.floor(days / 30);
    return `${months}mo`;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted/30 rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-muted/30 rounded-lg" />
            <div className="h-24 bg-muted/30 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Safety Score Card */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-protection/10 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/20 border-2 border-primary/30">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Safety Score</h3>
                <p className="text-sm text-muted-foreground">
                  Overall protection level
                </p>
              </div>
            </div>
            <div
              className={cn(
                "text-right p-3 rounded-lg border-2",
                grade.bg,
                grade.color,
              )}
            >
              <div className="text-2xl font-bold">{grade.grade}</div>
              <div className="text-sm font-medium">Grade</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Safety Score</span>
              <span className="font-bold">{metrics.safetyScore}/100</span>
            </div>
            <Progress value={metrics.safetyScore} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/20">
              <div className="text-lg font-bold text-safe">
                {metrics.emergencyContactsCount}
              </div>
              <div className="text-xs text-muted-foreground">Contacts</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/20">
              <div className="text-lg font-bold text-primary">
                {formatDuration(metrics.protectionHours)}
              </div>
              <div className="text-xs text-muted-foreground">Protected</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/20">
              <div className="text-lg font-bold text-protection">
                {metrics.safeTripsCount}
              </div>
              <div className="text-xs text-muted-foreground">Safe Trips</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className="group border-2 border-safe/20 bg-gradient-to-br from-safe/5 to-safe/10 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-safe/60 hover:bg-safe/20 transform hover:scale-105 hover:-translate-y-1 active:scale-95"
          onClick={onContactsClick}
        >
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-safe/20 transition-all duration-200 group-hover:bg-safe/30 group-hover:scale-110">
                <Users className="h-6 w-6 text-safe transition-all duration-200 group-hover:scale-110" />
              </div>
              <div className="text-2xl font-bold text-safe transition-all duration-200 group-hover:scale-110">
                {metrics.emergencyContactsCount}
              </div>
              <div className="text-sm text-muted-foreground transition-all duration-200 group-hover:text-safe/80">
                Emergency Contacts
              </div>
              {metrics.emergencyContactsCount === 0 && (
                <Badge
                  variant="outline"
                  className="text-xs mt-1 border-warning text-warning transition-all duration-200 group-hover:scale-105"
                >
                  Add Contacts
                </Badge>
              )}
              {metrics.emergencyContactsCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs mt-1 border-safe/30 text-safe transition-all duration-200 group-hover:scale-105"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          className="group border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-primary/60 hover:bg-primary/20 transform hover:scale-105 hover:-translate-y-1 active:scale-95"
          onClick={onAlertsClick}
        >
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-primary/20 transition-all duration-200 group-hover:bg-primary/30 group-hover:scale-110">
                <Bell className="h-6 w-6 text-primary transition-all duration-200 group-hover:scale-110" />
              </div>
              <div className="text-2xl font-bold text-primary transition-all duration-200 group-hover:scale-110">
                {metrics.alertsToday}
              </div>
              <div className="text-sm text-muted-foreground transition-all duration-200 group-hover:text-primary/80">
                Active Alerts
              </div>
              <Badge
                variant="outline"
                className="text-xs mt-1 border-primary/30 text-primary transition-all duration-200 group-hover:scale-105"
              >
                <Activity className="h-3 w-3 mr-1" />
                Monitoring
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card className="border-2 border-protection/30 bg-gradient-to-br from-protection/5 to-protection/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-protection" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-safe" />
                  Location Shares
                </span>
                <span className="font-bold text-safe">
                  {metrics.locationShares}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Protection Time
                </span>
                <span className="font-bold text-primary">
                  {formatDuration(metrics.protectionHours)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-protection" />
                  Safe Journeys
                </span>
                <span className="font-bold text-protection">
                  {metrics.safeTripsCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4 text-warning" />
                  Safety Rating
                </span>
                <span className="font-bold text-warning">Excellent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      {metrics.safetyScore < 80 && (
        <Card className="border-2 border-warning/30 bg-gradient-to-br from-warning/10 to-warning/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <h4 className="font-semibold mb-2">
                  Improve Your Safety Score
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {metrics.emergencyContactsCount < 3 && (
                    <li>
                      • Add more emergency contacts (current:{" "}
                      {metrics.emergencyContactsCount}/3)
                    </li>
                  )}
                  {!userProfile?.phone && (
                    <li>• Add your phone number to your profile</li>
                  )}
                  {metrics.emergencyContactsCount > 0 && (
                    <li>
                      • Verify your emergency contacts for better reliability
                    </li>
                  )}
                  <li>
                    • Enable background monitoring for automatic protection
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
