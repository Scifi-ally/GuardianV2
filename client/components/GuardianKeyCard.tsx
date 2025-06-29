import { useState } from "react";
import {
  Key,
  Copy,
  RefreshCw,
  Shield,
  QrCode,
  Share,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function GuardianKeyCard() {
  const { userProfile, updateUserProfile } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const guardianKey = userProfile?.guardianKey || "No key generated";
  const keyCreatedDate = userProfile?.keyCreatedAt
    ? new Date(userProfile.keyCreatedAt).toLocaleDateString()
    : "Unknown";

  const generateNewKey = async () => {
    setIsGenerating(true);

    // Simulate key generation
    const newKey = `GRD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    if (userProfile) {
      await updateUserProfile({
        ...userProfile,
        guardianKey: newKey,
        keyCreatedAt: new Date().toISOString(),
      });
    }

    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const copyToClipboard = async () => {
    try {
      // First try the modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(guardianKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Fallback method using document.execCommand
      await copyToClipboardFallback(guardianKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      // Show user-friendly error message
      alert(`Copy failed. Please manually copy this key: ${guardianKey}`);
    }
  };

  // Fallback clipboard method
  const copyToClipboardFallback = async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Create a temporary textarea element
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);

      try {
        textArea.focus();
        textArea.select();

        // Try to copy using execCommand
        const successful = document.execCommand("copy");
        if (successful) {
          resolve();
        } else {
          reject(new Error("execCommand copy failed"));
        }
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(textArea);
      }
    });
  };

  const shareKey = async () => {
    const shareData = {
      title: "Guardian Safety Key",
      text: `My Guardian safety key: ${guardianKey}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Share failed:", error);
        // Fallback to copy
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const generateQRCode = () => {
    // In a real app, you'd generate an actual QR code
    // For now, we'll just show a placeholder
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(guardianKey)}`;
  };

  const formatKeyForDisplay = (key: string) => {
    if (!showKey) {
      return "••••-••••-••••";
    }
    // Format key with dashes for better readability
    return key.replace(/(.{4})/g, "$1-").slice(0, -1);
  };

  return (
    <div className="space-y-4">
      {/* Main Guardian Key Card */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="relative">
              <div className="p-3 rounded-full bg-gray-100 border-2 border-gray-200">
                <Key className="h-6 w-6 text-black" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <Shield className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-black">Guardian Key</h3>
              <p className="text-sm text-gray-600 font-mono">
                Your unique safety identifier
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Key Display */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Safety Key</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs border-safe/30 text-safe"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Active
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowKey(!showKey)}
                  className="h-6 w-6 p-0"
                >
                  {showKey ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            <div className="relative">
              <Input
                value={formatKeyForDisplay(guardianKey)}
                readOnly
                className="text-center font-mono text-lg tracking-wider border-2 bg-gray-50 pr-20 text-black"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyToClipboard}
                  className="h-8 w-8 p-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-safe" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Dialog open={showQR} onOpenChange={setShowQR}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        Guardian Key QR Code
                      </DialogTitle>
                    </DialogHeader>
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2">
                        <img
                          src={generateQRCode()}
                          alt="Guardian Key QR Code"
                          className="w-44 h-44"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Share this QR code to give others access to your
                        Guardian safety information
                      </p>
                      <Button onClick={shareKey} className="w-full">
                        <Share className="h-4 w-4 mr-2" />
                        Share QR Code
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/20 border">
              <div className="text-sm font-medium mb-1">Created</div>
              <div className="text-xs text-muted-foreground">
                {keyCreatedDate}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/20 border">
              <div className="text-sm font-medium mb-1">Status</div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                <span className="text-xs text-safe font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={shareKey}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              <Share className="h-4 w-4 mr-2" />
              Share Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Usage Info */}
      <Card className="border-2 border-protection/30 bg-gradient-to-br from-protection/5 to-protection/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-protection mt-0.5" />
            <div>
              <h4 className="font-semibold mb-2">About Your Guardian Key</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Used to identify you in emergency situations</li>
                <li>• Share with trusted contacts for quick access</li>
                <li>• Required for emergency responders to access your info</li>
                <li>• Keep it secure - treat it like a password</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Warning */}
      <Card className="border-2 border-warning/30 bg-gradient-to-br from-warning/10 to-warning/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <h4 className="font-semibold mb-2 text-warning">
                Security Important
              </h4>
              <p className="text-sm text-muted-foreground">
                Only share your Guardian Key with trusted individuals. Anyone
                with this key can access your emergency information and safety
                status. If compromised, generate a new key immediately.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
