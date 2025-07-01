import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Shield,
  Key,
  Users,
  Clock,
  MapPin,
  Settings,
  LogOut,
  Activity,
  Bell,
  Phone,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GuardianKeyCard } from "@/components/GuardianKeyCard";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { MagicNavbar } from "@/components/MagicNavbar";
import { cn } from "@/lib/utils";

export default function EnhancedProfile() {
  const [activeTab, setActiveTab] = useState("profile");
  const { userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

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
    <div className="min-h-screen bg-background pb-24">
      <MagicNavbar />

      <main className="container px-4 py-6 space-y-6 pb-32">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {userProfile?.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {userProfile?.displayName || "Unknown User"}
                </h1>
                <p className="text-muted-foreground">{userProfile?.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className="bg-safe text-safe-foreground">
                    <Activity className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Joined{" "}
                    {userProfile?.createdAt &&
                      formatDate(userProfile.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLogout}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {emergencyContacts.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Emergency Contacts
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-safe">0</div>
              <div className="text-sm text-muted-foreground">Active Alerts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">24</div>
              <div className="text-sm text-muted-foreground">Safe Trips</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-protection">98%</div>
              <div className="text-sm text-muted-foreground">Safety Score</div>
            </CardContent>
          </Card>
        </div>

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
                  <span className="text-sm">Location Sharing</span>
                </div>
                <Badge variant="outline" className="bg-safe/10 text-safe">
                  Enabled
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

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <User className="h-4 w-4 mr-3" />
              Personal Information
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-3" />
              Privacy & Security
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Bell className="h-4 w-4 mr-3" />
              Notification Settings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-3" />
              Location Preferences
            </Button>
            <Separator />
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
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
