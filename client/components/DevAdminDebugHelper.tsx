import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Eye,
  EyeOff,
  MapPin,
  Activity,
  Wifi,
  Target,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { adminDebugService, useAdminDebug } from "@/services/adminDebugService";

export function DevAdminDebugHelper() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { debugConfig, isDebugEnabled } = useAdminDebug();

  // Only show in development environment
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleDevOverride = (enabled: boolean) => {
    adminDebugService.devModeOverride(enabled);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isExpanded ? (
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="bg-background/90 backdrop-blur-sm border-orange-200 hover:bg-orange-50"
        >
          <Settings className="h-4 w-4 mr-2" />
          Dev Debug
          {isDebugEnabled && (
            <div className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse" />
          )}
        </Button>
      ) : (
        <Card className="w-80 bg-background/95 backdrop-blur-sm border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-orange-800">
                Dev Debug Helper
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={import.meta.env.DEV ? "default" : "destructive"}
                className="text-xs"
              >
                {import.meta.env.DEV ? "Development" : "Production"}
              </Badge>
              {isDebugEnabled && (
                <Badge variant="outline" className="text-xs bg-green-50">
                  Debug Active
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Development Override */}
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-800">
                    Development Only
                  </span>
                </div>
                <p className="text-xs text-yellow-700">
                  These controls only work in development and don't affect
                  production builds.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Debug Override</p>
                  <p className="text-xs text-muted-foreground">
                    Enable debug mode locally
                  </p>
                </div>
                <Switch
                  checked={isDebugEnabled}
                  onCheckedChange={handleDevOverride}
                />
              </div>
            </div>

            {/* Current Debug State */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Current State</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin
                    className={`h-3 w-3 ${
                      debugConfig.features.locationDebugPanel
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span>Location Debug</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity
                    className={`h-3 w-3 ${
                      debugConfig.features.systemInfoPanel
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span>System Info</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target
                    className={`h-3 w-3 ${
                      debugConfig.features.coordinateDisplay
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span>Coordinates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi
                    className={`h-3 w-3 ${
                      debugConfig.features.connectionIndicator
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span>Connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3
                    className={`h-3 w-3 ${
                      debugConfig.features.performanceMetrics
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span>Performance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye
                    className={`h-3 w-3 ${
                      debugConfig.features.accuracyIndicator
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span>Accuracy</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="text-xs font-medium text-blue-800 mb-1">
                Production Debug
              </h5>
              <p className="text-xs text-blue-700">
                To enable debug mode in production, update the{" "}
                <code className="bg-blue-100 px-1 rounded">
                  admin/debugConfig
                </code>{" "}
                document in Firestore.
              </p>
            </div>

            {/* Debug Config */}
            {debugConfig.enabledBy && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="text-xs font-medium text-green-800 mb-1">
                  Admin Debug Active
                </h5>
                <div className="text-xs text-green-700">
                  <p>Enabled by: {debugConfig.enabledBy}</p>
                  {debugConfig.enabledAt && (
                    <p>
                      At: {new Date(debugConfig.enabledAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DevAdminDebugHelper;
