import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";

interface EnhancedSlideUpPanelProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  initialHeight?: number;
  navbarHeight?: number;
  safeAreaBottom?: number;
  collapsedHeight?: number;
  onTouchOutside?: () => void;
}

export function EnhancedSlideUpPanel({
  children,
  className,
  minHeight = 200,
  maxHeight,
  initialHeight,
  navbarHeight = 96,
  safeAreaBottom = 0,
  collapsedHeight = 120,
  onTouchOutside,
}: EnhancedSlideUpPanelProps) {
  const [height, setHeight] = useState(300); // Start with more height
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragVelocity, setDragVelocity] = useState(0);
  const [lastDragTime, setLastDragTime] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate available space dynamically
  const availableHeight =
    typeof window !== "undefined"
      ? window.innerHeight - navbarHeight - safeAreaBottom - 20 // 20px margin
      : 600;

  const calculatedMaxHeight = maxHeight || Math.floor(availableHeight * 0.85);
  const calculatedInitialHeight =
    initialHeight || Math.floor(availableHeight * 0.6);

  // Smooth spring animations
  const heightSpring = useSpring(height, {
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  });

  const opacity = useTransform(
    heightSpring,
    [collapsedHeight, calculatedInitialHeight],
    [0.3, 1],
  );
  const blur = useTransform(
    heightSpring,
    [collapsedHeight, calculatedInitialHeight],
    [8, 0],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.closest('[role="button"]') ||
      target.closest(".clickable")
    ) {
      return;
    }

    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(height);
    document.body.style.userSelect = "none";
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't start dragging if touching interactive elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.closest('[role="button"]') ||
      target.closest(".clickable")
    ) {
      return;
    }

    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartHeight(height);
    document.body.style.userSelect = "none";
  };

  const handleToggle = () => {
    if (isAnimating) return;

    // Haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }

    setIsAnimating(true);

    if (isCollapsed) {
      // Slide up animation
      setHeight(calculatedInitialHeight);
      setIsCollapsed(false);
    } else {
      // Slide down animation
      setHeight(collapsedHeight);
      setIsCollapsed(true);
    }

    // Reset animation flag after transition
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handleDismiss = () => {
    if (isAnimating) return;

    // Enhanced dismiss animation
    if ("vibrate" in navigator) {
      navigator.vibrate(5);
    }

    setIsAnimating(true);
    setHeight(collapsedHeight);
    setIsCollapsed(true);

    setTimeout(() => setIsAnimating(false), 400);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const currentTime = Date.now();
      const deltaY = startY - e.clientY;
      const newHeight = Math.max(
        collapsedHeight,
        Math.min(calculatedMaxHeight, startHeight + deltaY),
      );

      // Calculate velocity for smooth momentum
      if (lastDragTime > 0) {
        const timeDelta = currentTime - lastDragTime;
        const heightDelta = newHeight - height;
        setDragVelocity(heightDelta / timeDelta);
      }

      setHeight(newHeight);
      setIsCollapsed(newHeight <= collapsedHeight + 10);
      setLastDragTime(currentTime);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const currentTime = Date.now();
      const deltaY = startY - e.touches[0].clientY;
      const newHeight = Math.max(
        collapsedHeight,
        Math.min(calculatedMaxHeight, startHeight + deltaY),
      );

      // Calculate velocity for smooth momentum
      if (lastDragTime > 0) {
        const timeDelta = currentTime - lastDragTime;
        const heightDelta = newHeight - height;
        setDragVelocity(heightDelta / timeDelta);
      }

      setHeight(newHeight);
      setIsCollapsed(newHeight <= collapsedHeight + 10);
      setLastDragTime(currentTime);
    };

    const handleMouseUp = () => {
      if (!isDragging) return;

      setIsDragging(false);
      document.body.style.userSelect = "";
      setIsAnimating(true);

      // Enhanced snapping with velocity consideration
      const snapThreshold = 60;
      const midHeight = (minHeight + calculatedMaxHeight) / 2;
      const velocityThreshold = 0.5; // Threshold for momentum-based snapping

      // Use velocity to determine direction preference
      let targetHeight = height;

      if (Math.abs(dragVelocity) > velocityThreshold) {
        // Fast gesture - follow velocity direction
        if (dragVelocity > 0) {
          // Moving up - expand
          targetHeight =
            height > midHeight ? calculatedMaxHeight : calculatedInitialHeight;
        } else {
          // Moving down - collapse or minimize
          targetHeight = height < midHeight ? collapsedHeight : minHeight;
        }
      } else {
        // Slow gesture - use position-based snapping
        if (height < collapsedHeight + snapThreshold) {
          targetHeight = collapsedHeight;
        } else if (height < minHeight + snapThreshold) {
          targetHeight = minHeight;
        } else if (height > calculatedMaxHeight - snapThreshold) {
          targetHeight = calculatedMaxHeight;
        } else if (Math.abs(height - midHeight) < snapThreshold) {
          targetHeight = midHeight;
        }
      }

      setHeight(targetHeight);
      setIsCollapsed(targetHeight <= collapsedHeight + 10);
      setDragVelocity(0);
      setLastDragTime(0);

      setTimeout(() => setIsAnimating(false), 400);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, startY, startHeight, height, minHeight, calculatedMaxHeight]);

  useEffect(() => {
    const handleTouchOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!panelRef.current || isCollapsed || !onTouchOutside) return;

      const target = e.target as HTMLElement;

      // Don't collapse if clicking on interactive elements (buttons, inputs, etc.)
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA" ||
        target.closest("button") ||
        target.closest('[role="button"]') ||
        target.closest(".clickable") ||
        target.closest("[data-clickable]")
      ) {
        return;
      }

      // Only collapse if truly clicking outside the panel
      if (!panelRef.current.contains(target)) {
        setIsDragging(false);
        setHeight(collapsedHeight);
        setIsCollapsed(true);
        onTouchOutside();
      }
    };

    if (!isCollapsed) {
      document.addEventListener("mousedown", handleTouchOutsideClick, {
        capture: false,
      });
      document.addEventListener("touchstart", handleTouchOutsideClick, {
        capture: false,
      });
    }

    return () => {
      document.removeEventListener("mousedown", handleTouchOutsideClick);
      document.removeEventListener("touchstart", handleTouchOutsideClick);
    };
  }, [isCollapsed, onTouchOutside, collapsedHeight]);

  // Update viewport height changes
  useEffect(() => {
    const handleResize = () => {
      const newAvailableHeight =
        window.innerHeight - navbarHeight - safeAreaBottom - 20;
      const newMaxHeight = Math.floor(newAvailableHeight * 0.85);

      if (height > newMaxHeight) {
        setHeight(newMaxHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [height, navbarHeight, safeAreaBottom]);

  const bottomPosition = navbarHeight + safeAreaBottom;

  return (
    <motion.div
      ref={panelRef}
      className={cn(
        "fixed left-0 right-0 z-40 bg-white/98 backdrop-blur-xl rounded-t-3xl",
        "border-t border-gray-200/50 shadow-2xl overflow-hidden",
        "transition-shadow duration-300",
        className,
      )}
      style={{
        bottom: bottomPosition,
        height: height,
      }}
      initial={{ y: "100%", opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        boxShadow: isDragging
          ? "0 -12px 48px rgba(0, 0, 0, 0.15)"
          : "0 -8px 32px rgba(0, 0, 0, 0.12)",
      }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{
        type: "spring",
        damping: isDragging ? 20 : isAnimating ? 35 : 30,
        stiffness: isDragging ? 200 : isAnimating ? 500 : 400,
        duration: isDragging ? 0 : isAnimating ? 0.5 : 0.4,
        bounce: isAnimating ? 0.2 : 0.1,
      }}
    >
      {/* Enhanced Drag Handle */}
      <motion.div
        className={cn(
          "flex flex-col items-center cursor-grab active:cursor-grabbing",
          "transition-all duration-300 border-b border-gray-100/50",
          isCollapsed ? "py-4" : "py-5",
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleToggle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          className="bg-gray-300 rounded-full transition-all duration-300"
          animate={{
            backgroundColor: isDragging ? "#6b7280" : "#d1d5db",
            width: isDragging ? 56 : isCollapsed ? 40 : 32,
            height: isDragging ? 6 : 4,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
        />

        <AnimatePresence>
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 font-medium"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Content Area with Enhanced Animations */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.4,
            }}
            className="px-5 pb-6 h-full overflow-y-auto clickable"
            style={{
              paddingTop: "8px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              maxHeight: height - (isCollapsed ? collapsedHeight : 80),
              pointerEvents: "auto",
              touchAction: "manipulation",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="space-y-4"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize Indicator */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-3 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium"
          >
            {Math.round(
              ((height - collapsedHeight) /
                (calculatedMaxHeight - collapsedHeight)) *
                100,
            )}
            %
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
