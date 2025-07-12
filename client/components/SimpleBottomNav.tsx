import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  User,
  AlertTriangle,
  Phone,
  Shield,
  Camera,
  MessageSquare,
  Mic,
  Video,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePanicMode } from "@/services/panicModeService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { buttonAnimations, emergencyAnimations } from "@/lib/animations";

interface SimpleBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSOSPress: () => void;
}

export function SimpleBottomNav({
  activeTab,
  onTabChange,
  onSOSPress,
}: SimpleBottomNavProps) {
  const [sosPressed, setSosPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<"audio" | "video">(
    "audio",
  );

  const { userProfile } = useAuth();
  const {
    currentSession,
    isActive: panicModeActive,
    startPanicMode,
    stopPanicMode,
    alertContacts,
    startRecording,
    stopRecording,
    callEmergencyServices,
    shareLocation,
    activateSafeMode,
  } = usePanicMode();

  const handleSOSPress = async () => {
    if (sosPressed) return;

    setSosPressed(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setSosPressed(false);
          onSOSPress();
          activatePanicModeReal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelSOS = () => {
    setSosPressed(false);
    setCountdown(0);
  };

  const activatePanicModeReal = useCallback(async () => {
    try {
      const emergencyContacts =
        userProfile?.emergencyContacts?.map((c) => c.id) || [];
      await startPanicMode(emergencyContacts);
      toast.success(
        "Panic mode activated! Emergency contacts will be alerted.",
        {
          duration: 5000,
        },
      );
    } catch (error) {
      console.error("Failed to activate panic mode:", error);
      toast.error("Failed to activate panic mode");
    }
  }, [startPanicMode, userProfile]);

  const deactivatePanicMode = useCallback(async () => {
    try {
      await activateSafeMode();
      toast.success("Safe mode activated. All-clear message sent.");
    } catch (error) {
      console.error("Failed to deactivate panic mode:", error);
      stopPanicMode();
      toast.info("Panic mode deactivated");
    }
  }, [activateSafeMode, stopPanicMode]);

  const handlePanicAction = useCallback(
    async (action: "alert" | "record" | "safe") => {
      if (!panicModeActive) {
        toast.error("Panic mode must be active to use this feature");
        return;
      }

      try {
        switch (action) {
          case "alert":
            await alertContacts();
            toast.success("Alert sent to emergency contacts!");
            break;
          case "record":
            if (isRecording) {
              stopRecording();
              setIsRecording(false);
              toast.success("Recording stopped and saved");
            } else {
              await startRecording(recordingType);
              setIsRecording(true);
              toast.success(`${recordingType} recording started`);
            }
            break;
          case "safe":
            await deactivatePanicMode();
            break;
        }
      } catch (error) {
        console.error(`Panic action ${action} failed:`, error);
        toast.error(`Failed to ${action}`);
      }
    },
    [
      panicModeActive,
      alertContacts,
      startRecording,
      stopRecording,
      recordingType,
      isRecording,
      deactivatePanicMode,
    ],
  );

  return (
    <>
      {/* Panic Mode Overlay */}
      <AnimatePresence>
        {panicModeActive && (
          <motion.div
            className="fixed bottom-20 left-4 right-4 z-40"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className="border-emergency bg-emergency/5 backdrop-blur-lg shadow-2xl">
              <CardContent className="p-4">
                <motion.div
                  className="flex items-center justify-between mb-3"
                  variants={emergencyAnimations}
                  animate="pulse"
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="p-1 rounded-full bg-emergency/20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <AlertTriangle className="h-4 w-4 text-emergency" />
                    </motion.div>
                    <Badge className="bg-emergency text-emergency-foreground text-xs">
                      PANIC MODE ACTIVE
                    </Badge>
                    {currentSession && (
                      <Badge variant="outline" className="text-xs">
                        {Math.floor(
                          (Date.now() - currentSession.startTime.getTime()) /
                            1000,
                        )}
                        s
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={deactivatePanicMode}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs hover:bg-emergency/10"
                  >
                    Safe Mode
                  </Button>
                </motion.div>

                <div className="grid grid-cols-3 gap-2">
                  <motion.div
                    variants={buttonAnimations}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      onClick={() => handlePanicAction("alert")}
                      size="sm"
                      variant="outline"
                      className="h-12 w-full flex-col gap-1 text-xs border-warning hover:bg-warning/10"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Alert
                    </Button>
                  </motion.div>

                  <motion.div
                    variants={buttonAnimations}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      onClick={() => handlePanicAction("record")}
                      size="sm"
                      variant="outline"
                      className={cn(
                        "h-12 w-full flex-col gap-1 text-xs transition-all",
                        isRecording
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-primary hover:bg-primary/10",
                      )}
                    >
                      {recordingType === "video" ? (
                        <Video
                          className={cn(
                            "h-4 w-4",
                            isRecording && "animate-pulse",
                          )}
                        />
                      ) : (
                        <Mic
                          className={cn(
                            "h-4 w-4",
                            isRecording && "animate-pulse",
                          )}
                        />
                      )}
                      {isRecording ? "Stop" : "Record"}
                    </Button>
                  </motion.div>

                  <motion.div
                    variants={buttonAnimations}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      onClick={() => handlePanicAction("safe")}
                      size="sm"
                      variant="outline"
                      className="h-12 w-full flex-col gap-1 text-xs border-safe hover:bg-safe/10"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Safe
                    </Button>
                  </motion.div>
                </div>

                {/* Recording Type Toggle */}
                <motion.div
                  className="mt-3 flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-xs text-gray-600">Record:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setRecordingType("audio")}
                      className={cn(
                        "px-2 py-1 text-xs rounded transition-all",
                        recordingType === "audio"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900",
                      )}
                    >
                      Audio
                    </button>
                    <button
                      onClick={() => setRecordingType("video")}
                      className={cn(
                        "px-2 py-1 text-xs rounded transition-all",
                        recordingType === "video"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900",
                      )}
                    >
                      Video
                    </button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden">
        {/* Background with blur and gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/98 to-background/90 backdrop-blur-xl" />

        {/* Navigation Content */}
        <div className="relative max-w-sm mx-auto px-4 py-2">
          <div className="flex items-end justify-center gap-20">
            {/* Map Button */}
            <div className="relative flex flex-col items-center group">
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100",
                  activeTab === "map"
                    ? "bg-primary/20 blur-xl scale-110"
                    : "bg-primary/10 blur-lg scale-105",
                )}
              />
              <Button
                onClick={() => onTabChange("map")}
                variant="ghost"
                className={cn(
                  "relative h-12 w-12 rounded-2xl transition-all duration-500 transform backdrop-blur-sm",
                  "hover:shadow-lg hover:-translate-y-1 active:scale-95",
                  activeTab === "map"
                    ? "bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 text-primary scale-110 shadow-xl border-2 border-primary/30 ring-4 ring-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-105 hover:border-primary/20 border-2 border-transparent",
                )}
              >
                <MapPin
                  className={cn(
                    "transition-all duration-300",
                    activeTab === "map" ? "h-8 w-8" : "h-7 w-7",
                  )}
                />
              </Button>
              <span
                className={cn(
                  "text-xs font-medium mt-1 transition-all duration-300",
                  activeTab === "map"
                    ? "text-primary scale-110"
                    : "text-muted-foreground group-hover:text-primary",
                )}
              >
                Map
              </span>
            </div>

            {/* SOS Button - Center Elevated */}
            <div className="relative flex flex-col items-center -mt-4">
              <AnimatePresence>
                {panicModeActive && (
                  <motion.div
                    className="absolute -top-2 -right-2 h-4 w-4 bg-emergency rounded-full border-2 border-white shadow-2xl"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <div className="absolute inset-0 rounded-full bg-emergency/20 blur-2xl scale-125 opacity-50" />
              {!sosPressed ? (
                <motion.button
                  onClick={handleSOSPress}
                  className={cn(
                    "relative h-18 w-18 rounded-full transition-all duration-300 transform",
                    "bg-gradient-to-br from-emergency via-emergency/90 to-emergency/80",
                    "hover:from-emergency/95 hover:via-emergency/85 hover:to-emergency/75",
                    "text-emergency-foreground shadow-2xl border-4 border-white/70",
                    "hover:scale-110 hover:shadow-emergency/25 hover:-translate-y-2",
                    "active:scale-105 active:translate-y-0",
                    panicModeActive &&
                      "ring-4 ring-emergency/30 border-emergency/50",
                  )}
                  variants={emergencyAnimations}
                  animate={panicModeActive ? "pulse" : ""}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <AlertTriangle className="h-7 w-7 drop-shadow-lg" />
                    <span className="text-xs font-bold drop-shadow-lg">
                      SOS
                    </span>
                  </div>
                </motion.button>
              ) : (
                <Button
                  onClick={handleCancelSOS}
                  className={cn(
                    "relative h-18 w-18 rounded-full transition-all duration-200",
                    "bg-gradient-to-br from-warning via-warning/90 to-warning/80 text-warning-foreground",
                    "shadow-2xl border-4 border-white/70 ring-4 ring-warning/30",
                  )}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="text-lg font-bold drop-shadow-lg">
                      {countdown}
                    </div>
                    <span className="text-xs font-medium drop-shadow-lg">
                      Cancel
                    </span>
                  </div>
                </Button>
              )}
              <span className="text-xs font-bold mt-2 text-emergency">
                Emergency
              </span>
            </div>

            {/* Profile Button */}
            <div className="relative flex flex-col items-center group">
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100",
                  activeTab === "profile"
                    ? "bg-primary/20 blur-xl scale-110"
                    : "bg-primary/10 blur-lg scale-105",
                )}
              />
              <Button
                onClick={() => onTabChange("profile")}
                variant="ghost"
                className={cn(
                  "relative h-12 w-12 rounded-2xl transition-all duration-500 transform backdrop-blur-sm",
                  "hover:shadow-lg hover:-translate-y-1 active:scale-95",
                  activeTab === "profile"
                    ? "bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 text-primary scale-110 shadow-xl border-2 border-primary/30 ring-4 ring-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-105 hover:border-primary/20 border-2 border-transparent",
                )}
              >
                <User
                  className={cn(
                    "transition-all duration-300",
                    activeTab === "profile" ? "h-8 w-8" : "h-7 w-7",
                  )}
                />
              </Button>
              <span
                className={cn(
                  "text-xs font-medium mt-1 transition-all duration-300",
                  activeTab === "profile"
                    ? "text-primary scale-110"
                    : "text-muted-foreground group-hover:text-primary",
                )}
              >
                Profile
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
