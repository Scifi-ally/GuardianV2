import { cn } from "@/lib/utils";
import { Shield, Loader2 } from "lucide-react";

interface LoadingAnimationProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "spinner" | "dots" | "pulse" | "guardian";
  text?: string;
}

export function LoadingAnimation({
  size = "md",
  className,
  variant = "spinner",
  text,
}: LoadingAnimationProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  if (variant === "guardian") {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <div className="relative">
          <div
            className={cn(
              "rounded-full bg-primary/10 flex items-center justify-center relative",
              sizeClasses[size],
            )}
          >
            <Shield
              className={cn(
                "text-primary animate-pulse",
                size === "sm" && "h-3 w-3",
                size === "md" && "h-5 w-5",
                size === "lg" && "h-8 w-8",
                size === "xl" && "h-10 w-10",
              )}
            />
            <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-spin border-t-primary" />
          </div>
        </div>
        {text && (
          <p
            className={cn(
              "text-muted-foreground animate-pulse",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-base",
              size === "xl" && "text-lg",
            )}
          >
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-1", className)}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              "bg-current rounded-full",
              size === "sm" && "h-1 w-1",
              size === "md" && "h-1.5 w-1.5",
              size === "lg" && "h-2 w-2",
              size === "xl" && "h-3 w-3",
            )}
            style={{
              animation: `loading-dot-scale 600ms ease-in-out infinite alternate`,
              animationDelay: `${index * 150}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn(
          "bg-primary rounded-full animate-pulse",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  // Default spinner variant
  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="absolute inset-0 rounded-full border-2 border-muted"></div>
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
    </div>
  );
}

export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted rounded",
        className,
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-3">
        <SkeletonLoader className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-3/4" />
          <SkeletonLoader className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonLoader className="h-3 w-full" />
      <SkeletonLoader className="h-3 w-5/6" />
      <SkeletonLoader className="h-10 w-full rounded" />
    </div>
  );
}

interface FullPageLoadingProps {
  text?: string;
  variant?: "guardian" | "spinner" | "dots";
}

export function FullPageLoading({
  text = "Loading Guardian...",
  variant = "guardian",
}: FullPageLoadingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-primary/5 flex items-center justify-center">
      <div className="text-center space-y-6">
        <LoadingAnimation size="xl" variant={variant} />
        <div className="space-y-2">
          <p className="text-lg font-medium animate-pulse">{text}</p>
          <p className="text-sm text-muted-foreground">
            Securing your safety experience...
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1">
          <div
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-primary/30 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
