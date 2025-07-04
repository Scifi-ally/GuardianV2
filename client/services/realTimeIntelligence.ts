interface SafetyReport {
  id: string;
  location: { lat: number; lng: number };
  reportType:
    | "incident"
    | "safe_spot"
    | "hazard"
    | "well_lit"
    | "crowded"
    | "isolated";
  severity: 1 | 2 | 3 | 4 | 5; // 1 = very safe, 5 = very dangerous
  timestamp: number;
  verifiedCount: number;
  description: string;
  reporterType: "user" | "ai" | "official";
  metadata: {
    timeOfDay: "morning" | "afternoon" | "evening" | "night";
    weather?: string;
    crowdLevel?: "low" | "medium" | "high";
  };
}

interface LocationIntelligence {
  location: { lat: number; lng: number };
  overallScore: number;
  confidence: number;
  lastUpdated: number;
  factors: {
    lightingLevel: number; // 0-100
    crowdDensity: number; // 0-100
    policePresence: boolean;
    emergencyServices: number; // count within 1km
    recentIncidents: number; // last 24 hours
    verifiedSafeSpots: number;
    infrastructureQuality: number; // 0-100
  };
  insights: string[];
  recommendations: string[];
}

interface RealTimeAlert {
  id: string;
  type: "emergency" | "incident" | "weather" | "traffic" | "event";
  location: { lat: number; lng: number };
  radius: number; // meters
  severity: "info" | "warning" | "danger" | "critical";
  message: string;
  source: string;
  timestamp: number;
  expiresAt: number;
}

export class RealTimeIntelligenceService {
  private static instance: RealTimeIntelligenceService;
  private isActive = false;
  private locationCache: Map<string, LocationIntelligence> = new Map();
  private safetyReports: Map<string, SafetyReport> = new Map();
  private activeAlerts: Map<string, RealTimeAlert> = new Map();
  private callbacks: Set<(data: LocationIntelligence) => void> = new Set();
  private alertCallbacks: Set<(alerts: RealTimeAlert[]) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private currentLocation: { lat: number; lng: number } | null = null;

  static getInstance(): RealTimeIntelligenceService {
    if (!RealTimeIntelligenceService.instance) {
      RealTimeIntelligenceService.instance = new RealTimeIntelligenceService();
    }
    return RealTimeIntelligenceService.instance;
  }

  // Start real-time intelligence gathering
  startIntelligence(): void {
    if (this.isActive) return;

    console.log("🧠 Starting Real-Time Location Intelligence...");
    this.isActive = true;

    // Simulate initial safety reports
    this.generateInitialSafetyData();

    // Update intelligence every 2 minutes
    this.updateInterval = setInterval(() => {
      this.updateLocationIntelligence();
      this.generateDynamicAlerts();
    }, 120000);

    // Initial update
    setTimeout(() => this.updateLocationIntelligence(), 1000);
  }

