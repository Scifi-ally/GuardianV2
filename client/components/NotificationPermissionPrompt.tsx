import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  BellOff,
  AlertTriangle,
  Shield,
  MessageSquare,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface NotificationPermissionPromptProps {
  onClose?: () => void;
  autoShow?: boolean;
}

export function NotificationPermissionPrompt({
  onClose,
  autoShow = true,
}: NotificationPermissionPromptProps) {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isRequesting, setIsRequesting] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check current notification permission status
    if ("Notification" in window) {
      setPermission(Notification.permission);

      // Show prompt if notifications are not granted and autoShow is enabled
      if (autoShow && Notification.permission !== "granted") {
        // Only show if user hasn't been asked recently
        const lastAsked = localStorage.getItem("notificationPromptLastAsked");
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;

        if (!lastAsked || now - parseInt(lastAsked) > dayInMs) {
          setShouldShow(true);
        }
      }
    }
  }, [autoShow]);

  const handleRequestNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications are not supported in this browser");
      return;
    }

    setIsRequesting(true);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      // Store that we asked
      localStorage.setItem(
        "notificationPromptLastAsked",
        Date.now().toString(),
      );

      if (result === "granted") {
        toast.success("Notifications enabled successfully!");

        // Send a test notification
        new Notification("Guardian Safety", {
          body: "You'll now receive important safety alerts",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });

        handleClose();
      } else if (result === "denied") {
        toast.error(
          "Notifications blocked. Enable in browser settings if needed.",
        );
      }
    } catch (error) {
      console.error("Notification permission error:", error);
      toast.error("Failed to request notification permission");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleClose = () => {
    setShouldShow(false);
    onClose?.();
  };

  const handleNotNow = () => {
    // Store that user declined for now
    localStorage.setItem("notificationPromptLastAsked", Date.now().toString());
    handleClose();
  };

  const openNotificationSettings = () => {
    toast.info(
      "To enable notifications:\n1. Click the 🔔 icon in address bar\n2. Select 'Allow'\n3. Refresh if needed",
      {
        duration: 8000,
      },
    );
  };

  // Don't show if notifications are already granted or browser doesn't support
  if (!("Notification" in window) || permission === "granted" || !shouldShow) {
    return null;
  }

  const getContent = () => {
    switch (permission) {
      case "denied":
        return {
          icon: BellOff,
          iconColor: "text-red-500",
          title: "Notifications Blocked",
          description:
            "Enable notifications in browser settings to receive safety alerts",
          primaryAction: {
            text: "Open Settings",
            action: openNotificationSettings,
            variant: "outline" as const,
          },
          showSecondary: false,
        };

      default: // "default"
        return {
          icon: Bell,
          iconColor: "text-blue-500",
          title: "Enable Safety Notifications",
          description:
            "Get instant alerts for emergency situations and safety updates",
          primaryAction: {
            text: "Enable Notifications",
            action: handleRequestNotifications,
            variant: "default" as const,
          },
          showSecondary: true,
        };
    }
  };

  const content = getContent();
  const IconComponent = content.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-full bg-gray-100 ${content.iconColor}`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {content.title}
                    </h3>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {content.description}
              </p>

              {/* Benefits */}
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-blue-700 font-medium mb-2">
                  You'll be notified about:
                </p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    Emergency alerts from contacts
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    Safety warnings in your area
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    Important safety updates
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={content.primaryAction.action}
                  variant={content.primaryAction.variant}
                  className="w-full"
                  disabled={isRequesting}
                >
                  {isRequesting ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <IconComponent className="h-4 w-4 mr-2" />
                      {content.primaryAction.text}
                    </>
                  )}
                </Button>

                {content.showSecondary && (
                  <Button
                    onClick={handleNotNow}
                    variant="ghost"
                    size="sm"
                    className="w-full text-gray-600"
                    disabled={isRequesting}
                  >
                    Not now
                  </Button>
                )}
              </div>

              {/* Help Text */}
              <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                <p>
                  You can change notification settings anytime in your browser
                  preferences.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
