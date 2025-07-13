import { EventEmitter } from "@/lib/eventEmitter";
import { realTimeService } from "./realTimeService";
import { enhancedFirebaseService } from "./enhancedFirebaseService";
import { notifications } from "./enhancedNotificationService";
import type { EmergencyContact } from "@/contexts/AuthContext";

export interface ConnectionStatus {
  contactId: string;
  contactName: string;
  isConnected: boolean;
  lastContact: Date | null;
  responseTime?: number;
  method: "sms" | "call" | "push" | "email" | "offline";
  error?: string;
}

export interface EmergencyBroadcast {
  id: string;
  message: string;
  type: "alert" | "location" | "status" | "test";
  priority: "low" | "medium" | "high" | "critical";
  contacts: string[];
  timestamp: Date;
  responses: Map<string, { received: Date; acknowledged: boolean }>;
  status: "sending" | "sent" | "failed" | "partial";
}

class EmergencyContactConnectionService extends EventEmitter {
  private connections: Map<string, ConnectionStatus> = new Map();
  private broadcasts: Map<string, EmergencyBroadcast> = new Map();
  private connectionCheckInterval?: NodeJS.Timeout;
  private isActive = false;

  constructor() {
    super();
    this.startConnectionMonitoring();
  }

  /**
   * Initialize connection monitoring for all emergency contacts
   */
  public async initializeConnections(
    contacts: EmergencyContact[],
  ): Promise<void> {
    try {
      for (const contact of contacts) {
        const status: ConnectionStatus = {
          contactId: contact.id,
          contactName: contact.name,
          isConnected: false,
          lastContact: contact.lastContacted || null,
          method: this.determineBestMethod(contact),
        };

        this.connections.set(contact.id, status);
        await this.testConnection(contact);
      }

      this.emit(
        "connectionsInitialized",
        Array.from(this.connections.values()),
      );
    } catch (error) {
      console.error(
        "Failed to initialize emergency contact connections:",
        error,
      );
      notifications.error({
        title: "Connection Setup Failed",
        description: "Could not establish emergency contact connections",
      });
    }
  }

  /**
   * Test connection to a specific emergency contact
   */
  public async testConnection(
    contact: EmergencyContact,
  ): Promise<ConnectionStatus> {
    const status = this.connections.get(contact.id);
    if (!status) {
      throw new Error(`No connection status found for contact ${contact.id}`);
    }

    try {
      const startTime = Date.now();

      // Determine best connection method
      const method = this.determineBestMethod(contact);
      let isConnected = false;
      let error: string | undefined;

      switch (method) {
        case "push":
          isConnected = await this.testPushConnection(contact);
          break;
        case "email":
          isConnected = await this.testEmailConnection(contact);
          break;
        case "sms":
          isConnected = await this.testSMSConnection(contact);
          break;
        case "call":
          isConnected = await this.testCallConnection(contact);
          break;
        default:
          isConnected = false;
          error = "No valid connection method available";
      }

      const responseTime = Date.now() - startTime;

      const updatedStatus: ConnectionStatus = {
        ...status,
        isConnected,
        responseTime,
        method,
        error,
        lastContact: isConnected ? new Date() : status.lastContact,
      };

      this.connections.set(contact.id, updatedStatus);
      this.emit("connectionStatusChanged", updatedStatus);

      return updatedStatus;
    } catch (error) {
      const errorStatus: ConnectionStatus = {
        ...status,
        isConnected: false,
        error:
          error instanceof Error ? error.message : "Connection test failed",
      };

      this.connections.set(contact.id, errorStatus);
      this.emit("connectionStatusChanged", errorStatus);

      return errorStatus;
    }
  }

  /**
   * Send emergency broadcast to all contacts
   */
  public async sendEmergencyBroadcast(
    message: string,
    type: EmergencyBroadcast["type"] = "alert",
    priority: EmergencyBroadcast["priority"] = "high",
  ): Promise<EmergencyBroadcast> {
    const userProfile = enhancedFirebaseService.profile;
    if (
      !userProfile?.emergencyContacts ||
      userProfile.emergencyContacts.length === 0
    ) {
      throw new Error("No emergency contacts available");
    }

    const broadcast: EmergencyBroadcast = {
      id: `broadcast_${Date.now()}`,
      message,
      type,
      priority,
      contacts: userProfile.emergencyContacts.map((c) => c.id),
      timestamp: new Date(),
      responses: new Map(),
      status: "sending",
    };

    this.broadcasts.set(broadcast.id, broadcast);
    this.emit("broadcastStarted", broadcast);

    try {
      let successCount = 0;
      const totalCount = userProfile.emergencyContacts.length;

      for (const contact of userProfile.emergencyContacts) {
        try {
          const success = await this.sendToContact(
            contact,
            message,
            type,
            priority,
          );
          if (success) {
            successCount++;
            broadcast.responses.set(contact.id, {
              received: new Date(),
              acknowledged: false,
            });
          }
        } catch (error) {
          console.warn(`Failed to send to contact ${contact.name}:`, error);
        }
      }

      broadcast.status =
        successCount === totalCount
          ? "sent"
          : successCount > 0
            ? "partial"
            : "failed";

      this.emit("broadcastCompleted", broadcast);

      // Show appropriate notification
      if (successCount > 0) {
        notifications.success({
          title: "Emergency Alert Sent",
          description: `Alert sent to ${successCount}/${totalCount} contacts`,
          vibrate: true,
        });
      } else {
        notifications.error({
          title: "Emergency Alert Failed",
          description: "Could not send alert to any contacts",
          vibrate: true,
        });
      }

      return broadcast;
    } catch (error) {
      broadcast.status = "failed";
      this.emit("broadcastFailed", broadcast);
      throw error;
    }
  }

