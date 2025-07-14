/**
 * Unified Modal Component with Advanced Closing Animations
 * Consolidates all modal/panel functionality into one efficient component
 */

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, ArrowLeft, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full" | "auto";
export type ModalPosition = "center" | "top" | "bottom" | "left" | "right";
export type AnimationType =
  | "fade"
  | "slide"
  | "scale"
  | "flip"
  | "bounce"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleUp"
  | "scaleDown"
  | "rotateIn"
  | "rotateOut";

export interface UnifiedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;

  // Layout & Styling
  size?: ModalSize;
  position?: ModalPosition;
  className?: string;
  overlayClassName?: string;

  // Animations
  animationType?: AnimationType;
  duration?: number;
  closeAnimation?: AnimationType;

  // Behavior
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  showBackButton?: boolean;
  showMinimizeButton?: boolean;
  preventBodyScroll?: boolean;

  // Callbacks
  onBack?: () => void;
  onMinimize?: () => void;
  onAnimationComplete?: () => void;

  // Accessibility
  ariaLabel?: string;
  role?: string;

  // Mobile optimization
  mobileFullScreen?: boolean;
  swipeToClose?: boolean;
}

// Animation variants for different effects
const createAnimationVariants = (
  animationType: AnimationType,
  closeAnimation?: AnimationType,
): { enter: Variants; exit: Variants } => {
  const getVariant = (type: AnimationType): Variants => {
    switch (type) {
      case "fade":
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };

      case "slideUp":
        return {
          hidden: { opacity: 0, y: "100%" },
          visible: { opacity: 1, y: 0 },
        };

      case "slideDown":
        return {
          hidden: { opacity: 0, y: "-100%" },
          visible: { opacity: 1, y: 0 },
        };

      case "slideLeft":
        return {
          hidden: { opacity: 0, x: "100%" },
          visible: { opacity: 1, x: 0 },
        };

      case "slideRight":
        return {
          hidden: { opacity: 0, x: "-100%" },
          visible: { opacity: 1, x: 0 },
        };

      case "scale":
      case "scaleUp":
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 },
        };

      case "scaleDown":
        return {
          hidden: { opacity: 0, scale: 1.2 },
          visible: { opacity: 1, scale: 1 },
        };

      case "bounce":
        return {
          hidden: { opacity: 0, scale: 0.3 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              damping: 10,
              stiffness: 400,
            },
          },
        };

      case "flip":
        return {
          hidden: { opacity: 0, rotateY: -90 },
          visible: { opacity: 1, rotateY: 0 },
        };

      case "rotateIn":
        return {
          hidden: { opacity: 0, rotate: -180, scale: 0.5 },
          visible: { opacity: 1, rotate: 0, scale: 1 },
        };

      case "rotateOut":
        return {
          hidden: { opacity: 0, rotate: 180, scale: 0.5 },
          visible: { opacity: 1, rotate: 0, scale: 1 },
        };

      default:
        return {
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
        };
    }
  };

  return {
    enter: getVariant(animationType),
    exit: getVariant(closeAnimation || animationType),
  };
};

// Size configurations
const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm w-full mx-4",
  md: "max-w-md w-full mx-4",
  lg: "max-w-lg w-full mx-4",
  xl: "max-w-4xl w-full mx-4",
  full: "w-full h-full",
  auto: "w-auto max-w-[90vw] mx-4",
};

// Position classes
const positionClasses: Record<ModalPosition, string> = {
  center: "items-center justify-center",
  top: "items-start justify-center pt-20",
  bottom: "items-end justify-center pb-20",
  left: "items-center justify-start pl-4",
  right: "items-center justify-end pr-4",
};

