/**
 * Safe Motion Wrapper
 * Prevents Framer Motion interpolation errors by sanitizing all animation props
 */

import { motion, MotionProps } from "framer-motion";
import { forwardRef } from "react";

interface SafeMotionProps
  extends Omit<
    MotionProps,
    "animate" | "whileHover" | "whileTap" | "transition"
  > {
  animate?: any;
  whileHover?: any;
  whileTap?: any;
  transition?: any;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Sanitizes animation values to prevent interpolation errors
 */
function sanitizeAnimationValue(value: any): any {
  if (value === null || value === undefined) {
    return {};
  }

  if (typeof value === "function") {
    console.warn(
      "SafeMotion: Function passed as animation value, converting to empty object",
    );
    return {};
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const sanitized: any = {};
    for (const [key, val] of Object.entries(value)) {
      if (val === null || val === undefined || typeof val === "function") {
        // Skip invalid values
        continue;
      }

      if (typeof val === "object" && !Array.isArray(val)) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeAnimationValue(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Sanitizes transition object to prevent repeat: 0 issues
 */
function sanitizeTransition(transition: any): any {
  if (!transition || typeof transition !== "object") {
    return transition;
  }

  const sanitized = { ...transition };

  // Fix problematic repeat: 0 values
  if (sanitized.repeat === 0) {
    delete sanitized.repeat;
  }

  return sanitized;
}

export const SafeMotionDiv = forwardRef<HTMLDivElement, SafeMotionProps>(
  ({ animate, whileHover, whileTap, transition, children, ...props }, ref) => {
    const safeAnimate = sanitizeAnimationValue(animate);
    const safeWhileHover = sanitizeAnimationValue(whileHover);
    const safeWhileTap = sanitizeAnimationValue(whileTap);
    const safeTransition = sanitizeTransition(transition);

    return (
      <motion.div
        ref={ref}
        animate={safeAnimate}
        whileHover={safeWhileHover}
        whileTap={safeWhileTap}
        transition={safeTransition}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

SafeMotionDiv.displayName = "SafeMotionDiv";

export const SafeMotionButton = forwardRef<
  HTMLButtonElement,
  SafeMotionProps & { onClick?: () => void }
>(
  (
    { animate, whileHover, whileTap, transition, children, onClick, ...props },
    ref,
  ) => {
    const safeAnimate = sanitizeAnimationValue(animate);
    const safeWhileHover = sanitizeAnimationValue(whileHover);
    const safeWhileTap = sanitizeAnimationValue(whileTap);
    const safeTransition = sanitizeTransition(transition);

    return (
      <motion.button
        ref={ref}
        animate={safeAnimate}
        whileHover={safeWhileHover}
        whileTap={safeWhileTap}
        transition={safeTransition}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);

SafeMotionButton.displayName = "SafeMotionButton";

// Export a simple replacement for motion.div that prevents interpolation errors
export default SafeMotionDiv;