  // Stop intelligence gathering
  stopIntelligence(): void {
    console.log("🛑 Stopping Real-Time Location Intelligence...");
    this.isActive = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Update current location for intelligence
  updateLocation(location: { lat: number; lng: number }): void {
    this.currentLocation = location;

    if (this.isActive) {
      // Immediate intelligence update for new location
      this.updateLocationIntelligence();
    }
  }

  // Submit user safety report
  submitSafetyReport(
    report: Omit<SafetyReport, "id" | "timestamp" | "verifiedCount">,
  ): string {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullReport: SafetyReport = {
      ...report,
      id: reportId,
      timestamp: Date.now(),
      verifiedCount: 1,
    };

    this.safetyReports.set(reportId, fullReport);

    // Update location intelligence for affected area
    this.updateLocationIntelligence();

    console.log("📝 Safety report submitted:", fullReport);
    return reportId;
  }

  // Verify existing safety report
  verifySafetyReport(reportId: string): boolean {
    const report = this.safetyReports.get(reportId);
    if (report) {
      report.verifiedCount++;
      this.safetyReports.set(reportId, report);
      console.log(
        `✅ Safety report verified: ${reportId} (${report.verifiedCount} verifications)`,
      );
      return true;
    }
    return false;
  }

  // Generate location intelligence for current area
  private updateLocationIntelligence(): void {
    if (!this.currentLocation) return;

    const intelligence = this.calculateLocationIntelligence(
      this.currentLocation,
    );
    const locationKey = this.getLocationKey(this.currentLocation);

    this.locationCache.set(locationKey, intelligence);

    // Notify subscribers
    this.callbacks.forEach((callback) => callback(intelligence));

    console.log("🎯 Location intelligence updated:", intelligence);
  }

  // Calculate comprehensive location intelligence
  private calculateLocationIntelligence(location: {
    lat: number;
    lng: number;
  }): LocationIntelligence {
    const nearbyReports = this.getNearbyReports(location, 500); // 500m radius
    const now = Date.now();
    const hour = new Date().getHours();

    // Base scoring factors
    let lightingLevel = this.calculateLightingScore(location, hour);
    let crowdDensity = this.calculateCrowdDensity(location, hour);
    let policePresence = this.calculatePolicePresence(location);
    let emergencyServices = this.calculateEmergencyServices(location);
    let recentIncidents = this.calculateRecentIncidents(nearbyReports, now);
    let verifiedSafeSpots = this.calculateSafeSpots(nearbyReports);
    let infrastructureQuality = this.calculateInfrastructure(location);

    // Adjust based on user reports
    nearbyReports.forEach((report) => {
      const weight = Math.min(report.verifiedCount / 10, 1); // Max weight 1.0
      const age = now - report.timestamp;
      const freshness = Math.max(0, 1 - age / (24 * 60 * 60 * 1000)); // Decay over 24 hours

      switch (report.reportType) {
        case "well_lit":
          lightingLevel += weight * freshness * 20;
          break;
        case "crowded":
          crowdDensity += weight * freshness * 25;
          break;
        case "safe_spot":
          verifiedSafeSpots += weight * freshness;
          break;
        case "incident":
          recentIncidents += weight * freshness * report.severity;
          break;
        case "hazard":
          infrastructureQuality -= weight * freshness * report.severity * 10;
          break;
        case "isolated":
          crowdDensity -= weight * freshness * 15;
          break;
      }
    });

    // Normalize values
    lightingLevel = Math.max(0, Math.min(100, lightingLevel));
    crowdDensity = Math.max(0, Math.min(100, crowdDensity));
    infrastructureQuality = Math.max(0, Math.min(100, infrastructureQuality));

    // Calculate overall score
    const weights = {
      lighting: 0.25,
      crowd: 0.2,
      police: 0.15,
      emergency: 0.1,
      incidents: -0.2, // Negative impact
      safeSpots: 0.1,
      infrastructure: 0.15,
    };

    let overallScore =
      lightingLevel * weights.lighting +
      crowdDensity * weights.crowd +
      (policePresence ? 20 : 0) * weights.police +
      Math.min(emergencyServices * 10, 30) * weights.emergency +
      Math.max(-50, -recentIncidents * 10) * Math.abs(weights.incidents) +
      Math.min(verifiedSafeSpots * 15, 25) * weights.safeSpots +
      infrastructureQuality * weights.infrastructure;

    overallScore = Math.max(0, Math.min(100, overallScore));

    // Generate insights
    const insights = this.generateIntelligenceInsights({
      lightingLevel,
      crowdDensity,
      policePresence,
      emergencyServices,
      recentIncidents,
      verifiedSafeSpots,
      infrastructureQuality,
      hour,
      reportCount: nearbyReports.length,
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      lightingLevel,
      crowdDensity,
      policePresence,
      infrastructureQuality,
      recentIncidents,
      hour,
    });

    return {
      location,
      overallScore: Math.round(overallScore),
      confidence: Math.min(95, 60 + nearbyReports.length * 5),
      lastUpdated: now,
      factors: {
        lightingLevel: Math.round(lightingLevel),
        crowdDensity: Math.round(crowdDensity),
        policePresence,
        emergencyServices,
        recentIncidents: Math.round(recentIncidents),
        verifiedSafeSpots: Math.round(verifiedSafeSpots),
        infrastructureQuality: Math.round(infrastructureQuality),
      },
      insights,
      recommendations,
    };
  }

  // Generate intelligent insights
  private generateIntelligenceInsights(data: any): string[] {
    const insights: string[] = [];
    const {
      lightingLevel,
      crowdDensity,
      policePresence,
      emergencyServices,
      recentIncidents,
      hour,
      reportCount,
    } = data;

    if (lightingLevel >= 80) {
      insights.push("🔆 Excellent lighting conditions detected");
    } else if (lightingLevel < 40) {
      insights.push("🌑 Poor lighting conditions - exercise extra caution");
    }

    if (crowdDensity >= 70) {
      insights.push("👥 High foot traffic provides natural surveillance");
    } else if (crowdDensity < 30) {
      insights.push("👤 Low population density - area may feel isolated");
    }

    if (policePresence) {
      insights.push("👮 Police presence detected in area");
    }

    if (emergencyServices >= 3) {
      insights.push("🏥 Multiple emergency services within reach");
    } else if (emergencyServices === 0) {
      insights.push("🚨 Limited emergency services nearby");
    }

    if (recentIncidents > 2) {
      insights.push("⚠��� Multiple recent incidents reported in area");
    } else if (recentIncidents === 0) {
      insights.push("✅ No recent incidents reported");
    }

    if (hour >= 22 || hour <= 5) {
      insights.push("🌙 Late night hours - enhanced caution recommended");
    } else if (hour >= 6 && hour <= 9) {
      insights.push("🌅 Morning commute hours - generally safer");
    }

    if (reportCount >= 10) {
      insights.push("📊 High data confidence from community reports");
    } else if (reportCount < 3) {
      insights.push("📊 Limited community data available");
    }

    return insights.slice(0, 4); // Return top 4 insights
  }

  // Generate actionable recommendations
  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = [];
    const {
      lightingLevel,
      crowdDensity,
      infrastructureQuality,
      recentIncidents,
      hour,
    } = data;

    if (lightingLevel < 50) {
      recommendations.push(
        "Use flashlight or phone light to improve visibility",
      );
    }

    if (crowdDensity < 40) {
      recommendations.push("Stay on main roads with higher foot traffic");
    }

    if (infrastructureQuality < 50) {
      recommendations.push("Watch for poor road conditions and obstacles");
    }

    if (recentIncidents > 1) {
      recommendations.push("Consider alternative route with fewer incidents");
    }

    if (hour >= 22 || hour <= 5) {
      recommendations.push("Share live location with trusted contacts");
      recommendations.push("Stay in well-lit, populated areas");
    }

    if (crowdDensity >= 80) {
      recommendations.push("Good natural surveillance - safe for solo travel");
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  // Simulation methods for realistic data
  private calculateLightingScore(
    location: { lat: number; lng: number },
    hour: number,
  ): number {
    let base = 50;

    // Time-based lighting
    if (hour >= 6 && hour <= 18) {
      base += 40; // Daylight
    } else if (hour >= 19 && hour <= 21) {
      base += 20; // Evening with street lights
    } else {
      base -= 20; // Night time
    }

    // Location-based variation
    const locationFactor =
      Math.abs((location.lat * 1000 + location.lng * 1000) % 30) - 15;
    base += locationFactor;

    return Math.max(0, Math.min(100, base));
  }

  private calculateCrowdDensity(
    location: { lat: number; lng: number },
    hour: number,
  ): number {
    let base = 40;

    // Time-based crowd patterns
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      base += 30; // Rush hours
    } else if (hour >= 10 && hour <= 16) {
      base += 15; // Business hours
    } else if (hour >= 20 && hour <= 22) {
      base += 10; // Evening activity
    } else {
      base -= 20; // Night/early morning
    }

    // Weekend patterns
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (hour >= 10 && hour <= 22) {
        base += 15; // Weekend activity
      }
    }

    const locationFactor =
      Math.abs((location.lat * 500 + location.lng * 500) % 25) - 12;
    base += locationFactor;

    return Math.max(0, Math.min(100, base));
  }

