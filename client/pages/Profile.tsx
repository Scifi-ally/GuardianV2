import { useState } from "react";
import { User, Edit, Shield, Settings, LogOut, Camera } from "lucide-react";
import { MagicNavbar } from "@/components/MagicNavbar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Profile() {
  const { currentUser, userProfile, logout } = useAuth();

  const handleSOSPress = () => {
    console.log("SOS triggered from profile");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="container px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-safe/5" />
          <CardContent className="relative p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  <AvatarImage
                    src={userProfile?.photoURL || "/placeholder.svg"}
                    alt={userProfile?.displayName || "User"}
                  />
                  <AvatarFallback className="text-xl font-bold bg-primary/10">
                    {userProfile?.displayName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow-lg"
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-bold">
                  {userProfile?.displayName || "Guardian User"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.email || currentUser?.email || "No email set"}
                </p>
                <Badge className="bg-safe text-safe-foreground">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified Account
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Essential Actions */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start h-12"
              onClick={() => console.log("Edit profile")}
            >
              <Edit className="h-4 w-4 mr-3" />
              Edit Profile
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-12"
              onClick={() => console.log("Settings")}
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Account Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Type</span>
                <span className="font-medium">Guardian Premium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium">March 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-xs">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
