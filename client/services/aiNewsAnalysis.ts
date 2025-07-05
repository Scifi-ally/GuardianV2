interface NewsItem {
  id: string;
  title: string;
  content: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    radius?: number; // km
  };
  timestamp: Date;
  source: string;
  category:
    | "crime"
    | "emergency"
    | "weather"
    | "traffic"
    | "safety"
    | "general";
  severity: "low" | "medium" | "high" | "critical";
  safetyImpact: number; // -50 to +50
}

interface EnvironmentalFactor {
  type: "lighting" | "weather" | "time" | "crowding" | "infrastructure";
  value: number; // 0-100
  weight: number; // importance multiplier
  description: string;
}

interface SafetyScoreBreakdown {
  baseScore: number;
  newsImpact: number;
  environmentalFactors: EnvironmentalFactor[];
  timeOfDayAdjustment: number;
  weatherImpact: number;
  crowdingFactor: number;
  infrastructureScore: number;
  finalScore: number;
  confidence: number;
}

class AINewsAnalysisService {
  private newsCache: Map<string, NewsItem[]> = new Map();
  private lastUpdate: Date | null = null;
  private readonly UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes

  async getLocationSafetyScore(
    latitude: number,
    longitude: number,
  ): Promise<SafetyScoreBreakdown> {
    console.log("🧠 Calculating AI-powered safety score for location:", {
      lat: latitude.toFixed(4),
      lng: longitude.toFixed(4),
    });

    // Get relevant news for location
    const relevantNews = await this.getRelevantNews(latitude, longitude);

    // Calculate environmental factors
    const environmentalFactors = await this.calculateEnvironmentalFactors(
      latitude,
      longitude,
    );

    // Calculate base score
    const baseScore = 70; // Neutral starting point

    // Calculate news impact
    const newsImpact = this.calculateNewsImpact(relevantNews);

    // Time-based adjustments
    const timeOfDayAdjustment = this.calculateTimeOfDayFactor();

    // Weather impact
    const weatherImpact = await this.calculateWeatherImpact(
      latitude,
      longitude,
    );

    // Crowding factor (simulated - would use real foot traffic data)
    const crowdingFactor = this.calculateCrowdingFactor();

    // Infrastructure score (lighting, emergency services, etc.)
    const infrastructureScore = await this.calculateInfrastructureScore(
      latitude,
      longitude,
    );

    // Combine all factors with proper weighting
    const environmentalBonus = environmentalFactors.reduce(
      (sum, factor) => sum + ((factor.value - 50) * factor.weight) / 20, // Normalize around 50
      0,
    );

    const rawScore =
      baseScore +
      newsImpact +
      timeOfDayAdjustment +
      weatherImpact +
      crowdingFactor +
      infrastructureScore +
      environmentalBonus;

    // Ensure score is within valid range and properly distributed
    const finalScore = Math.max(15, Math.min(100, Math.round(rawScore)));

    console.log("🧮 Safety Score Calculation:", {
      baseScore,
      newsImpact,
      timeOfDayAdjustment,
      weatherImpact,
      crowdingFactor,
      infrastructureScore,
      environmentalBonus: Math.round(environmentalBonus),
      rawScore: Math.round(rawScore),
      finalScore,
    });

    const confidence = this.calculateConfidence(
      relevantNews,
      environmentalFactors,
    );

    const breakdown: SafetyScoreBreakdown = {
      baseScore,
      newsImpact,
      environmentalFactors,
      timeOfDayAdjustment,
      weatherImpact,
      crowdingFactor,
      infrastructureScore,
      finalScore: Math.round(finalScore),
      confidence,
    };

    console.log("🎯 Safety score breakdown:", breakdown);
    return breakdown;
  }

  private async getRelevantNews(
    latitude: number,
    longitude: number,
  ): Promise<NewsItem[]> {
    const locationKey = `${latitude.toFixed(3)}_${longitude.toFixed(3)}`;

    // Check cache first
    if (
      this.newsCache.has(locationKey) &&
      this.lastUpdate &&
      Date.now() - this.lastUpdate.getTime() < this.UPDATE_INTERVAL
    ) {
      return this.newsCache.get(locationKey) || [];
    }

    try {
      // In production, this would call real news APIs like:
      // - Google News API
      // - NewsAPI.org
      // - Local police department APIs
      // - Traffic APIs

      const mockNews = await this.generateMockNews(latitude, longitude);
      this.newsCache.set(locationKey, mockNews);
      this.lastUpdate = new Date();

      return mockNews;
    } catch (error) {
      console.error("Failed to fetch news:", error);
      return [];
    }
  }

