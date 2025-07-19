/// <reference types="vite/client" />

// Capacitor type declarations for mobile app
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
      Plugins?: {
        Geolocation?: {
          getCurrentPosition: (options?: any) => Promise<any>;
          watchPosition: (options?: any, callback?: any) => Promise<any>;
        };
        StatusBar?: {
          setStyle: (options: any) => Promise<void>;
          setBackgroundColor: (options: any) => Promise<void>;
        };
        SplashScreen?: {
          hide: (options?: any) => Promise<void>;
          show: (options?: any) => Promise<void>;
        };
      };
    };
    currentTrafficLayer?: any;
  }
}
