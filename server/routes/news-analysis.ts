import { RequestHandler } from "express";

interface NewsAnalysisRequest {
  latitude: number;
  longitude: number;
  radius?: number; // km
}

interface NewsAnalysisResponse {
  safetyScore: number;
  confidence: number;
  factors: string[];
  articles: {
    title: string;
    summary: string;
    impact: "positive" | "negative" | "neutral";
    relevance: number;
    publishedAt: string;
    source: string;
  }[];
  lastUpdated: string;
}

export const handleNewsAnalysis: RequestHandler = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.body as NewsAnalysisRequest;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Latitude and longitude are required",
      });
    }

    // Use Gemini AI for comprehensive analysis
    const analysis = await performGeminiAnalysis(latitude, longitude);

    res.json(analysis);
  } catch (error) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({
      error: "Failed to analyze safety data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

async function performGeminiAnalysis(
  lat: number,
  lng: number,
): Promise<NewsAnalysisResponse> {
  const API_KEY = "AIzaSyDFXy8qsqr4gQ0e4wIowzVLvTA1ut7W7j8";
  const BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

  const currentTime = new Date().toISOString();
  const nearbyCity = getNearbyCity(lat, lng);

  const prompt = `Analyze the safety conditions for location ${lat}, ${lng} near ${nearbyCity} at ${currentTime}.

Provide analysis in this JSON format:
{
  "safetyScore": <0-100>,
  "confidence": <0-100>,
  "factors": ["factor1", "factor2", "factor3"],
  "articles": [
    {"title": "Recent event", "summary": "Brief description", "impact": "positive/negative/neutral", "relevance": <0-100>, "publishedAt": "${new Date().toISOString()}", "source": "AI Analysis"}
  ],
  "reasoning": "Explanation of the score"
}

Consider current time, location characteristics, and general safety factors.`;

  const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("No content from Gemini");
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON in response");
  }

  const analysis = JSON.parse(jsonMatch[0]);

  return {
    safetyScore: analysis.safetyScore,
    confidence: analysis.confidence,
    factors: analysis.factors || ["AI analysis"],
    articles: analysis.articles || [],
    lastUpdated: new Date().toISOString(),
  };
}

function getNearbyCity(lat: number, lng: number): string {
  const cities = [
    { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
    { name: "New York", lat: 40.7128, lng: -74.006 },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    { name: "Chicago", lat: 41.8781, lng: -87.6298 },
  ];

  let closestCity = "Unknown City";
  let minDistance = Infinity;

  for (const city of cities) {
    const distance = Math.sqrt((lat - city.lat) ** 2 + (lng - city.lng) ** 2);
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city.name;
    }
  }

  return closestCity;
}

async function fetchSimulatedNews(lat: number, lng: number, radius: number) {
  // This simulates what would be real API calls to:
  // - NewsAPI.org for general news
  // - Local police RSS feeds
  // - Traffic incident APIs
  // - Weather alert systems
  // - Social media safety reports

  const newsTemplates = [
    {
      type: "crime",
      templates: [
        "Police increase patrols following recent incidents",
        "Community watch program shows positive results",
        "Local business security upgrades completed",
        "Emergency response time improvements announced",
      ],
      baseImpact: -10,
    },
    {
      type: "traffic",
      templates: [
        "New traffic safety measures reduce accidents",
        "Major intersection improvements completed",
        "Public transportation safety enhancements",
        "Road construction affects local traffic",
      ],
      baseImpact: -5,
    },
    {
      type: "community",
      templates: [
        "Neighborhood improvement project funded",
        "Local safety initiative launches",
        "Community center expands evening programs",
        "Youth engagement program reduces incidents",
      ],
      baseImpact: 15,
    },
    {
      type: "emergency",
      templates: [
        "New emergency call boxes installed",
        "First responder training program completed",
        "Emergency shelter capacity increased",
        "Public safety technology upgrade finished",
      ],
      baseImpact: 12,
    },
  ];

  const articles = [];
  const numArticles = 5 + Math.floor(Math.random() * 8); // 5-12 articles

  for (let i = 0; i < numArticles; i++) {
    const template =
      newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
    const titleTemplate =
      template.templates[Math.floor(Math.random() * template.templates.length)];

    const hoursAgo = Math.floor(Math.random() * 168); // Up to 1 week old
    const publishedAt = new Date(
      Date.now() - hoursAgo * 60 * 60 * 1000,
    ).toISOString();

    // Simulate distance impact
    const distance = Math.random() * radius;
    const distanceImpact = Math.exp(-distance / (radius * 0.3));

    // Simulate time decay
    const timeDecay = Math.exp(-hoursAgo / 48); // 48 hour half-life

    const relevance = Math.floor(
      (60 + Math.random() * 40) * distanceImpact * timeDecay,
    );

    let impact: "positive" | "negative" | "neutral" = "neutral";
    if (template.baseImpact > 5) impact = "positive";
    else if (template.baseImpact < -5) impact = "negative";

    // Add some randomness
    if (Math.random() > 0.8) {
      impact = Math.random() > 0.5 ? "positive" : "negative";
    }

    articles.push({
      title: titleTemplate,
      summary: `Local ${template.type} report affecting area safety and community conditions.`,
      impact,
      relevance,
      publishedAt,
      source: `Local News ${Math.floor(Math.random() * 5) + 1}`,
      distance,
      timeDecay,
      baseImpact: template.baseImpact,
    });
  }

  return articles.sort((a, b) => b.relevance - a.relevance);
}

function analyzeNewsForSafety(articles: any[], lat: number, lng: number) {
  let totalImpact = 0;
  let confidence = 70;
  const factors: string[] = [];

  articles.forEach((article) => {
    const weightedImpact =
      article.baseImpact * (article.relevance / 100) * article.timeDecay;
    totalImpact += weightedImpact;

    if (article.relevance > 80) {
      confidence += 3;
      factors.push(
        `${article.impact === "positive" ? "✓" : "⚠"} ${article.title.substring(0, 40)}...`,
      );
    }
  });

  // Normalize score to 0-100 range
  const normalizedScore = Math.max(
    20,
    Math.min(95, Math.round(70 + totalImpact)),
  );

  return {
    score: normalizedScore,
    confidence: Math.min(95, confidence),
    factors: factors.slice(0, 5),
  };
}

// Additional endpoint for real-time news monitoring
export const handleNewsMonitoring: RequestHandler = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Latitude and longitude query parameters are required",
      });
    }

    // This would set up real-time monitoring of news sources
    // and return a stream or webhook URL for updates

    res.json({
      message: "News monitoring setup (demo)",
      monitoringId: `monitor_${Date.now()}`,
      webhookUrl: `/api/news-updates/${Date.now()}`,
      sources: [
        "Local Police RSS",
        "Traffic Incident API",
        "Weather Alerts",
        "Community Reports",
        "News API",
      ],
      updateFrequency: "5 minutes",
      note: "In production, this would establish real-time monitoring of multiple news sources for the specified location",
    });
  } catch (error) {
    console.error("News monitoring setup error:", error);
    res.status(500).json({
      error: "Failed to setup news monitoring",
    });
  }
};

export default { handleNewsAnalysis, handleNewsMonitoring };
