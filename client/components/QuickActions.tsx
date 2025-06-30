import {
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Camera,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-16 flex-col gap-1 text-xs font-medium",
        variantStyles[variant],
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Button>
  );
}

export function QuickActions() {
  const actions = [
    {
      icon: MapPin,
      label: "Share Location",
      variant: "safe" as const,
      onClick: () => console.log("Share location"),
    },
    {
      icon: Navigation,
      label: "Safe Route",
      variant: "default" as const,
      onClick: () => console.log("Safe route"),
    },
    {
      icon: Phone,
      label: "Call 911",
      variant: "emergency" as const,
      onClick: () => console.log("Call emergency"),
    },
    {
      icon: MessageCircle,
      label: "Quick Text",
      variant: "default" as const,
      onClick: () => console.log("Quick text"),
    },
    {
      icon: Camera,
      label: "Evidence",
      variant: "warning" as const,
      onClick: () => console.log("Take photo"),
    },
    {
      icon: AlertCircle,
      label: "Report",
      variant: "warning" as const,
      onClick: () => console.log("Report incident"),
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
