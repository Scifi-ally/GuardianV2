import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SlideUpPanelProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  initialHeight?: number;
  bottomOffset?: number;
  collapsedHeight?: number;
}

export function SlideUpPanel({
  children,
  className,
  minHeight = 200,
  maxHeight = 600,
  initialHeight = 300,
  bottomOffset = 96, // Bottom navigation height
  collapsedHeight = 40, // Height when collapsed (just handle visible)
}: SlideUpPanelProps) {
  const [height, setHeight] = useState(collapsedHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed left-0 right-0 z-40 bg-background/98 backdrop-blur-xl rounded-t-3xl shadow-2xl transition-all duration-200 overflow-hidden",
        "border-t border-border/30",
        isDragging ? "transition-none" : "",
        className,
      )}
      style={{
        bottom: bottomOffset,
        height: height,
        transform: isDragging ? "scale(1.01)" : "scale(1)",
      }}
    >
      {/* Drag Handle */}
      <div
        ref={handleRef}
        className={cn(
          "flex flex-col items-center cursor-grab active:cursor-grabbing transition-all duration-200",
          isDragging && "cursor-grabbing",
          isCollapsed ? "py-2" : "py-3",
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleHandleClick}
      >
        <div
          className={cn(
            "bg-muted rounded-full transition-all duration-200",
            isDragging ? "bg-primary w-16 h-1.5" : "w-12 h-1",
            isCollapsed && "bg-primary/60 w-16 h-1.5",
          )}
        />
        {isCollapsed && (
          <div className="mt-2 text-xs text-muted-foreground animate-pulse">
            Tap to expand
          </div>
        )}
      </div>

      {/* Panel Content */}
      <div
        className={cn(
          "px-6 pb-6 h-full transition-opacity duration-200 custom-scrollbar",
          isCollapsed
            ? "opacity-0 pointer-events-none overflow-hidden"
            : "opacity-100 overflow-y-auto",
        )}
      >
        <div className="space-y-4" style={{ paddingBottom: "2rem" }}>
          {children}
        </div>
      </div>

      {/* Resize Indicator */}
      {isDragging && (
        <div className="absolute top-2 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          {Math.round(height)}px
        </div>
      )}
    </div>
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
