import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface CustomButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "emergency" | "ghost" | "black";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
}

export function CustomButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon: Icon,
  className,
  disabled = false,
}: CustomButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gradient-to-r from-gray-900 to-black text-white hover:from-black hover:to-gray-800 shadow-lg hover:shadow-xl border border-gray-700",
    secondary:
      "bg-white text-black hover:bg-gray-100 shadow-md hover:shadow-lg border border-gray-300",
    emergency:
      "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl border border-red-500",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-gray-400",
    black:
      "bg-black text-white hover:bg-gray-900 shadow-xl border border-gray-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-md gap-1.5",
    md: "px-4 py-2 text-base rounded-lg gap-2",
    lg: "px-6 py-3 text-lg rounded-xl gap-2.5",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        "backdrop-blur-sm",
        className,
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6",
          )}
        />
      )}
      {children}
    </button>
  );
}

// Specialized button for SOS/Emergency
export function EmergencyCustomButton({
  children,
  onClick,
  className,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative bg-gradient-to-br from-red-600 via-red-700 to-red-800",
        "text-white font-bold shadow-2xl",
        "border-2 border-red-400/50",
        "hover:from-red-700 hover:via-red-800 hover:to-red-900",
        "hover:border-red-300/70 hover:shadow-red-500/30",
        "active:scale-95 transition-all duration-200",
        "focus:outline-none focus:ring-4 focus:ring-red-500/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "backdrop-blur-sm",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-inherit" />
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </button>
  );
}

// Custom map control button
export function MapControlButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-black/90 hover:bg-black text-white",
        "px-4 py-2 rounded-lg font-medium",
        "shadow-xl border border-white/20",
        "backdrop-blur-sm transition-all duration-200",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-white/50",
        "flex items-center gap-2",
        className,
      )}
    >
      {children}
    </button>
  );
}
