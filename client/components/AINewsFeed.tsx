import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  AlertTriangle,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-device-apis";
import type { NewsItem } from "@/services/aiNewsAnalysis";

export function AINewsFeed() {
  const { location } = useGeolocation();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (location) {
      fetchRelevantNews();
    }
  }, [location]);

  const fetchRelevantNews = async () => {
    if (!location) return;

    setIsLoading(true);
    try {
      const { aiNewsAnalysis } = await import("@/services/aiNewsAnalysis");
      const relevantNews = await aiNewsAnalysis.getRecentNewsForLocation(
        location.latitude,
        location.longitude,
      );

      setNews(relevantNews);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: NewsItem["category"]) => {
    switch (category) {
      case "crime":
        return <AlertTriangle className="h-4 w-4" />;
      case "safety":
        return <Shield className="h-4 w-4" />;
      case "emergency":
        return <AlertTriangle className="h-4 w-4" />;
      case "traffic":
        return <MapPin className="h-4 w-4" />;
      default:
        return <Newspaper className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (
    category: NewsItem["category"],
    severity: NewsItem["severity"],
  ) => {
    if (severity === "critical")
      return "text-red-600 bg-red-100 border-red-200";
    if (severity === "high")
      return "text-orange-600 bg-orange-100 border-orange-200";

    switch (category) {
      case "crime":
        return "text-red-600 bg-red-100 border-red-200";
      case "safety":
        return "text-green-600 bg-green-100 border-green-200";
      case "emergency":
        return "text-orange-600 bg-orange-100 border-orange-200";
      case "traffic":
        return "text-blue-600 bg-blue-100 border-blue-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getSafetyImpactIcon = (impact: number) => {
    if (impact > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (impact < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffMinutes = Math.floor(diffMs / (60 * 1000));

    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return "Just now";
  };

  if (!location) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="font-semibold mb-2">Location Required</h3>
          <p className="text-sm text-gray-600">
            Enable location services to view relevant safety news for your area.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-blue-600" />
            AI Safety News
          </CardTitle>
          <Button
            onClick={fetchRelevantNews}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="h-6 px-2"
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
        {lastUpdate && (
          <p className="text-xs text-gray-500">
            Updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence>
          {news.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <div className="text-sm text-gray-500">
                {isLoading
                  ? "Analyzing news for your area..."
                  : "No relevant news found for your location."}
              </div>
            </motion.div>
          ) : (
            news.slice(0, 5).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200 hover:shadow-md",
                  getCategoryColor(item.category, item.severity),
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium leading-tight line-clamp-2">
                        {item.title}
                      </h4>
                      {getSafetyImpactIcon(item.safetyImpact)}
                    </div>

                    <p className="text-xs opacity-90 leading-relaxed mb-2 line-clamp-2">
                      {item.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-white/50 border-current/20"
                        >
                          {item.source}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-white/50 border-current/20 capitalize"
                        >
                          {item.severity}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs opacity-75">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(item.timestamp)}
                      </div>
                    </div>

                    {item.location.radius && (
                      <div className="mt-2 text-xs opacity-75">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        Within {item.location.radius}km of your location
                      </div>
                    )}

                    {item.safetyImpact !== 0 && (
                      <div className="mt-2 text-xs">
                        Safety Impact: {item.safetyImpact > 0 ? "+" : ""}
                        {item.safetyImpact} points
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
