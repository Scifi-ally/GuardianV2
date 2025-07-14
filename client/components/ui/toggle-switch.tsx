import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  description?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  className,
  size = "md",
  label,
  description,
}: ToggleSwitchProps) {
  const sizeClasses = {
    sm: {
      container: "w-10 h-5",
      thumb: "w-4 h-4",
      translate: "translate-x-5",
    },
    md: {
      container: "w-12 h-6",
      thumb: "w-5 h-5",
      translate: "translate-x-6",
    },
    lg: {
      container: "w-14 h-7",
      thumb: "w-6 h-6",
      translate: "translate-x-7",
    },
  };

  const { container, thumb, translate } = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <p className="text-sm font-medium text-foreground">{label}</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative inline-flex items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          container,
          checked
            ? "bg-primary shadow-lg shadow-primary/25"
            : "bg-muted hover:bg-muted/80",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer",
        )}
      >
        <span className="sr-only">
          {checked ? "Disable" : "Enable"} {label || "toggle"}
        </span>
        <motion.span
          className={cn(
            "pointer-events-none inline-block rounded-full bg-background shadow-lg transform ring-0 transition-transform duration-200 ease-in-out",
            thumb,
          )}
          animate={{
            x: checked
              ? `${size === "sm" ? "20px" : size === "md" ? "24px" : "28px"}`
              : "0px",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      </button>
    </div>
  );
}
