import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Hospital,
  Car,
  Phone,
  Users,
  Eye,
  Activity,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmergencyService {
  id: string;
  name: string;
  type: "police" | "hospital" | "fire" | "pharmacy";
  lat: number;
  lng: number;
  distance: number;
  phone?: string;
  isOpen: boolean;
}

interface SafetyArea {
  id: string;
  name: string;
  type: "safe_zone" | "danger_zone" | "neutral";
  lat: number;
  lng: number;
  radius: number;
  score: number;
  lastUpdated: number;
}

interface TrafficInfo {
  severity: "light" | "moderate" | "heavy" | "severe";
  incidents: Array<{
    type: "accident" | "construction" | "closure";
    description: string;
    lat: number;
    lng: number;
  }>;
  avgSpeed: number;
  travelTime: string;
}

interface RealTimeMapFeaturesProps {
  map: google.maps.Map | null;
  currentLocation: { latitude: number; longitude: number } | null;
  onFeatureUpdate?: (feature: string, data: any) => void;
}

export function RealTimeMapFeatures({
  map,
  currentLocation,
  onFeatureUpdate,
}: RealTimeMapFeaturesProps) {
  const [emergencyServices, setEmergencyServices] = useState<
    EmergencyService[]
  >([]);
  const [safetyAreas, setSafetyAreas] = useState<SafetyArea[]>([]);
  const [trafficInfo, setTrafficInfo] = useState<TrafficInfo | null>(null);
  const [activeFeatures, setActiveFeatures] = useState({
    emergency: true,
    safety: true,
    traffic: true,
  });
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [circles, setCircles] = useState<google.maps.Circle[]>([]);

  // Load emergency services near current location
  const loadEmergencyServices = useCallback(async () => {
    if (!currentLocation) return;

    try {
      console.log("🚑 Loading emergency services...");

      // Simulate real emergency services API
      const mockServices: EmergencyService[] = [
        {
          id: "police_1",
          name: "Central Police Station",
          type: "police",
          lat: currentLocation.latitude + 0.005,
          lng: currentLocation.longitude + 0.003,
          distance: 650,
          phone: "911",
          isOpen: true,
        },
        {
          id: "hospital_1",
          name: "City General Hospital",
          type: "hospital",
          lat: currentLocation.latitude - 0.008,
          lng: currentLocation.longitude + 0.012,
          distance: 1200,
          phone: "911",
          isOpen: true,
        },
        {
          id: "fire_1",
          name: "Fire Station 12",
          type: "fire",
          lat: currentLocation.latitude + 0.012,
          lng: currentLocation.longitude - 0.007,
          distance: 890,
          phone: "911",
          isOpen: true,
        },
        {
          id: "pharmacy_1",
          name: "24/7 Pharmacy",
          type: "pharmacy",
          lat: currentLocation.latitude - 0.003,
          lng: currentLocation.longitude + 0.008,
          distance: 420,
          phone: "(555) 123-4567",
          isOpen: true,
        },
      ];

      setEmergencyServices(mockServices);
      onFeatureUpdate?.("emergency", mockServices);
      console.log(`✅ Loaded ${mockServices.length} emergency services`);
    } catch (error) {
      console.error("❌ Failed to load emergency services:", error);
    }
  }, [currentLocation, onFeatureUpdate]);

  // Load safety areas
  const loadSafetyAreas = useCallback(async () => {
    if (!currentLocation) return;

    try {
      console.log("🛡️ Loading safety areas...");

      const mockAreas: SafetyArea[] = [
        {
          id: "safe_1",
          name: "University Campus",
          type: "safe_zone",
          lat: currentLocation.latitude + 0.015,
          lng: currentLocation.longitude + 0.01,
          radius: 800,
          score: 92,
          lastUpdated: Date.now(),
        },
        {
          id: "safe_2",
          name: "Shopping District",
          type: "safe_zone",
          lat: currentLocation.latitude - 0.01,
          lng: currentLocation.longitude - 0.005,
          radius: 600,
          score: 88,
          lastUpdated: Date.now(),
        },
        {
          id: "danger_1",
          name: "Construction Zone",
          type: "danger_zone",
          lat: currentLocation.latitude + 0.008,
          lng: currentLocation.longitude + 0.015,
          radius: 300,
          score: 35,
          lastUpdated: Date.now(),
        },
      ];

      setSafetyAreas(mockAreas);
      onFeatureUpdate?.("safety", mockAreas);
      console.log(`✅ Loaded ${mockAreas.length} safety areas`);
    } catch (error) {
      console.error("❌ Failed to load safety areas:", error);
    }
  }, [currentLocation, onFeatureUpdate]);

  // Load traffic information
  const loadTrafficInfo = useCallback(async () => {
    if (!currentLocation) return;

    try {
      console.log("🚗 Loading traffic information...");

      const mockTraffic: TrafficInfo = {
        severity:
          Math.random() > 0.7
            ? "heavy"
            : Math.random() > 0.4
              ? "moderate"
              : "light",
        incidents: [
          {
            type: "construction",
            description: "Road work on Main St",
            lat: currentLocation.latitude + 0.005,
            lng: currentLocation.longitude - 0.008,
          },
          {
            type: "accident",
            description: "Minor accident reported",
            lat: currentLocation.latitude - 0.012,
            lng: currentLocation.longitude + 0.006,
          },
        ],
        avgSpeed: 25 + Math.random() * 20,
        travelTime: `${Math.floor(Math.random() * 15) + 5} min`,
      };

      setTrafficInfo(mockTraffic);
      onFeatureUpdate?.("traffic", mockTraffic);
      console.log("✅ Loaded traffic information");
    } catch (error) {
      console.error("❌ Failed to load traffic info:", error);
    }
  }, [currentLocation, onFeatureUpdate]);

  // Render emergency service markers
  const renderEmergencyMarkers = useCallback(() => {
    if (!map || !activeFeatures.emergency) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    emergencyServices.forEach((service) => {
      const getIcon = (type: string) => {
        const colors = {
          police: "#1E40AF", // Blue
          hospital: "#DC2626", // Red
          fire: "#EF4444", // Red
          pharmacy: "#059669", // Green
        };
        const symbols = {
          police: "👮",
          hospital: "🏥",
          fire: "🚒",
          pharmacy: "💊",
        };

        return {
          url: `data:image/svg+xml,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="${colors[type as keyof typeof colors]}" stroke="white" stroke-width="3"/>
              <text x="16" y="20" text-anchor="middle" font-size="12" fill="white">${symbols[type as keyof typeof symbols]}</text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        };
      };

      const marker = new google.maps.Marker({
        position: { lat: service.lat, lng: service.lng },
        map,
        title: `${service.name} (${service.distance}m)`,
        icon: getIcon(service.type),
        zIndex: 1000,
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-xs">
            <h3 class="font-semibold text-gray-800 mb-2">${service.name}</h3>
            <div class="space-y-1 text-sm text-gray-600">
              <div>📍 ${service.distance}m away</div>
              <div>📞 ${service.phone}</div>
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full ${service.isOpen ? "bg-green-500" : "bg-red-500"}"></div>
                ${service.isOpen ? "Open now" : "Closed"}
              </div>
            </div>
            <button onclick="window.location.href='tel:${service.phone}'" 
                    class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm">
              Call Now
            </button>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
  }, [map, emergencyServices, activeFeatures.emergency, markers]);

  // Render safety area circles
  const renderSafetyAreas = useCallback(() => {
    if (!map || !activeFeatures.safety) return;

    // Clear existing circles
    circles.forEach((circle) => circle.setMap(null));
    const newCircles: google.maps.Circle[] = [];

    safetyAreas.forEach((area) => {
      const getColor = (type: string, score: number) => {
        if (type === "safe_zone") return "#10B981"; // Green
        if (type === "danger_zone") return "#EF4444"; // Red
        return score > 70 ? "#10B981" : score > 40 ? "#F59E0B" : "#EF4444"; // Green/Yellow/Red
      };

      const circle = new google.maps.Circle({
        strokeColor: getColor(area.type, area.score),
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: getColor(area.type, area.score),
        fillOpacity: 0.15,
        map,
        center: { lat: area.lat, lng: area.lng },
        radius: area.radius,
        zIndex: 500,
      });

      // Add click listener for area info
      circle.addListener("click", () => {
        const infoWindow = new google.maps.InfoWindow({
          position: { lat: area.lat, lng: area.lng },
          content: `
            <div class="p-3">
              <h3 class="font-semibold text-gray-800 mb-2">${area.name}</h3>
              <div class="space-y-1 text-sm">
                <div>Safety Score: <span class="font-semibold">${area.score}/100</span></div>
                <div>Radius: ${area.radius}m</div>
                <div>Type: ${area.type.replace("_", " ").toUpperCase()}</div>
              </div>
            </div>
          `,
        });
        infoWindow.open(map);
      });

      newCircles.push(circle);
    });

    setCircles(newCircles);
  }, [map, safetyAreas, activeFeatures.safety, circles]);

  // Load all data when location changes
  useEffect(() => {
    if (currentLocation) {
      loadEmergencyServices();
      loadSafetyAreas();
      loadTrafficInfo();
    }
  }, [
    currentLocation,
    loadEmergencyServices,
    loadSafetyAreas,
    loadTrafficInfo,
  ]);

  // Render markers when data changes
  useEffect(() => {
    renderEmergencyMarkers();
  }, [renderEmergencyMarkers]);

  useEffect(() => {
    renderSafetyAreas();
  }, [renderSafetyAreas]);

  // Toggle feature visibility
  const toggleFeature = (feature: keyof typeof activeFeatures) => {
    setActiveFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));

    if (feature === "emergency") {
      if (!activeFeatures.emergency) {
        renderEmergencyMarkers();
      } else {
        markers.forEach((marker) => marker.setMap(null));
        setMarkers([]);
      }
    }

    if (feature === "safety") {
      if (!activeFeatures.safety) {
        renderSafetyAreas();
      } else {
        circles.forEach((circle) => circle.setMap(null));
        setCircles([]);
      }
    }
  };

  if (!map) return null;

  return (
    <div className="absolute top-20 left-4 z-[1000] max-w-sm">
      <Card className="bg-white/95 backdrop-blur-sm p-3 shadow-lg">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            Real-Time Features
          </h3>

          {/* Feature toggles */}
          <div className="space-y-2">
            <Button
              size="sm"
              variant={activeFeatures.emergency ? "default" : "outline"}
              onClick={() => toggleFeature("emergency")}
              className="w-full justify-start h-8 text-xs"
            >
              <Phone className="h-3 w-3 mr-2" />
              Emergency Services ({emergencyServices.length})
            </Button>

            <Button
              size="sm"
              variant={activeFeatures.safety ? "default" : "outline"}
              onClick={() => toggleFeature("safety")}
              className="w-full justify-start h-8 text-xs"
            >
              <Shield className="h-3 w-3 mr-2" />
              Safety Areas ({safetyAreas.length})
            </Button>

            <Button
              size="sm"
              variant={activeFeatures.traffic ? "default" : "outline"}
              onClick={() => toggleFeature("traffic")}
              className="w-full justify-start h-8 text-xs"
            >
              <Car className="h-3 w-3 mr-2" />
              Traffic Info
            </Button>
          </div>

          {/* Traffic status */}
          {activeFeatures.traffic && trafficInfo && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Traffic</span>
                <Badge
                  className={cn(
                    "text-xs px-2 py-0",
                    trafficInfo.severity === "light" &&
                      "bg-green-100 text-green-700",
                    trafficInfo.severity === "moderate" &&
                      "bg-yellow-100 text-yellow-700",
                    trafficInfo.severity === "heavy" &&
                      "bg-orange-100 text-orange-700",
                    trafficInfo.severity === "severe" &&
                      "bg-red-100 text-red-700",
                  )}
                >
                  {trafficInfo.severity.toUpperCase()}
                </Badge>
              </div>
              <div className="text-xs text-gray-600">
                Avg Speed: {Math.round(trafficInfo.avgSpeed)} km/h
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
            <div className="text-center">
              <div className="text-gray-500">Emergency</div>
              <div className="font-semibold">{emergencyServices.length}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Safe Zones</div>
              <div className="font-semibold">
                {safetyAreas.filter((a) => a.type === "safe_zone").length}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default RealTimeMapFeatures;
