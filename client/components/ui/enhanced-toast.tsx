import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "./button";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand
      richColors
      closeButton={false}
      duration={5000}
      visibleToasts={3}
      dir="auto"
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
          fontFamily: "var(--font-geist-mono)",
          fontSize: "14px",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(8px)",
          cursor: "pointer",
          userSelect: "none",
          touchAction: "pan-y",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: "translateZ(0)",
          willChange: "transform, opacity",
        },
        classNames: {
          toast:
            "group toast backdrop-blur-md border-border shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out cursor-pointer select-none animate-in slide-in-from-top-2 fade-in",
          title:
            "text-sm font-medium text-foreground animate-in fade-in duration-200 delay-75",
          description:
            "text-sm text-muted-foreground mt-1 animate-in fade-in duration-200 delay-100",
          closeButton:
            "text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-95",
          loading: "animate-spin duration-1000",
          success: "animate-in zoom-in duration-200",
          error: "animate-in zoom-in duration-200 animate-pulse",
          warning: "animate-in slide-in-from-left-1 duration-300",
          default: "animate-in slide-in-from-right-1 duration-300",
        },
      }}
      {...props}
    />
  );
};

// Enhanced toast functions with proper actions and gestures
export const toast = {
  success: (
    message: string,
    options?: {
      description?: string;
      duration?: number;
    },
  ) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <CheckCircle className="h-4 w-4" />,
    });
  },

  error: (
    message: string,
    options?: {
      description?: string;
      duration?: number;
    },
  ) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      icon: <AlertCircle className="h-4 w-4" />,
    });
  },

  warning: (
    message: string,
    options?: {
      description?: string;
      duration?: number;
    },
  ) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: <AlertTriangle className="h-4 w-4" />,
    });
  },

  // Emergency toast with special styling
  emergency: (
    message: string,
    options?: {
      description?: string;
    },
  ) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: Infinity, // Emergency toasts don't auto-dismiss
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      style: {
        background: "hsl(var(--destructive))",
        color: "hsl(var(--destructive-foreground))",
        border: "2px solid hsl(var(--destructive))",
        animation: "emergency-pulse 1.5s ease-in-out infinite",
      },
    });
  },

  // Loading toast with custom content
  loading: (
    message: string,
    options?: {
      description?: string;
      duration?: number;
    },
  ) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      duration: options?.duration || Infinity,
    });
  },

  // Promise-based toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
      description?: string;
    },
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
      description: options.description,
    });
  },

  // Dismiss specific toast
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    sonnerToast.dismiss();
  },
};

// Export types for consistency
export type ToastType =
  | "success"
  | "error"
  | "warning"
  | "loading"
  | "emergency";

export interface ToastOptions {
  description?: string;
  duration?: number;
}

export interface EmergencyToastOptions {
  description?: string;
}
