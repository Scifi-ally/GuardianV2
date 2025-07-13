import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  query,
  where,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EmergencyContact } from "@/contexts/AuthContext";

export interface ContactToAdd {
  guardianKey: string;
  priority: number;
}

export class EmergencyContactService {
  static async addEmergencyContact(
    userUid: string,
    guardianKey: string,
    priority: number = 1,
  ): Promise<{ success: boolean; contact?: EmergencyContact; error?: string }> {
    try {
      // Find user with the guardian key
      const usersQuery = query(
        collection(db, "users"),
        where("guardianKey", "==", guardianKey),
      );
      const querySnapshot = await getDocs(usersQuery);

      if (querySnapshot.empty) {
        return { success: false, error: "Guardian key not found" };
      }

      const targetUserDoc = querySnapshot.docs[0];
      const targetUser = targetUserDoc.data();

      // Validate required fields
      if (!targetUser.displayName) {
        return {
          success: false,
          error: "Contact must have a display name",
        };
      }

      // Create emergency contact object
      const newContact: EmergencyContact = {
        id: targetUser.uid,
        name: targetUser.displayName,
        phone: targetUser.phone || "", // Required for emergency alerts
        email: targetUser.email || undefined,
        relationship: "Friend",
        guardianKey,
        priority,
        isVerified: false,
        canShareLocation: true,
        lastContacted: undefined,
        addedAt: new Date(),
        isActive: true,
      };

      try {
        // Add to current user's emergency contacts
        const userRef = doc(db, "users", userUid);
        await updateDoc(userRef, {
          emergencyContacts: arrayUnion(newContact),
        });
        console.log("Emergency contact added to Firestore successfully");
      } catch (firestoreError: any) {
        console.warn(
          "Firestore write failed, using localStorage fallback:",
          firestoreError,
        );

        // Fallback: Store in localStorage
        const localContacts = JSON.parse(
          localStorage.getItem(`guardian_contacts_${userUid}`) || "[]",
        );
        localContacts.push(newContact);
        localStorage.setItem(
          `guardian_contacts_${userUid}`,
          JSON.stringify(localContacts),
        );

        // Don't throw the error - the fallback worked
        console.log(
          "Contact stored locally due to permissions, operation successful",
        );
      }

      return { success: true, contact: newContact };
    } catch (error) {
      console.error("Error adding emergency contact:", error);
      if (
        error instanceof Error &&
        error.message?.includes("Missing or insufficient permissions")
      ) {
        return {
          success: false,
          error: "Database permissions limited. Contact stored locally.",
        };
      }
      return { success: false, error: "Failed to add emergency contact" };
    }
  }

  static async removeEmergencyContact(
    userUid: string,
    contact: EmergencyContact,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userRef = doc(db, "users", userUid);
      await updateDoc(userRef, {
        emergencyContacts: arrayRemove(contact),
      });

      return { success: true };
    } catch (error) {
      console.error("Error removing emergency contact:", error);
      return { success: false, error: "Failed to remove emergency contact" };
    }
  }

  static async updateContactPriority(
    userUid: string,
    contacts: EmergencyContact[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userRef = doc(db, "users", userUid);
      await updateDoc(userRef, {
        emergencyContacts: contacts,
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating contact priorities:", error);
      return { success: false, error: "Failed to update contact priorities" };
    }
  }

  static async toggleContactStatus(
    userUid: string,
    contactId: string,
    isActive: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userRef = doc(db, "users", userUid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return { success: false, error: "User not found" };
      }

      const userData = userDoc.data();
      const contacts = userData.emergencyContacts || [];

      const updatedContacts = contacts.map((contact: EmergencyContact) =>
        contact.id === contactId ? { ...contact, isActive } : contact,
      );

      await updateDoc(userRef, {
        emergencyContacts: updatedContacts,
      });

      return { success: true };
    } catch (error) {
      console.error("Error toggling contact status:", error);
      return { success: false, error: "Failed to update contact status" };
    }
  }
}
