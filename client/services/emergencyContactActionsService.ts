import { EventEmitter } from "@/lib/eventEmitter";
import { realTimeService } from "./realTimeService";
import type { EmergencyContact } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EmergencyAction {
  id: string;
  type: "alert" | "message" | "call" | "share_location";
  contactId: string;
  contactName: string;
  timestamp: Date;
  status: "pending" | "sent" | "delivered" | "failed";
  method: "sms" | "call" | "share" | "clipboard";
  data?: any;
}

export interface EmergencyResponse {
  success: boolean;
  message: string;
  actions: EmergencyAction[];
  failedActions?: EmergencyAction[];
}

class EmergencyContactActionsService extends EventEmitter {
  private activeActions: Map<string, EmergencyAction> = new Map();

  constructor() {
    super();
  }

  /**
   * Send alert to specific contact
   */
  public async alertContact(
    contact: EmergencyContact,
  ): Promise<EmergencyAction> {
    const action: EmergencyAction = {
      id: `alert_${contact.id}_${Date.now()}`,
      type: "alert",
      contactId: contact.id,
      contactName: contact.name,
      timestamp: new Date(),
      status: "pending",
      method: "share",
    };

    this.activeActions.set(action.id, action);
    this.emit("actionStarted", action);

    try {
      const currentLocation = realTimeService.getCurrentLocation();
      const locationText = currentLocation
        ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
        : "Location unavailable";

      const alertMessage = `🚨 EMERGENCY ALERT: I need immediate assistance! Please respond or call emergency services. Location: ${locationText} - Time: ${new Date().toLocaleString()} - Contact: ${contact.name}`;

      // Try multiple alert methods
      const success = await this.sendAlert(alertMessage, action);

      if (success) {
        action.status = "sent";
        action.data = { message: alertMessage, location: currentLocation };
        this.emit("actionCompleted", action);
      } else {
        action.status = "failed";
        this.emit("actionFailed", action);
      }

      return action;
    } catch (error) {
      action.status = "failed";
      action.data = { error: error.message };
      this.emit("actionFailed", action);
      throw error;
    }
  }

  /**
   * Send message to specific contact
   */
  public async messageContact(
    contact: EmergencyContact,
    customMessage?: string,
  ): Promise<EmergencyAction> {
    const action: EmergencyAction = {
      id: `message_${contact.id}_${Date.now()}`,
      type: "message",
      contactId: contact.id,
      contactName: contact.name,
      timestamp: new Date(),
      status: "pending",
      method: "share",
    };

    this.activeActions.set(action.id, action);
    this.emit("actionStarted", action);

    try {
      const currentLocation = realTimeService.getCurrentLocation();
      const locationText = currentLocation
        ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
        : "Location unavailable";

      const message =
        customMessage ||
        `📱 Message from Guardian App: I wanted to check in and share my location. Current position: ${locationText} - Time: ${new Date().toLocaleString()}`;

      const success = await this.sendMessage(message, action);

      if (success) {
        action.status = "sent";
        action.data = { message, location: currentLocation };
        this.emit("actionCompleted", action);
      } else {
        action.status = "failed";
        this.emit("actionFailed", action);
      }

      return action;
    } catch (error) {
      action.status = "failed";
      action.data = { error: error.message };
      this.emit("actionFailed", action);
      throw error;
    }
  }

  /**
   * Call emergency contact
   */
  public async callContact(
    contact: EmergencyContact,
  ): Promise<EmergencyAction> {
    const action: EmergencyAction = {
      id: `call_${contact.id}_${Date.now()}`,
      type: "call",
      contactId: contact.id,
      contactName: contact.name,
      timestamp: new Date(),
      status: "pending",
      method: "call",
    };

    this.activeActions.set(action.id, action);
    this.emit("actionStarted", action);

    try {
      if (!contact.phone) {
        throw new Error("No phone number available for this contact");
      }

      // Open phone dialer
      window.location.href = `tel:${contact.phone}`;

      action.status = "sent";
      action.data = { phone: contact.phone };
      this.emit("actionCompleted", action);

      return action;
    } catch (error) {
      action.status = "failed";
      action.data = { error: error.message };
      this.emit("actionFailed", action);
      throw error;
    }
  }

