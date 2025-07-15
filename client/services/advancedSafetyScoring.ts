/**
 * Advanced Safety Scoring Service
 * Complex metrics for route safety evaluation in emergency scenarios
 */

interface RouteMetrics {
  distance: number; // km
  duration: number; // minutes
  timeOfDay: number; // 0-23 hours
  weatherConditions: "clear" | "rain" | "storm" | "fog" | "snow";
  trafficDensity: "low" | "medium" | "high" | "extreme";
  roadTypes: Array<"highway" | "arterial" | "local" | "residential">;
  crimeData: {
    recentIncidents: number;
    crimeRate: number; // per 1000 residents
    crimeSeverity: "low" | "medium" | "high";
  };
  emergencyServices: {
    hospitalDistance: number; // km to nearest hospital
    policeStationDistance: number; // km to nearest police
    responseTime: number; // average emergency response time in minutes
  };
  demographics: {
    populationDensity: number; // people per km²
    averageIncome: number; // socioeconomic indicator
    lightingQuality: number; // 0-100 street lighting score
  };
  infrastructure: {
    roadQuality: number; // 0-100 road condition score
    cctv: boolean; // surveillance presence
    emergencyCallBoxes: boolean;
    publicTransport: boolean;
  };
  environmentalFactors: {
    airQuality: number; // 0-500 AQI
    noiseLevel: number; // decibels
    visibility: number; // 0-100 visibility score
  };
}

interface SafetyScore {
  overall: number; // 0-100
  breakdown: {
    temporal: number; // time-based safety
    environmental: number; // weather, visibility
    security: number; // crime, police presence
    infrastructure: number; // road quality, lighting
    emergency: number; // access to emergency services
    traffic: number; // traffic safety
  };
  riskFactors: string[];
  recommendations: string[];
  confidence: number; // 0-100 confidence in score
}

class AdvancedSafetyScoring {
  private static instance: AdvancedSafetyScoring;

  static getInstance(): AdvancedSafetyScoring {
    if (!AdvancedSafetyScoring.instance) {
      AdvancedSafetyScoring.instance = new AdvancedSafetyScoring();
    }
    return AdvancedSafetyScoring.instance;
  }

  /**
   * Calculate comprehensive safety score for a route
   */
  calculateRouteSafety(metrics: RouteMetrics): SafetyScore {
    const breakdown = {
      temporal: this.calculateTemporalSafety(metrics.timeOfDay),
      environmental: this.calculateEnvironmentalSafety(metrics),
      security: this.calculateSecuritySafety(
        metrics.crimeData,
        metrics.infrastructure,
      ),
      infrastructure: this.calculateInfrastructureSafety(
        metrics.infrastructure,
        metrics.demographics,
      ),
      emergency: this.calculateEmergencyAccessSafety(metrics.emergencyServices),
      traffic: this.calculateTrafficSafety(
        metrics.trafficDensity,
        metrics.roadTypes,
        metrics.weatherConditions,
      ),
    };

    // Weighted average with emphasis on critical factors
    const weights = {
      temporal: 0.15,
      environmental: 0.2,
      security: 0.25,
      infrastructure: 0.15,
      emergency: 0.15,
      traffic: 0.1,
    };

    let overall = 0;
    let totalWeight = 0;

    Object.entries(breakdown).forEach(([key, score]) => {
      const weight = weights[key as keyof typeof weights];
      overall += score * weight;
      totalWeight += weight;
    });

    overall = overall / totalWeight;

    // Apply critical factor penalties
    overall = this.applyCriticalFactorAdjustments(overall, metrics);

    const { riskFactors, recommendations } =
      this.identifyRisksAndRecommendations(breakdown, metrics);
    const confidence = this.calculateConfidenceScore(metrics);

    return {
      overall: Math.round(Math.max(0, Math.min(100, overall))),
      breakdown,
      riskFactors,
      recommendations,
      confidence,
    };
  }

  /**
   * Calculate time-based safety score
   */
  private calculateTemporalSafety(timeOfDay: number): number {
    // Peak safety during daylight hours
    if (timeOfDay >= 8 && timeOfDay <= 17) return 95; // Business hours
    if (timeOfDay >= 6 && timeOfDay <= 19) return 85; // Extended daylight
    if (timeOfDay >= 19 && timeOfDay <= 22) return 70; // Evening
    if (timeOfDay >= 22 || timeOfDay <= 2) return 45; // Late night
    return 35; // Very early morning (2-6 AM)
  }

