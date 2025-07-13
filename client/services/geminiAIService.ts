// Gemini AI service disabled - using internal logic only
import { notifications } from "@/services/enhancedNotificationService";

interface LocationContext {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  timestamp: Date;
}

interface WeatherContext {
  temperature: number;
  condition: string;
  visibility: number;
  windSpeed: number;
  alerts?: string[];
}

interface SafetyContext {
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  dayOfWeek: string;
  userProfile: {
    age?: number;
    gender?: string;
    medicalConditions?: string[];
    emergencyContacts: number;
  };
  deviceInfo: {
    batteryLevel?: number;
    connectionType?: string;
    isCharging?: boolean;
  };
  travelMode: "walking" | "driving" | "cycling" | "public_transport";
}

interface SafetyRecommendation {
  type: "route" | "timing" | "precaution" | "emergency" | "medical";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  actionable: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
  reasoning: string;
  confidence: number; // 0-1
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

class GeminiAIService {
  private static instance: GeminiAIService;
  private apiKey: string;
  private baseUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  private isConfigured = false;
  private hasValidKey = false;
  private lastKeyCheck = 0;
  private keyCheckInterval = 300000; // 5 minutes
  private serviceDisabled = false; // Flag to disable service on persistent failures

  static getInstance(): GeminiAIService {
    if (!GeminiAIService.instance) {
      GeminiAIService.instance = new GeminiAIService();
    }
    return GeminiAIService.instance;
  }

  constructor() {
    // External AI disabled - using internal analysis only
    this.apiKey = "";
    this.isConfigured = false;
    this.serviceDisabled = true; // Always disabled for internal-only operation

    // Check if key is valid on first use
    if (this.isConfigured) {
      this.validateApiKey();
    }
  }

  private async validateApiKey(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastKeyCheck < this.keyCheckInterval && this.hasValidKey) {
      return this.hasValidKey;
    }

    try {
      // Simple test request to validate the key
      const testResponse = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Test" }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      this.hasValidKey = testResponse.ok || testResponse.status === 400; // 400 is ok, means key works but request malformed
      this.lastKeyCheck = now;

      if (!this.hasValidKey) {
        console.warn("Gemini API key validation failed:", testResponse.status);
      }

      return this.hasValidKey;
    } catch (error) {
      console.warn("Failed to validate Gemini API key:", error);
      this.hasValidKey = false;
      this.lastKeyCheck = now;
      return false;
    }
  }

  private async makeGeminiRequest(prompt: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error("Gemini AI service not configured");
    }

