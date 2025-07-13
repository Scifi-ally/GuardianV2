interface NewsSource {
  name: string;
  url: string;
  apiKey?: string;
}

interface NewsArticle {
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  source: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  safetyRelevance: number; // 0-100 how relevant to safety
  sentiment: "positive" | "neutral" | "negative";
  categories: string[];
}

interface SafetyImpact {
  score: number; // 0-100
  confidence: number; // 0-100
  factors: string[];
  timeDecay: number; // How much impact decreases over time
  radius: number; // Kilometers of impact
}

export class NewsAnalysisService {
  private static instance: NewsAnalysisService;
  private cache: Map<string, { data: SafetyImpact; timestamp: number }> =
    new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Internal-only news sources - no external APIs
  private newsSources: NewsSource[] = [
    { name: "Internal Safety Data", url: "/internal/safety-data" },
    { name: "Local Cache", url: "/internal/cache" },
  ];

  static getInstance(): NewsAnalysisService {
    if (!NewsAnalysisService.instance) {
      NewsAnalysisService.instance = new NewsAnalysisService();
    }
    return NewsAnalysisService.instance;
  }

  async analyzeAreaSafety(lat: number, lng: number): Promise<SafetyImpact> {
    const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // In a real implementation, this would fetch from multiple news APIs
      const analysis = await this.performAIAnalysis(lat, lng);

      this.cache.set(cacheKey, {
        data: analysis,
        timestamp: Date.now(),
      });

      return analysis;
    } catch (error) {
      console.warn("News analysis failed, using fallback:", error);
      return this.getFallbackAnalysis(lat, lng);
    }
  }

  private async performAIAnalysis(
    lat: number,
    lng: number,
  ): Promise<SafetyImpact> {
    // Simulate real AI analysis of news data
    // In production, this would:
    // 1. Fetch recent news within radius of location
    // 2. Use NLP to analyze safety relevance
    // 3. Apply geospatial weighting
    // 4. Calculate time-decay factors

    const articles = await this.fetchRelevantNews(lat, lng);
    const analysis = this.analyzeArticles(articles, lat, lng);

    return analysis;
  }

  private async fetchRelevantNews(
    lat: number,
    lng: number,
  ): Promise<NewsArticle[]> {
    // Simulate fetching news from multiple sources
    // This would integrate with real news APIs like:
    // - NewsAPI.org
    // - Local police RSS feeds
    // - Traffic incident APIs
    // - Weather alert systems
    // - Social media safety reports

    return this.simulateNewsData(lat, lng);
  }

  private simulateNewsData(lat: number, lng: number): NewsArticle[] {
    const now = new Date();
    const articles: NewsArticle[] = [];

    // Simulate various types of news that affect safety
    const newsTypes = [
      {
        type: "crime",
        titles: [
          "Local Crime Report: Increased Patrols in Area",
          "Community Safety Initiative Launched",
          "Recent Break-in Incidents Reported",
          "Police Arrest Suspects in Local Case",
        ],
        impact: -15,
      },
      {
        type: "traffic",
        titles: [
          "Major Traffic Incident Cleared",
          "New Traffic Safety Measures Implemented",
          "Road Construction Causes Delays",
          "Improved Street Lighting Installation",
        ],
        impact: -5,
      },
      {
        type: "community",
        titles: [
          "Community Watch Program Expanded",
          "Local Business Safety Partnership",
          "Neighborhood Improvement Project Completed",
          "Emergency Response Times Improved",
        ],
        impact: 10,
      },
      {
        type: "weather",
        titles: [
          "Severe Weather Alert Issued",
          "Flooding Risk in Low Areas",
          "Clear Weather Expected",
          "Storm Damage Assessment Complete",
        ],
        impact: -8,
      },
    ];

    // Generate 3-8 relevant articles based on location
    const numArticles = 3 + Math.floor(Math.abs(lat * lng * 100) % 6);

    for (let i = 0; i < numArticles; i++) {
      const newsType =
        newsTypes[Math.floor(Math.abs(lat * lng * i * 100) % newsTypes.length)];
      const titleIndex = Math.floor(
        Math.abs(lng * lat * i * 50) % newsType.titles.length,
      );

      const hoursAgo = Math.floor(Math.abs(lat * lng * i * 24) % 72);
      const publishedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      articles.push({
        title: newsType.titles[titleIndex],
        description: `Local incident affecting area safety and community well-being.`,
        content: `Detailed report about ${newsType.type} incident in the local area.`,
        publishedAt: publishedAt.toISOString(),
        source: `Local News ${i + 1}`,
        location: {
          lat: lat + (Math.random() - 0.5) * 0.01, // Within ~1km
          lng: lng + (Math.random() - 0.5) * 0.01,
          address: `Local Area ${i + 1}`,
        },
        safetyRelevance: 60 + Math.floor(Math.random() * 40),
        sentiment:
          newsType.impact > 0
            ? "positive"
            : newsType.impact < -10
              ? "negative"
              : "neutral",
        categories: [newsType.type, "safety", "local"],
      });
    }

    return articles;
  }

  private analyzeArticles(
    articles: NewsArticle[],
    lat: number,
    lng: number,
  ): SafetyImpact {
    let totalImpact = 0;
    let confidence = 70; // Base confidence
    const factors: string[] = [];
    let maxRadius = 1; // km

    articles.forEach((article) => {
      // Calculate distance impact
      const distance = this.calculateDistance(
        lat,
        lng,
        article.location?.lat || lat,
        article.location?.lng || lng,
      );

      // Time decay - recent news has more impact
      const hoursOld =
        (Date.now() - new Date(article.publishedAt).getTime()) /
        (1000 * 60 * 60);
      const timeDecay = Math.exp(-hoursOld / 24); // Exponential decay over 24 hours

      // Distance decay - closer events have more impact
      const distanceDecay = Math.exp(-distance / 2); // Significant impact within 2km

      // Calculate weighted impact
      let impact = 0;

      switch (article.sentiment) {
        case "positive":
          impact = article.safetyRelevance * 0.3; // Positive news improves safety
          factors.push(`✓ ${article.title.substring(0, 30)}...`);
          break;
        case "negative":
          impact = -article.safetyRelevance * 0.5; // Negative news reduces safety
          factors.push(`⚠ ${article.title.substring(0, 30)}...`);
          break;
        default:
          impact = article.safetyRelevance * 0.1; // Neutral news slight impact
          break;
      }

      const weightedImpact = impact * timeDecay * distanceDecay;
      totalImpact += weightedImpact;

      // Increase confidence for more relevant articles
      if (article.safetyRelevance > 80) {
        confidence += 5;
      }

      // Extend radius for significant incidents
      if (Math.abs(weightedImpact) > 10) {
        maxRadius = Math.max(maxRadius, 3);
      }
    });

    // Normalize to 0-100 scale
    const normalizedScore = Math.max(0, Math.min(100, 75 + totalImpact));

    return {
      score: Math.round(normalizedScore),
      confidence: Math.min(95, confidence),
      factors: factors.slice(0, 5), // Top 5 factors
      timeDecay: 0.9, // How quickly impact decreases
      radius: maxRadius,
    };
  }

  private getFallbackAnalysis(lat: number, lng: number): SafetyImpact {
    // Fallback when news APIs are unavailable
    const hash = Math.abs((lat * 1000 + lng * 1000) * 123) % 100;

    return {
      score: 60 + (hash % 30), // 60-90 range
      confidence: 45, // Lower confidence for fallback
      factors: ["Limited news data available"],
      timeDecay: 0.8,
      radius: 1.5,
    };
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

  // Method to integrate with real news APIs
  async integrateRealNewsAPIs(): Promise<boolean> {
    try {
      // Check if news APIs are available and configured
      const apiKey = import.meta.env.VITE_NEWS_API_KEY;

      if (!apiKey) {
        console.warn("News API key not configured. Using simulated data.");
        return false;
      }

      // Test API connectivity
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=safety&apiKey=${apiKey}&pageSize=1`,
      );

      if (response.ok) {
        console.log("News API integration successful");
        return true;
      } else {
        console.warn("News API test failed, using simulated data");
        return false;
      }
    } catch (error) {
      console.warn("News API integration failed:", error);
      return false;
    }
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
}

// Export singleton instance
export const newsAnalysisService = NewsAnalysisService.getInstance();

// Type definitions for external use
export type { NewsArticle, SafetyImpact };
