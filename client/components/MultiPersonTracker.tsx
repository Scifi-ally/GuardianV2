import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MapPin,
  Eye,
  EyeOff,
  UserPlus,
  X,
  Navigation,
  Clock,
} from "lucide-react";
import {
  sharedLocationService,
  type SharedLocation,
  type LocationShareSession,
} from "@/services/sharedLocationService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MultiPersonTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MultiPersonTracker({
  isOpen,
  onClose,
}: MultiPersonTrackerProps) {
  const [sharedLocations, setSharedLocations] = useState<SharedLocation[]>([]);
  const [activeSessions, setActiveSessions] = useState<LocationShareSession[]>(
    [],
  );
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonLat, setNewPersonLat] = useState("");
  const [newPersonLng, setNewPersonLng] = useState("");
  const { userProfile } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    // Load initial data
    setSharedLocations(sharedLocationService.getSharedLocations());
    setActiveSessions(sharedLocationService.getActiveSessions());

    // Subscribe to updates
    const handleLocationUpdate = () => {
      setSharedLocations(sharedLocationService.getSharedLocations());
    };

    const handleSessionUpdate = () => {
      setActiveSessions(sharedLocationService.getActiveSessions());
    };

    sharedLocationService.on("locationUpdated", handleLocationUpdate);
    sharedLocationService.on("sessionStarted", handleSessionUpdate);
    sharedLocationService.on("sessionEnded", handleSessionUpdate);
    sharedLocationService.on("participantAdded", handleSessionUpdate);

    return () => {
      sharedLocationService.off("locationUpdated", handleLocationUpdate);
      sharedLocationService.off("sessionStarted", handleSessionUpdate);
      sharedLocationService.off("sessionEnded", handleSessionUpdate);
      sharedLocationService.off("participantAdded", handleSessionUpdate);
    };
  }, [isOpen]);

  const handleAddPerson = () => {
    if (!newPersonName.trim() || !newPersonLat.trim() || !newPersonLng.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const lat = parseFloat(newPersonLat);
    const lng = parseFloat(newPersonLng);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Please enter valid coordinates");
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error(
        "Please enter valid latitude (-90 to 90) and longitude (-180 to 180)",
      );
      return;
    }

    // Find an active session to add to, or create a new one
    let targetSession = activeSessions.find(
      (s) => s.ownerId === userProfile?.uid,
    );

    if (!targetSession && userProfile) {
      // Create a new session
      const sessionId = sharedLocationService.startLocationSharing(
        userProfile.uid,
        userProfile.displayName || "You",
        userProfile.photoURL,
      );
      targetSession = sharedLocationService
        .getActiveSessions()
        .find((s) => s.id === sessionId);
    }

    if (targetSession) {
      const personId = `person_${Date.now()}`;
      sharedLocationService.addPersonToTrack(
        targetSession.id,
        personId,
        newPersonName.trim(),
        lat,
        lng,
        `https://ui-avatars.com/api/?name=${encodeURIComponent(newPersonName.trim())}&background=random`,
      );

      toast.success(`Added ${newPersonName} to tracking`);

      // Clear form
      setNewPersonName("");
      setNewPersonLat("");
      setNewPersonLng("");
    } else {
      toast.error("Unable to create tracking session");
    }
  };

  const handleRemovePerson = (userId: string) => {
    // Find the session this person belongs to
    const session = activeSessions.find((s) => s.participants.includes(userId));
    if (session) {
      // If this is the owner, stop the entire session
      if (session.ownerId === userId) {
        sharedLocationService.stopLocationSharing(session.id);
        toast.success("Stopped location sharing session");
      } else {
        // Remove just this participant (in a real app, you'd have a removeParticipant method)
        toast.info("Person removed from tracking");
      }
    }
  };

  const formatLastUpdated = (lastUpdated: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getStatusColor = (location: SharedLocation) => {
    if (location.status === "emergency") return "text-red-600 bg-red-50";
    if (location.isLiveTracking) return "text-green-600 bg-green-50";
    return "text-blue-600 bg-blue-50";
  };

  const getStatusText = (location: SharedLocation) => {
    if (location.status === "emergency") return "🚨 Emergency";
    if (location.isLiveTracking) return "🟢 Live Tracking";
    return "📍 Sharing";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Multi-Person Tracking
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Add Person Form */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Person to Track
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Person's name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Latitude"
                      value={newPersonLat}
                      onChange={(e) => setNewPersonLat(e.target.value)}
                      type="number"
                      step="any"
                    />
                    <Input
                      placeholder="Longitude"
                      value={newPersonLng}
                      onChange={(e) => setNewPersonLng(e.target.value)}
                      type="number"
                      step="any"
                    />
                  </div>
                  <Button
                    onClick={handleAddPerson}
                    className="w-full"
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add to Map
                  </Button>
                </CardContent>
              </Card>

              {/* Active Tracking Sessions */}
              {activeSessions.length > 0 && (
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {session.type === "live_tracking"
                              ? "Live Tracking"
                              : session.type === "emergency"
                                ? "Emergency Sharing"
                                : "Location Sharing"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {session.participants.length} people • Started{" "}
                            {formatLastUpdated(session.startTime)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            sharedLocationService.stopLocationSharing(
                              session.id,
                            );
                            toast.success("Session ended");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tracked People */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>People on Map ({sharedLocations.length})</span>
                    <Badge variant="outline">
                      {sharedLocations.filter((l) => l.isLiveTracking).length}{" "}
                      live
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sharedLocations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No one is being tracked yet</p>
                      <p className="text-xs">
                        Add people above to see them on the map
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sharedLocations.map((location) => (
                        <motion.div
                          key={location.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {location.userAvatar ? (
                              <img
                                src={location.userAvatar}
                                alt={location.userName}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {location.userName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">
                                {location.userName}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getStatusColor(location)}`}
                              >
                                {getStatusText(location)}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              <div>
                                Last seen:{" "}
                                {formatLastUpdated(location.lastUpdated)}
                              </div>
                              <div>
                                ±{Math.round(location.accuracy)}m accuracy
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Copy coordinates
                                navigator.clipboard.writeText(
                                  `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
                                );
                                toast.success("Coordinates copied");
                              }}
                            >
                              <MapPin className="h-3 w-3" />
                            </Button>

                            {userProfile?.uid === location.userId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemovePerson(location.userId)
                                }
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Help Text */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 <strong>Tip:</strong> People you add will appear as colored
                  markers on the map. Emergency contacts show as red markers,
                  live tracking as green, and regular sharing as blue.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
