import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.guardian.emergency",
  appName: "Guardian",
  webDir: "dist/spa",
  server: {
    androidScheme: "https",
    hostname: "guardian.app",
    iosScheme: "guardian",
  },
  plugins: {
    Camera: {
      permissions: ["camera", "photos"],
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#ffffff",
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerStyle: "small",
      spinnerColor: "#000000",
      launchAutoHide: true,
      fadeInDuration: 300,
      fadeOutDuration: 300,
      spinnerColor: "#999999",
    },
    Device: {},
    Haptics: {},
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Network: {},
    App: {
      launchUrl: "guardian://",
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
};

export default config;