  /**
   * Calculate environmental safety (weather, visibility, air quality)
   */
  private calculateEnvironmentalSafety(metrics: RouteMetrics): number {
    let score = 100;

    // Weather impact
    switch (metrics.weatherConditions) {
      case "clear":
        score -= 0;
        break;
      case "rain":
        score -= 15;
        break;
      case "fog":
        score -= 25;
        break;
      case "snow":
        score -= 30;
        break;
      case "storm":
        score -= 40;
        break;
    }

    // Visibility impact
    score = score * (metrics.environmentalFactors.visibility / 100);

    // Air quality impact (minor for safety, major for health)
    if (metrics.environmentalFactors.airQuality > 300)
      score -= 20; // Very unhealthy
    else if (metrics.environmentalFactors.airQuality > 200)
      score -= 10; // Unhealthy
    else if (metrics.environmentalFactors.airQuality > 150) score -= 5; // Unhealthy for sensitive

    return Math.max(0, score);
  }

  /**
   * Calculate security-based safety (crime, surveillance)
   */
  private calculateSecuritySafety(
    crimeData: RouteMetrics["crimeData"],
    infrastructure: RouteMetrics["infrastructure"],
  ): number {
    let score = 100;

    // Crime rate impact
    if (crimeData.crimeRate > 50)
      score -= 30; // Very high crime
    else if (crimeData.crimeRate > 25)
      score -= 20; // High crime
    else if (crimeData.crimeRate > 10)
      score -= 10; // Moderate crime
    else if (crimeData.crimeRate > 5) score -= 5; // Low crime

    // Recent incidents impact
    score -= Math.min(30, crimeData.recentIncidents * 5);

    // Crime severity impact
    switch (crimeData.crimeSeverity) {
      case "high":
        score -= 25;
        break;
      case "medium":
        score -= 10;
        break;
      case "low":
        score -= 0;
        break;
    }

    // Infrastructure security bonuses
    if (infrastructure.cctv) score += 10;
    if (infrastructure.emergencyCallBoxes) score += 5;

    return Math.max(0, score);
  }

