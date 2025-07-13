import { advancedEmergencyController } from "./advancedEmergencyController";
import { unifiedNotifications } from "./unifiedNotificationService";

interface GestureState {
  isEnabled: boolean;
  isActive: boolean;
  hasPermissions: boolean;
  supportedGestures: string[];
  lastGestureTime: number;
  gestureCount: number;
}

interface GestureEvent {
  type: "tap" | "shake" | "swipe" | "hold" | "double-tap" | "triple-tap";
  fingers: number;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
  intensity?: number;
  timestamp: number;
}

interface TouchState {
  startTime: number;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  fingerCount: number;
  isHolding: boolean;
}

export class AdvancedGestureController {
  private static instance: AdvancedGestureController;
  private state: GestureState;
  private callbacks: Set<(state: GestureState) => void> = new Set();
  private touchState: TouchState | null = null;
  private tapCount = 0;
  private tapTimer: NodeJS.Timeout | null = null;
  private holdTimer: NodeJS.Timeout | null = null;
  private shakeThreshold = 15;
  private lastShakeTime = 0;
  private motionEventListener: ((event: DeviceMotionEvent) => void) | null =
    null;

  constructor() {
    this.state = {
      isEnabled: false,
      isActive: false,
      hasPermissions: false,
      supportedGestures: [],
      lastGestureTime: 0,
      gestureCount: 0,
    };

    this.detectSupportedGestures();
  }

  static getInstance(): AdvancedGestureController {
    if (!AdvancedGestureController.instance) {
      AdvancedGestureController.instance = new AdvancedGestureController();
    }
    return AdvancedGestureController.instance;
  }

  // Initialize gesture system with proper permissions
  async initialize(): Promise<void> {
    console.log("🤚 Initializing Advanced Gesture Controller...");

    try {
      // Request permissions for iOS devices
      await this.requestPermissions();

      // Set up event listeners
      this.setupEventListeners();

      this.updateState({
        isActive: true,
        supportedGestures: this.detectSupportedGestures(),
      });

      console.log("✅ Advanced Gesture Controller initialized");
      console.log("📱 Supported gestures:", this.state.supportedGestures);
    } catch (error) {
      console.error("Failed to initialize gesture controller:", error);
      this.updateState({ hasPermissions: false });
    }
  }

