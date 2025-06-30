import { useState, useEffect } from "react";
import { User, Edit, Settings, LogOut, Camera, Copy, Key } from "lucide-react";
import { MagicNavbar } from "@/components/MagicNavbar";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import { useAuth } from "@/contexts/AuthContext";
import { EmergencyKeyService } from "@/services/emergencyKeyService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function Profile() {
  const { currentUser, userProfile, logout } = useAuth();
  const [guardianKey, setGuardianKey] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuardianKey();
  }, [currentUser]);

  const loadGuardianKey = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      let key = await EmergencyKeyService.getUserGuardianKey(currentUser.uid);

      if (!key) {
        // Create new guardian key if user doesn't have one
        const result = await EmergencyKeyService.createGuardianKey(
          currentUser.uid,
          userProfile?.displayName ||
            currentUser.displayName ||
            "Guardian User",
          userProfile?.email || currentUser.email || "",
        );

        if (result.success && result.guardianKey) {
          key = result.guardianKey;
          toast.success("Guardian key created successfully!");
        } else {
          toast.error("Failed to create guardian key");
        }
      }

      setGuardianKey(key || "");
    } catch (error) {
      console.error("Error loading guardian key:", error);
      toast.error("Failed to load guardian key");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(guardianKey);
      toast.success("Guardian key copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy key");
    }
  };

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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guardian Key Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Your Guardian Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Share this unique key with trusted contacts so they can add you
                to their emergency network.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-3">
              {loading ? (
                <div className="flex-1 h-12 bg-muted/50 rounded-lg animate-pulse" />
              ) : (
                <>
                  <div className="flex-1 p-3 bg-muted/30 rounded-lg border font-mono text-lg tracking-wider text-center">
                    {guardianKey || "No key generated"}
                  </div>
                  <Button
                    onClick={handleCopyKey}
                    variant="outline"
                    size="icon"
                    disabled={!guardianKey}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Keep this key private and only share with people you trust for
              emergencies.
            </p>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <EmergencyContactManager />

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
      </main>

      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
