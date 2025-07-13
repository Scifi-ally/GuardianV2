import { toast } from "@/components/ui/enhanced-toast";

export interface NotificationOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  vibrate?: boolean;
  sound?: boolean;
}

export interface EmergencyNotificationOptions {
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  vibrate?: boolean;
  sound?: boolean;
  persistent?: boolean;
}

class EnhancedNotificationService {
  private isVibrationSupported = "vibrate" in navigator;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio() {
    try {
      if (
        typeof window !== "undefined" &&
        (window.AudioContext || (window as any).webkitAudioContext)
      ) {
        this.audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        // Resume audio context if it's suspended (required for autoplay policies)
        if (this.audioContext.state === "suspended") {
          this.audioContext.resume().catch(() => {
            // Silently handle if resume fails
          });
        }
      }
    } catch (error) {
      // Silently handle audio context creation errors
      this.audioContext = null;
    }
  }

  private async playNotificationSound(
    type: "success" | "error" | "warning" | "info" | "emergency" = "info",
  ) {
    if (!this.audioContext) return;

    // Resume audio context if it's suspended (required after user interaction)
    if (this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
      } catch {
        return; // Exit silently if can't resume
      }
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different frequencies for different notification types
      const frequencies = {
        success: 523.25, // C5
        info: 440, // A4
        warning: 369.99, // F#4
        error: 261.63, // C4
        emergency: 185, // F#3 (lower, more urgent)
      };

      oscillator.frequency.setValueAtTime(
        frequencies[type],
        this.audioContext.currentTime,
      );
      oscillator.type = type === "emergency" ? "sawtooth" : "sine";

      // Volume and timing based on type
      const volume = type === "emergency" ? 0.3 : 0.1;
      const duration = type === "emergency" ? 0.5 : 0.2;

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.01,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration,
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      // For emergency, play multiple beeps
      if (type === "emergency") {
        setTimeout(() => this.playNotificationSound("emergency"), 600);
      }
    } catch (error) {
      // Silently handle sound playback errors
    }
  }

  private triggerVibration(pattern: number | number[] = 200) {
    if (this.isVibrationSupported) {
      navigator.vibrate(pattern);
    }
  }

  // Success notifications
  success(options: NotificationOptions) {
    if (options.sound !== false) {
      this.playNotificationSound("success").catch(() => {
        // Silently handle sound failure
      });
    }
    if (options.vibrate) {
      this.triggerVibration([100, 50, 100]);
    }

    return toast.success(options.title, {
      description: options.description,
      duration: options.duration || 4000,
      action: options.action,
    });
  }

  // Error notifications
  error(options: NotificationOptions) {
    if (options.sound !== false) {
      this.playNotificationSound("error").catch(() => {
        // Silently handle sound failure
      });
    }
    if (options.vibrate) {
      this.triggerVibration([200, 100, 200]);
    }

    return toast.error(options.title, {
      description: options.description,
      duration: options.duration || 6000,
      action: options.action,
    });
  }

  // Warning notifications
  warning(options: NotificationOptions) {
    if (options.sound !== false) {
      this.playNotificationSound("warning").catch(() => {
        // Silently handle sound failure
      });
    }
    if (options.vibrate) {
      this.triggerVibration([150, 75, 150]);
    }

    return toast.warning(options.title, {
      description: options.description,
      duration: options.duration || 5000,
      action: options.action,
    });
  }

  // Info notifications
  info(options: NotificationOptions) {
    if (options.sound !== false) {
      this.playNotificationSound("info").catch(() => {
        // Silently handle sound failure
      });
    }
    if (options.vibrate) {
      this.triggerVibration(100);
    }

    return toast.info(options.title, {
      description: options.description,
      duration: options.duration || 4000,
      action: options.action,
    });
  }

  // Emergency notifications with enhanced features
  emergency(options: EmergencyNotificationOptions) {
    if (options.sound !== false) {
      this.playNotificationSound("emergency").catch(() => {
        // Silently handle sound failure
      });
    }
    if (options.vibrate !== false) {
      // Strong emergency vibration pattern
      this.triggerVibration([500, 200, 500, 200, 500]);
    }

    return toast.emergency(options.title, {
      description: options.description,
      primaryAction: options.primaryAction,
      secondaryAction: options.secondaryAction,
    });
  }

  // Location sharing notification with specific actions
  locationShared(
    contactCount: number,
    actions?: { viewMap?: () => void; copyLink?: () => void },
  ) {
    return this.success({
      title: "Location Shared",
      description: `Shared with ${contactCount} emergency contact${contactCount > 1 ? "s" : ""}`,
      action: actions?.viewMap
        ? {
            label: "View Map",
            onClick: actions.viewMap,
          }
        : undefined,
      vibrate: true,
    });
  }

  // SOS Alert notification
  sosAlert(actions: { call911?: () => void; cancelSOS?: () => void }) {
    return this.emergency({
      title: "SOS Alert Activated",
      description: "Emergency services will be contacted in 10 seconds",
      primaryAction: actions.call911
        ? {
            label: "Call 911 Now",
            onClick: actions.call911,
          }
        : undefined,
      secondaryAction: actions.cancelSOS
        ? {
            label: "Cancel SOS",
            onClick: actions.cancelSOS,
          }
        : undefined,
      vibrate: true,
    });
  }

  // Safe arrival notification
  safeArrival(location: string, actions?: { shareStatus?: () => void }) {
    return this.success({
      title: "Safe Arrival",
      description: `You've safely arrived at ${location}`,
      action: actions?.shareStatus
        ? {
            label: "Share Status",
            onClick: actions.shareStatus,
          }
        : undefined,
      vibrate: true,
    });
  }

  // Route safety notification
  routeSafety(
    safetyLevel: "safe" | "caution" | "avoid",
    actions?: { findAlternate?: () => void },
  ) {
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
      action: actions?.findAlternate
        ? {
            label: "Find Alternative",
            onClick: actions.findAlternate,
          }
        : undefined,
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
      successAction?: { label: string; onClick: () => void };
      vibrate?: boolean;
    },
  ) {
    const result = await toast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
      action: options.successAction,
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
  info: showInfo,
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
