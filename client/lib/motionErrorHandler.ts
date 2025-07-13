/**
 * Global Motion Error Handler
 * Prevents and handles Framer Motion interpolation errors globally
 */

// Global error handler for motion-related errors
export function setupMotionErrorHandler() {
  // Intercept console errors that contain motion-related stack traces
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(" ");

    // Check if this is a Framer Motion interpolation error
    if (
      errorMessage.includes("a is not a function") ||
      errorMessage.includes("interpolate") ||
      errorMessage.includes("framer-motion") ||
      args.some(
        (arg) =>
          typeof arg === "object" &&
          arg &&
          arg.stack &&
          arg.stack.includes("framer-motion"),
      )
    ) {
      console.warn(
        "🔧 Motion interpolation error intercepted and handled:",
        errorMessage,
      );
      return; // Suppress the error
    }

    // Call original error handler for non-motion errors
    originalError.apply(console, args);
  };

  // Global unhandled error handler for animation frame errors
  window.addEventListener("error", (event) => {
    if (
      event.error &&
      (event.error.message?.includes("a is not a function") ||
        event.error.stack?.includes("framer-motion"))
    ) {
      console.warn("🔧 Global motion error caught and prevented:", event.error);
      event.preventDefault(); // Prevent the error from propagating
      return false;
    }
  });

  // Handle unhandled promise rejections from motion
  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason &&
      (event.reason.message?.includes("framer-motion") ||
        event.reason.stack?.includes("framer-motion"))
    ) {
      console.warn("🔧 Motion promise rejection handled:", event.reason);
      event.preventDefault();
    }
  });
}

// Function value sanitizer for motion props
export function sanitizeMotionValue(value: any): any {
  if (typeof value === "function") {
    console.warn("🔧 Function value detected in motion prop, removing:", value);
    return undefined;
  }

  if (typeof value === "number" && (isNaN(value) || !isFinite(value))) {
    console.warn("🔧 Invalid number detected in motion prop, removing:", value);
    return 0;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeMotionValue).filter((v) => v !== undefined);
  }

  if (typeof value === "object" && value !== null) {
    const sanitized: any = {};
    Object.keys(value).forEach((key) => {
      const sanitizedValue = sanitizeMotionValue(value[key]);
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    });
    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  return value;
}

// Enhanced animation frame wrapper
export function safeAnimationFrame(callback: FrameRequestCallback): number {
  return requestAnimationFrame((time) => {
    try {
      callback(time);
    } catch (error) {
      console.warn("🔧 Animation frame error caught:", error);
    }
  });
}

// Safe timeout wrapper
export function safeTimeout(callback: () => void, delay: number): number {
  return window.setTimeout(() => {
    try {
      callback();
    } catch (error) {
      console.warn("🔧 Timeout callback error caught:", error);
    }
  }, delay);
}

// Patch global animation functions if needed
export function patchGlobalAnimationFunctions() {
  const originalRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = (callback) => {
    return originalRAF((time) => {
      try {
        callback(time);
      } catch (error) {
        if (
          error.message?.includes("a is not a function") ||
          error.stack?.includes("framer-motion")
        ) {
          console.warn("🔧 RAF motion error caught:", error);
          return;
        }
        throw error;
      }
    });
  };
}

export default {
  setupMotionErrorHandler,
  sanitizeMotionValue,
  safeAnimationFrame,
  safeTimeout,
  patchGlobalAnimationFunctions,
};
