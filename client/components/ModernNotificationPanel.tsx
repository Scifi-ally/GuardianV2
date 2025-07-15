/**
 * Modern Notification Panel
 * Beautiful, accessible notification system with enhanced UX
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Bell,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  timestamp: Date;
  duration?: number;
  persistent?: boolean;
  actions?: {
    label: string;
    action: () => void;
    variant?: "primary" | "secondary";
  }[];
}

interface ModernNotificationPanelProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  className?: string;
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center";
  maxVisible?: number;
}

export function ModernNotificationPanel({
  notifications,
  onDismiss,
  onDismissAll,
  className,
  position = "top-right",
  maxVisible = 3,
}: ModernNotificationPanelProps) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-dismiss notifications
  useEffect(() => {
    notifications.forEach((notification) => {
      if (!notification.persistent && notification.duration) {
        const timer = setTimeout(() => {
          onDismiss(notification.id);
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onDismiss]);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColorClasses = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50 border-green-200",
          text: "text-green-900",
          accent: "bg-green-500",
        };
      case "error":
        return {
          bg: "bg-red-50 border-red-200",
          text: "text-red-900",
          accent: "bg-red-500",
        };
      case "warning":
        return {
          bg: "bg-orange-50 border-orange-200",
          text: "text-orange-900",
          accent: "bg-orange-500",
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50 border-blue-200",
          text: "text-blue-900",
          accent: "bg-blue-500",
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top-center":
        return "top-4 left-1/2 transform -translate-x-1/2";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-center":
        return "bottom-4 left-1/2 transform -translate-x-1/2";
      case "top-right":
      default:
        return "top-4 right-4";
    }
  };

  const visibleNotifications = notifications.slice(0, maxVisible);
  const hiddenCount = Math.max(0, notifications.length - maxVisible);

  if (notifications.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed z-50 pointer-events-none",
        getPositionClasses(),
        className,
      )}
    >
      <div className="space-y-3 max-w-sm w-full">
        {/* Panel Header (when minimized) */}
        <AnimatePresence>
          {isMinimized && notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="pointer-events-auto"
            >
              <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Bell className="h-5 w-5 text-gray-600" />
                      {notifications.length > 0 && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                          {notifications.length > 9
                            ? "9+"
                            : notifications.length}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {notifications.length} notification
                      {notifications.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMinimized(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications */}
        <AnimatePresence mode="popLayout">
          {!isMinimized &&
            visibleNotifications.map((notification, index) => {
              const colors = getColorClasses(notification.type);
              return (
                <motion.div
                  key={notification.id}
                  initial={{
                    opacity: 0,
                    y: position.includes("top") ? -30 : 30,
                    scale: 0.9,
                    rotate: position.includes("right") ? 5 : -5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotate: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: position.includes("right") ? 150 : -150,
                    scale: 0.8,
                    rotate: position.includes("right") ? 10 : -10,
                    transition: {
                      duration: 0.3,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.1,
                  }}
                  layout
                  className="pointer-events-auto"
                  style={{ zIndex: 1000 - index }}
                >
                  <div
                    className={cn(
                      "relative bg-white/95 backdrop-blur-xl border rounded-2xl shadow-xl overflow-hidden",
                      colors.bg,
                    )}
                  >
                    {/* Accent Bar */}
                    <div className={cn("h-1 w-full", colors.accent)} />

                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Close Button - LEFT SIDE */}
                        <motion.button
                          onClick={() => onDismiss(notification.id)}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-all duration-200 p-2 hover:bg-gray-100 rounded-full mt-0.5"
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <X className="h-4 w-4" />
                        </motion.button>

                        {/* Icon */}
                        <motion.div
                          className="flex-shrink-0 mt-0.5"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            delay: 0.2,
                          }}
                        >
                          {getIcon(notification.type)}
                        </motion.div>

                        {/* Content */}
                        <motion.div
                          className="flex-1 min-w-0"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <motion.h4
                                className={cn(
                                  "text-sm font-semibold leading-tight",
                                  colors.text,
                                )}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                              >
                                {notification.title}
                              </motion.h4>
                              {notification.message && (
                                <motion.p
                                  className="text-sm text-gray-600 mt-1 leading-relaxed"
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.5 }}
                                >
                                  {notification.message}
                                </motion.p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          {notification.actions &&
                            notification.actions.length > 0 && (
                              <motion.div
                                className="flex gap-2 mt-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                              >
                                {notification.actions.map(
                                  (action, actionIndex) => (
                                    <motion.button
                                      key={actionIndex}
                                      onClick={action.action}
                                      className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                                        action.variant === "primary"
                                          ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
                                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm",
                                      )}
                                      whileHover={{ scale: 1.05, y: -1 }}
                                      whileTap={{ scale: 0.95 }}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{
                                        delay: 0.7 + actionIndex * 0.1,
                                      }}
                                    >
                                      {action.label}
                                    </motion.button>
                                  ),
                                )}
                              </motion.div>
                            )}

                          {/* Timestamp */}
                          <motion.div
                            className="text-xs text-gray-400 mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                          >
                            {notification.timestamp.toLocaleTimeString()}
                          </motion.div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>

        {/* Overflow Indicator */}
        <AnimatePresence>
          {!isMinimized && hiddenCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="pointer-events-auto"
            >
              <div className="bg-gray-100 border border-gray-200 rounded-xl p-3 text-center">
                <span className="text-xs text-gray-600">
                  +{hiddenCount} more notification{hiddenCount !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="block w-full text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  Minimize
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control Panel */}
        <AnimatePresence>
          {!isMinimized && notifications.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="pointer-events-auto"
            >
              <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl p-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {isSoundEnabled ? (
                      <Volume2 className="h-3 w-3" />
                    ) : (
                      <VolumeX className="h-3 w-3" />
                    )}
                    Sound
                  </button>

                  <button
                    onClick={onDismissAll}
                    className="text-xs text-red-600 hover:text-red-800 transition-colors"
                  >
                    Clear All
                  </button>

                  <button
                    onClick={() => setIsMinimized(true)}
                    className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Minimize
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ModernNotificationPanel;
