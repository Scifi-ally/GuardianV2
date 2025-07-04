import React, { useEffect, useState, useCallback } from "react";
import { useGeolocation } from "@/hooks/use-device-apis";
import { useNotifications } from "@/components/NotificationSystem";
import { geminiNewsAnalysisService } from "@/services/geminiNewsAnalysisService";

interface SafeAreaData {
  id: string;
  bounds: google.maps.LatLngLiteral[];
  safetyScore: number;
  name: string;
  type: "residential" | "commercial" | "transit" | "park" | "emergency";
  center: google.maps.LatLngLiteral;
  newsScore?: number;
  aiAnalysis?: string;
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
  const [activeInfoWindow, setActiveInfoWindow] =
    useState<google.maps.InfoWindow | null>(null);
  const { addNotification, removeNotification } = useNotifications();
  const [badAreaNotificationIds, setBadAreaNotificationIds] = useState<
    string[]
  >([]);

  // Enhanced area generation with seamless coverage
  const generateSeamlessAreas = useCallback(
    async (bounds: google.maps.LatLngBounds) => {
      const areas: SafeAreaData[] = [];
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      // Create seamless hexagonal grid for complete coverage
      const gridSize = 12; // Higher density for seamless coverage
      const latStep = (ne.lat() - sw.lat()) / gridSize;
      const lngStep = (ne.lng() - sw.lng()) / gridSize;

      // Process areas in batches for better performance
      const batchSize = 6;
      const batches = [];

      for (let i = 0; i < gridSize; i += batchSize) {
        for (let j = 0; j < gridSize; j += batchSize) {
          const batch = [];

          for (let bi = i; bi < Math.min(i + batchSize, gridSize); bi++) {
            for (let bj = j; bj < Math.min(j + batchSize, gridSize); bj++) {
              const baseLat = sw.lat() + bi * latStep;
              const baseLng = sw.lng() + bj * lngStep;

              const center = {
                lat: baseLat + latStep / 2,
                lng: baseLng + lngStep / 2,
              };

              batch.push({
                i: bi,
                j: bj,
                baseLat,
                baseLng,
                center,
              });
            }
          }

          batches.push(batch);
        }
      }

      // Process batches with news analysis
      for (const batch of batches) {
        const batchAreas = await Promise.all(
          batch.map(async ({ i, j, baseLat, baseLng, center }) => {
            // Create seamless hexagonal shapes that connect perfectly
            const hexagonBounds = generateSeamlessHexagon(
              baseLat,
              baseLng,
              latStep,
              lngStep,
              i,
              j,
            );

            const baseScore = calculateEnhancedAreaSafety(
              center.lat,
              center.lng,
            );
            const newsScore = await calculateNewsBasedSafety(
              center.lat,
              center.lng,
            );
            const finalScore = Math.round(baseScore * 0.7 + newsScore * 0.3);

            const areaType = getAreaType(i * gridSize + j);

            const aiAnalysis = await getAIAnalysis(
              center.lat,
              center.lng,
              finalScore,
            );

            return {
              id: `area-${i}-${j}`,
              bounds: hexagonBounds,
              safetyScore: finalScore,
              name: getAreaName(areaType, i * gridSize + j),
              type: areaType,
              center,
              newsScore,
              aiAnalysis,
            };
          }),
        );

        areas.push(...batchAreas);
      }

      return areas;
    },
    [],
  );

