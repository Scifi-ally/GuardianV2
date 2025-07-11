import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Activity,
  Globe,
  Database,
  Map,
  HardDrive,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  connectivityService,
  type ConnectivityStatus,
  type ConnectivityTest,
} from "@/services/connectivityService";
import { cn } from "@/lib/utils";

export function ConnectivityDiagnostics() {
  const [status, setStatus] = useState<ConnectivityStatus | null>(null);
  const [diagnostics, setDiagnostics] = useState<ConnectivityTest[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [lastDiagnosticRun, setLastDiagnosticRun] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = connectivityService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const results = await connectivityService.runDiagnostics();
      setDiagnostics(results);
      setLastDiagnosticRun(new Date());
    } catch (error) {
      console.error("Diagnostics failed:", error);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const getStatusIcon = (testStatus: string, size = 16) => {
    const iconProps = { size };
    switch (testStatus) {
      case "success":
        return <CheckCircle {...iconProps} className="text-green-600" />;
      case "warning":
        return <AlertTriangle {...iconProps} className="text-yellow-600" />;
      case "error":
        return <XCircle {...iconProps} className="text-red-600" />;
      default:
        return <Activity {...iconProps} className="text-gray-600" />;
    }
  };

  const getServiceIcon = (serviceName: string, size = 16) => {
    const iconProps = { size };
    switch (serviceName.toLowerCase()) {
      case "internet connection":
        return <Globe {...iconProps} />;
      case "firebase auth":
      case "firestore":
        return <Database {...iconProps} />;
      case "google maps":
        return <Map {...iconProps} />;
      case "local storage":
        return <HardDrive {...iconProps} />;
      case "geolocation":
        return <MapPin {...iconProps} />;
      default:
        return <Activity {...iconProps} />;
    }
  };

  const getStatusBadgeColor = (testStatus: string) => {
    switch (testStatus) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!status) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Checking connectivity...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Connection Status Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {status.isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Globe className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-sm font-medium">Internet</div>
                <div
                  className={`text-xs ${status.isOnline ? "text-green-600" : "text-red-600"}`}
                >
                  {status.isOnline ? "Connected" : "Offline"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Database className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-sm font-medium">Firebase</div>
                <div
                  className={`text-xs ${status.firebaseConnected ? "text-green-600" : "text-red-600"}`}
                >
                  {status.firebaseConnected ? "Connected" : "Disconnected"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Map className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-sm font-medium">Maps</div>
                <div
                  className={`text-xs ${status.googleMapsLoaded ? "text-green-600" : "text-red-600"}`}
                >
                  {status.googleMapsLoaded ? "Loaded" : "Not Loaded"}
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Last checked: {status.lastChecked.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* Diagnostics Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              System Diagnostics
            </CardTitle>
            <Button
              onClick={runDiagnostics}
              disabled={isRunningDiagnostics}
              size="sm"
              variant="outline"
            >
              {isRunningDiagnostics ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Diagnostics
                </>
              )}
            </Button>
          </div>
          {lastDiagnosticRun && (
            <p className="text-sm text-gray-500">
              Last run: {lastDiagnosticRun.toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {diagnostics.length > 0 ? (
              <motion.div
                key="diagnostics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                {diagnostics.map((test, index) => (
                  <motion.div
                    key={test.service}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getServiceIcon(test.service, 18)}
                      <div>
                        <div className="font-medium text-sm">
                          {test.service}
                        </div>
                        <div className="text-xs text-gray-600 max-w-xs truncate">
                          {test.message}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.latency && (
                        <span className="text-xs text-gray-500">
                          {Math.round(test.latency)}ms
                        </span>
                      )}
                      <Badge
                        className={cn(
                          "text-xs",
                          getStatusBadgeColor(test.status),
                        )}
                      >
                        {getStatusIcon(test.status, 12)}
                        <span className="ml-1 capitalize">{test.status}</span>
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="no-diagnostics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-gray-500"
              >
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No diagnostics run yet</p>
                <p className="text-sm">
                  Click "Run Diagnostics" to test all services
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => connectivityService.forceCheck()}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const data = {
                  status,
                  diagnostics,
                  timestamp: new Date().toISOString(),
                  userAgent: navigator.userAgent,
                };
                navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
                alert("Diagnostic data copied to clipboard");
              }}
              className="w-full"
            >
              <Activity className="h-4 w-4 mr-2" />
              Copy Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact version for embedding in other components
export function ConnectivityIndicator() {
  const [status, setStatus] = useState<ConnectivityStatus | null>(null);

  useEffect(() => {
    const unsubscribe = connectivityService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  if (!status) return null;

  const isHealthy =
    status.isOnline && status.firebaseConnected && status.googleMapsLoaded;

  return (
    <div className="flex items-center gap-2 text-xs">
      {isHealthy ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-600">All systems online</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-yellow-600">Limited connectivity</span>
        </>
      )}
    </div>
  );
}
