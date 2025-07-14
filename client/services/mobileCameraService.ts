import {
  Camera,
  CameraResultType,
  CameraSource,
  CameraDirection,
} from "@capacitor/camera";
import { Device } from "@capacitor/device";
import { Capacitor } from "@capacitor/core";

interface CameraPermissions {
  camera: boolean;
  photos: boolean;
}

interface DeviceInfo {
  isNative: boolean;
  platform: string;
  model: string;
}

class MobileCameraService {
  private static instance: MobileCameraService;
  private deviceInfo: DeviceInfo | null = null;

  public static getInstance(): MobileCameraService {
    if (!MobileCameraService.instance) {
      MobileCameraService.instance = new MobileCameraService();
    }
    return MobileCameraService.instance;
  }

  /**
   * Initialize the camera service and check device capabilities
   */
  async initialize(): Promise<void> {
    try {
      this.deviceInfo = {
        isNative: Capacitor.isNativePlatform(),
        platform: Capacitor.getPlatform(),
        model: "unknown",
      };

      if (this.deviceInfo.isNative) {
        const info = await Device.getInfo();
        this.deviceInfo.model = info.model || "unknown";
      }

      console.log("Camera service initialized:", this.deviceInfo);
    } catch (error) {
      console.error("Failed to initialize camera service:", error);
    }
  }

  /**
   * Check if the device is running as a native app
   */
  isNativeApp(): boolean {
    return this.deviceInfo?.isNative || false;
  }

  /**
   * Get platform information
   */
  getPlatform(): string {
    return this.deviceInfo?.platform || "web";
  }

  /**
   * Check camera permissions
   */
  async checkCameraPermissions(): Promise<CameraPermissions> {
    try {
      if (!this.isNativeApp()) {
        // For web, check if getUserMedia is available
        const hasWebCamera = !!(
          navigator.mediaDevices && navigator.mediaDevices.getUserMedia
        );
        return {
          camera: hasWebCamera,
          photos: hasWebCamera,
        };
      }

      // For native apps, check Capacitor camera permissions
      const permissions = await Camera.checkPermissions();

      return {
        camera: permissions.camera === "granted",
        photos: permissions.photos === "granted",
      };
    } catch (error) {
      console.error("Error checking camera permissions:", error);
      return { camera: false, photos: false };
    }
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<CameraPermissions> {
    try {
      if (!this.isNativeApp()) {
        // For web, try to get user media to trigger permission request
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          stream.getTracks().forEach((track) => track.stop()); // Clean up
          return { camera: true, photos: true };
        } catch (webError) {
          console.error("Web camera permission denied:", webError);
          return { camera: false, photos: false };
        }
      }

      // For native apps, request Capacitor camera permissions
      const permissions = await Camera.requestPermissions();

      return {
        camera: permissions.camera === "granted",
        photos: permissions.photos === "granted",
      };
    } catch (error) {
      console.error("Error requesting camera permissions:", error);
      return { camera: false, photos: false };
    }
  }

  /**
   * Take a photo using native camera
   */
  async takePhoto(): Promise<string | null> {
    try {
      if (!this.isNativeApp()) {
        throw new Error("Photo capture only available in native app");
      }

      const permissions = await this.checkCameraPermissions();
      if (!permissions.camera) {
        const granted = await this.requestCameraPermissions();
        if (!granted.camera) {
          throw new Error("Camera permission denied");
        }
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: CameraDirection.Rear,
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error("Error taking photo:", error);
      throw error;
    }
  }

  /**
   * Get optimal camera settings for QR scanning
   */
  getQRScannerSettings() {
    if (this.isNativeApp()) {
      return {
        preferredCamera: "environment" as const,
        torchEnabled: false,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5,
        returnDetailedScanResult: true,
      };
    } else {
      return {
        preferredCamera: "environment" as const,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5,
      };
    }
  }

  /**
   * Check if camera features are available
   */
  async getCameraCapabilities() {
    try {
      const permissions = await this.checkCameraPermissions();

      return {
        hasCamera: permissions.camera,
        hasPhotos: permissions.photos,
        canTakePhotos: this.isNativeApp() && permissions.camera,
        canScanQR: permissions.camera,
        platform: this.getPlatform(),
        isNative: this.isNativeApp(),
      };
    } catch (error) {
      console.error("Error checking camera capabilities:", error);
      return {
        hasCamera: false,
        hasPhotos: false,
        canTakePhotos: false,
        canScanQR: false,
        platform: this.getPlatform(),
        isNative: this.isNativeApp(),
      };
    }
  }

  /**
   * Enable/disable camera torch (flashlight)
   */
  async toggleTorch(enabled: boolean): Promise<boolean> {
    try {
      if (!this.isNativeApp()) {
        console.warn("Torch control not available in web version");
        return false;
      }

      // Note: Torch control would need additional plugin or custom implementation
      // This is a placeholder for future torch functionality
      console.log(`Torch ${enabled ? "enabled" : "disabled"}`);
      return true;
    } catch (error) {
      console.error("Error toggling torch:", error);
      return false;
    }
  }
}

// Export singleton instance
export const mobileCameraService = MobileCameraService.getInstance();

// Initialize on import
mobileCameraService.initialize().catch(console.error);
