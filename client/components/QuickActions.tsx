import {
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Camera,
  AlertCircle,
} from "lucide-react";
import { CustomButton } from "@/components/CustomButton";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: typeof MapPin;
  label: string;
  onClick?: () => void;
  variant?: "default" | "emergency" | "safe" | "warning";
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
}: QuickActionProps) {
  const variantStyles = {
    default: "bg-muted hover:bg-muted/80 text-muted-foreground",
    emergency: "bg-emergency/10 hover:bg-emergency/20 text-emergency",
    safe: "bg-safe/10 hover:bg-safe/20 text-safe",
    warning: "bg-warning/10 hover:bg-warning/20 text-warning",
  };

  return (
    <CustomButton
      onClick={onClick}
      variant={
        variant === "emergency"
          ? "emergency"
          : variant === "safe"
            ? "black"
            : "secondary"
      }
      className={cn(
        "h-16 flex-col gap-1 text-xs font-medium rounded-xl",
        "border-2 shadow-lg hover:shadow-xl transform hover:scale-105",
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </CustomButton>
  );
}

export function QuickActions() {
  const shareLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const message = `Guardian Alert: I'm at https://maps.google.com/?q=${latitude},${longitude}`;

          if (navigator.share) {
            await navigator.share({
              title: "Guardian Location",
              text: message,
            });
          } else {
            await navigator.clipboard.writeText(message);
            alert("Location copied to clipboard!");
          }
        });
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const callEmergency = () => {
    window.location.href = "tel:911";
  };

  const sendQuickText = () => {
    const message = "Guardian Alert: I need help! Please check on me.";
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  const takeEvidence = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() =>
          alert(
            "Camera access granted. In a real app, this would open the camera.",
          ),
        )
        .catch(() =>
          alert("Camera access denied. Please enable camera permissions."),
        );
    } else {
      alert("Camera not available on this device.");
    }
  };

  const reportIncident = () => {
    alert(
      "Incident report feature would open here. This connects to emergency services.",
    );
  };

  const actions = [
    {
      icon: MapPin,
      label: "Share Location",
      variant: "safe" as const,
      onClick: shareLocation,
    },
    {
      icon: Navigation,
      label: "Safe Route",
      variant: "default" as const,
      onClick: () => (window.location.hash = "#/navigation"),
    },
    {
      icon: Phone,
      label: "Call 911",
      variant: "emergency" as const,
      onClick: callEmergency,
    },
    {
      icon: MessageCircle,
      label: "Quick Text",
      variant: "default" as const,
      onClick: sendQuickText,
    },
    {
      icon: Camera,
      label: "Evidence",
      variant: "warning" as const,
      onClick: takeEvidence,
    },
    {
      icon: AlertCircle,
      label: "Report",
      variant: "warning" as const,
      onClick: reportIncident,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {actions.map((action, index) => (
        <QuickActionButton key={index} {...action} />
      ))}
    </div>
  );
}