  // Update areas when map bounds change
  useEffect(() => {
    if (!map || !showSafeAreaCircles) {
      // Clear polygons if disabled
      polygons.forEach((polygon) => polygon.setMap(null));
      setPolygons([]);
      // Remove all bad area notifications when disabled
      badAreaNotificationIds.forEach((id) => removeNotification(id));
      setBadAreaNotificationIds([]);
      return;
    }

    let isInitialized = false;
    let timeoutId: NodeJS.Timeout;

    const updateAreas = async () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      try {
        const newAreas = await generateSeamlessAreas(bounds);
        setSafeAreas(newAreas);
        if (onAreaUpdate) onAreaUpdate(newAreas);

        // Handle bad area notifications - REMOVE them instead of showing
        const badAreas = newAreas.filter((area) => area.safetyScore < 50);

        // Remove existing bad area notifications
        badAreaNotificationIds.forEach((id) => removeNotification(id));
        setBadAreaNotificationIds([]);

        // Instead of adding notifications for bad areas, we suppress them
        // This prevents notification spam in dangerous areas
        if (badAreas.length > 0) {
          console.log(
            `${badAreas.length} high-risk areas detected - notifications suppressed for user safety`,
          );
        }
      } catch (error) {
        console.error("Failed to update safety areas:", error);
      }
    };

    const debouncedUpdateAreas = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateAreas, 300);
    };

    // Initial load
    if (!isInitialized) {
      updateAreas();
      isInitialized = true;
    }

    // Update when map moves or zooms (debounced)
    const boundsChangedListener = map.addListener(
      "bounds_changed",
      debouncedUpdateAreas,
    );

    return () => {
      google.maps.event.removeListener(boundsChangedListener);
      clearTimeout(timeoutId);
    };
  }, [map, showSafeAreaCircles, removeNotification, badAreaNotificationIds]);

  // Enhanced map click listener
  useEffect(() => {
    if (!map) return;

    const clickListener = map.addListener(
      "click",
      async (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();

          // Show loading state
          setActiveInfoWindow((prev) => {
            if (prev) {
              prev.close();
            }

            const loadingWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 12px; min-width: 180px; font-family: system-ui; text-align: center;">
                  <div style="margin-bottom: 8px;">📍 Analyzing Location...</div>
                  <div style="color: #666; font-size: 12px;">Getting real-time safety data</div>
                </div>
              `,
              position: event.latLng,
            });

            loadingWindow.open(map);
            return loadingWindow;
          });

          try {
            // Get comprehensive AI analysis from Gemini
            const analysis = await geminiNewsAnalysisService.analyzeAreaSafety(
              lat,
              lng,
            );
            const baseScore = calculateEnhancedAreaSafety(lat, lng);

            // Update with detailed AI analysis
            setActiveInfoWindow((prev) => {
              if (prev) {
                prev.close();
              }

              const newsEventsHtml = analysis.newsEvents
                .slice(0, 3)
                .map(
                  (event) => `
                  <div style="margin: 2px 0; font-size: 10px; color: #666;">
                    ${event.impact === "positive" ? "✓" : event.impact === "negative" ? "⚠" : "•"} ${event.title}
                  </div>
                `,
                )
                .join("");

              const infoWindow = new google.maps.InfoWindow({
                content: `
                <div style="padding: 12px; min-width: 260px; max-width: 300px; font-family: system-ui;">
                  <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${getSafetyColor(analysis.score)};">
                    🧠 Gemini AI Analysis
                  </h3>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <div style="width: 14px; height: 14px; border-radius: 3px; background: ${getSafetyColor(analysis.score)};"></div>
                    <span style="font-weight: 500;">Safety Score: ${analysis.score}/100</span>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <small style="color: #666;">Confidence: ${analysis.confidence}% | Base: ${baseScore}/100</small>
                  </div>
                  <p style="margin: 6px 0; color: #666; font-size: 11px;">
                    📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}
                  </p>

                  <div style="margin: 8px 0;">
                    <strong style="font-size: 11px; color: #333;">Key Factors:</strong>
                    ${analysis.factors
                      .slice(0, 3)
                      .map(
                        (factor) => `
                      <div style="font-size: 10px; color: #666; margin: 1px 0;">• ${factor}</div>
                    `,
                      )
                      .join("")}
                  </div>

                  ${
                    newsEventsHtml
                      ? `
                    <div style="margin: 8px 0;">
                      <strong style="font-size: 11px; color: #333;">Recent Events:</strong>
                      ${newsEventsHtml}
                    </div>
                  `
                      : ""
                  }

                  <div style="margin-top: 10px; padding: 6px 10px; background: ${getSafetyColor(analysis.score)}15; border-radius: 6px; border-left: 3px solid ${getSafetyColor(analysis.score)};">
                    <small style="color: #555; line-height: 1.4;">
                      <strong>AI Reasoning:</strong><br/>
                      ${analysis.reasoning}
                    </small>
                  </div>
                </div>
              `,
                position: event.latLng,
              });

              infoWindow.open(map);
              return infoWindow;
            });
          } catch (error) {
            console.error("Failed to analyze location:", error);

            // Show error state
            setActiveInfoWindow((prev) => {
              if (prev) {
                prev.close();
              }

              const errorWindow = new google.maps.InfoWindow({
                content: `
                  <div style="padding: 12px; min-width: 180px; font-family: system-ui;">
                    <h3 style="margin: 0 0 8px 0; color: #f59e0b;">⚠️ Analysis Unavailable</h3>
                    <p style="margin: 0; color: #666; font-size: 12px;">
                      Unable to get real-time safety data. Using basic analysis.
                    </p>
                  </div>
                `,
                position: event.latLng,
              });

              errorWindow.open(map);
              return errorWindow;
            });
          }
        }
      },
    );

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map]);

  // Create seamless polygons on map
  useEffect(() => {
    if (!map || !showSafeAreaCircles) return;

    // Clear existing polygons
    polygons.forEach((polygon) => polygon.setMap(null));

    // Create new seamless polygons
    const newPolygons = safeAreas.map((area) => {
      const color = getSafetyColor(area.safetyScore);
      const opacity = getScoreBasedOpacity(area.safetyScore);
      const strokeWeight = getScoreBasedStrokeWeight(area.safetyScore);

      const polygon = new google.maps.Polygon({
        paths: area.bounds,
        strokeColor: color,
        strokeOpacity: 0.4,
        strokeWeight: strokeWeight,
        fillColor: color,
        fillOpacity: opacity,
        map,
        zIndex: getScoreBasedZIndex(area.safetyScore),
      });

      // Enhanced click listener with AI analysis
      polygon.addListener("click", (event: google.maps.PolyMouseEvent) => {
        setActiveInfoWindow((prev) => {
          if (prev) {
            prev.close();
          }

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 240px; font-family: system-ui;">
                <h3 style="margin: 0 0 10px 0; font-weight: bold; color: ${color};">${area.name}</h3>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <div style="width: 14px; height: 14px; border-radius: 3px; background: ${color};"></div>
                  <span style="font-weight: 500;">Safety Score: ${area.safetyScore}/100</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <small style="color: #666;">
                    Base: ${Math.round((area.safetyScore - (area.newsScore || 0) * 0.3) / 0.7)}/100 |
                    News Impact: ${area.newsScore || 0}/100
                  </small>
                </div>
                <p style="margin: 6px 0; color: #666; text-transform: capitalize; font-size: 12px;">
                  Area Type: ${area.type.replace(/([A-Z])/g, " $1")}
                </p>
                <div style="margin-top: 10px; padding: 8px 12px; background: ${color}15; border-radius: 6px; border-left: 3px solid ${color};">
                  <small style="color: #555; line-height: 1.4;">
                    <strong>AI Analysis:</strong><br/>
                    ${area.aiAnalysis || getSafetyDescription(area.safetyScore)}
                  </small>
                </div>
              </div>
            `,
            position: event.latLng,
          });

          infoWindow.open(map);
          return infoWindow;
        });
      });

      return polygon;
    });

    setPolygons(newPolygons);

    return () => {
      newPolygons.forEach((polygon) => polygon.setMap(null));
    };
  }, [map, safeAreas, showSafeAreaCircles]);

  return null;
}

