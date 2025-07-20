import React from "react";
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
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import AdvancedMap from "./pages/AdvancedMap";
import EnhancedNavigation from "./pages/EnhancedNavigation";
import EmergencyContactTest from "./pages/EmergencyContactTest";
import ContactsDemo from "./pages/ContactsDemo";
import { FullPageLoading } from "@/components/LoadingAnimation";
import { SplashScreen } from "@/components/SplashScreen";
import { useCapacitor } from "@/hooks/use-capacitor";

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

// Improved page transition variants
const pageVariants = {
  enter: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
  },
};

const transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  duration: 0.4,
};

function AnimatedRoutes() {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Setup motion error handler on component mount
  useEffect(() => {
    setupMotionErrorHandler();
  }, []);

  // Handle transition states
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <Layout>
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
                  transition={transition}
                  className="w-full"
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
                  transition={transition}
                  className="w-full"
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
                  transition={transition}
                  className="w-full"
                >
                  <Settings />
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
                  transition={transition}
                  className="w-full"
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
                  transition={transition}
                  className="w-full"
                >
                  <SignUp />
                </SafeMotion>
              </PublicRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <SafeMotion
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={transition}
                  className="w-full min-h-screen"
                >
                  <AdvancedMap />
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
                  transition={transition}
                  className="w-full min-h-screen"
                >
                  <EnhancedNavigation />
                </SafeMotion>
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-contact-test"
            element={
              <ProtectedRoute>
                <SafeMotion
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={transition}
                  className="w-full min-h-screen"
                >
                  <EmergencyContactTest />
                </SafeMotion>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts-demo"
            element={
              <SafeMotion
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full min-h-screen"
              >
                <ContactsDemo />
              </SafeMotion>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

const App = () => {
  const [showSplash, setShowSplash] = useState(false); // Skip splash for immediate navbar visibility
  const { isReady } = useCapacitor();

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Don't render main app until Capacitor is ready and splash is complete
  if (showSplash) {
    // Skip Capacitor ready check for immediate navbar
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
        >
          <SplashScreen onComplete={handleSplashComplete} duration={1000} />
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
