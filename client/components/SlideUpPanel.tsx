import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";

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
  maxHeight = Math.floor(window.innerHeight * 0.8),
  initialHeight = Math.floor(window.innerHeight * 0.45),
  bottomOffset = 96,
  collapsedHeight = 48,
  onTouchOutside,
}: SlideUpPanelProps) {
  const [height, setHeight] = useState(collapsedHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

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

  const handleToggle = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }

    if (isCollapsed) {
      setHeight(initialHeight);
      setIsCollapsed(false);
    } else {
      setHeight(collapsedHeight);
      setIsCollapsed(true);
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
      setIsCollapsed(newHeight <= collapsedHeight + 10);
    };

    const handleMouseUp = () => {
      if (!isDragging) return;

      setIsDragging(false);
      document.body.style.userSelect = "";

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

  useEffect(() => {
    const handleTouchOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!panelRef.current || isCollapsed || !onTouchOutside) return;

      const target = e.target as Node;
      if (!panelRef.current.contains(target)) {
        setIsDragging(false);
        setHeight(collapsedHeight);
        setIsCollapsed(true);
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
        "fixed left-0 right-0 z-40 bg-white/95 backdrop-blur-xl rounded-t-2xl border-t border-gray-200/50",
        "shadow-[0_-4px_32px_rgba(0,0,0,0.08)]",
        className,
      )}
      style={{
        bottom: bottomOffset,
        height: height,
      }}
      animate={{
        boxShadow: isDragging
          ? "0 -8px 40px rgba(0, 0, 0, 0.16)"
          : "0 -4px 32px rgba(0, 0, 0, 0.08)",
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 400,
        duration: isDragging ? 0 : 0.2,
      }}
    >
      {/* Professional Drag Handle */}
      <motion.div
        className={cn(
          "flex flex-col items-center cursor-grab active:cursor-grabbing",
          "transition-all duration-200 border-b border-gray-100/50",
          isCollapsed ? "py-3" : "py-4",
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleToggle}
      >
        <motion.div
          className="bg-gray-300 rounded-full"
          animate={{
            backgroundColor: isDragging ? "#6b7280" : "#d1d5db",
            width: isDragging ? 48 : 32,
            height: 4,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
        />

        <AnimatePresence>
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mt-2 flex items-center gap-1 text-xs text-gray-500 font-medium"
            >
              <ChevronUp className="h-3 w-3" />
              Tap to expand
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Content Area */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-6 h-full overflow-y-auto"
            style={{
              paddingTop: "8px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div className="space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

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
