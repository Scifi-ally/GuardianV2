import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 btn-professional",
  {
    variants: {
      variant: {
        default: "btn-professional",
        primary: "btn-professional-primary",
        destructive:
          "bg-gradient-to-br from-red-400 to-red-500 text-white shadow-sm hover:from-red-500 hover:to-red-600 hover:shadow-lg border border-red-300 rounded-2xl",
        outline:
          "border border-slate-200 bg-white/90 shadow-sm hover:bg-white hover:border-slate-300 hover:shadow-md rounded-2xl",
        secondary:
          "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 shadow-sm hover:from-slate-100 hover:to-slate-200 border border-slate-200 rounded-2xl",
        ghost: "hover:bg-slate-50 hover:text-slate-700 rounded-2xl",
        link: "text-slate-600 underline-offset-4 hover:underline hover:text-slate-700",
        success:
          "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600 hover:shadow-lg border border-emerald-300 rounded-2xl",
        warning:
          "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm hover:from-amber-500 hover:to-amber-600 hover:shadow-lg border border-amber-300 rounded-2xl",
      },
      size: {
        default: "h-11 px-6 py-2.5 rounded-2xl",
        sm: "h-9 px-4 py-2 text-xs rounded-xl",
        lg: "h-13 px-8 py-3 text-base rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{
          scale: 1.02,
          y: -1,
          transition: { duration: 0.2, ease: "easeOut" },
        }}
        whileTap={{
          scale: 0.98,
          transition: { duration: 0.1 },
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
AnimatedButton.displayName = "AnimatedButton";

// Alias for compatibility
const PrimaryActionButton = AnimatedButton;

export { AnimatedButton, PrimaryActionButton, buttonVariants };
