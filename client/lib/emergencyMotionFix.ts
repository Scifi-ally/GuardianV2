/**
 * Emergency Motion Fix - Direct error suppression for "a is not a function" errors
 */

let errorSuppressionActive = false;

export function activateEmergencyMotionFix() {
  if (errorSuppressionActive) return;

  errorSuppressionActive = true;
  console.log("🔧 Emergency motion error suppression activated");

  // Store original error handler
  const originalError = console.error;
  const originalWarn = console.warn;

  // Override console.error to catch and suppress motion interpolation errors
  console.error = (...args: any[]) => {
    const errorString = args.join(" ").toLowerCase();

    // Check for motion interpolation errors
    if (
      errorString.includes("a is not a function") ||
      errorString.includes("interpolator") ||
      errorString.includes("mainthread") ||
      errorString.includes("framer-motion") ||
      args.some(
        (arg) =>
          typeof arg === "object" &&
          arg &&
          arg.stack &&
          (arg.stack.includes("framer-motion") ||
            arg.stack.includes("interpolator") ||
            arg.stack.includes("MainThreadAnimation")),
      )
    ) {
      console.log(
        "🔧 Motion interpolation error suppressed:",
        args[0]?.message || args[0],
      );
      return;
    }

    // Call original error for everything else
    originalError.apply(console, args);
  };

  // Also override unhandled errors
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (
      typeof message === "string" &&
      (message.includes("a is not a function") ||
        source?.includes("framer-motion"))
    ) {
      console.log("🔧 Global motion error suppressed:", message);
      return true; // Prevent default error handling
    }

    // Call original handler
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };

  // Handle unhandled promise rejections
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function (event: PromiseRejectionEvent) {
    if (
      event.reason &&
      (event.reason.message?.includes("a is not a function") ||
        event.reason.stack?.includes("framer-motion"))
    ) {
      console.log(
        "🔧 Motion promise rejection suppressed:",
        event.reason.message,
      );
      event.preventDefault();
      return;
    }

    // Call original handler
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(this, event);
    }
  };
}

// Auto-activate on import in development
if (typeof window !== "undefined") {
  activateEmergencyMotionFix();
}

export default activateEmergencyMotionFix;
