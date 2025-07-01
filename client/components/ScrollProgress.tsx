import { useScrollProgress } from "@/hooks/use-scroll-animation";
import { cn } from "@/lib/utils";

interface ScrollProgressProps {
  className?: string;
}

export function ScrollProgress({ className }: ScrollProgressProps) {
  const scrollProgress = useScrollProgress();

  return (
    <div
      className={cn("fixed top-0 left-0 right-0 h-1 bg-muted z-50", className)}
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-emergency to-safe transition-all duration-150 ease-out"
        style={{
          width: `${scrollProgress * 100}%`,
        }}
      />
    </div>
  );
}
