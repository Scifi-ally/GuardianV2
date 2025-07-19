import React from "react";
import AdvancedMap from "./AdvancedMap";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PerformanceOptimizer } from "@/components/PerformanceOptimizer";

export default function Index() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <PerformanceOptimizer />
        <AdvancedMap />
      </div>
    </ErrorBoundary>
  );
}