  private calculatePolicePresence(location: {
    lat: number;
    lng: number;
  }): boolean {
    const hash =
      Math.abs((location.lat * 1000 + location.lng * 1000) * 654) % 100;
    return hash > 75; // 25% chance of police presence
  }

  private calculateEmergencyServices(location: {
    lat: number;
    lng: number;
  }): number {
    const hash =
      Math.abs((location.lat * 1000 + location.lng * 1000) * 321) % 6;
    return hash; // 0-5 emergency services within 1km
  }

  private calculateRecentIncidents(
    reports: SafetyReport[],
    now: number,
  ): number {
    return reports
      .filter(
        (report) =>
          report.reportType === "incident" &&
          now - report.timestamp < 24 * 60 * 60 * 1000, // Last 24 hours
      )
      .reduce((sum, report) => sum + report.severity, 0);
  }

  private calculateSafeSpots(reports: SafetyReport[]): number {
    return reports.filter((report) => report.reportType === "safe_spot").length;
  }

  private calculateInfrastructure(location: {
    lat: number;
    lng: number;
  }): number {
    const hash = Math.abs((location.lat * 2000 + location.lng * 2000) % 100);
    return Math.max(30, hash); // Generally good infrastructure with variation
  }

  // Helper methods
  private getLocationKey(location: { lat: number; lng: number }): string {
    return `${location.lat.toFixed(3)}_${location.lng.toFixed(3)}`;
  }

