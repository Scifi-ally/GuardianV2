/**
 * Performance Optimization Service
 * Makes everything load quickly with dynamic resource management
 */

import { unifiedNotifications } from "./unifiedNotificationService";
import { batteryOptimizationService } from "./batteryOptimizationService";

interface PerformanceMetrics {
  fps: number;
  memory: number;
  battery: number;
  connection: "slow" | "medium" | "fast";
  deviceType: "mobile" | "tablet" | "desktop";
  loadTime: number;
  renderTime: number;
}

interface OptimizationConfig {
  lazyLoadThreshold: number;
  imageQuality: "low" | "medium" | "high";
  animationLevel: "none" | "reduced" | "full";
  cacheStrategy: "aggressive" | "normal" | "minimal";
  preloadLevel: "essential" | "important" | "all";
}

class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private metrics: PerformanceMetrics;
  private config: OptimizationConfig;
  private observers: Map<string, IntersectionObserver> = new Map();
  private resourceCache: Map<string, any> = new Map();
  private preloadQueue: string[] = [];
  private isOptimizing = false;

  constructor() {
    this.metrics = this.getInitialMetrics();
    this.config = this.getOptimalConfig();
    this.initializeOptimizations();
  }

  static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance =
        new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  private getInitialMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      memory: this.getMemoryInfo(),
      battery: 100,
      connection: this.getConnectionSpeed(),
      deviceType: this.getDeviceType(),
      loadTime: 0,
      renderTime: 0,
    };
  }

  private getOptimalConfig(): OptimizationConfig {
    const { deviceType, connection } = this.metrics;

    if (deviceType === "mobile" || connection === "slow") {
      return {
        lazyLoadThreshold: 50,
        imageQuality: "medium",
        animationLevel: "reduced",
        cacheStrategy: "aggressive",
        preloadLevel: "essential",
      };
    } else if (deviceType === "tablet" || connection === "medium") {
      return {
        lazyLoadThreshold: 100,
        imageQuality: "high",
        animationLevel: "reduced",
        cacheStrategy: "normal",
        preloadLevel: "important",
      };
    } else {
      return {
        lazyLoadThreshold: 200,
        imageQuality: "high",
        animationLevel: "full",
        cacheStrategy: "normal",
        preloadLevel: "all",
      };
    }
  }

  private initializeOptimizations() {
    this.setupResourceCaching();
    this.setupLazyLoading();
    this.setupDynamicImports();
    this.setupPerformanceMonitoring();
    this.preloadCriticalResources();
  }

  // Resource Caching
  private setupResourceCaching() {
    // Service Worker for aggressive caching
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("🚀 Service Worker registered for caching");
        })
        .catch((error) => {
          console.warn("Service Worker registration failed:", error);
        });
    }

    // Memory cache for API responses
    this.interceptFetchRequests();
  }

  private interceptFetchRequests() {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = input.toString();

      // Check cache first for API responses
      if (this.shouldCache(url)) {
        const cached = this.resourceCache.get(url);
        if (cached && !this.isCacheExpired(cached)) {
          return Promise.resolve(cached.response.clone());
        }
      }

      const response = await originalFetch(input, init);

      // Cache successful responses
      if (response.ok && this.shouldCache(url)) {
        this.resourceCache.set(url, {
          response: response.clone(),
          timestamp: Date.now(),
          ttl: this.getCacheTTL(url),
        });
      }

      return response;
    };
  }

  private shouldCache(url: string): boolean {
    const cacheablePatterns = [
      "/api/",
      "/assets/",
      ".json",
      ".svg",
      ".png",
      ".jpg",
      ".webp",
    ];
    return cacheablePatterns.some((pattern) => url.includes(pattern));
  }

  private isCacheExpired(cached: any): boolean {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  private getCacheTTL(url: string): number {
    if (url.includes("/api/")) return 5 * 60 * 1000; // 5 minutes for API
    if (url.includes("/assets/")) return 24 * 60 * 60 * 1000; // 24 hours for assets
    return 15 * 60 * 1000; // 15 minutes default
  }

  // Lazy Loading
  private setupLazyLoading() {
    // Images
    this.setupImageLazyLoading();

    // Components
    this.setupComponentLazyLoading();

    // Data
    this.setupDataLazyLoading();
  }

  private setupImageLazyLoading() {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute("data-src");
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: `${this.config.lazyLoadThreshold}px`,
      },
    );

    this.observers.set("images", imageObserver);

    // Apply to existing images
    this.applyImageLazyLoading();
  }

  private applyImageLazyLoading() {
    const images = document.querySelectorAll("img[data-src]");
    images.forEach((img) => {
      this.observers.get("images")?.observe(img);
    });
  }

  private setupComponentLazyLoading() {
    // Lazy load non-critical components
    const componentObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const componentName = element.dataset.lazyComponent;
            if (componentName) {
              this.loadComponent(componentName, element);
              componentObserver.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: "100px",
      },
    );

    this.observers.set("components", componentObserver);
  }

  private async loadComponent(componentName: string, element: HTMLElement) {
    try {
      const startTime = performance.now();

      // Dynamic import based on component name
      let component;
      switch (componentName) {
        case "EmergencyServicesPanel":
          component = await import("@/components/EmergencyServicesPanel");
          break;
        case "LocationAwareMap":
          component = await import("@/components/LocationAwareMap");
          break;
        case "AdvancedSettingsModal":
          component = await import("@/components/AdvancedSettingsModal");
          break;
        default:
          console.warn(`Unknown component: ${componentName}`);
          return;
      }

      const loadTime = performance.now() - startTime;
      console.log(
        `📦 Lazy loaded ${componentName} in ${loadTime.toFixed(2)}ms`,
      );

      // Trigger re-render or update
      element.dispatchEvent(
        new CustomEvent("componentLoaded", { detail: { componentName } }),
      );
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
    }
  }

  private setupDataLazyLoading() {
    // Lazy load data when components need it
    this.setupIntersectionBasedDataLoading();
  }

  private setupIntersectionBasedDataLoading() {
    const dataObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const dataEndpoint = element.dataset.lazyData;
            if (dataEndpoint) {
              this.loadData(dataEndpoint, element);
              dataObserver.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: "50px",
      },
    );

    this.observers.set("data", dataObserver);
  }

  private async loadData(endpoint: string, element: HTMLElement) {
    try {
      const startTime = performance.now();
      const response = await fetch(endpoint);
      const data = await response.json();
      const loadTime = performance.now() - startTime;

      console.log(
        `📊 Lazy loaded data from ${endpoint} in ${loadTime.toFixed(2)}ms`,
      );

      // Trigger data loaded event
      element.dispatchEvent(
        new CustomEvent("dataLoaded", { detail: { data, endpoint } }),
      );
    } catch (error) {
      console.error(`Failed to load data from ${endpoint}:`, error);
    }
  }

  // Dynamic Imports
  private setupDynamicImports() {
    // Preload critical modules
    this.preloadCriticalModules();

    // Setup route-based code splitting
    this.setupRouteSplitting();
  }

  private preloadCriticalModules() {
    const criticalModules = [
      "@/services/enhancedLocationService",
      "@/services/emergencyContactActionsService",
      "@/components/MagicNavbar",
    ];

    criticalModules.forEach((module) => {
      this.preloadQueue.push(module);
    });

    this.processPreloadQueue();
  }

  private async processPreloadQueue() {
    while (this.preloadQueue.length > 0) {
      const module = this.preloadQueue.shift();
      if (module) {
        try {
          await import(module);
          console.log(`⚡ Preloaded module: ${module}`);
        } catch (error) {
          console.warn(`Failed to preload module ${module}:`, error);
        }
      }
    }
  }

  private setupRouteSplitting() {
    // Preload next likely route based on current route
    const currentPath = window.location.pathname;
    let nextRoute = "/";

    switch (currentPath) {
      case "/":
        nextRoute = "/profile";
        break;
      case "/profile":
        nextRoute = "/settings";
        break;
      case "/settings":
        nextRoute = "/";
        break;
    }

    // Preload the next route's components
    setTimeout(() => {
      this.preloadRoute(nextRoute);
    }, 2000);
  }

  private async preloadRoute(route: string) {
    try {
      switch (route) {
        case "/profile":
          await import("@/pages/Profile");
          break;
        case "/settings":
          await import("@/pages/Settings");
          break;
        case "/":
          await import("@/pages/Index");
          break;
      }
      console.log(`🗺️ Preloaded route: ${route}`);
    } catch (error) {
      console.warn(`Failed to preload route ${route}:`, error);
    }
  }

  // Performance Monitoring
  private setupPerformanceMonitoring() {
    // Monitor FPS
    this.monitorFPS();

    // Monitor memory usage
    this.monitorMemory();

    // Monitor battery
    this.monitorBattery();

    // Monitor network
    this.monitorNetwork();

    // Record performance snapshots every 30 seconds
    setInterval(() => {
      this.recordPerformanceSnapshot();
    }, 30000);
  }

  private monitorFPS() {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = Math.round(
          (frameCount * 1000) / (currentTime - lastTime),
        );
        frameCount = 0;
        lastTime = currentTime;

        // Adapt based on FPS
        if (this.metrics.fps < 30) {
          this.reducePerfomanceLoad();
        } else if (this.metrics.fps > 55) {
          this.increasePerfomanceAllowance();
        }
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  private monitorMemory() {
    if ("memory" in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memory = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        if (this.metrics.memory > 0.8) {
          this.triggerMemoryCleanup();
        }
      }, 5000);
    }
  }

  private async monitorBattery() {
    if ("getBattery" in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        this.metrics.battery = battery.level * 100;

        battery.addEventListener("levelchange", () => {
          this.metrics.battery = battery.level * 100;
          this.adaptToBatteryLevel();
        });
      } catch (error) {
        console.warn("Battery monitoring not available:", error);
      }
    }
  }

  private monitorNetwork() {
    if ("connection" in navigator) {
      const updateConnection = () => {
        const connection = (navigator as any).connection;
        switch (connection.effectiveType) {
          case "slow-2g":
          case "2g":
            this.metrics.connection = "slow";
            break;
          case "3g":
            this.metrics.connection = "medium";
            break;
          case "4g":
          default:
            this.metrics.connection = "fast";
            break;
        }
        this.adaptToConnection();
      };

      updateConnection();
      (navigator as any).connection.addEventListener(
        "change",
        updateConnection,
      );
    }
  }

  // Performance Adaptations
  private reducePerfomanceLoad() {
    if (this.isOptimizing) return;
    this.isOptimizing = true;

    console.log("📉 Reducing performance load due to low FPS");

    // Reduce animation quality
    document.body.classList.add("reduce-animations");

    // Reduce image quality
    this.config.imageQuality = "low";

    // Increase cache aggressiveness
    this.config.cacheStrategy = "aggressive";

    setTimeout(() => {
      this.isOptimizing = false;
    }, 5000);
  }

  private increasePerfomanceAllowance() {
    if (this.isOptimizing) return;

    console.log("📈 Increasing performance allowance due to good FPS");

    // Restore animation quality
    document.body.classList.remove("reduce-animations");

    // Restore image quality
    this.config.imageQuality = "high";
  }

  private triggerMemoryCleanup() {
    console.log("🧹 Triggering memory cleanup");

    // Clear old cache entries
    const now = Date.now();
    for (const [key, cached] of this.resourceCache.entries()) {
      if (this.isCacheExpired(cached)) {
        this.resourceCache.delete(key);
      }
    }

    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  private adaptToBatteryLevel() {
    if (this.metrics.battery < 20) {
      batteryOptimizationService.enableBatterySaverMode(true);
      this.config.animationLevel = "none";
      this.config.preloadLevel = "essential";
    } else if (this.metrics.battery < 50) {
      this.config.animationLevel = "reduced";
      this.config.preloadLevel = "important";
    } else {
      batteryOptimizationService.enableBatterySaverMode(false);
      this.config.animationLevel = "full";
      this.config.preloadLevel = "all";
    }
  }

  private adaptToConnection() {
    switch (this.metrics.connection) {
      case "slow":
        this.config.imageQuality = "low";
        this.config.preloadLevel = "essential";
        this.config.cacheStrategy = "aggressive";
        break;
      case "medium":
        this.config.imageQuality = "medium";
        this.config.preloadLevel = "important";
        this.config.cacheStrategy = "normal";
        break;
      case "fast":
        this.config.imageQuality = "high";
        this.config.preloadLevel = "all";
        this.config.cacheStrategy = "normal";
        break;
    }
  }

  // Utility methods
  private getMemoryInfo(): number {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Return MB instead of ratio
    }

    // Enhanced fallback using performance timing
    try {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;

      // Estimate memory usage based on load time (rough heuristic)
      const estimatedMemory = Math.min(100, Math.max(20, loadTime / 10));
      return estimatedMemory;
    } catch (error) {
      return 50; // Fallback estimate in MB
    }
  }

  private getConnectionSpeed(): "slow" | "medium" | "fast" {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      switch (connection.effectiveType) {
        case "slow-2g":
        case "2g":
          return "slow";
        case "3g":
          return "medium";
        case "4g":
        default:
          return "fast";
      }
    }
    return "medium"; // Default
  }

  private getDeviceType(): "mobile" | "tablet" | "desktop" {
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  // Critical resource preloading with real asset optimization
  private preloadCriticalResources() {
    const criticalResources = this.identifyRealCriticalResources();

    criticalResources.forEach((resource) => {
      this.preloadResourceWithFallback(resource);
    });
  }

  private identifyRealCriticalResources(): string[] {
    const resources = [];

    // Identify actual critical resources from DOM
    const criticalImages = document.querySelectorAll(
      'img[loading="eager"], img[data-critical]',
    );
    criticalImages.forEach((img) => {
      const src = (img as HTMLImageElement).src;
      if (src && !src.startsWith("data:")) {
        resources.push(src);
      }
    });

    // Add critical API endpoints
    resources.push("/api/health", "/api/user/profile");

    // Add critical CSS/JS that's not already loaded
    const criticalStylesheets = document.querySelectorAll(
      'link[rel="stylesheet"][data-critical]',
    );
    criticalStylesheets.forEach((link) => {
      const href = (link as HTMLLinkElement).href;
      if (href) resources.push(href);
    });

    return resources;
  }

  private preloadResourceWithFallback(resource: string) {
    try {
      // Determine the correct 'as' attribute based on resource type
      let asType = "fetch";
      if (resource.includes(".css")) asType = "style";
      else if (resource.includes(".js")) asType = "script";
      else if (resource.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i))
        asType = "image";
      else if (resource.match(/\.(woff|woff2|ttf|otf)$/i)) asType = "font";

      const link = document.createElement("link");
      link.rel = "preload";
      link.href = resource;
      link.as = asType;

      // Add crossorigin for fonts
      if (asType === "font") {
        link.crossOrigin = "anonymous";
      }

      // Add error handling
      link.onerror = () => {
        console.warn(`Failed to preload resource: ${resource}`);
      };

      link.onload = () => {
        console.log(`✅ Preloaded: ${resource}`);
      };

      document.head.appendChild(link);

      // Use fetch as fallback for API endpoints
      if (resource.startsWith("/api/")) {
        fetch(resource, { method: "HEAD" })
          .then(() => console.log(`📡 API endpoint warmed: ${resource}`))
          .catch(() => console.warn(`API endpoint unavailable: ${resource}`));
      }
    } catch (error) {
      console.warn(`Preload failed for ${resource}:`, error);
    }
  }

  // Enhanced Public API with real-time monitoring
  enableLazyLoading(element: HTMLElement) {
    const observer = this.observers.get("images");
    if (observer) {
      observer.observe(element);

      // Track lazy loading effectiveness
      this.trackLazyLoadingMetrics(element);
    }
  }

  preloadResource(url: string) {
    this.preloadQueue.push(url);
    this.processPreloadQueue();
  }

  getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      memoryPressure: this.calculateMemoryPressure(),
      networkEffectiveType: this.getNetworkEffectiveType(),
      isLowEndDevice: this.isLowEndDevice(),
    };
  }

  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  getRealTimePerformanceReport() {
    return {
      metrics: this.getMetrics(),
      config: this.getConfig(),
      optimizations: this.getActiveOptimizations(),
      recommendations: this.generatePerformanceRecommendations(),
      historicalData: this.getPerformanceHistory(),
    };
  }

  private trackLazyLoadingMetrics(element: HTMLElement) {
    const startTime = performance.now();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const loadTime = performance.now() - startTime;
          console.log(`📊 Lazy load triggered in ${loadTime.toFixed(2)}ms`);
          observer.disconnect();
        }
      });
    });

    observer.observe(element);
  }

  private calculateMemoryPressure(): "low" | "medium" | "high" {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      const pressure = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      if (pressure > 0.8) return "high";
      if (pressure > 0.6) return "medium";
      return "low";
    }
    return "medium";
  }

  private getNetworkEffectiveType(): string {
    if ("connection" in navigator) {
      return (navigator as any).connection.effectiveType || "unknown";
    }
    return "unknown";
  }

  private isLowEndDevice(): boolean {
    // Detect low-end devices based on multiple factors
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    return deviceMemory <= 2 || hardwareConcurrency <= 2;
  }

  private getActiveOptimizations(): string[] {
    const optimizations = [];

    if (this.config.lazyLoadThreshold < 100)
      optimizations.push("Aggressive lazy loading");
    if (this.config.imageQuality === "low")
      optimizations.push("Reduced image quality");
    if (this.config.animationLevel === "none")
      optimizations.push("Disabled animations");
    if (this.config.cacheStrategy === "aggressive")
      optimizations.push("Aggressive caching");

    return optimizations;
  }

  private generatePerformanceRecommendations(): string[] {
    const recommendations = [];
    const metrics = this.metrics;

    if (metrics.fps < 30) {
      recommendations.push(
        "Consider reducing visual effects for better performance",
      );
    }

    if (metrics.memory > 100) {
      recommendations.push(
        "High memory usage detected - consider closing unused tabs",
      );
    }

    if (metrics.connection === "slow") {
      recommendations.push(
        "Slow connection detected - enabling data saver mode",
      );
    }

    if (metrics.battery < 20) {
      recommendations.push("Low battery - enabling power saving optimizations");
    }

    return recommendations;
  }

  private getPerformanceHistory(): any[] {
    // Return last 10 performance snapshots
    return this.performanceHistory?.slice(-10) || [];
  }

  // Add performance history tracking
  private performanceHistory: any[] = [];

  private recordPerformanceSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      config: { ...this.config },
    };

    this.performanceHistory.push(snapshot);

    // Keep only last 50 snapshots
    if (this.performanceHistory.length > 50) {
      this.performanceHistory.shift();
    }
  }

  optimizeForEmergency() {
    // Emergency mode - maximum performance
    this.config = {
      lazyLoadThreshold: 0,
      imageQuality: "low",
      animationLevel: "none",
      cacheStrategy: "aggressive",
      preloadLevel: "essential",
    };

    // Preload emergency components
    this.preloadQueue.push("@/components/EmergencyServicesPanel");
    this.preloadQueue.push("@/services/sosService");
    this.processPreloadQueue();

    console.log("🚨 Performance optimized for emergency mode");
  }
}

export const performanceOptimizationService =
  PerformanceOptimizationService.getInstance();
