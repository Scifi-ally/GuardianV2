import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Users,
  Share2,
  AlertTriangle,
  Clock,
  Shield,
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/use-device-apis";
import { toast } from "sonner";

interface LocationShare {
  id: string;
  recipientName: string;
  recipientPhone: string;
  isActive: boolean;
  lastShared: Date;
  shareType: "continuous" | "one-time" | "sos";
  expiresAt?: Date;
}

interface SOSStatus {
  isActive: boolean;
  activatedAt: Date | null;
  sharedWithCount: number;
  autoSharing: boolean;
}

export function EnhancedLocationSharing() {
  const { userProfile } = useAuth();
  const { location } = useGeolocation();
  const [locationShares, setLocationShares] = useState<LocationShare[]>([]);
  const [sosStatus, setSOSStatus] = useState<SOSStatus>({
    isActive: false,
    activatedAt: null,
    sharedWithCount: 0,
    autoSharing: false,
  });
  const [isSharing, setIsSharing] = useState(false);

  // Initialize emergency contacts as location shares
  useEffect(() => {
    if (userProfile?.emergencyContacts) {
      const shares = userProfile.emergencyContacts.map((contact) => ({
        id: contact.id,
        recipientName: contact.name,
        recipientPhone: contact.phone,
        isActive: false,
        lastShared: new Date(),
        shareType: "continuous" as const,
      }));
      setLocationShares(shares);
    }
  }, [userProfile?.emergencyContacts]);

  const shareLocationWithContact = async (share: LocationShare) => {
    if (!location) {
      toast.error("Location not available. Please enable location services.");
      return;
    }

    try {
      setIsSharing(true);

      const coordinates = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      const message = sosStatus.isActive
        ? `🚨 EMERGENCY: I need help! My current location: ${coordinates} - Please respond immediately! Time: ${new Date().toLocaleString()}`
        : `📍 Location Update: I'm currently at coordinates ${coordinates} - Shared at ${new Date().toLocaleTimeString()}`;

      // Try native sharing first (within app context)
      if (navigator.share) {
        try {
          await navigator.share({
            title: sosStatus.isActive
              ? "Emergency Location"
              : "Current Location",
            text: message,
          });

          // Update share status
          updateShareStatus(share.id);
          toast.success(`Location shared with ${share.recipientName}`);
          return;
        } catch (shareError) {
          console.log("Native sharing failed, trying clipboard fallback");
        }
      }

      // Fallback to clipboard copy (keeping everything in-app)
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(message);
        } else {
          // Fallback for non-secure contexts
          const textArea = document.createElement("textarea");
          textArea.value = message;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
        }

        updateShareStatus(share.id);
        toast.success(
          `Location message copied to clipboard for ${share.recipientName}. Paste and send manually.`,
          {
            description: `Contact: ${share.recipientPhone}`,
            duration: 5000,
          },
        );
      } catch (clipboardError) {
        console.error("Clipboard failed:", clipboardError);
        // Show the message in an alert as last resort
        alert(
          `Share this location with ${share.recipientName} (${share.recipientPhone}):\n\n${message}`,
        );
        updateShareStatus(share.id);
        toast.info(`Location details shown for ${share.recipientName}`);
      }
    } catch (error) {
      console.error("Failed to share location:", error);
      toast.error("Failed to share location");
    } finally {
      setIsSharing(false);
    }
  };

  const updateShareStatus = (shareId: string) => {
    setLocationShares((prev) =>
      prev.map((share) =>
        share.id === shareId
          ? { ...share, isActive: true, lastShared: new Date() }
          : share,
      ),
    );
  };

  const toggleContinuousSharing = async (shareId: string, enabled: boolean) => {
    const share = locationShares.find((s) => s.id === shareId);
    if (!share) return;

    if (enabled) {
      // Start continuous sharing
      await shareLocationWithContact(share);

      // Set up interval for continuous updates (every 5 minutes)
      const interval = setInterval(
        async () => {
          const currentShare = locationShares.find((s) => s.id === shareId);
          if (currentShare?.isActive) {
            await shareLocationWithContact(currentShare);
          } else {
            clearInterval(interval);
          }
        },
        5 * 60 * 1000,
      );

      toast.success(`Continuous sharing started with ${share.recipientName}`);
    } else {
      // Stop continuous sharing
      setLocationShares((prev) =>
        prev.map((s) => (s.id === shareId ? { ...s, isActive: false } : s)),
      );
      toast.info(`Stopped sharing with ${share.recipientName}`);
    }
  };

  const activateSOSSharing = async () => {
    if (!location || !userProfile?.emergencyContacts?.length) {
      toast.error("No emergency contacts or location available");
      return;
    }

    try {
      setSOSStatus({
        isActive: true,
        activatedAt: new Date(),
        sharedWithCount: 0,
        autoSharing: true,
      });

      // Share with all emergency contacts immediately
      const sharePromises = userProfile.emergencyContacts.map(
        async (contact) => {
          const share = locationShares.find((s) => s.id === contact.id);
          if (share) {
            await shareLocationWithContact({
              ...share,
              shareType: "sos",
            });
            return contact.name;
          }
          return null;
        },
      );

      const sharedWith = (await Promise.all(sharePromises)).filter(Boolean);

      setSOSStatus((prev) => ({
        ...prev,
        sharedWithCount: sharedWith.length,
      }));

      toast.success(
        `Emergency location shared with ${sharedWith.length} contacts`,
        {
          duration: 10000,
        },
      );

      // Continue sharing every 30 seconds during SOS
      const sosInterval = setInterval(async () => {
        if (sosStatus.isActive && location) {
          userProfile.emergencyContacts?.forEach(async (contact) => {
            const share = locationShares.find((s) => s.id === contact.id);
            if (share) {
              await shareLocationWithContact({
                ...share,
                shareType: "sos",
              });
            }
          });
        } else {
          clearInterval(sosInterval);
        }
      }, 30000);
    } catch (error) {
      console.error("SOS sharing failed:", error);
      toast.error("Failed to activate SOS sharing");
    }
  };

  const deactivateSOS = () => {
    setSOSStatus({
      isActive: false,
      activatedAt: null,
      sharedWithCount: 0,
      autoSharing: false,
    });
    toast.info("SOS sharing deactivated");
  };

  const shareWithAll = async () => {
    const activeShares = locationShares.filter((share) =>
      userProfile?.emergencyContacts?.some(
        (contact) => contact.id === share.id,
      ),
    );

    for (const share of activeShares) {
      await shareLocationWithContact(share);
    }
  };

  if (!userProfile?.emergencyContacts?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="font-semibold mb-2">No Emergency Contacts</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add emergency contacts in your profile to enable location sharing.
          </p>
          <Button variant="outline" size="sm">
            Add Contacts
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* SOS Quick Actions */}
      <Card
        className={cn(
          "border-2 transition-all duration-300",
          sosStatus.isActive
            ? "border-red-500 bg-red-50 animate-pulse"
            : "border-gray-200",
        )}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                sosStatus.isActive ? "text-red-600" : "text-orange-500",
              )}
            />
            Emergency Location Sharing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sosStatus.isActive ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                <div>
                  <div className="font-semibold text-red-800">SOS ACTIVE</div>
                  <div className="text-xs text-red-600">
                    Sharing with {sosStatus.sharedWithCount} contacts
                  </div>
                  {sosStatus.activatedAt && (
                    <div className="text-xs text-red-600">
                      Since: {sosStatus.activatedAt.toLocaleTimeString()}
                    </div>
                  )}
                </div>
                <Button
                  onClick={deactivateSOS}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Stop SOS
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={activateSOSSharing}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!location}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Activate SOS
              </Button>
              <Button
                onClick={shareWithAll}
                variant="outline"
                disabled={!location || isSharing}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Contact Sharing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {locationShares.map((share) => (
            <motion.div
              key={share.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{share.recipientName}</div>
                <div className="text-xs text-gray-500">
                  {share.recipientPhone}
                </div>
                {share.isActive && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-600">
                      Last shared: {share.lastShared.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={share.isActive}
                  onCheckedChange={(checked) =>
                    toggleContinuousSharing(share.id, checked)
                  }
                  disabled={isSharing}
                />
                <Button
                  onClick={() => shareLocationWithContact(share)}
                  variant="outline"
                  size="sm"
                  disabled={isSharing || !location}
                  className="h-8 px-2"
                >
                  <Share2 className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Location Status */}
      {location && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-green-800">
                Location: {location.latitude.toFixed(4)},{" "}
                {location.longitude.toFixed(4)}
              </span>
              <Badge variant="secondary" className="text-xs">
                Accuracy: {Math.round(location.accuracy)}m
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
