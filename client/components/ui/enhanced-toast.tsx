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
          transition: "all 0.2s ease-out",
        },
        classNames: {
          toast:
            "group toast backdrop-blur-md border-border shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer select-none",
          title: "text-sm font-medium text-foreground",
          description: "text-sm text-muted-foreground mt-1",
          actionButton:
            "bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
          cancelButton:
            "bg-muted text-muted-foreground hover:bg-muted/80 text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
          closeButton:
            "text-muted-foreground hover:text-foreground transition-colors",
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
      action?: { label: string; onClick: () => void };
      duration?: number;
    },
  ) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <CheckCircle className="h-4 w-4" />,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  },

  error: (
    message: string,
    options?: {
      description?: string;
      action?: { label: string; onClick: () => void };
      duration?: number;
    },
  ) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      icon: <AlertCircle className="h-4 w-4" />,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  },

  warning: (
    message: string,
    options?: {
      description?: string;
      action?: { label: string; onClick: () => void };
      duration?: number;
    },
  ) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: <AlertTriangle className="h-4 w-4" />,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  },

  info: (
    message: string,
    options?: {
      description?: string;
      action?: { label: string; onClick: () => void };
      duration?: number;
    },
  ) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <Info className="h-4 w-4" />,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
    });
  },

  // Emergency toast with special styling and actions
  emergency: (
    message: string,
    options?: {
      description?: string;
      primaryAction?: { label: string; onClick: () => void };
      secondaryAction?: { label: string; onClick: () => void };
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
      action: options?.primaryAction
        ? {
            label: options.primaryAction.label,
            onClick: options.primaryAction.onClick,
          }
        : undefined,
      cancel: options?.secondaryAction
        ? {
            label: options.secondaryAction.label,
            onClick: options.secondaryAction.onClick,
          }
        : undefined,
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
      action?: { label: string; onClick: () => void };
    },
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
      description: options.description,
      action: options.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
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
  | "info"
  | "loading"
  | "emergency";

export interface ToastOptions {
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

export interface EmergencyToastOptions {
  description?: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}
