import React, { useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/use-device-apis";

interface SafeAreaData {
  id: string;
  lat: number;
  lng: number;
  safetyScore: number;
  radius: number;
  name: string;
  type: "residential" | "commercial" | "transit" | "park" | "emergency";
}

interface SafeAreaCirclesProps {
  map: google.maps.Map | null;
  userLocation?: { latitude: number; longitude: number };
  onAreaUpdate?: (areas: SafeAreaData[]) => void;
}

export function SafeAreaCircles({
  map,
  userLocation,
  onAreaUpdate,
}: SafeAreaCirclesProps) {
  const [safeAreas, setSafeAreas] = useState<SafeAreaData[]>([]);
  const [circles, setCircles] = useState<google.maps.Circle[]>([]);

  // Generate dynamic safe areas based on user location and time
  useEffect(() => {
    if (!userLocation) return;

    const generateSafeAreas = () => {
      const now = new Date();
      const hour = now.getHours();
      const isNight = hour >= 20 || hour <= 6;

      // Generate areas around user location
      const areas: SafeAreaData[] = [];

      // Current user area
      const userSafetyScore = calculateAreaSafety(
        userLocation.latitude,
        userLocation.longitude,
        hour,
      );
      areas.push({
        id: "user-area",
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        safetyScore: userSafetyScore,
        radius: getRadiusFromScore(userSafetyScore),
        name: "Your Current Area",
        type: "residential",
      });

      // Generate nearby areas
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * 2 * Math.PI;
        const distance = 0.005 + Math.random() * 0.01; // 0.5-1.5km roughly

        const lat = userLocation.latitude + Math.cos(angle) * distance;
        const lng = userLocation.longitude + Math.sin(angle) * distance;

        const areaScore = calculateAreaSafety(lat, lng, hour);
        const areaType = getAreaType(i);

        areas.push({
          id: `area-${i}`,
          lat,
          lng,
          safetyScore: areaScore,
          radius: getRadiusFromScore(areaScore),
          name: getAreaName(areaType, i),
          type: areaType,
        });
      }

      setSafeAreas(areas);
      onAreaUpdate?.(areas);
    };

    generateSafeAreas();

    // Update every 2 minutes
    const interval = setInterval(generateSafeAreas, 120000);
    return () => clearInterval(interval);
  }, [userLocation, onAreaUpdate]);

  // Create circles on map
  useEffect(() => {
    if (!map || safeAreas.length === 0) return;

    // Clear existing circles
    circles.forEach((circle) => circle.setMap(null));

    // Create new circles
    const newCircles = safeAreas.map((area) => {
      const color = getSafetyColor(area.safetyScore);
      const opacity = getOpacityFromScore(area.safetyScore);

      const circle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: area.id === "user-area" ? 3 : 2,
        fillColor: color,
        fillOpacity: opacity,
        map,
        center: { lat: area.lat, lng: area.lng },
        radius: area.radius,
        zIndex: area.id === "user-area" ? 1000 : 500,
      });

      // Add click listener for area info
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${color};">${area.name}</h3>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color};"></div>
              <span style="font-weight: 500;">Safety Score: ${Math.round(area.safetyScore)}/100</span>
            </div>
            <p style="margin: 4px 0; color: #666; text-transform: capitalize;">
              Type: ${area.type.replace(/([A-Z])/g, " $1")}
            </p>
            <p style="margin: 4px 0; color: #666;">
              Coverage: ${Math.round(area.radius)}m radius
            </p>
            <div style="margin-top: 8px; padding: 4px 8px; background: ${color}20; border-radius: 4px;">
              <small style="color: #666;">
                ${getSafetyDescription(area.safetyScore)}
              </small>
            </div>
          </div>
        `,
      });

      circle.addListener("click", () => {
        infoWindow.setPosition({ lat: area.lat, lng: area.lng });
        infoWindow.open(map);
      });

      return circle;
    });

    setCircles(newCircles);

    return () => {
      newCircles.forEach((circle) => circle.setMap(null));
    };
  }, [map, safeAreas]);

  return null; // This component doesn't render anything directly
}

// Helper functions
function calculateAreaSafety(lat: number, lng: number, hour: number): number {
  let score = 70; // Base score

  // Time-based adjustments
  if (hour >= 6 && hour <= 18)
    score += 15; // Daytime
  else if (hour >= 19 && hour <= 21)
    score += 5; // Evening
  else score -= 10; // Night

  // Simulate area characteristics based on coordinates
  const latFactor = Math.abs(lat * 1000) % 30;
  const lngFactor = Math.abs(lng * 1000) % 25;

  // Higher scores for certain coordinate patterns (simulating good neighborhoods)
  if (latFactor > 15 && lngFactor > 12) score += 10;
  if (latFactor < 8 || lngFactor < 6) score -= 8;

  // Population density simulation
  const density = (latFactor + lngFactor) % 20;
  if (density > 15) score += 5; // High density areas are safer
  if (density < 5) score -= 10; // Isolated areas are less safe

  // Random variation for realism
  score += (Math.random() - 0.5) * 10;

  return Math.max(30, Math.min(95, score));
}

function getSafetyColor(score: number): string {
  if (score >= 75) return "#10b981"; // Green
  if (score >= 60) return "#f59e0b"; // Yellow
  if (score >= 45) return "#f97316"; // Orange
  return "#ef4444"; // Red
}

function getOpacityFromScore(score: number): number {
  // Higher scores get more transparency (less alarming)
  // Lower scores get more opacity (more attention)
  if (score >= 75) return 0.15;
  if (score >= 60) return 0.25;
  if (score >= 45) return 0.35;
  return 0.45;
}

function getRadiusFromScore(score: number): number {
  // Radius represents the "influence" area of the safety score
  const baseRadius = 150;
  const scoreMultiplier = score / 100;
  return baseRadius + scoreMultiplier * 100; // 150-250m range
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

export default SafeAreaCircles;
