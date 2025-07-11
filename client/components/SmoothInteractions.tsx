import { useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useAnimation } from "framer-motion";

// Smooth scroll behavior enhancement
export function useSmoothScroll() {
  useEffect(() => {
    // Enhance native smooth scrolling
    const originalScrollTo = window.scrollTo;
    const originalScrollBy = window.scrollBy;

    window.scrollTo = function (options: any) {
      if (typeof options === "object") {
        options.behavior = "smooth";
      }
      originalScrollTo.call(this, options);
    };

    window.scrollBy = function (options: any) {
      if (typeof options === "object") {
        options.behavior = "smooth";
      }
      originalScrollBy.call(this, options);
    };

    return () => {
      window.scrollTo = originalScrollTo;
      window.scrollBy = originalScrollBy;
    };
  }, []);
}

// Enhanced touch interactions
export function useEnhancedTouch() {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Detect swipe gestures
      const minSwipeDistance = 50;
      const maxSwipeTime = 300;

      if (
        Math.abs(deltaX) > minSwipeDistance &&
        deltaTime < maxSwipeTime &&
        Math.abs(deltaX) > Math.abs(deltaY)
      ) {
        const direction = deltaX > 0 ? "right" : "left";
        const event = new CustomEvent("smoothSwipe", {
          detail: { direction, deltaX, deltaY, deltaTime },
        });
        e.target?.dispatchEvent(event);
      }

      touchStartRef.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);
}

// Smooth page transitions
export function SmoothPageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

// Smooth loading states
export function SmoothLoader({
  isLoading,
  children,
}: {
  isLoading: boolean;
  children: React.ReactNode;
}) {
  const controls = useAnimation();

  useEffect(() => {
    if (isLoading) {
      controls.start({
        opacity: 0.5,
        scale: 0.98,
        transition: { duration: 0.2 },
      });
    } else {
      controls.start({
        opacity: 1,
        scale: 1,
        transition: { duration: 0.3, type: "spring" },
      });
    }
  }, [isLoading, controls]);

  return (
    <motion.div animate={controls} className="relative">
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
            />
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Smooth button interactions
export function SmoothButton({
  children,
  onClick,
  className = "",
  disabled = false,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "ghost" | "outline";
}) {
  const scale = useMotionValue(1);
  const springConfig = { type: "spring", stiffness: 400, damping: 17 };

  const handlePressStart = () => {
    if (!disabled) {
      scale.set(0.95);
    }
  };

  const handlePressEnd = () => {
    if (!disabled) {
      scale.set(1);
    }
  };

  const baseClasses =
    "relative inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <motion.button
      style={{ scale }}
      transition={springConfig}
      onTapStart={handlePressStart}
      onTap={handlePressEnd}
      onTapCancel={handlePressEnd}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {children}
    </motion.button>
  );
}

// Smooth scroll reveal animations
export function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start({
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 15,
            },
          });
        }
      },
      { threshold },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [controls, threshold]);

  return {
    ref,
    animate: controls,
    initial: { opacity: 0, y: 50 },
  };
}

// Smooth card hover effects
export function SmoothCard({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const y = useSpring(0, { stiffness: 300, damping: 30 });
  const boxShadow = useSpring(
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    { stiffness: 300, damping: 30 },
  );

  return (
    <motion.div
      style={{ y, boxShadow }}
      onHoverStart={() => {
        y.set(-4);
        boxShadow.set(
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        );
      }}
      onHoverEnd={() => {
        y.set(0);
        boxShadow.set(
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        );
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white rounded-lg border cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Smooth list animations
export function SmoothList({
  items,
  renderItem,
  className = "",
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <motion.div
          key={item.id || index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{
            duration: 0.3,
            delay: index * 0.05,
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </div>
  );
}

// Main smooth interactions component
export function SmoothInteractions() {
  useSmoothScroll();
  useEnhancedTouch();

  useEffect(() => {
    // Add smooth interaction classes to body
    document.body.classList.add("smooth-interactions");

    // Enhance focus indicators
    const style = document.createElement("style");
    style.textContent = `
      .smooth-interactions *:focus-visible {
        outline: 2px solid hsl(var(--primary));
        outline-offset: 2px;
        border-radius: 4px;
        transition: outline-offset 0.2s ease;
      }

      .smooth-interactions button,
      .smooth-interactions [role="button"] {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .smooth-interactions input,
      .smooth-interactions textarea,
      .smooth-interactions select {
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .smooth-interactions input:focus,
      .smooth-interactions textarea:focus,
      .smooth-interactions select:focus {
        border-color: hsl(var(--primary));
        box-shadow: 0 0 0 3px hsla(var(--primary), 0.1);
      }

      /* Smooth scrollbar */
      .smooth-interactions ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .smooth-interactions ::-webkit-scrollbar-track {
        background: transparent;
      }

      .smooth-interactions ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        transition: background 0.2s ease;
      }

      .smooth-interactions ::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
      }

      /* Smooth selection */
      .smooth-interactions ::selection {
        background: hsla(var(--primary), 0.2);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.classList.remove("smooth-interactions");
      document.head.removeChild(style);
    };
  }, []);

  return null;
}

// All components are already exported above
