import { useState, useEffect, useCallback } from "react";
import {
  enhancedSafetyScoring,
  type EnhancedSafetyScore,
} from "@/services/enhancedSafetyScoring";

interface SafeAreaData {
  id: string;
  bounds: google.maps.LatLngLiteral[];
  safetyScore: number;
  center: google.maps.LatLngLiteral;
  type:
    | "residential"
    | "commercial"
    | "transit"
    | "park"
    | "emergency"
    | "industrial";
  enhancedAnalysis?: EnhancedSafetyScore;
  lastUpdated: number;
  neighbors: string[];
}

interface EnhancedSafetyAreasProps {
  map: google.maps.Map | null;
  userLocation?: { latitude: number; longitude: number };
  showSafeAreaCircles: boolean;
  onAreaUpdate?: (areas: SafeAreaData[]) => void;
}

export function EnhancedSafetyAreas({
  map,
  userLocation,
  showSafeAreaCircles,
  onAreaUpdate,
}: EnhancedSafetyAreasProps) {
  const [safeAreas, setSafeAreas] = useState<SafeAreaData[]>([]);
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Generate seamless safety areas with enhanced Gemini scoring
  const generateEnhancedAreas = useCallback(
    async (bounds: google.maps.LatLngBounds) => {
      setIsLoading(true);
      const areas: SafeAreaData[] = [];
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      // Adaptive grid size based on zoom level
      const latRange = ne.lat() - sw.lat();
      const lngRange = ne.lng() - sw.lng();
      const zoomLevel = map?.getZoom() || 15;

      // Adjust grid density based on zoom (more detail at higher zoom)
      const baseGridSize = 0.008;
      const gridSize =
        baseGridSize / Math.pow(1.5, Math.max(0, zoomLevel - 13));

      const latSteps = Math.ceil(latRange / gridSize);
      const lngSteps = Math.ceil(lngRange / gridSize);

      // Limit processing for performance and API quota
      const maxCells = 12; // Reduced significantly to prevent API issues
      const cellLimit = Math.min(latSteps * lngSteps, maxCells);

      console.log(
        `🧮 Generating ${cellLimit} enhanced safety areas with AI analysis...`,
      );

      const points: Array<{
        lat: number;
        lng: number;
        id: string;
        type: SafeAreaData["type"];
        priority: number;
      }> = [];

      // Generate strategic points with priority weighting
      for (let i = 0; i < latSteps && points.length < cellLimit; i++) {
        for (let j = 0; j < lngSteps && points.length < cellLimit; j++) {
          const lat =
            sw.lat() +
            (i + 0.5) * gridSize +
            (Math.random() - 0.5) * gridSize * 0.2;
          const lng =
            sw.lng() +
            (j + 0.5) * gridSize +
            (Math.random() - 0.5) * gridSize * 0.2;

          // Calculate priority based on distance to user
          let priority = 1;
          if (userLocation) {
            const distance = Math.sqrt(
              Math.pow(lat - userLocation.latitude, 2) +
                Math.pow(lng - userLocation.longitude, 2),
            );
            priority = Math.max(0.1, 1 - distance * 100); // Higher priority for closer areas
          }

          points.push({
            lat,
            lng,
            id: `enhanced-${i}-${j}`,
            type: getAreaType(lat, lng),
            priority,
          });
        }
      }

      // Sort by priority and process high-priority areas first
      points.sort((a, b) => b.priority - a.priority);

      // Process points in smaller batches to avoid rate limiting
      const batchSize = 2; // Smaller batches
      for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (point) => {
            try {
              let enhancedAnalysis;

              // Use enhanced analysis for high-priority areas only, fallback for others
              if (point.priority > 0.7) {
                enhancedAnalysis =
                  await enhancedSafetyScoring.calculateEnhancedSafety(
                    point.lat,
                    point.lng,
                    {
                      includeRealTime: true,
                      includePrediction: true,
                      detailLevel: "basic", // Reduced detail level
                    },
                  );
              } else {
                // Use fallback for lower priority areas
                throw new Error("Using fallback for low priority area");
              }

              // Find neighboring points for seamless coverage
              const neighbors = points
                .filter((p) => p.id !== point.id)
                .sort((a, b) => {
                  const distA = Math.sqrt(
                    (a.lat - point.lat) ** 2 + (a.lng - point.lng) ** 2,
                  );
                  const distB = Math.sqrt(
                    (b.lat - point.lat) ** 2 + (b.lng - point.lng) ** 2,
                  );
                  return distA - distB;
                })
                .slice(0, 6);

              // Generate dynamic Voronoi cell bounds
              const cellBounds = generateAdaptiveCell(
                point,
                neighbors,
                gridSize,
                enhancedAnalysis.overallScore,
              );

              areas.push({
                id: point.id,
                bounds: cellBounds,
                safetyScore: enhancedAnalysis.overallScore,
                center: { lat: point.lat, lng: point.lng },
                type: point.type,
                enhancedAnalysis,
                lastUpdated: Date.now(),
                neighbors: neighbors.map((n) => n.id),
              });
            } catch (error) {
              console.warn(
                `Failed to analyze enhanced area ${point.id}:`,
                error,
              );

              // Fallback with basic scoring
              const fallbackScore = calculateFallbackSafety(
                point.lat,
                point.lng,
                point.type,
              );
              const neighbors = points
                .filter((p) => p.id !== point.id)
                .sort((a, b) => {
                  const distA = Math.sqrt(
                    (a.lat - point.lat) ** 2 + (a.lng - point.lng) ** 2,
                  );
                  const distB = Math.sqrt(
                    (b.lat - point.lat) ** 2 + (b.lng - point.lng) ** 2,
                  );
                  return distA - distB;
                })
                .slice(0, 6);

              const cellBounds = generateAdaptiveCell(
                point,
                neighbors,
                gridSize,
                fallbackScore,
              );

              areas.push({
                id: point.id,
                bounds: cellBounds,
                safetyScore: fallbackScore,
                center: { lat: point.lat, lng: point.lng },
                type: point.type,
                lastUpdated: Date.now(),
                neighbors: neighbors.map((n) => n.id),
              });
            }
          }),
        );

        // Longer delay between batches to respect rate limits
        if (i + batchSize < points.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
        }
      }

      // Smart merging of adjacent areas with similar characteristics
      const optimizedAreas = intelligentAreaMerging(areas);

      console.log(
        `✅ Generated ${optimizedAreas.length} enhanced safety areas with AI analysis`,
      );

      setSafeAreas(optimizedAreas);
      setLastUpdate(Date.now());
      setIsLoading(false);
      onAreaUpdate?.(optimizedAreas);
    },
    [map, userLocation, onAreaUpdate],
  );

  // Adaptive cell generation based on safety score and neighbors
  function generateAdaptiveCell(
    center: { lat: number; lng: number },
    neighbors: Array<{ lat: number; lng: number }>,
    baseSize: number,
    safetyScore: number,
  ): google.maps.LatLngLiteral[] {
    const cellPoints: google.maps.LatLngLiteral[] = [];

    // Adjust cell size based on safety score (dangerous areas are more prominent)
    const sizeMultiplier =
      safetyScore < 40 ? 1.3 : safetyScore > 80 ? 0.8 : 1.0;
    const radius = baseSize * sizeMultiplier * 0.6;

    // Create adaptive polygon with neighbor-aware edges
    const numSides = 12; // Smooth polygons

    for (let i = 0; i < numSides; i++) {
      const angle = (i / numSides) * 2 * Math.PI;
      let distance = radius;

      // Adjust distance based on nearby neighbors
      for (const neighbor of neighbors.slice(0, 4)) {
        // Consider closest 4 neighbors
        const neighborAngle = Math.atan2(
          neighbor.lng - center.lng,
          neighbor.lat - center.lat,
        );
        const angleDiff = Math.abs(angle - neighborAngle);

        if (angleDiff < Math.PI / 6) {
          // Within 30 degrees
          const neighborDistance = Math.sqrt(
            (neighbor.lat - center.lat) ** 2 + (neighbor.lng - center.lng) ** 2,
          );
          distance = Math.min(distance, neighborDistance * 0.4); // Ensure no overlap
        }
      }

      cellPoints.push({
        lat: center.lat + Math.cos(angle) * distance,
        lng: center.lng + Math.sin(angle) * distance,
      });
    }

    return cellPoints;
  }

  // Intelligent merging of adjacent areas
  function intelligentAreaMerging(areas: SafeAreaData[]): SafeAreaData[] {
    const mergedAreas: SafeAreaData[] = [];
    const processed = new Set<string>();

    for (const area of areas) {
      if (processed.has(area.id)) continue;

      // Find mergeable adjacent areas
      const mergeGroup = [area];
      const queue = [area];
      processed.add(area.id);

      while (queue.length > 0) {
        const current = queue.shift()!;

        for (const neighborId of current.neighbors) {
          if (processed.has(neighborId)) continue;

          const neighbor = areas.find((a) => a.id === neighborId);
          if (!neighbor) continue;

          // Enhanced merging criteria
          const scoreDiff = Math.abs(
            current.safetyScore - neighbor.safetyScore,
          );
          const sameType = current.type === neighbor.type;
          const bothAnalyzed =
            current.enhancedAnalysis && neighbor.enhancedAnalysis;

          // Check alert level compatibility
          const sameAlertLevel =
            bothAnalyzed &&
            current.enhancedAnalysis!.alertLevel ===
              neighbor.enhancedAnalysis!.alertLevel;

          // Merge if compatible
          if (
            scoreDiff <= 12 &&
            sameType &&
            (sameAlertLevel || !bothAnalyzed)
          ) {
            mergeGroup.push(neighbor);
            queue.push(neighbor);
            processed.add(neighborId);
          }
        }
      }

      if (mergeGroup.length > 1) {
        // Create merged area with enhanced properties
        const mergedArea = createEnhancedMergedArea(mergeGroup);
        mergedAreas.push(mergedArea);
      } else {
        mergedAreas.push(area);
      }
    }

    return mergedAreas;
  }

  // Create enhanced merged area
  function createEnhancedMergedArea(areas: SafeAreaData[]): SafeAreaData {
    // Weight-based averaging for safety scores
    const totalConfidence = areas.reduce(
      (sum, area) => sum + (area.enhancedAnalysis?.confidence || 50),
      0,
    );

    const weightedScore = areas.reduce((sum, area) => {
      const weight =
        (area.enhancedAnalysis?.confidence || 50) / totalConfidence;
      return sum + area.safetyScore * weight;
    }, 0);

    // Calculate optimal merged bounds using alpha shapes
    const allPoints = areas.flatMap((area) => area.bounds);
    const mergedBounds = calculateOptimalBounds(allPoints);

    // Merge enhanced analyses
    const analyses = areas
      .filter((a) => a.enhancedAnalysis)
      .map((a) => a.enhancedAnalysis!);
    const mergedAnalysis: EnhancedSafetyScore | undefined =
      analyses.length > 0
        ? {
            overallScore: Math.round(weightedScore),
            confidence: Math.round(totalConfidence / areas.length),
            factors: analyses[0].factors, // Use dominant area's factors
            analysis: analyses[0].analysis,
            recommendations: Array.from(
              new Set(analyses.flatMap((a) => a.recommendations)),
            ).slice(0, 4),
            alertLevel: determineGroupAlertLevel(
              analyses.map((a) => a.alertLevel),
            ),
            dynamicFactors: {
              trending: determineTrending(
                analyses.map((a) => a.dynamicFactors.trending),
              ),
              prediction: Math.round(
                analyses.reduce(
                  (sum, a) => sum + a.dynamicFactors.prediction,
                  0,
                ) / analyses.length,
              ),
              volatility: Math.round(
                analyses.reduce(
                  (sum, a) => sum + a.dynamicFactors.volatility,
                  0,
                ) / analyses.length,
              ),
            },
          }
        : undefined;

    return {
      id: `merged-${areas.map((a) => a.id).join("-")}`,
      bounds: mergedBounds,
      safetyScore: Math.round(weightedScore),
      center: {
        lat: areas.reduce((sum, a) => sum + a.center.lat, 0) / areas.length,
        lng: areas.reduce((sum, a) => sum + a.center.lng, 0) / areas.length,
      },
      type: areas[0].type,
      enhancedAnalysis: mergedAnalysis,
      lastUpdated: Date.now(),
      neighbors: Array.from(new Set(areas.flatMap((a) => a.neighbors))),
    };
  }

  // Listen for map bounds changes with debouncing
  useEffect(() => {
    if (!map) return;

    let timeoutId: NodeJS.Timeout;
    const boundsChangedListener = map.addListener("bounds_changed", () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const bounds = map.getBounds();
        if (bounds) {
          generateEnhancedAreas(bounds);
        }
      }, 5000); // Much longer debounce for AI calls to prevent quota issues
    });

    return () => {
      google.maps.event.removeListener(boundsChangedListener);
      clearTimeout(timeoutId);
    };
  }, [map, generateEnhancedAreas]);

  // Render enhanced polygons with AI-powered styling
  useEffect(() => {
    if (!map || !showSafeAreaCircles) {
      polygons.forEach((polygon) => polygon.setMap(null));
      setPolygons([]);
      return;
    }

    // Clear existing polygons
    polygons.forEach((polygon) => polygon.setMap(null));

    // Create enhanced polygons with AI-driven styling
    const newPolygons = safeAreas.map((area) => {
      const styling = getEnhancedStyling(area);

      const polygon = new google.maps.Polygon({
        paths: area.bounds,
        strokeColor: styling.strokeColor,
        strokeOpacity: styling.strokeOpacity,
        strokeWeight: styling.strokeWeight,
        fillColor: styling.fillColor,
        fillOpacity: styling.fillOpacity,
        map,
        zIndex: styling.zIndex,
      });

      // Enhanced click handler with AI analysis
      polygon.addListener("click", (event: google.maps.PolyMouseEvent) => {
        const infoWindow = new google.maps.InfoWindow({
          content: createEnhancedInfoWindow(area),
          position: event.latLng,
        });

        infoWindow.open(map);
      });

      return polygon;
    });

    setPolygons(newPolygons);
  }, [map, safeAreas, showSafeAreaCircles]);

  return null;
}

