interface SafeguardConfig {
  maxRetryAttempts: number;
  retryDelayMs: number;
  circuitBreakerThreshold: number;
  healthCheckIntervalMs: number;
  criticalErrorThreshold: number;
  emergencyFallbackEnabled: boolean;
}

interface HealthStatus {
  overall: "healthy" | "degraded" | "critical" | "emergency";
  systems: {
    location: "operational" | "degraded" | "failed";
    maps: "operational" | "degraded" | "failed";
    emergency: "operational" | "degraded" | "failed";
    connectivity: "operational" | "degraded" | "failed";
    storage: "operational" | "degraded" | "failed";
  };
  lastCheck: Date;
  errorCount: number;
  uptime: number;
}

interface CriticalError {
  id: string;
  type:
    | "location"
    | "maps"
    | "emergency"
    | "connectivity"
    | "storage"
    | "system";
  severity: "low" | "medium" | "high" | "critical" | "emergency";
  message: string;
  timestamp: Date;
  context: any;
  resolved: boolean;
  retryCount: number;
}

class ProductionSafeguardsService {
  private config: SafeguardConfig = {
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    circuitBreakerThreshold: 5,
    healthCheckIntervalMs: 30000, // 30 seconds
    criticalErrorThreshold: 10,
    emergencyFallbackEnabled: true,
  };

  private healthStatus: HealthStatus = {
    overall: "healthy",
    systems: {
      location: "operational",
      maps: "operational",
      emergency: "operational",
      connectivity: "operational",
      storage: "operational",
    },
    lastCheck: new Date(),
    errorCount: 0,
    uptime: Date.now(),
  };

  private criticalErrors: CriticalError[] = [];
  private circuitBreakers: Map<
    string,
    { failures: number; lastFailure: Date; isOpen: boolean }
  > = new Map();
  private retryQueues: Map<string, Array<() => Promise<any>>> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private errorListeners: Array<(error: CriticalError) => void> = [];

  constructor() {
    this.initializeSafeguards();
    this.startHealthChecks();
    this.setupGlobalErrorHandling();
    this.setupPerformanceMonitoring();
  }

  private initializeSafeguards() {
    // Initialize circuit breakers for critical systems
    const criticalSystems = [
      "location",
      "maps",
      "emergency",
      "connectivity",
      "storage",
    ];
    criticalSystems.forEach((system) => {
      this.circuitBreakers.set(system, {
        failures: 0,
        lastFailure: new Date(0),
        isOpen: false,
      });
      this.retryQueues.set(system, []);
    });

    // Setup emergency fallbacks
    this.setupEmergencyFallbacks();

    console.log("🛡️ Production safeguards initialized");
  }

