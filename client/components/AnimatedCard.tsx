import { ReactNode } from "react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
  className?: string;
  duration?: string;
}

export function AnimatedCard({
  children,
  delay = 0,
  direction = "up",
  className,
  duration = "duration-700",
}: AnimatedCardProps) {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    rootMargin: "-50px",
  });

  const directionClasses = {
    up: {
      initial: "translate-y-8 opacity-0",
      animate: "translate-y-0 opacity-100",
    },
    down: {
      initial: "-translate-y-8 opacity-0",
      animate: "translate-y-0 opacity-100",
    },
    left: {
      initial: "translate-x-8 opacity-0",
      animate: "translate-x-0 opacity-100",
    },
    right: {
      initial: "-translate-x-8 opacity-0",
      animate: "translate-x-0 opacity-100",
    },
    fade: {
      initial: "opacity-0 scale-95",
      animate: "opacity-100 scale-100",
    },
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        "transition-all ease-out",
        duration,
        isVisible
          ? directionClasses[direction].animate
          : directionClasses[direction].initial,
        className,
      )}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
