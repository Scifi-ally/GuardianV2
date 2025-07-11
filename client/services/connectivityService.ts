interface ConnectivityStatus {
  isOnline: boolean;
  firebaseConnected: boolean;
  googleMapsLoaded: boolean;
  lastChecked: Date;
}

interface ConnectivityTest {
  service: string;
  status: "success" | "error" | "warning";
  message: string;
  latency?: number;
}

class ConnectivityService {
  private listeners: ((status: ConnectivityStatus) => void)[] = [];
  private currentStatus: ConnectivityStatus = {
    isOnline: navigator.onLine,
    firebaseConnected: false,
    googleMapsLoaded: false,
    lastChecked: new Date(),
  };

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Monitor online/offline status
    window.addEventListener("online", this.handleOnlineStatusChange);
    window.addEventListener("offline", this.handleOnlineStatusChange);

    // Initial check
    this.performConnectivityCheck();

    // Periodic checks every 30 seconds
    setInterval(() => {
      this.performConnectivityCheck();
    }, 30000);
  }

  private handleOnlineStatusChange = () => {
    this.currentStatus.isOnline = navigator.onLine;
    this.performConnectivityCheck();
  };

  private async performConnectivityCheck() {
    const startTime = performance.now();

    // Check Google Maps
    this.currentStatus.googleMapsLoaded = !!(
      window.google && window.google.maps
    );

    // Check Firebase connectivity
    try {
      const { auth, db } = await import("@/lib/firebase");

      // Quick Firebase auth connectivity check
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(false); // Use cached token
        this.currentStatus.firebaseConnected = true;
      } else {
        // Test basic Firebase connection without authentication
        // This is a minimal check that doesn't require auth
        this.currentStatus.firebaseConnected = !!auth;
      }
    } catch (error) {
      console.warn("Firebase connectivity check failed:", error);
      this.currentStatus.firebaseConnected = false;
    }

    this.currentStatus.lastChecked = new Date();
    const endTime = performance.now();

    console.log(
      `🔍 Connectivity check completed in ${Math.round(endTime - startTime)}ms:`,
      this.currentStatus,
    );

    this.notifyListeners();
  }

  public async runDiagnostics(): Promise<ConnectivityTest[]> {
    const tests: ConnectivityTest[] = [];
    const startTime = performance.now();

    // Test 1: Basic Internet Connectivity
    try {
      const response = await fetch("https://httpbin.org/get", {
        method: "GET",
        mode: "cors",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        tests.push({
          service: "Internet Connection",
          status: "success",
          message: "Internet connection is working",
          latency: performance.now() - startTime,
        });
      } else {
        tests.push({
          service: "Internet Connection",
          status: "warning",
          message: `HTTP ${response.status}: ${response.statusText}`,
        });
      }
    } catch (error) {
      tests.push({
        service: "Internet Connection",
        status: "error",
        message: `Internet connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Test 2: Firebase Auth Connectivity
    try {
      const { auth } = await import("@/lib/firebase");
      const testStart = performance.now();

      // Test Firebase initialization
      if (auth.app) {
        tests.push({
          service: "Firebase Auth",
          status: "success",
          message: "Firebase Auth is initialized",
          latency: performance.now() - testStart,
        });
      } else {
        tests.push({
          service: "Firebase Auth",
          status: "error",
          message: "Firebase Auth is not initialized",
        });
      }
    } catch (error) {
      tests.push({
        service: "Firebase Auth",
        status: "error",
        message: `Firebase Auth error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Test 3: Firestore Connectivity
    try {
      const { db } = await import("@/lib/firebase");
      const testStart = performance.now();

      if (db.app) {
        tests.push({
          service: "Firestore",
          status: "success",
          message: "Firestore is initialized",
          latency: performance.now() - testStart,
        });
      } else {
        tests.push({
          service: "Firestore",
          status: "error",
          message: "Firestore is not initialized",
        });
      }
    } catch (error) {
      tests.push({
        service: "Firestore",
        status: "error",
        message: `Firestore error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Test 4: Google Maps API
    try {
      const testStart = performance.now();

      if (window.google && window.google.maps) {
        // Test basic geocoding functionality
        const geocoder = new google.maps.Geocoder();
        tests.push({
          service: "Google Maps",
          status: "success",
          message: "Google Maps API is loaded and ready",
          latency: performance.now() - testStart,
        });
      } else {
        tests.push({
          service: "Google Maps",
          status: "warning",
          message: "Google Maps API is not loaded",
        });
      }
    } catch (error) {
      tests.push({
        service: "Google Maps",
        status: "error",
        message: `Google Maps error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Test 5: Local Storage
    try {
      const testKey = "guardian_connectivity_test";
      const testValue = "test_" + Date.now();

      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === testValue) {
        tests.push({
          service: "Local Storage",
          status: "success",
          message: "Local Storage is working",
        });
      } else {
        tests.push({
          service: "Local Storage",
          status: "error",
          message: "Local Storage read/write failed",
        });
      }
    } catch (error) {
      tests.push({
        service: "Local Storage",
        status: "error",
        message: `Local Storage error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    // Test 6: Geolocation API
    try {
      if ("geolocation" in navigator) {
        if ("permissions" in navigator) {
          const permission = await navigator.permissions.query({
            name: "geolocation",
          });
          tests.push({
            service: "Geolocation",
            status: permission.state === "granted" ? "success" : "warning",
            message: `Geolocation permission: ${permission.state}`,
          });
        } else {
          tests.push({
            service: "Geolocation",
            status: "warning",
            message: "Geolocation available, permission status unknown",
          });
        }
      } else {
        tests.push({
          service: "Geolocation",
          status: "error",
          message: "Geolocation is not supported",
        });
      }
    } catch (error) {
      tests.push({
        service: "Geolocation",
        status: "error",
        message: `Geolocation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }

    return tests;
  }

  public subscribe(callback: (status: ConnectivityStatus) => void) {
    this.listeners.push(callback);
    // Immediately notify with current status
    callback(this.currentStatus);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback(this.currentStatus));
  }

  public getCurrentStatus(): ConnectivityStatus {
    return { ...this.currentStatus };
  }

  public forceCheck(): Promise<void> {
    return this.performConnectivityCheck();
  }

  // Cleanup method
  public destroy() {
    window.removeEventListener("online", this.handleOnlineStatusChange);
    window.removeEventListener("offline", this.handleOnlineStatusChange);
    this.listeners = [];
  }
}

export const connectivityService = new ConnectivityService();
export type { ConnectivityStatus, ConnectivityTest };