    // Validate key before making request
    const isKeyValid = await this.validateApiKey();
    if (!isKeyValid) {
      throw new Error("Gemini API key is invalid or service unavailable");
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      });

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 403) {
          console.warn("Gemini API access forbidden - disabling AI features");
          this.hasValidKey = false; // Mark key as invalid
          this.serviceDisabled = true; // Disable service for this session
          throw new Error("API access denied - using offline mode");
        } else if (response.status === 429) {
          throw new Error("API rate limit exceeded - please try again later");
        } else if (response.status === 400) {
          throw new Error("Invalid request format");
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }

      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      throw new Error("No response from Gemini API");
    } catch (error) {
      console.warn("Gemini API request failed:", error);
      throw error;
    }
  }

  async analyzeSafetyContext(
    location: LocationContext,
    weather: WeatherContext,
    safetyContext: SafetyContext,
  ): Promise<ThreatAnalysis> {
    const prompt = `
You are an AI safety assistant analyzing a person's current situation for potential safety risks. Please provide a comprehensive safety analysis.

Current Context:
- Location: ${location.address || `${location.latitude}, ${location.longitude}`}
- Time: ${safetyContext.timeOfDay} on ${safetyContext.dayOfWeek}
- Weather: ${weather.condition}, ${weather.temperature}°F, visibility ${weather.visibility}km, wind ${weather.windSpeed} mph
- Travel Mode: ${safetyContext.travelMode}
- Battery Level: ${safetyContext.deviceInfo.batteryLevel || "unknown"}%
- Emergency Contacts: ${safetyContext.userProfile.emergencyContacts}

Please analyze and provide:
1. Overall risk level (very_low, low, medium, high, very_high)
2. Specific potential threats or concerns
3. 3-5 actionable safety recommendations with priority levels
4. Brief reasoning for each recommendation

Format your response as JSON with this structure:
{
  "riskLevel": "low",
  "threats": ["list of specific threats"],
  "recommendations": [
    {
      "type": "route|timing|precaution|emergency|medical",
      "priority": "low|medium|high|critical",
      "title": "Brief title",
      "description": "Detailed description",
      "reasoning": "Why this recommendation",
      "confidence": 0.8
    }
  ]
}

Focus on practical, actionable advice. Consider factors like:
- Time of day and visibility
- Weather conditions affecting safety
- Battery level for emergency communication
- Travel mode risks
- Location-specific considerations
`;

    try {
      const response = await this.makeGeminiRequest(prompt);
      const analysis = JSON.parse(response);

      // Validate and enhance the response
      return {
        riskLevel: analysis.riskLevel || "medium",
        threats: analysis.threats || [],
        recommendations:
          analysis.recommendations?.map((rec: any) => ({
            ...rec,
            actionable: true,
            actions: this.generateActionsForRecommendation(rec),
          })) || [],
      };
    } catch (error) {
      console.error("Failed to analyze safety context:", error);
      return this.getFallbackAnalysis(safetyContext);
    }
  }

  async getRouteAdvisory(
    origin: LocationContext,
    destination: LocationContext,
    travelMode: SafetyContext["travelMode"],
    timeOfTravel: Date,
  ): Promise<SafetyRecommendation[]> {
    const prompt = `
You are a safety advisor analyzing a planned route. Provide safety recommendations for this journey.

Route Details:
- From: ${origin.address || `${origin.latitude}, ${origin.longitude}`}
- To: ${destination.address || `${destination.latitude}, ${destination.longitude}`}
- Travel Mode: ${travelMode}
- Planned Time: ${timeOfTravel.toLocaleString()}

Please provide 3-5 safety recommendations in JSON format:
[
  {
    "type": "route|timing|precaution|emergency",
    "priority": "low|medium|high|critical",
    "title": "Brief title",
    "description": "Detailed advice",
    "reasoning": "Why this matters",
    "confidence": 0.8
  }
]

Consider:
- Route safety at the planned time
- Weather and lighting conditions
- Travel mode specific risks
- Emergency preparedness suggestions
- Communication and check-in recommendations
`;

    try {
      const response = await this.makeGeminiRequest(prompt);
      const recommendations = JSON.parse(response);

      return recommendations.map((rec: any) => ({
        ...rec,
        actionable: true,
        actions: this.generateActionsForRecommendation(rec),
      }));
    } catch (error) {
      console.error("Failed to get route advisory:", error);
      return this.getFallbackRouteRecommendations(travelMode);
    }
  }

  async generateEmergencyResponse(
    emergencyType: string,
    location: LocationContext,
    userInfo: SafetyContext["userProfile"],
  ): Promise<{
    immediateActions: string[];
    emergencyMessage: string;
    followupSteps: string[];
  }> {
    const prompt = `
Generate an emergency response plan for this situation:

Emergency Type: ${emergencyType}
Location: ${location.address || `${location.latitude}, ${location.longitude}`}
Emergency Contacts Available: ${userInfo.emergencyContacts}

Provide a JSON response with:
{
  "immediateActions": ["Step 1", "Step 2", "Step 3"],
  "emergencyMessage": "Clear message to send to emergency contacts",
  "followupSteps": ["Additional steps after immediate response"]
}

Keep instructions clear, concise, and appropriate for the emergency type.
Include location information in the emergency message.
`;

    try {
      const response = await this.makeGeminiRequest(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to generate emergency response:", error);
      return this.getFallbackEmergencyResponse(emergencyType, location);
    }
  }

  async analyzeBehaviorPattern(
    locationHistory: LocationContext[],
    timePattern: string,
  ): Promise<{
    insights: string[];
    recommendations: SafetyRecommendation[];
    riskFactors: string[];
  }> {
    const prompt = `
Analyze this person's location pattern for safety insights:

Recent Locations: ${locationHistory
      .slice(-10)
      .map(
        (loc) =>
          `${loc.address || `${loc.latitude}, ${loc.longitude}`} at ${loc.timestamp.toLocaleString()}`,
      )
      .join("; ")}

Time Pattern: ${timePattern}

Provide JSON analysis:
{
  "insights": ["Pattern observations"],
  "recommendations": [safety recommendations in standard format],
  "riskFactors": ["Potential risks identified"]
}

Focus on:
- Routine safety considerations
- Timing patterns that might affect safety
- Location-based risk factors
- Suggestions for safer habits
`;

    try {
      const response = await this.makeGeminiRequest(prompt);
      const analysis = JSON.parse(response);

      return {
        insights: analysis.insights || [],
        recommendations:
          analysis.recommendations?.map((rec: any) => ({
            ...rec,
            actionable: true,
            actions: this.generateActionsForRecommendation(rec),
          })) || [],
        riskFactors: analysis.riskFactors || [],
      };
    } catch (error) {
      console.error("Failed to analyze behavior pattern:", error);
      return {
        insights: ["Unable to analyze pattern at this time"],
        recommendations: [],
        riskFactors: [],
      };
    }
  }

  async generateSafetyTips(
    context: "daily" | "travel" | "emergency" | "night" | "weather",
    location?: LocationContext,
  ): Promise<string[]> {
    const prompt = `
Generate 5-7 practical safety tips for ${context} situations.
${location ? `Location context: ${location.address || `${location.latitude}, ${location.longitude}`}` : ""}

Return as a JSON array of strings with specific, actionable advice.
Example: ["Tip 1", "Tip 2", "Tip 3"]

Focus on:
- Practical, implementable advice
- Situation-specific recommendations
- Emergency preparedness
- Communication and awareness tips
`;

    try {
      const response = await this.makeGeminiRequest(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to generate safety tips:", error);
      return this.getFallbackSafetyTips(context);
    }
  }

  private generateActionsForRecommendation(
    rec: any,
  ): { label: string; action: () => void }[] {
    const actions: { label: string; action: () => void }[] = [];

    switch (rec.type) {
      case "emergency":
        actions.push({
          label: "Call 911",
          action: () => window.open("tel:911"),
        });
        break;
      case "route":
        actions.push({
          label: "Open Navigation",
          action: () => (window.location.href = "/navigation"),
        });
        break;
      case "precaution":
        actions.push({
          label: "Set Reminder",
          action: () =>
            notifications.success({
              title: "Reminder Set",
              description: rec.title,
            }),
        });
        break;
    }

    return actions;
  }

  private getFallbackAnalysis(context: SafetyContext): ThreatAnalysis {
    const isNightTime =
      context.timeOfDay === "night" || context.timeOfDay === "evening";
    const lowBattery = (context.deviceInfo.batteryLevel || 100) < 20;

    return {
      riskLevel: isNightTime || lowBattery ? "medium" : "low",
      threats: [
        ...(isNightTime ? ["Reduced visibility"] : []),
        ...(lowBattery ? ["Low battery for emergency communication"] : []),
      ],
      recommendations: [
        {
          type: "precaution",
          priority: "medium",
          title: "Stay Alert",
          description:
            "Remain aware of your surroundings and trust your instincts",
          actionable: true,
          reasoning: "General safety awareness is always important",
          confidence: 0.9,
        },
        ...(lowBattery
          ? [
              {
                type: "emergency",
                priority: "high",
                title: "Charge Device",
                description:
                  "Your battery is low. Find a charging source soon.",
                actionable: true,
                reasoning: "Emergency communication requires adequate battery",
                confidence: 0.95,
              },
            ]
          : []),
      ],
    };
  }

  private getFallbackRouteRecommendations(
    travelMode: string,
  ): SafetyRecommendation[] {
    return [
      {
        type: "precaution",
        priority: "medium",
        title: "Share Your Route",
        description:
          "Let someone know your planned route and expected arrival time",
        actionable: true,
        reasoning: "Communication is key for safety",
        confidence: 0.9,
      },
      {
        type: "emergency",
        priority: "medium",
        title: "Emergency Contacts Ready",
        description: "Ensure your emergency contacts are easily accessible",
        actionable: true,
        reasoning: "Quick access to help when needed",
        confidence: 0.85,
      },
    ];
  }

  private getFallbackEmergencyResponse(
    emergencyType: string,
    location: LocationContext,
  ) {
    return {
      immediateActions: [
        "Call 911 if in immediate danger",
        "Move to a safe location if possible",
        "Contact emergency contacts",
      ],
      emergencyMessage: `Emergency: ${emergencyType} at ${location.address || `${location.latitude}, ${location.longitude}`}. Please send help.`,
      followupSteps: [
        "Stay in contact with authorities",
        "Document the incident",
        "Follow up with medical care if needed",
      ],
    };
  }

  private getFallbackSafetyTips(context: string): string[] {
    const tips = {
      daily: [
        "Keep your emergency contacts updated",
        "Charge your device regularly",
        "Stay aware of your surroundings",
        "Trust your instincts",
        "Have a backup plan",
      ],
      travel: [
        "Share your itinerary with trusted contacts",
        "Keep important documents accessible",
        "Research your destination's safety",
        "Have emergency cash available",
        "Know local emergency numbers",
      ],
      emergency: [
        "Stay calm and assess the situation",
        "Call for help immediately if needed",
        "Move to safety if possible",
        "Preserve evidence if safe to do so",
        "Follow up with authorities",
      ],
      night: [
        "Stay in well-lit areas",
        "Walk confidently and purposefully",
        "Keep your phone charged and accessible",
        "Avoid distractions like headphones",
        "Use trusted transportation options",
      ],
      weather: [
        "Check weather forecasts before traveling",
        "Dress appropriately for conditions",
        "Avoid travel in severe weather",
        "Keep emergency supplies in your vehicle",
        "Know alternate routes",
      ],
    };

    return tips[context as keyof typeof tips] || tips.daily;
  }

  // Public interface for checking if service is available
  isAvailable(): boolean {
    return this.isConfigured && this.hasValidKey && !this.serviceDisabled;
  }

  // Async version for more thorough checking
  async checkAvailability(): Promise<boolean> {
    if (!this.isConfigured || this.serviceDisabled) return false;
    return await this.validateApiKey();
  }
}

export const geminiAIService = GeminiAIService.getInstance();
export default geminiAIService;
