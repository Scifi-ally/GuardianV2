import { useState, useEffect } from "react";

export type MapTheme = "light" | "dark";
export type MapType = "normal" | "satellite";

export function useMapTheme() {
  const [mapTheme, setMapTheme] = useState<MapTheme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("guardian-map-theme");
      if (saved === "light" || saved === "dark") {
        return saved;
      }

      // Default to light theme instead of auto-detecting
      return "light";
    }
    return "light";
  });

  const [mapType, setMapType] = useState<MapType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("guardian-map-type");
      if (saved === "normal" || saved === "satellite") {
        return saved;
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
    setMapTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const toggleMapType = () => {
    setMapType((current) => (current === "normal" ? "satellite" : "normal"));
  };

  return {
    mapTheme,
    mapType,
    setMapTheme,
    setMapType,
    toggleTheme,
    toggleMapType,
  };
}
