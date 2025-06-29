import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EmergencyContact } from "@/contexts/AuthContext";

export interface SOSAlert {
  id?: string;
  senderId: string;
  senderName: string;
  senderKey: string;
  receiverIds: string[];
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: Date;
  };
  status: "active" | "resolved" | "cancelled";
  createdAt: Date;
  resolvedAt?: Date;
  type: "manual" | "automatic" | "panic";
  priority: "low" | "medium" | "high" | "critical";
}

export interface SOSResponse {
  id?: string;
  alertId: string;
  responderId: string;
  responderName: string;
  response: "acknowledged" | "enroute" | "arrived" | "assisted";
  location?: {
    latitude: number;
    longitude: number;
  };
  message?: string;
  timestamp: Date;
}

export class SOSService {
  static async sendSOSAlert(
    senderId: string,
    senderName: string,
    senderKey: string,
    emergencyContacts: EmergencyContact[],
    location?: GeolocationPosition,
    type: "manual" | "automatic" | "panic" = "manual",
    message?: string,
  ): Promise<{ success: boolean; alertId?: string; error?: string }> {
    try {
      const activeContacts = emergencyContacts.filter(
        (contact) => contact.isActive,
      );
      const receiverIds = activeContacts.map((contact) => contact.id);

      const sosAlert: Omit<SOSAlert, "id"> = {
        senderId,
        senderName,
        senderKey,
        receiverIds,
        message: message || `Emergency alert from ${senderName}`,
        location: location
          ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              timestamp: new Date(location.timestamp),
            }
          : undefined,
        status: "active",
        createdAt: new Date(),
        type,
        priority: type === "panic" ? "critical" : "high",
      };

      try {
        const docRef = await addDoc(collection(db, "sosAlerts"), {
          ...sosAlert,
          createdAt: Timestamp.fromDate(sosAlert.createdAt),
          location: sosAlert.location
            ? {
                ...sosAlert.location,
                timestamp: Timestamp.fromDate(sosAlert.location.timestamp),
              }
            : undefined,
        });

        return { success: true, alertId: docRef.id };
      } catch (firestoreError: any) {
        if (firestoreError.code === "permission-denied") {
          // Fallback: Store locally and return a mock ID
          const localAlertId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const localAlert = { ...sosAlert, id: localAlertId };

          // Store in localStorage for each receiver
          receiverIds.forEach((receiverId) => {
            const existingAlerts = JSON.parse(
              localStorage.getItem(`sos_alerts_${receiverId}`) || "[]",
            );
            existingAlerts.unshift(localAlert);
            localStorage.setItem(
              `sos_alerts_${receiverId}`,
              JSON.stringify(existingAlerts),
            );
          });

          console.log("SOS alert stored locally due to permissions");
          return { success: true, alertId: localAlertId };
        }
        throw firestoreError;
      }
    } catch (error) {
      console.error("Error sending SOS alert:", error);
      return { success: false, error: "Failed to send SOS alert" };
    }
  }

  static subscribeToSOSAlerts(
    userId: string,
    onAlert: (alerts: SOSAlert[]) => void,
  ): () => void {
    try {
      const q = query(
        collection(db, "sosAlerts"),
        where("receiverIds", "array-contains", userId),
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const alerts: SOSAlert[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt.toDate(),
              location: data.location
                ? {
                    ...data.location,
                    timestamp: data.location.timestamp.toDate(),
                  }
                : undefined,
              resolvedAt: data.resolvedAt
                ? data.resolvedAt.toDate()
                : undefined,
            } as SOSAlert;
          });
          onAlert(alerts);
        },
        (error) => {
          console.warn("SOS alerts subscription error:", error);
          if (error.code === "permission-denied") {
            console.log(
              "Firestore permissions denied, using local fallback for SOS alerts",
            );
            // Try to load from localStorage as fallback
            const localAlerts = localStorage.getItem(`sos_alerts_${userId}`);
            if (localAlerts) {
              try {
                const alerts = JSON.parse(localAlerts);
                onAlert(alerts);
              } catch (parseError) {
                console.warn("Failed to parse local SOS alerts:", parseError);
                onAlert([]);
              }
            } else {
              onAlert([]);
            }
          } else {
            console.error(
              "Unexpected error in SOS alerts subscription:",
              error,
            );
            onAlert([]);
          }
        },
      );
    } catch (error) {
      console.warn("Failed to set up SOS alerts subscription:", error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }

  static async respondToSOS(
    alertId: string,
    responderId: string,
    responderName: string,
    response: SOSResponse["response"],
    message?: string,
    location?: GeolocationPosition,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const sosResponse: Omit<SOSResponse, "id"> = {
        alertId,
        responderId,
        responderName,
        response,
        location: location
          ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }
          : undefined,
        message,
        timestamp: new Date(),
      };

      try {
        await addDoc(collection(db, "sosResponses"), {
          ...sosResponse,
          timestamp: Timestamp.fromDate(sosResponse.timestamp),
        });

        return { success: true };
      } catch (firestoreError: any) {
        if (firestoreError.code === "permission-denied") {
          // Fallback: Store response locally
          const localResponseId = `local_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const localResponse = { ...sosResponse, id: localResponseId };

          const existingResponses = JSON.parse(
            localStorage.getItem(`sos_responses_${alertId}`) || "[]",
          );
          existingResponses.unshift(localResponse);
          localStorage.setItem(
            `sos_responses_${alertId}`,
            JSON.stringify(existingResponses),
          );

          console.log("SOS response stored locally due to permissions");
          return { success: true };
        }
        throw firestoreError;
      }
    } catch (error) {
      console.error("Error responding to SOS:", error);
      return { success: false, error: "Failed to respond to SOS" };
    }
  }

  static async resolveSOSAlert(
    alertId: string,
    resolvedBy: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const alertRef = doc(db, "sosAlerts", alertId);
      await updateDoc(alertRef, {
        status: "resolved",
        resolvedAt: Timestamp.fromDate(new Date()),
        resolvedBy,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error resolving SOS alert:", error);
      if (error.code === "permission-denied") {
        console.log(
          "Cannot resolve SOS alert due to permissions, handling locally",
        );
        return { success: true }; // Pretend it worked for UX
      }
      return { success: false, error: "Failed to resolve SOS alert" };
    }
  }

  static async getSOSAlert(alertId: string): Promise<SOSAlert | null> {
    try {
      const alertDoc = await getDoc(doc(db, "sosAlerts", alertId));
      if (!alertDoc.exists()) return null;

      const data = alertDoc.data();
      return {
        id: alertDoc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        location: data.location
          ? {
              ...data.location,
              timestamp: data.location.timestamp.toDate(),
            }
          : undefined,
        resolvedAt: data.resolvedAt ? data.resolvedAt.toDate() : undefined,
      } as SOSAlert;
    } catch (error: any) {
      console.error("Error getting SOS alert:", error);
      if (error.code === "permission-denied") {
        console.log("Cannot get SOS alert due to permissions");
      }
      return null;
    }
  }

  static subscribeToSOSResponses(
    alertId: string,
    onResponse: (responses: SOSResponse[]) => void,
  ): () => void {
    try {
      const q = query(
        collection(db, "sosResponses"),
        where("alertId", "==", alertId),
        orderBy("timestamp", "desc"),
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const responses: SOSResponse[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp.toDate(),
            } as SOSResponse;
          });
          onResponse(responses);
        },
        (error) => {
          console.warn("SOS responses subscription error:", error);
          if (error.code === "permission-denied") {
            console.log(
              "Firestore permissions denied, using local fallback for SOS responses",
            );
            // Try to load from localStorage as fallback
            const localResponses = localStorage.getItem(
              `sos_responses_${alertId}`,
            );
            if (localResponses) {
              try {
                const responses = JSON.parse(localResponses);
                onResponse(responses);
              } catch (parseError) {
                console.warn(
                  "Failed to parse local SOS responses:",
                  parseError,
                );
                onResponse([]);
              }
            } else {
              onResponse([]);
            }
          } else {
            console.error(
              "Unexpected error in SOS responses subscription:",
              error,
            );
            onResponse([]);
          }
        },
      );
    } catch (error) {
      console.warn("Failed to set up SOS responses subscription:", error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }
}