  /**
   * Share current location with contact
   */
  public async shareLocationWithContact(
    contact: EmergencyContact,
  ): Promise<EmergencyAction> {
    const action: EmergencyAction = {
      id: `location_${contact.id}_${Date.now()}`,
      type: "share_location",
      contactId: contact.id,
      contactName: contact.name,
      timestamp: new Date(),
      status: "pending",
      method: "share",
    };

    this.activeActions.set(action.id, action);
    this.emit("actionStarted", action);

    try {
      const currentLocation = realTimeService.getCurrentLocation();

      if (!currentLocation) {
        throw new Error("Current location not available");
      }

      const locationText = `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;
      const locationMessage = `📍 LIVE LOCATION: ${locationText} - Accuracy: ${Math.round(currentLocation.accuracy)}m - Shared at: ${new Date().toLocaleString()} - From: Guardian App`;

      const success = await this.sendMessage(locationMessage, action);

      if (success) {
        action.status = "sent";
        action.data = { location: currentLocation, message: locationMessage };
        this.emit("actionCompleted", action);
      } else {
        action.status = "failed";
        this.emit("actionFailed", action);
      }

      return action;
    } catch (error) {
      action.status = "failed";
      action.data = { error: error.message };
      this.emit("actionFailed", action);
      throw error;
    }
  }

  /**
   * Alert all emergency contacts
   */
  public async alertAllContacts(
    contacts: EmergencyContact[],
  ): Promise<EmergencyResponse> {
    const actions: EmergencyAction[] = [];
    const failedActions: EmergencyAction[] = [];

    for (const contact of contacts) {
      try {
        const action = await this.alertContact(contact);
        actions.push(action);
      } catch (error) {
        const failedAction: EmergencyAction = {
          id: `failed_${contact.id}_${Date.now()}`,
          type: "alert",
          contactId: contact.id,
          contactName: contact.name,
          timestamp: new Date(),
          status: "failed",
          method: "share",
          data: { error: error.message },
        };
        failedActions.push(failedAction);
      }
    }

    const successCount = actions.filter((a) => a.status === "sent").length;
    const totalCount = contacts.length;

    return {
      success: successCount > 0,
      message: `Emergency alert sent to ${successCount}/${totalCount} contacts`,
      actions,
      failedActions: failedActions.length > 0 ? failedActions : undefined,
    };
  }

  /**
   * Message all emergency contacts
   */
  public async messageAllContacts(
    contacts: EmergencyContact[],
    customMessage?: string,
  ): Promise<EmergencyResponse> {
    const actions: EmergencyAction[] = [];
    const failedActions: EmergencyAction[] = [];

    for (const contact of contacts) {
      try {
        const action = await this.messageContact(contact, customMessage);
        actions.push(action);
      } catch (error) {
        const failedAction: EmergencyAction = {
          id: `failed_${contact.id}_${Date.now()}`,
          type: "message",
          contactId: contact.id,
          contactName: contact.name,
          timestamp: new Date(),
          status: "failed",
          method: "share",
          data: { error: error.message },
        };
        failedActions.push(failedAction);
      }
    }

    const successCount = actions.filter((a) => a.status === "sent").length;
    const totalCount = contacts.length;

    return {
      success: successCount > 0,
      message: `Message sent to ${successCount}/${totalCount} contacts`,
      actions,
      failedActions: failedActions.length > 0 ? failedActions : undefined,
    };
  }

  /**
   * Get action history
   */
  public getActionHistory(): EmergencyAction[] {
    return Array.from(this.activeActions.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Get recent actions for a specific contact
   */
  public getContactActionHistory(contactId: string): EmergencyAction[] {
    return this.getActionHistory().filter(
      (action) => action.contactId === contactId,
    );
  }

  /**
   * Clear action history
   */
  public clearActionHistory(): void {
    this.activeActions.clear();
    this.emit("historyCleared");
  }

  /**
   * Send emergency message to all contacts
   */
  public async sendEmergencyMessage(message: string): Promise<boolean> {
    try {
      const action: EmergencyAction = {
        id: `emergency_msg_${Date.now()}`,
        type: "message",
        contactId: "all",
        contactName: "All Emergency Contacts",
        timestamp: new Date(),
        status: "pending",
        method: "share",
      };

      this.activeActions.set(action.id, action);
      this.emit("actionStarted", action);

      const success = await this.attemptMultipleSendMethods(
        message,
        action,
        true,
      );

      if (success) {
        action.status = "sent";
        this.emit("actionCompleted", action);
      } else {
        action.status = "failed";
        this.emit("actionFailed", action);
      }

      return success;
    } catch (error) {
      console.error("Failed to send emergency message:", error);
      return false;
    }
  }

  /**
   * Send emergency alert to all contacts
   */
  public async sendEmergencyAlert(message: string): Promise<boolean> {
    try {
      const action: EmergencyAction = {
        id: `emergency_alert_${Date.now()}`,
        type: "alert",
        contactId: "all",
        contactName: "All Emergency Contacts",
        timestamp: new Date(),
        status: "pending",
        method: "share",
      };

      this.activeActions.set(action.id, action);
      this.emit("actionStarted", action);

      const success = await this.attemptMultipleSendMethods(
        message,
        action,
        true,
      );

      if (success) {
        action.status = "sent";
        this.emit("actionCompleted", action);
      } else {
        action.status = "failed";
        this.emit("actionFailed", action);
      }

      return success;
    } catch (error) {
      console.error("Failed to send emergency alert:", error);
      return false;
    }
  }

  // Private helper methods

  private async sendAlert(
    message: string,
    action: EmergencyAction,
  ): Promise<boolean> {
    return this.attemptMultipleSendMethods(message, action, true);
  }

  private async sendMessage(
    message: string,
    action: EmergencyAction,
  ): Promise<boolean> {
    return this.attemptMultipleSendMethods(message, action, false);
  }

  private async attemptMultipleSendMethods(
    message: string,
    action: EmergencyAction,
    isEmergency: boolean = false,
  ): Promise<boolean> {
    const title = isEmergency ? "🚨 EMERGENCY ALERT" : "📱 Guardian Message";

    // Method 1: Try Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: message,
        });
        action.method = "share";
        return true;
      } catch (error) {
        console.log("Web Share failed, trying clipboard");
      }
    }

    // Method 2: Copy to clipboard
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
        action.method = "clipboard";
        return true;
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = message;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        action.method = "clipboard";
        return true;
      }
    } catch (error) {
      console.error("Clipboard failed:", error);
    }

    // Method 3: Show alert as last resort
    try {
      // Copy to clipboard and show toast notification
      navigator.clipboard.writeText(message);
      toast.error(`${title}`, {
        description: "Message copied to clipboard - please send manually",
        duration: 5000,
      });
      action.method = "clipboard";
      return true;
    } catch (error) {
      toast.error("Emergency alert failed", {
        description: "Unable to send emergency message",
      });
      return false;
    }
  }
}

// Create singleton instance
export const emergencyContactActionsService =
  new EmergencyContactActionsService();

export default emergencyContactActionsService;
