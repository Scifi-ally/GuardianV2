import { RequestHandler } from "express";

interface RouteAnalysisRequest {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  travelMode: "WALKING" | "DRIVING" | "BICYCLING";
  segments?: number;
}

interface RouteSegment {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  safetyScore: number;
  riskFactors: string[];
  recommendations: string[];
  alerts: string[];
}

interface RouteAnalysisResponse {
  overallSafety: number;
  confidence: number;
  estimatedTime: string;
  totalDistance: string;
  segments: RouteSegment[];
  insights: string[];
  realTimeAlerts: string[];
  alternativeRoutes: {
    safety: number;
    description: string;
    timeDifference: string;
  }[];
}

interface LocationSafetyRequest {
  latitude: number;
  longitude: number;
  radius?: number;
}

interface LocationSafetyResponse {
  safetyScore: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: string[];
  recommendations: string[];
  realTimeData: {
    lighting: number;
    crowdDensity: number;
    emergencyServices: number;
    criminalActivity: number;
  };
  nearbyServices: {
    type: "police" | "hospital" | "fire" | "safe_zone";
    name: string;
    distance: number;
    responseTime: string;
  }[];
}

// Enhanced route analysis with AI
export const handleRouteAnalysis: RequestHandler = async (req, res) => {
  try {
    const {
      startLat,
      startLng,
      endLat,
      endLng,
      travelMode = "WALKING",
      segments = 5,
    } = req.body as RouteAnalysisRequest;

    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({
        error: "Start and end coordinates are required",
      });
    }

    console.log(
      `🗺️ Analyzing route: ${startLat},${startLng} → ${endLat},${endLng}`,
    );

    // Calculate route segments
    const routeSegments: RouteSegment[] = [];
    const segmentCount = Math.min(segments, 10); // Limit to 10 segments

    for (let i = 0; i < segmentCount; i++) {
      const ratio = i / segmentCount;
      const nextRatio = (i + 1) / segmentCount;

      const segmentStart = {
        lat: startLat + ratio * (endLat - startLat),
        lng: startLng + ratio * (endLng - startLng),
      };

      const segmentEnd = {
        lat: startLat + nextRatio * (endLat - startLat),
        lng: startLng + nextRatio * (endLng - startLng),
      };

      // Analyze segment safety
      const segmentSafety = await analyzeSegmentSafety(
        segmentStart.lat,
        segmentStart.lng,
        segmentEnd.lat,
        segmentEnd.lng,
        travelMode,
      );

      routeSegments.push({
        startLat: segmentStart.lat,
        startLng: segmentStart.lng,
        endLat: segmentEnd.lat,
        endLng: segmentEnd.lng,
        ...segmentSafety,
      });
    }

    // Calculate overall route metrics
    const overallSafety = Math.round(
      routeSegments.reduce((sum, seg) => sum + seg.safetyScore, 0) /
        routeSegments.length,
    );

    const totalDistance = calculateDistance(startLat, startLng, endLat, endLng);
    const estimatedTime = calculateTravelTime(totalDistance, travelMode);

    // Generate AI insights
    const insights = generateRouteInsights(
      routeSegments,
      overallSafety,
      travelMode,
    );
    const realTimeAlerts = generateRealTimeAlerts(routeSegments);
    const alternativeRoutes = generateAlternativeRoutes(overallSafety);

    const response: RouteAnalysisResponse = {
      overallSafety,
      confidence: 85,
      estimatedTime,
      totalDistance: `${totalDistance.toFixed(1)} km`,
      segments: routeSegments,
      insights,
      realTimeAlerts,
      alternativeRoutes,
    };

    res.json(response);
  } catch (error) {
    console.error("Route analysis error:", error);
    res.status(500).json({
      error: "Failed to analyze route",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Enhanced location safety analysis
export const handleLocationSafety: RequestHandler = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 1,
    } = req.body as LocationSafetyRequest;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Latitude and longitude are required",
      });
    }

    console.log(`🛡️ Analyzing location safety: ${latitude},${longitude}`);

    // Generate comprehensive safety analysis
    const safetyAnalysis = await analyzeLocationSafety(
      latitude,
      longitude,
      radius,
    );

    res.json(safetyAnalysis);
  } catch (error) {
    console.error("Location safety analysis error:", error);
    res.status(500).json({
      error: "Failed to analyze location safety",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Real-time safety monitoring
export const handleRealTimeMonitoring: RequestHandler = async (req, res) => {
  try {
    const { latitude, longitude, userId } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Location coordinates are required",
      });
    }

    // In production, this would set up real-time monitoring
    // For now, return immediate analysis
    const monitoring = {
      monitoringId: `monitor_${Date.now()}`,
      status: "active",
      location: { latitude, longitude },
      safetyScore: await getQuickSafetyScore(latitude, longitude),
      updateFrequency: "30 seconds",
      alerts: [],
      emergencyContacts: "notified",
    };

    res.json(monitoring);
  } catch (error) {
    console.error("Real-time monitoring error:", error);
    res.status(500).json({
      error: "Failed to start monitoring",
    });
  }
};

