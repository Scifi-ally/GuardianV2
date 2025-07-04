interface SafetyAnalysis {
  score: number; // 0-100
  confidence: number; // 0-100
  factors: string[];
  reasoning: string;
  newsEvents: {
    title: string;
    impact: "positive" | "negative" | "neutral";
    relevance: number;
  }[];
}

export class GeminiNewsAnalysisService {
  private static instance: GeminiNewsAnalysisService;
  private cache: Map<string, { data: SafetyAnalysis; timestamp: number }> =
    new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 60 minutes - longer cache to reduce API calls
  private readonly API_KEY = "AIzaSyDFXy8qsqr4gQ0e4wIowzVLvTA1ut7W7j8";
  private readonly BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

  // Rate limiting for free tier (15 requests per minute)
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private readonly MIN_REQUEST_INTERVAL = 8000; // 8 seconds between requests
  private readonly MAX_REQUESTS_PER_MINUTE = 6; // Very conservative limit

  static getInstance(): GeminiNewsAnalysisService {
    if (!GeminiNewsAnalysisService.instance) {
      GeminiNewsAnalysisService.instance = new GeminiNewsAnalysisService();
    }
    return GeminiNewsAnalysisService.instance;
  }

  async analyzeAreaSafety(lat: number, lng: number): Promise<SafetyAnalysis> {
    const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Check rate limits - be more aggressive with fallback
    const now = Date.now();
    if (now - this.lastRequestTime < 60000) {
      // Within last minute
      if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
        console.warn("Rate limit exceeded, using enhanced fallback analysis");
        return this.getFallbackAnalysis(lat, lng);
      }
    } else {
      // Reset counter every minute
      this.requestCount = 0;
    }

    // Use fallback 95% of the time to preserve API quota (quota exceeded)
    if (Math.random() > 0.05) {
      return this.getFallbackAnalysis(lat, lng);
    }

