interface PanicPattern {
  shakeIntensity: number;
  heartRateSpike: boolean;
  rapidMovement: boolean;
  screenTaps: number;
  timeWindow: number;
}

interface PanicDetectionConfig {
  shakeThreshold: number;
  tapThreshold: number;
  movementThreshold: number;
  timeWindow: number; // milliseconds
  confidenceThreshold: number; // 0-100
}

class PanicDetectionService {
  private config: PanicDetectionConfig = {
    shakeThreshold: 15, // m/s²
    tapThreshold: 10, // taps in time window
    movementThreshold: 5, // rapid location changes
    timeWindow: 30000, // 30 seconds
    confidenceThreshold: 75, // 75% confidence
  };

  private isActive = false;
  private listeners: ((confidence: number, pattern: PanicPattern) => void)[] =
    [];

  // Data tracking
  private recentShakes: number[] = [];
  private recentTaps: number[] = [];
  private recentMovements: { lat: number; lng: number; time: number }[] = [];
  private lastAcceleration = { x: 0, y: 0, z: 0 };

  start() {
    if (this.isActive) return;
    this.isActive = true;

    console.log("🚨 Panic Detection Service started");

    // Listen for device motion (shake detection)
    this.startShakeDetection();

    // Listen for rapid screen taps
    this.startTapDetection();

    // Listen for location changes (panic movement)
    this.startMovementDetection();

    // Analyze patterns every 5 seconds
    setInterval(() => this.analyzePatterns(), 5000);
  }

  stop() {
    this.isActive = false;
    console.log("🛑 Panic Detection Service stopped");
  }

  private startShakeDetection() {
    if (typeof DeviceMotionEvent === "undefined") return;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (!this.isActive) return;

      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const { x = 0, y = 0, z = 0 } = acceleration;

      // Calculate shake intensity
      const deltaX = Math.abs(x - this.lastAcceleration.x);
      const deltaY = Math.abs(y - this.lastAcceleration.y);
      const deltaZ = Math.abs(z - this.lastAcceleration.z);

      const shakeIntensity = Math.sqrt(
        deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ,
      );

      if (shakeIntensity > this.config.shakeThreshold) {
        this.recentShakes.push(Date.now());
        console.log("📳 Shake detected:", shakeIntensity);
      }

      this.lastAcceleration = { x, y, z };
    };

    window.addEventListener("devicemotion", handleMotion);
  }

  private startTapDetection() {
    let tapCount = 0;
    let tapTimer: NodeJS.Timeout;

    const handleTap = (event: TouchEvent | MouseEvent) => {
      if (!this.isActive) return;

      tapCount++;
      clearTimeout(tapTimer);

      tapTimer = setTimeout(() => {
        if (tapCount >= 5) {
          // 5+ rapid taps
          this.recentTaps.push(Date.now());
          console.log("👆 Rapid tapping detected:", tapCount);
        }
        tapCount = 0;
      }, 2000);
    };

    // Listen for both touch and mouse events
    document.addEventListener("touchstart", handleTap, { passive: true });
    document.addEventListener("mousedown", handleTap);
  }

  private startMovementDetection() {
    if (!navigator.geolocation) return;

    const handleLocationChange = (position: GeolocationPosition) => {
      if (!this.isActive) return;

      const { latitude: lat, longitude: lng } = position.coords;
      const now = Date.now();

      this.recentMovements.push({ lat, lng, time: now });

      // Check for erratic movement patterns
      if (this.recentMovements.length >= 3) {
        const recent = this.recentMovements.slice(-3);
        const distances = [];

        for (let i = 1; i < recent.length; i++) {
          const dist = this.calculateDistance(
            recent[i - 1].lat,
            recent[i - 1].lng,
            recent[i].lat,
            recent[i].lng,
          );
          distances.push(dist);
        }

        // Rapid back-and-forth movement might indicate panic
        const avgDistance =
          distances.reduce((a, b) => a + b, 0) / distances.length;
        if (avgDistance > 0.01) {
          // 10+ meters of movement
          console.log("🏃 Erratic movement detected");
        }
      }
    };

    navigator.geolocation.watchPosition(
      handleLocationChange,
      (error) => console.warn("Movement detection error:", error),
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private analyzePatterns() {
    if (!this.isActive) return;

    const now = Date.now();
    const timeWindow = this.config.timeWindow;

    // Clean old data
    this.recentShakes = this.recentShakes.filter(
      (time) => now - time < timeWindow,
    );
    this.recentTaps = this.recentTaps.filter((time) => now - time < timeWindow);
    this.recentMovements = this.recentMovements.filter(
      (movement) => now - movement.time < timeWindow,
    );

    // Calculate panic indicators
    const shakeCount = this.recentShakes.length;
    const tapCount = this.recentTaps.length;
    const movementCount = this.recentMovements.length;

    // Panic pattern analysis
    const pattern: PanicPattern = {
      shakeIntensity: shakeCount,
      heartRateSpike: false, // Would need heart rate sensor
      rapidMovement: movementCount > this.config.movementThreshold,
      screenTaps: tapCount,
      timeWindow: timeWindow,
    };

    // Calculate confidence score
    let confidence = 0;

    // Shake patterns (40% weight)
    if (shakeCount >= 3) confidence += 40;
    else if (shakeCount >= 2) confidence += 25;
    else if (shakeCount >= 1) confidence += 10;

    // Tap patterns (30% weight)
    if (tapCount >= 3) confidence += 30;
    else if (tapCount >= 2) confidence += 20;
    else if (tapCount >= 1) confidence += 10;

    // Movement patterns (30% weight)
    if (movementCount >= 5) confidence += 30;
    else if (movementCount >= 3) confidence += 20;
    else if (movementCount >= 2) confidence += 10;

    // Notify listeners if confidence threshold is met
    if (confidence >= this.config.confidenceThreshold) {
      console.log(`🚨 PANIC DETECTED! Confidence: ${confidence}%`, pattern);
      this.notifyListeners(confidence, pattern);
    }
  }

  private notifyListeners(confidence: number, pattern: PanicPattern) {
    this.listeners.forEach((callback) => callback(confidence, pattern));
  }

  public subscribe(
    callback: (confidence: number, pattern: PanicPattern) => void,
  ) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  public updateConfig(newConfig: Partial<PanicDetectionConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log("🔧 Panic detection config updated:", this.config);
  }

  public getConfig(): PanicDetectionConfig {
    return { ...this.config };
  }

  public isRunning(): boolean {
    return this.isActive;
  }

  // Manual panic trigger
  public triggerManualPanic() {
    const pattern: PanicPattern = {
      shakeIntensity: 999,
      heartRateSpike: false,
      rapidMovement: false,
      screenTaps: 999,
      timeWindow: 0,
    };

    console.log("🚨 MANUAL PANIC TRIGGERED!");
    this.notifyListeners(100, pattern);
  }
}

export const panicDetectionService = new PanicDetectionService();
export type { PanicPattern, PanicDetectionConfig };
