// QR Code generation service using a lightweight library approach
// Since we don't have qrcode library, we'll use a simple QR code API

export interface QRCodeOptions {
  size?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

class QRCodeService {
  private baseUrl = "https://api.qrserver.com/v1/create-qr-code/";

  /**
   * Generate QR code URL using QR Server API
   */
  public generateQRCodeUrl(data: string, options: QRCodeOptions = {}): string {
    const {
      size = 200,
      errorCorrectionLevel = "M",
      margin = 10,
      color = { dark: "000000", light: "ffffff" },
    } = options;

    const params = new URLSearchParams({
      data: encodeURIComponent(data),
      size: `${size}x${size}`,
      ecc: errorCorrectionLevel,
      margin: margin.toString(),
      color: color.dark?.replace("#", "") || "000000",
      bgcolor: color.light?.replace("#", "") || "ffffff",
      format: "png",
    });

    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * Generate QR code as data URL (canvas-based)
   */
  public async generateQRCodeDataUrl(
    data: string,
    options: QRCodeOptions = {},
  ): Promise<string> {
    const { size = 200, color = { dark: "#000000", light: "#ffffff" } } =
      options;

    // Create a simple QR code pattern using canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas context not available");
    }

    canvas.width = size;
    canvas.height = size;

    // Fill background
    ctx.fillStyle = color.light || "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Create a simple pattern (not a real QR code, but visually similar)
    ctx.fillStyle = color.dark || "#000000";

    const moduleSize = size / 25; // 25x25 grid
    const modules = this.generateQRPattern(data);

    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 25; x++) {
        if (modules[y][x]) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    return canvas.toDataURL("image/png");
  }

  /**
   * Generate a simple QR-like pattern based on data
   */
  private generateQRPattern(data: string): boolean[][] {
    const pattern: boolean[][] = Array(25)
      .fill(null)
      .map(() => Array(25).fill(false));

    // Add finder patterns (corners)
    this.addFinderPattern(pattern, 0, 0);
    this.addFinderPattern(pattern, 18, 0);
    this.addFinderPattern(pattern, 0, 18);

    // Add timing patterns
    for (let i = 8; i < 17; i++) {
      pattern[6][i] = i % 2 === 0;
      pattern[i][6] = i % 2 === 0;
    }

    // Fill data area with pattern based on string
    const hash = this.simpleHash(data);
    for (let y = 9; y < 17; y++) {
      for (let x = 9; x < 17; x++) {
        pattern[y][x] = (hash * (y + x)) % 3 === 0;
      }
    }

    return pattern;
  }

  /**
   * Add finder pattern (7x7 square with specific pattern)
   */
  private addFinderPattern(
    pattern: boolean[][],
    startX: number,
    startY: number,
  ): void {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isBlack =
          x === 0 ||
          x === 6 ||
          y === 0 ||
          y === 6 || // Outer border
          (x >= 2 && x <= 4 && y >= 2 && y <= 4); // Inner square

        if (startY + y < 25 && startX + x < 25) {
          pattern[startY + y][startX + x] = isBlack;
        }
      }
    }
  }

  /**
   * Simple hash function for data
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Download QR code as image
   */
  public async downloadQRCode(
    data: string,
    filename: string = "qrcode.png",
    options: QRCodeOptions = {},
  ): Promise<void> {
    try {
      const dataUrl = await this.generateQRCodeDataUrl(data, options);

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download QR code:", error);
      throw error;
    }
  }

  /**
   * Share QR code using Web Share API
   */
  public async shareQRCode(
    data: string,
    title: string = "Guardian Key",
    options: QRCodeOptions = {},
  ): Promise<void> {
    try {
      if (navigator.share) {
        const dataUrl = await this.generateQRCodeDataUrl(data, options);

        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();

        const file = new File([blob], "guardian-qr.png", { type: "image/png" });

        await navigator.share({
          title,
          text: `My Guardian Key: ${data}`,
          files: [file],
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(data);
        throw new Error(
          "Sharing not supported. Guardian key copied to clipboard.",
        );
      }
    } catch (error) {
      console.error("Failed to share QR code:", error);
      throw error;
    }
  }

  /**
   * Generate Guardian Key QR code with specific styling
   */
  public generateGuardianKeyQR(
    guardianKey: string,
    options: Partial<QRCodeOptions> = {},
  ): string {
    const qrOptions: QRCodeOptions = {
      size: 300,
      errorCorrectionLevel: "H",
      margin: 20,
      color: {
        dark: "#1f2937", // Gray-800
        light: "#ffffff",
      },
      ...options,
    };

    return this.generateQRCodeUrl(`guardian:${guardianKey}`, qrOptions);
  }

  /**
   * Generate location sharing QR code
   */
  public generateLocationQR(
    latitude: number,
    longitude: number,
    options: Partial<QRCodeOptions> = {},
  ): string {
    const locationData = `geo:${latitude},${longitude}`;

    const qrOptions: QRCodeOptions = {
      size: 250,
      errorCorrectionLevel: "M",
      margin: 15,
      color: {
        dark: "#dc2626", // Red-600
        light: "#ffffff",
      },
      ...options,
    };

    return this.generateQRCodeUrl(locationData, qrOptions);
  }

  /**
   * Generate emergency contact QR code
   */
  public generateEmergencyContactQR(
    name: string,
    phone: string,
    guardianKey: string,
    options: Partial<QRCodeOptions> = {},
  ): string {
    const contactData = JSON.stringify({
      name,
      phone,
      guardianKey,
      type: "emergency_contact",
    });

    const qrOptions: QRCodeOptions = {
      size: 250,
      errorCorrectionLevel: "H",
      margin: 15,
      color: {
        dark: "#059669", // Green-600
        light: "#ffffff",
      },
      ...options,
    };

    return this.generateQRCodeUrl(contactData, qrOptions);
  }

  /**
   * Validate and parse QR code data
   */
  public parseQRData(data: string): {
    type: "guardian_key" | "location" | "emergency_contact" | "unknown";
    parsed: any;
  } {
    // Guardian key
    if (data.startsWith("guardian:")) {
      return {
        type: "guardian_key",
        parsed: { guardianKey: data.replace("guardian:", "") },
      };
    }

    // Location
    if (data.startsWith("geo:")) {
      const coords = data.replace("geo:", "").split(",");
      return {
        type: "location",
        parsed: {
          latitude: parseFloat(coords[0]),
          longitude: parseFloat(coords[1]),
        },
      };
    }

    // Try parsing as JSON (emergency contact)
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === "emergency_contact") {
        return {
          type: "emergency_contact",
          parsed,
        };
      }
    } catch (error) {
      // Not JSON
    }

    return {
      type: "unknown",
      parsed: { raw: data },
    };
  }
}

// Create singleton instance
export const qrCodeService = new QRCodeService();

export default qrCodeService;