    try {
      const analysis = await this.performRateLimitedAnalysis(lat, lng);

      this.cache.set(cacheKey, {
        data: analysis,
        timestamp: Date.now(),
      });

      return analysis;
    } catch (error) {
      console.warn("Gemini analysis failed, using fallback:", error);
      return this.getFallbackAnalysis(lat, lng);
    }
  }

  private async performRateLimitedAnalysis(
    lat: number,
    lng: number,
  ): Promise<SafetyAnalysis> {
    return new Promise((resolve, reject) => {
      const analysisTask = async () => {
        try {
          // Ensure minimum interval between requests
          const timeSinceLastRequest = Date.now() - this.lastRequestTime;
          if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
            await new Promise((r) =>
              setTimeout(r, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest),
            );
          }

          this.lastRequestTime = Date.now();
          this.requestCount++;

          const result = await this.performGeminiAnalysis(lat, lng);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      // Add to queue if needed
      if (this.isProcessingQueue) {
        this.requestQueue.push(analysisTask);
        this.processQueue();
      } else {
        analysisTask();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.warn("Queued request failed:", error);
        }

        // Wait between requests
        if (this.requestQueue.length > 0) {
          await new Promise((r) => setTimeout(r, this.MIN_REQUEST_INTERVAL));
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async performGeminiAnalysis(
    lat: number,
    lng: number,
  ): Promise<SafetyAnalysis> {
    const currentTime = new Date().toISOString();
    const nearbyCity = this.getNearbyCity(lat, lng);

    const prompt = `You are a safety analysis AI. Analyze the current safety conditions for location ${lat}, ${lng} near ${nearbyCity}.

Current time: ${currentTime}

Please provide a comprehensive safety analysis based on:
1. Recent news and incidents in the area (last 7 days)
2. Time of day factors
3. Location characteristics (urban/suburban/rural)
4. General area reputation and safety trends

Respond with a JSON object in this exact format:
{
  "score": <number 0-100>,
  "confidence": <number 0-100>,
  "factors": ["factor1", "factor2", "factor3"],
  "reasoning": "Brief explanation of the score",
  "newsEvents": [
    {"title": "Event title", "impact": "positive/negative/neutral", "relevance": <0-100>}
  ]
}

Consider:
- Higher scores (80-100) = Very safe
- Medium scores (50-79) = Moderately safe
- Lower scores (20-49) = Caution advised
- Very low scores (0-19) = High risk

Base your analysis on realistic safety factors and current conditions.`;

    const response = await fetch(`${this.BASE_URL}?key=${this.API_KEY}`, {
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
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No content received from Gemini API");
    }

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in Gemini response");
    }

    const analysis = JSON.parse(jsonMatch[0]) as SafetyAnalysis;

    // Validate the response
    if (!this.isValidAnalysis(analysis)) {
      throw new Error("Invalid analysis structure from Gemini");
    }

    return analysis;
  }

  private isValidAnalysis(analysis: any): analysis is SafetyAnalysis {
    return (
      typeof analysis === "object" &&
      typeof analysis.score === "number" &&
      typeof analysis.confidence === "number" &&
      Array.isArray(analysis.factors) &&
      typeof analysis.reasoning === "string" &&
      Array.isArray(analysis.newsEvents) &&
      analysis.score >= 0 &&
      analysis.score <= 100 &&
      analysis.confidence >= 0 &&
      analysis.confidence <= 100
    );
  }

  private getNearbyCity(lat: number, lng: number): string {
    // Simple city approximation based on coordinates
    // In a real app, you'd use a reverse geocoding service
    const cities = [
      { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
      { name: "New York", lat: 40.7128, lng: -74.006 },
      { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
      { name: "Chicago", lat: 41.8781, lng: -87.6298 },
      { name: "Houston", lat: 29.7604, lng: -95.3698 },
      { name: "Phoenix", lat: 33.4484, lng: -112.074 },
      { name: "Philadelphia", lat: 39.9526, lng: -75.1652 },
      { name: "San Antonio", lat: 29.4241, lng: -98.4936 },
      { name: "San Diego", lat: 32.7157, lng: -117.1611 },
      { name: "Dallas", lat: 32.7767, lng: -96.797 },
    ];

    let closestCity = "Unknown City";
    let minDistance = Infinity;

    for (const city of cities) {
      const distance = this.calculateDistance(lat, lng, city.lat, city.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city.name;
      }
    }

    return closestCity;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private getFallbackAnalysis(lat: number, lng: number): SafetyAnalysis {
    // Fallback when Gemini API is unavailable
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    let score = 65; // Base score

    // Time-based adjustments
    if (hour >= 6 && hour <= 18) score += 15;
    else if (hour >= 19 && hour <= 21) score += 5;
    else score -= 10;

    // Weekend adjustments
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (hour >= 22 || hour <= 6) score -= 5;
    }

    // Add some location-based variation
    const locationHash = Math.abs((lat * 1000 + lng * 1000) * 123) % 30;
    score += locationHash - 15; // -15 to +15 variation

    score = Math.max(25, Math.min(95, score));

    return {
      score: Math.round(score),
      confidence: 45, // Lower confidence for fallback
      factors: [
        "Time of day analysis",
        "General area assessment",
        "Limited data available",
      ],
      reasoning:
        "Basic safety assessment using time and location factors. Real-time news analysis unavailable.",
      newsEvents: [
        {
          title: "Standard safety assessment",
          impact: "neutral" as const,
          relevance: 50,
        },
      ],
    };
  }

  // Method to clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Method to get cache statistics
  getCacheStats(): { size: number; oldestEntry: number } {
    const now = Date.now();
    let oldestEntry = now;

    this.cache.forEach((value) => {
      if (value.timestamp < oldestEntry) {
        oldestEntry = value.timestamp;
      }
    });

    return {
      size: this.cache.size,
      oldestEntry: oldestEntry === now ? 0 : now - oldestEntry,
    };
  }

  // Test method to verify API connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}?key=${this.API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Hello, respond with just 'OK'",
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Gemini API test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const geminiNewsAnalysisService =
  GeminiNewsAnalysisService.getInstance();

// Export types for external use
export type { SafetyAnalysis };
