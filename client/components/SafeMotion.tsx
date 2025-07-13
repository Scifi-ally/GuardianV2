import { motion, MotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";

interface SafeMotionProps extends MotionProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export const SafeMotion = forwardRef<HTMLDivElement, SafeMotionProps>(
  ({ children, fallback, ...props }, ref) => {
    try {
      // Sanitize animation properties to prevent interpolation errors
      const safeProps = { ...props };

      // Remove any undefined or null values from animation objects
      if (safeProps.animate && typeof safeProps.animate === "object") {
        Object.keys(safeProps.animate).forEach((key) => {
          if (
            safeProps.animate![key] === undefined ||
            safeProps.animate![key] === null
          ) {
            delete safeProps.animate![key];
          }
        });
      }

      if (safeProps.initial && typeof safeProps.initial === "object") {
        Object.keys(safeProps.initial).forEach((key) => {
          if (
            safeProps.initial![key] === undefined ||
            safeProps.initial![key] === null
          ) {
            delete safeProps.initial![key];
          }
        });
      }

      if (safeProps.whileHover && typeof safeProps.whileHover === "object") {
        Object.keys(safeProps.whileHover).forEach((key) => {
          if (
            safeProps.whileHover![key] === undefined ||
            safeProps.whileHover![key] === null
          ) {
            delete safeProps.whileHover![key];
          }
        });
      }

      if (safeProps.whileTap && typeof safeProps.whileTap === "object") {
        Object.keys(safeProps.whileTap).forEach((key) => {
          if (
            safeProps.whileTap![key] === undefined ||
            safeProps.whileTap![key] === null
          ) {
            delete safeProps.whileTap![key];
          }
        });
      }

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
