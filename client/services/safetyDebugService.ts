interface SafetyCalculationBasis {
  location: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  baseScore: number;
  calculations: {
    step: string;
    value: number;
    contribution: number;
    description: string;
  }[];
  aiAnalysis?: {
    newsImpact: number;
    timeOfDayAdjustment: number;
    weatherImpact: number;
    crowdingFactor: number;
    infrastructureScore: number;
    confidence: number;
    environmentalFactors: Array<{
      type: string;
      value: number;
      description: string;
    }>;
  };
  factors: {
    crimeRate: { value: number; weight: number; source: string };
    lighting: { value: number; weight: number; source: string };
    footTraffic: { value: number; weight: number; source: string };
    emergencyServices: { value: number; weight: number; source: string };
    communityReports: { value: number; weight: number; source: string };
  };
  finalScore: number;
  safetyLevel: "unsafe" | "caution" | "moderate" | "safe" | "very safe";
  lastUpdated: Date;
}

class SafetyDebugService {
  private debugEnabled = false;
  private calculationHistory: SafetyCalculationBasis[] = [];
  private maxHistorySize = 50;

  // Backend-controlled debug mode
  public enableDebugMode(enable: boolean, adminKey?: string) {
    // In production, this would verify admin credentials
    if (
      adminKey === "debug_admin_2024" ||
      process.env.NODE_ENV === "development"
    ) {
      this.debugEnabled = enable;

      if (enable) {
        console.log("🐛 Safety Score Debug Mode ENABLED");
        console.log("🔍 Safety calculation basis will be logged and stored");
      } else {
        console.log("🐛 Safety Score Debug Mode DISABLED");
      }

      return true;
    }

    console.warn("❌ Unauthorized attempt to enable debug mode");
    return false;
  }

  public isDebugEnabled(): boolean {
    return this.debugEnabled;
  }

  public logSafetyCalculation(
    location: { latitude: number; longitude: number },
    baseScore: number,
    factors: any,
    finalScore: number,
    aiAnalysis?: any,
  ) {
    if (!this.debugEnabled) return;

    const calculations: SafetyCalculationBasis["calculations"] = [];

    // Log base score calculation
    calculations.push({
      step: "Base Score",
      value: baseScore,
      contribution: 0,
      description: "Initial safety score based on location characteristics",
    });

    // Log factor contributions
    let totalWeightedScore = 0;
    const factorWeights = {
      crimeRate: 0.25,
      lighting: 0.2,
      footTraffic: 0.15,
      emergencyServices: 0.2,
      communityReports: 0.2,
    };

    Object.entries(factors).forEach(([key, value]) => {
      const weight = factorWeights[key as keyof typeof factorWeights] || 0.1;
      const weightedValue = (value as number) * weight;
      totalWeightedScore += weightedValue;

      calculations.push({
        step: `${key.charAt(0).toUpperCase() + key.slice(1)} Factor`,
        value: value as number,
        contribution: weightedValue,
        description: this.getFactorDescription(key, value as number),
      });
    });

    // Log AI analysis contributions if available
    if (aiAnalysis) {
      calculations.push({
        step: "News Impact",
        value: aiAnalysis.newsImpact || 0,
        contribution: (aiAnalysis.newsImpact || 0) * 0.15,
        description: "Impact from recent news events and incidents",
      });

      calculations.push({
        step: "Time of Day",
        value: aiAnalysis.timeOfDayAdjustment || 0,
        contribution: (aiAnalysis.timeOfDayAdjustment || 0) * 0.1,
        description: "Adjustment based on current time and historical patterns",
      });

      calculations.push({
        step: "Weather Impact",
        value: aiAnalysis.weatherImpact || 0,
        contribution: (aiAnalysis.weatherImpact || 0) * 0.05,
        description: "Weather-related safety considerations",
      });

      calculations.push({
        step: "Crowding Factor",
        value: aiAnalysis.crowdingFactor || 0,
        contribution: (aiAnalysis.crowdingFactor || 0) * 0.1,
        description: "Population density and foot traffic analysis",
      });

      calculations.push({
        step: "Infrastructure",
        value: aiAnalysis.infrastructureScore || 0,
        contribution: (aiAnalysis.infrastructureScore || 0) * 0.15,
        description: "Quality of infrastructure and emergency access",
      });
    }

    const safetyLevel = this.getSafetyLevel(finalScore);

    const calculationBasis: SafetyCalculationBasis = {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
      },
      baseScore,
      calculations,
      aiAnalysis,
      factors: {
        crimeRate: {
          value: factors.crimeRate,
          weight: factorWeights.crimeRate,
          source: aiAnalysis ? "AI + Local Data" : "Estimated",
        },
        lighting: {
          value: factors.lighting,
          weight: factorWeights.lighting,
          source: aiAnalysis ? "AI Analysis" : "Estimated",
        },
        footTraffic: {
          value: factors.footTraffic,
          weight: factorWeights.footTraffic,
          source: aiAnalysis ? "AI + Real-time" : "Estimated",
        },
        emergencyServices: {
          value: factors.emergencyServices,
          weight: factorWeights.emergencyServices,
          source: "Infrastructure Data",
        },
        communityReports: {
          value: factors.communityReports,
          weight: factorWeights.communityReports,
          source: aiAnalysis ? "AI Confidence" : "Estimated",
        },
      },
      finalScore,
      safetyLevel,
      lastUpdated: new Date(),
    };

