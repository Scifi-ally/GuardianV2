import { EnhancedPerformanceOptimizer } from "./EnhancedPerformanceOptimizer";
import { SmoothInteractions } from "./SmoothInteractions";
import { ConnectivityIndicator } from "./ConnectivityDiagnostics";

export function AppEnhancements() {
  return (
    <>
      <EnhancedPerformanceOptimizer />
      <SmoothInteractions />
      {/* Connectivity indicator in corner */}
      <div className="fixed top-2 right-2 z-50">
        <ConnectivityIndicator />
      </div>
    </>
  );
}
