import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Bell,
  Check,
  X,
  Navigation,
  MapPin,
  Clock,
} from "lucide-react";
import { SOSService, type SOSAlert } from "@/services/sosService";
import { SOSNotificationPanel } from "@/components/SOSNotificationPanel";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation, useHapticFeedback } from "@/hooks/use-device-apis";
import { SlidingPanel, PanelContainer } from "@/components/SlidingPanel";
import { cn } from "@/lib/utils";

interface SOSAlertManagerProps {
  className?: string;
}

export function SOSAlertManager({ className }: SOSAlertManagerProps) {
  const [activeAlerts, setActiveAlerts] = useState<SOSAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const { userProfile } = useAuth();
  const { getCurrentLocation } = useGeolocation();
  const { emergencyVibration, warningVibration } = useHapticFeedback();

  useEffect(() => {
    if (!userProfile?.uid) return;

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = SOSService.subscribeToSOSAlerts(
        userProfile.uid,
        (alerts) => {
          // Check if there are new alerts
          const newAlerts = alerts.filter(
            (alert) =>
              !activeAlerts.some((existing) => existing.id === alert.id),
          );

          if (newAlerts.length > 0) {
            // Trigger haptic feedback for new alerts
            newAlerts.forEach((alert) => {
              if (alert.priority === "critical") {
                emergencyVibration();
              } else {
                warningVibration();
              }
            });

            // Auto-open notification panel for critical alerts
            const criticalAlert = newAlerts.find(
              (alert) => alert.priority === "critical",
            );
            if (criticalAlert) {
              setSelectedAlert(criticalAlert);
              setIsNotificationPanelOpen(true);
            }
          }

          setActiveAlerts(alerts);
        },
      );
    } catch (error) {
      console.warn("Failed to subscribe to SOS alerts:", error);
      // Set empty alerts array to prevent infinite loops
      setActiveAlerts([]);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn("Error unsubscribing from SOS alerts:", error);
        }
      }
    };
  }, [userProfile?.uid, emergencyVibration, warningVibration]); // Removed activeAlerts from deps to prevent infinite loop

  const handleAlertClick = (alert: SOSAlert) => {
    setSelectedAlert(alert);
    setIsNotificationPanelOpen(true);
  };

  const handleCloseNotification = () => {
    setIsNotificationPanelOpen(false);
    setSelectedAlert(null);
  };

  const handleQuickNavigate = async (alert: SOSAlert) => {
    if (!alert.location) return;

    const { latitude, longitude } = alert.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, "_blank");

    // Respond that we're en route
    if (userProfile) {
      const location = await getCurrentLocation().catch(() => undefined);
      await SOSService.respondToSOS(
        alert.id!,
        userProfile.uid,
        userProfile.displayName,
        "enroute",
        "Navigating to your location",
        location,
      );
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-warning/20 text-warning-foreground",
    high: "bg-emergency/20 text-emergency-foreground",
    critical: "bg-emergency text-emergency-foreground animate-pulse",
  };

  if (activeAlerts.length === 0) {
    return null; // Don't show anything if no alerts
  }

  return (
    <PanelContainer>
      {/* Alert Indicator */}
      <div className={cn("fixed top-4 right-4 z-50", className)}>
        <Button
          onClick={() => {
            const criticalAlert = activeAlerts.find(
              (alert) => alert.priority === "critical",
            );
            handleAlertClick(criticalAlert || activeAlerts[0]);
          }}
          className={cn(
            "h-12 w-12 rounded-full shadow-lg border-2 border-white",
            activeAlerts.some((alert) => alert.priority === "critical")
              ? "bg-emergency hover:bg-emergency/90 animate-pulse"
              : "bg-warning hover:bg-warning/90",
          )}
        >
          <div className="relative">
            <Bell className="h-6 w-6" />
            {activeAlerts.length > 1 && (
              <Badge
                className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-destructive text-destructive-foreground"
                variant="destructive"
              >
                {activeAlerts.length}
              </Badge>
            )}
          </div>
        </Button>
      </div>

      {/* Alerts List - Quick View */}
      <div className="fixed top-20 right-4 z-40 max-w-sm space-y-2">
        {activeAlerts.slice(0, 3).map((alert) => (
          <Card
            key={alert.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:scale-105 border-l-4 shadow-lg",
              alert.priority === "critical"
                ? "border-l-emergency animate-pulse"
                : "border-l-warning",
            )}
            onClick={() => handleAlertClick(alert)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      alert.priority === "critical"
                        ? "text-emergency"
                        : "text-warning",
                    )}
                  />
                  <Badge className={priorityColors[alert.priority]} size="sm">
                    {alert.priority.toUpperCase()}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {getTimeAgo(alert.createdAt)}
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">{alert.senderName}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {alert.message}
                </p>
              </div>
              {alert.location && (
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickNavigate(alert);
                    }}
                    className="h-6 text-xs bg-safe hover:bg-safe/90"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Navigate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {activeAlerts.length > 3 && (
          <Card
            className="cursor-pointer"
            onClick={() => {
              /* Show all alerts */
            }}
          >
            <CardContent className="p-2 text-center">
              <p className="text-xs text-muted-foreground">
                +{activeAlerts.length - 3} more alerts
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Notification Panel */}
      <SlidingPanel
        title="Emergency Alert"
        isOpen={isNotificationPanelOpen}
        onClose={handleCloseNotification}
        direction="bottom"
        size="lg"
      >
        {selectedAlert && (
          <SOSNotificationPanel
            alert={selectedAlert}
            onClose={handleCloseNotification}
          />
        )}
      </SlidingPanel>
    </PanelContainer>
  );
}
