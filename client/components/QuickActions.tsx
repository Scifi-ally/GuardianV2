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
  const getButtonVariant = () => {
    switch (variant) {
      case "emergency":
        return "emergency";
      case "safe":
        return "primary"; // Changed from "black" to "primary" for better visibility
      default:
        return "secondary";
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "emergency":
        return "text-white";
      case "safe":
        return "text-green-600";
      case "warning":
        return "text-orange-600";
      default:
        return "text-gray-700";
    }
  };

  return (
    <CustomButton
      onClick={onClick}
      variant={getButtonVariant()}
      className={cn(
        "h-16 flex-col gap-1 text-xs font-medium rounded-xl",
        "border-2 shadow-lg hover:shadow-xl transform hover:scale-105",
        "min-h-16 w-full", // Ensure full width and minimum height
      )}
    >
      <Icon className={cn("h-5 w-5", getIconColor())} />
      <span className="font-semibold">{label}</span>
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
            try {
              await navigator.share({
                title: "Guardian Location",
                text: message,
              });
            } catch (shareError) {
              // Fallback to clipboard
              await copyToClipboardSafe(message);
              alert("Location copied to clipboard!");
            }
          } else {
            await copyToClipboardSafe(message);
            alert("Location copied to clipboard!");
          }
        });
      }
    } catch (error) {
      console.error("Share failed:", error);
      alert("Failed to get location. Please check your location permissions.");
    }
  };

  // Safe clipboard copy function with fallback
  const copyToClipboardSafe = async (text: string): Promise<void> => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }

      // Fallback method
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);

      try {
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      // Show the text to user as last resort
      prompt("Copy this location manually:", text);
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
