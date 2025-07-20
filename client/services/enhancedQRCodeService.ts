import { mobileCameraService } from "./mobileCameraService";
import { Device } from "@capacitor/device";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

interface QRCodeOptions {
  size?: number;
  color?: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  margin?: number;
}

interface ParsedQRData {
  type:
    | "guardian_key"
    | "location"
    | "emergency_contact"
    | "url"
    | "text"
    | "unknown";
  parsed: any;
  raw: string;
  isValid: boolean;
  error?: string;
}

interface QRScanResult {
  success: boolean;
  data?: string;
  parsed?: ParsedQRData;
  error?: string;
  source: "camera" | "file" | "manual";
}

class EnhancedQRCodeService {
  private static instance: EnhancedQRCodeService;
  private isCapacitorAvailable = false;
  private deviceInfo: any = null;

  static getInstance(): EnhancedQRCodeService {
    if (!EnhancedQRCodeService.instance) {
      EnhancedQRCodeService.instance = new EnhancedQRCodeService();
    }
    return EnhancedQRCodeService.instance;
  }

  private constructor() {
    this.initializeCapacitor();
  }

  private async initializeCapacitor() {
    try {
      // Check if running in Capacitor environment
      this.isCapacitorAvailable = !!(window as any).Capacitor;

      if (this.isCapacitorAvailable) {
        this.deviceInfo = await Device.getInfo();
        console.log(
          "📱 Capacitor QR service initialized:",
          this.deviceInfo.platform,
        );
      } else {
        console.log("🌐 Web QR service initialized");
      }
    } catch (error) {
      console.warn("⚠️ Capacitor not available, using web fallback");
      this.isCapacitorAvailable = false;
    }
  }

