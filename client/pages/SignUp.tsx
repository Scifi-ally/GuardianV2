import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Mail, Lock, User, ArrowRight } from "lucide-react";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { cn } from "@/lib/utils";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await signup(email, password, name);
      navigate("/");
    } catch (error: any) {
      console.error("Signup error:", error);

      // Handle specific Firebase auth errors
      if (
        error.code === "auth/email-already-in-use" ||
        error.message?.includes("EMAIL_EXISTS")
      ) {
        setError(
          "This email is already registered. Please sign in instead or use a different email.",
        );
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/operation-not-allowed") {
        setError(
          "Email/password accounts are not enabled. Please contact support.",
        );
      } else if (
        error.message?.includes("Missing or insufficient permissions") ||
        error.message?.includes("permission-denied")
      ) {
        setError(
          "Account created successfully! Some features may be limited until database permissions are configured.",
        );
        // Don't block the user from proceeding
        setTimeout(() => navigate("/"), 2000);
        return;
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header - matching Android structure exactly */}
        <div className="text-center space-y-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Join Guardian
            </h1>
            <p className="text-muted-foreground text-base">
              Create your safety account
            </p>
          </div>
        </div>

        {/* Sign Up Card - matching Android styling exactly */}
        <Card className="border-0 shadow-xl bg-background/50 backdrop-blur rounded-2xl mx-2">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-xl font-bold">
              Sign Up
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-destructive text-sm">
                  {error}
                  {error.includes("already registered") && (
                    <div className="mt-2">
                      <Link
                        to="/signin"
                        className="text-destructive underline hover:no-underline font-medium"
                      >
                        Sign in instead →
                      </Link>
                    </div>
                  )}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12 border border-input rounded-lg"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border border-input rounded-lg"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 border border-input rounded-lg"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12 border border-input rounded-lg"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className={cn(
                  "w-full h-12 text-base font-medium transition-all duration-100 rounded-lg",
                  "bg-primary hover:bg-primary/90 text-primary-foreground",
                  isPressed && "scale-[0.96]",
                )}
                disabled={loading}
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
                onTouchStart={() => setIsPressed(true)}
                onTouchEnd={() => setIsPressed(false)}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingAnimation size="sm" variant="dots" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Create Account</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign In Link - matching Android */}
        <div className="text-center pt-6">
          <div className="flex items-center justify-center gap-1">
            <span className="text-muted-foreground text-sm">
              Already have an account?
            </span>
            <Link
              to="/signin"
              className="text-primary font-medium text-sm hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
