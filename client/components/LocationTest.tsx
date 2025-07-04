import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useGeolocation } from "@/hooks/use-device-apis";

export function LocationTest() {
  const { location, error, isTracking, getCurrentLocation, requestPermission } =
    useGeolocation();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const runLocationTest = async () => {
    addTestResult("🧪 Starting location test...");

    try {
      // Test 1: Check geolocation support
      if (!navigator.geolocation) {
        addTestResult("❌ Geolocation not supported");
        return;
      }
      addTestResult("✅ Geolocation API available");

      // Test 2: Request permission
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        addTestResult(`ℹ️ Permission status: ${permission.state}`);
      } catch (e) {
        addTestResult("⚠️ Permissions API not available");
      }

      // Test 3: Get current location
      addTestResult("🔍 Requesting current location...");
      const loc = await getCurrentLocation();
      addTestResult(
        `✅ Location obtained: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`,
      );
      addTestResult(`📍 Accuracy: ±${Math.round(loc.accuracy)}m`);
    } catch (err: any) {
      addTestResult(`❌ Location test failed: ${err.message}`);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status:</span>
            <Badge
              variant={
                location ? "default" : error ? "destructive" : "secondary"
              }
            >
              {location ? "Location Found" : error ? "Error" : "Waiting"}
            </Badge>
          </div>

          {location && (
            <div className="text-xs font-mono bg-muted p-2 rounded">
              Lat: {location.latitude.toFixed(6)}
              <br />
              Lng: {location.longitude.toFixed(6)}
              <br />
              Accuracy: ±{Math.round(location.accuracy)}m<br />
              Tracking: {isTracking ? "Yes" : "No"}
            </div>
          )}

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Test Controls */}
        <div className="flex gap-2">
          <Button size="sm" onClick={runLocationTest} className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Run Test
          </Button>
          <Button size="sm" variant="outline" onClick={requestPermission}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Request Permission
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Test Results:</span>
            <div className="max-h-40 overflow-y-auto text-xs font-mono bg-muted p-2 rounded space-y-1">
              {testResults.map((result, index) => (
                <div key={index}>{result}</div>
              ))}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTestResults([])}
              className="w-full h-6 text-xs"
            >
              Clear Results
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LocationTest;
