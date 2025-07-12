import { useState, useEffect } from "react";
import { EventEmitter } from "@/lib/eventEmitter";
import { realTimeService } from "./realTimeService";

export interface PanicModeAction {
  id: string;
  type: "alert" | "record" | "call" | "share_location" | "safe_mode";
  status: "pending" | "in_progress" | "completed" | "failed";
  timestamp: Date;
  data?: any;
}

export interface PanicModeSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  actions: PanicModeAction[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  isActive: boolean;
  emergencyContacts: string[];
}

class PanicModeService extends EventEmitter {
  private currentSession: PanicModeSession | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private locationWatcher: number | null = null;

  constructor() {
    super();
  }

  // Start panic mode
  public async startPanicMode(
    emergencyContacts: string[] = [],
  ): Promise<string> {
    if (this.currentSession?.isActive) {
      throw new Error("Panic mode is already active");
    }

    const sessionId = `panic_${Date.now()}`;
    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      actions: [],
      isActive: true,
      emergencyContacts,
    };

    // Get current location
    try {
      const location = await this.getCurrentLocation();
      this.currentSession.location = location;
    } catch (error) {
      console.warn("Failed to get location in panic mode:", error);
    }

    // Start continuous location tracking
    this.startLocationTracking();

    // Emit panic mode started
    this.emit("panicModeStarted", this.currentSession);

    // Report to real-time service
    realTimeService.reportEmergency();

    return sessionId;
  }

  // Stop panic mode
  public stopPanicMode(): void {
    if (!this.currentSession?.isActive) {
      return;
    }

    this.currentSession.isActive = false;
    this.currentSession.endTime = new Date();

    // Stop location tracking
    this.stopLocationTracking();

    // Stop any ongoing recordings
    this.stopRecording();

    this.emit("panicModeStopped", this.currentSession);
    this.currentSession = null;
  }

  // Alert all emergency contacts
  public async alertContacts(message?: string): Promise<PanicModeAction> {
    if (!this.currentSession?.isActive) {
      throw new Error("No active panic mode session");
    }

    const action: PanicModeAction = {
      id: `action_${Date.now()}`,
      type: "alert",
      status: "in_progress",
      timestamp: new Date(),
    };

    this.currentSession.actions.push(action);

    try {
      const defaultMessage = `🚨 EMERGENCY: I need immediate help! Current location: ${
        this.currentSession.location
          ? `${this.currentSession.location.latitude.toFixed(4)}, ${this.currentSession.location.longitude.toFixed(4)}`
          : "Location unavailable"
      } - Time: ${new Date().toLocaleString()} - Please respond immediately!`;

      const alertMessage = message || defaultMessage;

      // Try multiple notification methods
      await this.sendAlert(alertMessage);

      action.status = "completed";
      action.data = {
        message: alertMessage,
        contactCount: this.currentSession.emergencyContacts.length,
      };

      this.emit("actionCompleted", action);
      return action;
    } catch (error) {
      action.status = "failed";
      action.data = { error: error.message };
      this.emit("actionFailed", action);
      throw error;
    }
  }

  // Start recording audio/video
  public async startRecording(
    type: "audio" | "video" = "audio",
  ): Promise<PanicModeAction> {
    if (!this.currentSession?.isActive) {
      throw new Error("No active panic mode session");
    }

    const action: PanicModeAction = {
      id: `action_${Date.now()}`,
      type: "record",
      status: "in_progress",
      timestamp: new Date(),
      data: { recordingType: type },
    };

    this.currentSession.actions.push(action);

    try {
      const constraints =
        type === "video" ? { video: true, audio: true } : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: type === "video" ? "video/webm" : "audio/webm",
        });

        action.data.recordingBlob = blob;
        action.data.recordingUrl = URL.createObjectURL(blob);
        action.status = "completed";

        this.emit("actionCompleted", action);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      this.mediaRecorder.start();

      // Auto-stop after 5 minutes for safety
      setTimeout(
        () => {
          if (this.mediaRecorder?.state === "recording") {
            this.stopRecording();
          }
        },
        5 * 60 * 1000,
      );

      this.emit("recordingStarted", action);
      return action;
    } catch (error) {
      action.status = "failed";
      action.data.error = error.message;
      this.emit("actionFailed", action);
      throw error;
    }
  }

  // Stop recording
  public stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
    }
  }

  // Call emergency services
  public async callEmergencyServices(
    number: string = "911",
  ): Promise<PanicModeAction> {
    if (!this.currentSession?.isActive) {
      throw new Error("No active panic mode session");
    }

    const action: PanicModeAction = {
      id: `action_${Date.now()}`,
      type: "call",
      status: "in_progress",
      timestamp: new Date(),
      data: { number },
    };

    this.currentSession.actions.push(action);

    try {
      // Open phone dialer
      window.location.href = `tel:${number}`;

      action.status = "completed";
      this.emit("actionCompleted", action);
      return action;
    } catch (error) {
      action.status = "failed";
      action.data.error = error.message;
      this.emit("actionFailed", action);
      throw error;
    }
  }

  // Share location continuously
  public async shareLocation(): Promise<PanicModeAction> {
    if (!this.currentSession?.isActive) {
      throw new Error("No active panic mode session");
    }

    const action: PanicModeAction = {
      id: `action_${Date.now()}`,
      type: "share_location",
      status: "in_progress",
      timestamp: new Date(),
    };

    this.currentSession.actions.push(action);

    try {
      const location = await this.getCurrentLocation();
      const locationMessage = `📍 LIVE LOCATION UPDATE: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} - Accuracy: ${Math.round(location.accuracy)}m - Time: ${new Date().toLocaleString()}`;

      await this.sendAlert(locationMessage);

      action.status = "completed";
      action.data = { location, message: locationMessage };
      this.emit("actionCompleted", action);
      return action;
    } catch (error) {
      action.status = "failed";
      action.data = { error: error.message };
      this.emit("actionFailed", action);
      throw error;
    }
  }

  // Activate safe mode (disable panic mode, send all-clear)
  public async activateSafeMode(): Promise<PanicModeAction> {
    if (!this.currentSession?.isActive) {
      throw new Error("No active panic mode session");
    }

    const action: PanicModeAction = {
      id: `action_${Date.now()}`,
      type: "safe_mode",
      status: "in_progress",
      timestamp: new Date(),
    };

    this.currentSession.actions.push(action);

    try {
      const safeMessage = `✅ ALL CLEAR: I am now safe. Thank you for your concern. Previous emergency alert can be disregarded. - Time: ${new Date().toLocaleString()}`;

      await this.sendAlert(safeMessage);

      action.status = "completed";
      action.data = { message: safeMessage };

      // Stop panic mode after sending safe message
      setTimeout(() => this.stopPanicMode(), 1000);

      this.emit("actionCompleted", action);
      return action;
    } catch (error) {
      action.status = "failed";
      action.data = { error: error.message };
      this.emit("actionFailed", action);
      throw error;
    }
  }

  // Get current session
  public getCurrentSession(): PanicModeSession | null {
    return this.currentSession;
  }

  // Check if panic mode is active
  public isActive(): boolean {
    return this.currentSession?.isActive || false;
  }

  // Private helper methods
  private async getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }

  private startLocationTracking(): void {
    if (!navigator.geolocation) return;

    this.locationWatcher = navigator.geolocation.watchPosition(
      (position) => {
        if (this.currentSession?.isActive) {
          this.currentSession.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          this.emit("locationUpdated", this.currentSession.location);
        }
      },
      (error) => console.warn("Location tracking error:", error),
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 },
    );
  }

  private stopLocationTracking(): void {
    if (this.locationWatcher !== null) {
      navigator.geolocation.clearWatch(this.locationWatcher);
      this.locationWatcher = null;
    }
  }

  private async sendAlert(message: string): Promise<void> {
    // Try native sharing first
    if (navigator.share) {
      try {
        await navigator.share({
          title: "🚨 EMERGENCY ALERT",
          text: message,
        });
        return;
      } catch (error) {
        console.log("Native share failed, trying clipboard");
      }
    }

    // Fallback to clipboard
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = message;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    } catch (error) {
      // Last resort - show alert
      alert(`Emergency message (please copy and send manually):\n\n${message}`);
    }
  }
}

