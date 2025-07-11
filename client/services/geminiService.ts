interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface SafetyAnalysisRequest {
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timeOfDay: string;
  userProfile?: {
    age?: number;
    gender?: string;
    vulnerabilities?: string[];
  };
  additionalContext?: string;
}

interface SafetyAnalysisResponse {
  safetyScore: number;
  riskFactors: string[];
  recommendations: string[];
  emergencyContactSuggestions?: string[];
  routeSuggestions?: string[];
  summary: string;
}

interface EmergencyAssistanceRequest {
  emergencyType: "medical" | "fire" | "police" | "personal" | "unknown";
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  description?: string;
  userCondition?: string;
}

interface EmergencyAssistanceResponse {
  priorityLevel: "low" | "medium" | "high" | "critical";
  immediateActions: string[];
  emergencyContacts: string[];
  informationToProvide: string[];
  stayCalm: string[];
}

class GeminiService {
  private config: GeminiConfig = {
    apiKey: "",
    model: "gemini-1.5-flash", // Using the latest model
    temperature: 0.3,
    maxTokens: 1000,
  };

  private isConfigured = false;

  constructor() {
    this.loadConfiguration();
  }

  private loadConfiguration() {
    // Try to get API key from environment or localStorage
    const apiKey =
      import.meta.env.VITE_GEMINI_API_KEY ||
      localStorage.getItem("gemini_api_key") ||
      "";

    if (apiKey) {
      this.config.apiKey = apiKey;
      this.isConfigured = true;
      console.log("✅ Gemini AI service configured");
    } else {
      console.warn(
        "⚠️ Gemini API key not found. AI features will use fallback responses.",
      );
    }
  }

