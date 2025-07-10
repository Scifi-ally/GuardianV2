import { useState, useEffect } from "react";

export type MapTheme = "light" | "dark" | "safety" | "night";
export type MapType = "normal" | "satellite" | "terrain";

export function useMapTheme() {
  const [mapTheme, setMapTheme] = useState<MapTheme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("guardian-map-theme");
      if (
        saved === "light" ||
        saved === "dark" ||
        saved === "safety" ||
        saved === "night"
      ) {
        return saved as MapTheme;
      }

      // Default to light theme instead of auto-detecting
      return "light";
    }
    return "light";
  });

  const [mapType, setMapType] = useState<MapType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("guardian-map-type");
      if (saved === "normal" || saved === "satellite" || saved === "terrain") {
        return saved as MapType;
      }
    }
    return "normal";
  });

  // Save theme preference to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("guardian-map-theme", mapTheme);
    }
  }, [mapTheme]);

  // Save map type preference to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("guardian-map-type", mapType);
    }
  }, [mapType]);

  // Removed system theme auto-detection - now defaults to light theme

  const toggleTheme = () => {
    setMapTheme((current) => {
      switch (current) {
        case "light":
          return "dark";
        case "dark":
          return "safety";
        case "safety":
          return "night";
        case "night":
          return "light";
        default:
          return "light";
      }
    });
  };

  const toggleMapType = () => {
    setMapType((current) => {
      switch (current) {
        case "normal":
          return "satellite";
        case "satellite":
          return "terrain";
        case "terrain":
          return "normal";
        default:
          return "normal";
      }
    });
  };

  const getThemeConfig = () => {
    switch (mapTheme) {
      case "light":
        return {
          name: "Light Mode",
          icon: "🌅",
          description: "Standard daylight view",
        };
      case "dark":
        return {
          name: "Dark Mode",
          icon: "🌙",
          description: "Low-light display",
        };
      case "safety":
        return {
          name: "Safety Mode",
          icon: "🛡️",
          description: "High-contrast safety view",
        };
      case "night":
        return {
          name: "Night Mode",
          icon: "🌌",
          description: "Optimized for night use",
        };
      default:
        return {
          name: "Light Mode",
          icon: "🌅",
          description: "Standard daylight view",
        };
    }
  };

  const getMapTypeConfig = () => {
    switch (mapType) {
      case "normal":
        return {
          name: "Standard",
          icon: "🗺️",
          description: "Street and road view",
        };
      case "satellite":
        return {
          name: "Satellite",
          icon: "🛰️",
          description: "Aerial imagery",
        };
      case "terrain":
        return {
          name: "Terrain",
          icon: "🏔️",
          description: "Topographical view",
        };
      default:
        return {
          name: "Standard",
          icon: "🗺️",
          description: "Street and road view",
        };
    }
  };

  return {
    mapTheme,
    mapType,
    setMapTheme,
    setMapType,
    toggleTheme,
    toggleMapType,
    getThemeConfig,
    getMapTypeConfig,
  };
}
