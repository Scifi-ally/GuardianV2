import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Shield, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const safeZoneIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#22c55e" width="24" height="24">
      <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 22L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const emergencyIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" width="24" height="24">
      <path d="M1 21H23L12 2L1 21Z M13 18H11V16H13V18Z M13 14H11V10H13V14Z"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

interface SafetyLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "safe" | "emergency" | "police" | "hospital";
  distance?: number;
}

interface SafetyMapProps {
  userLocation?: { lat: number; lng: number };
  safetyLocations?: SafetyLocation[];
  showSafeZones?: boolean;
  showEmergencyServices?: boolean;
  onLocationSelect?: (location: SafetyLocation) => void;
  className?: string;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

export function SafetyMap({
  userLocation,
  safetyLocations = [],
  showSafeZones = true,
  showEmergencyServices = true,
  onLocationSelect,
  className,
}: SafetyMapProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([
    userLocation?.lat || 28.6139, // Default to New Delhi
    userLocation?.lng || 77.209,
  ]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (userLocation) {
      setCurrentLocation([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  };

  const mockSafetyLocations: SafetyLocation[] = [
    {
      id: "police1",
      name: "Police Station",
      lat: currentLocation[0] + 0.01,
      lng: currentLocation[1] + 0.01,
      type: "police",
    },
    {
      id: "hospital1",
      name: "General Hospital",
      lat: currentLocation[0] - 0.01,
      lng: currentLocation[1] + 0.015,
      type: "hospital",
    },
    {
      id: "safe1",
      name: "Safe Zone - Shopping Mall",
      lat: currentLocation[0] + 0.005,
      lng: currentLocation[1] - 0.008,
      type: "safe",
    },
  ];

  const allLocations = [...safetyLocations, ...mockSafetyLocations];

  return (
    <div
      className={cn(
        "relative h-full w-full rounded-lg overflow-hidden border",
        className,
      )}
    >
      {/* Custom Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <button
          onClick={handleGetLocation}
          className="bg-black/80 hover:bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-xl border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
        >
          <Navigation className="h-4 w-4" />
          My Location
        </button>
      </div>

      <MapContainer
        center={currentLocation}
        zoom={15}
        className="h-full w-full rounded-lg bw-map"
        whenReady={() => setMapReady(true)}
        style={{ background: "#000000" }}
        zoomControl={false}
        attributionControl={false}
      >
        <MapController center={currentLocation} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="bw-tiles"
        />

        {/* User Location */}
        <Marker position={currentLocation}>
          <Popup className="bw-popup">
            <div className="text-center p-2 bg-black text-white rounded">
              <MapPin className="h-4 w-4 mx-auto mb-2 text-white" />
              <strong>Your Location</strong>
              <p className="text-sm text-gray-300">You are here</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
