import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface SlideDownNotificationsProps {
  className?: string;
}

// Global notification manager
class NotificationManager {
  private static instance: NotificationManager;
  private notifications: Notification[] = [];
  private subscribers: Set<(notifications: Notification[]) => void> = new Set();

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.subscribers.add(callback);
    callback(this.notifications); // Initial state
    return () => {
      this.subscribers.delete(callback);
    };
  }

  addNotification(
    notification: Omit<Notification, "id" | "timestamp">,
  ): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    this.notifications = [newNotification, ...this.notifications].slice(0, 10); // Keep max 10
    this.notifySubscribers();

    // Auto-remove non-persistent notifications
    if (!notification.persistent) {
      setTimeout(() => {
        this.removeNotification(id);
      }, 5000);
    }

    return id;
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notifySubscribers();
  }

  clearAll(): void {
    this.notifications = [];
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback(this.notifications));
  }
}

// Export notification manager for use in other components
export const notificationManager = NotificationManager.getInstance();

export function SlideDownNotifications({
  className,
}: SlideDownNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setIsVisible(newNotifications.length > 0);

      // Auto-expand if there are error notifications
      if (newNotifications.some((n) => n.type === "error")) {
        setIsExpanded(true);
      }
    });

    return unsubscribe;
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  if (!isVisible || notifications.length === 0) return null;

  const latestNotification = notifications[0];
  const hasMoreNotifications = notifications.length > 1;

  return (
    <div className={cn("fixed top-0 left-0 right-0 z-50", className)}>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
        }}
        className="mx-4 mt-4"
      >
        <div
          className={cn(
            "rounded-lg border shadow-lg backdrop-blur-md",
            getNotificationBg(latestNotification.type),
          )}
        >
          {/* Main notification */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getNotificationIcon(latestNotification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold">
                      {latestNotification.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {new Date(
                        latestNotification.timestamp,
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {latestNotification.message}
                  </p>

                  {latestNotification.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={latestNotification.action.onClick}
                      className="h-7 text-xs"
                    >
                      {latestNotification.action.label}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {hasMoreNotifications && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    notificationManager.removeNotification(
                      latestNotification.id,
                    )
                  }
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Additional notifications (when expanded) */}
          <AnimatePresence>
            {isExpanded && hasMoreNotifications && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-200"
              >
                <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                  {notifications.slice(1).map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2 p-2 rounded bg-white/50"
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-medium">
                            {notification.title}
                          </h5>
                          <span className="text-xs text-gray-400">
                            {new Date(
                              notification.timestamp,
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {notification.message}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          notificationManager.removeNotification(
                            notification.id,
                          )
                        }
                        className="h-4 w-4 p-0"
                      >
                        <X className="w-2 h-2" />
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* Clear all button */}
                <div className="p-2 border-t border-gray-200">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => notificationManager.clearAll()}
                    className="w-full h-6 text-xs"
                  >
                    Clear All ({notifications.length})
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification count badge */}
          {hasMoreNotifications && !isExpanded && (
            <div className="px-4 pb-2">
              <Badge variant="outline" className="text-xs">
                +{notifications.length - 1} more notifications
              </Badge>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Hook for using notifications in components
export function useSlideDownNotifications() {
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      return notificationManager.addNotification(notification);
    },
    [],
  );

  const removeNotification = useCallback((id: string) => {
    notificationManager.removeNotification(id);
  }, []);

  const clearAll = useCallback(() => {
    notificationManager.clearAll();
  }, []);

  return {
    addNotification,
    removeNotification,
    clearAll,
  };
}

export default SlideDownNotifications;