export function UnifiedModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  position = "center",
  className,
  overlayClassName,
  animationType = "scale",
  duration = 0.3,
  closeAnimation,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  showBackButton = false,
  showMinimizeButton = false,
  preventBodyScroll = true,
  onBack,
  onMinimize,
  onAnimationComplete,
  ariaLabel,
  role = "dialog",
  mobileFullScreen = false,
  swipeToClose = false,
}: UnifiedModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (preventBodyScroll && isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, preventBodyScroll]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, closeOnEscape]);

  // Enhanced close handler with animation
  const handleClose = () => {
    // Add any custom closing logic here
    onClose();
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    onMinimize?.();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Animation variants
  const { enter, exit } = createAnimationVariants(
    animationType,
    closeAnimation,
  );

  // Overlay animation
  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  // Mobile responsive classes
  const mobileClasses = mobileFullScreen
    ? "sm:max-w-none sm:w-full sm:h-full sm:rounded-none"
    : "";

  // Drag handlers for swipe to close
  const handleDragEnd = (event: any, info: any) => {
    if (swipeToClose && info.offset.y > 100) {
      handleClose();
    } else {
      setDragY(0);
    }
  };

  return (
    <AnimatePresence mode="wait" onExitComplete={onAnimationComplete}>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            className={cn(
              "fixed inset-0 bg-black/50 backdrop-blur-sm",
              overlayClassName,
            )}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: duration * 0.8 }}
            onClick={handleOverlayClick}
          />

          {/* Modal Container */}
          <div className={cn("fixed inset-0 flex", positionClasses[position])}>
            <motion.div
              ref={modalRef}
              className={cn(
                "relative bg-white rounded-lg shadow-2xl border border-gray-200",
                "max-h-[90vh] overflow-hidden",
                sizeClasses[size],
                mobileClasses,
                isMinimized && "h-16 overflow-hidden",
                className,
              )}
              variants={enter}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{
                duration,
                ease: "easeInOut",
                type: animationType === "bounce" ? "spring" : "tween",
              }}
              drag={swipeToClose ? "y" : false}
              dragConstraints={{ top: 0, bottom: 500 }}
              dragElastic={{ top: 0, bottom: 0.2 }}
              onDragEnd={handleDragEnd}
              style={{ y: dragY }}
              role={role}
              aria-label={ariaLabel || title}
              aria-modal="true"
            >
              {/* Header */}
              {(title ||
                showCloseButton ||
                showBackButton ||
                showMinimizeButton) && (
                <motion.div
                  className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2">
                    {showBackButton && onBack && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    )}

                    {title && (
                      <h2 className="text-lg font-semibold text-gray-900 truncate">
                        {title}
                      </h2>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {showMinimizeButton && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMinimize}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                      >
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                    )}

                    {showCloseButton && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClose}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Content */}
              {!isMinimized && (
                <motion.div
                  className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {children}
                </motion.div>
              )}

              {/* Swipe indicator for mobile */}
              {swipeToClose && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-1 bg-gray-300 rounded-full" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Specialized modal components using the unified base
export function SafetyModal(
  props: Omit<UnifiedModalProps, "animationType" | "size">,
) {
  return (
    <UnifiedModal
      {...props}
      animationType="slideUp"
      closeAnimation="slideDown"
      size="lg"
      className="border-blue-200 bg-gradient-to-br from-blue-50 to-white"
    />
  );
}

export function AlertModal(
  props: Omit<UnifiedModalProps, "animationType" | "size">,
) {
  return (
    <UnifiedModal
      {...props}
      animationType="bounce"
      closeAnimation="scaleDown"
      size="md"
      className="border-red-200 bg-gradient-to-br from-red-50 to-white"
    />
  );
}

export function SettingsModal(
  props: Omit<UnifiedModalProps, "animationType" | "size">,
) {
  return (
    <UnifiedModal
      {...props}
      animationType="slideLeft"
      closeAnimation="slideRight"
      size="xl"
      position="right"
      showMinimizeButton
      className="border-gray-200 h-full rounded-l-lg rounded-r-none"
    />
  );
}

export function MobilePanel(
  props: Omit<
    UnifiedModalProps,
    "animationType" | "position" | "mobileFullScreen"
  >,
) {
  return (
    <UnifiedModal
      {...props}
      animationType="slideUp"
      closeAnimation="slideDown"
      position="bottom"
      mobileFullScreen
      swipeToClose
      className="rounded-t-lg rounded-b-none"
    />
  );
}

// Hook for programmatic modal control
export function useUnifiedModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState<Partial<UnifiedModalProps>>({});

  const openModal = (props?: Partial<UnifiedModalProps>) => {
    setModalProps(props || {});
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    openModal,
    closeModal,
    modalProps: { ...modalProps, isOpen, onClose: closeModal },
  };
}

export default UnifiedModal;
