import { useEffect } from "react";

// Performance optimization utilities
export function PerformanceOptimizer() {
  useEffect(() => {
    // Optimize touch event handling to prevent hanging
    const optimizeTouchEvents = () => {
      // Add passive event listeners where possible
      const touchOptions = { passive: true };

      // Prevent default touch behaviors that can cause hanging
      document.addEventListener(
        "touchstart",
        (e) => {
          // Allow normal touch behavior
        },
        touchOptions,
      );

      document.addEventListener(
        "touchmove",
        (e) => {
          // Only prevent default if actually needed for specific elements
          if (
            e.target instanceof HTMLElement &&
            e.target.closest(".prevent-scroll")
          ) {
            e.preventDefault();
          }
        },
        { passive: false },
      );
    };

    // Debounce resize events
    let resizeTimeout: NodeJS.Timeout;
    const optimizeResize = () => {
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          // Trigger resize event only after 150ms of no resize activity
          window.dispatchEvent(new Event("optimizedResize"));
        }, 150);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    };

    // Optimize animations
    const optimizeAnimations = () => {
      // Reduce animations on low-performance devices
      const isLowPerformance = navigator.hardwareConcurrency <= 2;

      if (isLowPerformance) {
        document.documentElement.style.setProperty(
          "--animation-duration",
          "0.1s",
        );
        document.documentElement.style.setProperty(
          "--transition-duration",
          "0.1s",
        );
      }
    };

    // Cleanup function
    const cleanupResize = optimizeResize();
    optimizeTouchEvents();
    optimizeAnimations();

    return () => {
      cleanupResize();
      clearTimeout(resizeTimeout);
    };
  }, []);

  return null; // This component doesn't render anything
}

// Hook for optimized event handling
export function useOptimizedEvents() {
  useEffect(() => {
    // Throttle scroll events
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Handle scroll logic here
          ticking = false;
        });
        ticking = true;
      }
    };

    // Debounce input events
    const createDebouncedHandler = (callback: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback.apply(null, args), delay);
      };
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
}

// Memory leak prevention utilities
export function preventMemoryLeaks() {
  // Clean up event listeners
  const cleanupFunctions: (() => void)[] = [];

  const addCleanup = (cleanup: () => void) => {
    cleanupFunctions.push(cleanup);
  };

  const cleanup = () => {
    cleanupFunctions.forEach((fn) => fn());
    cleanupFunctions.length = 0;
  };

  // Auto cleanup on page unload
  window.addEventListener("beforeunload", cleanup);

  return { addCleanup, cleanup };
}
