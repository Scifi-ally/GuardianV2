import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Mail, Lock, ArrowRight } from "lucide-react";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { cn } from "@/lib/utils";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/");
    } catch (error: any) {
      console.error("Signin error:", error);

      // Handle specific Firebase auth errors
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email. Please sign up first.");
      } else if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        setError("Incorrect password. Please try again.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/user-disabled") {
        setError("This account has been disabled. Please contact support.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Failed to sign in. Please check your credentials.");
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
            <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground text-base">
              Sign in to your Guardian account
            </p>
          </div>
        </div>

        {/* Sign In Card - matching Android styling exactly */}
        <Card className="border-0 shadow-xl bg-background/50 backdrop-blur rounded-2xl mx-2">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-xl font-bold">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign Up Link - matching Android */}
        <div className="text-center pt-6">
          <div className="flex items-center justify-center gap-1">
            <span className="text-muted-foreground text-sm">
              Don't have an account?
            </span>
            <Link
              to="/signup"
              className="text-primary font-medium text-sm hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
