import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GuardianLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animated?: boolean;
  showText?: boolean;
}

export function GuardianLogo({
  size = "md",
  className,
  animated = true,
  showText = true,
}: GuardianLogoProps) {
  const sizes = {
    sm: { icon: "h-6 w-6", text: "text-lg" },
    md: { icon: "h-8 w-8", text: "text-xl" },
    lg: { icon: "h-12 w-12", text: "text-2xl" },
    xl: { icon: "h-16 w-16", text: "text-3xl" },
  };

  const logoVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.6,
      },
    },
    hover: {
      scale: 1.1,
      rotate: 360,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 400,
      },
    },
  };

  const textVariants = {
    initial: { opacity: 0, x: -20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.3,
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const shieldVariants = {
    initial: { pathLength: 0 },
    animate: {
      pathLength: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        delay: 0.2,
      },
    },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        variants={animated ? logoVariants : undefined}
        initial={animated ? "initial" : undefined}
        animate={animated ? "animate" : undefined}
        whileHover={animated ? "hover" : undefined}
        className={cn(
          "relative rounded-full bg-black flex items-center justify-center",
          sizes[size].icon,
        )}
      >
        {/* Guardian Shield Logo */}
        <svg viewBox="0 0 24 24" fill="none" className="w-2/3 h-2/3 text-white">
          <motion.path
            d="M12 2L3 7v5c0 5.5 3.8 10.74 9 12 5.2-1.26 9-6.5 9-12V7l-9-5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
            variants={animated ? shieldVariants : undefined}
            initial={animated ? "initial" : undefined}
            animate={animated ? "animate" : undefined}
          />
          {/* G Letter inside shield */}
          <motion.text
            x="12"
            y="16"
            textAnchor="middle"
            className="fill-black font-bold text-sm"
            initial={animated ? { opacity: 0 } : undefined}
            animate={animated ? { opacity: 1 } : undefined}
            transition={animated ? { delay: 1, duration: 0.5 } : undefined}
          >
            G
          </motion.text>
        </svg>

        {/* Animated ring around logo */}
        {animated && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-gray-200"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>

      {showText && (
        <motion.span
          variants={animated ? textVariants : undefined}
          initial={animated ? "initial" : undefined}
          animate={animated ? "animate" : undefined}
          className={cn("font-bold text-black", sizes[size].text)}
        >
          Guardian
        </motion.span>
      )}
    </div>
  );
}

// Compact version for app bar
export function GuardianLogoCompact({ className }: { className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn("flex items-center gap-1", className)}
    >
      <div className="h-7 w-7 rounded-full bg-black flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
          <path
            d="M12 2L3 7v5c0 5.5 3.8 10.74 9 12 5.2-1.26 9-6.5 9-12V7l-9-5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
          />
          <text
            x="12"
            y="16"
            textAnchor="middle"
            className="fill-black font-bold text-xs"
          >
            G
          </text>
        </svg>
      </div>
      <span className="font-semibold text-black text-sm">Guardian</span>
    </motion.div>
  );
}
