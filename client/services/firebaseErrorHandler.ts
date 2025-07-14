/**
 * Firebase Error Handler and Offline Fallback Service
 * Handles network failures and provides offline functionality
 */

import { FirebaseError } from "firebase/app";
import { enableNetwork, disableNetwork } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface OfflineData {
  [key: string]: any;
}

class FirebaseErrorHandler {
  private static instance: FirebaseErrorHandler;
  private isOnline = true;
  private offlineData: Map<string, OfflineData> = new Map();
  private retryQueue: Array<() => Promise<any>> = [];
  private maxRetries = 3;
  private retryDelay = 2000;

  static getInstance(): FirebaseErrorHandler {
    if (!FirebaseErrorHandler.instance) {
      FirebaseErrorHandler.instance = new FirebaseErrorHandler();
    }
    return FirebaseErrorHandler.instance;
  }

  constructor() {
    this.setupNetworkListeners();
    this.setupOfflineSupport();
  }

  // Setup network connectivity listeners
  private setupNetworkListeners() {
    window.addEventListener("online", () => {
      console.log("🌐 Network connection restored");
      this.handleNetworkRestore();
    });

    window.addEventListener("offline", () => {
      console.log("📴 Network connection lost");
      this.handleNetworkLoss();
    });

    // Initial network state
    this.isOnline = navigator.onLine;
  }

  // Setup Firebase offline support
  private async setupOfflineSupport() {
    try {
      if (!navigator.onLine) {
        await disableNetwork(db);
        console.log("🔌 Firebase offline mode enabled");
      }
    } catch (error) {
      console.warn("Failed to setup offline support:", error);
    }
  }

  // Handle network restoration
  private async handleNetworkRestore() {
    this.isOnline = true;

    try {
      await enableNetwork(db);
      console.log("✅ Firebase reconnected");

      // Process retry queue
      await this.processRetryQueue();
    } catch (error) {
      console.error("Failed to restore Firebase connection:", error);
    }
  }

  // Handle network loss
  private async handleNetworkLoss() {
    this.isOnline = false;

    try {
      await disableNetwork(db);
      console.log("📴 Firebase offline mode activated");
    } catch (error) {
      console.warn("Failed to enable offline mode:", error);
    }
  }

  // Process queued operations when network is restored
  private async processRetryQueue() {
    while (this.retryQueue.length > 0) {
      const operation = this.retryQueue.shift();
      if (operation) {
        try {
          await operation();
          console.log("✅ Queued operation completed");
        } catch (error) {
          console.error("❌ Queued operation failed:", error);
        }
      }
    }
  }

