// Global error handling utility to ensure proper error serialization

export function serializeError(error: any): string {
  if (!error) return "Unknown error";

  if (typeof error === "string") return error;

  // Handle GeolocationPositionError specifically
  if (
    error instanceof GeolocationPositionError ||
    (error &&
      typeof error.code === "number" &&
      error.code >= 1 &&
      error.code <= 3)
  ) {
    const errorNames = {
      1: "PERMISSION_DENIED - User denied location access",
      2: "POSITION_UNAVAILABLE - Location information unavailable",
      3: "TIMEOUT - Location request timed out",
    };

    return `Geolocation Error: ${errorNames[error.code as keyof typeof errorNames] || "Unknown"} (Code: ${error.code}) - ${error.message || "No additional details"}`;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? "\nStack: " + error.stack.split("\n").slice(0, 3).join("\n") : ""}`;
  }

  // Handle objects with toString method
  if (
    error &&
    typeof error.toString === "function" &&
    error.toString !== Object.prototype.toString
  ) {
    return error.toString();
  }

  // Try to extract meaningful information from objects
  if (typeof error === "object") {
    try {
      const keys = Object.keys(error);
      if (keys.length === 0) {
        return "Empty error object";
      }

      // Common error properties to extract
      const commonProps = ["message", "code", "name", "type", "error"];
      const relevantInfo: any = {};

      commonProps.forEach((prop) => {
        if (error[prop] !== undefined) {
          relevantInfo[prop] = error[prop];
        }
      });

      if (Object.keys(relevantInfo).length > 0) {
        return JSON.stringify(relevantInfo, null, 2);
      }

      // Fallback to full object serialization
      return JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } catch (stringifyError) {
      return `Complex error object that cannot be serialized: ${error.constructor?.name || typeof error}`;
    }
  }

  return `Unknown error type: ${typeof error} - ${String(error)}`;
}

export function logError(context: string, error: any, additionalInfo?: any) {
  const serializedError = serializeError(error);

  console.group(`🚫 ${context}`);
  console.error("Error details:", serializedError);

  if (additionalInfo) {
    console.error("Additional context:", additionalInfo);
  }

  // Also log raw error for debugging
  console.error("Raw error object:", error);
  console.groupEnd();
}

// Global error listener for unhandled location errors
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (
      event.error &&
      (event.message?.includes("geolocation") ||
        event.message?.includes("location") ||
        event.error instanceof GeolocationPositionError)
    ) {
      logError("Unhandled Location Error", event.error, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
      });
    }
  });
}
