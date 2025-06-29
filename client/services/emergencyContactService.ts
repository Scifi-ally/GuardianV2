import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  isVerified: boolean;
  addedBy: string; // Guardian key of person who added them
  addedAt: Date;
}

export interface EmergencyAlert {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromGuardianKey: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp: Date;
  type: "manual" | "automatic" | "voice";
  status: "active" | "acknowledged" | "resolved";
  receivedBy: string[]; // Array of user IDs who received the alert
}

export interface ContactRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromGuardianKey: string;
  toGuardianKey: string;
  message: string;
  timestamp: Date;
  status: "pending" | "accepted" | "declined";
}

class EmergencyContactService {
  // Add someone as emergency contact using their Guardian Key
  async sendContactRequest(
    fromUserId: string,
    fromUserName: string,
    fromGuardianKey: string,
    toGuardianKey: string,
    message: string = "I'd like to add you as my emergency contact",
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, find the user with the target Guardian Key
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("guardianKey", "==", toGuardianKey));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, error: "Guardian Key not found" };
      }

      const targetUserDoc = querySnapshot.docs[0];
      const targetUserId = targetUserDoc.id;

      // Create contact request
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const requestRef = doc(db, "contactRequests", requestId);

      const contactRequest: ContactRequest = {
        id: requestId,
        fromUserId,
        fromUserName,
        fromGuardianKey,
        toGuardianKey,
        message,
        timestamp: new Date(),
        status: "pending",
      };

      await setDoc(requestRef, {
        ...contactRequest,
        timestamp: Timestamp.fromDate(contactRequest.timestamp),
      });

      // Add notification to target user
      await this.addNotification(targetUserId, {
        type: "contact_request",
        title: "New Emergency Contact Request",
        message: `${fromUserName} wants to add you as their emergency contact`,
        data: { requestId },
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error sending contact request:", error);
      return { success: false, error: "Failed to send contact request" };
    }
  }

  // Accept contact request
  async acceptContactRequest(
    requestId: string,
    acceptingUserId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const requestRef = doc(db, "contactRequests", requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        return { success: false, error: "Contact request not found" };
      }

      const request = requestDoc.data() as ContactRequest;

      // Update request status
      await updateDoc(requestRef, { status: "accepted" });

      // Add each other as emergency contacts
      const contact1: EmergencyContact = {
        id: `contact_${Date.now()}_1`,
        name: request.fromUserName,
        phone: "", // Will be filled from user profile
        relationship: "Emergency Contact",
        priority: 1,
        isVerified: true,
        addedBy: request.fromGuardianKey,
        addedAt: new Date(),
      };

      const contact2: EmergencyContact = {
        id: `contact_${Date.now()}_2`,
        name: "", // Will be filled from accepting user's profile
        phone: "",
        relationship: "Emergency Contact",
        priority: 1,
        isVerified: true,
        addedBy: request.toGuardianKey,
        addedAt: new Date(),
      };

      // Get user profiles to fill in missing info
      const fromUserRef = doc(db, "users", request.fromUserId);
      const toUserRef = doc(db, "users", acceptingUserId);

      const [fromUserDoc, toUserDoc] = await Promise.all([
        getDoc(fromUserRef),
        getDoc(toUserRef),
      ]);

      if (fromUserDoc.exists() && toUserDoc.exists()) {
        const fromUserData = fromUserDoc.data();
        const toUserData = toUserDoc.data();

        contact1.phone = fromUserData.phone || "";
        contact2.name = toUserData.displayName || "Guardian User";
        contact2.phone = toUserData.phone || "";

        // Add contacts to both users
        await Promise.all([
          updateDoc(toUserRef, {
            emergencyContacts: arrayUnion(contact1),
          }),
          updateDoc(fromUserRef, {
            emergencyContacts: arrayUnion(contact2),
          }),
        ]);

        // Send notifications
        await Promise.all([
          this.addNotification(request.fromUserId, {
            type: "contact_accepted",
            title: "Contact Request Accepted",
            message: `${toUserData.displayName} accepted your emergency contact request`,
            timestamp: new Date(),
          }),
          this.addNotification(acceptingUserId, {
            type: "contact_added",
            title: "Emergency Contact Added",
            message: `You are now connected with ${request.fromUserName}`,
            timestamp: new Date(),
          }),
        ]);
      }

      return { success: true };
    } catch (error) {
      console.error("Error accepting contact request:", error);
      return { success: false, error: "Failed to accept contact request" };
    }
  }

  // Send SOS alert to all emergency contacts
  async sendSOSAlert(
    userId: string,
    userName: string,
    guardianKey: string,
    location?: { latitude: number; longitude: number; accuracy?: number },
    type: "manual" | "automatic" | "voice" = "manual",
    customMessage?: string,
  ): Promise<{ success: boolean; alertId?: string; error?: string }> {
    try {
      // Get user's emergency contacts
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return { success: false, error: "User not found" };
      }

      const userData = userDoc.data();
      const emergencyContacts = userData.emergencyContacts || [];

      if (emergencyContacts.length === 0) {
        return { success: false, error: "No emergency contacts found" };
      }

      // Create SOS alert
      const alertId = `SOS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const alertRef = doc(db, "emergencyAlerts", alertId);

      const defaultMessage = `🚨 EMERGENCY ALERT from ${userName}!\n\nI need immediate help. Please check on me or call emergency services.\n\nTime: ${new Date().toLocaleString()}`;

      const alert: EmergencyAlert = {
        id: alertId,
        fromUserId: userId,
        fromUserName: userName,
        fromGuardianKey: guardianKey,
        message: customMessage || defaultMessage,
        location,
        timestamp: new Date(),
        type,
        status: "active",
        receivedBy: [],
      };

      await setDoc(alertRef, {
        ...alert,
        timestamp: Timestamp.fromDate(alert.timestamp),
      });

      // Find all users who have this person as emergency contact and send alerts
      const contactUserIds: string[] = [];

      // Search for users who have this guardian key in their emergency contacts
      const usersRef = collection(db, "users");
      const allUsersSnapshot = await getDocs(usersRef);

      allUsersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const contacts = userData.emergencyContacts || [];

        // Check if any of their contacts has the alerting user's guardian key
        const hasContact = contacts.some(
          (contact: EmergencyContact) => contact.addedBy === guardianKey,
        );

        if (hasContact) {
          contactUserIds.push(doc.id);
        }
      });

      // Send notifications to all emergency contacts
      const notificationPromises = contactUserIds.map(async (contactUserId) => {
        await this.addNotification(contactUserId, {
          type: "emergency_alert",
          title: "🚨 EMERGENCY ALERT",
          message: `${userName} has triggered an SOS alert!`,
          data: {
            alertId,
            location,
            fromUserId: userId,
            fromUserName: userName,
          },
          timestamp: new Date(),
          urgent: true,
        });

        // Also trigger browser notification if supported
        this.triggerBrowserNotification(
          `🚨 EMERGENCY: ${userName}`,
          "SOS alert triggered - immediate attention required!",
          { alertId, userId },
        );
      });

      await Promise.all(notificationPromises);

      // Update alert with received list
      await updateDoc(alertRef, { receivedBy: contactUserIds });

      return { success: true, alertId };
    } catch (error) {
      console.error("Error sending SOS alert:", error);
      return { success: false, error: "Failed to send SOS alert" };
    }
  }

  // Listen for emergency alerts for a user
  subscribeToEmergencyAlerts(
    userId: string,
    callback: (alerts: EmergencyAlert[]) => void,
  ): () => void {
    const userRef = doc(db, "users", userId);

    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const notifications = userData.notifications || [];

        // Filter emergency alerts
        const emergencyAlerts = notifications
          .filter((notif: any) => notif.type === "emergency_alert")
          .map((notif: any) => ({
            id: notif.data?.alertId || "",
            fromUserId: notif.data?.fromUserId || "",
            fromUserName: notif.data?.fromUserName || "",
            fromGuardianKey: "",
            message: notif.message,
            location: notif.data?.location,
            timestamp: notif.timestamp.toDate(),
            type: "manual" as const,
            status: "active" as const,
            receivedBy: [],
          }));

        callback(emergencyAlerts);
      }
    });
  }

  // Acknowledge emergency alert
  async acknowledgeAlert(
    alertId: string,
    acknowledgingUserId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const alertRef = doc(db, "emergencyAlerts", alertId);
      const alertDoc = await getDoc(alertRef);

      if (!alertDoc.exists()) {
        return { success: false, error: "Alert not found" };
      }

      await updateDoc(alertRef, {
        status: "acknowledged",
        acknowledgedBy: acknowledgingUserId,
        acknowledgedAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      return { success: false, error: "Failed to acknowledge alert" };
    }
  }

  // Helper method to add notifications
  private async addNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      data?: any;
      timestamp: Date;
      urgent?: boolean;
    },
  ): Promise<void> {
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      notifications: arrayUnion({
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Timestamp.fromDate(notification.timestamp),
        read: false,
      }),
    });
  }

  // Helper method to trigger browser notifications
  private triggerBrowserNotification(
    title: string,
    body: string,
    data?: any,
  ): void {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "emergency-alert",
        requireInteraction: true,
        data,
      });
    } else if (
      "Notification" in window &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body, icon: "/favicon.ico" });
        }
      });
    }
  }

  // Get pending contact requests for a user
  async getContactRequests(guardianKey: string): Promise<ContactRequest[]> {
    try {
      const requestsRef = collection(db, "contactRequests");
      const q = query(
        requestsRef,
        where("toGuardianKey", "==", guardianKey),
        where("status", "==", "pending"),
      );

      const querySnapshot = await getDocs(q);
      const requests: ContactRequest[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          ...data,
          timestamp: data.timestamp.toDate(),
        } as ContactRequest);
      });

      return requests;
    } catch (error) {
      console.error("Error getting contact requests:", error);
      return [];
    }
  }
}

export const emergencyContactService = new EmergencyContactService();
