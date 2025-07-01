import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  Phone,
  MessageSquare,
  Clock,
  Shield,
  Navigation,
  X,
  Check,
  Car,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  SOSService,
  type SOSAlert,
  type SOSResponse,
} from "@/services/sosService";

interface SOSNotificationProps {
  alert: SOSAlert;
  currentUserId: string;
  currentUserName: string;
  onRespond: (response: SOSResponse["response"], message?: string) => void;
  onClose: () => void;
}

export function SOSNotification({
  alert,
  currentUserId,
  currentUserName,
  onRespond,
  onClose,
}: SOSNotificationProps) {
  const [timeElapsed, setTimeElapsed] = useState<string>("");
  const [responding, setResponding] = useState(false);
  const [userResponse, setUserResponse] = useState<
    SOSResponse["response"] | null
  >(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const alertTime = new Date(alert.createdAt);
      const diffMs = now.getTime() - alertTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);

      if (diffMins > 0) {
        setTimeElapsed(`${diffMins}m ${diffSecs}s ago`);
      } else {
        setTimeElapsed(`${diffSecs}s ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [alert.createdAt]);

  const handleResponse = async (response: SOSResponse["response"]) => {
    setResponding(true);
    setUserResponse(response);

    try {
      await onRespond(response);
    } catch (error) {
      console.error("Failed to respond to SOS:", error);
    } finally {
      setResponding(false);
    }
  };

  const handleCall = () => {
    // In a real app, you'd use the actual phone number
    window.location.href = `tel:${alert.senderKey}`;
  };

  const handleMessage = () => {
    const message = `I received your emergency alert and I'm responding. Are you safe?`;
    window.location.href = `sms:${alert.senderKey}?body=${encodeURIComponent(message)}`;
  };

  const handleNavigate = () => {
    if (alert.location) {
      const { latitude, longitude } = alert.location;
      window.open(
        `https://maps.google.com/maps?q=${latitude},${longitude}&ll=${latitude},${longitude}&z=16`,
      );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-destructive text-destructive-foreground border-destructive";
      case "high":
        return "bg-emergency text-emergency-foreground border-emergency";
      case "medium":
        return "bg-warning text-warning-foreground border-warning";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getResponseIcon = (response: SOSResponse["response"]) => {
    switch (response) {
      case "acknowledged":
        return <Check className="h-4 w-4" />;
      case "enroute":
        return <Car className="h-4 w-4" />;
      case "arrived":
        return <MapPin className="h-4 w-4" />;
      case "assisted":
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -50 }}
      className="fixed inset-4 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <Card className="relative w-full max-w-md mx-4 border-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emergency/20 via-background to-warning/10 rounded-lg" />

        <CardHeader className="relative pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emergency/20 rounded-full animate-pulse">
                <AlertTriangle className="h-6 w-6 text-emergency" />
              </div>
              <div>
                <CardTitle className="text-lg text-emergency">
                  Emergency Alert
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={cn("text-xs", getPriorityColor(alert.priority))}
                  >
                    {alert.priority.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {timeElapsed}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          {/* Sender Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {alert.senderName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{alert.senderName}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span className="font-mono">{alert.senderKey}</span>
              </div>
            </div>
          </div>

          {/* Message */}
          <Alert className="border-emergency/20 bg-emergency/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {alert.message}
            </AlertDescription>
          </Alert>

          {/* Location */}
          {alert.location && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Location Shared</p>
                <p className="text-sm text-muted-foreground">
                  {alert.location.latitude.toFixed(6)},{" "}
                  {alert.location.longitude.toFixed(6)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigate}
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                Navigate
              </Button>
            </div>
          )}

          <Separator />

          {/* Response Actions */}
          {!userResponse ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-center">
                How would you like to respond?
              </p>

              {/* Primary Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleResponse("acknowledged")}
                  disabled={responding}
                  className="bg-safe hover:bg-safe/90 text-safe-foreground"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
                <Button
                  onClick={() => handleResponse("enroute")}
                  disabled={responding}
                  className="bg-warning hover:bg-warning/90 text-warning-foreground"
                >
                  <Car className="h-4 w-4 mr-2" />
                  On My Way
                </Button>
              </div>

              {/* Communication Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleCall}
                  className="border-emergency text-emergency hover:bg-emergency hover:text-emergency-foreground"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMessage}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 p-3 bg-safe/10 rounded-lg">
                {getResponseIcon(userResponse)}
                <span className="font-medium text-safe">
                  Response sent:{" "}
                  {userResponse.charAt(0).toUpperCase() + userResponse.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleCall}
                  className="border-emergency text-emergency hover:bg-emergency hover:text-emergency-foreground"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMessage}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// SOS Notification Manager Component
interface SOSNotificationManagerProps {
  userId: string;
  userName: string;
}

export function SOSNotificationManager({
  userId,
  userName,
}: SOSNotificationManagerProps) {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = SOSService.subscribeToSOSAlerts(userId, (newAlerts) => {
      setAlerts(newAlerts);
      if (newAlerts.length > 0 && currentAlertIndex >= newAlerts.length) {
        setCurrentAlertIndex(0);
      }
    });

    return unsubscribe;
  }, [userId]);

  const handleRespond = async (
    response: SOSResponse["response"],
    message?: string,
  ) => {
    const currentAlert = alerts[currentAlertIndex];
    if (!currentAlert) return;

    await SOSService.respondToSOS(
      currentAlert.id!,
      userId,
      userName,
      response,
      message,
    );
  };

  const handleCloseAlert = () => {
    if (alerts.length > 1) {
      setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
    } else {
      setCurrentAlertIndex(0);
    }
  };

  const currentAlert = alerts[currentAlertIndex];

  return (
    <AnimatePresence>
      {currentAlert && (
        <SOSNotification
          alert={currentAlert}
          currentUserId={userId}
          currentUserName={userName}
          onRespond={handleRespond}
          onClose={handleCloseAlert}
        />
      )}
    </AnimatePresence>
  );
}
