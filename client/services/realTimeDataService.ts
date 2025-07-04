interface RealTimeUpdate {
  location: { lat: number; lng: number };
  timestamp: number;
  data: {
    trafficDensity: number;
    incidentCount: number;
    emergencyResponseTime: number;
    weatherCondition: string;
    safetyScore: number;
    activeAlerts: string[];
  };
}

interface DataSubscription {
  id: string;
  callback: (update: RealTimeUpdate) => void;
  bounds: google.maps.LatLngBounds;
  lastUpdate: number;
}

export class RealTimeDataService {
  private static instance: RealTimeDataService;
  private subscriptions: Map<string, DataSubscription> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_FREQUENCY = 30000; // 30 seconds
  private isRunning = false;

  static getInstance(): RealTimeDataService {
    if (!RealTimeDataService.instance) {
      RealTimeDataService.instance = new RealTimeDataService();
    }
    return RealTimeDataService.instance;
  }

  // Subscribe to real-time updates for a specific area
  subscribe(
    bounds: google.maps.LatLngBounds,
    callback: (update: RealTimeUpdate) => void,
  ): string {
    const id = this.generateId();

    this.subscriptions.set(id, {
      id,
      callback,
      bounds,
      lastUpdate: 0,
    });

    // Start the update service if not running
    if (!this.isRunning) {
      this.startUpdates();
    }

    console.log(`Real-time data subscription created: ${id}`);
    return id;
  }

  // Unsubscribe from updates
  unsubscribe(id: string): void {
    this.subscriptions.delete(id);

    // Stop updates if no subscriptions
    if (this.subscriptions.size === 0) {
      this.stopUpdates();
    }

    console.log(`Real-time data subscription removed: ${id}`);
  }

  // Start continuous updates
  private startUpdates(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("Starting real-time data updates");

    this.updateInterval = setInterval(() => {
      this.processUpdates();
    }, this.UPDATE_FREQUENCY);

    // Initial update
    this.processUpdates();
  }

  // Stop continuous updates
  private stopUpdates(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log("Stopped real-time data updates");
  }

  // Process updates for all subscriptions
  private async processUpdates(): Promise<void> {
    const now = Date.now();

    for (const subscription of this.subscriptions.values()) {
      try {
        // Generate sample points within bounds for updates
        const updatePoints = this.generateUpdatePoints(subscription.bounds);

        for (const point of updatePoints) {
          const update = await this.fetchRealTimeUpdate(point);
          subscription.callback(update);
        }

        subscription.lastUpdate = now;
      } catch (error) {
        console.warn(`Real-time update failed for ${subscription.id}:`, error);
      }
    }
  }

  // Generate points within bounds for updates
  private generateUpdatePoints(
    bounds: google.maps.LatLngBounds,
  ): { lat: number; lng: number }[] {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const points: { lat: number; lng: number }[] = [];

    // Generate 5-10 random points for updates
    const numPoints = 5 + Math.floor(Math.random() * 6);

    for (let i = 0; i < numPoints; i++) {
      points.push({
        lat: sw.lat() + Math.random() * (ne.lat() - sw.lat()),
        lng: sw.lng() + Math.random() * (ne.lng() - sw.lng()),
      });
    }

    return points;
  }

  // Fetch real-time update for a location
  private async fetchRealTimeUpdate(location: {
    lat: number;
    lng: number;
  }): Promise<RealTimeUpdate> {
    // Simulate real-time data fetching
    // In production, this would integrate with:
    // - Traffic APIs (Google Traffic, HERE, TomTom)
    // - Incident APIs (police, fire, medical)
    // - Weather APIs (OpenWeatherMap, AccuWeather)
    // - Emergency services APIs

    const now = Date.now();
    const hour = new Date().getHours();

    // Simulate traffic patterns
    const trafficDensity = this.simulateTrafficDensity(location, hour);

    // Simulate incident detection
    const incidentCount = this.simulateIncidents(location, now);

    // Simulate emergency response times
    const emergencyResponseTime = this.simulateResponseTime(location);

    // Simulate weather conditions
    const weatherCondition = this.simulateWeather(location);

    // Calculate real-time safety score
    const safetyScore = this.calculateRealTimeSafety({
      trafficDensity,
      incidentCount,
      emergencyResponseTime,
      weatherCondition,
      hour,
      location,
    });

    // Generate active alerts
    const activeAlerts = this.generateActiveAlerts({
      trafficDensity,
      incidentCount,
      weatherCondition,
      safetyScore,
    });

    return {
      location,
      timestamp: now,
      data: {
        trafficDensity,
        incidentCount,
        emergencyResponseTime,
        weatherCondition,
        safetyScore,
        activeAlerts,
      },
    };
  }

  // Simulate traffic density based on location and time
  private simulateTrafficDensity(
    location: { lat: number; lng: number },
    hour: number,
  ): number {
    // Rush hour patterns
    let baseTraffic = 30;

    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      baseTraffic = 80; // Rush hour
    } else if (hour >= 10 && hour <= 16) {
      baseTraffic = 50; // Daytime
    } else if (hour >= 20 && hour <= 23) {
      baseTraffic = 40; // Evening
    } else {
      baseTraffic = 15; // Night/early morning
    }

    // Location-based variation
    const locationHash =
      Math.abs((location.lat * 1000 + location.lng * 1000) * 789) % 50;
    baseTraffic += locationHash - 25; // ±25 variation

