import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Database,
  User,
  Settings,
  Cloud,
  HardDrive,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function AuthModeSwitcher() {
  const {
    authMode,
    currentUser,
    loading,
    switchToFirebase,
    switchToDemo,
    login,
    signup,
    logout,
  } = useAuth();

  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authAction, setAuthAction] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleModeSwitch = (useFirebase: boolean) => {
    if (useFirebase) {
      switchToFirebase();
      toast.success("Switched to Firebase authentication");
    } else {
      switchToDemo();
      toast.success("Switched to demo mode");
    }
  };

  const handleFirebaseAuth = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    if (authAction === "signup" && !name) {
      toast.error("Please enter your name");
      return;
    }

    setAuthLoading(true);
    try {
      if (authAction === "login") {
        await login(email, password);
        toast.success("Logged in successfully!");
      } else {
        await signup(email, password, name);
        toast.success("Account created successfully!");
      }
      setShowAuthDialog(false);
      setEmail("");
      setPassword("");
      setName("");
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Settings className="h-5 w-5" />
          Authentication Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Mode Display */}
        <div className="text-center space-y-2">
          <Badge
            variant={authMode === "firebase" ? "default" : "secondary"}
            className={`${
              authMode === "firebase"
                ? "bg-orange-100 text-orange-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            <div className="flex items-center gap-1">
              {authMode === "firebase" ? (
                <Cloud className="h-3 w-3" />
              ) : (
                <HardDrive className="h-3 w-3" />
              )}
              {authMode === "firebase" ? "Firebase Mode" : "Demo Mode"}
            </div>
          </Badge>

          {currentUser && (
            <div className="text-sm text-gray-600">
              Logged in as: <strong>{currentUser.displayName}</strong>
            </div>
          )}
        </div>

        <Separator />

        {/* Mode Switcher */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                Firebase Authentication
              </Label>
              <p className="text-xs text-gray-500">
                Real login with cloud sync
              </p>
            </div>
            <Switch
              checked={authMode === "firebase"}
              onCheckedChange={handleModeSwitch}
              disabled={loading}
            />
          </div>

          {/* Firebase Auth Options */}
          {authMode === "firebase" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {currentUser ? (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" disabled={loading}>
                      <Database className="h-4 w-4 mr-2" />
                      Sign In / Sign Up
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {authAction === "login" ? "Sign In" : "Create Account"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {authAction === "signup" && (
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleFirebaseAuth}
                          disabled={authLoading}
                          className="flex-1"
                        >
                          {authLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : authAction === "login" ? (
                            <LogIn className="h-4 w-4 mr-2" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-2" />
                          )}
                          {authAction === "login"
                            ? "Sign In"
                            : "Create Account"}
                        </Button>
                      </div>

                      <div className="text-center">
                        <Button
                          variant="link"
                          onClick={() =>
                            setAuthAction(
                              authAction === "login" ? "signup" : "login",
                            )
                          }
                          className="text-sm"
                        >
                          {authAction === "login"
                            ? "Need an account? Sign up"
                            : "Already have an account? Sign in"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </motion.div>
          )}

          {/* Demo Mode Info */}
          {authMode === "demo" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg"
            >
              <strong>Demo Mode:</strong> All data is stored locally. Perfect
              for testing features without creating an account.
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AuthModeSwitcher;