  private getNearbyReports(
    location: { lat: number; lng: number },
    radiusMeters: number,
  ): SafetyReport[] {
    const reports: SafetyReport[] = [];
    const radiusLat = radiusMeters / 111000; // Rough conversion
    const radiusLng =
      radiusMeters / (111000 * Math.cos((location.lat * Math.PI) / 180));

    for (const report of this.safetyReports.values()) {
      const latDiff = Math.abs(report.location.lat - location.lat);
      const lngDiff = Math.abs(report.location.lng - location.lng);

      if (latDiff <= radiusLat && lngDiff <= radiusLng) {
        reports.push(report);
      }
    }

    return reports;
  }

  // Generate dynamic real-time alerts
  private generateDynamicAlerts(): void {
    if (!this.currentLocation) return;

    const now = Date.now();
    const alerts: RealTimeAlert[] = [];

    // Clean up expired alerts
    for (const [id, alert] of this.activeAlerts) {
      if (alert.expiresAt <= now) {
        this.activeAlerts.delete(id);
      }
    }

    // Generate new alerts based on conditions
    const intelligence = this.locationCache.get(
      this.getLocationKey(this.currentLocation),
    );
    if (intelligence) {
      // High incident area alert
      if (intelligence.factors.recentIncidents > 3) {
        const alertId = `incident_${Date.now()}`;
        alerts.push({
          id: alertId,
          type: "incident",
          location: this.currentLocation,
          radius: 500,
          severity: "warning",
          message:
            "Multiple incidents reported in this area. Exercise caution.",
          source: "Community Reports",
          timestamp: now,
          expiresAt: now + 2 * 60 * 60 * 1000, // 2 hours
        });
      }

      // Poor lighting alert
      if (intelligence.factors.lightingLevel < 30) {
        const hour = new Date().getHours();
        if (hour >= 19 || hour <= 6) {
          const alertId = `lighting_${Date.now()}`;
          alerts.push({
            id: alertId,
            type: "emergency",
            location: this.currentLocation,
            radius: 200,
            severity: "warning",
            message:
              "Poor lighting conditions detected. Stay alert and use additional illumination.",
            source: "AI Analysis",
            timestamp: now,
            expiresAt: now + 60 * 60 * 1000, // 1 hour
          });
        }
      }
    }

    // Add new alerts
    alerts.forEach((alert) => {
      this.activeAlerts.set(alert.id, alert);
    });

    // Notify alert subscribers
    if (alerts.length > 0) {
      this.alertCallbacks.forEach((callback) =>
        callback(Array.from(this.activeAlerts.values())),
      );
    }
  }

  // Initialize with some sample safety data
  private generateInitialSafetyData(): void {
    const sampleReports: Omit<
      SafetyReport,
      "id" | "timestamp" | "verifiedCount"
    >[] = [
      {
        location: { lat: 37.7749, lng: -122.4194 },
        reportType: "well_lit",
        severity: 1,
        description: "Excellent street lighting",
        reporterType: "user",
        metadata: { timeOfDay: "evening", crowdLevel: "medium" },
      },
      {
        location: { lat: 37.7759, lng: -122.4184 },
        reportType: "safe_spot",
        severity: 1,
        description: "24/7 convenience store with security",
        reporterType: "user",
        metadata: { timeOfDay: "night", crowdLevel: "low" },
      },
      {
        location: { lat: 37.7739, lng: -122.4204 },
        reportType: "crowded",
        severity: 2,
        description: "Busy intersection with good visibility",
        reporterType: "ai",
        metadata: { timeOfDay: "afternoon", crowdLevel: "high" },
      },
    ];

    sampleReports.forEach((report) => {
      this.submitSafetyReport(report);
    });
  }

  // Public API methods
  getCurrentIntelligence(): LocationIntelligence | null {
    if (!this.currentLocation) return null;
    return (
      this.locationCache.get(this.getLocationKey(this.currentLocation)) || null
    );
  }

  getActiveAlerts(): RealTimeAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  subscribe(callback: (data: LocationIntelligence) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  subscribeToAlerts(callback: (alerts: RealTimeAlert[]) => void): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  isActive(): boolean {
    return this.isActive;
  }

  // Analytics and status
  getAnalytics() {
    return {
      isActive: this.isActive,
      reportCount: this.safetyReports.size,
      cacheSize: this.locationCache.size,
      activeAlerts: this.activeAlerts.size,
      currentLocation: this.currentLocation,
    };
  }
}

export const realTimeIntelligence = RealTimeIntelligenceService.getInstance();
export type { LocationIntelligence, SafetyReport, RealTimeAlert };