  /**
   * Calculate infrastructure safety (roads, lighting, amenities)
   */
  private calculateInfrastructureSafety(
    infrastructure: RouteMetrics["infrastructure"],
    demographics: RouteMetrics["demographics"],
  ): number {
    let score = 50; // Base score

    // Road quality impact
    score += (infrastructure.roadQuality / 100) * 30;

    // Lighting quality impact
    score += (demographics.lightingQuality / 100) * 20;

    // Population density (moderate density is safest)
    const densityScore = demographics.populationDensity;
    if (densityScore > 1000 && densityScore < 5000)
      score += 15; // Optimal
    else if (densityScore > 500 && densityScore < 10000)
      score += 10; // Good
    else if (densityScore < 100)
      score -= 15; // Too isolated
    else if (densityScore > 15000) score -= 10; // Too crowded

    // Public transport availability
    if (infrastructure.publicTransport) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate emergency services accessibility
   */
  private calculateEmergencyAccessSafety(
    emergencyServices: RouteMetrics["emergencyServices"],
  ): number {
    let score = 100;

    // Distance to hospital
    if (emergencyServices.hospitalDistance > 20) score -= 30;
    else if (emergencyServices.hospitalDistance > 10) score -= 15;
    else if (emergencyServices.hospitalDistance > 5) score -= 5;

    // Distance to police
    if (emergencyServices.policeStationDistance > 15) score -= 20;
    else if (emergencyServices.policeStationDistance > 8) score -= 10;
    else if (emergencyServices.policeStationDistance > 3) score -= 5;

    // Response time
    if (emergencyServices.responseTime > 15) score -= 25;
    else if (emergencyServices.responseTime > 10) score -= 15;
    else if (emergencyServices.responseTime > 5) score -= 5;

    return Math.max(0, score);
  }

  /**
   * Calculate traffic-related safety
   */
  private calculateTrafficSafety(
    trafficDensity: RouteMetrics["trafficDensity"],
    roadTypes: RouteMetrics["roadTypes"],
    weather: RouteMetrics["weatherConditions"],
  ): number {
    let score = 85; // Base score

    // Traffic density impact
    switch (trafficDensity) {
      case "low":
        score += 10;
        break;
      case "medium":
        score += 0;
        break;
      case "high":
        score -= 15;
        break;
      case "extreme":
        score -= 30;
        break;
    }

    // Road type safety
    const roadSafety =
      roadTypes.reduce((avg, roadType) => {
        switch (roadType) {
          case "highway":
            return avg + 90;
          case "arterial":
            return avg + 80;
          case "local":
            return avg + 75;
          case "residential":
            return avg + 85;
        }
      }, 0) / roadTypes.length;

    score = (score + roadSafety) / 2;

    // Weather impact on traffic safety
    switch (weather) {
      case "storm":
        score -= 25;
        break;
      case "snow":
        score -= 20;
        break;
      case "rain":
        score -= 10;
        break;
      case "fog":
        score -= 15;
        break;
    }

    return Math.max(0, score);
  }

  /**
   * Apply critical adjustments for extreme conditions
   */
  private applyCriticalFactorAdjustments(
    score: number,
    metrics: RouteMetrics,
  ): number {
    // Extreme weather penalty
    if (metrics.weatherConditions === "storm") score *= 0.7;

    // Very high crime area penalty
    if (
      metrics.crimeData.crimeSeverity === "high" &&
      metrics.crimeData.crimeRate > 40
    ) {
      score *= 0.6;
    }

    // Poor emergency access in dangerous conditions
    if (
      metrics.emergencyServices.responseTime > 20 &&
      metrics.crimeData.crimeRate > 30
    ) {
      score *= 0.8;
    }

    // Late night in high crime area
    if (
      (metrics.timeOfDay >= 23 || metrics.timeOfDay <= 3) &&
      metrics.crimeData.crimeRate > 20
    ) {
      score *= 0.7;
    }

    return score;
  }

  /**
   * Identify risk factors and provide recommendations
   */
  private identifyRisksAndRecommendations(
    breakdown: SafetyScore["breakdown"],
    metrics: RouteMetrics,
  ): { riskFactors: string[]; recommendations: string[] } {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    if (breakdown.temporal < 60) {
      riskFactors.push("Traveling during high-risk hours");
      recommendations.push("Consider delaying travel until daylight hours");
    }

    if (breakdown.environmental < 60) {
      riskFactors.push("Poor weather or visibility conditions");
      recommendations.push("Use extra caution and reduce speed");
    }

    if (breakdown.security < 50) {
      riskFactors.push("High crime area");
      recommendations.push(
        "Stay alert, avoid stopping, consider alternative route",
      );
    }

    if (breakdown.emergency < 60) {
      riskFactors.push("Limited emergency services access");
      recommendations.push("Inform someone of your route and expected arrival");
    }

    if (breakdown.traffic < 60) {
      riskFactors.push("Dangerous traffic conditions");
      recommendations.push(
        "Allow extra travel time and maintain safe following distance",
      );
    }

    return { riskFactors, recommendations };
  }

  /**
   * Calculate confidence in the safety score
   */
  private calculateConfidenceScore(metrics: RouteMetrics): number {
    let confidence = 100;

    // Reduce confidence for missing or uncertain data
    if (!metrics.crimeData || metrics.crimeData.recentIncidents === undefined)
      confidence -= 20;
    if (!metrics.infrastructure.cctv === undefined) confidence -= 10;
    if (metrics.demographics.populationDensity === 0) confidence -= 15;

    return Math.max(50, confidence); // Minimum 50% confidence
  }

  /**
   * Generate route-specific safety metrics for comparison
   */
  generateRouteComparison(
    quickestRoute: Partial<RouteMetrics>,
    safestRoute: Partial<RouteMetrics>,
  ): {
    quickest: SafetyScore;
    safest: SafetyScore;
    recommendation: string;
  } {
    // Default metrics for simulation
    const defaultMetrics: RouteMetrics = {
      distance: 10,
      duration: 20,
      timeOfDay: new Date().getHours(),
      weatherConditions: "clear",
      trafficDensity: "medium",
      roadTypes: ["arterial", "local"],
      crimeData: {
        recentIncidents: 2,
        crimeRate: 8,
        crimeSeverity: "low",
      },
      emergencyServices: {
        hospitalDistance: 5,
        policeStationDistance: 3,
        responseTime: 8,
      },
      demographics: {
        populationDensity: 2500,
        averageIncome: 50000,
        lightingQuality: 75,
      },
      infrastructure: {
        roadQuality: 80,
        cctv: true,
        emergencyCallBoxes: false,
        publicTransport: true,
      },
      environmentalFactors: {
        airQuality: 85,
        noiseLevel: 55,
        visibility: 90,
      },
    };

    const quickestMetrics = { ...defaultMetrics, ...quickestRoute };
    const safestMetrics = { ...defaultMetrics, ...safestRoute };

    // Adjust for route characteristics
    quickestMetrics.trafficDensity = "high";
    quickestMetrics.roadTypes = ["highway", "arterial"];
    quickestMetrics.crimeData.crimeRate =
      defaultMetrics.crimeData.crimeRate + 5;

    safestMetrics.trafficDensity = "low";
    safestMetrics.roadTypes = ["local", "residential"];
    safestMetrics.crimeData.crimeRate = Math.max(
      1,
      defaultMetrics.crimeData.crimeRate - 3,
    );
    safestMetrics.demographics.lightingQuality = 90;
    safestMetrics.infrastructure.cctv = true;

    const quickestScore = this.calculateRouteSafety(quickestMetrics);
    const safestScore = this.calculateRouteSafety(safestMetrics);

    let recommendation = "Both routes have similar safety profiles.";
    if (safestScore.overall - quickestScore.overall > 15) {
      recommendation =
        "Safest route recommended due to significantly better safety conditions.";
    } else if (quickestScore.overall > 80) {
      recommendation = "Quickest route is acceptably safe for faster travel.";
    }

    return {
      quickest: quickestScore,
      safest: safestScore,
      recommendation,
    };
  }
}

export const advancedSafetyScoring = AdvancedSafetyScoring.getInstance();
export type { RouteMetrics, SafetyScore };
