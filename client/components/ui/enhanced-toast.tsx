import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "./button";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const Toaster = ({ ...props }: ToasterProps) => {
  const theme = "light";

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={false}
      richColors={false}
      closeButton={false}
      duration={4000}
      visibleToasts={2}
      dir="auto"
      offset={24}
      toastOptions={{
        style: {
          background: "rgba(255, 255, 255, 0.98)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          color: "#1f2937",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "14px",
          fontWeight: "500",
          borderRadius: "16px",
          padding: "16px 20px",
          boxShadow:
            "0 12px 48px rgba(0, 0, 0, 0.15), 0 6px 16px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(24px) saturate(1.8)",
          cursor: "pointer",
          userSelect: "none",
          touchAction: "pan-y",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: "translateZ(0) scale(1)",
          willChange: "transform, opacity",
          maxWidth: "420px",
          minHeight: "64px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        },
        classNames: {
          toast:
            "modern-toast group backdrop-blur-xl border-transparent shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out cursor-pointer select-none",
          title: "text-sm font-semibold text-gray-900 leading-tight mb-0",
          description: "text-sm text-gray-600 leading-relaxed mt-1",
          closeButton:
            "text-gray-400 hover:text-gray-600 transition-colors duration-200 hover:scale-110 active:scale-95 ml-auto",
          loading: "animate-spin duration-1000",
          success:
            "border-green-200/50 bg-gradient-to-r from-green-50/90 to-green-100/90",
          error:
            "border-red-200/50 bg-gradient-to-r from-red-50/90 to-red-100/90",
          warning:
            "border-orange-200/50 bg-gradient-to-r from-orange-50/90 to-orange-100/90",
          default:
            "border-blue-200/50 bg-gradient-to-r from-blue-50/90 to-blue-100/90",
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
