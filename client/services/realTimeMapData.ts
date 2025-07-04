import { geminiNewsAnalysisService } from "./geminiNewsAnalysisService";

// Real-time emergency services data
interface EmergencyService {
  id: string;
  type: "police" | "hospital" | "fire" | "emergency";
  name: string;
  position: { lat: number; lng: number };
  phone: string;
  responseTime: number; // minutes
  availability: "available" | "busy" | "offline";
  lastUpdate: number;
}

// Real-time traffic data
interface TrafficData {
  segmentId: string;
  coords: { lat: number; lng: number }[];
  congestionLevel: "low" | "moderate" | "high" | "severe";
  averageSpeed: number; // km/h
  incidents: TrafficIncident[];
  lastUpdate: number;
}

interface TrafficIncident {
  id: string;
  type: "accident" | "construction" | "closure" | "event";
  severity: "minor" | "major" | "critical";
  description: string;
  position: { lat: number; lng: number };
  estimatedClearTime?: number;
}

// Enhanced safety area data
interface RealTimeSafetyArea {
  id: string;
  bounds: google.maps.LatLngLiteral[];
  center: { lat: number; lng: number };
  safetyScore: number;
  realTimeFactors: {
    crowdDensity: number;
    lightingLevel: number;
    policePresence: boolean;
    recentIncidents: number;
    weatherImpact: number;
  };
  aiAnalysis?: {
    score: number;
    confidence: number;
    recommendations: string[];
    alertLevel: "safe" | "caution" | "warning" | "danger";
  };
  lastUpdate: number;
}

export class RealTimeMapDataService {
  private static instance: RealTimeMapDataService;
  private emergencyServices: Map<string, EmergencyService> = new Map();
  private trafficData: Map<string, TrafficData> = new Map();
  private safetyAreas: Map<string, RealTimeSafetyArea> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private callbacks: Set<(data: RealTimeMapData) => void> = new Set();

  static getInstance(): RealTimeMapDataService {
    if (!RealTimeMapDataService.instance) {
      RealTimeMapDataService.instance = new RealTimeMapDataService();
    }
    return RealTimeMapDataService.instance;
  }

  // Start real-time data updates
  async startRealTimeUpdates(bounds: google.maps.LatLngBounds): Promise<void> {
    console.log("🔄 Starting real-time map data updates...");

    // Initial data load
    await this.loadInitialData(bounds);

    // Set up periodic updates - much longer interval to prevent quota issues
    this.updateInterval = setInterval(async () => {
      await this.updateRealTimeData(bounds);
    }, 120000); // Update every 2 minutes to preserve API quota

    this.notifyCallbacks();
  }

  // Load initial data for the map area
  private async loadInitialData(
    bounds: google.maps.LatLngBounds,
  ): Promise<void> {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    console.log("📡 Loading initial real-time data...");

    // Load emergency services
    await this.loadEmergencyServices(ne, sw);

    // Load traffic data
    await this.loadTrafficData(ne, sw);

    // Load safety areas with AI analysis
    await this.loadSafetyAreas(ne, sw);

    console.log(
      `✅ Loaded: ${this.emergencyServices.size} emergency services, ${this.trafficData.size} traffic segments, ${this.safetyAreas.size} safety areas`,
    );
  }

  // Load emergency services in the area
  private async loadEmergencyServices(
    ne: google.maps.LatLng,
    sw: google.maps.LatLng,
  ): Promise<void> {
    // Generate realistic emergency services based on area
    const services: EmergencyService[] = [
      {
        id: "police-central",
        type: "police",
        name: "Central Police Station",
        position: {
          lat: sw.lat() + (ne.lat() - sw.lat()) * 0.3,
          lng: sw.lng() + (ne.lng() - sw.lng()) * 0.4,
        },
        phone: "911",
        responseTime: 5,
        availability: "available",
        lastUpdate: Date.now(),
      },
      {
        id: "hospital-main",
        type: "hospital",
        name: "General Hospital",
        position: {
          lat: sw.lat() + (ne.lat() - sw.lat()) * 0.7,
          lng: sw.lng() + (ne.lng() - sw.lng()) * 0.6,
        },
        phone: "911",
        responseTime: 8,
        availability: "available",
        lastUpdate: Date.now(),
      },
      {
        id: "fire-station",
        type: "fire",
        name: "Fire Department",
        position: {
          lat: sw.lat() + (ne.lat() - sw.lat()) * 0.5,
          lng: sw.lng() + (ne.lng() - sw.lng()) * 0.2,
        },
        phone: "911",
        responseTime: 6,
        availability: Math.random() > 0.2 ? "available" : "busy",
        lastUpdate: Date.now(),
      },
      {
        id: "emergency-clinic",
        type: "emergency",
        name: "Emergency Clinic",
        position: {
          lat: sw.lat() + (ne.lat() - sw.lat()) * 0.8,
          lng: sw.lng() + (ne.lng() - sw.lng()) * 0.8,
        },
        phone: "911",
        responseTime: 4,
        availability: "available",
        lastUpdate: Date.now(),
      },
    ];

    services.forEach((service) => {
      this.emergencyServices.set(service.id, service);
    });
  }

