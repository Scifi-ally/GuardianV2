import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield, Locate, Layers, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface MockMapProps {
  location?: { latitude: number; longitude: number; accuracy?: number };
  emergencyContacts?: Array<{
    id: string;
    name: string;
    guardianKey: string;
    location?: { lat: number; lng: number };
  }>;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  className?: string;
}

export function MockMap({
  location,
  emergencyContacts = [],
  onLocationUpdate,
  className,
}: MockMapProps) {
  const [mapStyle, setMapStyle] = useState<
    "normal" | "dark" | "blackwhite" | "satellite"
  >("normal");
  const [zoom, setZoom] = useState(15);
  const [center, setCenter] = useState(
    location
      ? { lat: location.latitude, lng: location.longitude }
      : { lat: 37.7749, lng: -122.4194 },
  );
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(
    null,
  );

  // Update center when location changes
  useEffect(() => {
    if (location) {
      setCenter({ lat: location.latitude, lng: location.longitude });
    }
  }, [location]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) return; // Don't trigger click during panning

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixel coordinates to mock lat/lng
    const lat = center.lat + (rect.height / 2 - y) * 0.0001 * (21 - zoom);
    const lng = center.lng + (x - rect.width / 2) * 0.0001 * (21 - zoom);

    if (onLocationUpdate) {
      onLocationUpdate({ lat, lng });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start panning
      setLastTouch({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
      setIsPanning(false);
    } else if (e.touches.length === 2) {
      // Two touches - start pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2),
      );
      setLastPinchDistance(distance);
      setIsPanning(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent page scrolling

    if (e.touches.length === 1 && lastTouch) {
      // Single touch - pan the map
      const currentTouch = e.touches[0];
      const deltaX = currentTouch.clientX - lastTouch.x;
      const deltaY = currentTouch.clientY - lastTouch.y;

      // Only start panning if moved more than 5px to avoid accidental pans
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setIsPanning(true);

        // Calculate new center based on pan distance
        const panSensitivity = 0.00005 * (21 - zoom);
        setCenter((prev) => ({
          lat: prev.lat + deltaY * panSensitivity,
          lng: prev.lng - deltaX * panSensitivity,
        }));

        setLastTouch({
          x: currentTouch.clientX,
          y: currentTouch.clientY,
        });
      }
    } else if (e.touches.length === 2 && lastPinchDistance) {
      // Two touches - pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2),
      );

      const zoomDelta = (currentDistance - lastPinchDistance) * 0.01;
      const newZoom = Math.max(10, Math.min(20, zoom + zoomDelta));
      setZoom(newZoom);
      setLastPinchDistance(currentDistance);
    }
  };

  const handleTouchEnd = () => {
    setLastTouch(null);
    setLastPinchDistance(null);
    // Reset panning state after a short delay to allow click detection
    setTimeout(() => setIsPanning(false), 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setLastTouch({ x: e.clientX, y: e.clientY });
    setIsPanning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1 && lastTouch) {
      // Left mouse button is pressed - pan the map
      const deltaX = e.clientX - lastTouch.x;
      const deltaY = e.clientY - lastTouch.y;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setIsPanning(true);

        const panSensitivity = 0.00005 * (21 - zoom);
        setCenter((prev) => ({
          lat: prev.lat + deltaY * panSensitivity,
          lng: prev.lng - deltaX * panSensitivity,
        }));

        setLastTouch({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handleMouseUp = () => {
    setLastTouch(null);
    setTimeout(() => setIsPanning(false), 100);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.5 : 0.5;
    const newZoom = Math.max(10, Math.min(20, zoom + zoomDelta));
    setZoom(newZoom);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(newCenter);
          setZoom(16);

          if (onLocationUpdate) {
            onLocationUpdate(newCenter);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60000,
        },
      );
    }
  };

  const toggleMapStyle = () => {
    const styles = ["normal", "dark", "blackwhite", "satellite"] as const;
    const currentIndex = styles.indexOf(mapStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setMapStyle(styles[nextIndex]);
  };

  const zoomIn = () => setZoom(Math.min(20, zoom + 1));
  const zoomOut = () => setZoom(Math.max(10, zoom - 1));

  // Generate street-like pattern based on coordinates
  const generateStreetPattern = () => {
    const streets = [];
    const gridSize = 30;

    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const isStreet = i % 3 === 0 || j % 3 === 0;
        const isMainStreet = i % 6 === 0 || j % 6 === 0;

        let streetClass = "";
        switch (mapStyle) {
          case "dark":
            streetClass = isMainStreet
              ? "bg-slate-600/60"
              : isStreet
                ? "bg-slate-700/40"
                : "bg-slate-800/20";
            break;
          case "blackwhite":
            streetClass = isMainStreet
              ? "bg-black/30"
              : isStreet
                ? "bg-black/15"
                : "bg-black/5";
            break;
          case "satellite":
            streetClass = isMainStreet
              ? "bg-yellow-600/40"
              : isStreet
                ? "bg-green-800/30"
                : "bg-green-900/20";
            break;
          default:
            streetClass = isMainStreet
              ? "bg-muted/40"
              : isStreet
                ? "bg-muted/20"
                : "bg-muted/5";
        }

        streets.push(
          <div
            key={`${i}-${j}`}
            className={cn("absolute transition-all duration-300", streetClass)}
            style={{
              left: `${i * gridSize}px`,
              top: `${j * gridSize}px`,
              width: `${gridSize}px`,
              height: `${gridSize}px`,
            }}
          />,
        );
      }
    }
    return streets;
  };

  const getMapTheme = () => {
    switch (mapStyle) {
      case "dark":
        return "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900";
      case "blackwhite":
        return "bg-gradient-to-br from-gray-100 via-white to-gray-200";
      case "satellite":
        return "bg-gradient-to-br from-green-900 via-green-800 to-blue-900";
      default:
        return "bg-gradient-to-br from-slate-100 via-white to-slate-200";
    }
  };

  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      {/* Map Loading Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-safe/5 animate-pulse opacity-50 pointer-events-none" />

      {/* Mock Map Background */}
      <div
        className={cn(
          "absolute inset-0 w-full h-full transition-all duration-300 select-none",
          isPanning ? "cursor-grabbing" : "cursor-grab",
          getMapTheme(),
        )}
        onClick={handleMapClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        {/* Street Grid Pattern */}
        <div className="absolute inset-0 opacity-60">
          {generateStreetPattern()}
        </div>

        {/* Additional Map-like Features */}
        <div className="absolute inset-0">
          {/* Parks/Green Areas */}
          <div
            className={cn(
              "absolute w-20 h-16 rounded-lg transition-colors duration-300",
              mapStyle === "dark"
                ? "bg-green-900/40"
                : mapStyle === "blackwhite"
                  ? "bg-gray-400/60"
                  : mapStyle === "satellite"
                    ? "bg-green-600/80"
                    : "bg-green-200/60",
            )}
            style={{ top: "20%", left: "15%" }}
          />

          <div
            className={cn(
              "absolute w-16 h-20 rounded-lg transition-colors duration-300",
              mapStyle === "dark"
                ? "bg-green-900/40"
                : mapStyle === "blackwhite"
                  ? "bg-gray-400/60"
                  : mapStyle === "satellite"
                    ? "bg-green-600/80"
                    : "bg-green-200/60",
            )}
            style={{ bottom: "25%", right: "20%" }}
          />

          {/* Water Bodies */}
          <div
            className={cn(
              "absolute w-24 h-8 rounded-full transition-colors duration-300",
              mapStyle === "dark"
                ? "bg-blue-900/60"
                : mapStyle === "blackwhite"
                  ? "bg-gray-600/60"
                  : mapStyle === "satellite"
                    ? "bg-blue-700/80"
                    : "bg-blue-300/60",
            )}
            style={{ top: "60%", left: "10%" }}
          />

          {/* Buildings/POIs */}
          <div
            className={cn(
              "absolute w-3 h-3 rounded transition-colors duration-300",
              mapStyle === "dark"
                ? "bg-yellow-600/80"
                : mapStyle === "blackwhite"
                  ? "bg-black/80"
                  : mapStyle === "satellite"
                    ? "bg-orange-600/80"
                    : "bg-yellow-500/80",
            )}
            style={{ top: "30%", left: "40%" }}
          />

          <div
            className={cn(
              "absolute w-3 h-3 rounded transition-colors duration-300",
              mapStyle === "dark"
                ? "bg-red-600/80"
                : mapStyle === "blackwhite"
                  ? "bg-black/80"
                  : mapStyle === "satellite"
                    ? "bg-red-700/80"
                    : "bg-red-500/80",
            )}
            style={{ top: "70%", right: "35%" }}
          />
        </div>

        {/* User Location Marker */}
        {location && (
          <div
            className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: "50%",
              top: "50%",
            }}
          >
            <div className="relative">
              <div className="w-6 h-6 bg-primary rounded-full border-4 border-white shadow-2xl animate-pulse flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <div className="absolute inset-0 w-6 h-6 bg-primary/30 rounded-full animate-ping" />
              <div className="absolute -inset-2 w-10 h-10 bg-primary/20 rounded-full animate-ping animation-delay-75" />
              <div className="absolute -inset-4 w-14 h-14 bg-primary/10 rounded-full animate-ping animation-delay-150" />
            </div>
          </div>
        )}

        {/* Emergency Contact Markers */}
        {emergencyContacts.map((contact, index) => {
          // Position contacts relative to user location
          const positions = [
            { left: "60%", top: "30%" },
            { left: "25%", top: "70%" },
            { left: "75%", top: "65%" },
            { left: "40%", top: "25%" },
            { left: "80%", top: "40%" },
          ];

          const position = positions[index % positions.length];

          return (
            <div
              key={contact.id}
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={position}
            >
              <div className="relative">
                <div className="w-4 h-4 bg-safe rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-125" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white" />

                {/* Tooltip */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-background/95 backdrop-blur border rounded-lg px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {contact.name}
                  <div className="text-xs text-muted-foreground">
                    {contact.guardianKey}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Map Controls */}
      <div className="absolute top-4 right-4 space-y-3 z-30">
        {/* Map Style Control */}
        <div className="bg-background/95 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-border/50">
          <div className="text-xs text-center font-medium mb-2 text-muted-foreground px-2">
            {mapStyle.charAt(0).toUpperCase() + mapStyle.slice(1)} View
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
            onClick={toggleMapStyle}
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>

        {/* Location Control */}
        <Button
          size="sm"
          variant="ghost"
          className="h-12 w-12 p-0 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-300 hover:scale-105"
          onClick={getCurrentLocation}
        >
          <Locate className="h-5 w-5" />
        </Button>
      </div>

      {/* Custom Zoom Controls */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-1 z-30">
        <div className="bg-background/95 backdrop-blur-xl rounded-2xl p-1 shadow-xl border border-border/50">
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-lg font-bold"
            onClick={zoomIn}
          >
            +
          </Button>
          <div className="h-px bg-border/50 mx-2" />
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 text-lg font-bold"
            onClick={zoomOut}
          >
            −
          </Button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="bg-background/95 backdrop-blur-xl rounded-lg px-2 py-1 shadow-lg border border-border/50 text-center">
          <span className="text-xs font-medium text-muted-foreground">
            {zoom}x
          </span>
        </div>
      </div>

      {/* Enhanced Location Status */}
      {location?.accuracy && (
        <div className="absolute bottom-24 left-4 z-30">
          <div className="bg-background/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="w-3 h-3 bg-safe rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-safe/30 rounded-full animate-ping" />
              </div>
              <span className="font-semibold text-sm text-safe">
                Live Tracking
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <p className="text-muted-foreground">
                Accuracy:{" "}
                <span className="text-foreground font-medium">
                  ±{Math.round(location.accuracy)}m
                </span>
              </p>
              <p className="text-muted-foreground">
                Position:{" "}
                <span className="text-foreground font-medium">
                  {location.latitude.toFixed(4)},{" "}
                  {location.longitude.toFixed(4)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clean Map Attribution */}
      <div className="absolute bottom-4 left-4 z-30">
        <div className="bg-background/95 backdrop-blur-xl rounded-xl px-3 py-2 shadow-lg border border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">
              Guardian Map
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Status */}
      {isPanning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-background/95 backdrop-blur-xl rounded-2xl px-4 py-2 shadow-xl border border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-spin" />
              <span className="text-sm font-medium text-primary">
                Moving...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
