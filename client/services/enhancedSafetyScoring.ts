import {
  geminiNewsAnalysisService,
  type SafetyAnalysis,
} from "./geminiNewsAnalysisService";

interface AdvancedSafetyFactors {
  // Environmental factors
  timeOfDay: number; // 0-24
  dayOfWeek: number; // 0-6
  weather: "clear" | "rain" | "storm" | "snow" | "fog";
  lighting: "excellent" | "good" | "moderate" | "poor" | "very_poor";

  // Location factors
  populationDensity: number; // 0-100
  businessActivity: number; // 0-100
  transitAccessibility: number; // 0-100
  emergencyResponseTime: number; // minutes

  // Historical data
  crimeRateHistory: number; // 0-100 (inverted, lower is better)
  incidentFrequency: number; // 0-100 (inverted)
  communityEngagement: number; // 0-100

  // Real-time factors
  currentEvents: number; // 0-100
  trafficFlow: number; // 0-100
  crowdDensity: number; // 0-100
}

interface EnhancedSafetyScore {
  overallScore: number; // 0-100
  confidence: number; // 0-100
  factors: AdvancedSafetyFactors;
  analysis: SafetyAnalysis;
  recommendations: string[];
  alertLevel: "safe" | "caution" | "warning" | "danger";
  dynamicFactors: {
    trending: "improving" | "stable" | "declining";
    prediction: number; // predicted score in 1 hour
    volatility: number; // 0-100
  };
}

export class EnhancedSafetyScoring {
  private static instance: EnhancedSafetyScoring;
  private cache: Map<string, { data: EnhancedSafetyScore; timestamp: number }> =
    new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for real-time updates

  static getInstance(): EnhancedSafetyScoring {
    if (!EnhancedSafetyScoring.instance) {
      EnhancedSafetyScoring.instance = new EnhancedSafetyScoring();
    }
    return EnhancedSafetyScoring.instance;
  }

