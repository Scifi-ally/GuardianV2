import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, MapPin, Clock, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EmergencyAlert {
  id: string;
  type: "danger" | "warning" | "safe" | "info";
  title: string;
  message: string;
  location?: { lat: number; lng: number };
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  sourceType:
    | "user_report"
    | "police"
    | "news"
    | "ai_detection"
    | "crowd_source";
  isActive: boolean;
  radius?: number; // meters
}

// Real-time alerts will be populated from external data sources

export function EmergencyAlerts() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(),
  );
  const { location } = useGeolocation();
  const { userProfile } = useAuth();

  const activeAlerts = alerts.filter(
    (alert) => alert.isActive && !dismissedAlerts.has(alert.id),
  );

  const getAlertIcon = (type: EmergencyAlert["type"]) => {
    switch (type) {
      case "danger":
        return <AlertTriangle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "safe":
        return <Shield className="h-4 w-4" />;
      case "info":
        return <MapPin className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (
    type: EmergencyAlert["type"],
    severity: EmergencyAlert["severity"],
  ) => {
    if (type === "danger" || severity === "critical") {
      return "bg-red-500 text-white border-red-600";
    }
    if (type === "warning" || severity === "high") {
      return "bg-orange-500 text-white border-orange-600";
    }
    if (type === "safe") {
      return "bg-green-500 text-white border-green-600";
    }
    return "bg-blue-500 text-white border-blue-600";
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  };

  const callEmergency = () => {
    // Try to call emergency number based on user's location
    if (
      userProfile?.emergencyContacts &&
      userProfile.emergencyContacts.length > 0
    ) {
      const primaryContact = userProfile.emergencyContacts[0];
      window.location.href = `tel:${primaryContact.phone}`;
    } else {
      // Fallback to 911
      window.location.href = "tel:911";
    }
  };

  const shareLocation = async () => {
    if (!location) return;

    const locationText = `Emergency! I need help. My location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Emergency Location",
          text: locationText,
        });
      } catch (error) {
        console.log("Share failed:", error);
        // Fallback to copy to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(locationText);
          // Location copied to clipboard silently
        }
      }
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(locationText);
      // Location copied to clipboard silently
    }
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-2 right-2 z-30 space-y-2">
      <AnimatePresence>
        {activeAlerts.slice(0, 3).map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "shadow-lg border-2 overflow-hidden",
                getAlertColor(alert.type, alert.severity),
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm leading-tight">
                          {alert.title}
                        </h4>
                        <p className="text-xs opacity-90 mt-1 leading-relaxed">
                          {alert.message}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-white/20 text-white border-white/30"
                          >
                            {alert.sourceType.replace("_", " ")}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs opacity-75">
                            <Clock className="h-3 w-3" />
                            {Math.round(
                              (Date.now() - alert.timestamp.getTime()) / 60000,
                            )}
                            m ago
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissAlert(alert.id)}
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {(alert.type === "danger" || alert.severity === "high") && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={callEmergency}
                          className="h-7 text-xs bg-white/20 text-white hover:bg-white/30 border-white/30"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call Help
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={shareLocation}
                          className="h-7 text-xs bg-white/20 text-white hover:bg-white/30 border-white/30"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Share Location
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {activeAlerts.length > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Badge className="bg-black/80 text-white text-xs">
            +{activeAlerts.length - 3} more alerts
          </Badge>
        </motion.div>
      )}
    </div>
  );
}
