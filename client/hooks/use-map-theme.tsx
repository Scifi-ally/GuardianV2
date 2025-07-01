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

      // Auto-detect based on system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      return prefersDark ? "dark" : "light";
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

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e: MediaQueryListEvent) => {
        // Only auto-switch if user hasn't explicitly set a preference
        const savedTheme = localStorage.getItem("guardian-map-theme");
        if (!savedTheme) {
          setMapTheme(e.matches ? "dark" : "light");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

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
