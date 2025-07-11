import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
  useAnimation,
  PanInfo,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollAnimations";

interface EnhancedSlideUpPanelProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  initialHeight?: number;
  bottomOffset?: number;
  collapsedHeight?: number;
  onTouchOutside?: () => void;
  headerContent?: React.ReactNode;
  showPeekContent?: boolean;
  enableParallax?: boolean;
}

export function EnhancedSlideUpPanel({
  children,
  className,
  minHeight = 200,
  maxHeight = Math.floor(window.innerHeight * 0.85),
  initialHeight = Math.floor(window.innerHeight * 0.5),
  bottomOffset = 96,
  collapsedHeight = 60,
  onTouchOutside,
  headerContent,
  showPeekContent = true,
  enableParallax = true,
}: EnhancedSlideUpPanelProps) {
  const [height, setHeight] = useState(collapsedHeight);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [velocityY, setVelocityY] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollDirection = useScrollDirection();
  const controls = useAnimation();

  // Spring physics for smooth animations
  const springConfig = {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 1,
  };

  // Smooth height animation
  const animatedHeight = useSpring(height, springConfig);

  // Parallax effect for background elements
  const parallaxY = useTransform(
    animatedHeight,
    [collapsedHeight, maxHeight],
    [0, -50],
  );

  // Background blur intensity based on panel height
  const backdropBlur = useTransform(
    animatedHeight,
    [collapsedHeight, maxHeight],
    [0, 20],
  );

  // Content opacity based on panel state
  const contentOpacity = useTransform(
    animatedHeight,
    [collapsedHeight, collapsedHeight + 50, maxHeight],
    [0, 0.5, 1],
  );

  // Handle panel drag
  const handlePanStart = () => {
    setIsDragging(true);
  };

  const handlePan = (event: PointerEvent, info: PanInfo) => {
    const deltaY = -info.delta.y;
    const newHeight = Math.max(
      collapsedHeight,
      Math.min(maxHeight, height + deltaY),
    );
    setHeight(newHeight);
    setVelocityY(info.velocity.y);
  };

  const handlePanEnd = (event: PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    const velocity = -info.velocity.y;
    const currentHeight = height;

    // Determine target height based on velocity and current position
    let targetHeight: number;

    if (Math.abs(velocity) > 500) {
      // High velocity - snap based on direction
      targetHeight = velocity > 0 ? initialHeight : collapsedHeight;
    } else {
      // Low velocity - snap to nearest state
      const midPoint = (collapsedHeight + initialHeight) / 2;
      const expandedMidPoint = (initialHeight + maxHeight) / 2;

      if (currentHeight < midPoint) {
        targetHeight = collapsedHeight;
      } else if (currentHeight < expandedMidPoint) {
        targetHeight = initialHeight;
      } else {
        targetHeight = maxHeight;
      }
    }

    setHeight(targetHeight);
    setIsCollapsed(targetHeight === collapsedHeight);

    // Add haptic feedback on mobile
    if ("vibrate" in navigator && targetHeight !== currentHeight) {
      navigator.vibrate(10);
    }
  };

  // Handle clicks on backdrop
  const handleBackdropClick = () => {
    if (!isCollapsed && onTouchOutside) {
      onTouchOutside();
      setHeight(collapsedHeight);
      setIsCollapsed(true);
    }
  };

  // Handle panel tap to expand
  const handlePanelTap = () => {
    if (isCollapsed) {
      setHeight(initialHeight);
      setIsCollapsed(false);
    }
  };

  // Auto-hide panel when scrolling down
  useEffect(() => {
    if (scrollDirection === "down" && !isDragging && !isCollapsed) {
      controls.start({
        y: 20,
        transition: { duration: 0.3 },
      });
    } else {
      controls.start({
        y: 0,
        transition: { duration: 0.3 },
      });
    }
  }, [scrollDirection, isDragging, isCollapsed, controls]);

  // Predefined animation variants
  const panelVariants = {
    collapsed: {
      height: collapsedHeight,
      transition: springConfig,
    },
    expanded: {
      height: initialHeight,
      transition: springConfig,
    },
    fullscreen: {
      height: maxHeight,
      transition: springConfig,
    },
  };

  const handleVariants = {
    rest: {
      scaleX: 1,
      opacity: 0.6,
      transition: { duration: 0.2 },
    },
    hover: {
      scaleX: 1.2,
      opacity: 1,
      transition: { duration: 0.2 },
    },
    tap: {
      scaleX: 0.9,
      transition: { duration: 0.1 },
    },
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <>
      {/* Enhanced Backdrop */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleBackdropClick}
            style={{
              backdropFilter: enableParallax
                ? `blur(${backdropBlur}px)`
                : "blur(4px)",
              background: "rgba(0, 0, 0, 0.1)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Enhanced Panel */}
      <motion.div
        ref={panelRef}
        className={cn(
          "fixed left-0 right-0 z-50 bg-gradient-to-t from-background via-background/95 to-background/90",
          "backdrop-blur-xl border-t border-border/50 shadow-2xl",
          "overflow-hidden",
          className,
        )}
        style={{
          bottom: bottomOffset,
          height: animatedHeight,
          y: enableParallax ? parallaxY : 0,
        }}
        animate={controls}
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          delay: 0.1,
        }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        onTap={handlePanelTap}
      >
        {/* Animated Gradient Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-emerald-500/5"
          animate={{
            background: [
              "linear-gradient(45deg, rgba(59,130,246,0.05), rgba(168,85,247,0.05), rgba(16,185,129,0.05))",
              "linear-gradient(225deg, rgba(168,85,247,0.05), rgba(16,185,129,0.05), rgba(59,130,246,0.05))",
              "linear-gradient(45deg, rgba(59,130,246,0.05), rgba(168,85,247,0.05), rgba(16,185,129,0.05))",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Enhanced Drag Handle */}
        <motion.div
          className="relative flex justify-center py-3"
          variants={handleVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
        >
          <div className="relative">
            <motion.div
              className="w-12 h-1.5 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
              animate={isDragging ? { scale: 1.2 } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="absolute inset-0 w-12 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0"
              animate={isDragging ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.2 }}
            />

            {/* Drag indicator dots */}
            <div className="absolute -top-1 -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 bg-gray-400 rounded-full"
                  animate={
                    isDragging
                      ? {
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.6,
                    repeat: isDragging ? Infinity : 0,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Header Content */}
        {headerContent && (
          <motion.div
            className="px-4 pb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {headerContent}
          </motion.div>
        )}

        {/* Peek Content (always visible) */}
        {showPeekContent && (
          <motion.div
            className="px-4 pb-2"
            animate={{ opacity: isCollapsed ? 1 : 0.7 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-sm text-muted-foreground">
              {isCollapsed ? "Tap to expand" : "Swipe to adjust"}
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          className="relative z-10 px-4 pb-4 h-full overflow-y-auto"
          style={{
            opacity: contentOpacity,
            pointerEvents: isCollapsed ? "none" : "auto",
          }}
          variants={contentVariants}
          initial="hidden"
          animate={isCollapsed ? "hidden" : "visible"}
        >
          <motion.div className="space-y-4" variants={contentVariants}>
            {children}
          </motion.div>
        </motion.div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </motion.div>
    </>
  );
}

export default EnhancedSlideUpPanel;
