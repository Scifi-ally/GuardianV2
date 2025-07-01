/**
 * Utility function to copy text to clipboard with fallback support
 * Handles permissions issues and browser compatibility
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) {
    console.warn("No text provided to copy");
    return false;
  }

  // Fallback method using document.execCommand
  const copyWithFallback = (): boolean => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      return successful;
    } catch (err) {
      console.error("Fallback copy failed:", err);
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  };

  // Try modern clipboard API first, but fall back immediately on any error
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // Check clipboard permissions first
      try {
        const permission = await navigator.permissions.query({
          name: "clipboard-write" as PermissionName,
        });
        if (permission.state === "granted" || permission.state === "prompt") {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (permissionError) {
        // Permissions API not available, try clipboard anyway
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (clipboardError) {
          console.log("Clipboard API failed, using fallback:", clipboardError);
          return copyWithFallback();
        }
      }
    }
    // If permissions denied or API not available, use fallback
    return copyWithFallback();
  } catch (error) {
    console.log("Modern clipboard failed, using fallback:", error);
    return copyWithFallback();
  }
};