// Enhanced styling based on AI analysis
function getEnhancedStyling(area: SafeAreaData) {
  const score = area.safetyScore;
  const analysis = area.enhancedAnalysis;

  // Base colors
  let fillColor = getSafetyColor(score);
  let strokeColor = fillColor;

  // Adjust based on alert level
  if (analysis) {
    switch (analysis.alertLevel) {
      case "danger":
        strokeColor = "#dc2626";
        break;
      case "warning":
        strokeColor = "#f59e0b";
        break;
      case "caution":
        strokeColor = "#eab308";
        break;
      case "safe":
        strokeColor = "#22c55e";
        break;
    }
  }

  // Dynamic opacity based on confidence and volatility
  const baseOpacity = 0.25;
  const confidenceMultiplier = analysis
    ? (analysis.confidence / 100) * 0.3
    : 0.1;
  const volatilityMultiplier = analysis
    ? (analysis.dynamicFactors.volatility / 100) * 0.2
    : 0;

  const fillOpacity = Math.min(
    0.6,
    baseOpacity + confidenceMultiplier + volatilityMultiplier,
  );

  return {
    fillColor,
    strokeColor,
    fillOpacity,
    strokeOpacity: 0.8,
    strokeWeight: analysis?.alertLevel === "danger" ? 3 : score < 40 ? 2 : 1,
    zIndex: score < 40 ? 1000 : analysis?.alertLevel === "danger" ? 1500 : 100,
  };
}

