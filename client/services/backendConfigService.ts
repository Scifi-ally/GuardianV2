interface BackendConfig {
  heatmapEnabled: boolean;
  debugMode: boolean;
  adminOverride: boolean;
}

class BackendConfigService {
  private static instance: BackendConfigService;
  private config: BackendConfig = {
    heatmapEnabled: false, // Disabled by default
    debugMode: false,
    adminOverride: false,
  };

  static getInstance(): BackendConfigService {
    if (!BackendConfigService.instance) {
      BackendConfigService.instance = new BackendConfigService();
    }
    return BackendConfigService.instance;
  }

  // Check if heatmap is enabled via backend configuration
  isHeatmapEnabled(): boolean {
    return this.config.heatmapEnabled;
  }

  // Check if debug mode is enabled
  isDebugModeEnabled(): boolean {
    return this.config.debugMode;
  }

  // Check if admin override is active
  isAdminOverrideActive(): boolean {
    return this.config.adminOverride;
  }

  // Fetch configuration from backend (or environment variables)
  async fetchConfiguration(): Promise<void> {
    try {
      // Check environment variables for manual override
      const envHeatmapEnabled = import.meta.env.VITE_HEATMAP_ENABLED === "true";
      const envDebugMode = import.meta.env.VITE_DEBUG_MODE === "true";
      const envAdminOverride = import.meta.env.VITE_ADMIN_OVERRIDE === "true";

      // Try to fetch from backend API
      const response = await fetch("/api/config/features");
      if (response.ok) {
        const backendConfig = await response.json();
        this.config = {
          heatmapEnabled:
            backendConfig.heatmapEnabled || envHeatmapEnabled || false,
          debugMode: backendConfig.debugMode || envDebugMode || false,
          adminOverride:
            backendConfig.adminOverride || envAdminOverride || false,
        };
      } else {
        // Fallback to environment variables only
        this.config = {
          heatmapEnabled: envHeatmapEnabled,
          debugMode: envDebugMode,
          adminOverride: envAdminOverride,
        };
      }

      console.log("🔧 Backend configuration loaded:", this.config);
    } catch (error) {
      console.warn(
        "Failed to fetch backend configuration, using defaults:",
        error,
      );

      // Fallback to environment variables
      this.config = {
        heatmapEnabled: import.meta.env.VITE_HEATMAP_ENABLED === "true",
        debugMode: import.meta.env.VITE_DEBUG_MODE === "true",
        adminOverride: import.meta.env.VITE_ADMIN_OVERRIDE === "true",
      };
    }
  }

  // Manual enable/disable (for admin use)
  setHeatmapEnabled(enabled: boolean): void {
    if (this.config.adminOverride) {
      this.config.heatmapEnabled = enabled;
      console.log(
        `🔧 Heatmap ${enabled ? "enabled" : "disabled"} via admin override`,
      );
    } else {
      console.warn(
        "Heatmap can only be enabled via backend configuration or admin override",
      );
    }
  }

  // Get full configuration
  getConfiguration(): BackendConfig {
    return { ...this.config };
  }

  // Reset to defaults
  resetConfiguration(): void {
    this.config = {
      heatmapEnabled: false,
      debugMode: false,
      adminOverride: false,
    };
  }
}

export const backendConfigService = BackendConfigService.getInstance();
