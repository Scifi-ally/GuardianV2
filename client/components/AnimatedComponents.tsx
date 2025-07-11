import { motion } from "framer-motion";
import { ReactNode } from "react";
import {
  useScrollAnimation,
  useStaggeredScrollAnimation,
  scrollAnimationVariants,
  staggerAnimationVariants,
  slideUpVariants,
  slideInFromLeftVariants,
  slideInFromRightVariants,
  fadeInScaleVariants,
  floatingVariants,
  pulseVariants,
} from "@/hooks/useScrollAnimations";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "slideUp" | "slideLeft" | "slideRight" | "fadeScale";
  delay?: number;
}

export const AnimatedSection = ({
  children,
  className,
  variant = "default",
  delay = 0,
}: AnimatedSectionProps) => {
  const { ref, isInView } = useScrollAnimation();

  const getVariant = () => {
    switch (variant) {
      case "slideUp":
        return slideUpVariants;
      case "slideLeft":
        return slideInFromLeftVariants;
      case "slideRight":
        return slideInFromRightVariants;
      case "fadeScale":
        return fadeInScaleVariants;
      default:
        return scrollAnimationVariants;
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={getVariant()}
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
}

export const AnimatedList = ({
  children,
  className,
  itemClassName,
  staggerDelay = 0.1,
}: AnimatedListProps) => {
  const { ref, isInView } = useScrollAnimation();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerAnimationVariants}
      className={cn(className)}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={scrollAnimationVariants}
          transition={{ delay: index * staggerDelay }}
          className={cn(itemClassName)}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  clickScale?: number;
}

export const AnimatedCard = ({
  children,
  className,
  hoverScale = 1.02,
  clickScale = 0.98,
}: AnimatedCardProps) => {
  const { ref, isInView } = useScrollAnimation();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={scrollAnimationVariants}
      whileHover={{
        scale: hoverScale,
        y: -5,
        transition: { type: "spring", stiffness: 400, damping: 17 },
      }}
      whileTap={{ scale: clickScale }}
      className={cn(
        "transition-shadow duration-300 hover:shadow-lg cursor-pointer",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export const FloatingElement = ({
  children,
  className,
  intensity = 10,
}: FloatingElementProps) => {
  return (
    <motion.div
      variants={{
        animate: {
          y: [-intensity, intensity, -intensity],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      }}
      initial="animate"
      animate="animate"
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

interface PulsingElementProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  duration?: number;
}

export const PulsingElement = ({
  children,
  className,
  scale = 1.05,
  duration = 2,
}: PulsingElementProps) => {
  return (
    <motion.div
      variants={{
        animate: {
          scale: [1, scale, 1],
          transition: {
            duration,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      }}
      initial="animate"
      animate="animate"
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

interface CounterAnimationProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
}

export const CounterAnimation = ({
  from,
  to,
  duration = 2,
  className,
}: CounterAnimationProps) => {
  const { ref, isInView } = useScrollAnimation();

  return (
    <motion.span
      ref={ref}
      className={cn(className)}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isInView && (
        <motion.span
          initial={{ textContent: from }}
          animate={{ textContent: to }}
          transition={{
            duration,
            ease: "easeOut",
          }}
          onUpdate={(latest) => {
            if (ref.current) {
              ref.current.textContent = Math.round(latest.textContent);
            }
          }}
        />
      )}
    </motion.span>
  );
};

interface GlowingElementProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export const GlowingElement = ({
  children,
  className,
  glowColor = "rgba(59, 130, 246, 0.5)",
}: GlowingElementProps) => {
  return (
    <motion.div
      className={cn(className)}
      whileHover={{
        boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 0 60px ${glowColor}`,
        transition: { duration: 0.3 },
      }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.div>
  );
};

interface MorphingButtonProps {
  children: ReactNode;
  className?: string;
  morphTo?: ReactNode;
  isToggled?: boolean;
  onClick?: () => void;
}

export const MorphingButton = ({
  children,
  className,
  morphTo,
  isToggled = false,
  onClick,
}: MorphingButtonProps) => {
  return (
    <motion.button
      className={cn(className)}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <motion.div
        initial={false}
        animate={{ opacity: isToggled ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        style={{ position: isToggled ? "absolute" : "relative" }}
      >
        {children}
      </motion.div>
      {morphTo && (
        <motion.div
          initial={false}
          animate={{ opacity: isToggled ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ position: isToggled ? "relative" : "absolute" }}
        >
          {morphTo}
        </motion.div>
      )}
    </motion.button>
  );
};

interface ParallaxContainerProps {
  children: ReactNode;
  className?: string;
  offset?: number;
}

export const ParallaxContainer = ({
  children,
  className,
  offset = 50,
}: ParallaxContainerProps) => {
  return (
    <motion.div
      className={cn(className)}
      initial={{ y: offset }}
      whileInView={{ y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 30,
      }}
    >
      {children}
    </motion.div>
  );
};

interface LoadingDotsProps {
  className?: string;
  size?: number;
  color?: string;
}

export const LoadingDots = ({
  className,
  size = 8,
  color = "bg-blue-500",
}: LoadingDotsProps) => {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn("rounded-full", color)}
          style={{ width: size, height: size }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
};

interface WaveAnimationProps {
  className?: string;
  waveColor?: string;
  amplitude?: number;
}

export const WaveAnimation = ({
  className,
  waveColor = "#3B82F6",
  amplitude = 20,
}: WaveAnimationProps) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `linear-gradient(45deg, ${waveColor}20, transparent)`,
            `linear-gradient(225deg, ${waveColor}20, transparent)`,
            `linear-gradient(45deg, ${waveColor}20, transparent)`,
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${30 + i * 20}% 50%, ${waveColor}40, transparent 50%)`,
          }}
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
};
