import { notifications } from "@/services/enhancedNotificationService";

export interface NotificationOptions {
  title: string;
  message: string;
  type?: "success" | "warning" | "error" | "sos" | "critical";
  priority?: "low" | "medium" | "high" | "critical";
  persistent?: boolean;
  duration?: number;
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
    const notificationType = options.type || "info";

    switch (notificationType) {
      case "success":
        return notifications
          .success({
            title: options.title,
            description: options.message,
            duration: options.duration,
            vibrate: true,
          })
          .toString();
      case "error":
        return notifications
          .error({
            title: options.title,
            description: options.message,
            duration: options.duration,
            vibrate: true,
          })
          .toString();
      case "warning":
        return notifications
          .warning({
            title: options.title,
            description: options.message,
            duration: options.duration,
            vibrate: true,
          })
          .toString();
      case "sos":
      case "critical":
        return notifications
          .emergency({
            title: options.title,
            description: options.message,
          })
          .toString();
      default:
        return notifications
          .warning({
            title: options.title,
            description: options.message,
            duration: options.duration,
            vibrate: true,
          })
          .toString();
    }
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
    });
  }

  critical(message: string, options?: Partial<NotificationOptions>): string {
    return this.notify({
      title: "Critical Alert",
      message,
      type: "critical",
      priority: "critical",
      persistent: true,
      ...options,
    });
  }

  // Remove notification
  dismiss(id: string): void {
    notifications.dismiss(id);
  }

  // Clear all notifications
  dismissAll(): void {
    notifications.dismissAll();
  }

  // Location-based notifications
  locationUpdate(
    location: { latitude: number; longitude: number; address?: string },
    message?: string,
  ): string {
    return this.notify({
      title: "Location Updated",
      message: message || "Your location has been updated",
      type: "success",
      location,
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
      type: isLow ? "warning" : "success",
      priority: isLow ? "high" : "low",
    });
  }
}

// Export singleton instance
export const unifiedNotifications = UnifiedNotificationService.getInstance();

// Export types
export type { NotificationOptions };
