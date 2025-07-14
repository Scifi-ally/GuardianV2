/**
 * News Analysis Service with Gemini AI
 * Analyzes local news for safety factors specific to Indian conditions
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface NewsIncident {
  id: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    area: string;
    city: string;
    state: string;
  };
  timestamp: Date;
  incidentType:
    | "crime"
    | "accident"
    | "violence"
    | "theft"
    | "harassment"
    | "terrorism"
    | "communal"
    | "natural_disaster"
    | "traffic_incident"
    | "political_unrest";
  severity: "low" | "medium" | "high" | "critical";
  safetyImpact: number; // 0-100 score
  affectedRadius: number; // in meters
  verified: boolean;
  sources: string[];
  tags: string[];
}

export interface SafetyNewsAnalysis {
  overallSafetyScore: number;
  incidents: NewsIncident[];
  areaAnalysis: {
    crimeRate: number;
    recentIncidents: number;
    communalTension: number;
    trafficSafety: number;
    politicalStability: number;
    womenSafety: number;
    timeBasedRisk: number;
  };
  recommendations: string[];
  lastUpdated: Date;
}

class NewsAnalysisService {
  private static instance: NewsAnalysisService;
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private newsCache: Map<string, SafetyNewsAnalysis> = new Map();
  private lastCacheUpdate: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.initializeGemini();
  }

  static getInstance(): NewsAnalysisService {
    if (!NewsAnalysisService.instance) {
      NewsAnalysisService.instance = new NewsAnalysisService();
    }
    return NewsAnalysisService.instance;
  }

  private async initializeGemini() {
    try {
      // In production, use environment variable
      const apiKey = process.env.VITE_GEMINI_API_KEY || "your-gemini-api-key";
      if (apiKey && apiKey !== "your-gemini-api-key") {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log("✅ Gemini AI initialized for news analysis");
      } else {
        console.warn("⚠️ Gemini API key not found, using simulated data");
      }
    } catch (error) {
      console.error("❌ Failed to initialize Gemini AI:", error);
    }
  }

  // Analyze safety news for a specific location
  async analyzeSafetyNews(
    location: { lat: number; lng: number },
    radiusKm: number = 10,
  ): Promise<SafetyNewsAnalysis> {
    const locationKey = `${location.lat.toFixed(4)}-${location.lng.toFixed(4)}-${radiusKm}`;

    // Check cache first
    if (this.isCacheValid(locationKey)) {
      return this.newsCache.get(locationKey)!;
    }

    try {
      // Get location context
      const locationContext = await this.getLocationContext(location);

      // Fetch and analyze news
      const newsData = await this.fetchLocalNews(location, radiusKm);
      const analysis = await this.analyzeNewsWithGemini(
        newsData,
        locationContext,
      );

      // Cache the results
      this.newsCache.set(locationKey, analysis);
      this.lastCacheUpdate.set(locationKey, Date.now());

      return analysis;
    } catch (error) {
      console.error("News analysis failed:", error);
      return this.getFallbackAnalysis(location);
    }
  }

  // Get location context for Indian areas
  private async getLocationContext(location: { lat: number; lng: number }) {
    // Determine if location is in major Indian cities
    const majorCities = [
      { name: "Mumbai", lat: 19.076, lng: 72.8777, crimeFactor: 0.7 },
      { name: "Delhi", lat: 28.7041, lng: 77.1025, crimeFactor: 0.8 },
      { name: "Bangalore", lat: 12.9716, lng: 77.5946, crimeFactor: 0.6 },
      { name: "Hyderabad", lat: 17.385, lng: 78.4867, crimeFactor: 0.5 },
      { name: "Chennai", lat: 13.0827, lng: 80.2707, crimeFactor: 0.4 },
      { name: "Kolkata", lat: 22.5726, lng: 88.3639, crimeFactor: 0.7 },
      { name: "Pune", lat: 18.5204, lng: 73.8567, crimeFactor: 0.5 },
      { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, crimeFactor: 0.6 },
    ];

    let nearestCity = null;
    let minDistance = Infinity;

    for (const city of majorCities) {
      const distance = this.calculateDistance(location, city);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    return {
      nearestCity: nearestCity?.name || "Unknown",
      distanceToCity: Math.round(minDistance),
      baseCrimeFactor: nearestCity?.crimeFactor || 0.5,
      isMetroArea: minDistance < 50,
      isRuralArea: minDistance > 100,
    };
  }

  // Fetch local news (simulated - in production use news APIs)
  private async fetchLocalNews(
    location: { lat: number; lng: number },
    radiusKm: number,
  ) {
    // In production, integrate with:
    // - News API
    // - Indian news sources (Times of India, Hindustan Times, etc.)
    // - Local police crime data
    // - Social media monitoring

    // Simulated news data based on location context
    const locationContext = await this.getLocationContext(location);

    return this.generateSimulatedNews(location, locationContext, radiusKm);
  }

  // Generate simulated news for demonstration
  private generateSimulatedNews(
    location: { lat: number; lng: number },
    context: any,
    radiusKm: number,
  ) {
    const currentHour = new Date().getHours();
    const incidents = [];

    // Generate location-specific incidents
    const incidentTypes = [
      {
        type: "theft",
        probability: context.baseCrimeFactor * 0.3,
        severity: "medium",
      },
      { type: "accident", probability: 0.4, severity: "medium" },
      {
        type: "harassment",
        probability: context.baseCrimeFactor * 0.2,
        severity: "high",
      },
      {
        type: "violence",
        probability: context.baseCrimeFactor * 0.15,
        severity: "high",
      },
      { type: "traffic_incident", probability: 0.6, severity: "low" },
      {
        type: "communal",
        probability: context.isMetroArea ? 0.1 : 0.05,
        severity: "critical",
      },
    ];

    // Time-based risk factors
    const nightRiskMultiplier = currentHour >= 22 || currentHour <= 5 ? 2 : 1;
    const rushHourMultiplier =
      (currentHour >= 8 && currentHour <= 10) ||
      (currentHour >= 17 && currentHour <= 20)
        ? 1.5
        : 1;

    for (const incidentType of incidentTypes) {
      const adjustedProbability =
        incidentType.probability * nightRiskMultiplier;

      if (Math.random() < adjustedProbability) {
        incidents.push({
          type: incidentType.type,
          severity: incidentType.severity,
          timestamp: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          ), // Within last week
          location: {
            lat: location.lat + (Math.random() - 0.5) * (radiusKm / 111), // Rough lat conversion
            lng: location.lng + (Math.random() - 0.5) * (radiusKm / 111),
          },
        });
      }
    }

    return {
      incidents,
      context,
      searchRadius: radiusKm,
      location,
    };
  }

  // Analyze news with Gemini AI
  private async analyzeNewsWithGemini(
    newsData: any,
    locationContext: any,
  ): Promise<SafetyNewsAnalysis> {
    if (!this.model) {
      return this.getFallbackAnalysis(newsData.location);
    }

    try {
      const prompt = this.createIndianSafetyPrompt(newsData, locationContext);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      return this.parseGeminiResponse(analysisText, newsData);
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      return this.getFallbackAnalysis(newsData.location);
    }
  }

  // Create India-specific safety analysis prompt
  private createIndianSafetyPrompt(
    newsData: any,
    locationContext: any,
  ): string {
    return `
Analyze the safety situation for this Indian location based on the following data:

Location Context:
- Nearest City: ${locationContext.nearestCity}
- Distance to City: ${locationContext.distanceToCity}km
- Is Metro Area: ${locationContext.isMetroArea}
- Base Crime Factor: ${locationContext.baseCrimeFactor}

Recent Incidents:
${newsData.incidents
  .map(
    (incident: any) => `
- Type: ${incident.type}
- Severity: ${incident.severity}
- Time: ${incident.timestamp}
- Location: ${incident.location.lat}, ${incident.location.lng}
`,
  )
  .join("")}

Please provide a comprehensive safety analysis considering:

1. Crime patterns specific to Indian urban/rural contexts
2. Women's safety concerns (eve-teasing, harassment, safety in public transport)
3. Communal tension indicators
4. Traffic safety (considering Indian driving conditions)
5. Political stability and protests
6. Time-based risks (late night, early morning, festivals)
7. Area-specific risks (markets, IT parks, residential areas)
8. Monsoon/seasonal safety factors
9. Economic factors affecting crime rates
10. Local police presence and response times

Rate each factor from 0-100 (100 being safest) and provide specific recommendations for Indians traveling in this area.

Respond in JSON format with:
{
  "overallSafetyScore": number,
  "areaAnalysis": {
    "crimeRate": number,
    "recentIncidents": number,
    "communalTension": number,
    "trafficSafety": number,
    "politicalStability": number,
    "womenSafety": number,
    "timeBasedRisk": number
  },
  "recommendations": [string array],
  "riskFactors": [string array]
}
`;
  }

  // Parse Gemini response
  private parseGeminiResponse(
    response: string,
    newsData: any,
  ): SafetyNewsAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          overallSafetyScore: parsed.overallSafetyScore || 75,
          incidents: this.convertToNewsIncidents(newsData.incidents),
          areaAnalysis: parsed.areaAnalysis || this.getDefaultAreaAnalysis(),
          recommendations: parsed.recommendations || [],
          lastUpdated: new Date(),
        };
      }
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
    }

    return this.getFallbackAnalysis(newsData.location);
  }

  // Convert raw incidents to NewsIncident format
  private convertToNewsIncidents(rawIncidents: any[]): NewsIncident[] {
    return rawIncidents.map((incident, index) => ({
      id: `incident_${index}_${Date.now()}`,
      title: this.generateIncidentTitle(incident.type),
      description: this.generateIncidentDescription(
        incident.type,
        incident.severity,
      ),
      location: {
        lat: incident.location.lat,
        lng: incident.location.lng,
        area: "Local Area",
        city: "City",
        state: "State",
      },
      timestamp: new Date(incident.timestamp),
      incidentType: incident.type as any,
      severity: incident.severity as any,
      safetyImpact: this.calculateSafetyImpact(
        incident.type,
        incident.severity,
      ),
      affectedRadius: this.calculateAffectedRadius(
        incident.type,
        incident.severity,
      ),
      verified: Math.random() > 0.3, // 70% verification rate
      sources: ["Local News", "Police Reports"],
      tags: this.generateTags(incident.type),
    }));
  }

  // Helper methods
  private generateIncidentTitle(type: string): string {
    const titles = {
      theft: "Mobile/Vehicle Theft Reported",
      accident: "Road Accident Reported",
      harassment: "Harassment Incident",
      violence: "Violence/Assault Case",
      traffic_incident: "Traffic Jam/Accident",
      communal: "Communal Tension Alert",
    };
    return titles[type as keyof typeof titles] || "Safety Incident";
  }

  private generateIncidentDescription(type: string, severity: string): string {
    return `${severity.charAt(0).toUpperCase() + severity.slice(1)} severity ${type} incident reported in the area. Please exercise caution.`;
  }

  private calculateSafetyImpact(type: string, severity: string): number {
    const baseImpact = {
      theft: 30,
      accident: 40,
      harassment: 60,
      violence: 80,
      traffic_incident: 20,
      communal: 90,
      terrorism: 100,
    };

    const severityMultiplier = {
      low: 0.5,
      medium: 1,
      high: 1.5,
      critical: 2,
    };

    return Math.min(
      (baseImpact[type as keyof typeof baseImpact] || 50) *
        (severityMultiplier[severity as keyof typeof severityMultiplier] || 1),
      100,
    );
  }

  private calculateAffectedRadius(type: string, severity: string): number {
    const baseRadius = {
      theft: 200,
      accident: 500,
      harassment: 300,
      violence: 800,
      traffic_incident: 1000,
      communal: 2000,
      terrorism: 5000,
    };

    return baseRadius[type as keyof typeof baseRadius] || 500;
  }

  private generateTags(type: string): string[] {
    const tagMap = {
      theft: ["property-crime", "security", "valuables"],
      accident: ["traffic", "emergency", "medical"],
      harassment: ["women-safety", "security", "personal-safety"],
      violence: ["assault", "personal-safety", "emergency"],
      traffic_incident: ["traffic", "congestion", "delays"],
      communal: ["social-tension", "avoid-area", "emergency"],
    };

    return tagMap[type as keyof typeof tagMap] || ["safety"];
  }

  private getDefaultAreaAnalysis() {
    return {
      crimeRate: 75,
      recentIncidents: 80,
      communalTension: 90,
      trafficSafety: 70,
      politicalStability: 85,
      womenSafety: 65,
      timeBasedRisk: 75,
    };
  }

  private getFallbackAnalysis(location: {
    lat: number;
    lng: number;
  }): SafetyNewsAnalysis {
    return {
      overallSafetyScore: 75,
      incidents: [],
      areaAnalysis: this.getDefaultAreaAnalysis(),
      recommendations: [
        "Stay alert in crowded areas",
        "Avoid isolated areas after dark",
        "Keep emergency contacts handy",
        "Use well-lit and populated routes",
      ],
      lastUpdated: new Date(),
    };
  }

  private isCacheValid(key: string): boolean {
    const lastUpdate = this.lastCacheUpdate.get(key);
    if (!lastUpdate) return false;

    return Date.now() - lastUpdate < this.CACHE_DURATION;
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get real-time safety score for a location
  async getLocationSafetyScore(location: {
    lat: number;
    lng: number;
  }): Promise<number> {
    try {
      const analysis = await this.analyzeSafetyNews(location, 5);
      return analysis.overallSafetyScore;
    } catch (error) {
      console.error("Failed to get location safety score:", error);
      return 75; // Default safe score
    }
  }

  // Get safety incidents within radius
  async getSafetyIncidents(
    location: { lat: number; lng: number },
    radiusKm: number,
  ): Promise<NewsIncident[]> {
    try {
      const analysis = await this.analyzeSafetyNews(location, radiusKm);
      return analysis.incidents;
    } catch (error) {
      console.error("Failed to get safety incidents:", error);
      return [];
    }
  }
}

export const newsAnalysisService = NewsAnalysisService.getInstance();
