import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  Database,
  Wifi,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { auth, db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatusItemProps {
  label: string;
  status: "success" | "error" | "warning" | "loading";
  message?: string;
}

const StatusItem = ({ label, status, message }: StatusItemProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "loading":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "loading":
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <motion.div
      className={cn("p-3 rounded-lg border", getStatusColor())}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">{label}</span>
        </div>
        <Badge variant={status === "success" ? "default" : "secondary"}>
          {status}
        </Badge>
      </div>
      {message && <p className="text-xs text-gray-600 mt-1 ml-6">{message}</p>}
    </motion.div>
  );
};

export function SettingsDebugPanel() {
  const { currentUser } = useAuth();
  const { settings, loading } = useSettings();
  const [authStatus, setAuthStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [firestoreStatus, setFirestoreStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [settingsStatus, setSettingsStatus] = useState<
    "loading" | "success" | "error" | "warning"
  >("loading");
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    checkSystemStatus();
  }, [currentUser, settings]);

  const checkSystemStatus = async () => {
    // Check Auth Status
    if (currentUser) {
      setAuthStatus("success");
    } else {
      setAuthStatus("error");
    }

    // Check Firestore Status
    try {
      if (db && currentUser) {
        setFirestoreStatus("success");
      } else {
        setFirestoreStatus("error");
      }
    } catch (error) {
      setFirestoreStatus("error");
    }

    // Check Settings Status
    if (loading) {
      setSettingsStatus("loading");
    } else if (settings) {
      setSettingsStatus("success");
    } else {
      setSettingsStatus("error");
    }

    // Collect debug info
    setDebugInfo({
      userId: currentUser?.uid || "Not logged in",
      hasSettings: !!settings,
      settingsKeys: settings ? Object.keys(settings) : [],
      authReady: !!auth.currentUser,
      firestoreReady: !!db,
      localStorageBackup: localStorage.getItem(
        `userSettings_${currentUser?.uid}`,
      )
        ? "Available"
        : "None",
    });
  };

  const forceSettingsRefresh = () => {
    window.location.reload();
  };

  if (!currentUser) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">Please log in to debug settings</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Settings Debug Panel</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusItem
            label="Firebase Authentication"
            status={authStatus}
            message={
              currentUser
                ? `Logged in as ${currentUser.email}`
                : "Not authenticated"
            }
          />

          <StatusItem
            label="Firestore Connection"
            status={firestoreStatus}
            message={
              firestoreStatus === "success"
                ? "Connected and ready"
                : "Connection failed"
            }
          />

          <StatusItem
            label="Settings Initialization"
            status={settingsStatus}
            message={
              settingsStatus === "success"
                ? "Settings loaded successfully"
                : settingsStatus === "loading"
                  ? "Loading settings..."
                  : "Settings failed to load"
            }
          />

          {settings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-green-50 border border-green-200 rounded-lg p-3"
            >
              <h4 className="font-medium text-green-800 mb-2">
                Current Settings
              </h4>
              <div className="text-xs text-green-700 space-y-1">
                <div>Profile Visibility: {settings.profileVisibility}</div>
                <div>
                  Location Tracking:{" "}
                  {settings.locationTracking ? "Enabled" : "Disabled"}
                </div>
                <div>
                  Push Notifications:{" "}
                  {settings.pushNotifications ? "Enabled" : "Disabled"}
                </div>
                <div>Session Timeout: {settings.sessionTimeout} minutes</div>
                <div>
                  Last Updated: {settings.lastUpdated?.toLocaleString()}
                </div>
              </div>
            </motion.div>
          )}

          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Debug Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>
                <strong>User ID:</strong> {debugInfo.userId}
              </div>
              <div>
                <strong>Has Settings:</strong>{" "}
                {debugInfo.hasSettings ? "Yes" : "No"}
              </div>
              <div>
                <strong>Settings Keys:</strong>{" "}
                {debugInfo.settingsKeys?.join(", ") || "None"}
              </div>
              <div>
                <strong>Auth Ready:</strong>{" "}
                {debugInfo.authReady ? "Yes" : "No"}
              </div>
              <div>
                <strong>Firestore Ready:</strong>{" "}
                {debugInfo.firestoreReady ? "Yes" : "No"}
              </div>
              <div>
                <strong>Local Backup:</strong> {debugInfo.localStorageBackup}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={forceSettingsRefresh}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Force Refresh Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
