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

  private triggerVibration(pattern: number | number[] = 200) {
    if (this.isVibrationSupported) {
      navigator.vibrate(pattern);
    }
  }

  // Success notifications
  success(options: NotificationOptions) {
    if (options.vibrate) {
      this.triggerVibration([100, 50, 100]);
    }

    return toast.success(options.title, {
      description: options.description,
      duration: options.duration || 4000,
    });
  }

  // Error notifications
  error(options: NotificationOptions) {
    if (options.vibrate) {
      this.triggerVibration([200, 100, 200]);
    }

    return toast.error(options.title, {
      description: options.description,
      duration: options.duration || 6000,
    });
  }

  // Warning notifications
  warning(options: NotificationOptions) {
    if (options.vibrate) {
      this.triggerVibration([150, 75, 150]);
    }

    return toast.warning(options.title, {
      description: options.description,
      duration: options.duration || 5000,
    });
  }

  // Info notifications
  info(options: NotificationOptions) {
    if (options.vibrate) {
      this.triggerVibration(100);
    }

    return toast.info(options.title, {
      description: options.description,
      duration: options.duration || 4000,
    });
  }

  // Emergency notifications with enhanced features
  emergency(options: EmergencyNotificationOptions) {
    if (options.vibrate !== false) {
      // Strong emergency vibration pattern
      this.triggerVibration([500, 200, 500, 200, 500]);
    }

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
    const result = await toast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    });

    if (options.vibrate) {
      this.triggerVibration(100);
    }

    return result;
  }

  // Dismiss notifications
  dismiss(toastId?: string | number) {
    toast.dismiss(toastId);
  }

  dismissAll() {
    toast.dismissAll();
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
