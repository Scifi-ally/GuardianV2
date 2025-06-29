import {
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Clock,
  Users,
} from "lucide-react";
import { CustomButton } from "@/components/CustomButton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { emergencyContactService } from "@/services/emergencyContactService";

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
  const { userProfile } = useAuth();

  const shareLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const message = `Guardian Location Share: I'm at https://maps.google.com/?q=${latitude},${longitude}\n\nShared via Guardian Safety App at ${new Date().toLocaleString()}`;

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

  const sendQuickText = async () => {
    if (!userProfile) {
      alert("Please sign in to use this feature");
      return;
    }

    const emergencyContacts = userProfile.emergencyContacts || [];
    if (emergencyContacts.length === 0) {
      alert("No emergency contacts found. Please add contacts first.");
      return;
    }

    const message = `Guardian Safety Check: This is ${userProfile.displayName || "Guardian User"}. I'm checking in to let you know my status. If this is an emergency, please contact me immediately.`;

    // Send to first emergency contact or all contacts
    const firstContact = emergencyContacts[0];
    if (firstContact && firstContact.phone) {
      window.location.href = `sms:${firstContact.phone}?body=${encodeURIComponent(message)}`;
    } else {
      // Fallback to generic SMS
      window.location.href = `sms:?body=${encodeURIComponent(message)}`;
    }
  };

  const startSafeRoute = () => {
    // Open route planning
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        // Open Google Maps with current location
        const url = `https://www.google.com/maps/@${latitude},${longitude},15z`;
        window.open(url, "_blank");
      });
    } else {
      // Fallback to Google Maps
      window.open("https://www.google.com/maps", "_blank");
    }
  };

  const startCheckIn = () => {
    if (!userProfile) {
      alert("Please sign in to use this feature");
      return;
    }

    const emergencyContacts = userProfile.emergencyContacts || [];
    if (emergencyContacts.length === 0) {
      alert("No emergency contacts found. Please add contacts first.");
      return;
    }

    // Set up a check-in timer (simplified version)
    const checkInTime = 30; // 30 minutes
    const message = `Guardian Check-in: I'm starting a ${checkInTime}-minute safety check-in. If you don't hear from me by ${new Date(Date.now() + checkInTime * 60000).toLocaleTimeString()}, please check on me.`;

    const firstContact = emergencyContacts[0];
    if (firstContact && firstContact.phone) {
      window.location.href = `sms:${firstContact.phone}?body=${encodeURIComponent(message)}`;
    }

    // Set a local reminder
    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification("Guardian Check-in Reminder", {
          body: "Time to check in with your emergency contacts",
          icon: "/favicon.ico",
        });
      } else {
        alert("Check-in time! Please contact your emergency contacts.");
      }
    }, checkInTime * 60000);

    alert(`Check-in timer set for ${checkInTime} minutes`);
  };

  const manageContacts = () => {
    // Navigate to contacts page or open contacts panel
    window.location.hash = "#/contacts";
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
      onClick: startSafeRoute,
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
      icon: Clock,
      label: "Check-in",
      variant: "warning" as const,
      onClick: startCheckIn,
    },
    {
      icon: Users,
      label: "Contacts",
      variant: "default" as const,
      onClick: manageContacts,
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
