import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bug,
  Eye,
  EyeOff,
  RefreshCw,
  MapPin,
  Navigation,
  Shield,
} from "lucide-react";

interface DebugPanelProps {
  currentLocation: any;
  destination: any;
  isNavigating: boolean;
  selectedPlace: any;
  toLocation: string;
  safetyScore: number;
  directionsResult: any;
  mapInstance: any;
}

export function DebugPanel({
  currentLocation,
  destination,
  isNavigating,
  selectedPlace,
  toLocation,
  safetyScore,
  directionsResult,
  mapInstance,
}: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  const testLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("✅ Test location success:", position);
        alert(
          `Location: ${position.coords.latitude}, ${position.coords.longitude}`,
        );
      },
      (error) => {
        console.error("❌ Test location failed:", error);
        alert(`Location error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const testAPI = async () => {
    try {
      const response = await fetch("/api/ping");
      const data = await response.json();
      console.log("✅ API test success:", data);
      alert(`API Response: ${data.message}`);
    } catch (error) {
      console.error("❌ API test failed:", error);
      alert(`API Error: ${error}`);
    }
  };

  const testSuggestions = () => {
    console.log("🔍 Testing autocomplete suggestions manually");
    const event = new Event("input", { bubbles: true });
    const input = document.querySelector('input[placeholder*="destination"]');
    if (input) {
      (input as HTMLInputElement).value = "test";
      input.dispatchEvent(event);
      console.log("✅ Triggered input event on destination field");
    } else {
      console.error("❌ Could not find destination input field");
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        size="sm"
        className="fixed bottom-4 left-4 z-[9999] bg-red-500 hover:bg-red-600"
      >
        <Bug className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 z-[9999] bg-white p-4 shadow-lg max-w-md max-h-96 overflow-y-auto">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug Panel
          </h3>
          <Button
            onClick={() => setIsVisible(false)}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>

        {/* Current State */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700">Current State</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Location:</span>
              <Badge variant={currentLocation ? "default" : "destructive"}>
                {currentLocation ? "✅" : "❌"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Map:</span>
              <Badge variant={mapInstance ? "default" : "destructive"}>
                {mapInstance ? "✅" : "❌"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Destination:</span>
              <Badge variant={destination ? "default" : "destructive"}>
                {destination ? "✅" : "❌"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Navigating:</span>
              <Badge variant={isNavigating ? "default" : "secondary"}>
                {isNavigating ? "YES" : "NO"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Route:</span>
              <Badge variant={directionsResult ? "default" : "destructive"}>
                {directionsResult ? "✅" : "❌"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Data Values */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700">Data Values</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div>Input: "{toLocation}"</div>
            <div>Selected: {selectedPlace?.name || "None"}</div>
            <div>Safety: {safetyScore}/100</div>
            {currentLocation && (
              <div>
                Coords: {currentLocation.latitude?.toFixed(4)},{" "}
                {currentLocation.longitude?.toFixed(4)}
              </div>
            )}
          </div>
        </div>

        {/* Test Buttons */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700">Tests</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={testLocation} size="sm" className="text-xs h-7">
              <MapPin className="h-3 w-3 mr-1" />
              Location
            </Button>
            <Button onClick={testAPI} size="sm" className="text-xs h-7">
              <RefreshCw className="h-3 w-3 mr-1" />
              API
            </Button>
            <Button onClick={testSuggestions} size="sm" className="text-xs h-7">
              <Eye className="h-3 w-3 mr-1" />
              Suggestions
            </Button>
            <Button
              onClick={() => window.location.reload()}
              size="sm"
              className="text-xs h-7"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reload
            </Button>
          </div>
        </div>

        {/* Console Commands */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-gray-700">Console</h4>
          <div className="text-xs text-gray-500">
            Check browser console for detailed logs
          </div>
        </div>
      </div>
    </Card>
  );
}

export default DebugPanel;
