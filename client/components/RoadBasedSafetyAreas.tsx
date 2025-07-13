import React, { useEffect, useState, useCallback } from "react";
import { unifiedNotifications } from "@/services/unifiedNotificationService";
import { geminiNewsAnalysisService } from "@/services/geminiNewsAnalysisService";

interface RoadPoint {
  id: string;
  lat: number;
  lng: number;
  roadName: string;
  roadType: "highway" | "arterial" | "collector" | "local";
  trafficLevel: number; // 0-100
}

interface SafetyArea {
  id: string;
  bounds: google.maps.LatLngLiteral[];
  safetyScore: number;
  roadPoint: RoadPoint;
  shape: "circle" | "square" | "hexagon" | "star" | "diamond";
  size: number; // Based on safety score
  color: string;
  realTimeData: {
    timestamp: number;
    trafficDensity: number;
    incidentCount: number;
    emergencyResponseTime: number;
    weatherCondition: string;
  };
}

interface RoadBasedSafetyAreasProps {
  map: google.maps.Map | null;
  userLocation?: { latitude: number; longitude: number };
  showSafeAreaCircles: boolean;
  onAreaUpdate?: (areas: SafetyArea[]) => void;
}

export function RoadBasedSafetyAreas({
  map,
  userLocation,
  showSafeAreaCircles,
  onAreaUpdate,
}: RoadBasedSafetyAreasProps) {
  const [safetyAreas, setSafetyAreas] = useState<SafetyArea[]>([]);
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [roadPoints, setRoadPoints] = useState<RoadPoint[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Rate limiting for Gemini API
  const [apiCallQueue, setApiCallQueue] = useState<Array<() => Promise<any>>>(
    [],
  );
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Real-time data fetching with road-based approach
  const fetchRoadPoints = useCallback(
    async (bounds: google.maps.LatLngBounds) => {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      // Use Google Roads API or simulate road detection
      const roadPoints = await detectNearbyRoads(
        { lat: ne.lat(), lng: ne.lng() },
        { lat: sw.lat(), lng: sw.lng() },
      );
      setRoadPoints(roadPoints);
      return roadPoints;
    },
    [],
  );

  // Process API calls with rate limiting (max 10 per minute for free tier)
  const processApiQueue = useCallback(async () => {
    if (isProcessingQueue || apiCallQueue.length === 0) return;

    setIsProcessingQueue(true);
    const batchSize = 3; // Process 3 at a time
    const delay = 12000; // 12 seconds between batches (5 batches per minute)

    try {
      for (let i = 0; i < apiCallQueue.length; i += batchSize) {
        const batch = apiCallQueue.slice(i, i + batchSize);

        // Process batch in parallel
        await Promise.allSettled(batch.map((call) => call()));

        // Wait before next batch (except for last batch)
        if (i + batchSize < apiCallQueue.length) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.warn("API queue processing error:", error);
    } finally {
      setApiCallQueue([]);
      setIsProcessingQueue(false);
    }
  }, [apiCallQueue, isProcessingQueue]);

  // Generate dynamic safety areas based on road points
  const generateRoadBasedAreas = useCallback(
    async (points: RoadPoint[]) => {
      const areas: SafetyArea[] = [];
      const now = Date.now();

      // Create Voronoi-like tessellation for seamless coverage
      const tessellation = createVoronoiTessellation(points);

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const cell = tessellation[i];

        // Queue AI analysis with rate limiting
        const analysisPromise = new Promise<number>((resolve) => {
          const apiCall = async () => {
            try {
              const analysis =
                await geminiNewsAnalysisService.analyzeAreaSafety(
                  point.lat,
                  point.lng,
                );
              resolve(analysis.score);
            } catch (error) {
              console.warn(`Analysis failed for ${point.id}, using fallback`);
              resolve(calculateFallbackSafety(point));
            }
          };

          setApiCallQueue((prev) => [...prev, apiCall]);
        });

        // Get real-time data for this road point
        const realTimeData = await fetchRealTimeData(point);

        // Calculate base safety score
        const baseScore = calculateRoadSafety(point, realTimeData);

        // Get shape and size based on safety score
        const shape = getShapeFromScore(baseScore);
        const size = getSizeFromScore(baseScore);
        const bounds = generateDynamicShape(
          point.lat,
          point.lng,
          shape,
          size,
          cell,
        );

        areas.push({
          id: point.id,
          bounds,
          safetyScore: baseScore,
          roadPoint: point,
          shape,
          size,
          color: getSafetyColor(baseScore),
          realTimeData,
        });
      }

      // Process AI analysis queue
      processApiQueue();

      return areas;
    },
    [processApiQueue],
  );

  // Update areas when map bounds change
  useEffect(() => {
    if (!map || !showSafeAreaCircles) {
      polygons.forEach((polygon) => polygon.setMap(null));
      setPolygons([]);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const updateAreas = async () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      try {
        const points = await fetchRoadPoints(bounds);
        const newAreas = await generateRoadBasedAreas(points);

        setSafetyAreas(newAreas);
        setLastUpdate(Date.now());

        if (onAreaUpdate) onAreaUpdate(newAreas);

        console.log(
          `Updated ${newAreas.length} road-based safety areas with real-time data`,
        );
      } catch (error) {
        console.error("Failed to update road-based areas:", error);
      }
    };

    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateAreas, 500);
    };

    // Initial load
    updateAreas();

    // Update on map changes
    const boundsListener = map.addListener("bounds_changed", debouncedUpdate);

    // Real-time updates every 30 seconds
    const realTimeInterval = setInterval(() => {
      if (Date.now() - lastUpdate > 30000) {
        // Only if no recent updates
        updateAreas();
      }
    }, 30000);

    return () => {
      google.maps.event.removeListener(boundsListener);
      clearInterval(realTimeInterval);
      clearTimeout(timeoutId);
    };
  }, [
    map,
    showSafeAreaCircles,
    fetchRoadPoints,
    generateRoadBasedAreas,
    lastUpdate,
  ]);

  // Render dynamic polygons
  useEffect(() => {
    if (!map || !showSafeAreaCircles) return;

    // Clear existing polygons
    polygons.forEach((polygon) => polygon.setMap(null));

    // Create new dynamic polygons
    const newPolygons = safetyAreas.map((area) => {
      const opacity = getOpacityFromScore(area.safetyScore);
      const strokeWeight = getStrokeWeightFromScore(area.safetyScore);

      const polygon = new google.maps.Polygon({
        paths: area.bounds,
        strokeColor: area.color,
        strokeOpacity: 0.6,
        strokeWeight,
        fillColor: area.color,
        fillOpacity: opacity,
        map,
        zIndex: getZIndexFromScore(area.safetyScore),
      });

      // Enhanced click listener with real-time data
      polygon.addListener("click", (event: google.maps.PolyMouseEvent) => {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; min-width: 280px; font-family: system-ui;">
              <h3 style="margin: 0 0 8px 0; color: ${area.color};">
                🛣️ ${area.roadPoint.roadName}
              </h3>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div style="width: 16px; height: 16px; background: ${area.color}; clip-path: ${getShapeClipPath(area.shape)};"></div>
                <span style="font-weight: 500;">Safety Score: ${area.safetyScore}/100</span>
              </div>

              <div style="margin: 8px 0;">
                <strong style="font-size: 11px;">Real-Time Data:</strong>
                <div style="font-size: 10px; color: #666; margin: 2px 0;">
                  🚗 Traffic: ${area.realTimeData.trafficDensity}% |
                  ⚠️ Incidents: ${area.realTimeData.incidentCount} |
                  🚑 Response: ${area.realTimeData.emergencyResponseTime}min
                </div>
                <div style="font-size: 10px; color: #666;">
                  🌤️ Weather: ${area.realTimeData.weatherCondition} |
                  📍 Road Type: ${area.roadPoint.roadType}
                </div>
              </div>

              <div style="margin-top: 8px; padding: 6px 8px; background: ${area.color}20; border-radius: 4px;">
                <small style="color: #555;">
                  <strong>Area Shape:</strong> ${area.shape.toUpperCase()} (score-based)<br/>
                  <strong>Last Updated:</strong> ${new Date(area.realTimeData.timestamp).toLocaleTimeString()}
                </small>
              </div>
            </div>
          `,
          position: event.latLng,
        });

        infoWindow.open(map);
      });

      return polygon;
    });

    setPolygons(newPolygons);

    return () => {
      newPolygons.forEach((polygon) => polygon.setMap(null));
    };
  }, [map, safetyAreas, showSafeAreaCircles]);

  return null;
}

// Helper functions

async function detectNearbyRoads(
  ne: google.maps.LatLngLiteral,
  sw: google.maps.LatLngLiteral,
): Promise<RoadPoint[]> {
  // In production, use Google Roads API or OpenStreetMap
  // For now, simulate road detection based on coordinate patterns

  const roads: RoadPoint[] = [];
  const gridSize = 15; // Higher density for road-based approach
  const latStep = (ne.lat - sw.lat) / gridSize;
  const lngStep = (ne.lng - sw.lng) / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = sw.lat + i * latStep + (Math.random() - 0.5) * latStep * 0.3;
      const lng = sw.lng + j * lngStep + (Math.random() - 0.5) * lngStep * 0.3;

      // Simulate road detection algorithm
      const roadHash = Math.abs((lat * 1000 + lng * 1000) * 789) % 100;

      if (roadHash > 30) {
        // 70% chance of road
        const roadType = getRoadType(roadHash);
        const trafficLevel = Math.floor(Math.abs(lat * lng * 1000) % 100);

        roads.push({
          id: `road-${i}-${j}`,
          lat,
          lng,
          roadName: generateRoadName(roadType, i, j),
          roadType,
          trafficLevel,
        });
      }
    }
  }

  return roads;
}

function createVoronoiTessellation(
  points: RoadPoint[],
): google.maps.LatLngLiteral[][] {
  // Simplified Voronoi tessellation for seamless coverage
  return points.map((point, index) => {
    const neighbors = findNearestNeighbors(point, points, 6);
    return createCellBounds(point, neighbors);
  });
}

function findNearestNeighbors(
  point: RoadPoint,
  allPoints: RoadPoint[],
  count: number,
): RoadPoint[] {
  return allPoints
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
    .slice(0, count);
}

function createCellBounds(
  center: RoadPoint,
  neighbors: RoadPoint[],
): google.maps.LatLngLiteral[] {
  // Create polygon bounds that don't overlap with neighbors
  const bounds: google.maps.LatLngLiteral[] = [];
  const radius = 0.002; // Base radius

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * 2 * Math.PI;
    let distance = radius;

    // Adjust distance based on nearest neighbor in this direction
    for (const neighbor of neighbors) {
      const neighborAngle = Math.atan2(
        neighbor.lat - center.lat,
        neighbor.lng - center.lng,
      );
      const angleDiff = Math.abs(angle - neighborAngle);

      if (angleDiff < Math.PI / 4) {
        // Within 45 degrees
        const neighborDistance = Math.sqrt(
          (neighbor.lat - center.lat) ** 2 + (neighbor.lng - center.lng) ** 2,
        );
        distance = Math.min(distance, neighborDistance * 0.45); // Halfway to neighbor
      }
    }

    bounds.push({
      lat: center.lat + Math.sin(angle) * distance,
      lng: center.lng + Math.cos(angle) * distance,
    });
  }

  return bounds;
}

async function fetchRealTimeData(point: RoadPoint) {
  // Simulate real-time data fetching
  // In production, integrate with traffic APIs, weather APIs, incident APIs

  const now = Date.now();
  const hour = new Date().getHours();

  return {
    timestamp: now,
    trafficDensity: Math.floor(
      Math.abs(point.lat * point.lng * hour * 100) % 100,
    ),
    incidentCount: Math.floor(Math.abs(point.lat * 1000) % 5),
    emergencyResponseTime: 3 + Math.floor(Math.abs(point.lng * 100) % 12),
    weatherCondition: getWeatherCondition(point.lat, point.lng),
  };
}

function calculateRoadSafety(point: RoadPoint, realTimeData: any): number {
  let score = 70; // Base score

  // Road type factor
  const roadTypeBonus = {
    highway: -5, // Highways can be more dangerous
    arterial: 0,
    collector: 5,
    local: 10, // Local roads are often safer
  };
  score += roadTypeBonus[point.roadType];

  // Traffic level impact
  if (point.trafficLevel > 80)
    score -= 10; // Heavy traffic
  else if (point.trafficLevel > 60) score -= 5;
  else if (point.trafficLevel < 20) score -= 8; // Too little traffic

  // Real-time incident impact
  score -= realTimeData.incidentCount * 5;

  // Emergency response time
  if (realTimeData.emergencyResponseTime > 10) score -= 8;
  else if (realTimeData.emergencyResponseTime < 5) score += 5;

  // Weather impact
  if (realTimeData.weatherCondition.includes("Rain")) score -= 5;
  if (realTimeData.weatherCondition.includes("Snow")) score -= 10;
  if (realTimeData.weatherCondition.includes("Clear")) score += 3;

  // Time of day
  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 18) score += 10;
  else if (hour >= 22 || hour <= 5) score -= 15;

  return Math.max(20, Math.min(95, Math.round(score)));
}

function calculateFallbackSafety(point: RoadPoint): number {
  // Fallback when AI analysis fails
  const baseScore = calculateRoadSafety(point, {
    timestamp: Date.now(),
    trafficDensity: point.trafficLevel,
    incidentCount: 1,
    emergencyResponseTime: 8,
    weatherCondition: "Clear",
  });

  return baseScore;
}

function getShapeFromScore(score: number): SafetyArea["shape"] {
  if (score >= 85) return "star"; // Excellent areas get star shape
  if (score >= 70) return "hexagon"; // Good areas get hexagon
  if (score >= 55) return "circle"; // Moderate areas get circle
  if (score >= 40) return "square"; // Caution areas get square
  return "diamond"; // High risk areas get diamond (attention-grabbing)
}

function getSizeFromScore(score: number): number {
  // Size inversely related to safety - dangerous areas are more prominent
  if (score >= 85) return 0.8; // Smallest for safest
  if (score >= 70) return 1.0;
  if (score >= 55) return 1.2;
  if (score >= 40) return 1.4;
  return 1.6; // Largest for most dangerous
}

function generateDynamicShape(
  lat: number,
  lng: number,
  shape: SafetyArea["shape"],
  size: number,
  cellBounds: google.maps.LatLngLiteral[],
): google.maps.LatLngLiteral[] {
  // Use cell bounds but modify based on shape
  const center = { lat, lng };
  const scaledBounds = cellBounds.map((point) => ({
    lat: center.lat + (point.lat - center.lat) * size,
    lng: center.lng + (point.lng - center.lng) * size,
  }));

  // Apply shape transformation
  switch (shape) {
    case "star":
      return createStarShape(center, scaledBounds);
    case "square":
      return createSquareShape(center, scaledBounds);
    case "diamond":
      return createDiamondShape(center, scaledBounds);
    default:
      return scaledBounds; // Circle/hexagon use cell bounds
  }
}

function createStarShape(
  center: google.maps.LatLngLiteral,
  bounds: google.maps.LatLngLiteral[],
): google.maps.LatLngLiteral[] {
  const points: google.maps.LatLngLiteral[] = [];
  const numPoints = 10; // 5-pointed star = 10 points

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const radius = i % 2 === 0 ? 0.001 : 0.0005; // Alternating radius for star points

    points.push({
      lat: center.lat + Math.sin(angle) * radius,
      lng: center.lng + Math.cos(angle) * radius,
    });
  }

  return points;
}

function createSquareShape(
  center: google.maps.LatLngLiteral,
  bounds: google.maps.LatLngLiteral[],
): google.maps.LatLngLiteral[] {
  const size = 0.0008;
  return [
    { lat: center.lat - size, lng: center.lng - size },
    { lat: center.lat - size, lng: center.lng + size },
    { lat: center.lat + size, lng: center.lng + size },
    { lat: center.lat + size, lng: center.lng - size },
  ];
}

function createDiamondShape(
  center: google.maps.LatLngLiteral,
  bounds: google.maps.LatLngLiteral[],
): google.maps.LatLngLiteral[] {
  const size = 0.001;
  return [
    { lat: center.lat, lng: center.lng - size }, // Left
    { lat: center.lat - size, lng: center.lng }, // Top
    { lat: center.lat, lng: center.lng + size }, // Right
    { lat: center.lat + size, lng: center.lng }, // Bottom
  ];
}

function getSafetyColor(score: number): string {
  if (score >= 85) return "#10b981"; // Emerald - excellent
  if (score >= 70) return "#22c55e"; // Green - good
  if (score >= 55) return "#f59e0b"; // Amber - moderate
  if (score >= 40) return "#f97316"; // Orange - caution
  return "#ef4444"; // Red - high risk
}

function getOpacityFromScore(score: number): number {
  // Dangerous areas are more opaque (visible)
  if (score >= 85) return 0.15;
  if (score >= 70) return 0.2;
  if (score >= 55) return 0.25;
  if (score >= 40) return 0.35;
  return 0.45;
}

function getStrokeWeightFromScore(score: number): number {
  // Dangerous areas have thicker borders
  if (score >= 85) return 1;
  if (score >= 70) return 1.5;
  if (score >= 55) return 2;
  if (score >= 40) return 2.5;
  return 3;
}

function getZIndexFromScore(score: number): number {
  // Dangerous areas appear on top
  return 1000 - score;
}

function getShapeClipPath(shape: SafetyArea["shape"]): string {
  const paths = {
    circle: "circle(50%)",
    square: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    hexagon: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
    diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  };
  return paths[shape];
}

function getRoadType(hash: number): RoadPoint["roadType"] {
  if (hash > 90) return "highway";
  if (hash > 70) return "arterial";
  if (hash > 50) return "collector";
  return "local";
}

function generateRoadName(
  type: RoadPoint["roadType"],
  i: number,
  j: number,
): string {
  const names = {
    highway: [
      `Interstate ${i + j}`,
      `Highway ${(i * j) % 100}`,
      `Freeway ${i}`,
    ],
    arterial: [`Main St`, `Central Ave`, `Broadway`, `First St`],
    collector: [`Oak Ave`, `Park Rd`, `Hill St`, `River Dr`],
    local: [`Elm St`, `Pine Ave`, `Cedar Ln`, `Maple Dr`],
  };

  const nameList = names[type];
  return nameList[(i + j) % nameList.length];
}

function getWeatherCondition(lat: number, lng: number): string {
  const conditions = [
    "Clear",
    "Cloudy",
    "Light Rain",
    "Heavy Rain",
    "Snow",
    "Fog",
  ];
  const hash = Math.abs((lat + lng) * 1000) % conditions.length;
  return conditions[hash];
}

export default RoadBasedSafetyAreas;