  private async generateMockNews(
    latitude: number,
    longitude: number,
  ): Promise<NewsItem[]> {
    // Simulate AI analysis of real news sources
    const newsTemplates = [
      {
        category: "crime" as const,
        severity: "medium" as const,
        safetyImpact: -15,
        title: "Increased patrol presence reported in downtown area",
        content:
          "Local police department announces increased security measures following recent incidents.",
      },
      {
        category: "safety" as const,
        severity: "low" as const,
        safetyImpact: 10,
        title: "New street lighting installed on main thoroughfare",
        content:
          "City completes installation of LED lighting system to improve pedestrian safety.",
      },
      {
        category: "emergency" as const,
        severity: "high" as const,
        safetyImpact: -25,
        title: "Emergency services respond to incident in area",
        content:
          "First responders active in the vicinity, residents advised to use alternate routes.",
      },
      {
        category: "traffic" as const,
        severity: "low" as const,
        safetyImpact: -5,
        title: "Road construction may affect pedestrian access",
        content:
          "Temporary construction work limiting sidewalk access during daytime hours.",
      },
    ];

    // Select relevant news based on location and time
    const relevantNews = newsTemplates
      .filter(() => Math.random() < 0.3) // 30% chance for each news item
      .map((template, index) => ({
        id: `news_${Date.now()}_${index}`,
        ...template,
        location: {
          latitude: latitude + (Math.random() - 0.5) * 0.01, // Within ~1km
          longitude: longitude + (Math.random() - 0.5) * 0.01,
          radius: 0.5 + Math.random() * 1.5, // 0.5-2km radius
        },
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Last 24 hours
        source: [
          "Local News",
          "Police Report",
          "City Updates",
          "Traffic Alert",
        ][Math.floor(Math.random() * 4)],
      }));

    return relevantNews;
  }

  private calculateNewsImpact(news: NewsItem[]): number {
    if (news.length === 0) return 0;

    const recentNews = news.filter(
      (item) => Date.now() - item.timestamp.getTime() < 6 * 60 * 60 * 1000, // Last 6 hours
    );

    const impact = recentNews.reduce((sum, item) => {
      // Weight by recency and severity
      const ageHours =
        (Date.now() - item.timestamp.getTime()) / (60 * 60 * 1000);
      const recencyWeight = Math.max(0.1, 1 - ageHours / 24);

      const severityMultiplier = {
        low: 0.5,
        medium: 1.0,
        high: 1.5,
        critical: 2.0,
      }[item.severity];

      return sum + item.safetyImpact * recencyWeight * severityMultiplier;
    }, 0);

    return Math.max(-30, Math.min(30, impact));
  }

  private calculateTimeOfDayFactor(): number {
    const hour = new Date().getHours();

    // Safety varies by time of day
    if (hour >= 6 && hour <= 8) return 5; // Morning rush - more people
    if (hour >= 9 && hour <= 17) return 10; // Business hours - safest
    if (hour >= 18 && hour <= 21) return 5; // Evening commute
    if (hour >= 22 || hour <= 5) return -15; // Late night/early morning - less safe

    return 0;
  }

  private async calculateWeatherImpact(
    latitude: number,
    longitude: number,
  ): Promise<number> {
    // In production, call weather API
    const mockWeather = {
      condition: ["clear", "cloudy", "rainy", "foggy"][
        Math.floor(Math.random() * 4)
      ],
      visibility: 8 + Math.random() * 2, // km
      temperature: 15 + Math.random() * 15, // °C
      windSpeed: Math.random() * 20, // km/h
    };

    let impact = 0;

    // Weather condition impact
    switch (mockWeather.condition) {
      case "clear":
        impact += 5;
        break;
      case "cloudy":
        impact += 0;
        break;
      case "rainy":
        impact -= 8;
        break;
      case "foggy":
        impact -= 12;
        break;
    }

    // Visibility impact
    if (mockWeather.visibility < 5) impact -= 10;
    else if (mockWeather.visibility > 10) impact += 3;

    // Temperature extremes
    if (mockWeather.temperature < 0 || mockWeather.temperature > 35) {
      impact -= 5; // Extreme temperatures reduce foot traffic
    }

    return Math.max(-20, Math.min(10, impact));
  }

