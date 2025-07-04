import React, { useEffect, useState, useCallback } from "react";
import { useGeolocation } from "@/hooks/use-device-apis";

interface SafeAreaData {
  id: string;
  bounds: google.maps.LatLngLiteral[];
  safetyScore: number;
  name: string;
  type: "residential" | "commercial" | "transit" | "park" | "emergency";
  center: google.maps.LatLngLiteral;
}

interface IrregularSafetyAreasProps {
  map: google.maps.Map | null;
  userLocation?: { latitude: number; longitude: number };
  showSafeAreaCircles: boolean;
  onAreaUpdate?: (areas: SafeAreaData[]) => void;
}

export function IrregularSafetyAreas({
  map,
  userLocation,
  showSafeAreaCircles,
  onAreaUpdate,
}: IrregularSafetyAreasProps) {
  const [safeAreas, setSafeAreas] = useState<SafeAreaData[]>([]);
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [activeInfoWindow, setActiveInfoWindow] =
    useState<google.maps.InfoWindow | null>(null);

  // Generate irregular polygons for visible map area
  const generateAreasForBounds = useCallback(
    (bounds: google.maps.LatLngBounds) => {
      const areas: SafeAreaData[] = [];
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      // Create grid of areas with minimal overlap
      const gridSize = 8; // 8x8 grid for better coverage
      const latStep = (ne.lat() - sw.lat()) / gridSize;
      const lngStep = (ne.lng() - sw.lng()) / gridSize;

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const baseLat = sw.lat() + i * latStep;
          const baseLng = sw.lng() + j * lngStep;

          // Create more regular polygon shape
          const polygonBounds = generateRegularPolygon(
            baseLat,
            baseLng,
            latStep,
            lngStep,
          );

          const center = {
            lat: baseLat + latStep / 2,
            lng: baseLng + lngStep / 2,
          };

          const safetyScore = calculateAreaSafety(center.lat, center.lng);
          const areaType = getAreaType(i * gridSize + j);

          areas.push({
            id: `area-${i}-${j}`,
            bounds: polygonBounds,
            safetyScore,
            name: getAreaName(areaType, i * gridSize + j),
            type: areaType,
            center,
          });
        }
      }

      return areas;
    },
    [], // Empty dependency array since this function doesn't depend on props/state
  );

  // Update areas when map bounds change
  useEffect(() => {
    if (!map || !showSafeAreaCircles) {
      // Clear polygons if disabled
      polygons.forEach((polygon) => polygon.setMap(null));
      setPolygons([]);
      return;
    }

    let isInitialized = false;
    let timeoutId: NodeJS.Timeout;

    const updateAreas = () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      const newAreas = generateAreasForBounds(bounds);
      setSafeAreas(newAreas);
      if (onAreaUpdate) onAreaUpdate(newAreas);
    };

    const debouncedUpdateAreas = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateAreas, 500); // Longer debounce
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
  }, [map, showSafeAreaCircles]); // Removed generateAreasForBounds and onAreaUpdate from deps

  // Add map click listener for safety scoring
  useEffect(() => {
    if (!map) return;

    const clickListener = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          const safetyScore = calculateAreaSafety(lat, lng);

          // Close previous info window
          setActiveInfoWindow((prev) => {
            if (prev) {
              prev.close();
            }

            // Create new info window
            const infoWindow = new google.maps.InfoWindow({
              content: `
              <div style="padding: 8px; min-width: 180px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${getSafetyColor(safetyScore)};">
                  Location Safety Check
                </h3>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <div style="width: 12px; height: 12px; border-radius: 2px; background: ${getSafetyColor(safetyScore)};"></div>
                  <span style="font-weight: 500;">Safety Score: ${safetyScore}/100</span>
                </div>
                <p style="margin: 4px 0; color: #666; font-size: 12px;">
                  Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </p>
                <div style="margin-top: 8px; padding: 4px 8px; background: ${getSafetyColor(safetyScore)}20; border-radius: 4px;">
                  <small style="color: #666;">
                    ${getSafetyDescription(safetyScore)}
                  </small>
                </div>
              </div>
            `,
              position: event.latLng,
            });

            infoWindow.open(map);
            return infoWindow;
          });
        }
      },
    );

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map]); // Removed activeInfoWindow from deps to prevent loop

  // Create polygons on map
  useEffect(() => {
    if (!map || !showSafeAreaCircles) return;

    // Clear existing polygons
    polygons.forEach((polygon) => polygon.setMap(null));

    // Create new polygons
    const newPolygons = safeAreas.map((area) => {
      const color = getSafetyColor(area.safetyScore);
      const opacity = getOpacityFromScore(area.safetyScore);

      const polygon = new google.maps.Polygon({
        paths: area.bounds,
        strokeColor: color,
        strokeOpacity: 0.3,
        strokeWeight: 0.5,
        fillColor: color,
        fillOpacity: opacity,
        map,
        zIndex: 1,
      });

      // Add click listener for area info with single window management
      polygon.addListener("click", (event: google.maps.PolyMouseEvent) => {
        setActiveInfoWindow((prev) => {
          // Close previous info window
          if (prev) {
            prev.close();
          }

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${color};">${area.name}</h3>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <div style="width: 12px; height: 12px; border-radius: 2px; background: ${color};"></div>
                  <span style="font-weight: 500;">Safety Score: ${Math.round(area.safetyScore)}/100</span>
                </div>
                <p style="margin: 4px 0; color: #666; text-transform: capitalize;">
                  Type: ${area.type.replace(/([A-Z])/g, " $1")}
                </p>
                <div style="margin-top: 8px; padding: 4px 8px; background: ${color}20; border-radius: 4px;">
                  <small style="color: #666;">
                    ${getSafetyDescription(area.safetyScore)}
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

  return null; // This component doesn't render anything directly
}

// Helper functions
function generateRegularPolygon(
  baseLat: number,
  baseLng: number,
  latStep: number,
  lngStep: number,
): google.maps.LatLngLiteral[] {
  const points: google.maps.LatLngLiteral[] = [];
  const numPoints = 6; // Regular hexagon

  // Make shapes appropriate size without excessive overlap
  const latRadius = latStep * 0.6; // Smaller radius for less overlap
  const lngRadius = lngStep * 0.6;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    // Add slight variation to make it less perfectly regular but not chaotic
    const radiusVariation = 0.9 + Math.random() * 0.2; // 0.9-1.1 slight variation

    const lat =
      baseLat + latStep / 2 + Math.cos(angle) * latRadius * radiusVariation;
    const lng =
      baseLng + lngStep / 2 + Math.sin(angle) * lngRadius * radiusVariation;

    points.push({ lat, lng });
  }

  return points;
}

function calculateAreaSafety(lat: number, lng: number): number {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let score = 65; // Base score

  // Real-time time-based adjustments
  if (hour >= 7 && hour <= 19) {
    score += 15; // Daytime safety boost
  } else if (hour >= 20 && hour <= 22) {
    score += 5; // Early evening
  } else if (hour >= 23 || hour <= 6) {
    score -= 15; // Late night/early morning penalty
  }

  // Weekend vs weekday adjustments
  if (isWeekend) {
    if (hour >= 10 && hour <= 16) score += 5; // Weekend day activity
    if (hour >= 22 || hour <= 6) score -= 5; // Weekend night less safe
  } else {
    if (hour >= 9 && hour <= 17) score += 8; // Business hours safety
  }

  // Real location-based factors (simulate real APIs)
  const latFactor = Math.abs(lat * 10000) % 100;
  const lngFactor = Math.abs(lng * 10000) % 100;

  // Simulate proximity to business districts (higher coordinates = business area)
  const businessArea = (latFactor + lngFactor) / 2;
  if (businessArea > 70)
    score += 12; // Business district
  else if (businessArea > 50)
    score += 6; // Commercial area
  else if (businessArea < 20) score -= 8; // Remote area

  // Simulate population density based on coordinate clustering
  const densityHash = Math.abs((lat * 37 + lng * 41) * 1000) % 100;
  if (densityHash > 80)
    score += 8; // High density = safer
  else if (densityHash < 30) score -= 10; // Low density = less safe

  // Simulate proximity to emergency services
  const emergencyProximity = Math.abs((lat * 23 + lng * 29) * 1000) % 50;
  if (emergencyProximity > 40) score += 5;
  else if (emergencyProximity < 10) score -= 3;

  // Weather impact (simulate API data)
  const weatherSim = Math.abs((lat + lng) * hour) % 10;
  if (weatherSim > 7) score -= 3; // Bad weather simulation

  // Traffic/activity level based on real-time factors
  const activityLevel = Math.abs(lat * lng * hour * 100) % 40;
  if (activityLevel > 30)
    score += 4; // High activity = safer
  else if (activityLevel < 10) score -= 6; // Low activity = less safe

  // Minor random variation for realism
  score += (Math.random() - 0.5) * 5;

  return Math.max(25, Math.min(95, Math.round(score)));
}

function getSafetyColor(score: number): string {
  if (score >= 75) return "#10b981"; // Green
  if (score >= 60) return "#f59e0b"; // Yellow
  if (score >= 45) return "#f97316"; // Orange
  return "#ef4444"; // Red
}

function getOpacityFromScore(score: number): number {
  if (score >= 75) return 0.15;
  if (score >= 60) return 0.2;
  if (score >= 45) return 0.25;
  return 0.3;
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
    residential: ["Residential Area", "Neighborhood", "Housing District"],
    commercial: ["Business District", "Shopping Area", "Commercial Zone"],
    transit: ["Transit Hub", "Transport Station", "Bus Stop Area"],
    park: ["Park Area", "Green Space", "Recreation Zone"],
    emergency: ["Emergency Zone", "Service Area", "Safety Hub"],
  };

  return names[type][index % names[type].length];
}

function getSafetyDescription(score: number): string {
  if (score >= 80)
    return "Very safe area with good lighting and regular activity";
  if (score >= 70) return "Generally safe with moderate foot traffic";
  if (score >= 60)
    return "Moderately safe - stay alert and avoid isolated spots";
  if (score >= 50)
    return "Use caution - consider alternative routes if possible";
  return "Higher risk area - travel with others when possible";
}

export default IrregularSafetyAreas;
