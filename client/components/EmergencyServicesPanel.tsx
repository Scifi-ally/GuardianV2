import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Star,
  Route,
  Shield,
  RefreshCw,
  Clock,
  Building2,
  Zap,
  Filter,
  AlertTriangle,
  ChevronRight,
  Locate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  emergencyServicesLocator,
  type EmergencyService,
} from "@/services/emergencyServicesLocator";
import { unifiedNotifications } from "@/services/unifiedNotificationService";

interface EmergencyServicesPanelProps {
  location?: { latitude: number; longitude: number };
  onNavigateToService?: (service: EmergencyService) => void;
  className?: string;
}

export function EmergencyServicesPanel({
  location,
  onNavigateToService,
  className,
}: EmergencyServicesPanelProps) {
  const [services, setServices] = useState<EmergencyService[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState(
    emergencyServicesLocator.getDataSourceInfo(),
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "hospital",
    "police",
    "fire_station",
  ]);

  const serviceTypes = [
    {
      id: "hospital",
      label: "Hospitals",
      icon: Building2,
      color: "#dc2626",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      description: "Emergency medical care",
    },
    {
      id: "police",
      label: "Police",
      icon: Shield,
      color: "#2563eb",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      description: "Law enforcement",
    },
    {
      id: "fire_station",
      label: "Fire Dept",
      icon: Zap,
      color: "#ea580c",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
      description: "Fire & rescue services",
    },
    {
      id: "pharmacy",
      label: "Pharmacy",
      icon: Building2,
      color: "#16a34a",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      description: "Medical supplies",
    },
  ];

  useEffect(() => {
    if (location) {
      loadNearbyServices();
    }
  }, [location, selectedTypes]);

  const loadNearbyServices = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const nearbyServices = await emergencyServicesLocator.findNearbyServices(
        location,
        selectedTypes,
        20000, // 20km radius
      );

      // Sort by type priority then distance
      const typePriority = {
        hospital: 1,
        police: 2,
        fire_station: 3,
        pharmacy: 4,
      };
      const sortedServices = nearbyServices.sort((a, b) => {
        const aPriority = typePriority[a.type] || 999;
        const bPriority = typePriority[b.type] || 999;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return (a.distance || 0) - (b.distance || 0);
      });

      setServices(sortedServices);
      setDataSourceInfo(emergencyServicesLocator.getDataSourceInfo());
    } catch (error) {
      console.error("Failed to load emergency services:", error);
      unifiedNotifications.error("Failed to load services", {
        message: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToService = (service: EmergencyService) => {
    try {
      console.log(`🧭 Starting navigation to ${service.name}`);

      if (onNavigateToService) {
        // Call the navigation handler from parent
        onNavigateToService(service);

        unifiedNotifications.success(`Navigation started`, {
          message: `Routing to ${service.name}`,
        });
      } else {
        console.error("Navigation handler not provided");
        unifiedNotifications.error("Navigation unavailable", {
          message: "Navigation system not ready",
        });
      }
    } catch (error) {
      console.error("Navigation failed:", error);
      unifiedNotifications.error("Navigation failed", {
        message: "Please try again",
      });
    }
  };

  const getServiceTypeConfig = (type: string) => {
    return serviceTypes.find((t) => t.id === type) || serviceTypes[0];
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "hospital":
        return "🏥";
      case "police":
        return "🚔";
      case "fire_station":
        return "🚒";
      case "pharmacy":
        return "💊";
      default:
        return "🏥";
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-red-50 to-blue-50 border border-red-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Emergency Services
              </h2>
              <p className="text-sm text-gray-600">
                Find nearby emergency facilities
              </p>
            </div>
          </div>
          <Badge
            variant={dataSourceInfo.isReal ? "default" : "secondary"}
            className={cn(
              "px-3 py-1",
              dataSourceInfo.isReal
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-amber-100 text-amber-800 border-amber-200",
            )}
          >
            {dataSourceInfo.isReal ? "🔴 Live" : "📋 Demo"}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Locate className="h-3 w-3" />
          {dataSourceInfo.message}
        </p>
      </div>

      {/* Service Type Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Filter Services
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadNearbyServices}
              disabled={loading}
              className="ml-auto h-7 px-2"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {serviceTypes.map((type) => {
              const isSelected = selectedTypes.includes(type.id);
              const Icon = type.icon;

              return (
                <Button
                  key={type.id}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setSelectedTypes((prev) =>
                      prev.includes(type.id)
                        ? prev.filter((id) => id !== type.id)
                        : [...prev, type.id],
                    );
                  }}
                  className={cn(
                    "h-12 justify-start gap-2 border p-2",
                    isSelected
                      ? `${type.bgColor} ${type.borderColor} ${type.textColor} border-2`
                      : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: type.color }}
                  />
                  <div className="text-left min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">
                      {type.label}
                    </div>
                    <div className="text-xs opacity-70 truncate">
                      {type.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Location Status */}
      {!location && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center">
            <Locate className="h-12 w-12 mx-auto mb-3 text-amber-600" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2">
              Location Required
            </h3>
            <p className="text-sm text-amber-700">
              Please enable location access to find nearby emergency services
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
              <div className="relative w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-white animate-spin" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-blue-800 mb-1">
              Searching
            </h3>
            <p className="text-sm text-blue-700">
              Finding emergency services nearby...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Services Grid */}
      {services.length > 0 && (
        <div className="space-y-3">
          {services.map((service) => {
            const typeConfig = getServiceTypeConfig(service.type);
            const Icon = typeConfig.icon;

            return (
              <Card
                key={service.id}
                className="border-0 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden emergency-service-card"
              >
                <CardContent className="p-0">
                  {/* Service Header */}
                  <div
                    className={cn("h-2", typeConfig.bgColor)}
                    style={{ backgroundColor: typeConfig.color }}
                  ></div>

                  <div className="p-4">
                    {/* Service Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                          style={{ backgroundColor: typeConfig.color + "20" }}
                        >
                          {getServiceIcon(service.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 max-w-full">
                            <h3 className="font-semibold text-gray-900 truncate flex-1 text-sm emergency-service-title">
                              {service.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs shrink-0 px-2 py-0.5",
                                typeConfig.textColor,
                                typeConfig.borderColor,
                              )}
                            >
                              {typeConfig.label}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 flex items-start gap-1 mb-2 leading-tight">
                            <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <span className="break-words line-clamp-2 emergency-service-address">
                              {service.address}
                            </span>
                          </p>

                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                            {service.distance && (
                              <span className="flex items-center gap-1 shrink-0">
                                <Navigation className="h-3 w-3" />
                                {emergencyServicesLocator.formatDistance(
                                  service.distance,
                                )}
                              </span>
                            )}

                            {service.rating && (
                              <span className="flex items-center gap-1 shrink-0">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {service.rating.toFixed(1)}
                              </span>
                            )}

                            <span className="flex items-center gap-1 text-green-600 shrink-0">
                              <Clock className="h-3 w-3" />
                              {service.open24Hours || service.emergencyOnly
                                ? "24/7"
                                : "Open"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleNavigateToService(service)}
                      className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-sm text-sm"
                      size="lg"
                    >
                      <Route className="h-4 w-4 mr-2 shrink-0" />
                      <span className="truncate">
                        Navigate to {typeConfig.label.slice(0, -1)}
                      </span>
                      <ChevronRight className="h-4 w-4 ml-2 shrink-0" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {services.length === 0 && !loading && location && (
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Services Found
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              No emergency services found in your area. Try expanding your
              search.
            </p>
            <Button variant="outline" onClick={loadNearbyServices}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Search Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      {services.length > 0 && (
        <Card className="border-0 bg-gray-50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>
                Found {services.length} emergency services within 20km
              </span>
            </div>
            {!dataSourceInfo.isReal && (
              <p className="text-xs text-amber-600 mt-2">
                💡 Real location data will show actual emergency services
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
