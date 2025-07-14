/**
 * Network Status Component
 * Shows connection status and Firebase errors
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { firebaseErrorHandler } from "@/services/firebaseErrorHandler";

interface NetworkStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function NetworkStatus({
  className,
  showDetails = false,
}: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: true,
    queueLength: 0,
    hasOfflineData: false,
  });
  const [showAlert, setShowAlert] = useState(false);
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(true);

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine);
      const status = firebaseErrorHandler.getConnectionStatus();
      setConnectionStatus(status);

      // Show alert if there are issues
      if (!navigator.onLine || status.queueLength > 0) {
        setShowAlert(true);
      }
    };

    // Initial check
    updateNetworkStatus();

    // Setup listeners
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    // Check Firebase availability periodically
    const checkFirebase = async () => {
      const available = await firebaseErrorHandler.isFirebaseAvailable();
      setIsFirebaseAvailable(available);
    };

    checkFirebase();
    const firebaseCheckInterval = setInterval(checkFirebase, 30000); // Every 30 seconds

    // Update connection status periodically
    const statusInterval = setInterval(updateNetworkStatus, 5000);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
      clearInterval(firebaseCheckInterval);
      clearInterval(statusInterval);
    };
  }, []);

  const handleRetry = async () => {
    // Force a connection check
    const status = firebaseErrorHandler.getConnectionStatus();
    setConnectionStatus(status);

    // Check Firebase availability
    const available = await firebaseErrorHandler.isFirebaseAvailable();
    setIsFirebaseAvailable(available);

    if (navigator.onLine && available && status.queueLength === 0) {
      setShowAlert(false);
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    if (!isFirebaseAvailable) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    if (connectionStatus.queueLength > 0) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (!isFirebaseAvailable) return "Service Issues";
    if (connectionStatus.queueLength > 0) return "Syncing...";
    return "Connected";
  };

  const getStatusColor = () => {
    if (!isOnline) return "text-red-600";
    if (!isFirebaseAvailable) return "text-yellow-600";
    if (connectionStatus.queueLength > 0) return "text-blue-600";
    return "text-green-600";
  };

  // Compact status indicator
  if (!showDetails) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {getStatusIcon()}
        <span className={cn("text-xs font-medium", getStatusColor())}>
          {getStatusText()}
        </span>
        {connectionStatus.queueLength > 0 && (
          <Badge variant="secondary" className="text-xs">
            {connectionStatus.queueLength}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={cn("text-sm font-medium", getStatusColor())}>
            {getStatusText()}
          </span>
          {connectionStatus.queueLength > 0 && (
            <Badge variant="secondary" className="text-xs">
              {connectionStatus.queueLength} pending
            </Badge>
          )}
        </div>

        {(connectionStatus.queueLength > 0 || !isFirebaseAvailable) && (
          <Button onClick={handleRetry} size="sm" variant="outline">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>

      {/* Network Alert */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Alert
              className={cn(
                "border-l-4",
                !isOnline
                  ? "border-l-red-500 bg-red-50"
                  : !isFirebaseAvailable
                    ? "border-l-yellow-500 bg-yellow-50"
                    : "border-l-blue-500 bg-blue-50",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {!isOnline ? (
                    <WifiOff className="h-4 w-4 text-red-500 mt-0.5" />
                  ) : !isFirebaseAvailable ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  ) : (
                    <RefreshCw className="h-4 w-4 text-blue-500 mt-0.5 animate-spin" />
                  )}

                  <div className="flex-1">
                    <AlertDescription className="text-sm">
                      {!isOnline && (
                        <>
                          <strong>No internet connection</strong>
                          <br />
                          Some features may not work properly. The app will sync
                          when connection is restored.
                        </>
                      )}

                      {isOnline && !isFirebaseAvailable && (
                        <>
                          <strong>Service temporarily unavailable</strong>
                          <br />
                          Experiencing connectivity issues with our servers.
                          Your data is safe and will sync automatically.
                        </>
                      )}

                      {isOnline &&
                        isFirebaseAvailable &&
                        connectionStatus.queueLength > 0 && (
                          <>
                            <strong>Syncing data...</strong>
                            <br />
                            {connectionStatus.queueLength} operation
                            {connectionStatus.queueLength > 1 ? "s" : ""}{" "}
                            pending. This may take a moment.
                          </>
                        )}
                    </AlertDescription>

                    {connectionStatus.hasOfflineData && (
                      <div className="mt-2 text-xs text-gray-600">
                        ℹ️ Some data is stored offline and will sync when
                        connection improves.
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => setShowAlert(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NetworkStatus;