    // Add to history
    this.calculationHistory.unshift(calculationBasis);
    if (this.calculationHistory.length > this.maxHistorySize) {
      this.calculationHistory = this.calculationHistory.slice(
        0,
        this.maxHistorySize,
      );
    }

    // Debug console output
    console.group("🛡️ Safety Score Calculation Debug");
    console.log(
      "📍 Location:",
      `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
    );
    console.log("📊 Base Score:", baseScore);
    console.log("🔢 Final Score:", finalScore);
    console.log("🚦 Safety Level:", safetyLevel.toUpperCase());

    console.group("🧮 Calculation Steps:");
    calculations.forEach((calc, index) => {
      console.log(
        `${index + 1}. ${calc.step}: ${calc.value} (contribution: ${calc.contribution.toFixed(2)}) - ${calc.description}`,
      );
    });
    console.groupEnd();

    if (aiAnalysis) {
      console.group("🤖 AI Analysis Factors:");
      console.log("📰 News Impact:", aiAnalysis.newsImpact);
      console.log("🕐 Time Adjustment:", aiAnalysis.timeOfDayAdjustment);
      console.log("🌤️ Weather Impact:", aiAnalysis.weatherImpact);
      console.log("👥 Crowding Factor:", aiAnalysis.crowdingFactor);
      console.log("🏗️ Infrastructure Score:", aiAnalysis.infrastructureScore);
      console.log("🎯 Confidence:", aiAnalysis.confidence);
      console.groupEnd();
    }

    console.group("📋 Factor Breakdown:");
    Object.entries(calculationBasis.factors).forEach(([key, factor]) => {
      console.log(
        `${key}: ${factor.value} (weight: ${factor.weight}, source: ${factor.source})`,
      );
    });
    console.groupEnd();

    console.groupEnd();

    return calculationBasis;
  }

  private getFactorDescription(factor: string, value: number): string {
    const descriptions: Record<string, (value: number) => string> = {
      crimeRate: (v) =>
        v > 80
          ? "Very low crime area"
          : v > 60
            ? "Low crime area"
            : v > 40
              ? "Moderate crime area"
              : "Higher crime area",
      lighting: (v) =>
        v > 80
          ? "Excellent lighting"
          : v > 60
            ? "Good lighting"
            : v > 40
              ? "Adequate lighting"
              : "Poor lighting",
      footTraffic: (v) =>
        v > 80
          ? "High foot traffic (safer)"
          : v > 60
            ? "Moderate foot traffic"
            : v > 40
              ? "Low foot traffic"
              : "Very low foot traffic",
      emergencyServices: (v) =>
        v > 80
          ? "Emergency services nearby"
          : v > 60
            ? "Good emergency access"
            : v > 40
              ? "Moderate emergency access"
              : "Limited emergency access",
      communityReports: (v) =>
        v > 80
          ? "High community confidence"
          : v > 60
            ? "Good community data"
            : v > 40
              ? "Limited community data"
              : "Minimal community input",
    };

    return descriptions[factor]?.(value) || `Factor value: ${value}`;
  }

  private getSafetyLevel(score: number): SafetyCalculationBasis["safetyLevel"] {
    if (score >= 85) return "very safe";
    if (score >= 70) return "safe";
    if (score >= 55) return "moderate";
    if (score >= 40) return "caution";
    return "unsafe";
  }

  public getCalculationHistory(): SafetyCalculationBasis[] {
    if (!this.debugEnabled) {
      console.warn(
        "🚫 Debug mode is disabled. Enable debug mode to view calculation history.",
      );
      return [];
    }
    return [...this.calculationHistory];
  }

  public getLatestCalculation(): SafetyCalculationBasis | null {
    if (!this.debugEnabled) return null;
    return this.calculationHistory[0] || null;
  }

  public clearHistory() {
    if (!this.debugEnabled) return false;
    this.calculationHistory = [];
    console.log("🗑️ Safety calculation history cleared");
    return true;
  }

  public exportCalculationData(): string | null {
    if (!this.debugEnabled) return null;

    const exportData = {
      timestamp: new Date().toISOString(),
      debugMode: this.debugEnabled,
      calculationCount: this.calculationHistory.length,
      calculations: this.calculationHistory,
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Method to display current calculation in UI (if debug enabled)
  public getDebugDisplayData(): {
    enabled: boolean;
    latest: SafetyCalculationBasis | null;
    summary: {
      totalCalculations: number;
      averageScore: number;
      safetyLevelDistribution: Record<string, number>;
    };
  } | null {
    if (!this.debugEnabled) return null;

    const latest = this.getLatestCalculation();
    const totalCalculations = this.calculationHistory.length;

    let averageScore = 0;
    const safetyLevelDistribution: Record<string, number> = {
      unsafe: 0,
      caution: 0,
      moderate: 0,
      safe: 0,
      "very safe": 0,
    };

    if (totalCalculations > 0) {
      averageScore =
        this.calculationHistory.reduce(
          (sum, calc) => sum + calc.finalScore,
          0,
        ) / totalCalculations;

      this.calculationHistory.forEach((calc) => {
        safetyLevelDistribution[calc.safetyLevel]++;
      });
    }

    return {
      enabled: this.debugEnabled,
      latest,
      summary: {
        totalCalculations,
        averageScore: Math.round(averageScore * 100) / 100,
        safetyLevelDistribution,
      },
    };
  }
}

export const safetyDebugService = new SafetyDebugService();
export type { SafetyCalculationBasis };
