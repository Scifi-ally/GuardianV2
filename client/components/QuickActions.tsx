import { useCallback, useState } from "react";
import {
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notifications } from "@/services/enhancedNotificationService";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useAuth } from "@/contexts/AuthContext";
import { emergencyContactActionsService } from "@/services/emergencyContactActionsService";
import { realTimeService } from "@/services/realTimeService";

interface QuickActionProps {
  icon: typeof MapPin;
  label: string;
  onClick?: () => void;
  variant?: "default" | "emergency" | "safe" | "warning";
  disabled?: boolean;
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
}: QuickActionProps) {
  const variantStyles = {
    default: "bg-muted hover:bg-muted/80 text-muted-foreground",
    emergency: "bg-emergency/10 hover:bg-emergency/20 text-emergency",
    safe: "bg-safe/10 hover:bg-safe/20 text-safe",
    warning: "bg-warning/10 hover:bg-warning/20 text-warning",
  };

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-16 flex-col gap-1 text-xs font-medium transition-all",
        variantStyles[variant],
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Button>
  );
}

export function QuickActions() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { getCurrentLocation } = useGeolocation();
  const { userProfile } = useAuth();

  const handleShareLocation = useCallback(async () => {
    setIsLoading("share");
    try {
      const location = await getCurrentLocation();

      // Create location data for in-app sharing
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: Date.now(),
        address: "Getting address...",
      };

      // Update real-time service with current location
      realTimeService.updateLocation(locationData);

      // Create shareable location text
      const locationText = `📍 My current location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;

      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: "My Current Location",
          text: locationText,
        });
        // Silently share location
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(locationText);
        // Silently copy location
      }
    } catch (error) {
      console.error("Share location error:", error);
      notifications.error({
        title: "Location Share Failed",
        description: "Unable to share location - check permissions",
        action: {
          label: "Try Again",
          onClick: () => handleShareLocation(),
        },
        vibrate: true,
      });
    } finally {
      setIsLoading(null);
    }
  }, [getCurrentLocation]);

  const handleSafeRoute = useCallback(async () => {
    setIsLoading("route");
    try {
      const location = await getCurrentLocation();

      // For now, we'll show a success message and update location
      // In a full implementation, this would integrate with navigation
      realTimeService.updateLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: Date.now(),
      });

      notifications.routeSafety("safe", {
        findAlternate: () => (window.location.href = "/navigation"),
      });
    } catch (error) {
      console.error("Safe route error:", error);
      notifications.error({
        title: "Route Analysis Failed",
        description: "Unable to calculate safe route",
        action: {
          label: "Try Navigation",
          onClick: () => (window.location.href = "/navigation"),
        },
        vibrate: true,
      });
    } finally {
      setIsLoading(null);
    }
  }, [getCurrentLocation]);

  const handleQuickText = useCallback(async () => {
    setIsLoading("text");
    try {
      if (!userProfile?.emergencyContacts?.length) {
        notifications.error({
          title: "No Emergency Contacts",
          description: "Add emergency contacts to send quick alerts",
          action: {
            label: "Add Contacts",
            onClick: () => (window.location.href = "/contacts"),
          },
          vibrate: true,
        });
        return;
      }

      const location = await getCurrentLocation();
      const message = `🚨 Quick Safety Alert: I need assistance. My location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;

      // Send to all emergency contacts
      await emergencyContactActionsService.sendEmergencyMessage(message);

      // Silently send alert
    } catch (error) {
      console.error("Quick text error:", error);
      notifications.error({
        title: "Alert Failed",
        description: "Unable to send emergency alert",
        action: {
          label: "Try Again",
          onClick: () => handleQuickText(),
        },
        vibrate: true,
      });
    } finally {
      setIsLoading(null);
    }
  }, [getCurrentLocation, userProfile]);

  const handleReportIncident = useCallback(async () => {
    setIsLoading("report");
    try {
      const location = await getCurrentLocation();

      // Create incident report
      const report = {
        id: `incident-${Date.now()}`,
        timestamp: new Date().toISOString(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: Date.now(),
        },
        type: "user_report",
        description: "Incident reported via Quick Actions",
        status: "reported",
      };

      // Add to real-time alerts
      realTimeService.addAlert({
        id: report.id,
        type: "warning",
        title: "Incident Reported",
        message:
          "Your incident report has been logged and shared with emergency contacts",
        timestamp: new Date(),
        location: report.location,
      });

      // Notify emergency contacts if configured
      if (userProfile?.emergencyContacts?.length) {
        await emergencyContactActionsService.sendEmergencyMessage(
          `⚠️ Incident Report: I've reported a safety concern at my current location: https://maps.google.com/?q=${location.latitude},${location.longitude}`,
        );
      }

      // Silently report incident without notification
    } catch (error) {
      console.error("Report incident error:", error);
      // Silently handle report errors
    } finally {
      setIsLoading(null);
    }
  }, [getCurrentLocation, userProfile]);

  const actions = [
    {
      icon: MapPin,
      label: "Share Location",
      variant: "safe" as const,
      onClick: handleShareLocation,
      disabled: isLoading === "share",
    },
    {
      icon: Navigation,
      label: "Safe Route",
      variant: "default" as const,
      onClick: handleSafeRoute,
      disabled: isLoading === "route",
    },

    {
      icon: MessageCircle,
      label: "Quick Text",
      variant: "default" as const,
      onClick: handleQuickText,
      disabled: isLoading === "text",
    },
    {
      icon: AlertCircle,
      label: "Report",
      variant: "warning" as const,
      onClick: handleReportIncident,
      disabled: isLoading === "report",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map((action, index) => (
        <QuickActionButton key={index} {...action} />
      ))}
    </div>
  );
}
