import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface SlideUpPanelProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  initialHeight?: number;
  bottomOffset?: number;
  collapsedHeight?: number;
  onTouchOutside?: () => void;
}

export function SlideUpPanel({
  children,
  className,
  minHeight = 200,
  maxHeight = Math.floor(window.innerHeight * 0.8), // 80% max viewport height
  initialHeight = Math.floor(window.innerHeight * 0.45), // 45% viewport height
  bottomOffset = 96, // Bottom navigation height
  collapsedHeight = 40, // Height when collapsed (just handle visible)
  onTouchOutside,
}: SlideUpPanelProps) {
  const [height, setHeight] = useState(collapsedHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(height);
    document.body.style.userSelect = "none";
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartHeight(height);
    document.body.style.userSelect = "none";
  };

  const handleHandleClick = () => {
    // Add haptic feedback
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }

    if (isCollapsed) {
      setHeight(initialHeight);
      setIsCollapsed(false);
    } else {
      smoothClose();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY;
      const newHeight = Math.max(
        collapsedHeight,
        Math.min(maxHeight, startHeight + deltaY),
      );
      setHeight(newHeight);

      // Update collapsed state based on height
      setIsCollapsed(newHeight <= collapsedHeight + 10);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const deltaY = startY - e.touches[0].clientY;
      const newHeight = Math.max(
        collapsedHeight,
        Math.min(maxHeight, startHeight + deltaY),
      );
      setHeight(newHeight);

      // Update collapsed state based on height
      setIsCollapsed(newHeight <= collapsedHeight + 10);
    };

    const handleMouseUp = () => {
      if (!isDragging) return;

      setIsDragging(false);
      document.body.style.userSelect = "";

      // Snap to positions including collapsed state
      const snapThreshold = 50;
      const midHeight = (minHeight + maxHeight) / 2;

      if (height < collapsedHeight + snapThreshold) {
        setHeight(collapsedHeight);
        setIsCollapsed(true);
      } else if (height < minHeight + snapThreshold) {
        setHeight(minHeight);
        setIsCollapsed(false);
      } else if (height > maxHeight - snapThreshold) {
        setHeight(maxHeight);
        setIsCollapsed(false);
      } else if (Math.abs(height - midHeight) < snapThreshold) {
        setHeight(midHeight);
        setIsCollapsed(false);
      } else {
        setIsCollapsed(false);
      }
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
  }, [isDragging, startY, startHeight, height, minHeight, maxHeight]);

  // Smooth closing animation function
  const smoothClose = () => {
    setIsDragging(false);
    setHeight(collapsedHeight);
    setIsCollapsed(true);
  };

  // Handle touch outside to close panel with smooth animation
  useEffect(() => {
    const handleTouchOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!panelRef.current || isCollapsed || !onTouchOutside) return;

      const target = e.target as Node;
      if (!panelRef.current.contains(target)) {
        smoothClose();
        onTouchOutside();
      }
    };

    if (!isCollapsed) {
      document.addEventListener("mousedown", handleTouchOutsideClick);
      document.addEventListener("touchstart", handleTouchOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleTouchOutsideClick);
      document.removeEventListener("touchstart", handleTouchOutsideClick);
    };
  }, [isCollapsed, onTouchOutside, collapsedHeight]);

  return (
    <motion.div
      ref={panelRef}
      className={cn(
        "fixed left-0 right-0 z-40 bg-background/98 backdrop-blur-xl rounded-t-3xl shadow-2xl overflow-hidden",
        "border-t-2 border-border/60 safe-area-inset",
        "before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:via-transparent before:to-foreground/5 before:pointer-events-none",
        className,
      )}
      style={{
        bottom: bottomOffset,
        height: height,
        maxWidth: "100vw",
        willChange: "height, transform",
      }}
      animate={{
        height: height,
        scale: isDragging ? 1.01 : 1,
        boxShadow: isDragging
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 400,
        duration: isDragging ? 0 : 0.4,
        ease: "easeInOut",
      }}
    >
      {/* Drag Handle */}
      <motion.div
        ref={handleRef}
        className={cn(
          "flex flex-col items-center cursor-grab active:cursor-grabbing transition-all duration-200 touch-manipulation",
          isDragging && "cursor-grabbing",
          isCollapsed
            ? isMobile
              ? "py-3"
              : "py-2"
            : isMobile
              ? "py-4"
              : "py-3",
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleHandleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="bg-foreground/30 rounded-full shadow-sm"
          animate={{
            backgroundColor: isDragging
              ? "hsl(var(--foreground))"
              : "hsl(var(--foreground) / 0.4)",
            width:
              isDragging || isCollapsed
                ? isMobile
                  ? 80
                  : 64
                : isMobile
                  ? 60
                  : 48,
            height: isDragging || isCollapsed ? 6 : 4,
          }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        />
      </motion.div>

      {/* Panel Content */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: 15,
              scale: 0.96,
              transition: {
                duration: 0.3,
                ease: "easeIn",
                opacity: { duration: 0.2 },
                y: { duration: 0.3, ease: "easeInOut" },
                scale: { duration: 0.2, ease: "easeIn" },
              },
            }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 300,
              duration: 0.4,
            }}
            className={cn(
              "h-full overflow-y-auto custom-scrollbar safe-area-inset-bottom",
              isMobile ? "px-4 pb-4" : "px-6 pb-6",
            )}
          >
            <motion.div
              className="space-y-4"
              style={{ paddingBottom: "2rem" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { delay: 0.1, duration: 0.3 },
                exit: { duration: 0.15 },
              }}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize Indicator */}
      {isDragging && (
        <div className="absolute top-2 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          {Math.round(height)}px
        </div>
      )}
    </motion.div>
  );
}

// Hook for panel control
export function useSlideUpPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(300);

  const expand = () => setIsExpanded(true);
  const collapse = () => setIsExpanded(false);
  const toggle = () => setIsExpanded(!isExpanded);

  return {
    isExpanded,
    height,
    expand,
    collapse,
    toggle,
    setHeight,
  };
}
