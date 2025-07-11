import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function SettingsInitializer() {
  const { currentUser } = useAuth();
  const { settings, loading } = useSettings();
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryUI, setShowRetryUI] = useState(false);

  useEffect(() => {
    if (currentUser && !loading && !settings && retryCount < 3) {
      // Auto-retry after failures
      const timer = setTimeout(
        () => {
          setRetryCount((prev) => prev + 1);
          console.log(
            `Auto-retrying settings initialization (attempt ${retryCount + 1})`,
          );
        },
        2000 * (retryCount + 1),
      ); // Exponential backoff

      return () => clearTimeout(timer);
    }

    // Show retry UI if we've failed multiple times
    if (currentUser && !loading && !settings && retryCount >= 3) {
      setShowRetryUI(true);
    } else {
      setShowRetryUI(false);
    }
  }, [currentUser, loading, settings, retryCount]);

  const handleManualRetry = () => {
    setRetryCount(0);
    setShowRetryUI(false);
    toast.info("Retrying settings initialization...");
    // The useEffect above will trigger the retry
  };

  // Don't show anything if settings are working fine
  if (!currentUser || loading || settings || !showRetryUI) {
    return null;
  }

  return (
    <Card className="border-orange-300 bg-orange-50 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-full">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm text-orange-800">
              Settings Not Available
            </h3>
            <p className="text-xs text-orange-700 mt-1">
              Unable to load your settings. Some features may not work properly.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualRetry}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Status indicator for successful settings loading
export function SettingsLoadedIndicator() {
  const { settings, loading } = useSettings();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!loading && settings) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, settings]);

  if (!showSuccess) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="border-green-300 bg-green-50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              Settings loaded successfully
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
