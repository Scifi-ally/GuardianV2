interface PerformanceMetrics {
  deviceType: "mobile" | "tablet" | "desktop";
  performanceLevel: "low" | "medium" | "high";
  memoryLevel: "low" | "medium" | "high";
  connectionSpeed: "slow" | "medium" | "fast";
  renderingCapability: "basic" | "standard" | "advanced";
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics | null = null;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Analyze device performance capabilities
  async analyzePerformance(): Promise<PerformanceMetrics> {
    if (this.metrics) return this.metrics;

    console.log(
      "📊 Analyzing device performance for optimal heatmap settings...",
    );

    const deviceType = this.detectDeviceType();
    const performanceLevel = await this.measurePerformanceLevel();
    const memoryLevel = this.detectMemoryLevel();
    const connectionSpeed = await this.measureConnectionSpeed();
    const renderingCapability = this.detectRenderingCapability();

    this.metrics = {
      deviceType,
      performanceLevel,
      memoryLevel,
      connectionSpeed,
      renderingCapability,
    };

    console.log("📊 Performance analysis complete:", this.metrics);
    return this.metrics;
  }

  // Detect device type
  private detectDeviceType(): "mobile" | "tablet" | "desktop" {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;

    if (
      /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(
        userAgent,
      )
    ) {
      return "mobile";
    } else if (
      /tablet|ipad/.test(userAgent) ||
      (screenWidth >= 768 && screenWidth <= 1024)
    ) {
      return "tablet";
    } else {
      return "desktop";
    }
  }

  // Measure performance level through timing tests
  private async measurePerformanceLevel(): Promise<"low" | "medium" | "high"> {
    try {
      // Simple computational benchmark
      const start = performance.now();

      // Perform intensive calculation
      let result = 0;
      for (let i = 0; i < 100000; i++) {
        result += Math.sin(i) * Math.cos(i);
      }

      const computeTime = performance.now() - start;

      // Test canvas rendering performance
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");

      const renderStart = performance.now();
      if (ctx) {
        for (let i = 0; i < 1000; i++) {
          ctx.fillStyle = `hsl(${i % 360}, 50%, 50%)`;
          ctx.fillRect(i % 100, Math.floor(i / 100), 1, 1);
        }
      }
      const renderTime = performance.now() - renderStart;

      const totalTime = computeTime + renderTime;

      // Classify performance based on timing
      if (totalTime < 10) return "high";
      if (totalTime < 25) return "medium";
      return "low";
    } catch (error) {
      console.warn("Performance measurement failed, defaulting to medium");
      return "medium";
    }
  }

  // Detect memory level
  private detectMemoryLevel(): "low" | "medium" | "high" {
    try {
      // Use navigator.deviceMemory if available (Chrome)
      const deviceMemory = (navigator as any).deviceMemory;
      if (deviceMemory) {
        if (deviceMemory >= 8) return "high";
        if (deviceMemory >= 4) return "medium";
        return "low";
      }

      // Fallback: estimate based on device type and other factors
      const deviceType = this.detectDeviceType();
      if (deviceType === "desktop") return "high";
      if (deviceType === "tablet") return "medium";
      return "low";
    } catch (error) {
      return "medium";
    }
  }

  // Measure connection speed
  private async measureConnectionSpeed(): Promise<"slow" | "medium" | "fast"> {
    try {
      // Use navigator.connection if available
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === "4g") return "fast";
        if (effectiveType === "3g") return "medium";
        return "slow";
      }

      // Fallback: measure download speed with a small request
      const start = performance.now();
      await fetch("/assets/placeholder.svg?" + Date.now(), {
        method: "HEAD",
        cache: "no-cache",
      });
      const loadTime = performance.now() - start;

      if (loadTime < 100) return "fast";
      if (loadTime < 300) return "medium";
      return "slow";
    } catch (error) {
      return "medium";
    }
  }

  // Detect rendering capability
  private detectRenderingCapability(): "basic" | "standard" | "advanced" {
    try {
      // Check WebGL support
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      if (!gl) return "basic";

      // Check for advanced WebGL features
      const extensions = gl.getSupportedExtensions();
      const hasAdvancedFeatures = extensions && extensions.length > 20;

      // Check hardware acceleration
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "";
      const hasGoodGPU = /nvidia|amd|intel|mali|adreno/i.test(renderer);

      if (hasAdvancedFeatures && hasGoodGPU) return "advanced";
      if (gl && hasGoodGPU) return "standard";
      return "basic";
    } catch (error) {
      return "basic";
    }
  }

  // Get optimal heatmap settings based on performance
  getOptimalHeatmapSettings(): {
    maxPoints: number;
    updateInterval: number;
    usePreview: boolean;
    gridSizeMultiplier: number;
    enableRealTimeUpdates: boolean;
  } {
    if (!this.metrics) {
      // Default settings if no analysis done
      return {
        maxPoints: 100,
        updateInterval: 120000,
        usePreview: true,
        gridSizeMultiplier: 1,
        enableRealTimeUpdates: true,
      };
    }

    const { deviceType, performanceLevel, memoryLevel, connectionSpeed } =
      this.metrics;

    let settings = {
      maxPoints: 100,
      updateInterval: 120000,
      usePreview: true,
      gridSizeMultiplier: 1,
      enableRealTimeUpdates: true,
    };

    // Adjust based on performance level
    switch (performanceLevel) {
      case "high":
        settings.maxPoints = 200;
        settings.updateInterval = 90000;
        settings.gridSizeMultiplier = 0.7;
        break;
      case "low":
        settings.maxPoints = 50;
        settings.updateInterval = 180000;
        settings.gridSizeMultiplier = 1.5;
        settings.enableRealTimeUpdates = false;
        break;
    }

    // Adjust based on device type
    switch (deviceType) {
      case "mobile":
        settings.maxPoints = Math.min(settings.maxPoints, 75);
        settings.updateInterval = Math.max(settings.updateInterval, 150000);
        break;
      case "desktop":
        settings.maxPoints = Math.max(settings.maxPoints, 100);
        settings.updateInterval = Math.min(settings.updateInterval, 90000);
        break;
    }

    // Adjust based on memory
    if (memoryLevel === "low") {
      settings.maxPoints = Math.min(settings.maxPoints, 60);
      settings.enableRealTimeUpdates = false;
    }

    // Adjust based on connection speed
    if (connectionSpeed === "slow") {
      settings.updateInterval = Math.max(settings.updateInterval, 300000);
      settings.usePreview = true;
    }

    console.log("📊 Optimal heatmap settings:", settings);
    return settings;
  }

  // Get current metrics
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  // Reset metrics (force re-analysis)
  resetMetrics(): void {
    this.metrics = null;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