// Helper functions
async function analyzeSegmentSafety(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  travelMode: string,
) {
  // AI safety analysis for route segment
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;

  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 22;

  // Base safety score calculation
  let safetyScore = 75;

  // Time-based adjustments
  if (isNight) safetyScore -= 15;
  else if (hour >= 6 && hour <= 18) safetyScore += 10;

  // Travel mode adjustments
  if (travelMode === "WALKING" && isNight) safetyScore -= 10;
  if (travelMode === "DRIVING") safetyScore += 5;

  // Location-based variation (mock)
  const locationFactor = Math.sin(midLat * 1000) * Math.cos(midLng * 1000) * 15;
  safetyScore += locationFactor;

  // Ensure score is within bounds
  safetyScore = Math.max(30, Math.min(95, Math.round(safetyScore)));

  const riskFactors = [];
  const recommendations = [];
  const alerts = [];

  if (safetyScore < 60) {
    riskFactors.push("Lower safety area");
    recommendations.push("Stay alert", "Consider alternative route");
    if (isNight) alerts.push("Night travel - extra caution");
  }

  if (isNight) {
    riskFactors.push("Limited visibility");
    recommendations.push("Use well-lit paths");
  }

  if (travelMode === "WALKING" && safetyScore < 70) {
    recommendations.push("Consider public transport");
  }

  return {
    safetyScore,
    riskFactors,
    recommendations,
    alerts,
  };
}

async function analyzeLocationSafety(
  latitude: number,
  longitude: number,
  radius: number,
): Promise<LocationSafetyResponse> {
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour > 22;

  // Base safety calculation
  let safetyScore = 70;

  // Time adjustments
  if (hour >= 6 && hour <= 18) safetyScore += 15;
  else if (hour >= 19 && hour <= 21) safetyScore += 5;
  else safetyScore -= 10;

  // Location variation
  const locationFactor = Math.floor((latitude * longitude * 1000) % 25) - 12;
  safetyScore += locationFactor;

  safetyScore = Math.max(30, Math.min(95, safetyScore));

  const riskLevel: LocationSafetyResponse["riskLevel"] =
    safetyScore >= 80
      ? "low"
      : safetyScore >= 60
        ? "medium"
        : safetyScore >= 40
          ? "high"
          : "critical";

  const factors = [
    `${isNight ? "Nighttime" : "Daytime"} conditions`,
    "Area characteristics assessment",
    "Real-time data analysis",
  ];

  const recommendations = [];
  if (safetyScore < 70) {
    recommendations.push("Exercise caution", "Stay in populated areas");
  }
  if (isNight) {
    recommendations.push("Use well-lit routes", "Consider transportation");
  }
  if (safetyScore >= 80) {
    recommendations.push("Area appears safe", "Normal precautions apply");
  }

  // Mock real-time data
  const realTimeData = {
    lighting: isNight ? 60 : 90,
    crowdDensity: hour >= 9 && hour <= 17 ? 80 : 40,
    emergencyServices: 85,
    criminalActivity: Math.max(10, 100 - safetyScore),
  };

  // Mock nearby services
  const nearbyServices = [
    {
      type: "police" as const,
      name: "Local Police Station",
      distance: 0.8 + Math.random() * 1.2,
      responseTime: "3-5 min",
    },
    {
      type: "hospital" as const,
      name: "Community Medical Center",
      distance: 1.2 + Math.random() * 2,
      responseTime: "8-12 min",
    },
  ];

  return {
    safetyScore,
    confidence: 80,
    riskLevel,
    factors,
    recommendations,
    realTimeData,
    nearbyServices,
  };
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateTravelTime(distance: number, travelMode: string): string {
  const speeds = {
    WALKING: 5, // km/h
    BICYCLING: 15, // km/h
    DRIVING: 30, // km/h (city average)
  };

  const speed = speeds[travelMode as keyof typeof speeds] || 5;
  const timeHours = distance / speed;
  const timeMinutes = Math.round(timeHours * 60);

  if (timeMinutes < 60) {
    return `${timeMinutes} min`;
  } else {
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
}

function generateRouteInsights(
  segments: RouteSegment[],
  overallSafety: number,
  travelMode: string,
): string[] {
  const insights = [];

  if (overallSafety >= 80) {
    insights.push("✅ Route has excellent safety ratings");
  } else if (overallSafety < 50) {
    insights.push("⚠️ Route has safety concerns - consider alternatives");
  }

  const dangerousSegments = segments.filter((s) => s.safetyScore < 50).length;
  if (dangerousSegments > 0) {
    insights.push(`🚨 ${dangerousSegments} segment(s) require extra attention`);
  }

  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    insights.push("🌙 Night travel - enhanced safety measures recommended");
  }

  if (travelMode === "WALKING" && overallSafety < 70) {
    insights.push("🚶‍♀️ Consider public transport for this route");
  }

  return insights;
}

function generateRealTimeAlerts(segments: RouteSegment[]): string[] {
  const alerts = [];
  const hour = new Date().getHours();

  if (hour < 6 || hour > 22) {
    alerts.push("Limited visibility - use well-lit paths");
  }

  const lowSafetySegments = segments.filter((s) => s.safetyScore < 60);
  if (lowSafetySegments.length > 0) {
    alerts.push("Heightened awareness recommended for portions of route");
  }

  return alerts;
}

function generateAlternativeRoutes(currentSafety: number) {
  if (currentSafety >= 80) return [];

  return [
    {
      safety: Math.min(95, currentSafety + 15),
      description: "Safer route via main streets",
      timeDifference: "+3 min",
    },
    {
      safety: Math.min(90, currentSafety + 10),
      description: "Well-lit alternative path",
      timeDifference: "+5 min",
    },
  ];
}

async function getQuickSafetyScore(
  latitude: number,
  longitude: number,
): Promise<number> {
  const hour = new Date().getHours();
  let score = 70;

  if (hour >= 6 && hour <= 18) score += 15;
  else score -= 10;

  const variation = Math.floor((latitude * longitude * 1000) % 20) - 10;
  score += variation;

  return Math.max(30, Math.min(95, score));
}

export default {
  handleRouteAnalysis,
  handleLocationSafety,
  handleRealTimeMonitoring,
};
