/**
 * Dynamic Loading Service
 * Handles lazy loading of components and resources for optimal performance
 */

import React, { lazy } from "react";

class DynamicLoadingService {
  private static instance: DynamicLoadingService;
  private loadedComponents: Set<string> = new Set();
  private loadingComponents: Map<string, Promise<any>> = new Map();
  private intersectionObserver: IntersectionObserver | null = null;

  constructor() {
    this.setupIntersectionObserver();
  }

  static getInstance(): DynamicLoadingService {
    if (!DynamicLoadingService.instance) {
      DynamicLoadingService.instance = new DynamicLoadingService();
    }
    return DynamicLoadingService.instance;
  }

  // Setup intersection observer for lazy loading
  private setupIntersectionObserver() {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const componentName = element.dataset.lazyComponent;
            if (componentName) {
              this.loadComponent(componentName);
              this.intersectionObserver?.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: "50px 0px", // Load 50px before component comes into view
        threshold: 0.1,
      },
    );
  }

  // Lazy load component by name
  async loadComponent(componentName: string): Promise<any> {
    if (this.loadedComponents.has(componentName)) {
      return Promise.resolve();
    }

    if (this.loadingComponents.has(componentName)) {
      return this.loadingComponents.get(componentName);
    }

    console.log(`🔄 Dynamically loading component: ${componentName}`);

    const loadPromise = this.getComponentLoader(componentName)();

    this.loadingComponents.set(componentName, loadPromise);

    try {
      await loadPromise;
      this.loadedComponents.add(componentName);
      this.loadingComponents.delete(componentName);
      console.log(`✅ Successfully loaded: ${componentName}`);
    } catch (error) {
      console.error(`❌ Failed to load component ${componentName}:`, error);
      this.loadingComponents.delete(componentName);
      throw error;
    }

    return loadPromise;
  }

  // Get dynamic component loader
  private getComponentLoader(componentName: string): () => Promise<any> {
    const loaders: Record<string, () => Promise<any>> = {
      // Navigation Components
      NavigationControls: () => import("@/components/NavigationControls"),
      LocationAwareMap: () => import("@/components/LocationAwareMap"),

      // Profile Components
      EditProfileModal: () => import("@/components/EditProfileModal"),
      EnhancedAdvancedSettings: () =>
        import("@/components/EnhancedAdvancedSettings"),
      EmergencyContactManager: () =>
        import("@/components/EmergencyContactManager"),
      GuardianKeyCard: () => import("@/components/GuardianKeyCard"),

      // Utility Components
      QRScanner: () => import("@/components/QRScanner"),
      UserStatsManager: () => import("@/components/UserStatsManager"),
    };

    return (
      loaders[componentName] ||
      (() => {
        console.warn(`No loader defined for component: ${componentName}`);
        return Promise.reject(new Error(`Unknown component: ${componentName}`));
      })
    );
  }

  // Create lazy component with loading fallback
  createLazyComponent(componentName: string) {
    return lazy(() => this.getComponentLoader(componentName)());
  }

  // Preload components based on priority
  preloadComponents(priority: "high" | "medium" | "low" = "medium") {
    const componentsByPriority = {
      high: ["NavigationControls", "LocationAwareMap"],
      medium: [
        "EditProfileModal",
        "EmergencyContactManager",
        "QRScanner",
        "EnhancedAdvancedSettings",
      ],
      low: ["UserStatsManager", "GuardianKeyCard"],
    };

    const componentsToLoad = componentsByPriority[priority];

    // Use requestIdleCallback for non-blocking preloading
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => {
        this.preloadComponentsBatch(componentsToLoad);
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.preloadComponentsBatch(componentsToLoad);
      }, 100);
    }
  }

  private async preloadComponentsBatch(components: string[]) {
    for (const component of components) {
      try {
        await this.loadComponent(component);
        // Small delay between loads to avoid blocking
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        console.warn(`Failed to preload ${component}:`, error);
      }
    }
  }

  // Load components based on route
  preloadForRoute(route: string) {
    const routeComponents: Record<string, string[]> = {
      "/": ["LocationAwareMap", "NavigationControls"],
      "/profile": ["EditProfileModal", "EmergencyContactManager"],
      "/settings": ["EnhancedAdvancedSettings", "UserStatsManager"],
    };

    const components = routeComponents[route] || [];
    components.forEach((component) => {
      this.loadComponent(component).catch((error) => {
        console.warn(
          `Failed to preload ${component} for route ${route}:`,
          error,
        );
      });
    });
  }

  // Check if component is loaded
  isComponentLoaded(componentName: string): boolean {
    return this.loadedComponents.has(componentName);
  }

  // Load resources based on network conditions
  adaptivePreload() {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      // Preload based on network speed
      if (connection.effectiveType === "4g") {
        this.preloadComponents("high");
        setTimeout(() => this.preloadComponents("medium"), 1000);
      } else if (connection.effectiveType === "3g") {
        this.preloadComponents("high");
      } else {
        // On slow connections, only preload critical components
        console.log("Slow connection detected, limiting preload");
      }
    } else {
      // Default behavior for browsers without Network Information API
      this.preloadComponents("high");
    }
  }
}

export const dynamicLoadingService = DynamicLoadingService.getInstance();

// Loading Skeleton Component
export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`mobile-skeleton mobile-padding-md mobile-card ${className}`}
    >
      <div className="h-20 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
    </div>
  );
}

// Helper component for lazy loading
export function LazyComponentWrapper({
  componentName,
  fallback,
  children,
}: {
  componentName: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isLoading = !dynamicLoadingService.isComponentLoaded(componentName);

  if (isLoading) {
    return fallback ? <>{fallback}</> : <LoadingSkeleton />;
  }

  return <>{children}</>;
}
