/// <reference types="vite/client" />

declare global {
  interface Window {
    guardian_toggleTraffic?: () => void;
    guardian_toggleSatellite?: () => void;
  }
}
