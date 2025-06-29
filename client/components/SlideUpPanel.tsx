import { useState, useRef, useEffect, useCallback } from "react";
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
  bottomOffset = 80,
  collapsedHeight = 60,
}: SlideUpPanelProps) {
  const [height, setHeight] = useState(collapsedHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Enhanced touch gesture handling
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setStartY(e.touches[0].clientY);
      setStartHeight(height);
      setTouchStartTime(Date.now());
      document.body.style.overflow = "hidden";
    },
    [height],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setStartY(e.clientY);
      setStartHeight(height);
      document.body.style.overflow = "hidden";
    },
    [height],
  );

  // Quick tap to toggle
  const handleQuickTap = useCallback(() => {
    const tapDuration = Date.now() - touchStartTime;
    if (tapDuration < 200) {
      // Quick tap
      if (isCollapsed) {
        setHeight(initialHeight);
        setIsCollapsed(false);
      } else {
        setHeight(collapsedHeight);
        setIsCollapsed(true);
      }
    }
  }, [isCollapsed, initialHeight, collapsedHeight, touchStartTime]);

  // Enhanced gesture movement handling
  useEffect(() => {
    const handleMove = (clientY: number) => {
      if (!isDragging) return;

      const deltaY = startY - clientY;
      const newHeight = Math.max(
        collapsedHeight,
        Math.min(maxHeight, startHeight + deltaY),
      );

      setHeight(newHeight);
      setIsCollapsed(newHeight <= collapsedHeight + 20);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientY);
    };

    const handleEnd = () => {
      if (!isDragging) return;

      setIsDragging(false);
      document.body.style.overflow = "";

      // Enhanced snapping logic
      const snapThreshold = 80;
      const midHeight = (minHeight + maxHeight) / 2;
      const velocity = Math.abs(startHeight - height);

      // Quick gesture detection
      if (velocity > 100) {
        if (height > startHeight) {
          // Dragging up quickly
          setHeight(maxHeight);
          setIsCollapsed(false);
        } else {
          // Dragging down quickly
          setHeight(collapsedHeight);
          setIsCollapsed(true);
        }
        return;
      }

      // Position-based snapping
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

      // Handle quick tap
      if (
        Date.now() - touchStartTime < 200 &&
        Math.abs(height - startHeight) < 10
      ) {
        handleQuickTap();
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchend", handleEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [
    isDragging,
    startY,
    startHeight,
    height,
    minHeight,
    maxHeight,
    collapsedHeight,
    touchStartTime,
    handleQuickTap,
  ]);

  // Swipe gesture from map to open panel
  useEffect(() => {
    const handleMapSwipeUp = (e: TouchEvent) => {
      if (isCollapsed && e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = panelRef.current?.getBoundingClientRect();

        // If touch is near the bottom of the screen (where panel handle is)
        if (rect && touch.clientY > window.innerHeight - 150) {
          const startY = touch.clientY;

          const handleSwipeMove = (moveEvent: TouchEvent) => {
            const currentY = moveEvent.touches[0].clientY;
            const deltaY = startY - currentY;

            if (deltaY > 50) {
              // Swiped up significantly
              setHeight(initialHeight);
              setIsCollapsed(false);
              document.removeEventListener("touchmove", handleSwipeMove);
              document.removeEventListener("touchend", handleSwipeEnd);
            }
          };

          const handleSwipeEnd = () => {
            document.removeEventListener("touchmove", handleSwipeMove);
            document.removeEventListener("touchend", handleSwipeEnd);
          };

          document.addEventListener("touchmove", handleSwipeMove, {
            passive: false,
          });
          document.addEventListener("touchend", handleSwipeEnd);
        }
      }
    };

    document.addEventListener("touchstart", handleMapSwipeUp, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchstart", handleMapSwipeUp);
    };
  }, [isCollapsed, initialHeight]);

  const handleAreaTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Only handle clicks on the handle area, not the content
      if (contentRef.current?.contains(e.target as Node)) {
        return;
      }

      if (isCollapsed) {
        setHeight(initialHeight);
        setIsCollapsed(false);
      }
    },
    [isCollapsed, initialHeight],
  );

  return (
    <>
      {/* Backdrop for expanded state */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[88]"
          onClick={() => {
            setHeight(collapsedHeight);
            setIsCollapsed(true);
          }}
          style={{ bottom: bottomOffset + height }}
        />
      )}

      <div
        ref={panelRef}
        className={cn(
          "fixed left-0 right-0 bg-gray-100 border-t border-gray-300 shadow-2xl transition-all duration-300 ease-out rounded-t-2xl overflow-hidden z-[89]",
          isDragging && "transition-none",
          isCollapsed && "shadow-lg",
          className,
        )}
        style={{
          bottom: bottomOffset,
          height: `${height}px`,
        }}
        onClick={handleAreaTap}
      >
        {/* Drag Handle */}
        <div
          className={cn(
            "absolute left-4 top-4 cursor-grab active:cursor-grabbing transition-all duration-200 flex items-center gap-3 select-none",
            isDragging && "cursor-grabbing scale-110",
          )}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex flex-col gap-1">
            <div
              className={cn(
                "bg-gray-400 rounded-full transition-all duration-300",
                isCollapsed ? "w-8 h-1" : "w-12 h-1.5",
                isDragging && "bg-gray-600",
              )}
            />
            <div
              className={cn(
                "bg-gray-400 rounded-full transition-all duration-300",
                isCollapsed ? "w-6 h-1" : "w-8 h-1",
                isDragging && "bg-gray-600",
              )}
            />
          </div>

          {!isCollapsed && (
            <div className="text-xs text-gray-600 font-mono font-medium">
              Drag to resize
            </div>
          )}
        </div>

        {/* Close button when expanded */}
        {!isCollapsed && (
          <button
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all duration-200 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation();
              setHeight(collapsedHeight);
              setIsCollapsed(true);
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="text-gray-600"
            >
              <path
                fill="currentColor"
                d="M6 4.586L10.293.293a1 1 0 0 1 1.414 1.414L7.414 6l4.293 4.293a1 1 0 0 1-1.414 1.414L6 7.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L4.586 6 .293 1.707A1 1 0 0 1 1.707.293L6 4.586z"
              />
            </svg>
          </button>
        )}

        {/* Collapsed state hint */}
        {isCollapsed && (
          <div className="absolute left-20 top-4 text-sm text-gray-600 font-medium">
            Swipe up or tap to expand
          </div>
        )}

        {/* Panel Content */}
        <div
          ref={contentRef}
          className={cn(
            "px-6 pb-8 h-full transition-all duration-300 overflow-hidden",
            isCollapsed
              ? "opacity-0 pointer-events-none pt-4"
              : "opacity-100 overflow-y-auto pt-16",
          )}
          style={{
            maxHeight: `${height - 16}px`,
            scrollbarWidth: "thin",
            scrollbarColor: "#9ca3af #f3f4f6",
          }}
        >
          <div className="space-y-4 text-black">{children}</div>
        </div>

        {/* Resize Indicator */}
        {isDragging && (
          <div className="absolute top-4 right-16 text-xs text-gray-600 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full font-mono shadow-lg">
            {Math.round(height)}px
          </div>
        )}
      </div>
    </>
  );
}

// Enhanced hook for panel control
export function useSlideUpPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(300);

  const expand = useCallback(() => setIsExpanded(true), []);
  const collapse = useCallback(() => setIsExpanded(false), []);
  const toggle = useCallback(() => setIsExpanded(!isExpanded), [isExpanded]);

  return {
    isExpanded,
    height,
    expand,
    collapse,
    toggle,
    setHeight,
  };
}
