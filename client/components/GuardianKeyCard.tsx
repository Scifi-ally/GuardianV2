import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  Shield,
  Eye,
  EyeOff,
  QrCode,
  Download,
  Share2,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { qrCodeService } from "@/services/qrCodeService";
import { toast } from "sonner";
import { cardAnimations, buttonAnimations } from "@/lib/animations";

interface GuardianKeyCardProps {
  className?: string;
}

export function GuardianKeyCard({ className }: GuardianKeyCardProps) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const { userProfile } = useAuth();

  const handleCopy = async () => {
    if (!userProfile?.guardianKey) return;

    const success = await copyToClipboard(userProfile.guardianKey);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // Silently copy without notification
    } else {
      // Silently handle copy failure
    }
  };

  const handleQRCode = async () => {
    if (!userProfile?.guardianKey) return;

    try {
      setIsGeneratingQR(true);
      setShowQR(true);
      // Silently generate QR code
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      // Silently handle QR generation failure
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!userProfile?.guardianKey) return;

    try {
      await qrCodeService.downloadQRCode(
        `guardian:${userProfile.guardianKey}`,
        `guardian-key-${userProfile.guardianKey}.png`,
        {
          size: 400,
          color: { dark: "#1f2937", light: "#ffffff" },
        },
      );
      // Silently download QR code
    } catch (error) {
      console.error("Failed to download QR code:", error);
      // Silently handle download failure
    }
  };

  const handleShareQR = async () => {
    if (!userProfile?.guardianKey) return;

    try {
      await qrCodeService.shareQRCode(
        `guardian:${userProfile.guardianKey}`,
        "My Guardian Key",
        {
          size: 300,
          color: { dark: "#1f2937", light: "#ffffff" },
        },
      );
      // Silently share QR code
    } catch (error) {
      console.error("Failed to share QR code:", error);
      // Copy to clipboard as fallback
      const success = await copyToClipboard(userProfile.guardianKey);
      if (success) {
        // Silently handle share fallback
      } else {
        // Silently handle share failure
      }
    }
  };

  const displayKey = showKey
    ? userProfile?.guardianKey
    : userProfile?.guardianKey.replace(/./g, "•");

  if (!userProfile?.guardianKey) {
    return null;
  }

  return (
    <motion.div
      variants={cardAnimations}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={className}
    >
      <Card
        className={cn(
          "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden",
        )}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 opacity-0"
          animate={{ opacity: showKey ? 0.3 : 0 }}
          transition={{ duration: 0.5 }}
        />

        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <motion.div
              animate={{ rotate: showKey ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Shield className="h-5 w-5 text-primary" />
            </motion.div>
            Your Guardian Key
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <div className="space-y-3">
            <motion.div
              className="flex items-center justify-between p-3 bg-background/50 rounded-lg border"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <motion.div
                className="font-mono text-lg tracking-wider font-bold text-primary"
                animate={{
                  filter: showKey ? "blur(0px)" : "blur(4px)",
                  scale: showKey ? 1 : 0.98,
                }}
                transition={{ duration: 0.3 }}
              >
                {displayKey}
              </motion.div>
              <div className="flex gap-2">
                <motion.div
                  variants={buttonAnimations}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowKey(!showKey)}
                    className="h-8 w-8 p-0"
                  >
                    <motion.div
                      animate={{ rotateY: showKey ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </motion.div>
                  </Button>
                </motion.div>
                <motion.div
                  variants={buttonAnimations}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-8 w-8 p-0"
                    disabled={copied}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          <Check className="h-4 w-4 text-safe" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          <Copy className="h-4 w-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            <div className="flex gap-2">
              <motion.div
                className="flex-1"
                variants={buttonAnimations}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  onClick={handleCopy}
                  className="w-full h-10"
                  disabled={copied}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="copied"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 20, opacity: 0 }}
                        className="flex items-center"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 20, opacity: 0 }}
                        className="flex items-center"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Key
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
              <motion.div
                variants={buttonAnimations}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="outline"
                  className="h-10 px-3"
                  onClick={handleQRCode}
                  disabled={isGeneratingQR}
                >
                  <div className={isGeneratingQR ? "animate-spin" : ""}>
                    <QrCode className="h-4 w-4" />
                  </div>
                </Button>
              </motion.div>
            </div>
          </div>

          {/* QR Code Modal */}
          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="p-4 bg-white rounded-xl border shadow-lg"
              >
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Guardian Key QR Code</h3>
                    <Button
                      onClick={() => setShowQR(false)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mx-auto w-fit">
                    <motion.img
                      src={qrCodeService.generateGuardianKeyQR(
                        userProfile.guardianKey,
                      )}
                      alt="Guardian Key QR Code"
                      className="w-48 h-48 rounded-lg shadow-md"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Button
                        onClick={handleDownloadQR}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        onClick={handleShareQR}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Share2 className="h-3 w-3" />
                        Share
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="space-y-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div>
              <Badge variant="outline" className="mr-2">
                💡 Tip
              </Badge>
              Share this key with trusted contacts so they can add you as their
              emergency contact.
            </div>
            <p className="text-xs">
              🔒 Keep this key secure. Anyone with this key can add you as their
              emergency contact.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
