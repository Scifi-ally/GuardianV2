import { motion, MotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { sanitizeMotionProps } from "@/lib/motionUtils";

interface SafeMotionProps extends MotionProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export const SafeMotion = forwardRef<HTMLDivElement, SafeMotionProps>(
  ({ children, fallback, ...props }, ref) => {
    try {
      // Use the centralized motion utilities for sanitization
      const safeProps = sanitizeMotionProps(props);

      return (
        <motion.div ref={ref} {...safeProps}>
          {children}
        </motion.div>
      );
    } catch (error) {
      console.warn(
        "Motion animation error, falling back to static element:",
        error,
      );
      return (
        <div ref={ref} className={props.className}>
          {fallback || children}
        </div>
      );
    }
  },
);

SafeMotion.displayName = "SafeMotion";

export default SafeMotion;
