import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  Wifi,
  WifiOff,
  Settings,
  X,
  ChevronDown,
  RefreshCw,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
  duration?: number;
}

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  notifications: Notification[];
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Date.now().toString();
      const newNotification = { ...notification, id };

      setNotifications((prev) => [...prev, newNotification]);

      if (!notification.persistent && notification.duration !== 0) {
        setTimeout(() => {
          removeNotification(id);
        }, notification.duration || 5000);
      }
    },
    [],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ addNotification, removeNotification, notifications }}
    >
      {children}
      <NotificationDisplay />
    </NotificationContext.Provider>
  );
}

function NotificationDisplay() {
  const { notifications, removeNotification } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "info":
        return <Navigation className="w-4 h-4 text-primary" />;
      default:
        return <Navigation className="w-4 h-4 text-safe" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case "error":
        return "bg-destructive/10 border-destructive/20";
      case "warning":
        return "bg-warning/10 border-warning/20";
      case "info":
        return "bg-primary/10 border-primary/20";
      default:
        return "bg-safe/10 border-safe/20";
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="container mx-auto px-4 pt-4 pointer-events-auto">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.95 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                delay: index * 0.1,
              }}
              className={cn(
                "mb-2 rounded-lg border-2 shadow-lg backdrop-blur-md",
                getNotificationBg(notification.type),
                index > 0 && !isExpanded && "hidden",
              )}
            >
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      {notification.action && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={notification.action.onClick}
                          className="mt-2 h-7 text-xs"
                        >
                          {notification.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {notifications.length > 1 && index === 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown
                          className={cn(
                            "w-3 h-3 transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeNotification(notification.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Badge variant="outline" className="text-xs">
              {notifications.length} notifications
            </Badge>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Location Status Toast Component
export function LocationStatusToast() {
  const { addNotification } = useNotifications();
  const [locationStatus, setLocationStatus] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkLocationStatus = async () => {
      if ("permissions" in navigator) {
        try {
          const permission = await navigator.permissions.query({
            name: "geolocation",
          });
          setLocationStatus(permission.state);

          if (permission.state === "denied") {
            setIsVisible(true);
          }

          permission.addEventListener("change", () => {
            setLocationStatus(permission.state);
            if (permission.state === "denied") {
              setIsVisible(true);
            } else {
              setIsVisible(false);
            }
          });
        } catch (error) {
          console.warn("Permissions API not supported");
        }
      }

      // Also test geolocation directly
      // Use enhanced location service for permission check
      if ("geolocation" in navigator) {
        import("@/services/enhancedLocationService")
          .then(({ enhancedLocationService }) => {
            return enhancedLocationService.getPermissionStatus();
          })
          .then((permission) => {
            if (locationStatus === "unknown") {
              if (permission === "granted") {
                setLocationStatus("granted");
              } else if (permission === "denied") {
                setLocationStatus("denied");
                setIsVisible(true);
              }
            }
          })
          .catch(() => {
            // Silent fallback
            console.log("ℹ️ Location permission check completed");
          });
      }
    };

    checkLocationStatus();
  }, [locationStatus]);

  const requestLocationPermission = async () => {
    try {
      const { enhancedLocationService } = await import(
        "@/services/enhancedLocationService"
      );

      const location = await enhancedLocationService.getCurrentLocation();

      setLocationStatus("granted");
      setIsVisible(false);

      addNotification({
        type: "success",
        title: "Location Enabled",
        message: "Your location is now being used for safety features",
        duration: 3000,
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "Location Access Denied",
        message:
          "Please enable location in your browser settings for full safety features",
        action: {
          label: "Open Settings",
          onClick: () => {
            // This will prompt the user to manually enable location
            window.open("chrome://settings/content/location", "_blank");
          },
        },
        persistent: true,
      });
    }
  };

  if (!isVisible || locationStatus === "granted") return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-40">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-warning/90 backdrop-blur-md text-warning-foreground rounded-lg p-3 shadow-lg border border-warning/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4" />
            <div>
              <p className="text-sm font-medium">Location Services Off</p>
              <p className="text-xs opacity-90">
                Enable location for safety features
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={requestLocationPermission}
              className="h-7 text-xs bg-background/20 border-background/30 hover:bg-background/30"
            >
              Enable
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="h-7 w-7 p-0 hover:bg-background/20"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
