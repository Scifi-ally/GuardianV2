import React, { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  pressAnimation?: boolean;
  hoverScale?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(
  (
    {
      children,
      loading = false,
      loadingText,
      pressAnimation = true,
      hoverScale = true,
      icon,
      iconPosition = "left",
      className,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleMouseDown = () => {
      if (pressAnimation && !disabled && !loading) {
        setIsPressed(true);
      }
    };

    const handleMouseUp = () => {
      setIsPressed(false);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading && onClick) {
        // Add a subtle haptic feedback effect
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        onClick(e);
      }
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "relative transition-all duration-200 ease-out transform",
          hoverScale && "hover:scale-[1.02] active:scale-[0.98]",
          pressAnimation && isPressed && "scale-[0.96]",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/20",
          className,
        )}
        disabled={disabled || loading}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <LoadingAnimation size="sm" variant="dots" />
            <span>{loadingText || "Loading..."}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {icon && iconPosition === "left" && (
              <span className="transition-transform duration-200 ease-out">
                {icon}
              </span>
            )}
            <span>{children}</span>
            {icon && iconPosition === "right" && (
              <span className="transition-transform duration-200 ease-out group-hover:translate-x-0.5">
                {icon}
              </span>
            )}
          </div>
        )}
      </Button>
    );
  },
);

AnimatedButton.displayName = "AnimatedButton";

// Emergency button variant
export const EmergencyButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(({ className, ...props }, ref) => {
  return (
    <AnimatedButton
      ref={ref}
      className={cn(
        "bg-red-600 hover:bg-red-700 text-white font-bold",
        "shadow-lg hover:shadow-xl",
        "ring-red-500/50 focus:ring-red-500/50",
        "animate-pulse hover:animate-none",
        className,
      )}
      {...props}
    />
  );
});

EmergencyButton.displayName = "EmergencyButton";

// Primary action button variant
export const PrimaryActionButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(({ className, ...props }, ref) => {
  return (
    <AnimatedButton
      ref={ref}
      className={cn(
        "bg-black hover:bg-gray-800 text-white font-medium",
        "shadow-md hover:shadow-lg",
        "ring-black/20 focus:ring-black/30",
        className,
      )}
      {...props}
    />
  );
});

PrimaryActionButton.displayName = "PrimaryActionButton";
