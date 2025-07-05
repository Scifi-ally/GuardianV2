import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SOSSettingsProvider } from "@/contexts/SOSSettingsContext";
import { NotificationProvider } from "@/components/NotificationSystem";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Guardian from "./pages/Guardian";
import Index from "./pages/Index";
import Contacts from "./pages/Contacts";
import NavigationPage from "./pages/Navigation";
import EnhancedNavigationPage from "./pages/EnhancedNavigation";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import { FullPageLoading } from "@/components/LoadingAnimation";

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

// Simple page transition variants
const pageVariants = {
  enter: {
    opacity: 0,
    x: 20,
  },
  center: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -20,
  },
};

const transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3,
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <motion.div
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full min-h-screen"
              >
                <Index />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/guardian"
          element={
            <ProtectedRoute>
              <motion.div
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full min-h-screen"
              >
                <Guardian />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <motion.div
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full min-h-screen"
              >
                <Contacts />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/navigation"
          element={
            <ProtectedRoute>
              <motion.div
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full min-h-screen"
              >
                <NavigationPage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enhanced-navigation"
          element={
            <ProtectedRoute>
              <motion.div
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full min-h-screen"
              >
                <EnhancedNavigationPage />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <motion.div
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full min-h-screen"
              >
                <Profile />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <motion.div
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full min-h-screen"
              >
                <Settings />
              </motion.div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <motion.div
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full min-h-screen"
              >
                <SignIn />
              </motion.div>
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <motion.div
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full min-h-screen"
              >
                <SignUp />
              </motion.div>
            </PublicRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SOSSettingsProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="relative w-full min-h-screen bg-background">
                <AnimatedRoutes />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </SOSSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