  public setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.isConfigured = !!apiKey;
    localStorage.setItem("gemini_api_key", apiKey);
    console.log("✅ Gemini API key updated");
  }

  private async makeRequest(prompt: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error("Gemini API not configured");
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
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
              temperature: this.config.temperature,
              maxOutputTokens: this.config.maxTokens,
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
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response format from Gemini API");
      }
    } catch (error) {
      console.error("Gemini API request failed:", error);
      throw error;
    }
  }

  public async analyzeSafety(
    request: SafetyAnalysisRequest,
  ): Promise<SafetyAnalysisResponse> {
    const prompt = `
As a safety expert AI, analyze the safety of this location and provide actionable recommendations:

Location: ${request.location.latitude}, ${request.location.longitude}
${request.location.address ? `Address: ${request.location.address}` : ""}
Time: ${request.timeOfDay}
${request.userProfile ? `User context: Age ${request.userProfile.age}, Gender ${request.userProfile.gender}` : ""}
${request.additionalContext ? `Additional context: ${request.additionalContext}` : ""}

Please provide a JSON response with the following structure:
{
  "safetyScore": <number 0-100>,
  "riskFactors": [<array of specific risk factors>],
  "recommendations": [<array of safety recommendations>],
  "emergencyContactSuggestions": [<array of emergency contacts to consider>],
  "routeSuggestions": [<array of safer route suggestions>],
  "summary": "<brief summary of safety assessment>"
}

Focus on practical, actionable advice for personal safety.
`;

    try {
      const response = await this.makeRequest(prompt);
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      console.warn("Gemini safety analysis failed, using fallback");
      return this.createFallbackSafetyResponse(request);
    }
  }

  public async getEmergencyAssistance(
    request: EmergencyAssistanceRequest,
  ): Promise<EmergencyAssistanceResponse> {
    const prompt = `
As an emergency response expert, provide immediate assistance guidance for this situation:

Emergency Type: ${request.emergencyType}
Location: ${request.location.latitude}, ${request.location.longitude}
${request.location.address ? `Address: ${request.location.address}` : ""}
${request.description ? `Description: ${request.description}` : ""}
${request.userCondition ? `User condition: ${request.userCondition}` : ""}

Please provide a JSON response with:
{
  "priorityLevel": "<low|medium|high|critical>",
  "immediateActions": [<step-by-step immediate actions to take>],
  "emergencyContacts": [<relevant emergency numbers and services>],
  "informationToProvide": [<information to provide to emergency services>],
  "stayCalm": [<calming and reassuring guidance>]
}

Prioritize safety and provide clear, actionable instructions.
`;

    try {
      const response = await this.makeRequest(prompt);
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      console.warn("Gemini emergency assistance failed, using fallback");
      return this.createFallbackEmergencyResponse(request);
    }
  }

  public async enhanceLocationDescription(
    latitude: number,
    longitude: number,
    basicAddress?: string,
  ): Promise<string> {
    const prompt = `
Provide a helpful, human-friendly description of this location:

Coordinates: ${latitude}, ${longitude}
${basicAddress ? `Address: ${basicAddress}` : ""}

Give a concise description that includes:
- General area/neighborhood character
- Notable landmarks or features nearby
- General safety considerations
- Transportation options

Keep response under 100 words and make it useful for someone trying to understand the area.
`;

    try {
      const response = await this.makeRequest(prompt);
      return response.trim();
    } catch (error) {
      console.warn("Location description enhancement failed");
      return (
        basicAddress ||
        `Location at ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`
      );
    }
  }

  public async generateSafetyTips(context: {
    timeOfDay: string;
    weather?: string;
    area?: string;
    activity?: string;
  }): Promise<string[]> {
    const prompt = `
Generate 3-5 specific safety tips for this situation:

Time: ${context.timeOfDay}
${context.weather ? `Weather: ${context.weather}` : ""}
${context.area ? `Area: ${context.area}` : ""}
${context.activity ? `Activity: ${context.activity}` : ""}

Provide practical, actionable safety tips as a JSON array:
["tip1", "tip2", "tip3", "tip4", "tip5"]

Focus on immediate, practical advice.
`;

    try {
      const response = await this.makeRequest(prompt);
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Safety tips generation failed, using fallback");
      return this.createFallbackSafetyTips(context);
    }
  }

  // Fallback methods for when Gemini is not available
  private createFallbackSafetyResponse(
    request: SafetyAnalysisRequest,
  ): SafetyAnalysisResponse {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 22;
    const baseScore = isNight ? 65 : 80;

    return {
      safetyScore: baseScore + Math.floor(Math.random() * 20),
      riskFactors: [
        ...(isNight ? ["Late night hours", "Reduced visibility"] : []),
        "Unknown area conditions",
        "Limited real-time data",
      ],
      recommendations: [
        "Stay aware of your surroundings",
        "Keep emergency contacts accessible",
        "Trust your instincts",
        "Stick to well-lit, populated areas",
        ...(isNight ? ["Consider alternative transportation"] : []),
      ],
      emergencyContactSuggestions: ["Local police: 911", "Medical: 911"],
      routeSuggestions: [
        "Use main roads when possible",
        "Avoid isolated areas",
        "Stay in well-lit areas",
      ],
      summary: `Basic safety assessment. ${isNight ? "Extra caution recommended due to nighttime hours." : "Standard safety precautions apply."}`,
    };
  }

  private createFallbackEmergencyResponse(
    request: EmergencyAssistanceRequest,
  ): EmergencyAssistanceResponse {
    const priorityMap = {
      medical: "high" as const,
      fire: "critical" as const,
      police: "high" as const,
      personal: "medium" as const,
      unknown: "medium" as const,
    };

    return {
      priorityLevel: priorityMap[request.emergencyType] || "medium",
      immediateActions: [
        "Stay calm and assess the situation",
        "Call emergency services if needed (911)",
        "Move to a safe location if possible",
        "Contact trusted emergency contacts",
      ],
      emergencyContacts: [
        "911 - All emergencies",
        "Local police",
        "Fire department",
      ],
      informationToProvide: [
        "Your exact location",
        "Nature of the emergency",
        "Number of people involved",
        "Any immediate dangers",
      ],
      stayCalm: [
        "Take deep breaths",
        "Focus on immediate safety",
        "Help is on the way",
        "You're doing the right thing by seeking help",
      ],
    };
  }

  private createFallbackSafetyTips(context: {
    timeOfDay: string;
    weather?: string;
    area?: string;
    activity?: string;
  }): string[] {
    const tips = [
      "Stay aware of your surroundings at all times",
      "Keep your phone charged and accessible",
      "Trust your instincts - if something feels wrong, leave",
      "Let someone know your location and plans",
      "Stick to well-lit, populated areas",
    ];

    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      tips.push("Consider rideshare or taxi instead of walking alone");
    }

    if (
      context.weather?.includes("rain") ||
      context.weather?.includes("snow")
    ) {
      tips.push("Be extra cautious of slippery surfaces");
    }

    return tips.slice(0, 5);
  }

  public isConfigured(): boolean {
    return this.isConfigured;
  }

  public async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.makeRequest("Respond with 'OK' to test connection.");
      return true;
    } catch (error) {
      console.error("Gemini connection test failed:", error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();
export type {
  SafetyAnalysisRequest,
  SafetyAnalysisResponse,
  EmergencyAssistanceRequest,
  EmergencyAssistanceResponse,
};