  // Wrap Firebase operations with error handling
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    fallbackValue?: T,
    retryable = true,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      return this.handleFirebaseError(
        error,
        operation,
        fallbackValue,
        retryable,
      );
    }
  }

  // Handle different types of Firebase errors
  private async handleFirebaseError<T>(
    error: any,
    operation: () => Promise<T>,
    fallbackValue?: T,
    retryable = true,
  ): Promise<T> {
    const errorCode = error?.code || "unknown";
    const errorMessage = error?.message || "Unknown error";

    console.error(`🔥 Firebase Error [${errorCode}]:`, errorMessage);

    // Handle specific error types
    switch (errorCode) {
      case "failed-precondition":
      case "unavailable":
      case "deadline-exceeded":
        return this.handleNetworkError(operation, fallbackValue, retryable);

      case "permission-denied":
        return this.handlePermissionError(fallbackValue);

      case "not-found":
        return this.handleNotFoundError(fallbackValue);

      case "already-exists":
        return this.handleAlreadyExistsError(fallbackValue);

      case "resource-exhausted":
        return this.handleQuotaExceededError(operation, fallbackValue);

      case "unauthenticated":
        return this.handleAuthError(fallbackValue);

      default:
        return this.handleGenericError(
          error,
          operation,
          fallbackValue,
          retryable,
        );
    }
  }

  // Handle network-related errors
  private async handleNetworkError<T>(
    operation: () => Promise<T>,
    fallbackValue?: T,
    retryable = true,
  ): Promise<T> {
    if (!this.isOnline) {
      console.log("📴 Operating in offline mode");
      if (retryable) {
        this.retryQueue.push(operation);
      }
      return fallbackValue as T;
    }

    // Retry with exponential backoff
    if (retryable) {
      return this.retryOperation(operation, fallbackValue);
    }

    return fallbackValue as T;
  }

  // Retry operation with exponential backoff
  private async retryOperation<T>(
    operation: () => Promise<T>,
    fallbackValue?: T,
    attempt = 1,
  ): Promise<T> {
    if (attempt > this.maxRetries) {
      console.error(`❌ Max retries (${this.maxRetries}) exceeded`);
      return fallbackValue as T;
    }

    const delay = this.retryDelay * Math.pow(2, attempt - 1);
    console.log(
      `🔄 Retrying operation (attempt ${attempt}/${this.maxRetries}) in ${delay}ms`,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      return await operation();
    } catch (error) {
      return this.retryOperation(operation, fallbackValue, attempt + 1);
    }
  }

  // Handle permission denied errors
  private handlePermissionError<T>(fallbackValue?: T): T {
    console.error("🔒 Firebase permission denied");
    // Could trigger re-authentication here
    return fallbackValue as T;
  }

  // Handle not found errors
  private handleNotFoundError<T>(fallbackValue?: T): T {
    console.log("📭 Firebase document not found");
    return fallbackValue as T;
  }

  // Handle already exists errors
  private handleAlreadyExistsError<T>(fallbackValue?: T): T {
    console.log("📄 Firebase document already exists");
    return fallbackValue as T;
  }

  // Handle quota exceeded errors
  private async handleQuotaExceededError<T>(
    operation: () => Promise<T>,
    fallbackValue?: T,
  ): Promise<T> {
    console.error("💳 Firebase quota exceeded");
    // Implement exponential backoff
    await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 1 minute

    try {
      return await operation();
    } catch {
      return fallbackValue as T;
    }
  }

  // Handle authentication errors
  private handleAuthError<T>(fallbackValue?: T): T {
    console.error("🔑 Firebase authentication error");
    // Could trigger sign-in flow here
    return fallbackValue as T;
  }

  // Handle generic errors
  private async handleGenericError<T>(
    error: any,
    operation: () => Promise<T>,
    fallbackValue?: T,
    retryable = true,
  ): Promise<T> {
    console.error("⚠️ Generic Firebase error:", error);

    // Check if it's a network error by examining the error message
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(operation, fallbackValue, retryable);
    }

    return fallbackValue as T;
  }

  // Check if error is network-related
  private isNetworkError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || "";
    const networkErrorKeywords = [
      "network",
      "fetch",
      "connection",
      "timeout",
      "offline",
      "unavailable",
      "failed to fetch",
    ];

    return networkErrorKeywords.some((keyword) =>
      errorMessage.includes(keyword),
    );
  }

  // Store data for offline use
  storeOfflineData(key: string, data: any) {
    this.offlineData.set(key, data);
    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to store offline data:", error);
    }
  }

  // Retrieve offline data
  getOfflineData(key: string): any {
    // Try memory first
    if (this.offlineData.has(key)) {
      return this.offlineData.get(key);
    }

    // Try localStorage
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (stored) {
        const data = JSON.parse(stored);
        this.offlineData.set(key, data);
        return data;
      }
    } catch (error) {
      console.warn("Failed to retrieve offline data:", error);
    }

    return null;
  }

  // Check if Firebase is available
  async isFirebaseAvailable(): Promise<boolean> {
    try {
      // Simple test to check Firebase connectivity
      const testDoc = await import("firebase/firestore").then(
        ({ doc, getDoc }) => getDoc(doc(db, "__test__", "connectivity")),
      );
      return true;
    } catch (error) {
      console.log("Firebase connectivity test failed:", error);
      return false;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.retryQueue.length,
      hasOfflineData: this.offlineData.size > 0,
    };
  }

  // Clear offline data
  clearOfflineData() {
    this.offlineData.clear();
    // Clear localStorage offline data
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("offline_")) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const firebaseErrorHandler = FirebaseErrorHandler.getInstance();
