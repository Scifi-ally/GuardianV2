interface GoogleMapsLoaderConfig {
  apiKey?: string;
  libraries?: string[];
  version?: string;
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<boolean> | null = null;
  private demoMode = false;

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  async loadGoogleMaps(config?: GoogleMapsLoaderConfig): Promise<boolean> {
    // Return immediately if already loaded
    if (this.isLoaded) {
      return true;
    }

    // Return existing promise if currently loading
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = this.doLoadGoogleMaps(config);

    return this.loadPromise;
  }

  private async doLoadGoogleMaps(
    config?: GoogleMapsLoaderConfig,
  ): Promise<boolean> {
    try {
      // Get API key from environment variables or hardcoded fallback
      const apiKey =
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
        config?.apiKey ||
        "AIzaSyA41wHVKnsb1RNhcftpHS5qNwvYz59nXIE";

      console.log("🗺️ Loading Google Maps API...");
      console.log("API Key available:", !!apiKey);
      console.log(
        "Environment check:",
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "✅" : "❌",
      );

      if (!apiKey) {
        console.warn("⚠️ Google Maps API key not configured");
        console.log("To use Google Maps:");
        console.log(
          "1. Get an API key from: https://console.developers.google.com/",
        );
        console.log(
          "2. Create a .env file with: VITE_GOOGLE_MAPS_API_KEY=your_key_here",
        );
        console.log("3. Restart the development server");
        console.log(
          "📍 Running in demo mode - map functionality will be limited",
        );

        this.setupDemoMode();
        return false;
      }

      // Check if Google Maps is already loaded (from external source)
      if (window.google?.maps) {
        console.log("✅ Google Maps API already available");
        this.isLoaded = true;
        this.demoMode = false;
        this.dispatchLoadEvent();
        return true;
      }

      // Load Google Maps API
      const libraries = config?.libraries || ["places"];
      const version = config?.version || "weekly";
      const url = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(",")}&v=${version}`;

      await this.loadScript(url);

      // Verify Google Maps loaded correctly
      if (window.google?.maps) {
        console.log("✅ Google Maps API loaded successfully");
        this.isLoaded = true;
        this.demoMode = false;
        this.dispatchLoadEvent();
        return true;
      } else {
        throw new Error("Google Maps API failed to initialize");
      }
    } catch (error) {
      console.error("❌ Failed to load Google Maps API:", error);
      console.log("📍 Falling back to demo mode");
      this.setupDemoMode();
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  private loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com"]`,
      );
      if (existingScript) {
        // Script exists, wait for it to load
        if (window.google?.maps) {
          resolve();
        } else {
          const checkInterval = setInterval(() => {
            if (window.google?.maps) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error("Google Maps script timeout"));
          }, 10000);
        }
        return;
      }

      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // Wait a bit for Google Maps to fully initialize
        setTimeout(() => {
          if (window.google?.maps) {
            resolve();
          } else {
            reject(new Error("Google Maps not available after script load"));
          }
        }, 100);
      };

      script.onerror = () => {
        reject(new Error("Failed to load Google Maps script"));
      };

      document.head.appendChild(script);

      // Timeout fallback
      setTimeout(() => {
        if (!this.isLoaded) {
          reject(new Error("Google Maps loading timeout"));
        }
      }, 15000); // 15 second timeout
    });
  }

  private setupDemoMode() {
    this.demoMode = true;
    this.isLoaded = false;

    // Set global flags for demo mode
    (window as any).googleMapsLoaded = false;
    (window as any).demoMode = true;

    this.dispatchDemoEvent();
  }

  private dispatchLoadEvent() {
    (window as any).googleMapsLoaded = true;
    (window as any).demoMode = false;
    window.dispatchEvent(new Event("google-maps-loaded"));
  }

  private dispatchDemoEvent() {
    window.dispatchEvent(new Event("google-maps-demo"));
  }

  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && !!window.google?.maps;
  }

  isDemoMode(): boolean {
    return this.demoMode;
  }

  /**
   * Get status of Google Maps loading
   */
  getStatus(): "loading" | "loaded" | "demo" | "error" {
    if (this.isLoading) return "loading";
    if (this.isLoaded) return "loaded";
    if (this.demoMode) return "demo";
    return "error";
  }
}

// Global type declarations
declare global {
  interface Window {
    google?: any;
    googleMapsLoaded?: boolean;
    demoMode?: boolean;
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance();
export type { GoogleMapsLoaderConfig };
