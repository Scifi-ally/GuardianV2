import { toast } from "@/components/ui/enhanced-toast";

export interface NotificationOptions {
  title: string;
  description?: string;
  duration?: number;
  vibrate?: boolean;
}

export interface EmergencyNotificationOptions {
  title: string;
  description?: string;
  vibrate?: boolean;
  persistent?: boolean;
}

class EnhancedNotificationService {
  private isVibrationSupported = "vibrate" in navigator;
  private activeToasts = new Set<string>();
  private toastTimeouts = new Map<string, NodeJS.Timeout>();

  private triggerVibration(pattern: number | number[] = 200) {
    if (this.isVibrationSupported) {
      navigator.vibrate(pattern);
    }
  }

  private generateToastKey(title: string, type: string): string {
    return `${type}:${title}`;
  }

  private canShowToast(title: string, type: string): boolean {
    const key = this.generateToastKey(title, type);
    return !this.activeToasts.has(key);
  }

  private markToastActive(
    title: string,
    type: string,
    duration: number = 4000,
  ) {
    const key = this.generateToastKey(title, type);
    this.activeToasts.add(key);

    // Clear any existing timeout for this key
    if (this.toastTimeouts.has(key)) {
      clearTimeout(this.toastTimeouts.get(key)!);
    }

    // Set timeout to remove from active set
    const timeout = setTimeout(() => {
      this.activeToasts.delete(key);
      this.toastTimeouts.delete(key);
    }, duration);

    this.toastTimeouts.set(key, timeout);
  }

  // Success notifications
  success(options: NotificationOptions) {
    if (!this.canShowToast(options.title, "success")) {
      return null;
    }

    if (options.vibrate) {
      this.triggerVibration([100, 50, 100]);
    }

    this.markToastActive(options.title, "success", options.duration);
    // Success notification silently
    return null;
  }

  // Error notifications
  error(options: NotificationOptions) {
    if (!this.canShowToast(options.title, "error")) {
      return null;
    }

    if (options.vibrate) {
      this.triggerVibration([200, 100, 200]);
    }

    this.markToastActive(options.title, "error", options.duration);
    // Error notification silently
    return null;
  }

  // Warning notifications
  warning(options: NotificationOptions) {
    if (!this.canShowToast(options.title, "warning")) {
      return null;
    }

    if (options.vibrate) {
      this.triggerVibration([150, 75, 150]);
    }

    this.markToastActive(options.title, "warning", options.duration);
    // Warning notification silently
    return null;
  }

  // Info notifications
  info(options: NotificationOptions) {
    if (!this.canShowToast(options.title, "info")) {
      return null;
    }

    if (options.vibrate) {
      this.triggerVibration(100);
    }

    this.markToastActive(options.title, "info", options.duration);
    // Info notification silently
    return null;
  }

  // Emergency notifications with enhanced features
  emergency(options: EmergencyNotificationOptions) {
    // Always allow emergency notifications (don't deduplicate)
    if (options.vibrate !== false) {
      // Strong emergency vibration pattern
      this.triggerVibration([500, 200, 500, 200, 500]);
    }

    // Emergency notification preserved for SOS
    return toast.emergency(options.title, {
      description: options.description,
    });
  }

  // Location sharing notification
  locationShared(contactCount: number) {
    return this.success({
      title: "Location Shared",
      description: `Shared with ${contactCount} emergency contact${contactCount > 1 ? "s" : ""}`,
      vibrate: true,
    });
  }

  // SOS Alert notification
  sosAlert() {
    return this.emergency({
      title: "SOS Alert Activated",
      description: "Emergency services will be contacted in 10 seconds",
      vibrate: true,
    });
  }

  // Safe arrival notification
  safeArrival(location: string) {
    return this.success({
      title: "Safe Arrival",
      description: `You've safely arrived at ${location}`,
      vibrate: true,
    });
  }

  // Route safety notification
  routeSafety(safetyLevel: "safe" | "caution" | "avoid") {
    const config = {
      safe: {
        type: "success" as const,
        title: "Safe Route",
        description: "This route appears safe based on current conditions",
        vibrate: false,
      },
      caution: {
        type: "warning" as const,
        title: "Exercise Caution",
        description: "This route has some safety concerns",
        vibrate: true,
      },
      avoid: {
        type: "error" as const,
        title: "Route Not Recommended",
        description: "Consider an alternative route for safety",
        vibrate: true,
      },
    };

    const notification = config[safetyLevel];

    return this[notification.type]({
      title: notification.title,
      description: notification.description,
      vibrate: notification.vibrate,
    });
  }

  // Connection status notification
  connectionStatus(isOnline: boolean) {
    if (isOnline) {
      return this.success({
        title: "Connection Restored",
        description: "You're back online. Safety features are fully available.",
        duration: 3000,
        vibrate: true,
      });
    } else {
      return this.warning({
        title: "Connection Lost",
        description: "Operating in offline mode. Some features may be limited.",
        duration: 6000,
        vibrate: true,
      });
    }
  }

  // Promise-based notifications for async operations
  async promise<T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
      vibrate?: boolean;
    },
  ) {
    // Promise toast silently
    const result = await promise;

    if (options.vibrate) {
      this.triggerVibration(100);
    }

    return result;
  }

  // Dismiss notifications
  dismiss(toastId?: string | number) {
    // Dismiss silently
  }

  dismissAll() {
    // Dismiss all silently
  }
}

// Create singleton instance
export const notifications = new EnhancedNotificationService();

// Export convenience methods
export const {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  emergency: showEmergency,
  locationShared: showLocationShared,
  sosAlert: showSOSAlert,
  safeArrival: showSafeArrival,
  routeSafety: showRouteSafety,
  connectionStatus: showConnectionStatus,
  promise: showPromise,
  dismiss: dismissNotification,
  dismissAll: dismissAllNotifications,
} = notifications;
