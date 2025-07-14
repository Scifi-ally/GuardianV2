import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, MapPin, Users, AlertTriangle } from "lucide-react";
import { LoadingAnimation } from "@/components/LoadingAnimation";

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function SplashScreen({
  onComplete,
  duration = 3000,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleSkip = () => {
    setIsComplete(true);
    onComplete?.();
  };

  const steps = [
    { icon: Shield, label: "Initializing Security", delay: 0 },
    { icon: MapPin, label: "Loading Location Services", delay: 800 },
    { icon: Users, label: "Connecting Emergency Contacts", delay: 1600 },
    { icon: AlertTriangle, label: "Ready for Safety", delay: 2400 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }
        return newProgress;
      });
    }, duration / 100);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  useEffect(() => {
    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index);
      }, step.delay);
    });
  }, []);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center"
        >
          <div className="text-center space-y-8 px-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, type: "spring", bounce: 0.3 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-black/10">
                  <svg
                    className="w-12 h-12 text-black"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6 9c0-1 .6-2 1.5-2h9c.9 0 1.5 1 1.5 2v4c0 2-.8 3.2-2 4l-3 1.4-3-1.4c-1.2-.8-2-2-2-4V9z" />
                    <circle cx="12" cy="12" r="1" fill="#ff0000" />
                  </svg>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-black/20 rounded-full border-t-black"
                />
              </div>
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="space-y-2"
            >
              <h1 className="text-3xl font-bold text-black">Guardian Safety</h1>
              <p className="text-gray-600 text-sm">
                Your Personal Safety Companion
              </p>
            </motion.div>

            {/* Progress Steps */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="space-y-4"
            >
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0.3, scale: 0.9 }}
                    animate={{
                      opacity: isActive ? 1 : isCompleted ? 0.7 : 0.3,
                      scale: isActive ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 justify-center"
                  >
                    <div
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-black text-white"
                          : isCompleted
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        isActive
                          ? "text-black"
                          : isCompleted
                            ? "text-green-600"
                            : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="w-64 mx-auto"
            >
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-black rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{progress}% Complete</p>
            </motion.div>

            {/* Loading Animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              <LoadingAnimation size="sm" variant="dots" />
            </motion.div>

            {/* Skip Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <button
                onClick={handleSkip}
                className="px-6 py-2 text-sm text-gray-600 hover:text-black transition-colors border border-gray-300 rounded-lg hover:border-black bg-white/80 backdrop-blur-sm"
              >
                Skip & Continue →
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
