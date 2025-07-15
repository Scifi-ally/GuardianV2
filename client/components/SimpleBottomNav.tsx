import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SafeMotion from "@/components/SafeMotion";
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
      // Panic mode activated silently
    } catch (error) {
      console.error("Failed to activate panic mode:", error);
      // Panic mode failed silently
    }
  }, [startPanicMode, userProfile]);

  const deactivatePanicMode = useCallback(async () => {
    try {
      await activateSafeMode();
      // Safe mode activated silently
    } catch (error) {
      console.error("Failed to deactivate panic mode:", error);
      stopPanicMode();
      // Panic mode deactivated silently
    }
  }, [activateSafeMode, stopPanicMode]);

  const handlePanicAction = useCallback(
    async (action: "alert" | "record" | "safe") => {
      if (!panicModeActive) {
        // Panic mode requirement check silently
        return;
      }

      try {
        switch (action) {
          case "alert":
            await alertContacts();
            // Alert sent to emergency contacts silently
            break;
          case "record":
            if (isRecording) {
              stopRecording();
              setIsRecording(false);
              // Recording stopped and saved silently
            } else {
              await startRecording(recordingType);
              setIsRecording(true);
              // Recording started silently
            }
            break;
          case "safe":
            await deactivatePanicMode();
            break;
        }
      } catch (error) {
        console.error(`Panic action ${action} failed:`, error);
        // Action failed silently
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
          <SafeMotion
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
          </SafeMotion>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden">
        {/* Background with blur and gradient */}
        <div className="absolute inset-0 navbar-light" />

        {/* Navigation Content */}
        <div className="relative max-w-xs mx-auto px-3 py-2">
          <div className="flex items-end justify-center gap-12">
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
                  "relative h-10 w-10 rounded-xl transition-all duration-300 transform backdrop-blur-sm",
                  "hover:shadow-md hover:-translate-y-0.5 active:scale-95",
                  activeTab === "map"
                    ? "bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 text-white scale-105 shadow-lg border-2 border-slate-200/30 ring-2 ring-slate-100/30 rounded-2xl"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 hover:scale-105 hover:border-slate-200/30 border-2 border-transparent rounded-2xl",
                )}
              >
                <MapPin
                  className={cn(
                    "transition-all duration-300",
                    activeTab === "map" ? "h-5 w-5" : "h-4 w-4",
                  )}
                />
              </Button>
              <span
                className={cn(
                  "text-xs font-medium mt-1 transition-all duration-300",
                  activeTab === "map"
                    ? "text-slate-700 scale-105"
                    : "text-slate-400 group-hover:text-slate-600",
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
                    "relative h-16 w-16 rounded-full transition-all duration-300 transform",
                    "bg-gradient-to-br from-emergency via-emergency/90 to-emergency/80",
                    "hover:from-emergency/95 hover:via-emergency/85 hover:to-emergency/75",
                    "text-emergency-foreground shadow-xl border-3 border-white/80",
                    "hover:scale-105 hover:shadow-emergency/20 hover:-translate-y-1",
                    "active:scale-100 active:translate-y-0",
                    panicModeActive &&
                      "ring-3 ring-emergency/30 border-emergency/50",
                  )}
                  variants={emergencyAnimations}
                  animate={panicModeActive ? "pulse" : ""}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <AlertTriangle className="h-6 w-6 drop-shadow-lg" />
                    <span className="text-xs font-bold drop-shadow-lg">
                      SOS
                    </span>
                  </div>
                </motion.button>
              ) : (
                <Button
                  onClick={handleCancelSOS}
                  className={cn(
                    "relative h-16 w-16 rounded-full transition-all duration-200",
                    "bg-gradient-to-br from-warning via-warning/90 to-warning/80 text-warning-foreground",
                    "shadow-xl border-3 border-white/80 ring-3 ring-warning/30",
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
                  "relative h-10 w-10 rounded-xl transition-all duration-300 transform backdrop-blur-sm",
                  "hover:shadow-md hover:-translate-y-0.5 active:scale-95",
                  activeTab === "profile"
                    ? "bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 text-white scale-105 shadow-lg border-2 border-slate-200/30 ring-2 ring-slate-100/30 rounded-2xl"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 hover:scale-105 hover:border-slate-200/30 border-2 border-transparent rounded-2xl",
                )}
              >
                <User
                  className={cn(
                    "transition-all duration-300",
                    activeTab === "profile" ? "h-5 w-5" : "h-4 w-4",
                  )}
                />
              </Button>
              <span
                className={cn(
                  "text-xs font-medium mt-1 transition-all duration-300",
                  activeTab === "profile"
                    ? "text-slate-700 scale-105"
                    : "text-slate-400 group-hover:text-slate-600",
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