  async calculateEnhancedSafety(
    lat: number,
    lng: number,
    options?: {
      includeRealTime?: boolean;
      includePrediction?: boolean;
      detailLevel?: "basic" | "detailed" | "comprehensive";
    },
  ): Promise<EnhancedSafetyScore> {
    const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Get AI analysis from Gemini
      const analysis = await geminiNewsAnalysisService.analyzeAreaSafety(
        lat,
        lng,
      );

      // Calculate advanced factors
      const factors = await this.calculateAdvancedFactors(lat, lng);

      // Perform multi-dimensional safety calculation
      const enhancedScore = await this.performAdvancedScoring(
        lat,
        lng,
        factors,
        analysis,
        options,
      );

      this.cache.set(cacheKey, {
        data: enhancedScore,
        timestamp: Date.now(),
      });

      return enhancedScore;
    } catch (error) {
      console.warn("Enhanced safety scoring failed, using fallback:", error);
      return this.getFallbackScore(lat, lng);
    }
  }

  private async calculateAdvancedFactors(
    lat: number,
    lng: number,
  ): Promise<AdvancedSafetyFactors> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Simulate advanced factor calculation
    // In production, these would come from various APIs and databases
    return {
      timeOfDay: hour,
      dayOfWeek,
      weather: this.getWeatherCondition(lat, lng),
      lighting: this.calculateLighting(hour, lat, lng),
      populationDensity: this.estimatePopulationDensity(lat, lng),
      businessActivity: this.estimateBusinessActivity(lat, lng, hour),
      transitAccessibility: this.calculateTransitAccess(lat, lng),
      emergencyResponseTime: this.estimateResponseTime(lat, lng),
      crimeRateHistory: this.getCrimeHistory(lat, lng),
      incidentFrequency: this.getIncidentFrequency(lat, lng),
      communityEngagement: this.getCommunityEngagement(lat, lng),
      currentEvents: this.getCurrentEvents(lat, lng),
      trafficFlow: this.getTrafficFlow(lat, lng, hour),
      crowdDensity: this.getCrowdDensity(lat, lng, hour),
    };
  }

  private async performAdvancedScoring(
    lat: number,
    lng: number,
    factors: AdvancedSafetyFactors,
    analysis: SafetyAnalysis,
    options?: {
      includeRealTime?: boolean;
      includePrediction?: boolean;
      detailLevel?: "basic" | "detailed" | "comprehensive";
    },
  ): Promise<EnhancedSafetyScore> {
    // Multi-dimensional scoring algorithm
    let score = 50; // Base score

    // Time-based factors (25% weight)
    const timeScore = this.calculateTimeScore(factors);
    score += timeScore * 0.25;

    // Environmental factors (20% weight)
    const envScore = this.calculateEnvironmentalScore(factors);
    score += envScore * 0.2;

    // Location-based factors (25% weight)
    const locationScore = this.calculateLocationScore(factors);
    score += locationScore * 0.25;

    // AI analysis integration (20% weight)
    const aiScore = analysis.score - 50; // Convert to relative scale
    score += aiScore * 0.2;

    // Real-time adjustments (10% weight)
    if (options?.includeRealTime) {
      const realTimeScore = this.calculateRealTimeScore(factors);
      score += realTimeScore * 0.1;
    }

    // Ensure score is within bounds
    score = Math.max(10, Math.min(95, score));

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(factors, analysis);

    // Generate recommendations
    const recommendations = this.generateRecommendations(score, factors);

    // Determine alert level
    const alertLevel = this.determineAlertLevel(score);

    // Calculate dynamic factors
    const dynamicFactors = this.calculateDynamicFactors(factors, score);

    return {
      overallScore: Math.round(score),
      confidence,
      factors,
      analysis,
      recommendations,
      alertLevel,
      dynamicFactors,
    };
  }

  private calculateTimeScore(factors: AdvancedSafetyFactors): number {
    let score = 0;

    // Time of day impact
    if (factors.timeOfDay >= 6 && factors.timeOfDay <= 18) {
      score += 20; // Daytime bonus
    } else if (factors.timeOfDay >= 19 && factors.timeOfDay <= 22) {
      score += 10; // Evening
    } else {
      score -= 15; // Night penalty
    }

    // Day of week impact
    if (factors.dayOfWeek >= 1 && factors.dayOfWeek <= 5) {
      score += 5; // Weekday bonus
    } else {
      score -= 5; // Weekend can be more unpredictable
    }

    // Lighting conditions
    const lightingBonus = {
      excellent: 15,
      good: 10,
      moderate: 0,
      poor: -10,
      very_poor: -20,
    };
    score += lightingBonus[factors.lighting];

    return score;
  }

  private calculateEnvironmentalScore(factors: AdvancedSafetyFactors): number {
    let score = 0;

    // Weather impact
    const weatherImpact = {
      clear: 10,
      rain: -5,
      storm: -15,
      snow: -10,
      fog: -8,
    };
    score += weatherImpact[factors.weather];

    // Population density (moderate is best)
    if (factors.populationDensity >= 30 && factors.populationDensity <= 70) {
      score += 15; // Sweet spot
    } else if (factors.populationDensity < 10) {
      score -= 10; // Too isolated
    } else if (factors.populationDensity > 90) {
      score -= 5; // Too crowded
    }

    return score;
  }

  private calculateLocationScore(factors: AdvancedSafetyFactors): number {
    let score = 0;

    // Business activity
    score += (factors.businessActivity / 100) * 15;

    // Transit accessibility
    score += (factors.transitAccessibility / 100) * 10;

    // Emergency response time (lower is better)
    if (factors.emergencyResponseTime < 5) score += 15;
    else if (factors.emergencyResponseTime < 10) score += 10;
    else if (factors.emergencyResponseTime > 15) score -= 10;

    // Historical safety (inverted scale)
    score += ((100 - factors.crimeRateHistory) / 100) * 20;
    score += ((100 - factors.incidentFrequency) / 100) * 15;

    // Community engagement
    score += (factors.communityEngagement / 100) * 10;

    return score;
  }

  private calculateRealTimeScore(factors: AdvancedSafetyFactors): number {
    let score = 0;

    // Current events impact
    score += ((factors.currentEvents - 50) / 100) * 20;

    // Traffic flow (moderate is best)
    if (factors.trafficFlow >= 30 && factors.trafficFlow <= 70) {
      score += 10;
    } else if (factors.trafficFlow < 10 || factors.trafficFlow > 90) {
      score -= 10;
    }

    // Crowd density
    if (factors.crowdDensity >= 20 && factors.crowdDensity <= 60) {
      score += 5;
    } else if (factors.crowdDensity > 80) {
      score -= 10;
    }

    return score;
  }

  private calculateConfidence(
    factors: AdvancedSafetyFactors,
    analysis: SafetyAnalysis,
  ): number {
    let confidence = analysis.confidence || 50;

    // Adjust based on data completeness
    if (factors.emergencyResponseTime > 0) confidence += 10;
    if (factors.crimeRateHistory > 0) confidence += 15;
    if (factors.currentEvents > 0) confidence += 10;

    return Math.min(95, confidence);
  }

  private generateRecommendations(
    score: number,
    factors: AdvancedSafetyFactors,
  ): string[] {
    const recommendations: string[] = [];

    if (score < 40) {
      recommendations.push("Consider avoiding this area if possible");
      recommendations.push("Travel in groups if you must visit");
      recommendations.push("Stay on well-lit main roads");
    }

    if (factors.lighting === "poor" || factors.lighting === "very_poor") {
      recommendations.push("Use a flashlight or phone light");
    }

    if (factors.emergencyResponseTime > 10) {
      recommendations.push("Inform someone of your location");
    }

    if (factors.timeOfDay >= 22 || factors.timeOfDay <= 5) {
      recommendations.push("Extra caution advised during night hours");
    }

    if (factors.crowdDensity > 80) {
      recommendations.push("Be aware of pickpockets in crowded areas");
    }

    if (score >= 80) {
      recommendations.push("This is a generally safe area");
      recommendations.push("Normal safety precautions apply");
    }

    return recommendations.slice(0, 4); // Limit to 4 recommendations
  }

  private determineAlertLevel(
    score: number,
  ): "safe" | "caution" | "warning" | "danger" {
    if (score >= 80) return "safe";
    if (score >= 60) return "caution";
    if (score >= 40) return "warning";
    return "danger";
  }

  private calculateDynamicFactors(
    factors: AdvancedSafetyFactors,
    currentScore: number,
  ) {
    // Simple trend calculation based on time and events
    let trending: "improving" | "stable" | "declining" = "stable";

    if (factors.currentEvents > 60) trending = "improving";
    else if (factors.currentEvents < 40) trending = "declining";

    // Predict score in 1 hour based on time trends
    const nextHour = (factors.timeOfDay + 1) % 24;
    let prediction = currentScore;

    if (nextHour >= 6 && factors.timeOfDay < 6)
      prediction += 10; // Dawn
    else if (nextHour >= 22 && factors.timeOfDay < 22) prediction -= 10; // Night

    // Calculate volatility based on various factors
    const volatility = Math.min(
      100,
      Math.abs(factors.crowdDensity - 50) +
        Math.abs(factors.trafficFlow - 50) +
        factors.incidentFrequency / 2,
    );

    return {
      trending,
      prediction: Math.max(10, Math.min(95, prediction)),
      volatility: Math.round(volatility),
    };
  }

  // Utility methods for factor calculation
  private getWeatherCondition(
    lat: number,
    lng: number,
  ): AdvancedSafetyFactors["weather"] {
    // Simulate weather - in production, use weather API
    const conditions: AdvancedSafetyFactors["weather"][] = [
      "clear",
      "rain",
      "storm",
      "snow",
      "fog",
    ];
    const hash = Math.abs((lat * lng * 1000) % 100);
    if (hash < 60) return "clear";
    if (hash < 75) return "rain";
    if (hash < 85) return "fog";
    if (hash < 95) return "snow";
    return "storm";
  }

  private calculateLighting(
    hour: number,
    lat: number,
    lng: number,
  ): AdvancedSafetyFactors["lighting"] {
    if (hour >= 6 && hour <= 18) return "excellent";
    if (hour === 5 || hour === 19) return "good";
    if (hour === 20 || hour === 21) return "moderate";
    if (hour === 22 || hour === 23 || hour <= 4) return "poor";
    return "very_poor";
  }

  private estimatePopulationDensity(lat: number, lng: number): number {
    return Math.floor(Math.abs((lat * lng * 7) % 100));
  }

  private estimateBusinessActivity(
    lat: number,
    lng: number,
    hour: number,
  ): number {
    let base = Math.floor(Math.abs((lat * lng * 11) % 80)) + 20;
    if (hour >= 9 && hour <= 17) base += 20;
    else if (hour >= 18 && hour <= 21) base += 10;
    else base -= 20;
    return Math.max(0, Math.min(100, base));
  }

  private calculateTransitAccess(lat: number, lng: number): number {
    return Math.floor(Math.abs((lat * lng * 13) % 100));
  }

  private estimateResponseTime(lat: number, lng: number): number {
    return Math.floor(Math.abs((lat * lng * 17) % 20)) + 3;
  }

  private getCrimeHistory(lat: number, lng: number): number {
    return Math.floor(Math.abs((lat * lng * 19) % 100));
  }

  private getIncidentFrequency(lat: number, lng: number): number {
    return Math.floor(Math.abs((lat * lng * 23) % 100));
  }

  private getCommunityEngagement(lat: number, lng: number): number {
    return Math.floor(Math.abs((lat * lng * 29) % 100));
  }

  private getCurrentEvents(lat: number, lng: number): number {
    return Math.floor(Math.abs(((lat * lng * Date.now()) / 1000000) % 100));
  }

  private getTrafficFlow(lat: number, lng: number, hour: number): number {
    let base = Math.floor(Math.abs((lat * lng * 31) % 60)) + 20;
    if (hour >= 7 && hour <= 9)
      base += 30; // Morning rush
    else if (hour >= 17 && hour <= 19) base += 25; // Evening rush
    return Math.min(100, base);
  }

  private getCrowdDensity(lat: number, lng: number, hour: number): number {
    let base = Math.floor(Math.abs((lat * lng * 37) % 50)) + 10;
    if (hour >= 12 && hour <= 14)
      base += 20; // Lunch
    else if (hour >= 18 && hour <= 21)
      base += 25; // Evening
    else if (hour >= 22 || hour <= 6) base -= 20; // Night
    return Math.max(0, Math.min(100, base));
  }

  private getFallbackScore(lat: number, lng: number): EnhancedSafetyScore {
    const basicScore = 60 + Math.floor(Math.abs((lat * lng * 41) % 30)) - 15;
    const factors: AdvancedSafetyFactors = {
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      weather: "clear",
      lighting: "moderate",
      populationDensity: 50,
      businessActivity: 50,
      transitAccessibility: 50,
      emergencyResponseTime: 8,
      crimeRateHistory: 50,
      incidentFrequency: 50,
      communityEngagement: 50,
      currentEvents: 50,
      trafficFlow: 50,
      crowdDensity: 50,
    };

    return {
      overallScore: Math.max(20, Math.min(80, basicScore)),
      confidence: 30,
      factors,
      analysis: {
        score: basicScore,
        confidence: 30,
        factors: ["Limited data available", "Basic calculation"],
        reasoning: "Fallback safety assessment with limited data",
        newsEvents: [],
      },
      recommendations: ["Use general safety precautions"],
      alertLevel: basicScore >= 60 ? "caution" : "warning",
      dynamicFactors: {
        trending: "stable",
        prediction: basicScore,
        volatility: 20,
      },
    };
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const enhancedSafetyScoring = EnhancedSafetyScoring.getInstance();

// Export types
export type { EnhancedSafetyScore, AdvancedSafetyFactors };
