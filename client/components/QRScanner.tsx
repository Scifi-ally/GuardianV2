import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Camera,
  X,
  AlertCircle,
  CheckCircle,
  MapPin,
  Navigation,
  User,
  Scan,
} from "lucide-react";
import { qrCodeService } from "@/services/qrCodeService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import QrScanner from "qr-scanner";
import { mobileCameraService } from "@/services/mobileCameraService";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult?: (data: string, parsedData: any) => void;
}

export function QRScanner({ isOpen, onClose, onScanResult }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    data: string;
    parsed: any;
    type: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const navigate = useNavigate();
  const { userProfile } = useAuth();

  useEffect(() => {
    if (isOpen) {
      checkCameraAndRequestPermission();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const checkCameraAndRequestPermission = async () => {
    try {
      const capabilities = await mobileCameraService.getCameraCapabilities();

      if (!capabilities.canScanQR) {
        setHasPermission(false);
        setError("Camera not available on this device or permissions denied");
        return;
      }

      await requestCameraPermission();
    } catch (err) {
      console.error("Error checking camera capabilities:", err);
      setHasPermission(false);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const requestCameraPermission = async () => {
    try {
      setError(null);

      if (!videoRef.current) {
        setError("Video element not ready");
        return;
      }

      // Request permissions through mobile service
      const permissions = await mobileCameraService.requestCameraPermissions();

      if (!permissions.camera) {
        setHasPermission(false);
        setError(
          "Camera permission is required to scan QR codes. Please allow camera access in your device settings.",
        );
        return;
      }

      // Get optimal settings for QR scanning
      const scannerSettings = mobileCameraService.getQRScannerSettings();

      // Create QR Scanner instance with mobile-optimized settings
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) =>
          handleScanSuccess(typeof result === "string" ? result : result.data),
        scannerSettings,
      );

      await qrScannerRef.current.start();
      setHasPermission(true);
      setIsScanning(true);

      console.log("QR Scanner started successfully");
    } catch (err) {
      console.error("Camera permission denied:", err);
      setHasPermission(false);
      setError(
        "Camera access denied. Please allow camera permissions to scan QR codes.",
      );
    }
  };

  const startScanning = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.start();
        setIsScanning(true);
      } catch (err) {
        console.error("Failed to start scanning:", err);
        setError("Failed to start camera scanning");
      }
    }
  };

  const stopScanning = () => {
    setIsScanning(false);

    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
  };

  const handleScanSuccess = (data: string) => {
    stopScanning();

    const parsed = qrCodeService.parseQRData(data);
    setScanResult({
      data,
      parsed: parsed.parsed,
      type: parsed.type,
    });

    onScanResult?.(data, parsed.parsed);

    // Auto-handle common QR code types
    handleQRAction(parsed.type, parsed.parsed);
  };

  const handleQRAction = (type: string, parsedData: any) => {
    switch (type) {
      case "guardian_key":
        // Guardian Key detected silently
        break;

      case "location":
        // Location QR detected silently
        setTimeout(() => {
          navigate("/", {
            state: {
              targetLocation: {
                lat: parsedData.latitude,
                lng: parsedData.longitude,
              },
            },
          });
          onClose();
        }, 1000);
        break;

      case "emergency_contact":
        // Emergency contact detected silently
        break;

      default:
      // QR code scanned successfully silently
    }
  };

  const handleManualInput = () => {
    // For testing purposes, allow manual input
    const testData = prompt("Enter QR code data for testing:");
    if (testData) {
      handleScanSuccess(testData);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "guardian_key":
        return User;
      case "location":
        return MapPin;
      case "emergency_contact":
        return User;
      default:
        return QrCode;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case "guardian_key":
        return "bg-blue-100 text-blue-800";
      case "location":
        return "bg-green-100 text-green-800";
      case "emergency_contact":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md"
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">QR Scanner</span>
                    </div>
                    <Button
                      onClick={onClose}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Scanner Area */}
                <div className="relative">
                  {hasPermission === null && (
                    <div className="h-64 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Requesting camera access...
                        </p>
                      </div>
                    </div>
                  )}

                  {hasPermission === false && (
                    <div className="h-64 flex items-center justify-center bg-red-50">
                      <div className="text-center p-4">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                        <p className="text-sm text-red-600 mb-3">{error}</p>
                        <Button
                          onClick={requestCameraPermission}
                          size="sm"
                          variant="outline"
                          className="mr-2"
                        >
                          Retry
                        </Button>
                        <Button
                          onClick={handleManualInput}
                          size="sm"
                          variant="ghost"
                        >
                          Manual Input
                        </Button>
                      </div>
                    </div>
                  )}

                  {hasPermission === true && !scanResult && (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        className="w-full h-64 object-cover bg-black"
                        autoPlay
                        playsInline
                        muted
                      />

                      {/* Scanning overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Scanning frame */}
                        <div className="absolute inset-8 border-2 border-white/50 rounded-lg">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                        </div>

                        {/* Scanning line animation */}
                        {isScanning && (
                          <motion.div
                            className="absolute left-8 right-8 h-0.5 bg-blue-500"
                            animate={{ y: [32, 224] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        )}
                      </div>

                      {/* Status indicator */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-black/50 rounded-lg p-2 text-center">
                          <div className="flex items-center justify-center gap-2 text-white text-sm">
                            <Scan className="h-4 w-4" />
                            {isScanning
                              ? "Scanning for QR codes..."
                              : "Ready to scan"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scan Result */}
                  {scanResult && (
                    <div className="p-4 bg-green-50">
                      <div className="text-center space-y-3">
                        <div className="flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>

                        <div>
                          <Badge
                            className={cn(
                              "mb-2",
                              getResultColor(scanResult.type),
                            )}
                          >
                            {scanResult.type.replace("_", " ").toUpperCase()}
                          </Badge>
                          <p className="text-sm text-gray-600 break-all">
                            {scanResult.data}
                          </p>
                        </div>

                        <div className="flex gap-2 justify-center">
                          {scanResult.type === "location" && (
                            <Button
                              onClick={() => {
                                navigate("/", {
                                  state: {
                                    targetLocation: {
                                      lat: scanResult.parsed.latitude,
                                      lng: scanResult.parsed.longitude,
                                    },
                                  },
                                });
                                onClose();
                              }}
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Navigation className="h-3 w-3" />
                              Open Map
                            </Button>
                          )}

                          <Button
                            onClick={() => {
                              setScanResult(null);
                              setIsScanning(false);
                              setTimeout(() => {
                                startScanning();
                              }, 100);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Scan Again
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Point camera at QR code to scan
                    </p>
                    <Button
                      onClick={handleManualInput}
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                    >
                      Test Mode
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
