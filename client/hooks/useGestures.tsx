import { useEffect, useRef, useState } from "react";
import { unifiedNotifications } from "@/services/unifiedNotificationService";

interface GestureOptions {
  enableQuickShare?: boolean;
  enableNavigationGestures?: boolean;
  onQuickShare?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
  touches: number;
}

export function useGestures(options: GestureOptions = {}) {
  const {
    enableQuickShare = true,
    enableNavigationGestures = true,
    onQuickShare,
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
  } = options;

  const touchData = useRef<TouchData | null>(null);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  // Removed gesture-based SOS functionality for safety

  // Removed SOS tap gesture for safety

  // Removed panic gesture for safety

  // Swipe Gestures: Directional swipes for navigation
  const handleTouchStart = (event: TouchEvent) => {
    if (!enableNavigationGestures || !gesturesEnabled) return;

    const touch = event.touches[0];
    touchData.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      touches: event.touches.length,
    };
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (!enableNavigationGestures || !gesturesEnabled || !touchData.current)
      return;

    const touch = event.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const deltaX = endX - touchData.current.startX;
    const deltaY = endY - touchData.current.startY;
    const deltaTime = Date.now() - touchData.current.startTime;

    // Only register as swipe if it's fast enough and long enough
    if (deltaTime > 500 || (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50)) {
      touchData.current = null;
      return;
    }

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        // Swipe right
        handleSwipeRight();
      } else {
        // Swipe left
        handleSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY < 0) {
        // Swipe up
        handleSwipeUp();
      } else {
        // Swipe down
        handleSwipeDown();
      }
    }

    touchData.current = null;
  };

  // Removed shake detection for safety

  // Removed gesture trigger functions for safety

  const handleSwipeUp = () => {
    onSwipeUp?.();
  };

  const handleSwipeDown = () => {
    onSwipeDown?.();
  };

  const handleSwipeLeft = () => {
    onSwipeLeft?.();
  };

  const handleSwipeRight = () => {
    onSwipeRight?.();
  };

  // Quick Share: Two-finger tap
  const handleQuickShare = (event: TouchEvent) => {
    if (!enableQuickShare || !gesturesEnabled) return;

    if (event.touches.length === 2) {
      const timer = setTimeout(() => {
        unifiedNotifications.success("Quick share activated", {
          message: "Location copied to clipboard for sharing",
        });
        onQuickShare?.();
      }, 500);

      const cleanup = () => {
        clearTimeout(timer);
        document.removeEventListener("touchend", cleanup);
      };

      document.addEventListener("touchend", cleanup);
    }
  };

  // Setup event listeners
  useEffect(() => {
    if (!gesturesEnabled) return;

    const handleTouch = (event: TouchEvent) => {
      handleQuickShare(event);
    };

    // Add event listeners
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
    document.addEventListener("touchstart", handleTouch, { passive: false });

    // Removed device motion listeners for safety

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchstart", handleTouch);

      // Removed device motion cleanup
    };
  }, [gesturesEnabled, enableQuickShare, enableNavigationGestures]);

  return {
    gesturesEnabled,
    setGesturesEnabled,
  };
}

// Gesture guide component for showing users available gestures
export function GestureGuide() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-3">Available Gestures</h3>
      <div className="space-y-2 text-sm text-blue-700">
        <div className="flex items-center gap-2">
          <span className="font-medium">📤 Quick Share:</span>
          <span>Tap with 2 fingers to copy location</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">👆 Navigation:</span>
          <span>Swipe in any direction for quick actions</span>
        </div>
      </div>
    </div>
  );
}
