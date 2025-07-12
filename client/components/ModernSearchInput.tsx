import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Navigation,
  Clock,
  Star,
  Zap,
  Target,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  title: string;
  subtitle: string;
  type: "recent" | "popular" | "nearby" | "current";
  icon: typeof MapPin;
  coordinates?: { lat: number; lng: number };
}

interface ModernSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (
    location: string,
    coordinates?: { lat: number; lng: number },
  ) => void;
  placeholder?: string;
  icon?: typeof Search;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ModernSearchInput({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Where would you like to go?",
  icon: Icon = Search,
  isLoading = false,
  disabled = false,
  className,
}: ModernSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock suggestions - replace with real API calls
  const mockSuggestions: SearchSuggestion[] = [
    {
      id: "current",
      title: "Use Current Location",
      subtitle: "Your current position",
      type: "current",
      icon: Target,
    },
    {
      id: "home",
      title: "Home",
      subtitle: "123 Main Street, Your City",
      type: "recent",
      icon: Star,
      coordinates: { lat: 37.7749, lng: -122.4194 },
    },
    {
      id: "work",
      title: "Work",
      subtitle: "456 Business Ave, Downtown",
      type: "recent",
      icon: Clock,
      coordinates: { lat: 37.7849, lng: -122.4094 },
    },
    {
      id: "coffee",
      title: "Starbucks Coffee",
      subtitle: "2 blocks away • Popular destination",
      type: "nearby",
      icon: MapPin,
      coordinates: { lat: 37.7649, lng: -122.4294 },
    },
    {
      id: "mall",
      title: "Shopping Mall",
      subtitle: "10 min drive • Trending now",
      type: "popular",
      icon: Zap,
      coordinates: { lat: 37.7949, lng: -122.3994 },
    },
  ];

  useEffect(() => {
    if (isFocused) {
      // Simulate API search with loading
      setIsSearching(true);
      const timer = setTimeout(
        () => {
          if (value.trim()) {
            // Filter suggestions based on input
            const filtered = mockSuggestions.filter(
              (suggestion) =>
                suggestion.title.toLowerCase().includes(value.toLowerCase()) ||
                suggestion.subtitle.toLowerCase().includes(value.toLowerCase()),
            );
            setSuggestions(filtered);
          } else {
            setSuggestions(mockSuggestions);
          }
          setIsSearching(false);
        },
        value ? 300 : 100,
      );

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [value, isFocused]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "current") {
      onLocationSelect("Current Location");
    } else {
      onLocationSelect(suggestion.title, suggestion.coordinates);
    }
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const clearInput = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "current":
        return "text-blue-600";
      case "recent":
        return "text-purple-600";
      case "nearby":
        return "text-green-600";
      case "popular":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "current":
        return "Current";
      case "recent":
        return "Recent";
      case "nearby":
        return "Nearby";
      case "popular":
        return "Popular";
      default:
        return "";
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Search Input Container */}
      <motion.div
        layout
        className={cn(
          "relative overflow-hidden transition-all duration-300 ease-out",
          "bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border",
          isFocused
            ? "border-blue-200 shadow-2xl ring-4 ring-blue-50"
            : "border-gray-200 hover:border-gray-300",
        )}
        whileHover={{ scale: isFocused ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Animated Background Gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 opacity-0"
          animate={{
            opacity: isFocused ? 1 : 0,
            x: isFocused ? [0, 100, 0] : 0,
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative flex items-center p-4">
          {/* Search Icon */}
          <motion.div
            className="mr-3 flex-shrink-0"
            animate={{
              scale: isFocused ? 1.1 : 1,
              rotate: isSearching ? 360 : 0,
            }}
            transition={{
              scale: { duration: 0.2 },
              rotate: { duration: 1, repeat: isSearching ? Infinity : 0 },
            }}
          >
            {isLoading || isSearching ? (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            ) : (
              <Icon
                className={cn(
                  "h-5 w-5",
                  isFocused ? "text-blue-500" : "text-gray-400",
                )}
              />
            )}
          </motion.div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "flex-1 bg-transparent border-none outline-none",
              "text-gray-900 placeholder-gray-500",
              "text-lg font-medium tracking-wide",
              disabled && "cursor-not-allowed opacity-50",
            )}
          />

          {/* Clear Button */}
          <AnimatePresence>
            {value && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearInput}
                className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Loading Bar */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 origin-left"
              style={{ width: "100%" }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {isSearching ? (
                <div className="p-6 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="inline-block"
                  >
                    <Loader2 className="h-6 w-6 text-blue-500" />
                  </motion.div>
                  <p className="mt-2 text-gray-600">Searching locations...</p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {suggestions.map((suggestion, index) => {
                    const SuggestionIcon = suggestion.icon;
                    return (
                      <motion.button
                        key={suggestion.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 group"
                      >
                        {/* Icon */}
                        <motion.div
                          className={cn(
                            "p-2 rounded-xl transition-all duration-200",
                            "group-hover:scale-110 group-hover:shadow-lg",
                            suggestion.type === "current" && "bg-blue-100",
                            suggestion.type === "recent" && "bg-purple-100",
                            suggestion.type === "nearby" && "bg-green-100",
                            suggestion.type === "popular" && "bg-orange-100",
                          )}
                          whileHover={{ rotate: [0, -5, 5, 0] }}
                        >
                          <SuggestionIcon
                            className={cn(
                              "h-4 w-4",
                              getTypeColor(suggestion.type),
                            )}
                          />
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {suggestion.title}
                            </h3>
                            <motion.span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                suggestion.type === "current" &&
                                  "bg-blue-100 text-blue-700",
                                suggestion.type === "recent" &&
                                  "bg-purple-100 text-purple-700",
                                suggestion.type === "nearby" &&
                                  "bg-green-100 text-green-700",
                                suggestion.type === "popular" &&
                                  "bg-orange-100 text-orange-700",
                              )}
                              whileHover={{ scale: 1.05 }}
                            >
                              {getTypeLabel(suggestion.type)}
                            </motion.span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {suggestion.subtitle}
                          </p>
                        </div>

                        {/* Arrow */}
                        <motion.div
                          className="text-gray-400 group-hover:text-blue-500 transition-colors"
                          whileHover={{ x: 5 }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.div>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No locations found</p>
                    <p className="text-sm mt-1">
                      Try searching for a different location
                    </p>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
