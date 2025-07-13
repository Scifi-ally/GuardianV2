import { notificationManager } from "@/components/SlideDownNotifications";

export interface NotificationOptions {
  title: string;
  message: string;
  type?: "success" | "warning" | "error" | "info" | "sos" | "critical";
  priority?: "low" | "medium" | "high" | "critical";
  persistent?: boolean;
  soundAlert?: boolean;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;

  static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  // Main notification method
  notify(options: NotificationOptions): string {
    return notificationManager.addNotification({
      title: options.title,
      message: options.message,
      type: options.type || "info",
      priority: options.priority || "medium",
      persistent: options.persistent || false,
      soundAlert: options.soundAlert,
      action: options.action,
      secondaryAction: options.secondaryAction,
      location: options.location,
    });
  }

  // Convenience methods that match Sonner API
  success(message: string, options?: Partial<NotificationOptions>): string {
    return this.notify({
      title: "Success",
      message,
      type: "success",
      ...options,
    });
  }

  error(message: string, options?: Partial<NotificationOptions>): string {
    return this.notify({
      title: "Error",
      message,
      type: "error",
      priority: "high",
      ...options,
    });
  }

  warning(message: string, options?: Partial<NotificationOptions>): string {
    return this.notify({
      title: "Warning",
      message,
      type: "warning",
      ...options,
    });
  }

  info(message: string, options?: Partial<NotificationOptions>): string {
    return this.notify({
      title: "Info",
      message,
      type: "info",
      ...options,
    });
  }

  // SOS and critical notifications
  sos(
    options: NotificationOptions & {
      location?: { latitude: number; longitude: number; address?: string };
    },
  ): string {
    return this.notify({
      ...options,
      type: "sos",
      priority: "critical",
      persistent: true,
      soundAlert: true,
    });
  }

  critical(message: string, options?: Partial<NotificationOptions>): string {
    return this.notify({
      title: "Critical Alert",
      message,
      type: "critical",
      priority: "critical",
      persistent: true,
      soundAlert: true,
      ...options,
    });
  }

  // Remove notification
  dismiss(id: string): void {
    notificationManager.removeNotification(id);
  }

  // Clear all notifications
  dismissAll(): void {
    notificationManager.clearAll();
  }

  // Location-based notifications
  locationUpdate(
    location: { latitude: number; longitude: number; address?: string },
    message?: string,
  ): string {
    return this.notify({
      title: "Location Updated",
      message: message || "Your location has been updated",
      type: "info",
      location,
      action: {
        label: "Copy",
        onClick: () => {
          const text =
            location.address ||
            `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
          navigator.clipboard?.writeText(text);
        },
      },
    });
  }

  // Emergency notifications with navigation
  emergency(
    options: NotificationOptions & {
      location: { latitude: number; longitude: number; address?: string };
    },
  ): string {
    return this.notify({
      ...options,
      type: "sos",
      priority: "critical",
      persistent: true,
      soundAlert: true,
      action: options.action || {
        label: "Navigate",
        onClick: () => {
          const url = `https://maps.google.com/?q=${options.location.latitude},${options.location.longitude}`;
          window.open(url, "_blank");
        },
      },
      secondaryAction: options.secondaryAction || {
        label: "Copy Location",
        onClick: () => {
          const text =
            options.location.address ||
            `${options.location.latitude.toFixed(6)}, ${options.location.longitude.toFixed(6)}`;
          navigator.clipboard?.writeText(text);
        },
      },
    });
  }

  // Battery warning
  batteryWarning(level: number): string {
    const isCritical = level < 15;
    return this.notify({
      title: isCritical ? "Critical Battery Level" : "Low Battery",
      message: `Battery level: ${level}%. ${isCritical ? "Device may shut down soon!" : "Consider charging soon."}`,
      type: isCritical ? "critical" : "warning",
      priority: isCritical ? "critical" : "medium",
      soundAlert: isCritical,
      action: {
        label: "Acknowledge",
        onClick: () => {
          // Handle battery warning acknowledgment
        },
      },
    });
  }

  // Connection status
  connectionStatus(isOnline: boolean): string {
    return this.notify({
      title: isOnline ? "Connection Restored" : "Connection Lost",
      message: isOnline
        ? "Your internet connection has been restored"
        : "No internet connection. Some features may not work.",
      type: isOnline ? "success" : "warning",
      priority: isOnline ? "low" : "medium",
    });
  }

  // Safety score updates
  safetyScoreUpdate(score: number, location?: string): string {
    const isLow = score < 30;
    return this.notify({
      title: isLow ? "Safety Alert" : "Safety Update",
      message: `Safety score: ${score}% ${location ? `at ${location}` : ""}. ${isLow ? "Consider avoiding this area." : ""}`,
      type: isLow ? "warning" : "info",
      priority: isLow ? "high" : "low",
    });
  }
}

// Export singleton instance
export const unifiedNotifications = UnifiedNotificationService.getInstance();

// Export types
export type { NotificationOptions };
