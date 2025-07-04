import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CustomCheckbox({
  checked,
  onChange,
  disabled = false,
  className,
  size = "md",
}: CustomCheckboxProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const checkSizeClasses = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative rounded-md border-2 transition-all duration-200 flex items-center justify-center",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "focus-visible:outline-none",
        checked
          ? "bg-primary border-primary text-primary-foreground"
          : "bg-background border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "hover:scale-105 active:scale-95 cursor-pointer",
        sizeClasses[size],
        className,
      )}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      initial={false}
      animate={{
        backgroundColor: checked ? "var(--primary)" : "var(--background)",
        borderColor: checked ? "var(--primary)" : "var(--border)",
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        initial={false}
        animate={{
          scale: checked ? 1 : 0,
          opacity: checked ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Check className={cn("stroke-[3]", checkSizeClasses[size])} />
      </motion.div>
    </motion.button>
  );
}