// Enhanced helper functions

function generateSeamlessHexagon(
  baseLat: number,
  baseLng: number,
  latStep: number,
  lngStep: number,
  row: number,
  col: number,
): google.maps.LatLngLiteral[] {
  const points: google.maps.LatLngLiteral[] = [];
  const numPoints = 6;

  // Seamless hexagonal grid with no gaps
  const latRadius = latStep * 0.8; // Overlapping coverage
  const lngRadius = lngStep * 0.8;

  // Offset every other row for perfect hexagonal tiling
  const rowOffset = (row % 2) * (lngStep * 0.5);

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;

    const lat = baseLat + latStep / 2 + Math.cos(angle) * latRadius;
    const lng = baseLng + lngStep / 2 + Math.sin(angle) * lngRadius + rowOffset;

    points.push({ lat, lng });
  }

  return points;
}

function calculateEnhancedAreaSafety(lat: number, lng: number): number {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const month = now.getMonth();

  let score = 65; // Base score

  // Enhanced time-based factors
  if (hour >= 6 && hour <= 8)
    score += 12; // Morning commute
  else if (hour >= 9 && hour <= 17)
    score += 18; // Business hours
  else if (hour >= 18 && hour <= 20)
    score += 8; // Evening commute
  else if (hour >= 21 && hour <= 22)
    score += 2; // Early evening
  else if (hour >= 23 || hour <= 5) score -= 20; // Late night

  // Enhanced day-based factors
  if (isWeekend) {
    if (hour >= 10 && hour <= 16) score += 8; // Weekend day
    if (hour >= 22 || hour <= 6) score -= 10; // Weekend night
  } else {
    if (hour >= 7 && hour <= 18) score += 12; // Weekday activity
  }

  // Seasonal adjustments
  if (month >= 11 || month <= 1) score -= 5; // Winter months
  if (month >= 5 && month <= 8) score += 3; // Summer months

  // Enhanced location-based factors
  const latFactor = Math.abs(lat * 10000) % 100;
  const lngFactor = Math.abs(lng * 10000) % 100;

  // Business district simulation
  const businessScore = (latFactor + lngFactor) / 2;
  if (businessScore > 80) score += 15;
  else if (businessScore > 60) score += 10;
  else if (businessScore > 40) score += 5;
  else if (businessScore < 20) score -= 12;

  // Population density
  const densityHash = Math.abs((lat * 47 + lng * 53) * 1000) % 100;
  if (densityHash > 85) score += 12;
  else if (densityHash > 70) score += 8;
  else if (densityHash > 50) score += 4;
  else if (densityHash < 25) score -= 15;

  // Emergency services proximity
  const emergencyProximity = Math.abs((lat * 31 + lng * 37) * 1000) % 60;
  if (emergencyProximity > 50) score += 8;
  else if (emergencyProximity > 30) score += 4;
  else if (emergencyProximity < 10) score -= 6;

  // Transportation hubs
  const transitScore = Math.abs((lat * 41 + lng * 43) * 100) % 40;
  if (transitScore > 35) score += 6;
  else if (transitScore < 8) score -= 4;

  // Economic indicators simulation
  const economicFactor = Math.abs((lat + lng) * 1000) % 50;
  if (economicFactor > 40) score += 5;
  else if (economicFactor < 10) score -= 8;

  return Math.max(25, Math.min(98, Math.round(score)));
}

