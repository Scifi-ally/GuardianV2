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
          className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center overflow-hidden"
        >
          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 bg-blue-200/30 rounded-full"
                animate={{
                  x: [
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerWidth,
                  ],
                  y: [
                    Math.random() * window.innerHeight,
                    Math.random() * window.innerHeight,
                  ],
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 8 + Math.random() * 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              />
            ))}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`purple-${i}`}
                className="absolute w-6 h-6 bg-purple-200/20 rounded-full"
                animate={{
                  x: [
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerWidth,
                  ],
                  y: [
                    Math.random() * window.innerHeight,
                    Math.random() * window.innerHeight,
                  ],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 12 + Math.random() * 6,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.8,
                }}
              />
            ))}
          </div>

          <div className="text-center space-y-8 px-8 relative z-10">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: 1,
                rotate: 0,
              }}
              transition={{ duration: 1, type: "spring", bounce: 0.3 }}
              className="flex justify-center"
            >
              <div className="relative">
                <motion.div
                  className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-blue-100 relative overflow-hidden"
                  animate={{
                    boxShadow: [
                      "0 10px 40px rgba(59, 130, 246, 0.2)",
                      "0 10px 60px rgba(147, 51, 234, 0.3)",
                      "0 10px 40px rgba(59, 130, 246, 0.2)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <svg
                    className="w-12 h-12 text-black"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M6 9c0-1 .6-2 1.5-2h9c.9 0 1.5 1 1.5 2v4c0 2-.8 3.2-2 4l-3 1.4-3-1.4c-1.2-.8-2-2-2-2-4V9z" />
                    <circle cx="12" cy="12" r="1" fill="#ff0000" />
                  </svg>
                </motion.div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-blue-200 rounded-full border-t-blue-500"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border-2 border-purple-200 rounded-full border-b-purple-500"
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
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/30 rounded-full"
                    animate={{ x: [-20, 280] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
