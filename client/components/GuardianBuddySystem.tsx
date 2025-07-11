import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  UserPlus,
  Clock,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  Bell,
  Settings,
  Heart,
  Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GuardianBuddy {
  id: string;
  name: string;
  guardianKey: string;
  avatar?: string;
  status: "online" | "offline" | "away" | "emergency";
  lastSeen: Date;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  safetyScore: number;
  checkInStreak: number;
  isWatching: boolean; // Are they watching you?
  youWatching: boolean; // Are you watching them?
}

interface CheckInRequest {
  id: string;
  fromBuddyId: string;
  toBuddyId: string;
  message?: string;
  timestamp: Date;
  urgency: "low" | "medium" | "high";
  expiresAt: Date;
  response?: {
    status: "safe" | "need_help" | "emergency";
    message?: string;
    timestamp: Date;
  };
}

interface BuddySchedule {
  buddyId: string;
  checkInTimes: string[]; // ["09:00", "18:00"]
  timezone: string;
  enabled: boolean;
}

export function GuardianBuddySystem() {
  const [buddies, setBuddies] = useState<GuardianBuddy[]>([
    {
      id: "buddy-1",
      name: "Sarah M.",
      guardianKey: "SARAH-SAFE-2024",
      status: "online",
      lastSeen: new Date(),
      safetyScore: 95,
      checkInStreak: 12,
      isWatching: true,
      youWatching: true,
      location: {
        lat: 37.7749,
        lng: -122.4194,
        address: "Downtown SF",
      },
    },
    {
      id: "buddy-2",
      name: "Mike R.",
      guardianKey: "MIKE-GUARD-2024",
      status: "away",
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      safetyScore: 88,
      checkInStreak: 7,
      isWatching: false,
      youWatching: true,
    },
  ]);

  const [checkInRequests, setCheckInRequests] = useState<CheckInRequest[]>([]);
  const [newBuddyKey, setNewBuddyKey] = useState("");
  const [showAddBuddy, setShowAddBuddy] = useState(false);
  const [selectedBuddy, setSelectedBuddy] = useState<GuardianBuddy | null>(
    null,
  );
  const [checkInMessage, setCheckInMessage] = useState("");

  // Auto check-ins
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate receiving check-in requests
      if (Math.random() < 0.3) {
        // 30% chance every 10 seconds
        const randomBuddy = buddies[Math.floor(Math.random() * buddies.length)];
        if (randomBuddy) {
          sendCheckInRequest(randomBuddy.id, "auto", "low");
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [buddies]);

  const addBuddy = useCallback(async () => {
    if (!newBuddyKey.trim()) return;

    // Simulate adding buddy by guardian key
    const newBuddy: GuardianBuddy = {
      id: `buddy-${Date.now()}`,
      name: "New Guardian",
      guardianKey: newBuddyKey.trim(),
      status: "offline",
      lastSeen: new Date(),
      safetyScore: 75,
      checkInStreak: 0,
      isWatching: false,
      youWatching: false,
    };

    setBuddies((prev) => [...prev, newBuddy]);
    setNewBuddyKey("");
    setShowAddBuddy(false);

    // Simulate connection success
    setTimeout(() => {
      setBuddies((prev) =>
        prev.map((buddy) =>
          buddy.id === newBuddy.id
            ? {
                ...buddy,
                status: "online",
                name: `Guardian ${newBuddyKey.slice(-4)}`,
              }
            : buddy,
        ),
      );
    }, 2000);
  }, [newBuddyKey]);

  const sendCheckInRequest = useCallback(
    (
      buddyId: string,
      message: string = "",
      urgency: "low" | "medium" | "high" = "medium",
    ) => {
      const request: CheckInRequest = {
        id: `checkin-${Date.now()}`,
        fromBuddyId: "you",
        toBuddyId: buddyId,
        message: message || undefined,
        timestamp: new Date(),
        urgency,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      };

      setCheckInRequests((prev) => [...prev, request]);

      // Simulate response after random delay
      setTimeout(
        () => {
          setCheckInRequests((prev) =>
            prev.map((req) =>
              req.id === request.id
                ? {
                    ...req,
                    response: {
                      status: Math.random() > 0.8 ? "need_help" : "safe",
                      message:
                        Math.random() > 0.5 ? "All good here!" : undefined,
                      timestamp: new Date(),
                    },
                  }
                : req,
            ),
          );
        },
        Math.random() * 10000 + 2000,
      ); // 2-12 seconds
    },
    [],
  );

  const toggleWatching = useCallback((buddyId: string) => {
    setBuddies((prev) =>
      prev.map((buddy) =>
        buddy.id === buddyId
          ? { ...buddy, youWatching: !buddy.youWatching }
          : buddy,
      ),
    );
  }, []);

  const getStatusColor = (status: GuardianBuddy["status"]) => {
    switch (status) {
      case "online":
        return "text-green-600 bg-green-100";
      case "away":
        return "text-yellow-600 bg-yellow-100";
      case "offline":
        return "text-gray-600 bg-gray-100";
      case "emergency":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: GuardianBuddy["status"]) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-3 w-3" />;
      case "away":
        return <Clock className="h-3 w-3" />;
      case "offline":
        return <Users className="h-3 w-3" />;
      case "emergency":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getUrgencyColor = (urgency: "low" | "medium" | "high") => {
    switch (urgency) {
      case "low":
        return "border-blue-200 bg-blue-50";
      case "medium":
        return "border-yellow-200 bg-yellow-50";
      case "high":
        return "border-red-200 bg-red-50";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Guardian Buddy System
          </CardTitle>
          <p className="text-sm text-gray-600">
            Stay connected with your safety network through automated check-ins
            and mutual monitoring.
          </p>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => setShowAddBuddy(!showAddBuddy)}
          className="h-12 flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Guardian Buddy
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            buddies.forEach((buddy) => {
              if (buddy.youWatching) {
                sendCheckInRequest(buddy.id, "Quick safety check", "medium");
              }
            });
          }}
          className="h-12 flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          Check In With All
        </Button>
      </div>

      {/* Add Buddy Form */}
      <AnimatePresence>
        {showAddBuddy && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Guardian Key</label>
                    <Input
                      value={newBuddyKey}
                      onChange={(e) => setNewBuddyKey(e.target.value)}
                      placeholder="Enter their Guardian Key (e.g., SARAH-SAFE-2024)"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addBuddy} className="flex-1">
                      Add Buddy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddBuddy(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Check-In Requests */}
      {checkInRequests.filter((req) => !req.response).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-4 w-4 text-orange-600" />
              Pending Check-Ins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checkInRequests
              .filter((req) => !req.response)
              .map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-lg border-2",
                    getUrgencyColor(request.urgency),
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        Checking in with{" "}
                        {buddies.find((b) => b.id === request.toBuddyId)?.name}
                      </div>
                      {request.message && (
                        <div className="text-xs text-gray-600 mt-1">
                          "{request.message}"
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Sent {request.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge className={`text-xs capitalize`}>
                      {request.urgency}
                    </Badge>
                  </div>
                </motion.div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Responses */}
      {checkInRequests.filter((req) => req.response).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              Recent Responses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checkInRequests
              .filter((req) => req.response)
              .slice(-3)
              .map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        {buddies.find((b) => b.id === request.toBuddyId)?.name}{" "}
                        responded
                      </div>
                      {request.response?.message && (
                        <div className="text-xs text-gray-600 mt-1">
                          "{request.response.message}"
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {request.response?.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge
                      className={`text-xs ${
                        request.response?.status === "safe"
                          ? "bg-green-100 text-green-800"
                          : request.response?.status === "need_help"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {request.response?.status === "safe" && (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {request.response?.status === "need_help" && (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {request.response?.status === "emergency" && (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {request.response?.status.replace("_", " ")}
                    </Badge>
                  </div>
                </motion.div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Buddy List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Guardian Buddies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {buddies.map((buddy) => (
            <motion.div
              key={buddy.id}
              layout
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {buddy.name.charAt(0)}
                    </div>
                    <div
                      className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center",
                        getStatusColor(buddy.status),
                      )}
                    >
                      {getStatusIcon(buddy.status)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{buddy.name}</div>
                    <div className="text-xs text-gray-500">
                      {buddy.guardianKey}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-xs bg-blue-100 text-blue-800">
                        <Heart className="h-3 w-3 mr-1" />
                        {buddy.safetyScore}% safe
                      </Badge>
                      {buddy.checkInStreak > 0 && (
                        <Badge className="text-xs bg-green-100 text-green-800">
                          {buddy.checkInStreak} day streak
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {buddy.location && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      title={`Last seen: ${buddy.location.address}`}
                    >
                      <MapPin className="h-3 w-3" />
                    </Button>
                  )}

                  <Button
                    variant={buddy.youWatching ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleWatching(buddy.id)}
                    className="text-xs"
                  >
                    {buddy.youWatching ? "Watching" : "Watch"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBuddy(buddy);
                      sendCheckInRequest(buddy.id, checkInMessage);
                    }}
                    className="text-xs"
                  >
                    Check In
                  </Button>
                </div>
              </div>

              {buddy.location && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {buddy.location.address || "Location available"}
                  <span className="mx-1">•</span>
                  Last seen: {buddy.lastSeen.toLocaleTimeString()}
                </div>
              )}
            </motion.div>
          ))}

          {buddies.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No guardian buddies yet</p>
              <p className="text-sm">
                Add friends to start watching each other's safety
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {buddies.length}
              </div>
              <div className="text-xs text-gray-500">Buddies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {buddies.filter((b) => b.status === "online").length}
              </div>
              <div className="text-xs text-gray-500">Online</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {checkInRequests.length}
              </div>
              <div className="text-xs text-gray-500">Check-ins Today</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