  private calculateCrowdingFactor(): number {
    // Simulate foot traffic data
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    let crowding = 50; // Base crowding level

    // Time-based adjustments
    if (hour >= 7 && hour <= 9) crowding += 20; // Morning rush
    if (hour >= 17 && hour <= 19) crowding += 25; // Evening rush
    if (hour >= 12 && hour <= 14) crowding += 15; // Lunch time
    if (hour >= 22 || hour <= 6) crowding -= 30; // Night time

    // Day of week adjustments
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend
      crowding -= 10;
      if (hour >= 10 && hour <= 22) crowding += 15; // Weekend social hours
    }

    // Convert crowding to safety factor
    // More people generally means safer (within reason)
    if (crowding < 20) return -10; // Too empty
    if (crowding > 80) return -5; // Too crowded
    if (crowding >= 40 && crowding <= 70) return 8; // Optimal crowding

    return 0;
  }

  private async calculateInfrastructureScore(
    latitude: number,
    longitude: number,
  ): Promise<number> {
    // Simulate infrastructure analysis
    // In production, use Google Places API, OpenStreetMap, etc.

    let score = 0;

    // Lighting (simulated based on area type)
    const lightingScore = 60 + Math.random() * 40; // 60-100
    if (lightingScore > 85) score += 8;
    else if (lightingScore < 50) score -= 12;

    // Emergency services proximity (simulated)
    const policeDistance = Math.random() * 3; // km
    const hospitalDistance = Math.random() * 5; // km

    if (policeDistance < 0.5) score += 10;
    else if (policeDistance > 2) score -= 5;

    if (hospitalDistance < 1) score += 5;
    else if (hospitalDistance > 4) score -= 3;

    // Public transport availability
    const publicTransportScore = Math.random() * 100;
    if (publicTransportScore > 70) score += 5;
    else if (publicTransportScore < 30) score -= 8;

    // CCTV coverage (simulated)
    const cctvCoverage = Math.random() * 100;
    if (cctvCoverage > 80) score += 6;
    else if (cctvCoverage < 40) score -= 4;

    return Math.max(-25, Math.min(25, score));
  }

  private async calculateEnvironmentalFactors(
    latitude: number,
    longitude: number,
  ): Promise<EnvironmentalFactor[]> {
    return [
      {
        type: "lighting",
        value: 65 + Math.random() * 35, // Simulated lighting quality
        weight: 0.8,
        description: "Street and ambient lighting quality",
      },
      {
        type: "infrastructure",
        value: 70 + Math.random() * 30,
        weight: 0.6,
        description: "Emergency services and public safety infrastructure",
      },
      {
        type: "crowding",
        value: 40 + Math.random() * 40,
        weight: 0.5,
        description: "Pedestrian activity and foot traffic",
      },
    ];
  }

  private calculateConfidence(
    news: NewsItem[],
    factors: EnvironmentalFactor[],
  ): number {
    let confidence = 50; // Base confidence

    // More recent news increases confidence
    const recentNews = news.filter(
      (item) => Date.now() - item.timestamp.getTime() < 2 * 60 * 60 * 1000,
    );
    confidence += recentNews.length * 10;

    // More data points increase confidence
    confidence += factors.length * 5;

    // High-quality data sources increase confidence
    const reliableSources = news.filter((item) =>
      ["Police Report", "City Updates"].includes(item.source),
    );
    confidence += reliableSources.length * 15;

    return Math.max(20, Math.min(95, confidence));
  }

  // Public method to get news for display
  async getRecentNewsForLocation(
    latitude: number,
    longitude: number,
  ): Promise<NewsItem[]> {
    return this.getRelevantNews(latitude, longitude);
  }
}

export const aiNewsAnalysis = new AINewsAnalysisService();
export type { NewsItem, SafetyScoreBreakdown, EnvironmentalFactor };
