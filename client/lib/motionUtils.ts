/**
 * Utilities for safe Framer Motion usage
 * Prevents interpolation errors and undefined value animations
 */

import { MotionProps, Variants } from "framer-motion";

/**
 * Sanitizes animation values to prevent Framer Motion errors
 */
export function sanitizeAnimationValue(value: any): any {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "number") {
    return isNaN(value) || !isFinite(value) ? undefined : value;
  }

  if (typeof value === "string") {
    return value.trim() === "" ? undefined : value;
  }

  if (typeof value === "function") {
    // Only allow functions for specific properties
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeAnimationValue).filter((v) => v !== undefined);
  }

  if (typeof value === "object") {
    const sanitized: any = {};
    Object.keys(value).forEach((key) => {
      const sanitizedValue = sanitizeAnimationValue(value[key]);
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    });
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  return value;
}

/**
 * Sanitizes motion props to prevent animation errors
 */
export function sanitizeMotionProps(props: MotionProps): MotionProps {
  const sanitized = { ...props };

  // List of animation properties to sanitize
  const animationProps = [
    "animate",
    "initial",
    "exit",
    "whileHover",
    "whileTap",
    "whileInView",
    "whileFocus",
    "whileDrag",
  ] as const;

  animationProps.forEach((prop) => {
    if (sanitized[prop]) {
      const sanitizedValue = sanitizeAnimationValue(sanitized[prop]);
      if (sanitizedValue === undefined) {
        delete sanitized[prop];
      } else {
        sanitized[prop] = sanitizedValue;
      }
    }
  });

  // Special handling for transition
  if (sanitized.transition) {
    const sanitizedTransition = sanitizeAnimationValue(sanitized.transition);
    if (sanitizedTransition === undefined) {
      delete sanitized.transition;
    } else {
      sanitized.transition = sanitizedTransition;
    }
  }

  return sanitized;
}

/**
 * Sanitizes variants object to prevent interpolation errors
 */
export function sanitizeVariants(
  variants: Variants | undefined,
): Variants | undefined {
  if (!variants) return undefined;

  const sanitized: Variants = {};

  Object.keys(variants).forEach((key) => {
    const variant = sanitizeAnimationValue(variants[key]);
    if (variant !== undefined) {
      sanitized[key] = variant;
    }
  });

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Safe animation variants that are commonly used
 */
export const safeVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },

  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },

  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  bounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
    exit: { opacity: 0, scale: 0.3 },
  },
} as const;

/**
 * Safe transition presets
 */
export const safeTransitions = {
  default: {
    type: "tween",
    duration: 0.3,
    ease: "easeOut",
  },

  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },

  bounce: {
    type: "spring",
    stiffness: 260,
    damping: 20,
  },

  slow: {
    type: "tween",
    duration: 0.6,
    ease: "easeInOut",
  },

  fast: {
    type: "tween",
    duration: 0.15,
    ease: "easeOut",
  },
} as const;

/**
 * Creates safe motion props with error handling
 */
export function createSafeMotionProps(
  props: Partial<MotionProps> = {},
): MotionProps {
  try {
    return sanitizeMotionProps(props);
  } catch (error) {
    console.warn(
      "Error creating motion props, returning safe defaults:",
      error,
    );
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: safeTransitions.default,
    };
  }
}