  // Request necessary permissions (especially for iOS)
  private async requestPermissions(): Promise<void> {
    const permissions: Promise<any>[] = [];

    // Request device motion permission (iOS 13+)
    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof (DeviceMotionEvent as any).requestPermission === "function"
    ) {
      console.log("📱 Requesting iOS motion permission...");
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        console.log(`📱 Motion permission: ${permission}`);
        if (permission !== "granted") {
          throw new Error("Motion permission denied");
        }
      } catch (error) {
        console.error("Motion permission failed:", error);
        throw error;
      }
    }

    // Request device orientation permission (iOS 13+)
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      console.log("📱 Requesting iOS orientation permission...");
      try {
        const permission = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        console.log(`📱 Orientation permission: ${permission}`);
      } catch (error) {
        console.warn("Orientation permission failed:", error);
      }
    }

    this.updateState({ hasPermissions: true });
    console.log("✅ Permissions granted");
  }

  // Detect supported gestures
  private detectSupportedGestures(): string[] {
    const supported: string[] = [];

    // Touch gestures (always supported on touch devices)
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      supported.push("tap", "double-tap", "triple-tap", "hold", "swipe");
    }

    // Motion gestures
    if (typeof DeviceMotionEvent !== "undefined") {
      supported.push("shake");
    }

    // Mouse gestures (fallback for desktop)
    if (!supported.length) {
      supported.push("click", "double-click", "right-click");
    }

    return supported;
  }

  // Set up event listeners
  private setupEventListeners(): void {
    console.log("📱 Setting up gesture event listeners...");

    // Touch events
    document.addEventListener("touchstart", this.handleTouchStart.bind(this), {
      passive: false,
    });
    document.addEventListener("touchmove", this.handleTouchMove.bind(this), {
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: false,
    });

    // Motion events for shake detection
    if (typeof DeviceMotionEvent !== "undefined") {
      this.motionEventListener = this.handleDeviceMotion.bind(this);
      window.addEventListener("devicemotion", this.motionEventListener);
    }

    // Mouse events (fallback for desktop)
    document.addEventListener("click", this.handleMouseClick.bind(this));
    document.addEventListener(
      "dblclick",
      this.handleMouseDoubleClick.bind(this),
    );

    console.log("✅ Event listeners set up");
  }

  // Handle touch start
  private handleTouchStart(event: TouchEvent): void {
    if (!this.state.isEnabled) return;

    const touch = event.touches[0];
    this.touchState = {
      startTime: Date.now(),
      startPosition: { x: touch.clientX, y: touch.clientY },
      currentPosition: { x: touch.clientX, y: touch.clientY },
      fingerCount: event.touches.length,
      isHolding: false,
    };

    // Start hold timer
    this.holdTimer = setTimeout(() => {
      if (this.touchState) {
        this.touchState.isHolding = true;
        this.handleGesture({
          type: "hold",
          fingers: this.touchState.fingerCount,
          duration: Date.now() - this.touchState.startTime,
          timestamp: Date.now(),
        });
      }
    }, 500); // 500ms for hold detection
  }

  // Handle touch move
  private handleTouchMove(event: TouchEvent): void {
    if (!this.state.isEnabled || !this.touchState) return;

    const touch = event.touches[0];
    this.touchState.currentPosition = { x: touch.clientX, y: touch.clientY };
  }

  // Handle touch end
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.state.isEnabled || !this.touchState) return;

    // Clear hold timer
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    const duration = Date.now() - this.touchState.startTime;
    const deltaX =
      this.touchState.currentPosition.x - this.touchState.startPosition.x;
    const deltaY =
      this.touchState.currentPosition.y - this.touchState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Determine gesture type
    if (this.touchState.isHolding) {
      // Already handled in hold timer
    } else if (distance > 50) {
      // Swipe gesture
      const direction = this.getSwipeDirection(deltaX, deltaY);
      this.handleGesture({
        type: "swipe",
        fingers: this.touchState.fingerCount,
        direction,
        timestamp: Date.now(),
      });
    } else if (duration < 300) {
      // Tap gesture
      this.handleTapGesture(this.touchState.fingerCount);
    }

    this.touchState = null;
  }

  // Handle tap gestures with multi-tap detection
  private handleTapGesture(fingers: number): void {
    this.tapCount++;

    // Clear existing tap timer
    if (this.tapTimer) {
      clearTimeout(this.tapTimer);
    }

    // Set timer for multi-tap detection
    this.tapTimer = setTimeout(() => {
      const gestureType =
        this.tapCount === 1
          ? "tap"
          : this.tapCount === 2
            ? "double-tap"
            : "triple-tap";

      this.handleGesture({
        type: gestureType,
        fingers,
        timestamp: Date.now(),
      });

      this.tapCount = 0;
    }, 300); // 300ms window for multi-tap
  }

  // Handle device motion for shake detection
  private handleDeviceMotion(event: DeviceMotionEvent): void {
    if (!this.state.isEnabled || !event.accelerationIncludingGravity) return;

    const { x, y, z } = event.accelerationIncludingGravity;
    const acceleration = Math.sqrt(x! * x! + y! * y! + z! * z!);

    // Detect shake
    if (
      acceleration > this.shakeThreshold &&
      Date.now() - this.lastShakeTime > 1000
    ) {
      this.lastShakeTime = Date.now();
      this.handleGesture({
        type: "shake",
        fingers: 0,
        intensity: acceleration,
        timestamp: Date.now(),
      });
    }
  }

  // Handle mouse events (desktop fallback)
  private handleMouseClick(event: MouseEvent): void {
    if (!this.state.isEnabled) return;

    this.handleGesture({
      type: "tap",
      fingers: 1,
      timestamp: Date.now(),
    });
  }

  private handleMouseDoubleClick(event: MouseEvent): void {
    if (!this.state.isEnabled) return;

    this.handleGesture({
      type: "double-tap",
      fingers: 1,
      timestamp: Date.now(),
    });
  }

  // Get swipe direction
  private getSwipeDirection(
    deltaX: number,
    deltaY: number,
  ): "up" | "down" | "left" | "right" {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? "right" : "left";
    } else {
      return deltaY > 0 ? "down" : "up";
    }
  }

  // Handle gesture events
  private handleGesture(gesture: GestureEvent): void {
    console.log("🤚 Gesture detected:", gesture);

    this.updateState({
      lastGestureTime: gesture.timestamp,
      gestureCount: this.state.gestureCount + 1,
    });

    // Execute gesture actions
    this.executeGestureActions(gesture);

    // Notify callbacks
    this.notifyCallbacks();
  }

  // Execute actions based on gesture
  private executeGestureActions(gesture: GestureEvent): void {
    switch (gesture.type) {
      case "shake":
        if (gesture.intensity && gesture.intensity > 20) {
          // High intensity shake - emergency
          this.triggerEmergencyGesture();
        } else {
          // Normal shake - notification
          unifiedNotifications.success("Shake detected", {
            message: "Strong shake will trigger emergency",
          });
        }
        break;

      case "triple-tap":
        if (gesture.fingers === 1) {
          // Single finger triple tap - quick emergency
          this.triggerEmergencyGesture();
        } else if (gesture.fingers === 3) {
          // Three finger triple tap - panic mode
          this.triggerPanicGesture();
        }
        break;

      case "hold":
        if (gesture.fingers === 3 && gesture.duration! > 2000) {
          // Three finger hold - panic mode
          this.triggerPanicGesture();
        } else if (gesture.fingers === 5) {
          // Five finger hold - emergency
          this.triggerEmergencyGesture();
        }
        break;

      case "swipe":
        if (gesture.direction === "up" && gesture.fingers === 3) {
          // Three finger swipe up - show emergency controls
          this.showEmergencyControls();
        } else if (gesture.direction === "down" && gesture.fingers === 2) {
          // Two finger swipe down - quick actions
          this.showQuickActions();
        }
        break;

      case "double-tap":
        if (gesture.fingers === 2) {
          // Two finger double tap - toggle safe zones
          this.toggleSafeZones();
        }
        break;

      default:
        console.log(`Gesture ${gesture.type} with ${gesture.fingers} fingers`);
    }
  }

  // Trigger emergency gesture
  private triggerEmergencyGesture(): void {
    console.log("🚨 Emergency gesture triggered!");

    unifiedNotifications.critical("🚨 Emergency Gesture Detected", {
      message: "Activating emergency in 3 seconds...",
      persistent: true,
      action: {
        label: "Cancel",
        onClick: () => {
          unifiedNotifications.success("Emergency gesture cancelled");
        },
      },
    });

    // Start emergency with short countdown
    advancedEmergencyController.activateSOSWithCountdown("general", 3);
  }

  // Trigger panic gesture
  private triggerPanicGesture(): void {
    console.log("😰 Panic gesture triggered!");

    unifiedNotifications.warning("😰 Panic Mode Activated", {
      message: "Safety features enabled",
    });

    // Quick emergency activation without countdown
    advancedEmergencyController.quickEmergencyActivation("general");
  }

  // Show emergency controls
  private showEmergencyControls(): void {
    console.log("📱 Showing emergency controls");

    unifiedNotifications.success("Emergency Controls", {
      message: "Emergency options displayed",
    });

    // Trigger UI to show emergency controls
    document.dispatchEvent(new CustomEvent("show-emergency-controls"));
  }

  // Show quick actions
  private showQuickActions(): void {
    console.log("⚡ Showing quick actions");

    unifiedNotifications.success("Quick Actions", {
      message: "Quick action menu displayed",
    });

    // Trigger UI to show quick actions
    document.dispatchEvent(new CustomEvent("show-quick-actions"));
  }

  // Toggle safe zones
  private toggleSafeZones(): void {
    console.log("🛡️ Toggling safe zones via gesture");

    unifiedNotifications.success("Safe Zones", {
      message: "Toggle safe zones display",
    });

    // Trigger safe zones toggle
    document.dispatchEvent(new CustomEvent("toggle-safe-zones"));
  }

  // Enable gestures
  async enableGestures(): Promise<void> {
    console.log("🤚 Enabling gestures...");

    if (!this.state.isActive) {
      await this.initialize();
    }

    this.updateState({ isEnabled: true });
    unifiedNotifications.success("Gestures enabled", {
      message: `${this.state.supportedGestures.length} gestures available`,
    });
  }

  // Disable gestures
  disableGestures(): void {
    console.log("🚫 Disabling gestures...");

    this.updateState({ isEnabled: false });
    unifiedNotifications.success("Gestures disabled");
  }

  // Toggle gesture system
  async toggleGestures(enabled: boolean): Promise<void> {
    if (enabled) {
      await this.enableGestures();
    } else {
      this.disableGestures();
    }
  }

  // Clean up
  cleanup(): void {
    console.log("🧹 Cleaning up gesture controller...");

    // Remove event listeners
    document.removeEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
    );
    document.removeEventListener("touchmove", this.handleTouchMove.bind(this));
    document.removeEventListener("touchend", this.handleTouchEnd.bind(this));

    if (this.motionEventListener) {
      window.removeEventListener("devicemotion", this.motionEventListener);
    }

    // Clear timers
    if (this.tapTimer) clearTimeout(this.tapTimer);
    if (this.holdTimer) clearTimeout(this.holdTimer);

    this.updateState({ isActive: false, isEnabled: false });
  }

  // Update state and notify callbacks
  private updateState(newState: Partial<GestureState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyCallbacks();
  }

  // Subscribe to state changes
  subscribe(callback: (state: GestureState) => void): () => void {
    this.callbacks.add(callback);
    callback(this.state);
    return () => this.callbacks.delete(callback);
  }

  // Notify all callbacks
  private notifyCallbacks(): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(this.state);
      } catch (error) {
        console.error("Gesture callback error:", error);
      }
    });
  }

  // Get current state
  getState(): GestureState {
    return { ...this.state };
  }

  // Get debug info
  getDebugInfo(): {
    state: GestureState;
    hasMotionListener: boolean;
    touchState: TouchState | null;
    tapCount: number;
  } {
    return {
      state: this.state,
      hasMotionListener: !!this.motionEventListener,
      touchState: this.touchState,
      tapCount: this.tapCount,
    };
  }
}

export const advancedGestureController =
  AdvancedGestureController.getInstance();
