import { useEffect, useState } from "react";

// Web-compatible Capacitor hook with fallbacks
// In production with Capacitor, these would be real imports

interface CapacitorState {
  isNative: boolean;
  platform: string;
  isReady: boolean;
}

export function useCapacitor() {
  const [state, setState] = useState<CapacitorState>({
    isNative: false,
    platform: "web",
    isReady: false,
  });

  useEffect(() => {
    const initializeCapacitor = async () => {
      try {
        // Check if we're in a Capacitor environment
        const isNative = window?.Capacitor?.isNativePlatform?.() || false;
        const platform = window?.Capacitor?.getPlatform?.() || "web";

        setState({
          isNative,
          platform,
          isReady: false,
        });

        // Add a small delay to simulate initialization
        setTimeout(() => {
          setState((prev) => ({ ...prev, isReady: true }));
        }, 100);
      } catch (error) {
        console.warn("Capacitor initialization failed:", error);
        // Still mark as ready for web fallback
        setState({
          isNative: false,
          platform: "web",
          isReady: true,
        });
      }
    };

    initializeCapacitor();
  }, []);

  return state;
}

// Helper hooks for specific Capacitor features
export function useStatusBar() {
  const { isNative } = useCapacitor();

  const setStatusBarStyle = async (style: "light" | "dark") => {
    if (!isNative) return;

    try {
      // In Capacitor environment, this would call the actual StatusBar plugin
      if (window?.StatusBar?.setStyle) {
        await window.StatusBar.setStyle({
          style: style === "light" ? "Light" : "Dark",
        });
      }
    } catch (error) {
      console.warn("Failed to set status bar style:", error);
    }
  };

  const setStatusBarColor = async (color: string) => {
    if (!isNative) return;

    try {
      // In Capacitor environment, this would call the actual StatusBar plugin
      if (window?.StatusBar?.setBackgroundColor) {
        await window.StatusBar.setBackgroundColor({ color });
      }
    } catch (error) {
      console.warn("Failed to set status bar color:", error);
    }
  };

  return {
    setStatusBarStyle,
    setStatusBarColor,
  };
}

export function useSplashScreen() {
  const { isNative } = useCapacitor();

  const hideSplashScreen = async () => {
    if (!isNative) return;

    try {
      // In Capacitor environment, this would call the actual SplashScreen plugin
      if (window?.SplashScreen?.hide) {
        await window.SplashScreen.hide({
          fadeOutDuration: 300,
        });
      }
    } catch (error) {
      console.warn("Failed to hide splash screen:", error);
    }
  };

  const showSplashScreen = async () => {
    if (!isNative) return;

    try {
      // In Capacitor environment, this would call the actual SplashScreen plugin
      if (window?.SplashScreen?.show) {
        await window.SplashScreen.show({
          showDuration: 0,
          autoHide: false,
        });
      }
    } catch (error) {
      console.warn("Failed to show splash screen:", error);
    }
  };

  return {
    hideSplashScreen,
    showSplashScreen,
  };
}
