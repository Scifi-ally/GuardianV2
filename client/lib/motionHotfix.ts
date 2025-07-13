/**
 * Motion Hotfix - Emergency fix for Framer Motion interpolation errors
 * This provides safe alternatives and error handling
 */

import { motion, MotionProps, Variants } from "framer-motion";
import React from "react";

// Safe motion element creator with comprehensive error handling
const createSafeMotionElement = (element: any) => {
  return React.forwardRef<any, any>((props: any, ref: any) => {
    try {
      // Sanitize props to prevent interpolation errors
      const safeProps = { ...props };

      // Remove problematic values
      Object.keys(safeProps).forEach((key) => {
        if (
          key.startsWith("while") ||
          key === "animate" ||
          key === "initial" ||
          key === "exit"
        ) {
          const value = safeProps[key];
          if (typeof value === "object" && value !== null) {
            Object.keys(value).forEach((animKey) => {
              const animValue = value[animKey];
              if (
                typeof animValue === "function" ||
                animValue === undefined ||
                animValue === null
              ) {
                delete value[animKey];
              }
              // Check for invalid numbers
              if (
                typeof animValue === "number" &&
                (isNaN(animValue) || !isFinite(animValue))
              ) {
                delete value[animKey];
              }
            });
          }
        }
      });

      // Clean up transition object
      if (safeProps.transition && typeof safeProps.transition === "object") {
        Object.keys(safeProps.transition).forEach((key) => {
          const value = safeProps.transition[key];
          if (
            typeof value === "function" ||
            value === undefined ||
            value === null
          ) {
            delete safeProps.transition[key];
          }
        });
      }

      const MotionElement = motion[element];
      return React.createElement(
        MotionElement,
        { ...safeProps, ref },
        props.children,
      );
    } catch (error) {
      console.warn(`Motion error in ${element}, using static element:`, error);
      return React.createElement(
        element,
        {
          ref,
          className: props.className,
          style: props.style,
          onClick: props.onClick,
          onMouseEnter: props.onMouseEnter,
          onMouseLeave: props.onMouseLeave,
        },
        props.children,
      );
    }
  });
};

// Safe motion components
export const safeMotion = {
  div: createSafeMotionElement("div"),
  span: createSafeMotionElement("span"),
  button: createSafeMotionElement("button"),
  section: createSafeMotionElement("section"),
  article: createSafeMotionElement("article"),
  header: createSafeMotionElement("header"),
  footer: createSafeMotionElement("footer"),
  nav: createSafeMotionElement("nav"),
  main: createSafeMotionElement("main"),
  aside: createSafeMotionElement("aside"),
  ul: createSafeMotionElement("ul"),
  li: createSafeMotionElement("li"),
  p: createSafeMotionElement("p"),
  h1: createSafeMotionElement("h1"),
  h2: createSafeMotionElement("h2"),
  h3: createSafeMotionElement("h3"),
  h4: createSafeMotionElement("h4"),
  h5: createSafeMotionElement("h5"),
  h6: createSafeMotionElement("h6"),
};

// Safe variants helper
export const sanitizeVariants = (
  variants: Variants | undefined,
): Variants | undefined => {
  if (!variants) return undefined;

  const safe: Variants = {};
  Object.keys(variants).forEach((key) => {
    const variant = variants[key];
    if (typeof variant === "object" && variant !== null) {
      const safeVariant: any = {};
      Object.keys(variant).forEach((prop) => {
        const value = (variant as any)[prop];
        if (
          typeof value !== "function" &&
          value !== undefined &&
          value !== null
        ) {
          if (typeof value === "number" && (isNaN(value) || !isFinite(value))) {
            return; // Skip invalid numbers
          }
          safeVariant[prop] = value;
        }
      });
      safe[key] = safeVariant;
    }
  });

  return Object.keys(safe).length > 0 ? safe : undefined;
};

// Emergency override for problematic animations
export const emergencyAnimationOverride = {
  // Safe emergency pulse without functions
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },

  // Safe button hover
  buttonHover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },

  // Safe button tap
  buttonTap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: "easeOut",
    },
  },

  // Safe fade in
  fadeIn: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },

  // Safe slide up
  slideUp: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export default safeMotion;
