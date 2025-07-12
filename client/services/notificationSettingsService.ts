interface NotificationSettings {
  locationSharing: boolean;
  sosAlerts: boolean;
  safetyUpdates: boolean;
  emergencyContacts: boolean;
  routeUpdates: boolean;
  systemNotifications: boolean;
}

class NotificationSettingsService {
  private settings: NotificationSettings;
  private readonly STORAGE_KEY = "notification_settings";

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): NotificationSettings {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          locationSharing: false, // Default to OFF for location sharing
          sosAlerts: true,
          safetyUpdates: false, // Default to OFF for safety updates
          emergencyContacts: true,
          routeUpdates: false, // Default to OFF for route updates
          systemNotifications: true,
          ...parsed,
        };
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }

    return {
      locationSharing: false,
      sosAlerts: true,
      safetyUpdates: false,
      emergencyContacts: true,
      routeUpdates: false,
      systemNotifications: true,
    };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public updateSetting<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ): void {
    this.settings[key] = value;
    this.saveSettings();
  }

  public updateSettings(updates: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  // Specific methods for common operations
  public disableLocationSharingNotifications(): void {
    this.updateSetting("locationSharing", false);
  }

  public enableLocationSharingNotifications(): void {
    this.updateSetting("locationSharing", true);
  }

  public disableSafetyUpdates(): void {
    this.updateSetting("safetyUpdates", false);
  }

  public enableSafetyUpdates(): void {
    this.updateSetting("safetyUpdates", true);
  }

  public disableRouteUpdates(): void {
    this.updateSetting("routeUpdates", false);
  }

  public enableRouteUpdates(): void {
    this.updateSetting("routeUpdates", true);
  }

  // Check if a specific notification type should be shown
  public shouldShowNotification(type: keyof NotificationSettings): boolean {
    return this.settings[type];
  }

  // Reset to defaults
  public resetToDefaults(): void {
    this.settings = {
      locationSharing: false,
      sosAlerts: true,
      safetyUpdates: false,
      emergencyContacts: true,
      routeUpdates: false,
      systemNotifications: true,
    };
    this.saveSettings();
  }

  // Get human-readable labels
  public getSettingLabel(key: keyof NotificationSettings): string {
    const labels = {
      locationSharing: "Location Sharing Notifications",
      sosAlerts: "SOS Emergency Alerts",
      safetyUpdates: "Safety Score Updates",
      emergencyContacts: "Emergency Contact Notifications",
      routeUpdates: "Route & Navigation Updates",
      systemNotifications: "System Notifications",
    };
    return labels[key];
  }

  public getSettingDescription(key: keyof NotificationSettings): string {
    const descriptions = {
      locationSharing:
        "Notifications when starting or stopping location sharing",
      sosAlerts: "Critical emergency alerts and SOS notifications",
      safetyUpdates: "Real-time safety score changes and area warnings",
      emergencyContacts: "Notifications from emergency contacts",
      routeUpdates: "Navigation instructions and route changes",
      systemNotifications: "App updates and system messages",
    };
    return descriptions[key];
  }
}

// Create singleton instance
export const notificationSettingsService = new NotificationSettingsService();

// Helper function to check if notifications should be shown
export function shouldShowNotification(
  type: keyof NotificationSettings,
): boolean {
  return notificationSettingsService.shouldShowNotification(type);
}

// Convenience functions
export function disableLocationNotifications(): void {
  notificationSettingsService.disableLocationSharingNotifications();
}

export function disableSafetyNotifications(): void {
  notificationSettingsService.disableSafetyUpdates();
}

export function disableRouteNotifications(): void {
  notificationSettingsService.disableRouteUpdates();
}

export default notificationSettingsService;
