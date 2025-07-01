import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  X,
  Navigation,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SOSAlert } from "@/services/sosService";
import { cn } from "@/lib/utils";

interface SOSPopupNotificationProps {
  alerts: SOSAlert[];
  onDismiss: (alertId: string) => void;
  onNavigate: (alert: SOSAlert) => void;
  onCall: (alert: SOSAlert) => void;
}

export function SOSPopupNotification({
  alerts,
  onDismiss,
  onNavigate,
  onCall,
}: SOSPopupNotificationProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<SOSAlert[]>([]);

  useEffect(() => {
    // Show new critical alerts immediately as popups
    const criticalAlerts = alerts.filter(
      (alert) =>
        alert.priority === "critical" &&
        !visibleAlerts.some((visible) => visible.id === alert.id),
    );

    if (criticalAlerts.length > 0) {
      setVisibleAlerts((prev) => [...criticalAlerts, ...prev]);

      // Auto-dismiss after 30 seconds for non-critical
      criticalAlerts.forEach((alert) => {
        if (alert.priority !== "critical") {
          setTimeout(() => {
            setVisibleAlerts((prev) => prev.filter((a) => a.id !== alert.id));
          }, 30000);
        }
      });
    }
  }, [alerts]);

  const handleDismiss = (alertId: string) => {
    setVisibleAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    onDismiss(alertId);
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const priorityConfig = {
    critical: {
      bg: "bg-emergency",
      text: "text-emergency-foreground",
      border: "border-emergency",
      icon: "text-emergency-foreground",
      animate: true,
    },
    high: {
      bg: "bg-warning",
      text: "text-warning-foreground",
      border: "border-warning",
      icon: "text-warning-foreground",
      animate: false,
    },
    medium: {
      bg: "bg-primary",
      text: "text-primary-foreground",
      border: "border-primary",
      icon: "text-primary-foreground",
      animate: false,
    },
    low: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-muted",
      icon: "text-muted-foreground",
      animate: false,
    },
  };

  if (visibleAlerts.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div className="absolute top-4 right-4 space-y-3 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {visibleAlerts.slice(0, 3).map((alert, index) => {
            const config = priorityConfig[alert.priority];

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 400, scale: 0.3 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    delay: index * 0.1,
                  },
                }}
                exit={{
                  opacity: 0,
                  x: 400,
                  scale: 0.5,
                  transition: { duration: 0.2 },
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "w-80 shadow-2xl border-2 overflow-hidden",
                    config.border,
                    config.animate && "animate-pulse",
                  )}
                >
                  {/* Priority Header */}
                  <div className={cn("px-4 py-2", config.bg, config.text)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={cn("h-4 w-4", config.icon)} />
                        <Badge
                          variant="secondary"
                          className="text-xs bg-white/20 text-white"
                        >
                          {alert.priority.toUpperCase()} ALERT
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(alert.id!)}
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Alert Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">
                          {alert.senderName}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(alert.createdAt)}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>

                      {alert.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {alert.location.latitude.toFixed(4)},{" "}
                            {alert.location.longitude.toFixed(4)}
                          </span>
                          {alert.location.accuracy && (
                            <span className="text-xs">
                              (±{Math.round(alert.location.accuracy)}m)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onNavigate(alert)}
                        className="flex-1 h-9 bg-safe hover:bg-safe/90 text-safe-foreground"
                        disabled={!alert.location}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Navigate
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCall(alert)}
                        className="h-9 px-3 border-emergency text-emergency hover:bg-emergency hover:text-emergency-foreground"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Alert Type Indicator */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        {alert.type === "voice-activation"
                          ? "Voice Activated"
                          : alert.type === "panic"
                            ? "Panic Button"
                            : alert.type === "automatic"
                              ? "Auto Detected"
                              : "Manual Alert"}
                      </span>

                      {alert.priority === "critical" && (
                        <Badge className="bg-emergency text-emergency-foreground animate-pulse">
                          URGENT
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Additional alerts indicator */}
        {visibleAlerts.length > 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge variant="outline" className="bg-background/80 backdrop-blur">
              +{visibleAlerts.length - 3} more alerts
            </Badge>
          </motion.div>
        )}
      </div>
    </div>,
    document.body,
  );
}
