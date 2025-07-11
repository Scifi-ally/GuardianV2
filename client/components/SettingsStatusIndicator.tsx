import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Bell,
  Shield,
  Lock,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatusItem {
  id: string;
  label: string;
  icon: any;
  isActive: boolean;
  isImportant: boolean;
  description: string;
}

export function SettingsStatusIndicator() {
  const {
    settings,
    isLocationTrackingActive,
    isPushNotificationsActive,
    isSessionTimeoutActive,
    isAutoLockActive,
  } = useSettings();

  const [isExpanded, setIsExpanded] = useState(false);
  const [statusItems, setStatusItems] = useState<StatusItem[]>([]);

  useEffect(() => {
    if (!settings) return;

    const items: StatusItem[] = [
      {
        id: "location",
        label: "Location Tracking",
        icon: MapPin,
        isActive: isLocationTrackingActive,
        isImportant: true,
        description: "Required for emergency location sharing",
      },
      {
        id: "notifications",
        label: "Push Notifications",
        icon: Bell,
        isActive: isPushNotificationsActive,
        isImportant: true,
        description: "Needed for emergency alerts",
      },
      {
        id: "emergency",
        label: "Emergency Alerts",
        icon: Shield,
        isActive: settings.emergencyAlerts,
        isImportant: true,
        description: "Critical safety notifications",
      },
      {
        id: "session",
        label: "Session Security",
        icon: Lock,
        isActive: isSessionTimeoutActive,
        isImportant: false,
        description: "Auto logout for security",
      },
      {
        id: "autolock",
        label: "Auto Lock",
        icon: Lock,
        isActive: isAutoLockActive,
        isImportant: false,
        description: "Locks app when inactive",
      },
    ];

    setStatusItems(items);
  }, [
    settings,
    isLocationTrackingActive,
    isPushNotificationsActive,
    isSessionTimeoutActive,
    isAutoLockActive,
  ]);

  const activeCount = statusItems.filter((item) => item.isActive).length;
  const importantInactive = statusItems.filter(
    (item) => item.isImportant && !item.isActive,
  );

  if (!settings) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card
        className={cn(
          "border-2 transition-all duration-300 cursor-pointer",
          importantInactive.length > 0
            ? "border-orange-300 bg-orange-50 hover:border-orange-400"
            : "border-green-300 bg-green-50 hover:border-green-400",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-full",
                  importantInactive.length > 0
                    ? "bg-orange-100 text-orange-600"
                    : "bg-green-100 text-green-600",
                )}
              >
                {importantInactive.length > 0 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {importantInactive.length > 0
                    ? "Settings Need Attention"
                    : "All Systems Active"}
                </h3>
                <p className="text-xs text-gray-600">
                  {activeCount}/{statusItems.length} features enabled
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {importantInactive.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-300"
                >
                  {importantInactive.length} issues
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {statusItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          item.isActive
                            ? "bg-green-50 border-green-200"
                            : item.isImportant
                              ? "bg-red-50 border-red-200"
                              : "bg-gray-50 border-gray-200",
                        )}
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-full",
                            item.isActive
                              ? "bg-green-100 text-green-600"
                              : item.isImportant
                                ? "bg-red-100 text-red-600"
                                : "bg-gray-100 text-gray-600",
                          )}
                        >
                          <IconComponent className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {item.label}
                            </span>
                            {item.isActive ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {importantInactive.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-3 bg-orange-100 border border-orange-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      <span className="text-xs font-medium text-orange-800">
                        Recommended Actions
                      </span>
                    </div>
                    <ul className="text-xs text-orange-700 space-y-1">
                      {importantInactive.map((item) => (
                        <li key={item.id}>• Enable {item.label}</li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Compact version for use in navigation or header
export function CompactSettingsStatus() {
  const { isLocationTrackingActive, isPushNotificationsActive, settings } =
    useSettings();

  if (!settings) return null;

  const criticalIssues = [
    !isLocationTrackingActive && "Location",
    !isPushNotificationsActive && "Notifications",
    !settings.emergencyAlerts && "Emergency Alerts",
  ].filter(Boolean);

  if (criticalIssues.length === 0) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-green-600">All systems active</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
      <span className="text-xs text-orange-600">
        {criticalIssues.length} issue{criticalIssues.length > 1 ? "s" : ""}
      </span>
    </div>
  );
}