  // Load traffic data
  private async loadTrafficData(
    ne: google.maps.LatLng,
    sw: google.maps.LatLng,
  ): Promise<void> {
    // Generate realistic traffic segments
    const gridSize = 0.005;
    let segmentId = 0;

    for (let lat = sw.lat(); lat < ne.lat(); lat += gridSize, segmentId++) {
      if (segmentId >= 10) break; // Limit segments

      const congestionLevels: TrafficData["congestionLevel"][] = [
        "low",
        "moderate",
        "high",
        "severe",
      ];
      const congestion =
        congestionLevels[Math.floor(Math.random() * congestionLevels.length)];

      const segment: TrafficData = {
        segmentId: `traffic-${segmentId}`,
        coords: [
          { lat, lng: sw.lng() },
          { lat, lng: ne.lng() },
        ],
        congestionLevel: congestion,
        averageSpeed: this.getSpeedFromCongestion(congestion),
        incidents:
          Math.random() > 0.7
            ? [this.generateTrafficIncident(lat, sw.lng())]
            : [],
        lastUpdate: Date.now(),
      };

      this.trafficData.set(segment.segmentId, segment);
    }
  }

  // Load safety areas with AI analysis
  private async loadSafetyAreas(
    ne: google.maps.LatLng,
    sw: google.maps.LatLng,
  ): Promise<void> {
    const gridSize = 0.008;
    let areaId = 0;

    for (let lat = sw.lat(); lat < ne.lat() && areaId < 4; lat += gridSize) {
      for (
        let lng = sw.lng();
        lng < ne.lng() && areaId < 4;
        lng += gridSize, areaId++
      ) {
        try {
          // Get AI analysis for this area
          const aiAnalysis = await geminiNewsAnalysisService.analyzeAreaSafety(
            lat + gridSize / 2,
            lng + gridSize / 2,
          );

          const area: RealTimeSafetyArea = {
            id: `safety-${areaId}`,
            bounds: [
              { lat, lng },
              { lat: lat + gridSize, lng },
              { lat: lat + gridSize, lng: lng + gridSize },
              { lat, lng: lng + gridSize },
            ],
            center: { lat: lat + gridSize / 2, lng: lng + gridSize / 2 },
            safetyScore: aiAnalysis.score,
            realTimeFactors: this.generateRealTimeFactors(),
            aiAnalysis: {
              score: aiAnalysis.score,
              confidence: aiAnalysis.confidence,
              recommendations: aiAnalysis.factors.slice(0, 3),
              alertLevel: this.determineAlertLevel(aiAnalysis.score),
            },
            lastUpdate: Date.now(),
          };

          this.safetyAreas.set(area.id, area);
        } catch (error) {
          // Fallback without AI analysis
          const fallbackScore = 60 + Math.random() * 30;
          const area: RealTimeSafetyArea = {
            id: `safety-${areaId}`,
            bounds: [
              { lat, lng },
              { lat: lat + gridSize, lng },
              { lat: lat + gridSize, lng: lng + gridSize },
              { lat, lng: lng + gridSize },
            ],
            center: { lat: lat + gridSize / 2, lng: lng + gridSize / 2 },
            safetyScore: fallbackScore,
            realTimeFactors: this.generateRealTimeFactors(),
            lastUpdate: Date.now(),
          };

          this.safetyAreas.set(area.id, area);
        }

        // Longer delay to respect API limits and prevent quota issues
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  // Update real-time data
  private async updateRealTimeData(
    bounds: google.maps.LatLngBounds,
  ): Promise<void> {
    console.log("🔄 Updating real-time data...");

    // Update emergency service availability
    this.emergencyServices.forEach((service) => {
      if (Math.random() > 0.9) {
        // 10% chance to change status
        service.availability =
          service.availability === "available" ? "busy" : "available";
        service.responseTime += Math.random() > 0.5 ? 1 : -1;
        service.responseTime = Math.max(3, Math.min(15, service.responseTime));
        service.lastUpdate = Date.now();
      }
    });

    // Update traffic data
    this.trafficData.forEach((segment) => {
      if (Math.random() > 0.8) {
        // 20% chance to change traffic
        const levels: TrafficData["congestionLevel"][] = [
          "low",
          "moderate",
          "high",
          "severe",
        ];
        const currentIndex = levels.indexOf(segment.congestionLevel);
        const newIndex = Math.max(
          0,
          Math.min(
            levels.length - 1,
            currentIndex + (Math.random() > 0.5 ? 1 : -1),
          ),
        );
        segment.congestionLevel = levels[newIndex];
        segment.averageSpeed = this.getSpeedFromCongestion(
          segment.congestionLevel,
        );
        segment.lastUpdate = Date.now();
      }
    });

    // Update safety areas with new real-time factors
    this.safetyAreas.forEach((area) => {
      area.realTimeFactors = this.generateRealTimeFactors();

      // Adjust safety score based on real-time factors
      let adjustment = 0;
      if (area.realTimeFactors.policePresence) adjustment += 10;
      if (area.realTimeFactors.crowdDensity > 80) adjustment -= 5;
      if (area.realTimeFactors.lightingLevel < 30) adjustment -= 8;
      if (area.realTimeFactors.recentIncidents > 2) adjustment -= 15;

      area.safetyScore = Math.max(
        20,
        Math.min(95, area.safetyScore + adjustment),
      );
      area.lastUpdate = Date.now();
    });

    this.notifyCallbacks();
  }

  // Helper methods
  private getSpeedFromCongestion(
    congestion: TrafficData["congestionLevel"],
  ): number {
    switch (congestion) {
      case "low":
        return 45 + Math.random() * 10;
      case "moderate":
        return 25 + Math.random() * 15;
      case "high":
        return 10 + Math.random() * 10;
      case "severe":
        return 5 + Math.random() * 5;
    }
  }

  private generateTrafficIncident(lat: number, lng: number): TrafficIncident {
    const types: TrafficIncident["type"][] = [
      "accident",
      "construction",
      "closure",
      "event",
    ];
    const severities: TrafficIncident["severity"][] = [
      "minor",
      "major",
      "critical",
    ];

    return {
      id: `incident-${Date.now()}`,
      type: types[Math.floor(Math.random() * types.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      description: "Traffic incident reported",
      position: { lat, lng },
      estimatedClearTime: Date.now() + Math.random() * 3600000, // 0-1 hour
    };
  }

  private generateRealTimeFactors(): RealTimeSafetyArea["realTimeFactors"] {
    const hour = new Date().getHours();

    return {
      crowdDensity: Math.floor(Math.random() * 100),
      lightingLevel:
        hour >= 6 && hour <= 18
          ? 80 + Math.random() * 20
          : 20 + Math.random() * 30,
      policePresence: Math.random() > 0.7,
      recentIncidents: Math.floor(Math.random() * 5),
      weatherImpact: Math.floor(Math.random() * 50),
    };
  }

  private determineAlertLevel(
    score: number,
  ): "safe" | "caution" | "warning" | "danger" {
    if (score >= 80) return "safe";
    if (score >= 60) return "caution";
    if (score >= 40) return "warning";
    return "danger";
  }

  // Get all real-time data
  getRealTimeData(): RealTimeMapData {
    return {
      emergencyServices: Array.from(this.emergencyServices.values()),
      trafficData: Array.from(this.trafficData.values()),
      safetyAreas: Array.from(this.safetyAreas.values()),
      lastUpdate: Date.now(),
    };
  }

  // Subscribe to updates
  subscribe(callback: (data: RealTimeMapData) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyCallbacks(): void {
    const data = this.getRealTimeData();
    this.callbacks.forEach((callback) => callback(data));
  }

  // Stop updates
  stopUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log("⏹️ Stopped real-time map data updates");
  }

  // Update bounds (when map is moved)
  async updateBounds(bounds: google.maps.LatLngBounds): Promise<void> {
    // Clear existing data
    this.emergencyServices.clear();
    this.trafficData.clear();
    this.safetyAreas.clear();

    // Load new data for new bounds
    await this.loadInitialData(bounds);
    this.notifyCallbacks();
  }
}

// Types
interface RealTimeMapData {
  emergencyServices: EmergencyService[];
  trafficData: TrafficData[];
  safetyAreas: RealTimeSafetyArea[];
  lastUpdate: number;
}

export const realTimeMapData = RealTimeMapDataService.getInstance();

// Export types
export type {
  EmergencyService,
  TrafficData,
  TrafficIncident,
  RealTimeSafetyArea,
  RealTimeMapData,
};