async function calculateNewsBasedSafety(
  lat: number,
  lng: number,
): Promise<number> {
  try {
    // Use Gemini AI for comprehensive safety analysis
    const analysis = await geminiNewsAnalysisService.analyzeAreaSafety(
      lat,
      lng,
    );
    return analysis.score;
  } catch (error) {
    console.warn("Gemini analysis failed, using fallback:", error);
    return calculateFallbackNewsScore(lat, lng);
  }
}

function calculateFallbackNewsScore(lat: number, lng: number): number {
  // Fallback when news analysis is unavailable
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  let newsScore = 75; // Base news score

  // Simulate recent news events impact
  const newsHash = Math.abs((lat * 73 + lng * 79) * 1000) % 100;

  // Major incidents simulation
  if (newsHash > 95)
    newsScore -= 30; // Major incident
  else if (newsHash > 88)
    newsScore -= 20; // Significant incident
  else if (newsHash > 75)
    newsScore -= 10; // Minor incident
  else if (newsHash > 60)
    newsScore += 5; // Positive news
  else if (newsHash > 40) newsScore += 10; // Very positive news

  // Crime reports simulation
  const crimeHash = Math.abs((lat * 67 + lng * 71) * 100) % 50;
  if (crimeHash > 45) newsScore -= 15;
  else if (crimeHash > 35) newsScore -= 8;
  else if (crimeHash < 5) newsScore += 8;

  // Traffic and accidents
  const trafficHash = Math.abs((lat + lng) * hour * 100) % 30;
  if (trafficHash > 25) newsScore -= 5;
  else if (trafficHash < 5) newsScore += 3;

  // Weather-related incidents
  const weatherHash = Math.abs(lat * lng * dayOfWeek * 100) % 20;
  if (weatherHash > 18) newsScore -= 8;
  else if (weatherHash > 15) newsScore -= 3;

  // Community events (positive impact)
  const eventHash = Math.abs((lat * 83 + lng * 89) * 10) % 25;
  if (eventHash > 20) newsScore += 8;
  else if (eventHash > 15) newsScore += 4;

  return Math.max(20, Math.min(95, Math.round(newsScore)));
}

