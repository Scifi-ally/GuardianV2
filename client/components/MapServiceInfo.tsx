import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  MapPin,
  Shield,
  ExternalLink,
  CheckCircle,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MapServiceInfoProps {
  isVisible: boolean;
  onClose: () => void;
  serviceStatus: "google" | "offline" | "error";
}

export function MapServiceInfo({
  isVisible,
  onClose,
  serviceStatus,
}: MapServiceInfoProps) {
  if (!isVisible) return null;

  const getStatusConfig = () => {
    switch (serviceStatus) {
      case "google":
        return {
          title: "Google Maps Active",
          description: "Using real-time Google Maps with full features",
          icon: CheckCircle,
          iconColor: "text-safe",
          bgColor: "bg-safe/5 border-safe/20",
          features: [
            "Real-time satellite imagery",
            "Live traffic data",
            "Street view integration",
            "Precise location accuracy",
          ],
        };
      case "offline":
        return {
          title: "Offline Map Mode",
          description: "Using Guardian's built-in map system",
          icon: Shield,
          iconColor: "text-primary",
          bgColor: "bg-primary/5 border-primary/20",
          features: [
            "Interactive map navigation",
            "Emergency contact tracking",
            "Location sharing",
            "Safe zone marking",
          ],
        };
      case "error":
        return {
          title: "Map Service Issue",
          description: "Google Maps billing needs to be enabled",
          icon: AlertTriangle,
          iconColor: "text-warning",
          bgColor: "bg-warning/5 border-warning/20",
          features: [
            "Enable Google Cloud billing",
            "Activate Maps JavaScript API",
            "Set up payment method",
            "Restart the application",
          ],
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className={cn("w-full max-w-md", config.bgColor)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-full",
                  serviceStatus === "google"
                    ? "bg-safe/20"
                    : serviceStatus === "offline"
                      ? "bg-primary/20"
                      : "bg-warning/20",
                )}
              >
                <Icon className={cn("h-5 w-5", config.iconColor)} />
              </div>
              <div>
                <CardTitle className="text-lg">{config.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              {serviceStatus === "error"
                ? "Required Steps:"
                : "Features Available:"}
            </h4>
            <ul className="space-y-2">
              {config.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  {serviceStatus === "error" ? (
                    <div className="w-2 h-2 bg-warning rounded-full" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-safe" />
                  )}
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {serviceStatus === "error" && (
            <div className="pt-3 border-t border-warning/20">
              <p className="text-xs text-muted-foreground mb-3">
                To enable Google Maps, visit the Google Cloud Console and:
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-warning/30 hover:bg-warning/10"
                onClick={() =>
                  window.open(
                    "https://console.cloud.google.com/billing",
                    "_blank",
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Google Cloud Console
              </Button>
            </div>
          )}

          {serviceStatus === "offline" && (
            <div className="pt-3 border-t border-primary/20">
              <Badge className="w-full justify-center bg-primary/10 text-primary hover:bg-primary/20">
                <Shield className="h-3 w-3 mr-1" />
                All safety features remain active
              </Badge>
            </div>
          )}

          <Button
            onClick={onClose}
            className="w-full mt-4"
            variant={serviceStatus === "error" ? "outline" : "default"}
          >
            Continue Using Guardian
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
