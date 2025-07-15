import "./global.css";
import "./styles/production-polish.css";

import { createRoot } from "react-dom/client";
import { UnifiedNotificationSystem } from "@/components/UnifiedNotificationSystem";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SOSSettingsProvider } from "@/contexts/SOSSettingsContext";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import SafeMotion from "@/components/SafeMotion";
import { setupMotionErrorHandler } from "@/lib/motionErrorHandler";
import "@/lib/emergencyMotionFix"; // Auto-activates error suppression
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import EnhancedNavigation from "./pages/EnhancedNavigation";
import { FullPageLoading } from "@/components/LoadingAnimation";
import { FunctionalSplashScreen } from "@/components/FunctionalSplashScreen";
import { useCapacitor } from "@/hooks/use-capacitor";
import { MagicNavbar } from "@/components/MagicNavbar";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <FullPageLoading text="Loading..." />;
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <FullPageLoading text="Loading..." />;
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Emergency-optimized page transition variants
const pageVariants = {
  enter: {
    opacity: 0,
    scale: 0.98, // Subtle scale instead of slide for faster perception
  },
  center: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 1.02, // Quick scale out
  },
};

const transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
};

// Emergency-optimized transition for faster page switches
const emergencyTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.15, // Faster for emergency situations
};

function PersistentNavbar() {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Only show navbar on authenticated routes
  const showNavbar =
    currentUser && !["/signin", "/signup"].includes(location.pathname);

  if (!showNavbar) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <MagicNavbar />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  // Setup motion error handler on component mount
  useEffect(() => {
    setupMotionErrorHandler();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SafeMotion
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={emergencyTransition}
                className="w-full min-h-screen"
              >
                <Index />
              </SafeMotion>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <SafeMotion
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={emergencyTransition}
                className="w-full min-h-screen"
              >
                <Profile />
              </SafeMotion>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SafeMotion
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={emergencyTransition}
                className="w-full min-h-screen"
              >
                <Settings />
              </SafeMotion>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enhanced-navigation"
          element={
            <ProtectedRoute>
              <SafeMotion
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={emergencyTransition}
                className="w-full min-h-screen"
              >
                <EnhancedNavigation />
              </SafeMotion>
            </ProtectedRoute>
          }
        />
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <SafeMotion
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={emergencyTransition}
                className="w-full min-h-screen"
              >
                <SignIn />
              </SafeMotion>
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SafeMotion
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={emergencyTransition}
                className="w-full min-h-screen"
              >
                <SignUp />
              </SafeMotion>
            </PublicRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { isReady } = useCapacitor();

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Don't render main app until Capacitor is ready and splash is complete
  if (!isReady || showSplash) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
        >
          <FunctionalSplashScreen onComplete={handleSplashComplete} />
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        forcedTheme="light"
      >
        <AuthProvider>
          <SOSSettingsProvider>
            <TooltipProvider>
              <UnifiedNotificationSystem />
              <BrowserRouter>
                <div className="relative w-full min-h-screen bg-background">
                  <AnimatedRoutes />
                  <PersistentNavbar />
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </SOSSettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
