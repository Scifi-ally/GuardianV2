import { Variants } from "framer-motion";

// Common easing functions
export const easing = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.175, 0.885, 0.32, 1.275],
  spring: { type: "spring", stiffness: 400, damping: 25 },
  springBounce: { type: "spring", stiffness: 300, damping: 20 },
  springSmooth: { type: "spring", stiffness: 200, damping: 30 },
} as const;

// Page transition animations
export const pageTransitions: Variants = {
  enter: {
    opacity: 0,
    scale: 0.98,
    y: 10,
  },
  center: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    y: -10,
    transition: {
      duration: 0.3,
      ease: easing.easeIn,
    },
  },
};

// Scroll-based animations
export const scrollAnimations: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: easing.easeOut,
    },
  },
};

// Stagger animations for lists
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easing.easeOut,
    },
  },
};

// Card animations
export const cardAnimations: Variants = {
  rest: {
    scale: 1,
    y: 0,
    rotateY: 0,
    transition: {
      duration: 0.2,
      ease: easing.easeOut,
    },
  },
  hover: {
    scale: 1.02,
    y: -5,
    rotateY: 2,
    transition: {
      duration: 0.2,
      ease: easing.easeOut,
    },
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: {
      duration: 0.1,
      ease: easing.easeOut,
    },
  },
};

// Button animations
export const buttonAnimations: Variants = {
  rest: {
    scale: 1,
    transition: {
      duration: 0.2,
      ease: easing.springSmooth,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: easing.springSmooth,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: easing.springSmooth,
    },
  },
};

// Modal animations
export const modalAnimations: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: easing.easeIn,
    },
  },
};

// Slide animations
export const slideAnimations = {
  slideUp: {
    hidden: {
      opacity: 0,
      y: 50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: easing.easeOut,
      },
    },
  },
  slideDown: {
    hidden: {
      opacity: 0,
      y: -50,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: easing.easeOut,
      },
    },
  },
  slideLeft: {
    hidden: {
      opacity: 0,
      x: -50,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: easing.easeOut,
      },
    },
  },
  slideRight: {
    hidden: {
      opacity: 0,
      x: 50,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: easing.easeOut,
      },
    },
  },
};

// Loading animations
export const loadingAnimations: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: easing.easeInOut,
    },
  },
  bounce: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: easing.easeInOut,
    },
  },
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
  shimmer: {
    x: [-100, 100],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Notification animations
export const notificationAnimations: Variants = {
  hidden: {
    opacity: 0,
    y: -50,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: easing.bounce,
    },
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: easing.easeIn,
    },
  },
};

// Emergency/SOS animations
export const emergencyAnimations: Variants = {
  pulse: {
    scale: [1, 1.1, 1],
    boxShadow: [
      "0 0 0 0 rgba(239, 68, 68, 0.4)",
      "0 0 0 10px rgba(239, 68, 68, 0)",
      "0 0 0 0 rgba(239, 68, 68, 0)",
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: easing.easeInOut,
    },
  },
  shake: {
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.5,
      ease: easing.easeInOut,
    },
  },
  glow: {
    boxShadow: [
      "0 0 20px rgba(239, 68, 68, 0.5)",
      "0 0 40px rgba(239, 68, 68, 0.8)",
      "0 0 20px rgba(239, 68, 68, 0.5)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: easing.easeInOut,
    },
  },
};

// Complex animations for specific components
export const complexAnimations = {
  magneticHover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 15,
    },
  },
  floatingCard: {
    y: [0, -10, 0],
    rotate: [0, 1, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: easing.easeInOut,
    },
  },
  morphingButton: {
    borderRadius: ["20px", "50px", "20px"],
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: easing.easeInOut,
    },
  },
  liquidButton: {
    scaleX: [1, 1.1, 1],
    scaleY: [1, 0.9, 1],
    transition: {
      duration: 0.3,
      ease: easing.elastic,
    },
  },
};

// Utility functions for dynamic animations
export const createStaggerAnimation = (delay: number = 0.1) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: delay,
    },
  },
});

export const createSlideAnimation = (
  direction: "up" | "down" | "left" | "right",
  distance: number = 50,
) => {
  const axis = ["up", "down"].includes(direction) ? "y" : "x";
  const multiplier =
    direction === "down" || direction === "right" ? distance : -distance;

  return {
    hidden: {
      opacity: 0,
      [axis]: multiplier,
    },
    visible: {
      opacity: 1,
      [axis]: 0,
      transition: {
        duration: 0.5,
        ease: easing.easeOut,
      },
    },
  };
};

export const createBounceAnimation = (
  scale: number = 1.1,
  duration: number = 0.6,
) => ({
  scale: [1, scale, 1],
  transition: {
    duration,
    ease: easing.bounce,
  },
});

// Performance-optimized animations
export const performanceAnimations = {
  // Use transform and opacity only for better performance
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    },
  },
  slideInFromLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  },
};

export default {
  easing,
  pageTransitions,
  scrollAnimations,
  staggerContainer,
  staggerItem,
  cardAnimations,
  buttonAnimations,
  modalAnimations,
  slideAnimations,
  loadingAnimations,
  notificationAnimations,
  emergencyAnimations,
  complexAnimations,
  performanceAnimations,
  createStaggerAnimation,
  createSlideAnimation,
  createBounceAnimation,
};
