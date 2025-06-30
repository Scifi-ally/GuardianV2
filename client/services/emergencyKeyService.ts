import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface EmergencyKeyData {
  guardianKey: string;
  userId: string;
  displayName: string;
  email: string;
  createdAt: Date;
  isActive: boolean;
}

export class EmergencyKeyService {
  /**
   * Generate a unique 8-character guardian key
   */
  static generateGuardianKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Check if a guardian key already exists
   */
  static async isKeyUnique(guardianKey: string): Promise<boolean> {
    try {
      const keyQuery = query(
        collection(db, "guardianKeys"),
        where("guardianKey", "==", guardianKey),
      );
      const querySnapshot = await getDocs(keyQuery);
      return querySnapshot.empty;
    } catch (error) {
      console.error("Error checking key uniqueness:", error);
      return false;
    }
  }

  /**
   * Generate a unique guardian key with uniqueness check
   */
  static async generateUniqueGuardianKey(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const key = this.generateGuardianKey();
      if (await this.isKeyUnique(key)) {
        return key;
      }
      attempts++;
    }

    throw new Error(
      "Failed to generate unique guardian key after multiple attempts",
    );
  }

  /**
   * Create a guardian key record for a user
   */
  static async createGuardianKey(
    userId: string,
    displayName: string,
    email: string,
  ): Promise<{ success: boolean; guardianKey?: string; error?: string }> {
    try {
      // Check if user already has a guardian key
      const existingKey = await this.getUserGuardianKey(userId);
      if (existingKey) {
        return { success: true, guardianKey: existingKey };
      }

      // Generate new unique key
      const guardianKey = await this.generateUniqueGuardianKey();

      const keyData: EmergencyKeyData = {
        guardianKey,
        userId,
        displayName,
        email,
        createdAt: new Date(),
        isActive: true,
      };

      // Store in guardianKeys collection
      await setDoc(doc(db, "guardianKeys", guardianKey), keyData);

      // Also store in user document for easy access
      await setDoc(
        doc(db, "users", userId),
        {
          guardianKey,
          displayName,
          email,
          createdAt: new Date(),
          emergencyContacts: [],
        },
        { merge: true },
      );

      return { success: true, guardianKey };
    } catch (error) {
      console.error("Error creating guardian key:", error);
      return { success: false, error: "Failed to create guardian key" };
    }
  }

  /**
   * Get guardian key for a user
   */
  static async getUserGuardianKey(userId: string): Promise<string | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data().guardianKey || null;
      }
      return null;
    } catch (error) {
      console.error("Error getting user guardian key:", error);
      return null;
    }
  }

  /**
   * Find user by guardian key
   */
  static async findUserByGuardianKey(
    guardianKey: string,
  ): Promise<EmergencyKeyData | null> {
    try {
      const keyDoc = await getDoc(doc(db, "guardianKeys", guardianKey));
      if (keyDoc.exists()) {
        return keyDoc.data() as EmergencyKeyData;
      }
      return null;
    } catch (error) {
      console.error("Error finding user by guardian key:", error);
      return null;
    }
  }

  /**
   * Validate guardian key format
   */
  static validateGuardianKey(key: string): boolean {
    return /^[A-Z0-9]{8}$/.test(key);
  }

  /**
   * Regenerate guardian key for a user
   */
  static async regenerateGuardianKey(
    userId: string,
    displayName: string,
    email: string,
  ): Promise<{ success: boolean; guardianKey?: string; error?: string }> {
    try {
      // Get old key to remove it
      const oldKey = await this.getUserGuardianKey(userId);

      // Generate new key
      const result = await this.createGuardianKey(userId, displayName, email);

      // Remove old key if it existed and new key was created successfully
      if (oldKey && result.success && result.guardianKey !== oldKey) {
        try {
          await setDoc(
            doc(db, "guardianKeys", oldKey),
            { isActive: false },
            { merge: true },
          );
        } catch (error) {
          console.warn("Could not deactivate old key:", error);
        }
      }

      return result;
    } catch (error) {
      console.error("Error regenerating guardian key:", error);
      return { success: false, error: "Failed to regenerate guardian key" };
    }
  }
}
