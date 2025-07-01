import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Shield,
  X,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";

interface SOSPasswordModalProps {
  isOpen: boolean;
  onVerify: (password: string) => boolean;
  onCancel: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function SOSPasswordModal({
  isOpen,
  onVerify,
  onCancel,
  onSuccess,
  title = "Emergency Password Required",
  description = "Enter your emergency password to cancel the SOS alert",
}: SOSPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  const maxAttempts = 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    setError("");

    // Simulate verification delay for security
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (onVerify(password)) {
      setPassword("");
      setAttempts(0);
      setError("");
      setLoading(false);
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword("");
      setLoading(false);

      if (newAttempts >= maxAttempts) {
        setError(
          `Maximum attempts reached. SOS alert will remain active for security.`,
        );
        setTimeout(() => {
          onCancel();
          setAttempts(0);
          setError("");
        }, 3000);
      } else {
        setError(
          `Incorrect password. ${maxAttempts - newAttempts} attempts remaining.`,
        );
      }
    }
  };

  const handleClose = () => {
    if (attempts < maxAttempts) {
      setPassword("");
      setError("");
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-sm mx-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <div className="p-2 bg-warning/20 rounded-full">
              <Lock className="h-5 w-5 text-warning" />
            </div>
            <span className="text-warning">{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Alert */}
          <Alert className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              {description}
            </AlertDescription>
          </Alert>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="emergency-password"
                className="text-sm font-medium"
              >
                Emergency Password
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-3 z-10">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="emergency-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-10 pr-10 text-center font-mono tracking-wider"
                  disabled={loading || attempts >= maxAttempts}
                  maxLength={20}
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1 h-8 w-8"
                  disabled={loading || attempts >= maxAttempts}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Attempts Counter */}
            {attempts > 0 && attempts < maxAttempts && (
              <div className="text-center">
                <div className="flex justify-center gap-1">
                  {Array.from({ length: maxAttempts }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-6 rounded-full ${
                        i < attempts
                          ? "bg-destructive"
                          : "bg-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Failed attempts: {attempts}/{maxAttempts}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading || attempts >= maxAttempts || !password}
                className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                  </motion.div>
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {loading ? "Verifying..." : "Cancel SOS"}
              </Button>

              {attempts < maxAttempts && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="border-muted-foreground/30"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              )}
            </div>
          </form>

          {/* Security Notice */}
          <div className="text-xs text-muted-foreground text-center bg-muted/30 p-3 rounded-lg">
            <Shield className="h-3 w-3 inline mr-1" />
            For your safety, the emergency alert will remain active until the
            correct password is entered.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
