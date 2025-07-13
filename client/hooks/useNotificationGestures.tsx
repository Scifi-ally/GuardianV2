import { useEffect, useCallback } from "react";
import { dismissAllNotifications } from "@/services/enhancedNotificationService";

interface GestureOptions {
  enableSwipeUp?: boolean;
  enableShakeToCallHelp?: boolean;
  enableDoubleTapDismiss?: boolean;
  onEmergencyGesture?: () => void;
  onDismissGesture?: () => void;
}

export function useNotificationGestures(options: GestureOptions = {}) {
  const {
    enableSwipeUp = true,
    enableShakeToCallHelp = true,
    enableDoubleTapDismiss = true,
    onEmergencyGesture,
    onDismissGesture,
  } = options;

  // Shake detection for emergency
  const handleShake = useCallback(
    (event: DeviceMotionEvent) => {
      if (!enableShakeToCallHelp || !event.accelerationIncludingGravity) return;

      const { x, y, z } = event.accelerationIncludingGravity;
      const acceleration = Math.sqrt(x! * x! + y! * y! + z! * z!);

      // Threshold for shake detection
      if (acceleration > 25) {
        onEmergencyGesture?.();
      }
    },
    [enableShakeToCallHelp, onEmergencyGesture],
  );

  // Swipe up detection for dismissing notifications
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!enableSwipeUp) return;
      (event.target as any).touchStartY = event.touches[0].clientY;
    },
    [enableSwipeUp],
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!enableSwipeUp) return;

      const touchEndY = event.changedTouches[0].clientY;
      const touchStartY = (event.target as any).touchStartY;
      const swipeDistance = touchStartY - touchEndY;

      // Detect upward swipe (threshold: 50px)
      if (swipeDistance > 50) {
        const target = event.target as HTMLElement;
        // Check if the swipe was on a toast notification
        if (
          target.closest(".toaster") ||
          target.closest("[data-sonner-toast]")
        ) {
          onDismissGesture?.();
          dismissAllNotifications();
        }
      }
    },
    [enableSwipeUp, onDismissGesture],
  );

  // Double tap detection for dismissing notifications
  let lastTapTime = 0;
  const handleDoubleTap = useCallback(
    (event: TouchEvent) => {
      if (!enableDoubleTapDismiss) return;

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;

      if (tapLength < 500 && tapLength > 0) {
        const target = event.target as HTMLElement;
        if (
          target.closest(".toaster") ||
          target.closest("[data-sonner-toast]")
        ) {
          onDismissGesture?.();
          dismissAllNotifications();
        }
      }
      lastTapTime = currentTime;
    },
    [enableDoubleTapDismiss, onDismissGesture],
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Escape key to dismiss all notifications
      if (event.key === "Escape") {
        dismissAllNotifications();
        onDismissGesture?.();
      }

      // F1 for emergency (when notifications are visible)
      if (event.key === "F1" && document.querySelector(".toaster")) {
        event.preventDefault();
        onEmergencyGesture?.();
      }
    },
    [onDismissGesture, onEmergencyGesture],
  );

  useEffect(() => {
    // Add device motion listener for shake detection
    if (enableShakeToCallHelp && "DeviceMotionEvent" in window) {
      window.addEventListener("devicemotion", handleShake);
    }

    // Add touch listeners for swipe and double tap
    if (enableSwipeUp || enableDoubleTapDismiss) {
      document.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      document.addEventListener("touchend", handleTouchEnd, { passive: true });

      if (enableDoubleTapDismiss) {
        document.addEventListener("touchend", handleDoubleTap, {
          passive: true,
        });
      }
    }

    // Add keyboard listeners
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      if (enableShakeToCallHelp && "DeviceMotionEvent" in window) {
        window.removeEventListener("devicemotion", handleShake);
      }

      if (enableSwipeUp || enableDoubleTapDismiss) {
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchend", handleTouchEnd);

        if (enableDoubleTapDismiss) {
          document.removeEventListener("touchend", handleDoubleTap);
        }
      }

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enableShakeToCallHelp,
    enableSwipeUp,
    enableDoubleTapDismiss,
    handleShake,
    handleTouchStart,
    handleTouchEnd,
    handleDoubleTap,
    handleKeyDown,
  ]);

  return {
    dismissAllNotifications,
  };
}
