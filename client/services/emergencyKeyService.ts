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
    // Always check localStorage first (works for both demo and regular users)
    const localKeyData = localStorage.getItem(
      `guardian_key_data_${guardianKey}`,
    );
    if (localKeyData) {
      console.log(`🔑 Guardian key ${guardianKey} exists in localStorage`);
      return false; // Key exists in localStorage
    }

    // For additional safety, try Firebase if available
    try {
      const keyQuery = query(
        collection(db, "guardianKeys"),
        where("guardianKey", "==", guardianKey),
      );
      const querySnapshot = await getDocs(keyQuery);
      const isUnique = querySnapshot.empty;
      console.log(`🔥 Firebase uniqueness check for ${guardianKey}:`, isUnique);
      return isUnique;
    } catch (error) {
      console.log(
        `📱 Firebase unavailable for uniqueness check, localStorage says ${guardianKey} is unique`,
      );
      // If Firebase is unavailable but localStorage doesn't have the key, it's unique
      return true;
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
      try {
        if (await this.isKeyUnique(key)) {
          return key;
        }
      } catch (error) {
        console.warn(
          `Key uniqueness check failed for attempt ${attempts + 1}, using generated key:`,
          error,
        );
        // If uniqueness check fails completely, use the generated key
        // This happens when Firebase is completely unavailable
        return key;
      }
      attempts++;
    }

    // Final fallback: generate a key with timestamp for uniqueness
    const timestampKey =
      this.generateGuardianKey().substring(0, 6) +
      Date.now().toString().slice(-2);
    console.warn("Using timestamp-based fallback key:", timestampKey);
    return timestampKey;
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
        console.log(`✅ User ${userId} already has guardian key:`, existingKey);
        return { success: true, guardianKey: existingKey };
      }

      // Generate new unique key
      const guardianKey = await this.generateUniqueGuardianKey();
      console.log(`🔑 Generated new guardian key for ${userId}:`, guardianKey);

      const keyData: EmergencyKeyData = {
        guardianKey,
        userId,
        displayName,
        email,
        createdAt: new Date(),
        isActive: true,
      };

      // For demo users, use localStorage directly to avoid Firebase
      if (userId.startsWith("demo-")) {
        localStorage.setItem(`guardian_key_${userId}`, guardianKey);
        localStorage.setItem(
          `guardian_key_data_${guardianKey}`,
          JSON.stringify(keyData),
        );
        console.log(`📱 Stored demo user guardian key in localStorage`);
        return { success: true, guardianKey };
      }

      try {
        // Store in guardianKeys collection for real users
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
        console.log(`✅ Stored guardian key in Firebase for user ${userId}`);
      } catch (firestoreError) {
        console.warn(
          "Firestore write failed, using localStorage fallback:",
          firestoreError.message,
        );

        // Fallback: Store in localStorage
        localStorage.setItem(`guardian_key_${userId}`, guardianKey);
        localStorage.setItem(
          `guardian_key_data_${guardianKey}`,
          JSON.stringify(keyData),
        );
      }

      return { success: true, guardianKey };
    } catch (error) {
      console.error("Error creating guardian key:", error);

      // Last resort: generate a local-only unique key
      console.log(`🔄 Generating fallback guardian key for ${userId}`);
      let fallbackKey;
      let attempts = 0;
      do {
        fallbackKey = this.generateGuardianKey();
        attempts++;
      } while (
        localStorage.getItem(`guardian_key_data_${fallbackKey}`) &&
        attempts < 10
      );

      const fallbackKeyData = {
        guardianKey: fallbackKey,
        userId,
        displayName,
        email,
        createdAt: new Date(),
        isActive: true,
      };

      localStorage.setItem(`guardian_key_${userId}`, fallbackKey);
      localStorage.setItem(
        `guardian_key_data_${fallbackKey}`,
        JSON.stringify(fallbackKeyData),
      );

      console.log(`✅ Generated fallback guardian key:`, fallbackKey);
      return { success: true, guardianKey: fallbackKey };
    }
  }

  /**
   * Get guardian key for a user
   */
  static async getUserGuardianKey(userId: string): Promise<string | null> {
    // For demo users, use localStorage directly to avoid Firebase permissions
    if (userId.startsWith("demo-")) {
      const localKey = localStorage.getItem(`guardian_key_${userId}`);
      console.log(
        `📱 Demo user ${userId} guardian key from localStorage:`,
        localKey,
      );
      return localKey || null;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data().guardianKey || null;
      }

      // Fallback: Check localStorage
      const localKey = localStorage.getItem(`guardian_key_${userId}`);
      return localKey || null;
    } catch (error) {
      console.warn(
        "Firebase unavailable, using localStorage fallback:",
        error.message,
      );

      // Fallback: Check localStorage
      const localKey = localStorage.getItem(`guardian_key_${userId}`);
      return localKey || null;
    }
  }

  /**
   * Find user by guardian key
   */
  static async findUserByGuardianKey(
    guardianKey: string,
  ): Promise<EmergencyKeyData | null> {
    // Check localStorage first (works for both demo and regular users)
    const localKeyData = localStorage.getItem(
      `guardian_key_data_${guardianKey}`,
    );
    if (localKeyData) {
      try {
        const keyData = JSON.parse(localKeyData) as EmergencyKeyData;
        // Convert date string back to Date object
        keyData.createdAt = new Date(keyData.createdAt);
        console.log(`📱 Found guardian key data in localStorage:`, keyData);
        return keyData;
      } catch (parseError) {
        console.warn(
          "Error parsing localStorage guardian key data:",
          parseError,
        );
      }
    }

    // If not in localStorage, try Firebase for real users
    try {
      const keyDoc = await getDoc(doc(db, "guardianKeys", guardianKey));
      if (keyDoc.exists()) {
        const keyData = keyDoc.data() as EmergencyKeyData;
        console.log(`🔥 Found guardian key data in Firebase:`, keyData);
        return keyData;
      }
      return null;
    } catch (error) {
      console.warn(
        "Firebase unavailable, localStorage was already checked:",
        error.message,
      );
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
