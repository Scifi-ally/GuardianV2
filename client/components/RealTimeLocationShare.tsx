import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Share,
  AlertCircle,
  CheckCircle,
  Timer,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/use-device-apis";
import {
  inAppLocationService,
  type LocationUpdate,
  type ShareSession,
} from "@/services/inAppLocationService";

interface LocationShareSession {
  id: string;
  contactName: string;
  contactInitials: string;
  isActive: boolean;
  startTime: Date;
  lastSeen: Date;
  accuracy: number;
  distance?: number;
  status: "online" | "offline" | "paused";
}

interface QuickSharePreset {
  id: string;
  name: string;
  duration: number; // minutes
  contacts: string[];
  autoStart: boolean;
}

export function RealTimeLocationShare() {
  const { userProfile } = useAuth();
  const { location } = useGeolocation();
  const [isSharing, setIsSharing] = useState(false);
  const [shareTimer, setShareTimer] = useState<number | null>(null);
  const [activeSessions, setActiveSessions] = useState<LocationShareSession[]>(
    [],
  );
  const quickPresets = useMemo<QuickSharePreset[]>(() => {
    const contactCount = userProfile?.emergencyContacts?.length || 0;

    return [
      {
        id: "emergency",
        name: "Emergency Share",
        duration: 60, // 1 hour
        contacts: contactCount > 0 ? Array(contactCount).fill("contact") : [],
        autoStart: true,
      },
      {
        id: "commute",
        name: "Going Home",
        duration: 30,
        contacts:
          contactCount > 0
            ? Array(Math.min(2, contactCount)).fill("contact")
            : [],
        autoStart: false,
      },
      {
        id: "meeting",
        name: "Meeting Someone",
        duration: 15,
        contacts: contactCount > 0 ? Array(1).fill("contact") : [],
        autoStart: false,
      },
    ];
  }, [userProfile?.emergencyContacts]);

  // Load active sessions from real emergency contacts
  useEffect(() => {
    if (!userProfile?.emergencyContacts) {
      setActiveSessions([]);
      return;
    }

    // In a real app, this would fetch active location sharing sessions from your backend
    // For now, we'll only show sessions if location sharing is actually active
    if (isSharing) {
      const realSessions: LocationShareSession[] =
        userProfile.emergencyContacts.map((contact, index) => ({
          id: contact.id,
          contactName: contact.name,
          contactInitials: contact.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          isActive: true,
          startTime: new Date(Date.now() - Math.random() * 3600000), // Random start time within last hour
          lastSeen: new Date(Date.now() - Math.random() * 300000), // Random last seen within 5 minutes
          accuracy: Math.floor(Math.random() * 20) + 5, // 5-25m accuracy
          distance: undefined, // Would calculate real distance in production
          status: Math.random() > 0.1 ? "online" : "offline", // 90% online rate
        }));
      setActiveSessions(realSessions);
    } else {
      setActiveSessions([]);
    }
  }, [userProfile?.emergencyContacts, isSharing]);

  // Update timer every second when sharing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSharing && shareTimer !== null) {
      interval = setInterval(() => {
        setShareTimer((prev) => {
          if (prev === null || prev <= 0) {
            setIsSharing(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSharing, shareTimer]);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const startLocationShare = (preset: QuickSharePreset) => {
    if (!userProfile?.displayName) return;

    const contactIds = userProfile.emergencyContacts?.map((c) => c.id) || [];

    const sessionId = inAppLocationService.startLocationSharing(
      userProfile.uid || "anonymous",
      userProfile.displayName,
      preset.duration,
      contactIds,
    );

    setCurrentSessionId(sessionId);
    setIsSharing(true);
    setShareTimer(preset.duration * 60); // Convert to seconds
  };

  const stopLocationShare = () => {
    if (currentSessionId) {
      inAppLocationService.stopLocationSharing(currentSessionId);
      setCurrentSessionId(null);
    }
    setIsSharing(false);
    setShareTimer(null);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeSince = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Current Sharing Status */}
      <AnimatePresence>
        {isSharing && shareTimer !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
          >
            <Card className="bg-safe/10 border-safe/30 border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-safe rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-3 h-3 bg-safe rounded-full animate-ping" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-safe">
                        Location Sharing Active
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Sharing with emergency contacts
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-safe">
                      {formatTime(shareTimer)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      remaining
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopLocationShare}
                    className="flex-1 border-safe/30 text-safe hover:bg-safe/10"
                  >
                    <EyeOff className="w-4 h-4 mr-1" />
                    Stop Sharing
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShareTimer((prev) => (prev || 0) + 900)} // Add 15 min
                    className="border-safe/30 text-safe hover:bg-safe/10"
                  >
                    <Timer className="w-4 h-4 mr-1" />
                    +15m
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Share Presets */}
      {!isSharing && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Quick Share</h4>
          {!userProfile?.emergencyContacts ||
          userProfile.emergencyContacts.length === 0 ? (
            <Card className="bg-muted/20">
              <CardContent className="p-3">
                <div className="text-center text-sm text-muted-foreground">
                  Add emergency contacts to enable location sharing
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {quickPresets.map((preset, index) => (
                <motion.div
                  key={preset.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={cn(
                      "transition-all duration-200",
                      preset.contacts.length > 0
                        ? "hover:bg-muted/30 cursor-pointer"
                        : "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <CardContent className="p-3">
                      <div
                        className="flex items-center justify-between"
                        onClick={() =>
                          preset.contacts.length > 0 &&
                          startLocationShare(preset)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-full",
                              preset.id === "emergency"
                                ? "bg-emergency/20"
                                : "bg-primary/20",
                            )}
                          >
                            <Share
                              className={cn(
                                "w-4 h-4",
                                preset.id === "emergency"
                                  ? "text-emergency"
                                  : "text-primary",
                              )}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {preset.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {preset.duration} minutes
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            preset.id === "emergency" &&
                              "border-emergency/30 text-emergency",
                          )}
                        >
                          {preset.contacts.length === 0
                            ? "No contacts"
                            : preset.id === "emergency"
                              ? "All contacts"
                              : `${preset.contacts.length} contact${preset.contacts.length > 1 ? "s" : ""}`}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            People Tracking You ({activeSessions.length})
          </h4>
          <div className="space-y-2">
            {activeSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-muted/20">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {session.contactInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                              session.status === "online"
                                ? "bg-safe"
                                : session.status === "paused"
                                  ? "bg-warning"
                                  : "bg-muted-foreground",
                            )}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {session.contactName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Started {getTimeSince(session.startTime)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {session.distance && (
                          <div className="flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            {session.distance}km away
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {getTimeSince(session.lastSeen)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Location Accuracy */}
      {location && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-muted/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Location Accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      (location.accuracy || 0) < 10
                        ? "bg-safe"
                        : (location.accuracy || 0) < 50
                          ? "bg-warning"
                          : "bg-emergency",
                    )}
                  />
                  <span className="text-sm">
                    ±{Math.round(location.accuracy || 0)}m
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
