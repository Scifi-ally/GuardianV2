interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  batteryLevel?: number;
  locationAccuracy: number;
  frameRate: number;
  lastUpdated: Date;
}

interface PerformanceThresholds {
  maxLoadTime: number;
  maxRenderTime: number;
  maxMemoryUsage: number;
  maxNetworkLatency: number;
  minBatteryLevel: number;
  minLocationAccuracy: number;
  minFrameRate: number;
}

interface OptimizationState {
  reducedAnimations: boolean;
  backgroundSyncDisabled: boolean;
  highFrequencyUpdatesDisabled: boolean;
  nonEssentialFeaturesDisabled: boolean;
  lowQualityMapsEnabled: boolean;
  cachingMaximized: boolean;
  batteryOptimizationActive: boolean;
}

class ProductionPerformanceService {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    locationAccuracy: 0,
    frameRate: 60,
    lastUpdated: new Date(),
  };

  private thresholds: PerformanceThresholds = {
    maxLoadTime: 3000, // 3 seconds
    maxRenderTime: 16, // 16ms for 60fps
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxNetworkLatency: 2000, // 2 seconds
    minBatteryLevel: 20, // 20%
    minLocationAccuracy: 100, // 100 meters
    minFrameRate: 30, // 30fps minimum
  };

  private optimizationState: OptimizationState = {
    reducedAnimations: false,
    backgroundSyncDisabled: false,
    highFrequencyUpdatesDisabled: false,
    nonEssentialFeaturesDisabled: false,
    lowQualityMapsEnabled: false,
    cachingMaximized: false,
    batteryOptimizationActive: false,
  };

  private performanceObserver?: PerformanceObserver;
  private frameCount = 0;
  private lastFrameTime = 0;
  private monitoringActive = false;
  private criticalResourcesLoaded = false;

  constructor() {
    this.initializePerformanceMonitoring();
    this.setupCriticalResourceLoading();
    this.initializeProductionOptimizations();
  }

  private initializePerformanceMonitoring() {
    // Monitor load performance
    this.measureLoadTime();

    // Monitor render performance
    this.setupFrameRateMonitoring();

    // Monitor memory usage
    this.setupMemoryMonitoring();

    // Monitor network performance
    this.setupNetworkMonitoring();

    // Setup performance observer for production metrics
    if ("PerformanceObserver" in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === "navigation") {
            this.metrics.loadTime = entry.duration;
          } else if (entry.entryType === "measure") {
            if (entry.name.includes("render")) {
              this.metrics.renderTime = entry.duration;
            }
          }
        });
      });

      this.performanceObserver.observe({
        entryTypes: ["navigation", "measure", "resource"],
      });
    }

    console.log("🚀 Production Performance Monitoring initialized");
  }

  private setupCriticalResourceLoading() {
    // Preload critical resources for emergency scenarios
    const criticalResources = [
      // Emergency service worker
      "/sw.js",
      // Critical CSS
      "/emergency.css",
      // Location services
      "/location-worker.js",
    ];

    // Service worker registration for offline support
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("🔧 Service Worker registered for offline support");
          this.criticalResourcesLoaded = true;
        })
        .catch((error) => {
          console.warn("Service Worker registration failed:", error);
        });
    }

    // Preload critical resources
    criticalResources.forEach((resource) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = resource;
      link.as = resource.endsWith(".js") ? "script" : "style";
      document.head.appendChild(link);
    });
  }

  private initializeProductionOptimizations() {
    // Enable production optimizations immediately
    this.enableProductionMode();

    // Setup automatic optimization based on device capabilities
    this.setupDeviceCapabilityOptimizations();

    // Setup battery-aware optimizations
    this.setupBatteryOptimizations();

    // Setup connection-aware optimizations
    this.setupConnectionOptimizations();
  }

  private enableProductionMode() {
    // Remove development-only features
    if (import.meta.env.PROD) {
      // Disable console logs in production (keep errors and warnings)
      const originalLog = console.log;
      console.log = (...args) => {
        // Only log emergency and critical information in production
        if (
          args.some(
            (arg) =>
              typeof arg === "string" &&
              (arg.includes("🚨") ||
                arg.includes("EMERGENCY") ||
                arg.includes("CRITICAL")),
          )
        ) {
          originalLog(...args);
        }
      };

      // Enable aggressive caching
      this.optimizationState.cachingMaximized = true;

      console.warn("🏭 Production mode optimizations enabled");
    }

    // Critical performance optimizations for all environments
    this.enableCriticalOptimizations();
  }

  private enableCriticalOptimizations() {
    // Optimize DOM updates
    this.setupDOMOptimizations();

    // Optimize image loading
    this.setupImageOptimizations();

    // Setup memory leak prevention
    this.setupMemoryLeakPrevention();

    // Optimize event listeners
    this.setupEventOptimizations();
  }

  private setupDOMOptimizations() {
    // Use requestAnimationFrame for DOM updates
    let rafId: number;
    const optimizedUpdateQueue: (() => void)[] = [];

    (window as any).optimizedDOMUpdate = (callback: () => void) => {
      optimizedUpdateQueue.push(callback);

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          // Batch DOM updates
          const updates = [...optimizedUpdateQueue];
          optimizedUpdateQueue.length = 0;

          updates.forEach((update) => {
            try {
              update();
            } catch (error) {
              console.error("DOM update error:", error);
            }
          });

          rafId = 0;
        });
      }
    };

    // Optimize scroll performance
    let ticking = false;
    const optimizeScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Handle scroll events efficiently
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", optimizeScroll, { passive: true });
  }

  private setupImageOptimizations() {
    // Lazy load images with intersection observer
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute("data-src");
              imageObserver.unobserve(img);
            }
          }
        });
      },
      { rootMargin: "50px" },
    );

    // Observe all images with data-src
    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img);
    });

    // Setup responsive image loading
    (window as any).optimizedImageLoader = imageObserver;
  }

  private setupMemoryLeakPrevention() {
    // Track and cleanup event listeners
    const eventListeners: Array<{
      element: EventTarget;
      event: string;
      handler: EventListener;
    }> = [];

    (window as any).addOptimizedEventListener = (
      element: EventTarget,
      event: string,
      handler: EventListener,
      options?: boolean | AddEventListenerOptions,
    ) => {
      element.addEventListener(event, handler, options);
      eventListeners.push({ element, event, handler });
    };

    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
      eventListeners.forEach(({ element, event, handler }) => {
        try {
          element.removeEventListener(event, handler);
        } catch (error) {
          console.warn("Failed to remove event listener:", error);
        }
      });
    });

    // Monitor memory usage and trigger cleanup
    setInterval(() => {
      if ((performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        this.metrics.memoryUsage = memoryInfo.usedJSHeapSize;

        // Trigger garbage collection if memory usage is high
        if (memoryInfo.usedJSHeapSize > this.thresholds.maxMemoryUsage * 0.8) {
          this.triggerMemoryCleanup();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private setupEventOptimizations() {
    // Debounce and throttle utilities
    (window as any).debounce = (func: Function, wait: number) => {
      let timeout: NodeJS.Timeout;
      return function executedFunction(...args: any[]) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    (window as any).throttle = (func: Function, limit: number) => {
      let inThrottle: boolean;
      return function (...args: any[]) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    };
  }

  private setupDeviceCapabilityOptimizations() {
    // Detect device capabilities
    const deviceCapabilities = {
      isLowEnd: this.isLowEndDevice(),
      isSlowNetwork: this.isSlowNetwork(),
      hasLimitedMemory: this.hasLimitedMemory(),
      isBatteryConstrained: this.isBatteryConstrained(),
    };

    // Apply optimizations based on device capabilities
    if (deviceCapabilities.isLowEnd) {
      this.enableLowEndDeviceOptimizations();
    }

    if (deviceCapabilities.isSlowNetwork) {
      this.enableSlowNetworkOptimizations();
    }

    if (deviceCapabilities.hasLimitedMemory) {
      this.enableMemoryConstrainedOptimizations();
    }

    console.log(
      "📱 Device capability optimizations applied:",
      deviceCapabilities,
    );
  }

  private isLowEndDevice(): boolean {
    // Detect low-end devices based on hardware concurrency and memory
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const deviceMemory = (navigator as any).deviceMemory || 0;

    return hardwareConcurrency <= 2 || deviceMemory <= 2;
  }

  private isSlowNetwork(): boolean {
    const connection = (navigator as any).connection;
    if (connection) {
      const slowNetworkTypes = ["slow-2g", "2g"];
      const effectiveType = connection.effectiveType;
      return slowNetworkTypes.includes(effectiveType) || connection.saveData;
    }
    return false;
  }

  private hasLimitedMemory(): boolean {
    const deviceMemory = (navigator as any).deviceMemory;
    return deviceMemory && deviceMemory <= 4; // 4GB or less
  }

  private isBatteryConstrained(): boolean {
    // This will be set by battery optimization service
    return this.optimizationState.batteryOptimizationActive;
  }

  private enableLowEndDeviceOptimizations() {
    this.optimizationState.reducedAnimations = true;
    this.optimizationState.lowQualityMapsEnabled = true;
    this.optimizationState.highFrequencyUpdatesDisabled = true;

    // Apply CSS class for reduced animations
    document.body.classList.add("reduced-motion", "low-end-device");

    console.log("🐌 Low-end device optimizations enabled");
  }

  private enableSlowNetworkOptimizations() {
    this.optimizationState.backgroundSyncDisabled = true;
    this.optimizationState.cachingMaximized = true;

    // Preload critical resources only
    document.body.classList.add("slow-network");

    console.log("🐢 Slow network optimizations enabled");
  }

  private enableMemoryConstrainedOptimizations() {
    this.optimizationState.nonEssentialFeaturesDisabled = true;

    // Limit cached data
    this.triggerMemoryCleanup();

    console.log("🧠 Memory constrained optimizations enabled");
  }

  private setupBatteryOptimizations() {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryOptimizations = () => {
          this.metrics.batteryLevel = battery.level * 100;

          if (this.metrics.batteryLevel < this.thresholds.minBatteryLevel) {
            this.enableBatteryOptimizations();
          } else {
            this.disableBatteryOptimizations();
          }
        };

        // Monitor battery level changes
        battery.addEventListener("levelchange", updateBatteryOptimizations);
        battery.addEventListener("chargingchange", updateBatteryOptimizations);

        // Initial check
        updateBatteryOptimizations();
      });
    }
  }

  private enableBatteryOptimizations() {
    if (!this.optimizationState.batteryOptimizationActive) {
      this.optimizationState.batteryOptimizationActive = true;
      this.optimizationState.reducedAnimations = true;
      this.optimizationState.backgroundSyncDisabled = true;
      this.optimizationState.highFrequencyUpdatesDisabled = true;

      document.body.classList.add("battery-saver");

      // Dispatch event for other services
      window.dispatchEvent(
        new CustomEvent("battery-optimization-enabled", {
          detail: { batteryLevel: this.metrics.batteryLevel },
        }),
      );

      console.log("🔋 Battery optimization enabled");
    }
  }

  private disableBatteryOptimizations() {
    if (this.optimizationState.batteryOptimizationActive) {
      this.optimizationState.batteryOptimizationActive = false;

      // Only disable optimizations if not needed for other reasons
      if (!this.isLowEndDevice() && !this.hasLimitedMemory()) {
        this.optimizationState.reducedAnimations = false;
        this.optimizationState.backgroundSyncDisabled = false;
        this.optimizationState.highFrequencyUpdatesDisabled = false;

        document.body.classList.remove("battery-saver");
      }

      window.dispatchEvent(new CustomEvent("battery-optimization-disabled"));

      console.log("🔋 Battery optimization disabled");
    }
  }

  private setupConnectionOptimizations() {
    const connection = (navigator as any).connection;
    if (connection) {
      const updateConnectionOptimizations = () => {
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink;

        // Enable optimizations for slow connections
        if (
          effectiveType === "slow-2g" ||
          effectiveType === "2g" ||
          downlink < 1
        ) {
          this.enableSlowNetworkOptimizations();
        }

        // Data saver mode
        if (connection.saveData) {
          this.optimizationState.nonEssentialFeaturesDisabled = true;
          this.optimizationState.lowQualityMapsEnabled = true;
        }
      };

      connection.addEventListener("change", updateConnectionOptimizations);
      updateConnectionOptimizations();
    }
  }

  private measureLoadTime() {
    const startTime = performance.now();

    window.addEventListener("load", () => {
      this.metrics.loadTime = performance.now() - startTime;
      console.log(`⏱️ Page load time: ${this.metrics.loadTime.toFixed(2)}ms`);

      // If load time is too high, enable optimizations
      if (this.metrics.loadTime > this.thresholds.maxLoadTime) {
        this.enableSlowNetworkOptimizations();
      }
    });
  }

  private setupFrameRateMonitoring() {
    const measureFrameRate = () => {
      const now = performance.now();
      this.frameCount++;

      if (this.lastFrameTime) {
        const delta = now - this.lastFrameTime;
        this.metrics.frameRate = 1000 / delta;

        // If frame rate is too low, enable optimizations
        if (this.metrics.frameRate < this.thresholds.minFrameRate) {
          this.enableLowEndDeviceOptimizations();
        }
      }

      this.lastFrameTime = now;

      if (this.monitoringActive) {
        requestAnimationFrame(measureFrameRate);
      }
    };

    this.monitoringActive = true;
    requestAnimationFrame(measureFrameRate);
  }

  private setupMemoryMonitoring() {
    if ((performance as any).memory) {
      setInterval(() => {
        const memoryInfo = (performance as any).memory;
        this.metrics.memoryUsage = memoryInfo.usedJSHeapSize;

        // If memory usage is high, trigger cleanup
        if (memoryInfo.usedJSHeapSize > this.thresholds.maxMemoryUsage) {
          this.triggerMemoryCleanup();
        }
      }, 15000); // Check every 15 seconds
    }
  }

  private setupNetworkMonitoring() {
    // Monitor network performance
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      setInterval(() => {
        this.metrics.networkLatency = connection.rtt || 0;
      }, 10000); // Check every 10 seconds
    }
  }

  private triggerMemoryCleanup() {
    // Clear caches
    if ("caches" in window) {
      caches.keys().then((names) => {
        // Keep only essential caches
        const essentialCaches = ["emergency-cache", "location-cache"];
        names.forEach((name) => {
          if (!essentialCaches.includes(name)) {
            caches.delete(name);
          }
        });
      });
    }

    // Clear localStorage of non-essential data
    const essentialKeys = [
      "emergencyContacts",
      "lastKnownLocation",
      "accessibilitySettings",
      "batteryOptimizations",
    ];

    Object.keys(localStorage).forEach((key) => {
      if (!essentialKeys.some((essential) => key.includes(essential))) {
        localStorage.removeItem(key);
      }
    });

    // Trigger garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }

    console.log("🧹 Memory cleanup performed");
  }

  // Public API
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getOptimizationState(): OptimizationState {
    return { ...this.optimizationState };
  }

  public forceOptimization(type: keyof OptimizationState, enabled: boolean) {
    this.optimizationState[type] = enabled;

    // Apply the optimization
    switch (type) {
      case "reducedAnimations":
        document.body.classList.toggle("reduced-motion", enabled);
        break;
      case "lowQualityMapsEnabled":
        window.dispatchEvent(
          new CustomEvent("map-quality-change", {
            detail: { lowQuality: enabled },
          }),
        );
        break;
      case "batteryOptimizationActive":
        if (enabled) {
          this.enableBatteryOptimizations();
        } else {
          this.disableBatteryOptimizations();
        }
        break;
    }

    console.log(`🔧 ${type} optimization ${enabled ? "enabled" : "disabled"}`);
  }

  public isOptimizationActive(type: keyof OptimizationState): boolean {
    return this.optimizationState[type];
  }

  public getPerformanceReport(): {
    overall: "excellent" | "good" | "fair" | "poor";
    metrics: PerformanceMetrics;
    optimizations: OptimizationState;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let score = 100;

    // Analyze load time
    if (this.metrics.loadTime > this.thresholds.maxLoadTime) {
      score -= 20;
      recommendations.push("Reduce page load time");
    }

    // Analyze frame rate
    if (this.metrics.frameRate < this.thresholds.minFrameRate) {
      score -= 15;
      recommendations.push("Improve rendering performance");
    }

    // Analyze memory usage
    if (this.metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      score -= 15;
      recommendations.push("Reduce memory usage");
    }

    // Analyze network latency
    if (this.metrics.networkLatency > this.thresholds.maxNetworkLatency) {
      score -= 10;
      recommendations.push("Optimize network requests");
    }

    // Analyze battery level
    if (
      this.metrics.batteryLevel &&
      this.metrics.batteryLevel < this.thresholds.minBatteryLevel
    ) {
      score -= 10;
      recommendations.push("Enable battery saving mode");
    }

    const overall: "excellent" | "good" | "fair" | "poor" =
      score >= 90
        ? "excellent"
        : score >= 70
          ? "good"
          : score >= 50
            ? "fair"
            : "poor";

    return {
      overall,
      metrics: this.metrics,
      optimizations: this.optimizationState,
      recommendations,
    };
  }

  public destroy() {
    this.monitoringActive = false;
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

export const productionPerformanceService = new ProductionPerformanceService();
export type { PerformanceMetrics, OptimizationState };
