import { useState, useEffect, useCallback } from "react";

export type MapTheme = "light" | "dark";
export type MapType = "normal" | "satellite";

interface MapThemeState {
  mapTheme: MapTheme;
  mapType: MapType;
  toggleTheme: () => void;
  toggleMapType: () => void;
  setMapTheme: (theme: MapTheme) => void;
  setMapType: (type: MapType) => void;
}

const MAP_THEME_KEY = "guardian-map-theme";
const MAP_TYPE_KEY = "guardian-map-type";

export function useMapTheme(): MapThemeState {
  // Initialize from localStorage or default to light/normal
  const [mapTheme, setMapThemeState] = useState<MapTheme>(() => {
    try {
      const saved = localStorage.getItem(MAP_THEME_KEY);
      return (saved as MapTheme) || "light";
    } catch {
      return "light";
    }
  });

  const [mapType, setMapTypeState] = useState<MapType>(() => {
    try {
      const saved = localStorage.getItem(MAP_TYPE_KEY);
      return (saved as MapType) || "normal";
    } catch {
      return "normal";
    }
  });

  // Save to localStorage whenever theme changes
  useEffect(() => {
    try {
      localStorage.setItem(MAP_THEME_KEY, mapTheme);
      console.log("Map theme updated:", mapTheme);

      // Dispatch event for map components to listen to
      window.dispatchEvent(
        new CustomEvent("mapThemeChange", {
          detail: { theme: mapTheme },
        }),
      );
    } catch (error) {
      console.warn("Failed to save map theme:", error);
    }
  }, [mapTheme]);

  // Save to localStorage whenever type changes
  useEffect(() => {
    try {
      localStorage.setItem(MAP_TYPE_KEY, mapType);
      console.log("Map type updated:", mapType);

      // Dispatch event for map components to listen to
      window.dispatchEvent(
        new CustomEvent("mapTypeChange", {
          detail: { type: mapType },
        }),
      );
    } catch (error) {
      console.warn("Failed to save map type:", error);
    }
  }, [mapType]);

  const toggleTheme = useCallback(() => {
    setMapThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const toggleMapType = useCallback(() => {
    setMapTypeState((prev) => (prev === "normal" ? "satellite" : "normal"));
  }, []);

  const setMapTheme = useCallback((theme: MapTheme) => {
    setMapThemeState(theme);
  }, []);

  const setMapType = useCallback((type: MapType) => {
    setMapTypeState(type);
  }, []);

  return {
    mapTheme,
    mapType,
    toggleTheme,
    toggleMapType,
    setMapTheme,
    setMapType,
  };
}
