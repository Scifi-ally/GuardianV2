import { useEffect, useRef, useState } from "react";
import { unifiedNotifications } from "@/services/unifiedNotificationService";

interface GestureOptions {
  enableSOSGesture?: boolean;
  enablePanicGesture?: boolean;
  enableQuickShare?: boolean;
  enableNavigationGestures?: boolean;
  onSOSActivated?: () => void;
  onPanicActivated?: () => void;
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
    enableSOSGesture = true,
    enablePanicGesture = true,
    enableQuickShare = true,
    enableNavigationGestures = true,
    onSOSActivated,
    onPanicActivated,
    onQuickShare,
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
  } = options;

  const touchData = useRef<TouchData | null>(null);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const panicTapCount = useRef(0);
  const panicTapTimer = useRef<NodeJS.Timeout | null>(null);
  const sosShakeCount = useRef(0);
  const shakeThreshold = 15; // Sensitivity for shake detection

  // SOS Gesture: 5 rapid taps anywhere on screen
  const handleSOSTaps = (event: TouchEvent) => {
    if (!enableSOSGesture || !gesturesEnabled) return;

    panicTapCount.current++;

    if (panicTapTimer.current) {
      clearTimeout(panicTapTimer.current);
    }

    panicTapTimer.current = setTimeout(() => {
      panicTapCount.current = 0;
    }, 2000); // Reset after 2 seconds

    if (panicTapCount.current >= 5) {
      panicTapCount.current = 0;
      triggerSOSGesture();
    }
  };

  // Panic Gesture: Three-finger press and hold for 3 seconds
  const handlePanicGesture = (event: TouchEvent) => {
    if (!enablePanicGesture || !gesturesEnabled) return;

    if (event.touches.length === 3) {
      const timer = setTimeout(() => {
        triggerPanicGesture();
      }, 3000);

      const cleanup = () => {
        clearTimeout(timer);
        document.removeEventListener("touchend", cleanup);
        document.removeEventListener("touchmove", cleanup);
      };

      document.addEventListener("touchend", cleanup);
      document.addEventListener("touchmove", cleanup);
    }
  };

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

  // Shake Detection for Emergency
  const handleDeviceMotion = (event: DeviceMotionEvent) => {
    if (!enableSOSGesture || !gesturesEnabled) return;

    const { accelerationIncludingGravity } = event;
    if (!accelerationIncludingGravity) return;

    const { x, y, z } = accelerationIncludingGravity;
    const acceleration = Math.sqrt(x! * x! + y! * y! + z! * z!);

    if (acceleration > shakeThreshold) {
      sosShakeCount.current++;

      setTimeout(() => {
        sosShakeCount.current--;
      }, 1000);

      // If 5 shakes within 3 seconds, trigger SOS
      if (sosShakeCount.current >= 5) {
        sosShakeCount.current = 0;
        triggerSOSGesture();
      }
    }
  };

  // Gesture action handlers
  const triggerSOSGesture = () => {
    unifiedNotifications.critical("SOS activated by gesture!", {
      title: "🚨 Emergency Gesture Detected",
      message: "SOS activated by rapid taps or shake gesture",
      soundAlert: true,
    });

    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    onSOSActivated?.();
  };

  const triggerPanicGesture = () => {
    unifiedNotifications.critical("Panic mode activated!", {
      title: "🔴 Panic Gesture Detected",
      message: "Three-finger panic gesture triggered",
      soundAlert: true,
    });

    if (navigator.vibrate) {
      navigator.vibrate([1000, 500, 1000]);
    }

    onPanicActivated?.();
  };

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
        unifiedNotifications.info("Quick share activated", {
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
      handleSOSTaps(event);
      handlePanicGesture(event);
      handleQuickShare(event);
    };

    // Add event listeners
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
    document.addEventListener("touchstart", handleTouch, { passive: false });

    // Add device motion for shake detection
    if (window.DeviceMotionEvent) {
      window.addEventListener("devicemotion", handleDeviceMotion);
    }

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchstart", handleTouch);

      if (window.DeviceMotionEvent) {
        window.removeEventListener("devicemotion", handleDeviceMotion);
      }

      if (panicTapTimer.current) {
        clearTimeout(panicTapTimer.current);
      }
    };
  }, [
    gesturesEnabled,
    enableSOSGesture,
    enablePanicGesture,
    enableQuickShare,
    enableNavigationGestures,
  ]);

  return {
    gesturesEnabled,
    setGesturesEnabled,
    triggerSOSGesture,
    triggerPanicGesture,
  };
}

// Gesture guide component for showing users available gestures
export function GestureGuide() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-3">Available Gestures</h3>
      <div className="space-y-2 text-sm text-blue-700">
        <div className="flex items-center gap-2">
          <span className="font-medium">🚨 Emergency SOS:</span>
          <span>Tap rapidly 5 times or shake device vigorously</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">🔴 Panic Mode:</span>
          <span>Press and hold with 3 fingers for 3 seconds</span>
        </div>
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