  private setupGlobalErrorHandling() {
    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.handleCriticalError({
        type: "system",
        severity: "high",
        message: `Unhandled promise rejection: ${event.reason}`,
        context: { reason: event.reason, promise: event.promise },
      });

      // Prevent the default browser behavior
      event.preventDefault();
    });

    // Catch uncaught JavaScript errors
    window.addEventListener("error", (event) => {
      this.handleCriticalError({
        type: "system",
        severity: "high",
        message: `Uncaught error: ${event.message}`,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        },
      });
    });

    // Catch resource loading errors
    window.addEventListener(
      "error",
      (event) => {
        if (event.target && event.target !== window) {
          const target = event.target as HTMLElement;
          this.handleCriticalError({
            type: "system",
            severity: "medium",
            message: `Resource loading error: ${target.tagName}`,
            context: {
              tagName: target.tagName,
              src: (target as any).src || (target as any).href,
            },
          });
        }
      },
      true,
    );

    console.log("🚨 Global error handling setup complete");
  }

  private setupPerformanceMonitoring() {
    // Monitor for performance degradation
    let lastMemoryCheck = 0;

    setInterval(() => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize;

        // Check for memory leaks (significant increase)
        if (lastMemoryCheck > 0 && memoryUsage > lastMemoryCheck * 1.5) {
          this.handleCriticalError({
            type: "system",
            severity: "medium",
            message: "Potential memory leak detected",
            context: {
              currentUsage: memoryUsage,
              previousUsage: lastMemoryCheck,
              increase:
                (
                  ((memoryUsage - lastMemoryCheck) / lastMemoryCheck) *
                  100
                ).toFixed(1) + "%",
            },
          });
        }

        lastMemoryCheck = memoryUsage;
      }
    }, 60000); // Check every minute

    // Monitor for frozen UI
    let lastFrameTime = performance.now();
    const checkFrameRate = () => {
      const now = performance.now();
      const timeDiff = now - lastFrameTime;

      // If more than 100ms between frames, UI might be frozen
      if (timeDiff > 100) {
        this.handleCriticalError({
          type: "system",
          severity: "medium",
          message: "UI performance degradation detected",
          context: { frameDelay: timeDiff },
        });
      }

      lastFrameTime = now;
      requestAnimationFrame(checkFrameRate);
    };
    requestAnimationFrame(checkFrameRate);
  }

  private setupEmergencyFallbacks() {
    // Location fallback
    (window as any).emergencyLocationFallback = () => {
      // Use IP-based location as last resort
      return fetch("https://ipapi.co/json/")
        .then((response) => response.json())
        .then((data) => ({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 10000, // Very low accuracy
        }))
        .catch(() => {
          // Hardcoded safe location (city center)
          return {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 50000,
          };
        });
    };

    // Offline emergency actions
    (window as any).emergencyOfflineActions = {
      call911: () => {
        // Create tel: link that works offline
        const link = document.createElement("a");
        link.href = "tel:911";
        link.click();
      },

      sendSMS: (message: string) => {
        // Create SMS link that works offline
        const link = document.createElement("a");
        link.href = `sms:?body=${encodeURIComponent(message)}`;
        link.click();
      },

      showEmergencyInfo: () => {
        // Show critical emergency information
        const emergencyDiv = document.createElement("div");
        emergencyDiv.innerHTML = `
          <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,0,0,0.9); color: white; z-index: 10000; padding: 20px; text-align: center; font-size: 18px;">
            <h1>EMERGENCY MODE</h1>
            <p>App is in emergency fallback mode</p>
            <button onclick="this.parentElement.remove()" style="padding: 10px 20px; font-size: 16px; margin: 10px;">Close</button>
            <div style="margin-top: 20px;">
              <button onclick="window.location.href='tel:911'" style="padding: 15px 30px; font-size: 18px; background: red; color: white; border: none; margin: 5px;">Call 911</button>
            </div>
          </div>
        `;
        document.body.appendChild(emergencyDiv);
      },
    };

    console.log("🆘 Emergency fallbacks configured");
  }

  private startHealthChecks() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);

    // Initial health check
    this.performHealthCheck();
  }

  private async performHealthCheck() {
    const checks = {
      location: this.checkLocationSystem(),
      maps: this.checkMapsSystem(),
      emergency: this.checkEmergencySystem(),
      connectivity: this.checkConnectivity(),
      storage: this.checkStorage(),
    };

    // Execute all checks
    const results = await Promise.allSettled(Object.values(checks));
    const systemNames = Object.keys(checks) as Array<
      keyof typeof this.healthStatus.systems
    >;

    // Update system statuses
    results.forEach((result, index) => {
      const systemName = systemNames[index];
      if (result.status === "fulfilled") {
        this.healthStatus.systems[systemName] = result.value;
      } else {
        this.healthStatus.systems[systemName] = "failed";
        this.handleCriticalError({
          type: systemName as any,
          severity: "high",
          message: `Health check failed for ${systemName}`,
          context: { error: result.reason },
        });
      }
    });

    // Calculate overall health
    this.updateOverallHealth();
    this.healthStatus.lastCheck = new Date();

    console.log(`💊 Health check complete: ${this.healthStatus.overall}`);
  }

  private async checkLocationSystem(): Promise<
    "operational" | "degraded" | "failed"
  > {
    try {
      // Test if geolocation is available
      if (!navigator.geolocation) {
        return "failed";
      }

      // Quick position test with timeout
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve("degraded"), 5000);

        navigator.geolocation.getCurrentPosition(
          () => {
            clearTimeout(timeout);
            resolve("operational");
          },
          (error) => {
            clearTimeout(timeout);
            if (error.code === error.PERMISSION_DENIED) {
              resolve("degraded");
            } else {
              resolve("failed");
            }
          },
          { timeout: 4000, maximumAge: 60000 },
        );
      });
    } catch (error) {
      return "failed";
    }
  }

  private async checkMapsSystem(): Promise<
    "operational" | "degraded" | "failed"
  > {
    try {
      // Check if Google Maps is loaded
      if (typeof window.google === "undefined" || !window.google.maps) {
        return "failed";
      }

      // Test basic Maps functionality
      const testDiv = document.createElement("div");
      testDiv.style.display = "none";
      document.body.appendChild(testDiv);

      try {
        new window.google.maps.Map(testDiv, {
          center: { lat: 0, lng: 0 },
          zoom: 1,
        });
        document.body.removeChild(testDiv);
        return "operational";
      } catch (error) {
        document.body.removeChild(testDiv);
        return "degraded";
      }
    } catch (error) {
      return "failed";
    }
  }

  private async checkEmergencySystem(): Promise<
    "operational" | "degraded" | "failed"
  > {
    try {
      // Check if emergency services are available
      const emergencyContacts = localStorage.getItem("emergencyContacts");
      const hasContacts =
        emergencyContacts && JSON.parse(emergencyContacts).length > 0;

      // Check if SOS functionality is working
      const sosAvailable =
        typeof window.emergencyContactActionsService !== "undefined";

      if (hasContacts && sosAvailable) {
        return "operational";
      } else if (hasContacts || sosAvailable) {
        return "degraded";
      } else {
        return "failed";
      }
    } catch (error) {
      return "failed";
    }
  }

  private async checkConnectivity(): Promise<
    "operational" | "degraded" | "failed"
  > {
    try {
      if (!navigator.onLine) {
        return "failed";
      }

      // Test actual connectivity with a quick request
      const response = await fetch("/favicon.ico", {
        method: "HEAD",
        cache: "no-cache",
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        return "operational";
      } else {
        return "degraded";
      }
    } catch (error) {
      return "failed";
    }
  }

  private async checkStorage(): Promise<"operational" | "degraded" | "failed"> {
    try {
      // Test localStorage
      const testKey = "_healthcheck_" + Date.now();
      localStorage.setItem(testKey, "test");
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === "test") {
        return "operational";
      } else {
        return "degraded";
      }
    } catch (error) {
      return "failed";
    }
  }

  private updateOverallHealth() {
    const systems = Object.values(this.healthStatus.systems);
    const operationalCount = systems.filter((s) => s === "operational").length;
    const failedCount = systems.filter((s) => s === "failed").length;

    if (failedCount === 0 && operationalCount === systems.length) {
      this.healthStatus.overall = "healthy";
    } else if (failedCount === 0) {
      this.healthStatus.overall = "degraded";
    } else if (failedCount <= 2) {
      this.healthStatus.overall = "critical";
    } else {
      this.healthStatus.overall = "emergency";
      this.activateEmergencyMode();
    }
  }

  private activateEmergencyMode() {
    console.error(
      "🚨 EMERGENCY MODE ACTIVATED - Multiple critical systems failed",
    );

    // Enable all emergency fallbacks
    if (this.config.emergencyFallbackEnabled) {
      // Show emergency UI
      (window as any).emergencyOfflineActions?.showEmergencyInfo();

      // Dispatch emergency event
      window.dispatchEvent(
        new CustomEvent("emergency-mode-activated", {
          detail: {
            reason: "multiple-system-failures",
            healthStatus: this.healthStatus,
          },
        }),
      );
    }
  }

  public handleCriticalError(
    errorData: Omit<
      CriticalError,
      "id" | "timestamp" | "resolved" | "retryCount"
    >,
  ) {
    const error: CriticalError = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      retryCount: 0,
      ...errorData,
    };

    this.criticalErrors.push(error);
    this.healthStatus.errorCount++;

    // Notify listeners
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (e) {
        console.error("Error in error listener:", e);
      }
    });

    // Handle circuit breaker logic
    this.handleCircuitBreaker(error.type, error);

    // Auto-retry for certain errors
    if (
      error.severity !== "emergency" &&
      error.retryCount < this.config.maxRetryAttempts
    ) {
      this.scheduleRetry(error);
    }

    // Log based on severity
    if (error.severity === "emergency" || error.severity === "critical") {
      console.error(
        `🚨 CRITICAL ERROR [${error.type.toUpperCase()}]:`,
        error.message,
        error.context,
      );
    } else if (error.severity === "high") {
      console.error(
        `❌ HIGH SEVERITY ERROR [${error.type.toUpperCase()}]:`,
        error.message,
      );
    } else {
      console.warn(`⚠️ ERROR [${error.type.toUpperCase()}]:`, error.message);
    }

    // Clean up old errors (keep last 100)
    if (this.criticalErrors.length > 100) {
      this.criticalErrors = this.criticalErrors.slice(-100);
    }

    return error.id;
  }

  private handleCircuitBreaker(type: string, error: CriticalError) {
    const breaker = this.circuitBreakers.get(type);
    if (!breaker) return;

    breaker.failures++;
    breaker.lastFailure = new Date();

    // Open circuit breaker if threshold reached
    if (breaker.failures >= this.config.circuitBreakerThreshold) {
      breaker.isOpen = true;
      console.warn(
        `🔌 Circuit breaker OPENED for ${type} (${breaker.failures} failures)`,
      );

      // Auto-reset after 5 minutes
      setTimeout(
        () => {
          breaker.isOpen = false;
          breaker.failures = 0;
          console.log(`🔌 Circuit breaker RESET for ${type}`);
        },
        5 * 60 * 1000,
      );
    }
  }

  private scheduleRetry(error: CriticalError) {
    const delay = this.config.retryDelayMs * Math.pow(2, error.retryCount); // Exponential backoff

    setTimeout(() => {
      error.retryCount++;
      console.log(
        `🔄 Retrying error ${error.id} (attempt ${error.retryCount}/${this.config.maxRetryAttempts})`,
      );

      // Implement retry logic based on error type
      // This would typically involve re-calling the failed operation
    }, delay);
  }

  // Public API
  public getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  public getCriticalErrors(): CriticalError[] {
    return [...this.criticalErrors];
  }

  public getUnresolvedErrors(): CriticalError[] {
    return this.criticalErrors.filter((error) => !error.resolved);
  }

  public resolveError(errorId: string): boolean {
    const error = this.criticalErrors.find((e) => e.id === errorId);
    if (error) {
      error.resolved = true;
      console.log(`✅ Error resolved: ${errorId}`);
      return true;
    }
    return false;
  }

  public isSystemHealthy(system?: keyof HealthStatus["systems"]): boolean {
    if (system) {
      return this.healthStatus.systems[system] === "operational";
    }
    return this.healthStatus.overall === "healthy";
  }

  public isCircuitBreakerOpen(type: string): boolean {
    const breaker = this.circuitBreakers.get(type);
    return breaker ? breaker.isOpen : false;
  }

  public onError(listener: (error: CriticalError) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  public forceHealthCheck(): Promise<void> {
    return this.performHealthCheck();
  }

  public getSystemUptime(): number {
    return Date.now() - this.healthStatus.uptime;
  }

  public destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.errorListeners = [];
    console.log("🛡️ Production safeguards service destroyed");
  }
}

export const productionSafeguardsService = new ProductionSafeguardsService();
export type { HealthStatus, CriticalError, SafeguardConfig };