  /**
   * Generate QR code for Guardian Key with extreme case handling
   */
  async generateGuardianKeyQR(
    guardianKey: string,
    displayName: string,
    options: QRCodeOptions = {},
  ): Promise<string> {
    try {
      // Validate input - extreme case handling
      if (!guardianKey || typeof guardianKey !== "string") {
        throw new Error("Invalid guardian key provided");
      }

      if (guardianKey.length !== 8) {
        throw new Error("Guardian key must be exactly 8 characters");
      }

      // Sanitize and validate guardian key
      const sanitizedKey = guardianKey.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (sanitizedKey.length !== 8) {
        throw new Error("Guardian key contains invalid characters");
      }

      // Sanitize display name
      const sanitizedName = displayName?.trim() || "Unknown User";
      if (sanitizedName.length > 50) {
        throw new Error("Display name too long (max 50 characters)");
      }

      // Create QR data with validation
      const qrData = JSON.stringify({
        type: "guardian_key",
        version: "1.0",
        guardianKey: sanitizedKey,
        displayName: sanitizedName,
        timestamp: Date.now(),
        platform: this.deviceInfo?.platform || "web",
      });

      // Validate QR data size
      if (qrData.length > 2953) {
        // QR code limit for high error correction
        throw new Error("QR data too large for reliable scanning");
      }

      return await this.generateQRCode(qrData, {
        size: 300,
        errorCorrectionLevel: "H", // High error correction for reliability
        margin: 4,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        ...options,
      });
    } catch (error) {
      console.error("❌ Failed to generate Guardian Key QR:", error);
      throw new Error(
        `QR generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Parse QR code data with comprehensive validation
   */
  parseQRData(data: string): ParsedQRData {
    const result: ParsedQRData = {
      type: "unknown",
      parsed: null,
      raw: data,
      isValid: false,
    };

    try {
      // Handle empty or null data
      if (!data || typeof data !== "string") {
        result.error = "Invalid QR data: empty or null";
        return result;
      }

      // Trim and validate data
      const trimmedData = data.trim();
      if (trimmedData.length === 0) {
        result.error = "Invalid QR data: empty string";
        return result;
      }

      // Try to parse as JSON first (Guardian Key format)
      try {
        const jsonData = JSON.parse(trimmedData);

        if (jsonData.type === "guardian_key") {
          result.type = "guardian_key";
          result.parsed = this.parseGuardianKeyData(jsonData);
          result.isValid = result.parsed !== null;
          return result;
        }

        if (jsonData.type === "emergency_contact") {
          result.type = "emergency_contact";
          result.parsed = this.parseEmergencyContactData(jsonData);
          result.isValid = result.parsed !== null;
          return result;
        }

        if (jsonData.type === "location") {
          result.type = "location";
          result.parsed = this.parseLocationData(jsonData);
          result.isValid = result.parsed !== null;
          return result;
        }
      } catch (jsonError) {
        // Not JSON, continue with other formats
      }

      // Check for Guardian Key pattern (legacy format)
      if (/^guardian:/i.test(trimmedData)) {
        const keyMatch = trimmedData.match(/^guardian:([A-Z0-9]{8})$/i);
        if (keyMatch) {
          result.type = "guardian_key";
          result.parsed = {
            guardianKey: keyMatch[1].toUpperCase(),
            displayName: "Unknown User",
            version: "legacy",
          };
          result.isValid = true;
          return result;
        }
      }

      // Check for direct Guardian Key (8 alphanumeric characters)
      if (/^[A-Z0-9]{8}$/i.test(trimmedData)) {
        result.type = "guardian_key";
        result.parsed = {
          guardianKey: trimmedData.toUpperCase(),
          displayName: "Unknown User",
          version: "direct",
        };
        result.isValid = true;
        return result;
      }

      // Check for coordinate patterns
      const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
      const coordMatch = trimmedData.match(coordPattern);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);

        if (this.isValidCoordinate(lat, lng)) {
          result.type = "location";
          result.parsed = { latitude: lat, longitude: lng };
          result.isValid = true;
          return result;
        }
      }

      // Check for URLs
      try {
        const url = new URL(trimmedData);
        result.type = "url";
        result.parsed = { url: url.toString() };
        result.isValid = true;
        return result;
      } catch (urlError) {
        // Not a valid URL
      }

      // Default to text
      result.type = "text";
      result.parsed = { text: trimmedData };
      result.isValid = true;
    } catch (error) {
      result.error = `Parse error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }

    return result;
  }

  /**
   * Scan QR code using Capacitor Camera or Web API with fallbacks
   */
  async scanQRCode(): Promise<QRScanResult> {
    try {
      // Try Capacitor Camera first (mobile)
      if (this.isCapacitorAvailable) {
        return await this.scanWithCapacitorCamera();
      }

      // Fallback to web camera
      return await this.scanWithWebCamera();
    } catch (error) {
      console.error("❌ QR scan failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Scan failed",
        source: "camera",
      };
    }
  }

  /**
   * Scan QR from image file with extreme case handling
   */
  async scanFromFile(file: File): Promise<QRScanResult> {
    try {
      // Validate file
      if (!file) {
        throw new Error("No file provided");
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        throw new Error("File must be an image");
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Image file too large (max 10MB)");
      }

      // Create image URL
      const imageUrl = URL.createObjectURL(file);

      try {
        // Import QR scanner dynamically
        const QrScanner = (await import("qr-scanner")).default;

        const result = await QrScanner.scanImage(imageUrl, {
          returnDetailedScanResult: true,
          highlightScanRegion: false,
          highlightCodeOutline: false,
        });

        const data = typeof result === "string" ? result : result.data;
        const parsed = this.parseQRData(data);

        return {
          success: true,
          data,
          parsed,
          source: "file",
        };
      } finally {
        // Clean up object URL
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      console.error("❌ File scan failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "File scan failed",
        source: "file",
      };
    }
  }

  /**
   * Generate QR code as data URL with error handling
   */
  private async generateQRCode(
    data: string,
    options: QRCodeOptions,
  ): Promise<string> {
    try {
      // Dynamic import for QR code generation
      const QRCode = (await import("qrcode")).default;

      const canvas = document.createElement("canvas");

      await QRCode.toCanvas(canvas, data, {
        width: options.size || 300,
        margin: options.margin || 2,
        color: {
          dark: options.color?.dark || "#000000",
          light: options.color?.light || "#ffffff",
        },
        errorCorrectionLevel: options.errorCorrectionLevel || "M",
      });

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("❌ QR generation failed:", error);
      throw new Error(
        `QR generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Scan with Capacitor Camera (mobile)
   */
  private async scanWithCapacitorCamera(): Promise<QRScanResult> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!image.webPath) {
        throw new Error("No image captured");
      }

      // Convert to blob for processing
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const file = new File([blob], "qr-scan.jpg", { type: "image/jpeg" });

      return await this.scanFromFile(file);
    } catch (error) {
      console.error("❌ Capacitor camera scan failed:", error);
      throw error;
    }
  }

  /**
   * Scan with Web Camera (browser)
   */
  private async scanWithWebCamera(): Promise<QRScanResult> {
    try {
      // This would integrate with existing QR scanner component
      throw new Error("Web camera scanning requires QR scanner component");
    } catch (error) {
      console.error("❌ Web camera scan failed:", error);
      throw error;
    }
  }

  /**
   * Parse Guardian Key specific data
   */
  private parseGuardianKeyData(data: any): any {
    try {
      if (!data.guardianKey || typeof data.guardianKey !== "string") {
        return null;
      }

      const key = data.guardianKey.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (key.length !== 8) {
        return null;
      }

      return {
        guardianKey: key,
        displayName: data.displayName?.trim() || "Unknown User",
        version: data.version || "1.0",
        timestamp: data.timestamp || Date.now(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse emergency contact data
   */
  private parseEmergencyContactData(data: any): any {
    try {
      return {
        name: data.name?.trim() || "Unknown Contact",
        guardianKey:
          data.guardianKey?.toUpperCase()?.replace(/[^A-Z0-9]/g, "") || "",
        priority: Math.max(1, Math.min(3, parseInt(data.priority) || 1)),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse location data
   */
  private parseLocationData(data: any): any {
    try {
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);

      if (!this.isValidCoordinate(lat, lng)) {
        return null;
      }

      return {
        latitude: lat,
        longitude: lng,
        name: data.name?.trim() || "Location",
        timestamp: data.timestamp || Date.now(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate coordinates
   */
  private isValidCoordinate(lat: number, lng: number): boolean {
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      !(lat === 0 && lng === 0) // Exclude null island
    );
  }

  /**
   * Download QR code with Capacitor/Web compatibility
   */
  async downloadQRCode(
    data: string,
    filename: string,
    options: QRCodeOptions = {},
  ): Promise<void> {
    try {
      const qrDataUrl = await this.generateQRCode(data, options);

      if (this.isCapacitorAvailable) {
        // Mobile download
        await this.downloadOnMobile(qrDataUrl, filename);
      } else {
        // Web download
        this.downloadOnWeb(qrDataUrl, filename);
      }
    } catch (error) {
      console.error("❌ Download failed:", error);
      throw new Error(
        `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Share QR code with Capacitor/Web compatibility
   */
  async shareQRCode(
    data: string,
    title: string,
    options: QRCodeOptions = {},
  ): Promise<void> {
    try {
      const qrDataUrl = await this.generateQRCode(data, options);

      if (this.isCapacitorAvailable && navigator.share) {
        // Native sharing
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        const file = new File([blob], "guardian-key.png", {
          type: "image/png",
        });

        await navigator.share({
          title,
          files: [file],
        });
      } else {
        // Fallback to clipboard
        await this.copyToClipboard(data);
        throw new Error("Shared to clipboard (native sharing not available)");
      }
    } catch (error) {
      console.error("❌ Share failed:", error);
      throw error;
    }
  }

  /**
   * Mobile download implementation
   */
  private async downloadOnMobile(
    dataUrl: string,
    filename: string,
  ): Promise<void> {
    try {
      // For Capacitor, we'd use Filesystem plugin
      // For now, fallback to web download
      this.downloadOnWeb(dataUrl, filename);
    } catch (error) {
      console.error("❌ Mobile download failed:", error);
      throw error;
    }
  }

  /**
   * Web download implementation
   */
  private downloadOnWeb(dataUrl: string, filename: string): void {
    try {
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("❌ Web download failed:", error);
      throw error;
    }
  }

  /**
   * Copy to clipboard with fallbacks
   */
  private async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error("❌ Copy to clipboard failed:", error);
      throw error;
    }
  }

  /**
   * Test QR code scanning capability
   */
  async testScanningCapability(): Promise<{
    canScan: boolean;
    method: "capacitor" | "web" | "none";
    error?: string;
  }> {
    try {
      if (this.isCapacitorAvailable) {
        const capabilities = await mobileCameraService.getCameraCapabilities();
        return {
          canScan: capabilities.canScanQR,
          method: "capacitor",
        };
      }

      // Test web camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        return {
          canScan: true,
          method: "web",
        };
      } catch (webError) {
        return {
          canScan: false,
          method: "none",
          error: "Camera not available",
        };
      }
    } catch (error) {
      return {
        canScan: false,
        method: "none",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const enhancedQRCodeService = EnhancedQRCodeService.getInstance();
export type { QRCodeOptions, ParsedQRData, QRScanResult };