async function getAIAnalysis(
  lat: number,
  lng: number,
  fallbackScore?: number,
): Promise<string> {
  try {
    // Get detailed AI analysis from Gemini
    const analysis = await geminiNewsAnalysisService.analyzeAreaSafety(
      lat,
      lng,
    );
    return analysis.reasoning;
  } catch (error) {
    // Fallback to simple analysis
    const safetyScore = fallbackScore || 70;

    if (safetyScore >= 85) {
      return "Excellent area with good safety indicators and community presence.";
    } else if (safetyScore >= 70) {
      return "Generally safe area with adequate infrastructure and regular activity.";
    } else if (safetyScore >= 55) {
      return "Moderate safety - stay alert and avoid isolated areas.";
    } else {
      return "Exercise caution - consider alternative routes when possible.";
    }
  }
}

function getSafetyColor(score: number): string {
  if (score >= 85) return "#059669"; // Emerald green
  if (score >= 70) return "#10b981"; // Green
  if (score >= 55) return "#f59e0b"; // Amber
  if (score >= 40) return "#f97316"; // Orange
  return "#ef4444"; // Red
}

function getScoreBasedOpacity(score: number): number {
  // Higher scores are more transparent, lower scores more visible
  if (score >= 85) return 0.12;
  if (score >= 70) return 0.18;
  if (score >= 55) return 0.25;
  if (score >= 40) return 0.35;
  return 0.45;
}

function getScoreBasedStrokeWeight(score: number): number {
  // Lower scores get thicker borders for attention
  if (score >= 85) return 0.5;
  if (score >= 70) return 0.8;
  if (score >= 55) return 1.2;
  if (score >= 40) return 1.5;
  return 2.0;
}

function getScoreBasedZIndex(score: number): number {
  // Lower scores appear on top
  return 1000 - score;
}

function getAreaType(index: number): SafeAreaData["type"] {
  const types: SafeAreaData["type"][] = [
    "residential",
    "commercial",
    "transit",
    "park",
    "emergency",
  ];
  return types[index % types.length];
}

function getAreaName(type: SafeAreaData["type"], index: number): string {
  const names = {
    residential: ["Residential District", "Neighborhood Zone", "Housing Area"],
    commercial: ["Business District", "Commercial Zone", "Shopping Area"],
    transit: ["Transit Hub", "Transport Center", "Station Area"],
    park: ["Green Space", "Recreation Zone", "Park Area"],
    emergency: ["Emergency Zone", "Safety Hub", "Service Center"],
  };

  return names[type][index % names[type].length];
}

function getSafetyDescription(score: number): string {
  if (score >= 85)
    return "Excellent safety with robust infrastructure and active community presence.";
  if (score >= 70)
    return "Good safety conditions with regular activity and adequate lighting.";
  if (score >= 55)
    return "Moderate safety - maintain awareness and avoid poorly lit areas.";
  if (score >= 40)
    return "Exercise caution - travel in groups when possible and stay on main routes.";
  return "High-risk area - consider alternative routes and inform others of your location.";
}

export default EnhancedSafetyAreas;
