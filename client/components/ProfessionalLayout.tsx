import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProfessionalLayoutProps {
  children: React.ReactNode;
  className?: string;
  hasNavbar?: boolean;
  hasTabNavigation?: boolean;
}

export function ProfessionalLayout({
  children,
  className,
  hasNavbar = true,
  hasTabNavigation = false,
}: ProfessionalLayoutProps) {
  const [dimensions, setDimensions] = useState({
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    navbarHeight: 96, // Default navbar height
    safeAreaBottom: 0,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;

      // Calculate navbar height based on device
      let navbarHeight = 96; // Default for desktop
      if (width < 768) {
        navbarHeight = 88; // Mobile navbar
      }

      // Get safe area insets for iOS devices
      const safeAreaBottom = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--safe-area-inset-bottom")
          .replace("px", "") || "0",
      );

      setDimensions({
        height,
        width,
        navbarHeight,
        safeAreaBottom,
      });
    };

    // Initial calculation
    updateDimensions();

    // Listen for resize events
    window.addEventListener("resize", updateDimensions);
    window.addEventListener("orientationchange", updateDimensions);

    // Listen for visual viewport changes (mobile keyboard)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateDimensions);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("orientationchange", updateDimensions);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateDimensions);
      }
    };
  }, []);

  const containerHeight = hasNavbar
    ? dimensions.height - dimensions.navbarHeight - dimensions.safeAreaBottom
    : dimensions.height;

  const containerStyle = {
    height: `${containerHeight}px`,
    maxHeight: `${containerHeight}px`,
    paddingBottom: hasNavbar
      ? `${dimensions.navbarHeight + dimensions.safeAreaBottom}px`
      : undefined,
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-gray-50",
        hasNavbar && "pb-0", // Remove default padding when we have custom calculations
        className,
      )}
      style={containerStyle}
    >
      {children}

      {/* Safe area overlay for debugging (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-[9999]">
          <div
            className="bg-red-500/20 border-t border-red-500"
            style={{
              height: `${dimensions.navbarHeight + dimensions.safeAreaBottom}px`,
            }}
          >
            <div className="text-xs text-red-700 p-1">
              Navbar: {dimensions.navbarHeight}px | Safe:{" "}
              {dimensions.safeAreaBottom}px
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to get layout dimensions
export function useLayoutDimensions() {
  const [dimensions, setDimensions] = useState({
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    navbarHeight: 96,
    safeAreaBottom: 0,
    contentHeight: 0,
  });

  useEffect(() => {
    const updateDimensions = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;

      let navbarHeight = 96;
      if (width < 768) {
        navbarHeight = 88;
      }

      const safeAreaBottom = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--safe-area-inset-bottom")
          .replace("px", "") || "0",
      );

      const contentHeight = height - navbarHeight - safeAreaBottom;

      setDimensions({
        height,
        width,
        navbarHeight,
        safeAreaBottom,
        contentHeight,
      });
    };

    updateDimensions();

    window.addEventListener("resize", updateDimensions);
    window.addEventListener("orientationchange", updateDimensions);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateDimensions);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("orientationchange", updateDimensions);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateDimensions);
      }
    };
  }, []);

  return dimensions;
}

// Component for properly spaced content
export function ProfessionalContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const dimensions = useLayoutDimensions();

  return (
    <div
      className={cn("relative w-full", className)}
      style={{
        minHeight: `${dimensions.contentHeight}px`,
      }}
    >
      {children}
    </div>
  );
}
