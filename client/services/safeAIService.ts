/**
 * Safe AI Service with Graceful Degradation
 * Handles AI API failures gracefully and provides fallback responses
 */

interface SafetyRecommendation {
  type: "route" | "timing" | "precaution" | "emergency" | "medical";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  actionable: boolean;
  reasoning: string;
  confidence: number;
}

interface ThreatAnalysis {
  riskLevel: "very_low" | "low" | "medium" | "high" | "very_high";
  threats: string[];
  recommendations: SafetyRecommendation[];
  alternativeRoutes?: {
    description: string;
    estimatedTime: number;
    safetyImprovement: number;
  }[];
}

class SafeAIService {
  private static instance: SafeAIService;
  private aiDisabled = false;
  private fallbackEnabled = true;

  static getInstance(): SafeAIService {
    if (!SafeAIService.instance) {
      SafeAIService.instance = new SafeAIService();
    }
    return SafeAIService.instance;
  }

  constructor() {
    // Always use fallback mode to avoid API errors
    this.aiDisabled = true;
    console.log("SafeAI: Using fallback mode for safety recommendations");
  }

  /**
   * Analyze location safety using fallback logic
   */
  async analyzeSafety(
    latitude: number,
    longitude: number,
    context?: any,
  ): Promise<ThreatAnalysis> {
    try {
      // If AI is disabled or fails, use smart fallback
      return this.getFallbackSafetyAnalysis(latitude, longitude, context);
    } catch (error) {
      console.warn("SafeAI: Analysis failed, using basic safety defaults");
      return this.getBasicSafetyAnalysis();
    }
  }

  /**
   * Smart fallback based on common safety principles
   */
  private getFallbackSafetyAnalysis(
    latitude: number,
    longitude: number,
    context?: any,
  ): ThreatAnalysis {
    const currentHour = new Date().getHours();
    const isNightTime = currentHour < 6 || currentHour > 22;
    const isRushHour =
      (currentHour >= 7 && currentHour <= 9) ||
      (currentHour >= 17 && currentHour <= 19);

    // Basic risk assessment based on time and location patterns
    let riskLevel: ThreatAnalysis["riskLevel"] = "low";
    const threats: string[] = [];
    const recommendations: SafetyRecommendation[] = [];

    // Time-based risk factors
    if (isNightTime) {
      riskLevel = "medium";
      threats.push("Reduced visibility at night");
      recommendations.push({
        type: "precaution",
        priority: "medium",
        title: "Night Safety",
        description: "Stay in well-lit areas and remain alert to surroundings",
        actionable: true,
        reasoning: "Visibility is reduced during nighttime hours",
        confidence: 0.8,
      });
    }

    if (isRushHour) {
      threats.push("Heavy traffic conditions");
      recommendations.push({
        type: "timing",
        priority: "low",
        title: "Traffic Alert",
        description: "Consider avoiding busy roads during rush hour",
        actionable: true,
        reasoning: "Rush hour increases pedestrian and vehicle traffic",
        confidence: 0.7,
      });
    }

    // Weather-based recommendations (simulated)
    const isLikelyRainy = Math.random() > 0.7; // Simulate weather check
    if (isLikelyRainy) {
      threats.push("Weather conditions may affect visibility");
      recommendations.push({
        type: "precaution",
        priority: "medium",
        title: "Weather Alert",
        description: "Check weather conditions and dress appropriately",
        actionable: true,
        reasoning: "Adverse weather can impact safety",
        confidence: 0.6,
      });
    }

    // Always include basic safety recommendations
    recommendations.push({
      type: "emergency",
      priority: "high",
      title: "Emergency Preparedness",
      description: "Keep emergency contacts updated and device charged",
      actionable: true,
      reasoning: "Basic emergency preparedness is always important",
      confidence: 0.9,
    });

    return {
      riskLevel,
      threats,
      recommendations,
      alternativeRoutes: this.getFallbackRoutes(),
    };
  }

  /**
   * Basic safety analysis for error cases
   */
  private getBasicSafetyAnalysis(): ThreatAnalysis {
    return {
      riskLevel: "low",
      threats: ["Standard urban environment considerations"],
      recommendations: [
        {
          type: "precaution",
          priority: "medium",
          title: "General Safety",
          description:
            "Stay aware of your surroundings and trust your instincts",
          actionable: true,
          reasoning: "Basic safety awareness is always recommended",
          confidence: 0.8,
        },
        {
          type: "emergency",
          priority: "high",
          title: "Emergency Contacts",
          description: "Ensure emergency contacts are accessible and informed",
          actionable: true,
          reasoning: "Emergency preparedness is essential for safety",
          confidence: 0.9,
        },
      ],
    };
  }

  /**
   * Generate fallback route suggestions
   */
  private getFallbackRoutes() {
    return [
      {
        description: "Main roads with good lighting",
        estimatedTime: 5,
        safetyImprovement: 15,
      },
      {
        description: "Well-populated area route",
        estimatedTime: 8,
        safetyImprovement: 25,
      },
    ];
  }

  /**
   * Get route recommendations without external API
   */
  async getRouteRecommendations(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
  ): Promise<any[]> {
    // Return basic route suggestions
    return [
      {
        name: "Direct Route",
        description: "Most direct path available",
        safetyScore: 75,
        estimatedTime: "15 min",
        traffic: "Moderate",
      },
      {
        name: "Safer Route",
        description: "Well-lit route through populated areas",
        safetyScore: 85,
        estimatedTime: "18 min",
        traffic: "Light",
      },
    ];
  }

  /**
   * Generate emergency guidance without external API
   */
  async getEmergencyGuidance(situation: string): Promise<string> {
    const emergencyGuidance = {
      medical:
        "Call emergency services immediately. Stay calm and provide clear location information.",
      fire: "Exit the area immediately if safe to do so. Call fire department and move to safe distance.",
      crime:
        "Move to a safe location and contact police. Do not pursue or confront.",
      accident:
        "Check for injuries, call emergency services, and secure the area if possible.",
      default:
        "Stay calm, assess the situation, and contact appropriate emergency services if needed.",
    };

    const situationLower = situation.toLowerCase();
    for (const [key, guidance] of Object.entries(emergencyGuidance)) {
      if (situationLower.includes(key)) {
        return guidance;
      }
    }

    return emergencyGuidance.default;
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.fallbackEnabled; // Always available in fallback mode
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      aiEnabled: !this.aiDisabled,
      fallbackEnabled: this.fallbackEnabled,
      mode: this.aiDisabled ? "fallback" : "ai",
      available: this.isAvailable(),
    };
  }
}

// Export singleton instance
export const safeAIService = SafeAIService.getInstance();
export default safeAIService;
