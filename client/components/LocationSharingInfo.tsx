import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Users,
  Shield,
  Eye,
  Clock,
  X,
  Info,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LocationSharingInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationSharingInfo({
  isOpen,
  onClose,
}: LocationSharingInfoProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-2 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-full">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Location Sharing
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        How people can view your location
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="p-1.5 bg-safe/20 rounded-full">
                        <Users className="w-4 h-4 text-safe" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">
                          Emergency Contacts
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Your emergency contacts can see your real-time
                          location when you start sharing
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="p-1.5 bg-primary/20 rounded-full">
                        <Shield className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">
                          Privacy Protected
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Only contacts you've added can see your location. It's
                          not public
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="p-1.5 bg-warning/20 rounded-full">
                        <Clock className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Time Limited</h4>
                        <p className="text-xs text-muted-foreground">
                          Sharing automatically stops after the selected
                          duration
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="p-1.5 bg-emergency/20 rounded-full">
                        <Eye className="w-4 h-4 text-emergency" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Live Updates</h4>
                        <p className="text-xs text-muted-foreground">
                          Your contacts see your location update every 30
                          seconds
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <h4 className="text-sm font-medium mb-2">
                      What contacts can see:
                    </h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-3 h-3" />
                        Your exact location on a map
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        When you started sharing
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        Location accuracy (±meters)
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={onClose} className="w-full">
                      Got it
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Info button component to trigger the popup
export function LocationSharingInfoButton() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowInfo(true)}
        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
        title="How location sharing works"
      >
        <Info className="w-3 h-3" />
      </Button>
      <LocationSharingInfo
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
      />
    </>
  );
}
