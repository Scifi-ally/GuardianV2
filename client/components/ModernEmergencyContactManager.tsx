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
} from "lucide-react";
import { useAuth, type EmergencyContact } from "@/contexts/AuthContext";
import { EmergencyContactService } from "@/services/emergencyContactService";
import { EmergencyKeyService } from "@/services/emergencyKeyService";
import { emergencyContactConnectionService } from "@/services/emergencyContactConnectionService";
import { cn } from "@/lib/utils";
import QrScanner from "qr-scanner";

interface ModernEmergencyContactManagerProps {
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

export function ModernEmergencyContactManager({
  className,
  isModal = false,
  onClose,
}: ModernEmergencyContactManagerProps) {
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

  // QR Scanner state
  const [showQRInAdd, setShowQRInAdd] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

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

  // QR Scanner functions
  const startScanning = async () => {
    try {
      setQrError(null);
      setIsScanning(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setQrError("Camera not supported on this device");
        setIsScanning(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 400 },
          height: { ideal: 300 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

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
          },
        );

        await qrScannerRef.current.start();
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setQrError("Camera permission denied or not available");
      setIsScanning(false);
      setHasPermission(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);

    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleQRScanSuccess = (data: string) => {
    stopScanning();

    // Try to extract Guardian key from QR data
    let extractedKey = "";

    if (data.length === 8 && /^[A-Z0-9]{8}$/.test(data)) {
      extractedKey = data;
    } else if (data.includes("guardian")) {
      const match = data.match(/[A-Z0-9]{8}/);
      if (match) extractedKey = match[0];
    } else {
      const match = data.match(/[A-Z0-9]{8}/);
      if (match) extractedKey = match[0];
    }

    if (extractedKey) {
      setGuardianKey(extractedKey);
      setShowQRInAdd(false);
      setSuccess("Guardian key scanned successfully!");
      setTimeout(() => setSuccess(""), 2000);
    } else {
      setQrError("Invalid QR code. Please scan a Guardian Key QR code.");
      setTimeout(() => setQrError(null), 3000);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => stopScanning();
  }, []);

  const handleAddContact = async () => {
    if (!guardianKey.trim() || guardianKey.length !== 8) {
      setError("Guardian key must be exactly 8 characters");
      return;
    }

    if (
      emergencyContacts.some((contact) => contact.guardianKey === guardianKey)
    ) {
      setError("This contact is already added");
      return;
    }

    if (!currentUser) {
      setError("Please sign in to add contacts");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await EmergencyContactService.addEmergencyContact(
        currentUser.uid,
        guardianKey.trim().toUpperCase(),
        1, // Default priority
      );

      if (result.success) {
        setSuccess(`Emergency contact added successfully!`);
        await refreshProfile();

        // Reset form
        setGuardianKey("");
        setIsAddDialogOpen(false);
        setShowQRInAdd(false);
        stopScanning();

        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.error || "Failed to add contact");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContact = async (contact: EmergencyContact) => {
    if (!currentUser) return;

    setDeletingContactId(contact.id);

    try {
      const result = await EmergencyContactService.removeEmergencyContact(
        currentUser.uid,
        contact,
      );

      if (result.success) {
        setSuccess(`${contact.name} removed from emergency contacts`);
        await refreshProfile();
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(result.error || "Failed to remove contact");
      }
    } catch (error) {
      setError("Failed to remove contact");
    } finally {
      setDeletingContactId(null);
      setShowConfirmDelete(null);
    }
  };

  const handleAlert = async (contact: EmergencyContact) => {
    try {
      const connectionStatus =
        await emergencyContactConnectionService.testConnection(contact);

      if (!connectionStatus.isConnected) {
        setError(
          `Cannot reach ${contact.name}: ${connectionStatus.error || "No connection"}`,
        );
        setTimeout(() => setError(""), 3000);
        return;
      }

      const { emergencyContactActionsService } = await import(
        "@/services/emergencyContactActionsService"
      );
      await emergencyContactActionsService.alertContact(contact);

      setSuccess(`Emergency alert sent to ${contact.name}!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(`Failed to send alert to ${contact.name}`);
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

  // Simple Add Contact Modal with integrated QR scanner
  const SimpleAddContactModal = () => (
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
          </DialogHeader>

          <div className="space-y-4">
            {/* Guardian Key Input */}
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
                        : "border-gray-300 focus:border-black",
                    )}
                    maxLength={8}
                    disabled={loading}
                  />
                  {guardianKey.length === 8 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </motion.div>
                  )}
                </div>

                {/* QR Scanner Toggle Button */}
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
                  className={cn(
                    "w-full py-3 px-4 rounded-2xl border-2 font-medium transition-all flex items-center justify-center gap-2",
                    showQRInAdd
                      ? "bg-black text-white border-black"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400",
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
                    </>
                  )}
                </motion.button>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  {guardianKey.length}/8 characters
                </p>
              </div>
            </div>

            {/* QR Scanner - Integrated inline */}
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
                            Start Camera
                          </motion.button>
                        </div>
                      </div>
                    ) : hasPermission === false ? (
                      <div className="h-full flex items-center justify-center text-white text-center p-4">
                        <div className="space-y-3">
                          <AlertCircle className="h-8 w-8 mx-auto text-red-400" />
                          <p className="text-sm">{qrError}</p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startScanning}
                            className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm"
                          >
                            Try Again
                          </motion.button>
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

                        {/* Scanning overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-4 border-2 border-white/50 rounded-2xl">
                            {/* Corner indicators */}
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl"></div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl"></div>
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl"></div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl"></div>
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

            {/* Add Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="pt-2"
            >
              <Button
                onClick={handleAddContact}
                disabled={loading || !guardianKey || guardianKey.length !== 8}
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
                    Adding...
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
      {/* Status Messages */}
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
                  {emergencyContacts.length}
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
                      className="h-10 px-4 bg-black text-white hover:bg-gray-800"
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
                <div className="p-4 rounded-full bg-gray-100 w-fit mx-auto">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
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
                        className="w-full h-9 bg-red-600 hover:bg-red-700 text-white"
                        onClick={async () => {
                          try {
                            const broadcast =
                              await emergencyContactConnectionService.sendEmergencyBroadcast(
                                "Emergency assistance needed! Please respond immediately.",
                                "alert",
                                "high",
                              );
                            const successCount = Array.from(
                              broadcast.responses.keys(),
                            ).length;
                            setSuccess(
                              `Emergency alert sent to ${successCount}/${emergencyContacts.length} contacts`,
                            );
                            setTimeout(() => setSuccess(""), 3000);
                          } catch (error) {
                            setError("Failed to send emergency alert");
                            setTimeout(() => setError(""), 3000);
                          }
                        }}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Alert All
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
                                onClick={() => handleAlert(contact)}
                                className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-500 hover:text-white"
                                title="Send emergency alert"
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

      {/* Modals */}
      <SimpleAddContactModal />

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
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
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