// Create singleton instance
export const panicModeService = new PanicModeService();

// React hook for panic mode
export function usePanicMode() {
  const [currentSession, setCurrentSession] = useState<PanicModeSession | null>(
    null,
  );
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handlePanicModeStarted = (session: PanicModeSession) => {
      setCurrentSession(session);
      setIsActive(true);
    };

    const handlePanicModeStopped = (session: PanicModeSession) => {
      setCurrentSession(session);
      setIsActive(false);
    };

    const handleActionCompleted = (action: PanicModeAction) => {
      setCurrentSession(panicModeService.getCurrentSession());
    };

    panicModeService.on("panicModeStarted", handlePanicModeStarted);
    panicModeService.on("panicModeStopped", handlePanicModeStopped);
    panicModeService.on("actionCompleted", handleActionCompleted);
    panicModeService.on("actionFailed", handleActionCompleted);

    // Initialize state
    setCurrentSession(panicModeService.getCurrentSession());
    setIsActive(panicModeService.isActive());

    return () => {
      panicModeService.off("panicModeStarted", handlePanicModeStarted);
      panicModeService.off("panicModeStopped", handlePanicModeStopped);
      panicModeService.off("actionCompleted", handleActionCompleted);
      panicModeService.off("actionFailed", handleActionCompleted);
    };
  }, []);

  return {
    currentSession,
    isActive,
    startPanicMode: panicModeService.startPanicMode.bind(panicModeService),
    stopPanicMode: panicModeService.stopPanicMode.bind(panicModeService),
    alertContacts: panicModeService.alertContacts.bind(panicModeService),
    startRecording: panicModeService.startRecording.bind(panicModeService),
    stopRecording: panicModeService.stopRecording.bind(panicModeService),
    callEmergencyServices:
      panicModeService.callEmergencyServices.bind(panicModeService),
    shareLocation: panicModeService.shareLocation.bind(panicModeService),
    activateSafeMode: panicModeService.activateSafeMode.bind(panicModeService),
  };
}

export default panicModeService;