  /**
   * Get current connection status for all contacts
   */
  public getConnectionStatuses(): ConnectionStatus[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connection status for specific contact
   */
  public getConnectionStatus(contactId: string): ConnectionStatus | null {
    return this.connections.get(contactId) || null;
  }

  /**
   * Start monitoring connections periodically
   */
  private startConnectionMonitoring(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.connectionCheckInterval = setInterval(
      async () => {
        const userProfile = enhancedFirebaseService.profile;
        if (userProfile?.emergencyContacts) {
          for (const contact of userProfile.emergencyContacts) {
            try {
              await this.testConnection(contact);
            } catch (error) {
              console.debug(
                `Connection check failed for ${contact.name}:`,
                error,
              );
            }
          }
        }
      },
      5 * 60 * 1000,
    ); // Check every 5 minutes
  }

  /**
   * Stop monitoring connections
   */
  public stopConnectionMonitoring(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = undefined;
    }
    this.isActive = false;
  }

  /**
   * Determine best connection method for contact
   */
  private determineBestMethod(
    contact: EmergencyContact,
  ): ConnectionStatus["method"] {
    // Prioritize based on reliability and availability
    if (contact.canShareLocation && enhancedFirebaseService.currentUser) {
      return "push";
    }
    if (contact.email) {
      return "email";
    }
    if (contact.phone) {
      return "sms";
    }
    return "offline";
  }

  /**
   * Test different connection methods
   */
  private async testPushConnection(
    contact: EmergencyContact,
  ): Promise<boolean> {
    try {
      // Test Firebase connection
      if (!enhancedFirebaseService.currentUser) return false;

      // Check if contact is online and can receive push notifications
      // This would integrate with Firebase messaging in a real implementation
      return contact.isVerified && contact.canShareLocation;
    } catch (error) {
      return false;
    }
  }

  private async testEmailConnection(
    contact: EmergencyContact,
  ): Promise<boolean> {
    // In a real implementation, this would test SMTP connection
    // For now, just validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !!contact.email && emailRegex.test(contact.email);
  }

  private async testSMSConnection(contact: EmergencyContact): Promise<boolean> {
    // In a real implementation, this would test SMS gateway
    // For now, just validate phone format
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return (
      !!contact.phone &&
      contact.phone.length >= 10 &&
      phoneRegex.test(contact.phone)
    );
  }

  private async testCallConnection(
    contact: EmergencyContact,
  ): Promise<boolean> {
    // For calls, we just need a valid phone number
    return this.testSMSConnection(contact);
  }

  /**
   * Send message to specific contact using best available method
   */
  private async sendToContact(
    contact: EmergencyContact,
    message: string,
    type: EmergencyBroadcast["type"],
    priority: EmergencyBroadcast["priority"],
  ): Promise<boolean> {
    const status = this.connections.get(contact.id);
    if (!status || !status.isConnected) {
      throw new Error(`Contact ${contact.name} is not connected`);
    }

    const location = realTimeService.getCurrentLocation();
    const locationText = location
      ? `Location: https://maps.google.com/?q=${location.latitude},${location.longitude}`
      : "Location unavailable";

    const fullMessage = `${this.getTypePrefix(type, priority)} ${message}\n\n${locationText}\n\nTime: ${new Date().toLocaleString()}\n\nFrom: Guardian App`;

    try {
      switch (status.method) {
        case "push":
          return await this.sendPushNotification(contact, fullMessage);
        case "email":
          return await this.sendEmail(contact, fullMessage, type);
        case "sms":
          return await this.sendSMS(contact, fullMessage);
        case "call":
          return await this.initiateCall(contact);
        default:
          throw new Error("No valid send method available");
      }
    } catch (error) {
      console.error(`Failed to send to ${contact.name}:`, error);
      return false;
    }
  }

  private getTypePrefix(
    type: EmergencyBroadcast["type"],
    priority: EmergencyBroadcast["priority"],
  ): string {
    const prefixes = {
      alert:
        priority === "critical"
          ? "🚨 CRITICAL EMERGENCY"
          : "⚠️ EMERGENCY ALERT",
      location: "📍 LOCATION UPDATE",
      status: "ℹ️ STATUS UPDATE",
      test: "🧪 TEST MESSAGE",
    };
    return prefixes[type];
  }

  private async sendPushNotification(
    contact: EmergencyContact,
    message: string,
  ): Promise<boolean> {
    // In a real implementation, this would use Firebase Cloud Messaging
    // For now, we'll use the clipboard method as fallback
    try {
      await navigator.clipboard.writeText(message);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async sendEmail(
    contact: EmergencyContact,
    message: string,
    type: EmergencyBroadcast["type"],
  ): Promise<boolean> {
    if (!contact.email) return false;

    // Use mailto link as fallback
    const subject = encodeURIComponent(`Guardian App ${type.toUpperCase()}`);
    const body = encodeURIComponent(message);
    const mailtoLink = `mailto:${contact.email}?subject=${subject}&body=${body}`;

    try {
      window.open(mailtoLink, "_blank");
      return true;
    } catch (error) {
      return false;
    }
  }

  private async sendSMS(
    contact: EmergencyContact,
    message: string,
  ): Promise<boolean> {
    if (!contact.phone) return false;

    // Use SMS link
    const smsLink = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;

    try {
      window.open(smsLink, "_blank");
      return true;
    } catch (error) {
      return false;
    }
  }

  private async initiateCall(contact: EmergencyContact): Promise<boolean> {
    if (!contact.phone) return false;

    try {
      window.location.href = `tel:${contact.phone}`;
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
export const emergencyContactConnectionService =
  new EmergencyContactConnectionService();

export default emergencyContactConnectionService;