    // Add some randomness for realism
    baseTraffic += (Math.random() - 0.5) * 20;

    return Math.max(0, Math.min(100, Math.round(baseTraffic)));
  }

  // Simulate incident detection
  private simulateIncidents(
    location: { lat: number; lng: number },
    timestamp: number,
  ): number {
    // Incidents are more likely in certain areas and times
    const locationFactor = Math.abs((location.lat * location.lng * 1000) % 100);
    const timeFactor = Math.abs((timestamp / 1000000) % 100);

    let incidentProbability = (locationFactor + timeFactor) / 200;

    // Higher incident probability during certain hours
    const hour = new Date().getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      incidentProbability *= 1.5; // Rush hour
    } else if (hour >= 22 || hour <= 5) {
      incidentProbability *= 1.2; // Night
    }

    // Random incidents (0-5 possible)
    if (Math.random() < incidentProbability) {
      return Math.floor(Math.random() * 3) + 1; // 1-3 incidents
    }

    return 0;
  }

  // Simulate emergency response times
  private simulateResponseTime(location: { lat: number; lng: number }): number {
    // Response time varies by location (urban vs rural simulation)
    const urbanScore = Math.abs((location.lat + location.lng) * 1000) % 100;

    let baseResponseTime = 8; // minutes

    if (urbanScore > 80) {
      baseResponseTime = 4; // Urban area - fast response
    } else if (urbanScore > 60) {
      baseResponseTime = 6; // Suburban
    } else if (urbanScore > 40) {
      baseResponseTime = 8; // Standard
    } else {
      baseResponseTime = 12; // Rural - slower response
    }

    // Add randomness
    baseResponseTime += (Math.random() - 0.5) * 4;

    return Math.max(2, Math.min(20, Math.round(baseResponseTime)));
  }

  // Simulate weather conditions
  private simulateWeather(location: { lat: number; lng: number }): string {
    const conditions = [
      "Clear",
      "Partly Cloudy",
      "Cloudy",
      "Light Rain",
      "Heavy Rain",
      "Thunderstorm",
      "Snow",
      "Fog",
      "Windy",
    ];

    // Weather varies by location and time
    const weatherHash = Math.abs(
      ((location.lat * location.lng * Date.now()) / 1000000) %
        conditions.length,
    );

    return conditions[Math.floor(weatherHash)];
  }

  // Calculate real-time safety score
  private calculateRealTimeSafety(params: {
    trafficDensity: number;
    incidentCount: number;
    emergencyResponseTime: number;
    weatherCondition: string;
    hour: number;
    location: { lat: number; lng: number };
  }): number {
    let score = 70; // Base score

    // Traffic impact
    if (params.trafficDensity > 90) score -= 15;
    else if (params.trafficDensity > 70) score -= 8;
    else if (params.trafficDensity < 20) score -= 5; // Too little traffic can be unsafe

    // Incident impact
    score -= params.incidentCount * 8;

    // Emergency response impact
    if (params.emergencyResponseTime > 15) score -= 10;
    else if (params.emergencyResponseTime > 10) score -= 5;
    else if (params.emergencyResponseTime < 5) score += 5;

    // Weather impact
    if (params.weatherCondition.includes("Heavy Rain")) score -= 15;
    else if (params.weatherCondition.includes("Rain")) score -= 8;
    else if (params.weatherCondition.includes("Snow")) score -= 12;
    else if (params.weatherCondition.includes("Fog")) score -= 10;
    else if (params.weatherCondition === "Clear") score += 5;

    // Time of day impact
    if (params.hour >= 6 && params.hour <= 18) score += 10;
    else if (params.hour >= 22 || params.hour <= 5) score -= 12;

    return Math.max(20, Math.min(95, Math.round(score)));
  }

  // Generate active alerts based on conditions
  private generateActiveAlerts(params: {
    trafficDensity: number;
    incidentCount: number;
    weatherCondition: string;
    safetyScore: number;
  }): string[] {
    const alerts: string[] = [];

    if (params.trafficDensity > 85) {
      alerts.push("Heavy traffic congestion");
    }

    if (params.incidentCount > 2) {
      alerts.push("Multiple incidents reported");
    } else if (params.incidentCount > 0) {
      alerts.push("Traffic incident ahead");
    }

    if (params.weatherCondition.includes("Heavy Rain")) {
      alerts.push("Severe weather warning");
    } else if (
      params.weatherCondition.includes("Rain") ||
      params.weatherCondition.includes("Snow")
    ) {
      alerts.push("Weather advisory");
    }

    if (params.safetyScore < 40) {
      alerts.push("High risk area");
    } else if (params.safetyScore < 60) {
      alerts.push("Exercise caution");
    }

    return alerts;
  }

  // Generate unique subscription ID
  private generateId(): string {
    return `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current subscription count
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  // Get update status
  getStatus(): {
    isRunning: boolean;
    subscriptions: number;
    lastUpdate: number;
  } {
    let lastUpdate = 0;
    for (const sub of this.subscriptions.values()) {
      if (sub.lastUpdate > lastUpdate) {
        lastUpdate = sub.lastUpdate;
      }
    }

    return {
      isRunning: this.isRunning,
      subscriptions: this.subscriptions.size,
      lastUpdate,
    };
  }
}

// Export singleton instance
export const realTimeDataService = RealTimeDataService.getInstance();

// Export types
export type { RealTimeUpdate, DataSubscription };
