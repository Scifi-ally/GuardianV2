import { useState, useEffect } from "react";

export type MapTheme = "light" | "safety";
export type MapType = "normal" | "satellite" | "terrain";

export function useMapTheme() {
  const [mapTheme, setMapTheme] = useState<MapTheme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("guardian-map-theme");
      if (saved === "light" || saved === "safety") {
        return saved as MapTheme;
      }
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
          return "safety";
        case "safety":
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
      case "safety":
        return {
          name: "Safety Mode",
          icon: "🛡️",
          description: "High-contrast safety view",
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