// Create enhanced info window with AI analysis
function createEnhancedInfoWindow(area: SafeAreaData): string {
  const analysis = area.enhancedAnalysis;
  const color = getSafetyColor(area.safetyScore);

  return `
    <div class="p-4 max-w-sm">
      <div class="flex items-center gap-2 mb-3">
        <div style="width: 16px; height: 16px; border-radius: 4px; background: ${color};"></div>
        <h3 class="font-semibold text-gray-800">Enhanced Safety Analysis</h3>
      </div>

      <div class="space-y-3 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Safety Score:</span>
          <span class="font-semibold ${area.safetyScore >= 70 ? "text-green-600" : area.safetyScore >= 40 ? "text-yellow-600" : "text-red-600"}">${area.safetyScore}/100</span>
        </div>

        ${
          analysis
            ? `
          <div class="flex justify-between">
            <span class="text-gray-600">Alert Level:</span>
            <span class="font-medium capitalize ${getAlertLevelColor(analysis.alertLevel)}">${analysis.alertLevel}</span>
          </div>

          <div class="flex justify-between">
            <span class="text-gray-600">Confidence:</span>
            <span class="font-medium">${analysis.confidence}%</span>
          </div>

          <div class="p-2 bg-gray-50 rounded">
            <div class="font-medium text-gray-700 mb-1">AI Insights</div>
            <div class="text-xs text-gray-600 mb-2">${analysis.analysis.reasoning}</div>

            <div class="space-y-1">
              ${analysis.recommendations
                .slice(0, 2)
                .map(
                  (rec) => `
                <div class="text-xs text-blue-600">• ${rec}</div>
              `,
                )
                .join("")}
            </div>
          </div>

          <div class="flex justify-between text-xs">
            <span class="text-gray-500">Trend: ${analysis.dynamicFactors.trending}</span>
            <span class="text-gray-500">Volatility: ${analysis.dynamicFactors.volatility}%</span>
          </div>
        `
            : ""
        }

        <div class="text-xs text-gray-500">
          Updated: ${new Date(area.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  `;
}

