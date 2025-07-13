/**
 * Professional Loading Components
 * Production-grade loading states with smooth animations
 */

import { motion } from "framer-motion";
import { Loader2, MapPin, Shield, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(sizeClasses[size], className)}
    >
      <Loader2 className="h-full w-full text-blue-600" />
    </motion.div>
  );
}

interface PulseDotsProps {
  className?: string;
}

export function PulseDots({ className }: PulseDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 bg-blue-600 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  rows?: number;
}

export function Skeleton({ className, rows = 1 }: SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{
            width: `${80 + Math.random() * 20}%`,
          }}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

interface MapLoadingProps {
  className?: string;
}

export function MapLoading({ className }: MapLoadingProps) {
  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg",
        className,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
          <MapPin className="h-8 w-8 text-white" />
        </div>
        <motion.div
          className="absolute -inset-4 border-2 border-blue-300 rounded-full"
          animate={{
            scale: [1, 1.5],
            opacity: [1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      </motion.div>
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-gray-900">Loading Map</h3>
        <p className="text-sm text-gray-600 mt-1">
          Initializing location services...
        </p>
        <PulseDots className="mt-3 justify-center" />
      </motion.div>
    </motion.div>
  );
}

interface ProfileLoadingProps {
  className?: string;
}

export function ProfileLoading({ className }: ProfileLoadingProps) {
  return (
    <motion.div
      className={cn("space-y-6", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Profile Header Skeleton */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div
            className="h-24 w-24 bg-gray-200 rounded-full"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <div className="space-y-2">
            <Skeleton rows={1} className="w-32 h-6" />
            <Skeleton rows={1} className="w-48 h-4" />
          </div>
          <div className="flex gap-3 w-full max-w-sm">
            <Skeleton rows={1} className="flex-1 h-10" />
            <Skeleton rows={1} className="flex-1 h-10" />
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <motion.div
            key={i}
            className="bg-white border rounded-lg p-4 text-center"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          >
            <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-2" />
            <Skeleton rows={1} className="w-16 h-4 mx-auto mb-1" />
            <Skeleton rows={1} className="w-20 h-3 mx-auto" />
          </motion.div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="bg-white rounded-lg border p-6">
        <Skeleton rows={4} />
      </div>
    </motion.div>
  );
}

interface AppLoadingProps {
  text?: string;
  className?: string;
}

export function AppLoading({
  text = "Loading Guardian...",
  className,
}: AppLoadingProps) {
  return (
    <motion.div
      className={cn(
        "min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center",
        className,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <motion.div
          className="relative mx-auto mb-8"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <motion.div
            className="absolute -inset-6 border-2 border-blue-300 rounded-full"
            animate={{
              scale: [1, 1.3],
              opacity: [1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Guardian</h1>
          <p className="text-gray-600 mb-6">{text}</p>
          <PulseDots className="justify-center" />
        </motion.div>
      </div>
    </motion.div>
  );
}

interface ConnectionErrorProps {
  onRetry?: () => void;
  className?: string;
}

export function ConnectionError({ onRetry, className }: ConnectionErrorProps) {
  return (
    <motion.div
      className={cn("text-center p-6", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        animate={{
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 0.5,
          repeat: 3,
        }}
      >
        <Activity className="h-8 w-8 text-red-600" />
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Connection Lost
      </h3>
      <p className="text-gray-600 mb-4">
        Unable to connect to Guardian services. Please check your internet
        connection.
      </p>
      {onRetry && (
        <motion.button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={onRetry}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try Again
        </motion.button>
      )}
    </motion.div>
  );
}
