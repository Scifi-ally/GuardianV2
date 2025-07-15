import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// Professional Container Component
interface ProfessionalContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  spacing?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  animate?: boolean;
}

export const ProfessionalContainer = React.forwardRef<
  HTMLDivElement,
  ProfessionalContainerProps
>(
  (
    {
      children,
      maxWidth = "lg",
      spacing = "md",
      animate = true,
      className,
      ...props
    },
    ref,
  ) => {
    const maxWidthClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-4xl",
      xl: "max-w-6xl",
      "2xl": "max-w-7xl",
      full: "max-w-full",
    };

    const spacingClasses = {
      xs: "padding-xs",
      sm: "padding-sm",
      md: "padding-md",
      lg: "padding-lg",
      xl: "padding-xl",
      "2xl": "padding-2xl",
    };

    const motionProps = animate
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
        }
      : {};

    return (
      <motion.div
        ref={ref}
        className={cn(
          "mx-auto w-full",
          maxWidthClasses[maxWidth],
          spacingClasses[spacing],
          className,
        )}
        {...motionProps}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
ProfessionalContainer.displayName = "ProfessionalContainer";

// Professional Section Component
interface ProfessionalSectionProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode;
  spacing?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  background?: "transparent" | "subtle" | "glass" | "card";
  animate?: boolean;
  stagger?: boolean;
}

export const ProfessionalSection = React.forwardRef<
  HTMLElement,
  ProfessionalSectionProps
>(
  (
    {
      children,
      spacing = "lg",
      background = "transparent",
      animate = true,
      stagger = false,
      className,
      ...props
    },
    ref,
  ) => {
    const spacingClasses = {
      xs: "spacing-y-xs",
      sm: "spacing-y-sm",
      md: "spacing-y-md",
      lg: "spacing-y-lg",
      xl: "spacing-y-xl",
      "2xl": "spacing-y-2xl",
    };

    const backgroundClasses = {
      transparent: "",
      subtle: "bg-slate-50/50",
      glass: "glass-subtle",
      card: "card-sharp",
    };

    const motionProps = animate
      ? {
          initial: { opacity: 0, y: 32 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
            ...(stagger && { staggerChildren: 0.1 }),
          },
        }
      : {};

    return (
      <motion.section
        ref={ref}
        className={cn(
          "w-full",
          spacingClasses[spacing],
          backgroundClasses[background],
          className,
        )}
        {...motionProps}
        {...props}
      >
        {children}
      </motion.section>
    );
  },
);
ProfessionalSection.displayName = "ProfessionalSection";

// Professional Grid Component
interface ProfessionalGridProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6;
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  responsive?: boolean;
  animate?: boolean;
  stagger?: boolean;
}

export const ProfessionalGrid = React.forwardRef<
  HTMLDivElement,
  ProfessionalGridProps
>(
  (
    {
      children,
      cols = 1,
      gap = "md",
      responsive = true,
      animate = true,
      stagger = true,
      className,
      ...props
    },
    ref,
  ) => {
    const colsClasses = {
      1: "grid-cols-1",
      2: responsive ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2",
      3: responsive
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-3",
      4: responsive
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        : "grid-cols-4",
      6: responsive
        ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-6"
        : "grid-cols-6",
    };

    const gapClasses = {
      xs: "gap-2",
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-8",
      xl: "gap-12",
    };

    const motionProps = animate
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: {
            duration: 0.6,
            ...(stagger && { staggerChildren: 0.1, delayChildren: 0.2 }),
          },
        }
      : {};

    return (
      <motion.div
        ref={ref}
        className={cn(
          "grid w-full",
          colsClasses[cols],
          gapClasses[gap],
          className,
        )}
        {...motionProps}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
ProfessionalGrid.displayName = "ProfessionalGrid";

// Professional Stack Component
interface ProfessionalStackProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  direction?: "horizontal" | "vertical";
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  animate?: boolean;
  stagger?: boolean;
}

export const ProfessionalStack = React.forwardRef<
  HTMLDivElement,
  ProfessionalStackProps
>(
  (
    {
      children,
      direction = "vertical",
      gap = "md",
      align = "stretch",
      justify = "start",
      animate = true,
      stagger = false,
      className,
      ...props
    },
    ref,
  ) => {
    const directionClasses = {
      horizontal: "flex-row",
      vertical: "flex-col",
    };

    const gapClasses = {
      xs: "gap-2",
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-8",
      xl: "gap-12",
    };

    const alignClasses = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    };

    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    };

    const motionProps = animate
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
            ...(stagger && { staggerChildren: 0.1 }),
          },
        }
      : {};

    return (
      <motion.div
        ref={ref}
        className={cn(
          "flex w-full",
          directionClasses[direction],
          gapClasses[gap],
          alignClasses[align],
          justifyClasses[justify],
          className,
        )}
        {...motionProps}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
ProfessionalStack.displayName = "ProfessionalStack";

// Professional Page Component
interface ProfessionalPageProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  spacing?: "xs" | "sm" | "md" | "lg" | "xl";
  background?: "default" | "gradient" | "pattern";
}

export const ProfessionalPage = React.forwardRef<
  HTMLDivElement,
  ProfessionalPageProps
>(
  (
    {
      children,
      title,
      subtitle,
      spacing = "lg",
      background = "default",
      className,
      ...props
    },
    ref,
  ) => {
    const spacingClasses = {
      xs: "spacing-y-xs",
      sm: "spacing-y-sm",
      md: "spacing-y-md",
      lg: "spacing-y-lg",
      xl: "spacing-y-xl",
    };

    const backgroundClasses = {
      default: "bg-background",
      gradient: "bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20",
      pattern: "bg-background",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "min-h-screen w-full",
          backgroundClasses[background],
          spacingClasses[spacing],
          className,
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        {...props}
      >
        {(title || subtitle) && (
          <motion.div
            className="text-center spacing-y-md"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {title && (
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-700 tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}
        {children}
      </motion.div>
    );
  },
);
ProfessionalPage.displayName = "ProfessionalPage";
