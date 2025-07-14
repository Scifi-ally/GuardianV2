import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.guardian.safety",
  appName: "Guardian Safety",
  webDir: "dist/spa",
  server: {
    androidScheme: "https",
  },
  plugins: {
    Camera: {
      permissions: ["camera", "photos"],
    },
    Geolocation: {
      permissions: ["location"],
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#ffffff",
    },
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerStyle: "small",
      spinnerColor: "#000000",
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.CALL_PHONE",
      "android.permission.VIBRATE",
      "android.permission.CAMERA",
    ],
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    permissions: [
      "NSLocationWhenInUseUsageDescription",
      "NSLocationAlwaysAndWhenInUseUsageDescription",
      "NSCameraUsageDescription",
    ],
  },
};

export default config;
