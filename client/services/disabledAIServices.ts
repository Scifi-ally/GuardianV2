/**
 * Disabled AI Services
 * Prevents API errors by returning fallback data instead of making external calls
 */

// Disable all external AI services to prevent recurring errors
console.log("AI Services: Using fallback mode to prevent API errors");

/**
 * Disabled Gemini AI Service
 */
export class DisabledGeminiAIService {
  private static instance: DisabledGeminiAIService;

  static getInstance(): DisabledGeminiAIService {
    if (!DisabledGeminiAIService.instance) {
      DisabledGeminiAIService.instance = new DisabledGeminiAIService();
    }
    return DisabledGeminiAIService.instance;
  }

  isConfigured(): boolean {
    return false; // Always return false to prevent usage
  }

  async analyzeSafety(): Promise<any> {
    return {
      riskLevel: "low",
      threats: [],
      recommendations: [
        {
          type: "precaution",
          priority: "medium",
          title: "Stay Alert",
          description: "Remain aware of your surroundings",
          actionable: true,
          reasoning: "General safety awareness",
          confidence: 0.8,
        },
      ],
    };
  }

  async getRouteRecommendations(): Promise<any[]> {
    return [
      {
        name: "Standard Route",
        description: "Direct route to destination",
        safetyScore: 75,
        estimatedTime: "15 min",
      },
    ];
  }

  async getEmergencyGuidance(): Promise<string> {
    return "Stay calm and contact emergency services if needed.";
  }
}

/**
 * Disabled Gemini Service
 */
export class DisabledGeminiService {
  private static instance: DisabledGeminiService;

  static getInstance(): DisabledGeminiService {
    if (!DisabledGeminiService.instance) {
      DisabledGeminiService.instance = new DisabledGeminiService();
    }
    return DisabledGeminiService.instance;
  }

  isConfigured(): boolean {
    return false;
  }

  async generateContent(): Promise<any> {
    return {
      text: "AI services are currently unavailable. Using fallback guidance.",
      confidence: 0.1,
    };
  }
}

/**
 * Disabled News Analysis Service
 */
export class DisabledNewsAnalysisService {
  private static instance: DisabledNewsAnalysisService;

  static getInstance(): DisabledNewsAnalysisService {
    if (!DisabledNewsAnalysisService.instance) {
      DisabledNewsAnalysisService.instance = new DisabledNewsAnalysisService();
    }
    return DisabledNewsAnalysisService.instance;
  }

  async analyzeLocalNews(): Promise<any[]> {
    return [
      {
        title: "General Safety Information",
        description: "Stay informed about local conditions",
        relevance: 0.5,
        safetyImpact: 0,
        source: "System",
      },
    ];
  }

  async getLocationSafetyNews(): Promise<any[]> {
    return [];
  }
}

// Export disabled services
export const geminiAIService = DisabledGeminiAIService.getInstance();
export const geminiService = DisabledGeminiService.getInstance();
export const geminiNewsAnalysisService =
  DisabledNewsAnalysisService.getInstance();
