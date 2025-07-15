import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        // Primary - Professional dark button
        primary:
          "bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white shadow-lg hover:shadow-xl border border-slate-600 hover:border-slate-500",

        // Secondary - Light professional button
        secondary:
          "bg-gradient-to-r from-white via-slate-50 to-slate-100 text-slate-700 shadow-md hover:shadow-lg border border-slate-200 hover:border-slate-300",

        // Success - Green gradient
        success:
          "bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white shadow-lg hover:shadow-xl border border-emerald-400 hover:border-emerald-300",

        // Danger - Red gradient for emergency
        danger:
          "bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white shadow-lg hover:shadow-xl border border-red-400 hover:border-red-300",

        // Warning - Orange gradient
        warning:
          "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg hover:shadow-xl border border-amber-400 hover:border-amber-300",

        // Info - Blue gradient
        info: "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl border border-blue-400 hover:border-blue-300",

        // Glass - Glassmorphism effect
        glass:
          "bg-white/80 backdrop-blur-xl text-slate-700 shadow-lg hover:shadow-xl border border-white/60 hover:border-white/80 hover:bg-white/90",

        // Ghost - Transparent with subtle hover
        ghost:
          "bg-transparent hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent hover:border-slate-200",

        // Outline - Modern outline style
        outline:
          "bg-transparent hover:bg-slate-50 text-slate-700 border-2 border-slate-300 hover:border-slate-400 hover:text-slate-800",

        // Gradient - Colorful gradient
        gradient:
          "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600",
      },
      size: {
        xs: "h-7 px-2 text-xs rounded-lg",
        sm: "h-9 px-3 text-sm rounded-xl",
        md: "h-11 px-6 text-sm rounded-xl",
        lg: "h-13 px-8 text-base rounded-2xl",
        xl: "h-16 px-10 text-lg rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
      animation: {
        none: "",
        subtle: "hover:scale-105 active:scale-95",
        bounce: "hover:scale-110 active:scale-90 hover:rotate-1",
        glow: "hover:shadow-2xl hover:shadow-current/25",
        float: "hover:-translate-y-1 active:translate-y-0",
        shimmer:
          "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      animation: "subtle",
    },
  },
);

export interface EnhancedButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      className,
      variant,
      size,
      animation,
      asChild = false,
      children,
      loading,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(
            enhancedButtonVariants({ variant, size, animation, className }),
          )}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        className={cn(
          enhancedButtonVariants({ variant, size, animation, className }),
        )}
        ref={ref}
        disabled={disabled || loading}
        whileHover={{
          scale: animation === "subtle" ? 1.02 : 1,
          y: animation === "float" ? -2 : 0,
        }}
        whileTap={{
          scale:
            animation === "subtle" ? 0.98 : animation === "bounce" ? 0.95 : 1,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        {...props}
      >
        {/* Shimmer effect overlay */}
        {animation === "shimmer" && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        )}

        {/* Ripple effect on click */}
        <div className="absolute inset-0 opacity-0 group-active:opacity-20 bg-white rounded-inherit transition-opacity duration-200" />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          {loading && (
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}
          {!loading && leftIcon && leftIcon}
          {children}
          {!loading && rightIcon && rightIcon}
        </div>
      </motion.button>
    );
  },
);
EnhancedButton.displayName = "EnhancedButton";

// Preset button components for common use cases
export const PrimaryButton = React.forwardRef<
  HTMLButtonElement,
  Omit<EnhancedButtonProps, "variant">
>((props, ref) => <EnhancedButton ref={ref} variant="primary" {...props} />);
PrimaryButton.displayName = "PrimaryButton";

export const SecondaryButton = React.forwardRef<
  HTMLButtonElement,
  Omit<EnhancedButtonProps, "variant">
>((props, ref) => <EnhancedButton ref={ref} variant="secondary" {...props} />);
SecondaryButton.displayName = "SecondaryButton";

export const SuccessButton = React.forwardRef<
  HTMLButtonElement,
  Omit<EnhancedButtonProps, "variant">
>((props, ref) => <EnhancedButton ref={ref} variant="success" {...props} />);
SuccessButton.displayName = "SuccessButton";

export const DangerButton = React.forwardRef<
  HTMLButtonElement,
  Omit<EnhancedButtonProps, "variant">
>((props, ref) => <EnhancedButton ref={ref} variant="danger" {...props} />);
DangerButton.displayName = "DangerButton";

export const GlassButton = React.forwardRef<
  HTMLButtonElement,
  Omit<EnhancedButtonProps, "variant">
>((props, ref) => <EnhancedButton ref={ref} variant="glass" {...props} />);
GlassButton.displayName = "GlassButton";

export const GradientButton = React.forwardRef<
  HTMLButtonElement,
  Omit<EnhancedButtonProps, "variant">
>((props, ref) => (
  <EnhancedButton ref={ref} variant="gradient" animation="shimmer" {...props} />
));
GradientButton.displayName = "GradientButton";

export { EnhancedButton, enhancedButtonVariants };
