import React, { createContext, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen);
  };

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  // Prevent background scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  asChild,
  children,
  ...props
}: {
  asChild?: boolean;
  children: React.ReactNode;
  [key: string]: any;
}) {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("DialogTrigger must be used within a Dialog");
  }

  const handleClick = () => {
    context.onOpenChange(true);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      ...props,
    });
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  size = "md",
  ...props
}: DialogContentProps) {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("DialogContent must be used within a Dialog");
  }

  const handleClose = () => {
    context.onOpenChange(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      handleClose();
    }
  };

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full mx-4",
  };

  return (
    <AnimatePresence>
      {context.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleOverlayClick}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "relative bg-background rounded-2xl shadow-2xl border w-full max-h-[90vh] overflow-hidden",
              sizeClasses[size],
              className,
            )}
            {...props}
          >
            {/* Close Button */}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10 h-8 w-8 p-0 hover:bg-muted"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            )}

            {/* Content */}
            <div className="max-h-[90vh] overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogTitle({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function DialogDescription({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function DialogBody({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <div className={cn("px-6 pb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function DialogFooter({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-4 border-t",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Hook to use dialog context
export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a Dialog");
  }
  return context;
}

// Close button component that can be used anywhere in a dialog
export function DialogCloseButton({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}) {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("DialogCloseButton must be used within a Dialog");
  }

  return (
    <Button
      variant="ghost"
      onClick={() => context.onOpenChange(false)}
      className={className}
      {...props}
    >
      {children || <X className="h-4 w-4" />}
    </Button>
  );
}
