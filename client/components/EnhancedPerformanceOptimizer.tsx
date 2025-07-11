import { useEffect, useCallback, useRef } from "react";

interface PerformanceMetrics {
  loadTime: number;
  interactionTime: number;
  memoryUsage: number;
  fps: number;
  isLowPerformance: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
    fps: 0,
    isLowPerformance: false,
  };

  private frameCount = 0;
  private lastTime = 0;
  private animationFrame: number | null = null;
  private listeners: ((metrics: PerformanceMetrics) => void)[] = [];

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Measure initial load time
    this.metrics.loadTime = performance.now();

    // Detect low-performance devices
    this.metrics.isLowPerformance = this.detectLowPerformance();

    // Start FPS monitoring
    this.startFPSMonitoring();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Apply performance optimizations
    this.applyOptimizations();
  }

  private detectLowPerformance(): boolean {
    const checks = [
      navigator.hardwareConcurrency <= 2,
      (navigator as any).deviceMemory <= 2,
      (navigator as any).connection?.effectiveType === "slow-2g" ||
        (navigator as any).connection?.effectiveType === "2g",
      window.innerWidth < 768 && navigator.userAgent.includes("Mobile"),
    ];

    return checks.filter(Boolean).length >= 2;
  }

  private startFPSMonitoring() {
    const measureFPS = (currentTime: number) => {
      if (this.lastTime === 0) {
        this.lastTime = currentTime;
      }

      const deltaTime = currentTime - this.lastTime;
      this.frameCount++;

      if (deltaTime >= 1000) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / deltaTime);
        this.frameCount = 0;
        this.lastTime = currentTime;
        this.notifyListeners();
      }

      this.animationFrame = requestAnimationFrame(measureFPS);
    };

    this.animationFrame = requestAnimationFrame(measureFPS);
  }

  private monitorMemoryUsage() {
    if ("memory" in performance) {
      const memInfo = (performance as any).memory;
      this.metrics.memoryUsage = memInfo.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  private applyOptimizations() {
    if (this.metrics.isLowPerformance) {
      // Reduce animation complexity
      document.documentElement.classList.add("low-performance");
      document.documentElement.style.setProperty(
        "--animation-duration",
        "0.1s",
      );
      document.documentElement.style.setProperty(
        "--transition-duration",
        "0.1s",
      );

      // Disable expensive animations
      const style = document.createElement("style");
      style.textContent = `
        .low-performance * {
          animation-duration: 0.1s !important;
          transition-duration: 0.1s !important;
        }
        .low-performance .complex-animation,
        .low-performance .parallax,
        .low-performance .blur-effect {
          animation: none !important;
          transform: none !important;
          filter: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Optimize touch events
    this.optimizeTouchEvents();

    // Preload critical resources
    this.preloadCriticalResources();

    // Set up intelligent caching
    this.setupIntelligentCaching();
  }

  private optimizeTouchEvents() {
    // Prevent touch delay on iOS
    document.addEventListener("touchstart", () => {}, {
      passive: true,
      capture: true,
    });

    // Optimize scroll performance
    let ticking = false;
    const optimizeScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          ticking = false;
          // Scroll optimizations here
        });
        ticking = true;
      }
    };

    document.addEventListener("scroll", optimizeScroll, { passive: true });
  }

  private preloadCriticalResources() {
    const criticalResources = [
      // Preload Google Maps API if not already loaded
      "https://maps.googleapis.com/maps/api/js",
    ];

    criticalResources.forEach((url) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = url;
      link.as = "script";
      document.head.appendChild(link);
    });
  }

  private setupIntelligentCaching() {
    // Service worker setup for intelligent caching would go here
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
    }

    // Setup localStorage cache cleanup
    this.cleanupOldCacheEntries();
  }

  private cleanupOldCacheEntries() {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("guardian_cache_")) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || "{}");
          if (item.timestamp && now - item.timestamp > maxAge) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Remove invalid cache entries
          localStorage.removeItem(key!);
        }
      }
    }
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(callback);
    callback(this.metrics);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback(this.metrics));
  }

  public getMetrics(): PerformanceMetrics {
    this.monitorMemoryUsage();
    return { ...this.metrics };
  }

  public destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.listeners = [];
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

export function EnhancedPerformanceOptimizer() {
  useEffect(() => {
    console.log("🚀 Enhanced Performance Optimizer active");

    // Optimize images with lazy loading
    const optimizeImages = () => {
      const images = document.querySelectorAll("img[data-src]");
      const imageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              img.src = img.dataset.src!;
              img.removeAttribute("data-src");
              imageObserver.unobserve(img);
            }
          });
        },
        { threshold: 0.1 },
      );

      images.forEach((img) => imageObserver.observe(img));
    };

    // Optimize component rendering
    const optimizeRendering = () => {
      // Debounce resize events
      let resizeTimeout: NodeJS.Timeout;
      const debouncedResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          window.dispatchEvent(new Event("optimizedResize"));
        }, 150);
      };

      window.addEventListener("resize", debouncedResize);

      return () => {
        window.removeEventListener("resize", debouncedResize);
        clearTimeout(resizeTimeout);
      };
    };

    // Memory leak prevention
    const preventMemoryLeaks = () => {
      const cleanup: (() => void)[] = [];

      // Clean up intervals and timeouts
      const originalSetInterval = window.setInterval;
      const originalSetTimeout = window.setTimeout;

      (window as any).setInterval = (...args: any[]) => {
        const id = originalSetInterval.apply(window, args as any);
        cleanup.push(() => clearInterval(id));
        return id;
      };

      (window as any).setTimeout = (...args: any[]) => {
        const id = originalSetTimeout.apply(window, args as any);
        cleanup.push(() => clearTimeout(id));
        return id;
      };

      return () => {
        cleanup.forEach((fn) => fn());
        window.setInterval = originalSetInterval;
        window.setTimeout = originalSetTimeout;
      };
    };

    optimizeImages();
    const cleanupRendering = optimizeRendering();
    const cleanupMemory = preventMemoryLeaks();

    return () => {
      cleanupRendering();
      cleanupMemory();
    };
  }, []);

  return null;
}

// Hook for component-level performance optimization
export function usePerformanceOptimization() {
  const lastUpdate = useRef(0);
  const frameRef = useRef<number>();

  const throttledUpdate = useCallback((callback: () => void) => {
    const now = performance.now();
    if (now - lastUpdate.current > 16.67) {
      // ~60fps
      lastUpdate.current = now;
      callback();
    }
  }, []);

  const debouncedUpdate = useCallback(
    (callback: () => void, delay: number = 300) => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = requestAnimationFrame(() => {
        setTimeout(callback, delay);
      });
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return { throttledUpdate, debouncedUpdate };
}

// Cache management utilities
export class SmartCache {
  private cache = new Map<string, any>();
  private maxSize = 50;
  private accessOrder = new Map<string, number>();

  set(key: string, value: any, ttl?: number) {
    // LRU eviction
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = Array.from(this.accessOrder.entries()).sort(
        ([, a], [, b]) => a - b,
      )[0][0];
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
    this.accessOrder.set(key, Date.now());
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check TTL
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    // Update access order
    this.accessOrder.set(key, Date.now());
    return item.value;
  }

  clear() {
    this.cache.clear();
    this.accessOrder.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Export global instances
export { performanceMonitor };
export const smartCache = new SmartCache();

// Performance monitoring hook
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    return unsubscribe;
  }, []);

  return metrics;
}

// Import this to ensure types are available
import { useState } from "react";
