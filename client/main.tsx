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
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Guardian from "./pages/Guardian";
import Index from "./pages/Index";
import Contacts from "./pages/Contacts";
import NavigationPage from "./pages/Navigation";
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
    return <FullPageLoading text="Authenticating..." />;
  }

  return currentUser ? <>{children}</> : <Navigate to="/signin" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <FullPageLoading text="Preparing sign in..." />;
  }

  return currentUser ? <Navigate to="/" /> : <>{children}</>;
}

// Animation variants for page transitions
const fadeVariants = {
  enter: {
    opacity: 0,
    scale: 0.98,
  },
  center: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 1.02,
  },
};

const transition = {
  type: "tween",
  duration: 0.2,
  ease: "easeInOut",
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
                variants={fadeVariants}
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
              <Guardian />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <Contacts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/navigation"
          element={
            <ProtectedRoute>
              <NavigationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <motion.div
                variants={fadeVariants}
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
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
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
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="relative w-full min-h-screen">
              <AnimatedRoutes />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </SOSSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
