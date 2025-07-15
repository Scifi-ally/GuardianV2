/**
 * Expandable Google Maps-style Search Bar
 * Full feature implementation with expansion/collapse functionality
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Navigation,
  Clock,
  Star,
  Locate,
  X,
  ArrowRight,
  Building,
  Car,
  User,
  Bike,
  Menu,
  Navigation2,
  Home,
  Plus,
  History,
  TrendingUp,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EnhancedButton,
  PrimaryButton,
  SecondaryButton,
  GlassButton,
} from "@/components/ui/enhanced-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-device-apis";
import {
  enhancedNavigationService,
  TravelMode,
} from "@/services/enhancedNavigationService";
import { navigationFixService } from "@/services/navigationFixService";
import { unifiedNotifications } from "@/services/unifiedNotificationService";
import {
  advancedSafetyScoring,
  type SafetyScore,
} from "@/services/advancedSafetyScoring";
import { navigationErrorHandler } from "@/services/navigationErrorHandler";
import {
  waitForGoogleMaps,
  initializePlacesServices,
  isGoogleMapsLoaded,
} from "@/lib/googleMapsUtils";

interface SearchSuggestion {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  type: "place" | "recent" | "favorite" | "category" | "trending";
  icon:
    | "pin"
    | "star"
    | "clock"
    | "building"
    | "restaurant"
    | "hospital"
    | "gas"
    | "home"
    | "work";
  distance?: string;
  rating?: number;
  place_id?: string;
  types?: string[];
  isOpen?: boolean;
  hours?: string;
  safetyScore?: number;
  emergencyInfo?: {
    isEmergencyService: boolean;
    is24Hours: boolean;
    hasEmergencyAccess: boolean;
  };
}

interface ExpandableSearchBarProps {
  onPlaceSelect: (place: SearchSuggestion) => void;
  onNavigationStart?: (destination: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
  placeholder?: string;
  className?: string;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

const RECENT_SEARCHES_KEY = "expandable_recent_searches";
const FAVORITE_PLACES_KEY = "expandable_favorite_places";

// Safety-focused categories for quick access
const QUICK_CATEGORIES = [
  { name: "Hospitals", icon: "hospital", query: "hospital near me" },
  { name: "Police", icon: "building", query: "police station near me" },
  { name: "Fire Station", icon: "building", query: "fire station near me" },
  { name: "Pharmacy", icon: "hospital", query: "pharmacy near me" },
  { name: "Safe Places", icon: "building", query: "safe places near me" },
  { name: "Gas Stations", icon: "gas", query: "gas station near me" },
];

// Trending searches for safety app
const TRENDING_SEARCHES = [
  { name: "Emergency Room", query: "emergency room near me", icon: "hospital" },
  {
    name: "24/7 Pharmacy",
    query: "24 hour pharmacy near me",
    icon: "hospital",
  },
  { name: "Police Station", query: "police station near me", icon: "building" },
  { name: "Safe Parking", query: "safe parking near me", icon: "building" },
];

export function ExpandableSearchBar({
  onPlaceSelect,
  onNavigationStart,
  placeholder = "Search Google Maps",
  className,
  isExpanded: controlledExpanded,
  onExpandChange,
}: ExpandableSearchBarProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  const [favorites, setFavorites] = useState<SearchSuggestion[]>([]);
  const [currentTravelMode, setCurrentTravelMode] =
    useState<TravelMode>("driving");
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedDestination, setSelectedDestination] =
    useState<SearchSuggestion | null>(null);
  const [showRoutePreview, setShowRoutePreview] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    route: any;
  } | null>(null);
  const [showRouteModeSelection, setShowRouteModeSelection] = useState(false);
  const [routeModes, setRouteModes] = useState<{
    quickest: { distance: string; duration: string; safetyScore: SafetyScore };
    safest: { distance: string; duration: string; safetyScore: SafetyScore };
    recommendation: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { getCurrentLocation, location } = useGeolocation();

  // Determine if search bar is expanded
  const isExpanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  // Handle expansion change
  const handleExpandChange = (expanded: boolean) => {
    if (controlledExpanded === undefined) {
      setInternalExpanded(expanded);
    }
    onExpandChange?.(expanded);
  };

  // Initialize Google Places services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log("🔄 Initializing Google Places services...");

        // Wait for Google Maps API to be available
        await waitForGoogleMaps();

        // Initialize services
        const {
          autocompleteService: autoService,
          placesService: placeService,
        } = initializePlacesServices();

        if (autoService && placeService) {
          autocompleteService.current = autoService;
          placesService.current = placeService;
          console.log("✅ Google Places services initialized successfully");
        } else {
          console.warn("⚠️ Failed to initialize Google Places services");
        }
      } catch (error) {
        console.error("❌ Google Places initialization failed:", error);
        unifiedNotifications.warning("Maps Loading", {
          message:
            "Maps functionality may be limited. Please refresh if needed.",
        });
      }
    };

    initializeServices();
    loadStoredData();
  }, []);

  // Enhanced collapse with smooth animations
  const handleCollapse = useCallback(() => {
    // Animated collapse sequence
    setShowSuggestions(false);
    setShowRoutePreview(false);
    setShowRouteModeSelection(false);

    // Smooth transition with stagger
    setTimeout(() => {
      setSearchQuery("");
      setSuggestions([]);
      setSelectedDestination(null);
      setRouteInfo(null);
      searchInputRef.current?.blur();
    }, 100);

    setTimeout(() => {
      handleExpandChange(false);
    }, 200);
  }, [handleExpandChange]);

  // Enhanced keyboard and click outside handling
  useEffect(() => {
    if (!isExpanded) return;

    // Keyboard event handling
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCollapse();
      }
    };

    // Click outside handling
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleCollapse();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded, handleCollapse]);

  // Load recent searches and favorites from localStorage
  const loadStoredData = () => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }

      const storedFavorites = localStorage.getItem(FAVORITE_PLACES_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Failed to load stored search data:", error);
    }
  };

  // Save recent search
  const saveRecentSearch = (place: SearchSuggestion) => {
    try {
      const updated = [
        { ...place, type: "recent" as const },
        ...recentSearches.filter((r) => r.id !== place.id).slice(0, 4),
      ];
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save recent search:", error);
    }
  };

  // Add to favorites
  const addToFavorites = (place: SearchSuggestion) => {
    try {
      const updated = [
        { ...place, type: "favorite" as const },
        ...favorites.filter((f) => f.id !== place.id),
      ];
      setFavorites(updated);
      localStorage.setItem(FAVORITE_PLACES_KEY, JSON.stringify(updated));
      console.log("Added to favorites:", place.name);
    } catch (error) {
      console.error("Failed to add to favorites:", error);
    }
  };

  // Remove from favorites
  const removeFromFavorites = (placeId: string) => {
    try {
      const updated = favorites.filter((f) => f.id !== placeId);
      setFavorites(updated);
      localStorage.setItem(FAVORITE_PLACES_KEY, JSON.stringify(updated));
      console.log("Removed from favorites");
    } catch (error) {
      console.error("Failed to remove from favorites:", error);
    }
  };

  // Check if place is favorited
  const isFavorited = (placeId: string) => {
    return favorites.some((f) => f.id === placeId);
  };

  // Calculate safety score for a destination
  const calculateSafetyScore = (suggestion: SearchSuggestion): number => {
    let score = 70; // Base score

    // Emergency services get highest scores
    if (suggestion.types?.includes("hospital")) score = 95;
    if (suggestion.types?.includes("police")) score = 95;
    if (suggestion.types?.includes("fire_station")) score = 95;
    if (suggestion.types?.includes("pharmacy")) score = 85;

    // Public places are generally safer
    if (suggestion.types?.includes("shopping_mall")) score += 10;
    if (suggestion.types?.includes("school")) score += 15;
    if (suggestion.types?.includes("university")) score += 15;
    if (suggestion.types?.includes("bank")) score += 10;

    // 24/7 places are safer
    if (suggestion.emergencyInfo?.is24Hours) score += 10;

    // Highly rated places are safer
    if (suggestion.rating && suggestion.rating >= 4.5) score += 10;
    if (suggestion.rating && suggestion.rating >= 4.0) score += 5;

    return Math.min(100, Math.max(0, score));
  };

  // Get safety info for emergency places
  const getEmergencyInfo = (types: string[] = []) => {
    const isEmergencyService = types.some((type) =>
      ["hospital", "police", "fire_station", "pharmacy"].includes(type),
    );

    const is24Hours = types.some((type) =>
      ["hospital", "police", "fire_station", "gas_station"].includes(type),
    );

    const hasEmergencyAccess = types.some((type) =>
      ["hospital", "police", "fire_station"].includes(type),
    );

    return {
      isEmergencyService,
      is24Hours,
      hasEmergencyAccess,
    };
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get Google Places suggestions
  const getGooglePlacesSuggestions = useCallback(
    async (query: string): Promise<SearchSuggestion[]> => {
      if (!autocompleteService.current || query.length < 2) {
        console.log("🔍 Skipping search: service not ready or query too short");
        return [];
      }

      return new Promise((resolve) => {
        const request: google.maps.places.AutocompletionRequest = {
          input: query,
          types: ["establishment", "geocode"],
          componentRestrictions: { country: ["in"] },
          location: location
            ? new google.maps.LatLng(location.latitude, location.longitude)
            : undefined,
          radius: location ? 50000 : undefined,
        };

        console.log(`🔍 Searching Google Places for: "${query}"`);

        autocompleteService.current!.getPlacePredictions(
          request,
          (predictions, status) => {
            console.log(`📍 Google Places API status: ${status}`);

            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              console.log(`✅ Found ${predictions.length} predictions`);

              const suggestions: SearchSuggestion[] = predictions
                .slice(0, 8)
                .map((prediction) => {
                  const emergencyInfo = getEmergencyInfo(prediction.types);
                  const baseSuggestion = {
                    id: prediction.place_id || Math.random().toString(),
                    name: prediction.structured_formatting.main_text,
                    address:
                      prediction.structured_formatting.secondary_text ||
                      prediction.description,
                    location: { lat: 0, lng: 0 },
                    type: "place" as const,
                    icon: getPlaceIcon(prediction.types),
                    place_id: prediction.place_id,
                    types: prediction.types,
                    emergencyInfo,
                  };

                  return baseSuggestion;
                });
              resolve(suggestions);
            } else {
              console.warn(`❌ Google Places search failed: ${status}`);
              resolve([]);
            }
          },
        );
      });
    },
    [location],
  );

  // Get place icon based on type
  const getPlaceIcon = (types: string[] = []): SearchSuggestion["icon"] => {
    if (types.includes("restaurant") || types.includes("food"))
      return "restaurant";
    if (types.includes("gas_station")) return "gas";
    if (types.includes("hospital") || types.includes("pharmacy"))
      return "hospital";
    if (types.includes("atm") || types.includes("bank")) return "building";
    return "pin";
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedIndex(-1);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(isExpanded);
      return;
    }

    setIsSearching(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const googleSuggestions = await getGooglePlacesSuggestions(value);

        const filteredRecent = recentSearches
          .filter(
            (item) =>
              item.name.toLowerCase().includes(value.toLowerCase()) ||
              item.address.toLowerCase().includes(value.toLowerCase()),
          )
          .slice(0, 3);

        const filteredFavorites = favorites
          .filter(
            (item) =>
              item.name.toLowerCase().includes(value.toLowerCase()) ||
              item.address.toLowerCase().includes(value.toLowerCase()),
          )
          .slice(0, 2);

        const allSuggestions = [
          ...filteredFavorites,
          ...filteredRecent,
          ...googleSuggestions,
        ];

        setSuggestions(allSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Search failed:", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Enhanced search bar expansion with smooth animations
  const handleSearchBarClick = useCallback(() => {
    if (!isExpanded) {
      handleExpandChange(true);

      // Staggered animation sequence
      setTimeout(() => {
        setShowSuggestions(true);
      }, 100);

      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [isExpanded, handleExpandChange]);

  // Handle place selection with route preview
  const handlePlaceSelect = async (suggestion: SearchSuggestion) => {
    try {
      console.log("🎯 Handling place selection:", suggestion);
      let finalSuggestion = suggestion;

      if (suggestion.place_id && suggestion.location.lat === 0) {
        console.log("🔍 Fetching place details for:", suggestion.place_id);
        setIsSearching(true);
        const placeDetails = await getPlaceDetails(suggestion.place_id);
        if (placeDetails) {
          finalSuggestion = {
            ...suggestion,
            location: {
              lat: placeDetails.geometry!.location!.lat(),
              lng: placeDetails.geometry!.location!.lng(),
            },
            rating: placeDetails.rating,
          };
          console.log("✅ Got place details:", finalSuggestion);
        }
      }

      console.log("📍 Final suggestion:", finalSuggestion);
      setSearchQuery(finalSuggestion.name);
      setSelectedDestination(finalSuggestion);

      // Save to recent searches
      saveRecentSearch(finalSuggestion);

      // Show route mode selection
      await showRouteModeOptions(finalSuggestion);

      console.log("🚀 Calling onPlaceSelect with:", finalSuggestion);
      onPlaceSelect(finalSuggestion);
    } catch (error) {
      console.error("❌ Failed to select place:", error);
      unifiedNotifications.error("Selection Failed", {
        message: "Failed to select destination. Please try again.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Show route preview with options
  const showRoutePreviewForDestination = async (
    destination: SearchSuggestion,
  ) => {
    if (!location) {
      unifiedNotifications.error("Location Required", {
        message: "Please enable location services to get directions.",
      });
      return;
    }

    try {
      setIsSearching(true);
      console.log("🗺️ Calculating route preview...");

      // For now, show route preview with estimated info
      // In a real implementation, you would calculate the actual route
      const estimatedDistance = calculateDistance(
        location.latitude,
        location.longitude,
        destination.location.lat,
        destination.location.lng,
      );

      setRouteInfo({
        distance: `${estimatedDistance.toFixed(1)} km`,
        duration: `${Math.ceil(estimatedDistance * 2)} min`, // Rough estimate
        route: null,
      });
      setShowRoutePreview(true);

      unifiedNotifications.success("Route Preview Ready", {
        message: `Estimated: ${estimatedDistance.toFixed(1)} km`,
      });
    } catch (error) {
      console.error("Route calculation failed:", error);
      unifiedNotifications.error("Route Not Found", {
        message: "Unable to calculate route. Starting basic navigation...",
      });

      // Fallback to basic navigation
      await startNavigationToDestination(destination);
    } finally {
      setIsSearching(false);
    }
  };

  // Show route mode selection
  const showRouteModeOptions = async (destination: SearchSuggestion) => {
    if (!location) {
      unifiedNotifications.error("Location Required", {
        message: "Please enable location services to get directions.",
      });
      return;
    }

    try {
      setIsSearching(true);
      console.log("🛣️ Calculating route options...");

      // Calculate distance for estimates
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        destination.location.lat,
        destination.location.lng,
      );

      console.log("🔬 Calculating advanced safety metrics...");

      // Generate comprehensive safety comparison
      const safetyComparison = advancedSafetyScoring.generateRouteComparison(
        {
          distance: distance,
          duration: Math.ceil(distance * 1.5),
        },
        {
          distance: distance * 1.2,
          duration: Math.ceil(distance * 2.2),
        },
      );

      const quickestRoute = {
        distance: `${distance.toFixed(1)} km`,
        duration: `${Math.ceil(distance * 1.5)} min`,
        safetyScore: safetyComparison.quickest,
      };

      const safestRoute = {
        distance: `${(distance * 1.2).toFixed(1)} km`,
        duration: `${Math.ceil(distance * 2.2)} min`,
        safetyScore: safetyComparison.safest,
      };

      setRouteModes({
        quickest: quickestRoute,
        safest: safestRoute,
        recommendation: safetyComparison.recommendation,
      });

      setShowRouteModeSelection(true);
      setShowSuggestions(false);

      unifiedNotifications.success("Route Options Ready", {
        message: "Choose your preferred route type",
      });
    } catch (error) {
      console.error("Route calculation failed:", error);
      // Fallback to immediate navigation
      await startNavigationToDestination(destination);
    } finally {
      setIsSearching(false);
    }
  };

  // Start navigation to selected destination
  const startNavigationToDestination = async (
    destination: SearchSuggestion,
    routeMode?: "quickest" | "safest",
  ) => {
    const navigationContext = {
      destination,
      currentLocation: location,
      routeMode,
      timestamp: new Date().toISOString(),
    };

    try {
      console.log(
        "🧭 Starting navigation to:",
        destination.name,
        routeMode ? `(${routeMode} route)` : "",
      );
      setIsNavigating(true);

      // Close route mode selection
      setShowRouteModeSelection(false);
      setRouteModes(null);

      // Pre-flight checks
      if (!location) {
        throw new Error("Current location not available");
      }

      if (!destination.location.lat || !destination.location.lng) {
        throw new Error("Invalid destination coordinates");
      }

      // Enhanced AI safety analysis and warnings
      const safetyScore = routeModes?.[routeMode || "quickest"]?.safetyScore;
      if (safetyScore) {
        // Log detailed safety analysis
        console.log("🛡️ AI Safety Analysis:", {
          overall: safetyScore.overall,
          traffic: safetyScore.traffic,
          weather: safetyScore.weather,
          time: safetyScore.time,
          area: safetyScore.area,
        });

        // Enhanced safety warnings with specific recommendations
        if (safetyScore.overall < 40) {
          console.warn("⚠️ High-risk route detected by AI analysis");
          const riskFactors = [];
          if (safetyScore.traffic < 50)
            riskFactors.push("Heavy traffic conditions");
          if (safetyScore.weather < 50)
            riskFactors.push("Poor weather conditions");
          if (safetyScore.time < 50) riskFactors.push("Dangerous time of day");
          if (safetyScore.area < 50)
            riskFactors.push("High-risk area detected");

          const warningMessage = `🚨 AI Safety Alert\n\nRisk factors detected:\n${riskFactors.map((f) => `• ${f}`).join("\n")}\n\nRecommendation: Consider taking the safest route or delay travel.\n\nContinue anyway?`;

          unifiedNotifications.warning("High Risk Route", {
            message: "AI detected safety concerns. Check route details.",
            persistent: true,
          });

          const userConfirm = confirm(warningMessage);
          if (!userConfirm) {
            setIsNavigating(false);
            return;
          }
        } else if (safetyScore.overall < 70) {
          unifiedNotifications.info("Moderate Risk Route", {
            message: "AI suggests caution. Stay alert during navigation.",
          });
        } else {
          unifiedNotifications.success("Safe Route", {
            message: "AI confirms this is a safe route for travel.",
          });
        }
      }

      // Use navigation fix service for reliable navigation
      const success = await navigationFixService.startNavigationSafely(
        {
          lat: destination.location.lat,
          lng: destination.location.lng,
          name: destination.name,
        },
        {
          lat: location.latitude,
          lng: location.longitude,
        },
      );

      if (success) {
        // Close search bar and show navigation
        setShowSuggestions(false);
        setShowRoutePreview(false);
        setTimeout(() => {
          handleExpandChange(false);
        }, 150);

        // Trigger navigation start callback
        if (onNavigationStart) {
          onNavigationStart({
            lat: destination.location.lat,
            lng: destination.location.lng,
            name: destination.name,
          });
        }

        unifiedNotifications.success("Navigation Started", {
          message: `Navigating to ${destination.name}${routeMode ? ` via ${routeMode} route` : ""}`,
        });

        console.log("✅ Navigation started successfully");
      } else {
        throw new Error("Navigation service failed to start");
      }
    } catch (error) {
      console.error("❌ Navigation failed:", error);
      setIsNavigating(false);

      // Use advanced error handling
      try {
        const recoveryActions =
          await navigationErrorHandler.handleNavigationError(
            error,
            navigationContext,
          );

        if (recoveryActions.length > 0) {
          console.log(
            `🔧 ${recoveryActions.length} recovery actions available`,
          );

          // For now, execute the highest priority action automatically
          const primaryAction = recoveryActions[0];
          if (
            primaryAction.type === "retry" ||
            primaryAction.type === "fallback"
          ) {
            console.log(`🔄 Auto-executing: ${primaryAction.description}`);
            try {
              await primaryAction.action();
              // Retry navigation after recovery action
              setTimeout(() => {
                startNavigationToDestination(destination, routeMode);
              }, 1000);
              return;
            } catch (recoveryError) {
              console.error("Recovery action failed:", recoveryError);
            }
          }
        }
      } catch (handlingError) {
        console.error("Error handling failed:", handlingError);
      }

      // Fallback error notification
      unifiedNotifications.error("Navigation Failed", {
        message:
          error.message || "Unable to start navigation. Please try again.",
      });
    }
  };

  // Get Google Place details
  const getPlaceDetails = (
    placeId: string,
  ): Promise<google.maps.places.PlaceResult | null> => {
    return new Promise((resolve) => {
      if (!placesService.current) {
        resolve(null);
        return;
      }

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ["geometry", "name", "formatted_address", "rating", "types"],
      };

      placesService.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          resolve(null);
        }
      });
    });
  };

  // Get suggestion icon component
  const getSuggestionIcon = (
    iconType: SearchSuggestion["icon"],
    suggestionType: SearchSuggestion["type"],
  ) => {
    const iconClass = "h-5 w-5 flex-shrink-0";

    if (suggestionType === "recent")
      return <Clock className={cn(iconClass, "text-gray-500")} />;
    if (suggestionType === "favorite")
      return <Star className={cn(iconClass, "text-yellow-500")} />;
    if (suggestionType === "trending")
      return <TrendingUp className={cn(iconClass, "text-blue-500")} />;

    switch (iconType) {
      case "restaurant":
        return <Building className={cn(iconClass, "text-orange-500")} />;
      case "hospital":
        return <Building className={cn(iconClass, "text-red-500")} />;
      case "gas":
        return <Building className={cn(iconClass, "text-blue-500")} />;
      case "building":
        return <Building className={cn(iconClass, "text-gray-600")} />;
      case "home":
        return <Home className={cn(iconClass, "text-green-500")} />;
      case "work":
        return <Building className={cn(iconClass, "text-purple-500")} />;
      default:
        return <MapPin className={cn(iconClass, "text-green-500")} />;
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Search Bar */}
      <motion.div
        className="relative"
        initial={false}
        animate={{
          width: isExpanded ? "100%" : "auto",
        }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1],
          type: "tween",
        }}
        style={{
          transformOrigin: "left center",
          willChange: "width",
        }}
      >
        {!isExpanded ? (
          // Collapsed State - Modern floating search bar
          <motion.div
            onClick={handleSearchBarClick}
            className="flex items-center gap-4 px-6 py-4 glass-light rounded-ultra shadow-xl transition-all duration-500 cursor-pointer border border-white/60 min-w-[340px] max-w-md ring-1 ring-slate-200/20 interactive-card group"
            whileHover={{
              scale: 1.03,
              y: -4,
              boxShadow:
                "0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.08)",
              backdropFilter: "blur(24px)",
            }}
            whileTap={{
              scale: 0.97,
              transition: { duration: 0.1 },
            }}
            style={{
              transformOrigin: "center",
              backfaceVisibility: "hidden",
              perspective: 1000,
            }}
          >
            <motion.div
              className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-all duration-300 flex-shrink-0"
              whileHover={{ rotate: 15, scale: 1.1 }}
            >
              <Search className="w-5 h-5 text-slate-600" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <motion.span
                className="text-slate-700 font-semibold text-base tracking-tight block"
                initial={{ x: -10, opacity: 0.7 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {searchQuery || "Where do you want to go?"}
              </motion.span>
              <motion.div
                className="text-sm text-slate-500 mt-0.5 font-medium truncate"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                🔍 Search • 🧭 Navigate • 🛡️ AI Safety
              </motion.div>
            </div>
          </motion.div>
        ) : (
          // Expanded State - Full search interface
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                duration: 0.3,
                ease: [0.25, 0.1, 0.25, 1],
              },
            }}
            exit={{
              opacity: 0,
              y: -20,
              scale: 0.95,
              transition: {
                duration: 0.2,
                ease: [0.25, 0.1, 0.25, 1],
              },
            }}
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 ring-1 ring-gray-200/30"
          >
            {/* Search Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <GlassButton
                    onClick={handleCollapse}
                    size="icon-sm"
                    animation="subtle"
                    className="rounded-full"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </GlassButton>
                </motion.div>
              </div>

              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={placeholder}
                className="pl-16 pr-20 h-16 text-base border-0 rounded-xl focus:ring-0 bg-transparent font-medium text-slate-700 placeholder:text-slate-400 focus:placeholder:text-slate-300 transition-all duration-300"
                autoComplete="off"
                autoFocus
              />

              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {searchQuery && (
                  <GlassButton
                    onClick={() => {
                      setSearchQuery("");
                      setSuggestions([]);
                      setShowSuggestions(true);
                      searchInputRef.current?.focus();
                    }}
                    size="icon-sm"
                    animation="subtle"
                    className="rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </GlassButton>
                )}
              </div>
            </div>

            {/* Route Mode Selection Panel */}
            <AnimatePresence>
              {showRouteModeSelection && selectedDestination && routeModes && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    height: "auto",
                    transition: {
                      duration: 0.3,
                      ease: [0.25, 0.1, 0.25, 1],
                    },
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                    height: 0,
                    transition: {
                      duration: 0.2,
                      ease: [0.25, 0.1, 0.25, 1],
                    },
                  }}
                  className="border-t border-gray-100"
                >
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-4">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          Choose Route to {selectedDestination.name}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          Select your preferred route type
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Quickest Route Option */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          startNavigationToDestination(
                            selectedDestination,
                            "quickest",
                          )
                        }
                        disabled={isNavigating}
                        className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-left group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              Quickest Route
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {routeModes.quickest.duration}
                            </span>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {routeModes.quickest.distance}
                          </span>
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              routeModes.quickest.safetyScore.overall >= 70
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            <Shield className="h-3 w-3" />
                            Safety: {routeModes.quickest.safetyScore.overall}
                            /100
                          </div>
                        </div>
                      </motion.button>

                      {/* Safest Route Option */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          startNavigationToDestination(
                            selectedDestination,
                            "safest",
                          )
                        }
                        disabled={isNavigating}
                        className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-colors text-left group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-gray-900">
                              Safest Route
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {routeModes.safest.duration}
                            </span>
                            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-500" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {routeModes.safest.distance}
                          </span>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Shield className="h-3 w-3" />
                            Safety: {routeModes.safest.safetyScore.overall}/100
                          </div>
                        </div>
                      </motion.button>
                    </div>

                    {/* Safety Recommendation */}
                    {routeModes.recommendation && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-blue-900 mb-1">
                              Safety Recommendation
                            </div>
                            <div className="text-xs text-blue-700">
                              {routeModes.recommendation}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowRouteModeSelection(false);
                          setSelectedDestination(null);
                          setRouteModes(null);
                          handleExpandChange(false);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Route Preview Panel */}
            <AnimatePresence>
              {showRoutePreview && selectedDestination && routeInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    height: "auto",
                    transition: {
                      duration: 0.3,
                      ease: [0.25, 0.1, 0.25, 1],
                    },
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                    height: 0,
                    transition: {
                      duration: 0.2,
                      ease: [0.25, 0.1, 0.25, 1],
                    },
                  }}
                  className="border-t border-gray-100"
                >
                  <div className="p-4 bg-blue-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {selectedDestination.name}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {selectedDestination.address}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          {routeInfo.distance}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          {routeInfo.duration}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <PrimaryButton
                        onClick={() =>
                          startNavigationToDestination(selectedDestination)
                        }
                        disabled={isNavigating}
                        loading={isNavigating}
                        size="md"
                        animation="float"
                        className="flex-1"
                        leftIcon={<Navigation className="w-4 h-4" />}
                      >
                        {isNavigating
                          ? "Starting Navigation..."
                          : "Start Navigation"}
                      </PrimaryButton>

                      <SecondaryButton
                        onClick={() => {
                          setShowRoutePreview(false);
                          setSelectedDestination(null);
                          setRouteInfo(null);
                        }}
                        size="md"
                        animation="subtle"
                        leftIcon={<X className="w-4 h-4" />}
                      >
                        Cancel
                      </SecondaryButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Suggestions Panel */}
            <AnimatePresence>
              {showSuggestions &&
                !showRoutePreview &&
                !showRouteModeSelection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                      y: 0,
                      transition: {
                        duration: 0.3,
                        ease: [0.25, 0.1, 0.25, 1],
                        height: { duration: 0.3 },
                        opacity: { duration: 0.2, delay: 0.1 },
                      },
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      y: -10,
                      transition: {
                        duration: 0.2,
                        ease: [0.25, 0.1, 0.25, 1],
                      },
                    }}
                    className="border-t border-gray-100"
                  >
                    <div className="max-h-96 overflow-y-auto">
                      {/* Quick Categories (when no search query) */}
                      {searchQuery === "" && (
                        <div className="p-4 space-y-4">
                          {/* Trending Searches */}
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Trending in safety
                            </div>
                            <div className="space-y-2">
                              {TRENDING_SEARCHES.map((item, index) => (
                                <motion.div
                                  key={item.name}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    delay: index * 0.05,
                                    duration: 0.3,
                                    ease: [0.25, 0.1, 0.25, 1],
                                  }}
                                  whileHover={{
                                    scale: 1.02,
                                    x: 5,
                                    transition: { duration: 0.2 },
                                  }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    console.log(
                                      "🔥 Trending search clicked:",
                                      item.name,
                                    );
                                    handleSearchChange(item.query);
                                  }}
                                  className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200"
                                >
                                  <motion.div
                                    whileHover={{ rotate: 15 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                    }}
                                  >
                                    <TrendingUp className="h-4 w-4 text-blue-500" />
                                  </motion.div>
                                  <span className="text-sm font-medium">
                                    {item.name}
                                  </span>
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ArrowRight className="h-3 w-3 text-blue-400" />
                                  </motion.div>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Recent Searches */}
                          {recentSearches.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Recent
                              </div>
                              <div className="space-y-2">
                                {recentSearches
                                  .slice(0, 3)
                                  .map((item, index) => (
                                    <motion.div
                                      key={item.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{
                                        delay: index * 0.05,
                                        duration: 0.3,
                                        ease: [0.25, 0.1, 0.25, 1],
                                      }}
                                      whileHover={{
                                        scale: 1.02,
                                        x: 5,
                                        transition: { duration: 0.2 },
                                      }}
                                      whileTap={{ scale: 0.98 }}
                                      className="group flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200"
                                    >
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 300,
                                        }}
                                      >
                                        <Clock className="h-4 w-4 text-gray-500" />
                                      </motion.div>
                                      <div
                                        className="flex-1 min-w-0"
                                        onClick={() => {
                                          console.log(
                                            "📍 Recent search selected:",
                                            item.name,
                                          );
                                          handlePlaceSelect(item);
                                        }}
                                      >
                                        <div className="text-sm font-medium truncate">
                                          {item.name}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                          {item.address}
                                        </div>
                                      </div>
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{
                                          opacity: 1,
                                          scale: 1,
                                          transition: {
                                            delay: 0.2 + index * 0.05,
                                          },
                                        }}
                                        className="flex items-center gap-1"
                                      >
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addToFavorites(item);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-yellow-100"
                                          title="Add to favorites"
                                        >
                                          <Star className="h-3 w-3 text-yellow-500" />
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const updated =
                                              recentSearches.filter(
                                                (r) => r.id !== item.id,
                                              );
                                            setRecentSearches(updated);
                                            localStorage.setItem(
                                              RECENT_SEARCHES_KEY,
                                              JSON.stringify(updated),
                                            );
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-red-100"
                                          title="Remove from recent"
                                        >
                                          <X className="h-3 w-3 text-red-500" />
                                        </motion.button>
                                      </motion.div>
                                    </motion.div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Quick Categories */}
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-3">
                              Quick search
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {QUICK_CATEGORIES.map((category, index) => (
                                <motion.button
                                  key={category.name}
                                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                    transition: {
                                      delay: index * 0.1,
                                      duration: 0.3,
                                      ease: [0.25, 0.1, 0.25, 1],
                                    },
                                  }}
                                  whileHover={{
                                    scale: 1.05,
                                    y: -2,
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                                    transition: { duration: 0.2 },
                                  }}
                                  whileTap={{
                                    scale: 0.95,
                                    transition: { duration: 0.1 },
                                  }}
                                  onClick={() => {
                                    console.log(
                                      "🔍 Quick category clicked:",
                                      category.name,
                                    );
                                    handleSearchChange(category.query);
                                  }}
                                  className="flex items-center gap-3 p-4 text-left hover:bg-red-50 rounded-xl border border-gray-200 hover:border-red-200 transition-all duration-200 group"
                                >
                                  <motion.div
                                    whileHover={{ scale: 1.2, rotate: 5 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                    }}
                                    className="flex-shrink-0"
                                  >
                                    <Building className="h-5 w-5 text-red-500 group-hover:text-red-600" />
                                  </motion.div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-red-900">
                                      {category.name}
                                    </span>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      whileHover={{ width: "100%" }}
                                      transition={{ duration: 0.3 }}
                                      className="h-0.5 bg-red-500 mt-1 rounded-full"
                                    />
                                  </div>
                                  <motion.div
                                    initial={{ opacity: 0, x: -5 }}
                                    whileHover={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ArrowRight className="h-4 w-4 text-red-400" />
                                  </motion.div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Search Results */}
                      {suggestions.length > 0 && (
                        <div className="p-2">
                          {suggestions.map((suggestion, index) => (
                            <motion.div
                              key={suggestion.id}
                              initial={{ opacity: 0, x: -20, scale: 0.95 }}
                              animate={{
                                opacity: 1,
                                x: 0,
                                scale: 1,
                                transition: {
                                  delay: index * 0.05,
                                  duration: 0.3,
                                  ease: [0.25, 0.1, 0.25, 1],
                                },
                              }}
                              whileHover={{
                                scale: 1.02,
                                x: 8,
                                backgroundColor: "#f8fafc",
                                transition: { duration: 0.2 },
                              }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                console.log(
                                  "📍 Place selected:",
                                  suggestion.name,
                                );
                                handlePlaceSelect(suggestion);
                              }}
                              className="group flex items-center gap-3 p-4 hover:bg-blue-50 cursor-pointer rounded-xl border border-transparent hover:border-blue-200 transition-all duration-200"
                            >
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                {getSuggestionIcon(
                                  suggestion.icon,
                                  suggestion.type,
                                )}
                              </motion.div>

                              <div className="flex-1 min-w-0">
                                <motion.div
                                  className="font-medium text-gray-900 truncate group-hover:text-blue-900"
                                  initial={{ opacity: 0.8 }}
                                  whileHover={{ opacity: 1 }}
                                >
                                  {suggestion.name}
                                </motion.div>
                                <motion.div
                                  className="text-sm text-gray-500 truncate group-hover:text-blue-600"
                                  initial={{ opacity: 0.7 }}
                                  whileHover={{ opacity: 1 }}
                                >
                                  {suggestion.address}
                                </motion.div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Emergency Service Indicator */}
                                {suggestion.emergencyInfo
                                  ?.isEmergencyService && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1 + index * 0.05 }}
                                    className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                                    title="Emergency Service"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    SOS
                                  </motion.div>
                                )}

                                {/* 24/7 Indicator */}
                                {suggestion.emergencyInfo?.is24Hours && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.15 + index * 0.05 }}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                                    title="Open 24/7"
                                  >
                                    <Clock className="h-3 w-3" />
                                    24/7
                                  </motion.div>
                                )}

                                {suggestion.rating && (
                                  <motion.div
                                    className="flex items-center gap-1"
                                    whileHover={{ scale: 1.1 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 300,
                                    }}
                                  >
                                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                    <span className="text-xs text-gray-600 font-medium">
                                      {suggestion.rating}
                                    </span>
                                  </motion.div>
                                )}

                                {suggestion.type === "recent" && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 + index * 0.05 }}
                                  >
                                    <Badge
                                      variant="secondary"
                                      className="text-xs bg-blue-100 text-blue-700"
                                    >
                                      Recent
                                    </Badge>
                                  </motion.div>
                                )}

                                {suggestion.type === "favorite" && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 + index * 0.05 }}
                                    whileHover={{ scale: 1.2 }}
                                  >
                                    <Badge
                                      variant="secondary"
                                      className="text-xs text-yellow-600 bg-yellow-100"
                                    >
                                      ★
                                    </Badge>
                                  </motion.div>
                                )}

                                <motion.div
                                  initial={{ opacity: 0, x: -5 }}
                                  whileHover={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Navigation2 className="h-4 w-4 text-blue-400" />
                                </motion.div>

                                {/* Add to favorites button */}
                                {suggestion.type !== "favorite" && (
                                  <motion.button
                                    initial={{ opacity: 0, scale: 0 }}
                                    whileHover={{ opacity: 1, scale: 1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToFavorites(suggestion);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-yellow-100"
                                    title="Add to favorites"
                                  >
                                    <Star className="h-3 w-3 text-yellow-500" />
                                  </motion.button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* No Results */}
                      {suggestions.length === 0 &&
                        searchQuery !== "" &&
                        !isSearching && (
                          <div className="p-8 text-center text-gray-500">
                            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <div className="text-sm">No places found</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Try a different search term
                            </div>
                          </div>
                        )}
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* Click outside to close */}
      {isExpanded && showSuggestions && (
        <div className="fixed inset-0 z-40" onClick={handleCollapse} />
      )}
    </div>
  );
}

export default ExpandableSearchBar;
