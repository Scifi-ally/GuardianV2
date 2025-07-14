import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Shield,
  Wifi,
  Battery,
  AlertTriangle,
  CheckCircle,
  Loader,
  Satellite,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  type:
    | "location"
    | "navigation"
    | "emergency"
    | "offline"
    | "battery"
    | "general"
    | "map"
    | "services";
  message?: string;
  subMessage?: string;
  progress?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  critical?: boolean;
}

export function LoadingState({
  type,
  message,
  subMessage,
  progress,
  className,
  size = "md",
  showProgress = false,
  critical = false,
}: LoadingStateProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getIcon = () => {
    switch (type) {
      case "location":
        return <MapPin className="animate-pulse" />;
      case "navigation":
        return <Navigation className="animate-spin" />;
      case "emergency":
        return <Shield className="animate-pulse text-red-500" />;
      case "offline":
        return <Wifi className="text-orange-500" />;
      case "battery":
        return <Battery className="text-yellow-500" />;
      case "map":
        return <Satellite className="animate-pulse" />;
      case "services":
        return <CheckCircle className="animate-spin" />;
      default:
        return <Loader className="animate-spin" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case "location":
        return "Getting your location";
      case "navigation":
        return "Calculating route";
      case "emergency":
        return "Activating emergency features";
      case "offline":
        return "Working offline";
      case "battery":
        return "Optimizing for battery";
      case "map":
        return "Loading map";
      case "services":
        return "Finding emergency services";
      default:
        return "Loading";
    }
  };

  const sizeClasses = {
    sm: {
      container: "p-2",
      icon: "h-4 w-4",
      text: "text-xs",
      subText: "text-xs",
    },
    md: {
      container: "p-4",
      icon: "h-6 w-6",
      text: "text-sm",
      subText: "text-xs",
    },
    lg: {
      container: "p-6",
      icon: "h-8 w-8",
      text: "text-lg",
      subText: "text-sm",
    },
  };

  const { container, icon, text, subText } = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        container,
        critical && "bg-red-50 border border-red-200 rounded-lg",
        className,
      )}
    >
      <div className={cn("mb-2", icon, critical && "text-red-500")}>
        {getIcon()}
      </div>

      <div className={cn("font-medium mb-1", text, critical && "text-red-700")}>
        {message || getDefaultMessage()}
        {dots}
      </div>

      {subMessage && (
        <div className={cn("text-muted-foreground", subText)}>{subMessage}</div>
      )}

      {showProgress && typeof progress === "number" && (
        <div className="w-full max-w-xs mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className={cn(
                "h-2 rounded-full",
                critical ? "bg-red-500" : "bg-primary",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface FullPageLoadingProps {
  message?: string;
  subMessage?: string;
  showLogo?: boolean;
  critical?: boolean;
}

export function FullPageLoading({
  message = "Loading application",
  subMessage = "Preparing safety features",
  showLogo = true,
  critical = false,
}: FullPageLoadingProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        critical ? "bg-red-50" : "bg-background",
      )}
    >
      <div className="text-center space-y-4">
        {showLogo && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mb-6"
          >
            <div
              className={cn(
                "w-16 h-16 mx-auto rounded-full flex items-center justify-center",
                critical ? "bg-red-500" : "bg-primary",
              )}
            >
              <Shield className="h-8 w-8 text-white" />
            </div>
          </motion.div>
        )}

        <LoadingState
          type={critical ? "emergency" : "general"}
          message={message}
          subMessage={subMessage}
          size="lg"
          critical={critical}
        />
      </div>
    </div>
  );
}

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function ButtonLoading({
  isLoading,
  children,
  loadingText,
  className,
  disabled,
  onClick,
}: ButtonLoadingProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "relative transition-all duration-200",
        isLoading && "cursor-not-allowed",
        className,
      )}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <Loader className="h-4 w-4 animate-spin" />
            {loadingText && <span>{loadingText}</span>}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

interface ProgressIndicatorProps {
  steps: Array<{
    id: string;
    label: string;
    completed: boolean;
    current: boolean;
    error?: boolean;
  }>;
  className?: string;
}

export function ProgressIndicator({
  steps,
  className,
}: ProgressIndicatorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3"
        >
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
              step.completed && !step.error && "bg-green-500 text-white",
              step.current &&
                !step.error &&
                "bg-primary text-primary-foreground animate-pulse",
              step.error && "bg-red-500 text-white",
              !step.completed &&
                !step.current &&
                !step.error &&
                "bg-muted text-muted-foreground",
            )}
          >
            {step.error ? (
              <AlertTriangle className="h-3 w-3" />
            ) : step.completed ? (
              <CheckCircle className="h-3 w-3" />
            ) : step.current ? (
              <Loader className="h-3 w-3 animate-spin" />
            ) : (
              index + 1
            )}
          </div>

          <span
            className={cn(
              "text-sm",
              step.completed && "text-green-600 font-medium",
              step.current && "text-primary font-medium",
              step.error && "text-red-600 font-medium",
              !step.completed &&
                !step.current &&
                !step.error &&
                "text-muted-foreground",
            )}
          >
            {step.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// Skeleton loading components
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-muted h-4 rounded mb-2"></div>
      <div className="bg-muted h-3 rounded mb-2 w-3/4"></div>
      <div className="bg-muted h-3 rounded w-1/2"></div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