// Utility functions
function getAreaType(lat: number, lng: number): SafeAreaData["type"] {
  const hash = Math.abs((lat * 1000 + lng * 1000) * 7) % 100;
  if (hash < 30) return "residential";
  if (hash < 50) return "commercial";
  if (hash < 65) return "transit";
  if (hash < 80) return "park";
  if (hash < 90) return "industrial";
  return "emergency";
}

function calculateFallbackSafety(
  lat: number,
  lng: number,
  type: SafeAreaData["type"],
): number {
  let score = 60;
  const typeBonus = {
    emergency: 25,
    park: 15,
    residential: 10,
    commercial: 5,
    transit: 0,
    industrial: -10,
  };
  score += typeBonus[type];

  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 18) score += 15;
  else if (hour >= 19 && hour <= 22) score += 5;
  else score -= 10;

  const locationVariation = Math.abs((lat * lng * 1000) % 30) - 15;
  score += locationVariation;

  return Math.max(20, Math.min(95, Math.round(score)));
}

function getSafetyColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 70) return "#84cc16";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f59e0b";
  if (score >= 30) return "#ef4444";
  return "#dc2626";
}

function getAlertLevelColor(alertLevel: string): string {
  switch (alertLevel) {
    case "safe":
      return "text-green-600";
    case "caution":
      return "text-yellow-600";
    case "warning":
      return "text-orange-600";
    case "danger":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

function calculateOptimalBounds(
  points: google.maps.LatLngLiteral[],
): google.maps.LatLngLiteral[] {
  if (points.length < 3) return points;

  // Simplified convex hull
  const sorted = [...points].sort((a, b) => a.lat - b.lat || a.lng - b.lng);
  const hull: google.maps.LatLngLiteral[] = [];

  // Lower hull
  for (const point of sorted) {
    while (hull.length >= 2) {
      const cross =
        (hull[hull.length - 2].lat - hull[hull.length - 1].lat) *
          (point.lng - hull[hull.length - 1].lng) -
        (hull[hull.length - 2].lng - hull[hull.length - 1].lng) *
          (point.lat - hull[hull.length - 1].lat);
      if (cross <= 0) hull.pop();
      else break;
    }
    hull.push(point);
  }

  // Upper hull
  const t = hull.length + 1;
  for (let i = sorted.length - 2; i >= 0; i--) {
    const point = sorted[i];
    while (hull.length >= t) {
      const cross =
        (hull[hull.length - 2].lat - hull[hull.length - 1].lat) *
          (point.lng - hull[hull.length - 1].lng) -
        (hull[hull.length - 2].lng - hull[hull.length - 1].lng) *
          (point.lat - hull[hull.length - 1].lat);
      if (cross <= 0) hull.pop();
      else break;
    }
    hull.push(point);
  }

  hull.pop(); // Remove last point (duplicate)
  return hull.length >= 3 ? hull : points;
}

function determineGroupAlertLevel(
  levels: string[],
): "safe" | "caution" | "warning" | "danger" {
  if (levels.includes("danger")) return "danger";
  if (levels.includes("warning")) return "warning";
  if (levels.includes("caution")) return "caution";
  return "safe";
}

function determineTrending(
  trends: string[],
): "improving" | "stable" | "declining" {
  const improving = trends.filter((t) => t === "improving").length;
  const declining = trends.filter((t) => t === "declining").length;

  if (improving > declining) return "improving";
  if (declining > improving) return "declining";
  return "stable";
}

export default EnhancedSafetyAreas;
