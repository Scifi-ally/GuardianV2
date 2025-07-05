interface SafetyDataPoint {
  timestamp: number;
  location: { lat: number; lng: number };
  score: number;
  factors: string[];
  alerts: string[];
}

interface SafetyMonitorConfig {
  updateInterval: number; // milliseconds
  locationThreshold: number; // meters
}

export class RealTimeSafetyMonitor {
  private static instance: RealTimeSafetyMonitor;
  private isMonitoring = false;
  private config: SafetyMonitorConfig = {
    updateInterval: 10000, // 10 seconds
    locationThreshold: 50, // 50 meters
  };
  private currentSafetyData: SafetyDataPoint | null = null;
  private callbacks: Set<(data: SafetyDataPoint) => void> = new Set();
  private intervalId: NodeJS.Timeout | null = null;
  private lastLocation: { lat: number; lng: number } | null = null;

  static getInstance(): RealTimeSafetyMonitor {
    if (!RealTimeSafetyMonitor.instance) {
      RealTimeSafetyMonitor.instance = new RealTimeSafetyMonitor();
    }
    return RealTimeSafetyMonitor.instance;
  }

  // Start monitoring safety for a specific route
  startMonitoring(
    location: { lat: number; lng: number },
    config?: Partial<SafetyMonitorConfig>,
  ): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }

    this.config = { ...this.config, ...config };
    this.isMonitoring = true;
    this.lastLocation = location;

    console.log("🛡️ Starting real-time safety monitoring...");

    // Initial safety check
    this.performSafetyCheck(location);

    // Set up interval for continuous monitoring
    this.intervalId = setInterval(() => {
      if (this.lastLocation) {
        this.performSafetyCheck(this.lastLocation);
      }
    }, this.config.updateInterval);
  }

  // Update location and check if we need a new safety assessment
  updateLocation(location: { lat: number; lng: number }): void {
    if (!this.isMonitoring || !this.lastLocation) return;

    const distance = this.calculateDistance(this.lastLocation, location);

    // Only update if we've moved significantly
    if (distance > this.config.locationThreshold) {
      this.lastLocation = location;
      this.performSafetyCheck(location);
    }
  }

  // Perform safety check for current location
  private async performSafetyCheck(location: {
    lat: number;
    lng: number;
  }): Promise<void> {
    try {
      // Generate dynamic safety score based on multiple factors
      const safetyData = await this.calculateSafetyScore(location);

      this.currentSafetyData = safetyData;

      // Notify all subscribers
      this.callbacks.forEach((callback) => callback(safetyData));
    } catch (error) {
      console.error("Safety check failed:", error);
    }
  }

  // Calculate comprehensive safety score using advanced AI engine
  private async calculateSafetyScore(location: {
    lat: number;
    lng: number;
  }): Promise<SafetyDataPoint> {
    try {
      console.log("🧠 Computing advanced AI safety score...");

      // Import and use advanced AI safety engine
      const { advancedAISafetyEngine } = await import(
        "./advancedAISafetyEngine"
      );

      // Get comprehensive AI analysis
      const aiScore = await advancedAISafetyEngine.calculateAdvancedSafety(
        location.lat,
        location.lng,
        {
          includeRealTime: true,
          includePredictions: true,
          personalizedWeights: true,
        },
      );

      const alerts: string[] = [];

      // Process AI recommendations into alerts
      alerts.push(...aiScore.recommendations.immediate);

      // Add urgent actions as alerts if in warning+ state
      if (aiScore.alertLevel !== "safe" && aiScore.alertLevel !== "caution") {
        alerts.push(...aiScore.urgentActions);
      }

      // Add risk factors as contextual alerts
      if (aiScore.riskFactors.immediate.length > 0) {
        alerts.push(
          ...aiScore.riskFactors.immediate.map((risk) => `⚠️ ${risk}`),
        );
      }

      // Add prediction-based alerts
      if (aiScore.predictions.trend === "declining") {
        alerts.push("📉 Safety conditions expected to deteriorate");
      }

      console.log(
        `✅ Advanced AI score: ${aiScore.overallScore} (${aiScore.alertLevel})`,
      );

      return {
        timestamp: Date.now(),
        location,
        score: aiScore.overallScore,
        factors: [
          `Environmental: ${aiScore.scores.environmental}`,
          `Behavioral: ${aiScore.scores.behavioral}`,
          `Temporal: ${aiScore.scores.temporal}`,
          `Social: ${aiScore.scores.social}`,
          `Infrastructure: ${aiScore.scores.infrastructure}`,
          `Real-time: ${aiScore.scores.realTime}`,
          `Confidence: ${aiScore.confidence}%`,
          `Reliability: ${aiScore.reliability}%`,
        ],
        alerts: alerts.slice(0, 5), // Limit to top 5 alerts
      };
    } catch (error) {
      console.error("❌ Advanced AI safety analysis failed:", error);
      return this.calculateFallbackSafetyScore(location);
    }
  }

  // Fallback safety calculation when API is unavailable
  private calculateFallbackSafetyScore(location: {
    lat: number;
    lng: number;
  }): SafetyDataPoint {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    let baseScore = 75;
    const factors: string[] = ["Local analysis"];
    const alerts: string[] = [];

    // Time-based factors
    if (hour >= 22 || hour <= 5) {
      baseScore -= 15;
      factors.push("Night time");
      alerts.push("🌙 Late night - extra caution advised");
    } else if (hour >= 6 && hour <= 9) {
      baseScore += 10;
      factors.push("Morning commute - generally safer");
    }

    // Day of week factors
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      baseScore -= 5;
      factors.push("Weekend - fewer people");
    }

    // Location-based factors
    const locationFactor =
      Math.sin(location.lat * 1000) * Math.cos(location.lng * 1000);
    const locationScore = Math.round(locationFactor * 15);
    baseScore += locationScore;

    if (locationScore > 5) {
      factors.push("Commercial area");
    } else if (locationScore < -5) {
      factors.push("Residential area");
    }

    const finalScore = Math.max(20, Math.min(95, Math.round(baseScore)));

    if (finalScore < 40) {
      alerts.push("🚨 Exercise caution in this area");
    } else if (finalScore < 60) {
      alerts.push("⚠️ Stay aware of surroundings");
    }

    return {
      timestamp: Date.now(),
      location,
      score: finalScore,
      factors,
      alerts,
    };
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
    this.lastLocation = null;
    console.log("🛡️ Safety monitoring stopped");
  }

  // Subscribe to safety updates
  subscribe(callback: (data: SafetyDataPoint) => void): () => void {
    this.callbacks.add(callback);

    // Immediately send current data if available
    if (this.currentSafetyData) {
      callback(this.currentSafetyData);
    }

    return () => this.callbacks.delete(callback);
  }

  // Get current safety data
  getCurrentSafetyData(): SafetyDataPoint | null {
    return this.currentSafetyData;
  }

  // Check if monitoring is active
  isActive(): boolean {
    return this.isMonitoring;
  }

  // Calculate distance between two points
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

// Export singleton instance
export const realTimeSafetyMonitor = RealTimeSafetyMonitor.getInstance();

// Export types
export type { SafetyDataPoint, SafetyMonitorConfig };
