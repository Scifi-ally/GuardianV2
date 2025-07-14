import { emergencyErrorHandler } from "./emergencyErrorHandler";
import { unifiedNotifications } from "./unifiedNotificationService";

interface OfflineEmergencyData {
  lastLocation: {
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy: number;
  } | null;
  emergencyContacts: Array<{
    id: string;
    name: string;
    phone: string;
  }>;
  userProfile: {
    name: string;
    id: string;
  } | null;
  emergencyMessage: string;
  isActive: boolean;
}

class OfflineEmergencyService {
  private isOnline = navigator.onLine;
  private offlineData: OfflineEmergencyData = {
    lastLocation: null,
    emergencyContacts: [],
    userProfile: null,
    emergencyMessage:
      "🚨 EMERGENCY - I need immediate assistance. This is an automated emergency message.",
    isActive: false,
  };

  constructor() {
    this.initializeOfflineMode();
    this.setupConnectivityListeners();
  }

  private initializeOfflineMode() {
    // Load offline data from storage
    this.loadOfflineData();

    // Update location periodically when online
    if (this.isOnline) {
      this.updateLocationData();
    }
  }

  private setupConnectivityListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      console.log("🌐 Connectivity restored");
      this.handleConnectivityRestored();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("🔴 Offline mode activated");
      this.handleOfflineMode();
    });

    // Listen for emergency events
    window.addEventListener("enableOfflineEmergencyMode", () => {
      this.activateOfflineEmergencyMode();
    });

    window.addEventListener("emergencyLocationFallback", (event: any) => {
      this.updateLocationFallback(event.detail);
    });
  }

  private loadOfflineData() {
    try {
      // Load last known location
      const savedLocation = localStorage.getItem("lastKnownLocation");
      if (savedLocation) {
        this.offlineData.lastLocation = JSON.parse(savedLocation);
      }

      // Load emergency contacts
      const savedContacts = localStorage.getItem("emergencyContacts");
      if (savedContacts) {
        this.offlineData.emergencyContacts = JSON.parse(savedContacts);
      }

      // Load user profile
      const savedProfile = localStorage.getItem("userProfile");
      if (savedProfile) {
        this.offlineData.userProfile = JSON.parse(savedProfile);
      }

      console.log("📦 Offline emergency data loaded");
    } catch (error) {
      console.error("Failed to load offline emergency data:", error);
    }
  }

  private saveOfflineData() {
    try {
      if (this.offlineData.lastLocation) {
        localStorage.setItem(
          "lastKnownLocation",
          JSON.stringify(this.offlineData.lastLocation),
        );
      }

      localStorage.setItem(
        "emergencyContacts",
        JSON.stringify(this.offlineData.emergencyContacts),
      );

      if (this.offlineData.userProfile) {
        localStorage.setItem(
          "userProfile",
          JSON.stringify(this.offlineData.userProfile),
        );
      }
    } catch (error) {
      console.error("Failed to save offline emergency data:", error);
    }
  }

  private updateLocationData() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.offlineData.lastLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
        };
        this.saveOfflineData();
      },
      (error) => {
        console.warn("Failed to update location for offline mode:", error);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    );
  }

  private handleOfflineMode() {
    this.activateOfflineEmergencyMode();

    emergencyErrorHandler.handleEmergencyError({
      type: "connectivity",
      severity: "critical",
      message: "Device is offline. Emergency features running in offline mode.",
      context: "offline_mode_activated",
    });
  }

  private handleConnectivityRestored() {
    unifiedNotifications.success("🌐 Connectivity Restored", {
      message: "All emergency features are now fully operational.",
    });

    // Update location data
    this.updateLocationData();

    // Sync any pending emergency data
    this.syncPendingEmergencyData();
  }

  public activateOfflineEmergencyMode() {
    this.offlineData.isActive = true;
    document.body.classList.add("offline-emergency-mode");

    unifiedNotifications.error("🔴 OFFLINE EMERGENCY MODE", {
      message: "Emergency features available: Call, SMS, Location Share",
      persistent: true,
    });

    // Show offline emergency controls
    this.showOfflineEmergencyControls();
  }

  private showOfflineEmergencyControls() {
    // Create emergency control panel
    const existingPanel = document.getElementById("offline-emergency-panel");
    if (existingPanel) {
      existingPanel.remove();
    }

    const panel = document.createElement("div");
    panel.id = "offline-emergency-panel";
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      z-index: 10000;
      background: #dc2626;
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      font-family: monospace;
      font-size: 14px;
    `;

    panel.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 8px; font-weight: bold;">
          🔴 OFFLINE EMERGENCY MODE
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  style="margin-left: auto; background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
            ✕
          </button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
          <button onclick="window.open('tel:911', '_self')" 
                  style="background: #ef4444; border: none; color: white; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">
            📞 CALL 911
          </button>
          <button onclick="offlineEmergencyService.sendEmergencySMS()" 
                  style="background: #f59e0b; border: none; color: white; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">
            📱 SOS SMS
          </button>
          <button onclick="offlineEmergencyService.shareLocation()" 
                  style="background: #10b981; border: none; color: white; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">
            📍 LOCATION
          </button>
          <button onclick="offlineEmergencyService.activateAlarm()" 
                  style="background: #8b5cf6; border: none; color: white; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">
            🔊 ALARM
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Make service available globally for button clicks
    (window as any).offlineEmergencyService = this;
  }

  public sendEmergencySMS() {
    if (this.offlineData.emergencyContacts.length === 0) {
      unifiedNotifications.warning("No Emergency Contacts", {
        message: "Please add emergency contacts in settings first.",
      });
      return;
    }

    const message = this.buildEmergencyMessage();

    this.offlineData.emergencyContacts.forEach((contact) => {
      if (contact.phone) {
        const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
        window.open(smsUrl, "_blank");
      }
    });

    unifiedNotifications.success("📱 Emergency SMS Sent", {
      message: `Messages sent to ${this.offlineData.emergencyContacts.length} contacts`,
    });
  }

  public shareLocation() {
    if (!this.offlineData.lastLocation) {
      unifiedNotifications.warning("No Location Available", {
        message: "Unable to determine current location.",
      });
      return;
    }

    const { latitude, longitude } = this.offlineData.lastLocation;
    const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const message = `🚨 EMERGENCY LOCATION: ${mapsUrl} - Sent at ${new Date().toLocaleString()}`;

    // Copy to clipboard
    navigator.clipboard?.writeText(message).then(() => {
      unifiedNotifications.success("📍 Location Copied", {
        message: "Emergency location copied to clipboard",
      });
    });

    // Open SMS with location
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, "_blank");
  }

  public activateAlarm() {
    try {
      // Try to play emergency sound
      const audio = new Audio();
      audio.src =
        "data:audio/wav;base64,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";
      audio.volume = 0.8;
      audio.loop = true;

      audio
        .play()
        .then(() => {
          unifiedNotifications.success("🔊 Emergency Alarm Activated", {
            message: "Tap to stop alarm",
          });

          // Auto stop after 30 seconds
          setTimeout(() => {
            audio.pause();
          }, 30000);
        })
        .catch(() => {
          // Fallback to vibration
          this.activateVibrationAlarm();
        });
    } catch (e) {
      this.activateVibrationAlarm();
    }
  }

  private activateVibrationAlarm() {
    if (navigator.vibrate) {
      // Continuous vibration pattern for emergency
      const pattern = [200, 100, 200, 100, 200, 100, 200, 300];

      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          navigator.vibrate(pattern);
        }, i * 1000);
      }

      unifiedNotifications.success("📳 Emergency Vibration Active", {
        message: "Device vibrating for emergency alert",
      });
    }
  }

  private buildEmergencyMessage(): string {
    let message = this.offlineData.emergencyMessage;

    if (this.offlineData.userProfile?.name) {
      message = `🚨 EMERGENCY - ${this.offlineData.userProfile.name} needs immediate assistance.`;
    }

    if (this.offlineData.lastLocation) {
      const { latitude, longitude } = this.offlineData.lastLocation;
      const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      message += ` Location: ${mapsUrl}`;
    }

    message += ` - Sent: ${new Date().toLocaleString()}`;

    return message;
  }

  private syncPendingEmergencyData() {
    // Sync any emergency data that was collected while offline
    try {
      const pendingData = localStorage.getItem("pendingEmergencyData");
      if (pendingData) {
        const data = JSON.parse(pendingData);
        console.log("Syncing pending emergency data:", data);

        // Send pending data to server when connectivity is restored
        // This would typically involve API calls to sync emergency events

        localStorage.removeItem("pendingEmergencyData");
      }
    } catch (error) {
      console.error("Failed to sync pending emergency data:", error);
    }
  }

  public updateLocationFallback(locationData: any) {
    this.offlineData.lastLocation = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      timestamp: Date.now(),
      accuracy: locationData.accuracy || 10000,
    };
    this.saveOfflineData();
  }

  public updateEmergencyContacts(contacts: any[]) {
    this.offlineData.emergencyContacts = contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
    }));
    this.saveOfflineData();
  }

  public updateUserProfile(profile: any) {
    this.offlineData.userProfile = {
      name: profile.displayName || profile.name,
      id: profile.uid || profile.id,
    };
    this.saveOfflineData();
  }

  public getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      isActive: this.offlineData.isActive,
      hasLocation: !!this.offlineData.lastLocation,
      hasContacts: this.offlineData.emergencyContacts.length > 0,
      hasProfile: !!this.offlineData.userProfile,
    };
  }

  public deactivateOfflineMode() {
    this.offlineData.isActive = false;
    document.body.classList.remove("offline-emergency-mode");

    const panel = document.getElementById("offline-emergency-panel");
    if (panel) {
      panel.remove();
    }

    // Clean up global reference
    delete (window as any).offlineEmergencyService;
  }
}

export const offlineEmergencyService = new OfflineEmergencyService();
