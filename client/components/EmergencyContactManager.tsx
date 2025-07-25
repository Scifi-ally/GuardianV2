import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Trash2,
  Shield,
  Key,
  AlertCircle,
  Check,
  QrCode,
  Camera,
  X,
  Zap,
  UserPlus,
  Search,
  Wifi,
  WifiOff,
  Smartphone,
} from "lucide-react";
import { useAuth, type EmergencyContact } from "@/contexts/AuthContext";
import { EmergencyContactService } from "@/services/emergencyContactService";
import { emergencyContactConnectionService } from "@/services/emergencyContactConnectionService";
import { mobileCameraService } from "@/services/mobileCameraService";
import { cn } from "@/lib/utils";
import QrScanner from "qr-scanner";
import { Capacitor } from "@capacitor/core";

interface EmergencyContactManagerProps {
  className?: string;
  isModal?: boolean;
  onClose?: () => void;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.2 },
  },
};

export function EmergencyContactManager({
  className,
  isModal = false,
  onClose,
}: EmergencyContactManagerProps) {
  // Core state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [guardianKey, setGuardianKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingContactId, setDeletingContactId] = useState<string | null>(
    null,
  );
  const [showConfirmDelete, setShowConfirmDelete] =
    useState<EmergencyContact | null>(null);

  // QR Scanner state with extreme case handling
  const [showQRInAdd, setShowQRInAdd] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<string>("");
  const [networkStatus, setNetworkStatus] = useState<boolean>(navigator.onLine);
  const [retryAttempts, setRetryAttempts] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const maxRetryAttempts = 3;

  // UI state
  const [searchQuery, setSearchQuery] = useState("");

  const { userProfile, currentUser, refreshProfile } = useAuth();
  const emergencyContacts = userProfile?.emergencyContacts || [];

  // Filter contacts based on search
  const filteredContacts = emergencyContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.guardianKey.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Sort contacts by priority
  const sortedContacts = [...filteredContacts].sort(
    (a, b) => a.priority - b.priority,
  );

  // Initialize device info and capabilities
  useEffect(() => {
    const initializeDevice = async () => {
      try {
        setIsNativeApp(Capacitor.isNativePlatform());
        setDeviceInfo(
          `${Capacitor.getPlatform()} - ${navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"}`,
        );

        // Initialize camera service if available
        await mobileCameraService.initialize();
      } catch (error) {
        console.error("Device initialization error:", error);
      }
    };

    initializeDevice();

    // Network status monitoring
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      stopScanning();
    };
  }, []);

  // QR Scanner functions with extreme case handling
  const startScanning = async () => {
    try {
      setQrError(null);
      setIsScanning(true);
      setRetryAttempts((prev) => prev + 1);

      // Check if we've exceeded retry attempts
      if (retryAttempts >= maxRetryAttempts) {
        setQrError(
          `Camera failed after ${maxRetryAttempts} attempts. Please restart the app.`,
        );
        setIsScanning(false);
        return;
      }

      // Enhanced camera capability check
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setQrError(
          "Camera not supported on this device. Please enter the Guardian Key manually.",
        );
        setIsScanning(false);
        setHasPermission(false);
        return;
      }

      // Check for specific mobile device issues
      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      let constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment",
          width: { ideal: isMobile ? 300 : 400 },
          height: { ideal: isMobile ? 200 : 300 },
        },
      };

      // iOS specific constraints
      if (isIOS) {
        constraints.video = {
          ...constraints.video,
          // @ts-ignore - iOS specific
          torch: false,
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Handle video loading with timeout
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          await Promise.race([
            playPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Video timeout")), 10000),
            ),
          ]);
        }

        // Enhanced QR Scanner with better error handling
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            const data = typeof result === "string" ? result : result.data;
            handleQRScanSuccess(data);
          },
          {
            returnDetailedScanResult: false,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            // Enhanced scanner options
            maxScansPerSecond: 5,
            calculateScanRegion: () => ({ x: 0, y: 0, width: 1, height: 1 }),
          },
        );

        await qrScannerRef.current.start();
        setHasPermission(true);
        setRetryAttempts(0); // Reset on success
      }
    } catch (err: any) {
      console.error("Camera error:", err);

      // Detailed error handling
      let errorMessage = "Camera access failed. ";

      if (err.name === "NotAllowedError") {
        errorMessage +=
          "Please allow camera permissions in your browser settings.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera found on this device.";
      } else if (err.name === "NotSupportedError") {
        errorMessage += "Camera not supported on this device.";
      } else if (err.name === "NotReadableError") {
        errorMessage += "Camera is already in use by another application.";
      } else if (err.message?.includes("timeout")) {
        errorMessage += "Camera initialization timed out. Try again.";
      } else {
        errorMessage += `${err.message || "Unknown error"}`;
      }

      // Add device-specific tips
      if (isNativeApp) {
        errorMessage +=
          " If issues persist, check app permissions in device settings.";
      } else {
        errorMessage +=
          " Try using the native app for better camera performance.";
      }

      setQrError(errorMessage);
      setIsScanning(false);
      setHasPermission(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);

    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      } catch (err) {
        console.warn("Error stopping QR scanner:", err);
      }
      qrScannerRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn("Error stopping camera track:", err);
        }
      });
      videoRef.current.srcObject = null;
    }
  };

  const handleQRScanSuccess = (data: string) => {
    stopScanning();

    // Enhanced QR data parsing with multiple formats
    let extractedKey = "";

    try {
      // Try direct 8-character match
      if (data.length === 8 && /^[A-Z0-9]{8}$/.test(data)) {
        extractedKey = data;
      }
      // Try JSON format
      else if (data.startsWith("{")) {
        const parsed = JSON.parse(data);
        extractedKey = parsed.guardianKey || parsed.key || "";
      }
      // Try URL format
      else if (data.includes("guardian") || data.includes("emergency")) {
        const match = data.match(/[A-Z0-9]{8}/);
        if (match) extractedKey = match[0];
      }
      // Try any 8-character sequence
      else {
        const matches = data.match(/[A-Z0-9]{8}/g);
        if (matches && matches.length > 0) {
          extractedKey = matches[0];
        }
      }

      if (extractedKey && extractedKey.length === 8) {
        setGuardianKey(extractedKey.toUpperCase());
        setShowQRInAdd(false);
        setSuccess("✅ Guardian key scanned successfully!");
        setTimeout(() => setSuccess(""), 3000);
        setRetryAttempts(0);
      } else {
        throw new Error("No valid Guardian Key found");
      }
    } catch (parseError) {
      console.error("QR parsing error:", parseError);
      setQrError(
        `Invalid QR code format. Expected 8-character Guardian Key, got: "${data.substring(0, 20)}${data.length > 20 ? "..." : ""}"`,
      );
      setTimeout(() => setQrError(null), 5000);
    }
  };

  const handleAddContact = async () => {
    // Input validation with detailed feedback
    if (!guardianKey.trim()) {
      setError("Guardian key is required");
      return;
    }

    if (guardianKey.length !== 8) {
      setError(
        `Guardian key must be exactly 8 characters (current: ${guardianKey.length})`,
      );
      return;
    }

    if (!/^[A-Z0-9]{8}$/.test(guardianKey)) {
      setError("Guardian key must contain only letters and numbers");
      return;
    }

    // Check for duplicates with detailed message
    const existingContact = emergencyContacts.find(
      (contact) =>
        contact.guardianKey.toUpperCase() === guardianKey.toUpperCase(),
    );
    if (existingContact) {
      setError(
        `This Guardian Key is already added for ${existingContact.name}`,
      );
      return;
    }

    // Check network connectivity
    if (!networkStatus) {
      setError(
        "No internet connection. Please check your network and try again.",
      );
      return;
    }

    if (!currentUser) {
      setError("Please sign in to add contacts");
      return;
    }

    // Check contact limit (extreme case)
    if (emergencyContacts.length >= 10) {
      setError(
        "Maximum 10 emergency contacts allowed. Please remove some contacts first.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = (await Promise.race([
        EmergencyContactService.addEmergencyContact(
          currentUser.uid,
          guardianKey.trim().toUpperCase(),
          1, // Default priority
        ),
        // 30 second timeout
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 30000),
        ),
      ])) as any;

      if (result.success) {
        setSuccess(`🎉 Emergency contact added successfully!`);
        await refreshProfile();

        // Reset form
        setGuardianKey("");
        setIsAddDialogOpen(false);
        setShowQRInAdd(false);
        stopScanning();
        setRetryAttempts(0);

        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMsg = result.error || "Failed to add contact";
        setError(`❌ ${errorMsg}`);
      }
    } catch (error: any) {
      console.error("Add contact error:", error);

      if (error.message === "Request timeout") {
        setError(
          "Request timed out. Please check your connection and try again.",
        );
      } else if (error.code === "permission-denied") {
        setError("Permission denied. Please sign in again.");
      } else if (error.code === "network-request-failed") {
        setError("Network error. Please check your connection.");
      } else {
        setError(`Unexpected error: ${error.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContact = async (contact: EmergencyContact) => {
    if (!currentUser) return;

    setDeletingContactId(contact.id);

    try {
      const result = (await Promise.race([
        EmergencyContactService.removeEmergencyContact(
          currentUser.uid,
          contact,
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 30000),
        ),
      ])) as any;

      if (result.success) {
        setSuccess(`✅ ${contact.name} removed from emergency contacts`);
        await refreshProfile();
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(`❌ ${result.error || "Failed to remove contact"}`);
      }
    } catch (error: any) {
      console.error("Remove contact error:", error);
      setError(`Failed to remove contact: ${error.message || "Network error"}`);
    } finally {
      setDeletingContactId(null);
      setShowConfirmDelete(null);
    }
  };

  const handleAlert = async (contact: EmergencyContact) => {
    try {
      // Check network first
      if (!networkStatus) {
        setError("⚠️ No internet connection. Cannot send emergency alert.");
        return;
      }

      const connectionStatus =
        await emergencyContactConnectionService.testConnection(contact);

      if (!connectionStatus.isConnected) {
        setError(
          `❌ Cannot reach ${contact.name}: ${connectionStatus.error || "No connection"}`,
        );
        setTimeout(() => setError(""), 3000);
        return;
      }

      const { emergencyContactActionsService } = await import(
        "@/services/emergencyContactActionsService"
      );
      await emergencyContactActionsService.alertContact(contact);

      setSuccess(`🚨 Emergency alert sent to ${contact.name}!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Alert error:", error);
      setError(
        `❌ Failed to send alert to ${contact.name}: ${error.message || "Network error"}`,
      );
      setTimeout(() => setError(""), 3000);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityBorder = (priority: number) => {
    switch (priority) {
      case 1:
        return "border-l-red-500 bg-red-50/30";
      case 2:
        return "border-l-yellow-500 bg-yellow-50/30";
      case 3:
        return "border-l-green-500 bg-green-50/30";
      default:
        return "border-l-gray-500 bg-gray-50/30";
    }
  };

  // Enhanced Add Contact Modal with extreme case handling
  const EnhancedAddContactModal = () => (
    <Dialog
      open={isAddDialogOpen}
      onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          stopScanning();
          setShowQRInAdd(false);
          setGuardianKey("");
          setError("");
          setQrError(null);
          setRetryAttempts(0);
        }
      }}
    >
      <DialogContent className="w-[90vw] max-w-xs mx-auto rounded-3xl p-6">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="flex items-center justify-center gap-2 text-lg font-semibold">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                <UserPlus className="h-5 w-5" />
              </motion.div>
              Add Contact
            </DialogTitle>

            {/* Device status indicators */}
            <div className="flex justify-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {networkStatus ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" /> Online
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" /> Offline
                  </>
                )}
              </div>
              {isNativeApp && (
                <div className="flex items-center gap-1 text-xs text-blue-500">
                  <Smartphone className="h-3 w-3" /> Native App
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Guardian Key Input ONLY */}
            <div className="space-y-3">
              <Label
                htmlFor="guardianKey"
                className="text-sm font-medium text-center block"
              >
                Enter Guardian Key
              </Label>

              <div className="space-y-3">
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="guardianKey"
                    placeholder="8-character key"
                    value={guardianKey}
                    onChange={(e) => {
                      const value = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "");
                      setGuardianKey(value);
                      setError("");
                    }}
                    className={cn(
                      "pl-10 pr-4 py-3 text-center text-lg font-mono tracking-widest rounded-2xl border-2 transition-all",
                      guardianKey.length === 8
                        ? "border-green-500 bg-green-50 text-green-800"
                        : guardianKey.length > 0 && guardianKey.length < 8
                          ? "border-yellow-500 bg-yellow-50"
                          : "border-gray-300 focus:border-black",
                    )}
                    maxLength={8}
                    disabled={loading}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {guardianKey.length === 8 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          repeatDelay: 2,
                        }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Enhanced QR Scanner Toggle Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowQRInAdd(!showQRInAdd);
                    if (!showQRInAdd) {
                      startScanning();
                    } else {
                      stopScanning();
                    }
                  }}
                  disabled={!networkStatus && !isNativeApp}
                  className={cn(
                    "w-full py-3 px-4 rounded-2xl border-2 font-medium transition-all flex items-center justify-center gap-2",
                    showQRInAdd
                      ? "bg-black text-white border-black"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400",
                    !networkStatus &&
                      !isNativeApp &&
                      "opacity-50 cursor-not-allowed",
                  )}
                >
                  {showQRInAdd ? (
                    <>
                      <X className="h-4 w-4" />
                      Close Scanner
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      Scan QR Code
                      {retryAttempts > 0 &&
                        ` (Attempt ${retryAttempts}/${maxRetryAttempts})`}
                    </>
                  )}
                </motion.button>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs text-gray-500">
                  {guardianKey.length}/8 characters
                </p>
                {deviceInfo && (
                  <p className="text-xs text-gray-400">{deviceInfo}</p>
                )}
              </div>
            </div>

            {/* Enhanced QR Scanner with extreme case handling */}
            <AnimatePresence>
              {showQRInAdd && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, height: 0 }}
                  animate={{ opacity: 1, scale: 1, height: "auto" }}
                  exit={{ opacity: 0, scale: 0.9, height: 0 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="space-y-3"
                >
                  <div className="relative bg-black rounded-3xl overflow-hidden h-48">
                    {!isScanning ? (
                      <div className="h-full flex items-center justify-center text-white">
                        <div className="text-center space-y-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            <Camera className="h-8 w-8 mx-auto opacity-60" />
                          </motion.div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startScanning}
                            className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium"
                          >
                            {retryAttempts > 0
                              ? "Retry Camera"
                              : "Start Camera"}
                          </motion.button>
                          {retryAttempts > 0 && (
                            <p className="text-xs opacity-75">
                              Attempt {retryAttempts}/{maxRetryAttempts}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : hasPermission === false ? (
                      <div className="h-full flex items-center justify-center text-white text-center p-4">
                        <div className="space-y-3">
                          <AlertCircle className="h-8 w-8 mx-auto text-red-400" />
                          <p className="text-sm">{qrError}</p>
                          {retryAttempts < maxRetryAttempts && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={startScanning}
                              className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm"
                            >
                              Try Again ({maxRetryAttempts - retryAttempts}{" "}
                              left)
                            </motion.button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-full">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          autoPlay
                          playsInline
                          muted
                        />

                        {/* Enhanced scanning overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-4 border-2 border-white/50 rounded-2xl">
                            {/* Animated corner indicators */}
                            <motion.div
                              className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div
                              className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: 0.4,
                              }}
                            />
                            <motion.div
                              className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: 0.8,
                              }}
                            />
                            <motion.div
                              className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: 1.2,
                              }}
                            />
                          </div>

                          {/* Scanning line */}
                          <motion.div
                            className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full"
                            animate={{ y: [16, 176] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />

                          {/* Center target */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <motion.div
                              className="w-16 h-16 border-2 border-white/70 rounded-2xl"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {qrError && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-sm p-3 text-center rounded-b-3xl"
                      >
                        {qrError}
                      </motion.div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 text-center font-medium">
                    📱 Point camera at Guardian Key QR code
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Add Button with validation */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="pt-2"
            >
              <Button
                onClick={handleAddContact}
                disabled={
                  loading ||
                  !guardianKey ||
                  guardianKey.length !== 8 ||
                  !networkStatus ||
                  !/^[A-Z0-9]{8}$/.test(guardianKey)
                }
                className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 h-12 text-base font-semibold rounded-2xl"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    Adding Contact...
                  </div>
                ) : !networkStatus ? (
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4" />
                    No Connection
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Emergency Contact
                  </div>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Enhanced Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Network status warning */}
        {!networkStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-100 border border-yellow-300 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 text-yellow-800">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">
                No internet connection. Some features may not work.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-3">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between"
            >
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-gray-700" />
                Emergency Contacts
                <Badge variant="secondary" className="ml-2 text-xs">
                  {emergencyContacts.length}/10
                </Badge>
              </CardTitle>

              {isModal && onClose && (
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Search and Add */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-2 mt-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-gray-50 border-gray-200"
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="sm"
                      disabled={emergencyContacts.length >= 10}
                      className="h-10 px-4 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
                      title={
                        emergencyContacts.length >= 10
                          ? "Maximum 10 contacts allowed"
                          : "Add emergency contact"
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </motion.div>
                </DialogTrigger>
              </Dialog>
            </motion.div>
          </CardHeader>

          <CardContent className="pt-0">
            {emergencyContacts.length === 0 ? (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center py-12 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="p-4 rounded-full bg-gray-100 w-fit mx-auto"
                >
                  <Users className="h-8 w-8 text-gray-400" />
                </motion.div>
                <div>
                  <p className="font-medium text-gray-700 mb-1">
                    No Emergency Contacts
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Add trusted contacts for emergency situations
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Contact
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {/* Quick Actions */}
                {emergencyContacts.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        disabled={!networkStatus}
                        className="w-full h-9 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300"
                        onClick={async () => {
                          try {
                            const broadcast =
                              await emergencyContactConnectionService.sendEmergencyBroadcast(
                                "🚨 EMERGENCY: Immediate assistance needed! Please respond.",
                                "alert",
                                "high",
                              );
                            const successCount = Array.from(
                              broadcast.responses.keys(),
                            ).length;
                            setSuccess(
                              `🚨 Emergency alert sent to ${successCount}/${emergencyContacts.length} contacts`,
                            );
                            setTimeout(() => setSuccess(""), 3000);
                          } catch (error) {
                            setError("❌ Failed to send emergency alert");
                            setTimeout(() => setError(""), 3000);
                          }
                        }}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        {networkStatus ? "Alert All" : "No Connection"}
                      </Button>
                    </motion.div>
                  </div>
                )}

                {/* Contacts List */}
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {sortedContacts.map((contact, index) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: deletingContactId === contact.id ? 0.5 : 1,
                          y: 0,
                          scale: deletingContactId === contact.id ? 0.95 : 1,
                        }}
                        exit={{ opacity: 0, scale: 0.95, x: -100 }}
                        transition={{
                          delay: index * 0.05,
                          type: "spring",
                          stiffness: 300,
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className={cn(
                          "border rounded-xl p-3 transition-all duration-200 border-l-4 cursor-pointer",
                          getPriorityBorder(contact.priority),
                          deletingContactId === contact.id &&
                            "bg-red-100 border-red-300",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="relative">
                            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                              <AvatarFallback
                                className={cn(
                                  "font-semibold text-white",
                                  getPriorityColor(contact.priority),
                                )}
                              >
                                {contact.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {contact.isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                              />
                            )}
                          </div>

                          {/* Contact Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate text-gray-900">
                                {contact.name}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs px-2 py-0.5",
                                  contact.priority === 1 &&
                                    "border-red-300 text-red-700 bg-red-50",
                                  contact.priority === 2 &&
                                    "border-yellow-300 text-yellow-700 bg-yellow-50",
                                  contact.priority === 3 &&
                                    "border-green-300 text-green-700 bg-green-50",
                                )}
                              >
                                P{contact.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-500 font-mono tracking-wider">
                                {contact.guardianKey}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!networkStatus}
                                onClick={() => handleAlert(contact)}
                                className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-50"
                                title={
                                  networkStatus
                                    ? "Send emergency alert"
                                    : "No internet connection"
                                }
                              >
                                <Shield className="h-3 w-3" />
                              </Button>
                            </motion.div>

                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowConfirmDelete(contact)}
                                disabled={deletingContactId === contact.id}
                                className="h-8 w-8 p-0 text-gray-400 hover:bg-red-500 hover:text-white hover:border-red-500"
                                title="Remove contact"
                              >
                                {deletingContactId === contact.id ? (
                                  <motion.div
                                    className="h-3 w-3 border border-current border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{
                                      duration: 1,
                                      repeat: Infinity,
                                      ease: "linear",
                                    }}
                                  />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Modals */}
      <EnhancedAddContactModal />

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Remove Contact?
                </h3>

                <p className="text-gray-600 mb-6">
                  Remove{" "}
                  <span className="font-semibold">
                    {showConfirmDelete.name}
                  </span>{" "}
                  from emergency contacts?
                </p>

                <div className="flex gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmDelete(null)}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={() => handleRemoveContact(showConfirmDelete)}
                      disabled={!networkStatus}
                      className="w-full bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300"
                    >
                      Remove
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
