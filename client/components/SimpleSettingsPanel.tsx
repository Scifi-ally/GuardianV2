import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Activity, Navigation2 } from "lucide-react";
import { SmartLocationDisplay } from "@/components/SmartLocationDisplay";

interface SimpleSettingsPanelProps {
  location: any;
  mapTheme: string;
  mapType: string;
  toggleTheme: () => void;
  toggleMapType: () => void;
  DebugContent: React.ComponentType;
}

export function SimpleSettingsPanel({
  location,
  mapTheme,
  mapType,
  toggleTheme,
  toggleMapType,
  DebugContent,
}: SimpleSettingsPanelProps) {
  const [showTraffic, setShowTraffic] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showEmergencyServices, setShowEmergencyServices] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="space-y-4">
      {/* Current Location with Name */}
      {location && (
        <div className="bg-white border border-black/10 rounded-lg p-3">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Navigation2 className="h-4 w-4" />
            Current Location
          </h4>
          <SmartLocationDisplay
            latitude={location.latitude}
            longitude={location.longitude}
            showCoordinates={false}
            className="mb-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Real-time safety analysis active
          </p>
        </div>
      )}

      {/* Map Style Settings */}
      <div>
        <h4 className="text-sm font-medium mb-3">Map Display</h4>
        <div className="space-y-2">
          <motion.div
            className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div>
              <p className="text-sm font-medium">Map Theme</p>
              <p className="text-xs text-muted-foreground">Light or dark</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="h-7 px-2 text-xs"
            >
              {mapTheme === "light" ? "🌞" : "🌙"}
            </Button>
          </motion.div>

          <motion.div
            className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div>
              <p className="text-sm font-medium">Map Type</p>
              <p className="text-xs text-muted-foreground">
                Standard or satellite
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMapType}
              className="h-7 px-2 text-xs"
            >
              {mapType === "normal" ? "🗺️" : "🛰️"}
            </Button>
          </motion.div>

          <motion.div
            className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div>
              <p className="text-sm font-medium">Traffic</p>
              <p className="text-xs text-muted-foreground">
                Real-time conditions
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showTraffic}
                onChange={(e) => setShowTraffic(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  showTraffic
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-300"
                }`}
              >
                {showTraffic && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </label>
          </motion.div>

          <motion.div
            className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div>
              <p className="text-sm font-medium">Safe Zones</p>
              <p className="text-xs text-muted-foreground">
                Police & safe areas
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showSafeZones}
                onChange={(e) => setShowSafeZones(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  showSafeZones
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-300"
                }`}
              >
                {showSafeZones && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </label>
          </motion.div>

          <motion.div
            className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div>
              <p className="text-sm font-medium">Emergency Services</p>
              <p className="text-xs text-muted-foreground">
                Hospitals & services
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showEmergencyServices}
                onChange={(e) => setShowEmergencyServices(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  showEmergencyServices
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-300"
                }`}
              >
                {showEmergencyServices && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </label>
          </motion.div>

          <motion.div
            className="flex items-center justify-between p-2 bg-muted/20 rounded border transition-all duration-200 hover:bg-muted/30"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div>
              <p className="text-sm font-medium">Debug Console</p>
              <p className="text-xs text-muted-foreground">
                Developer info & logs
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  showDebug
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-300"
                }`}
              >
                {showDebug && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </label>
          </motion.div>

          {/* Debug Console Content */}
          {showDebug && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Debug Information
              </h4>
              <DebugContent />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
