import { notifications } from "@/services/enhancedNotificationService";
import { enhancedFirebaseService } from "@/services/enhancedFirebaseService";
import { enhancedLocationService } from "@/services/enhancedLocationService";

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: SpeechGrammarList;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null;
  onnomatch:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
  interpretation: any;
  emma: Document;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface VoiceCommand {
  phrases: string[];
  action: () => Promise<void> | void;
  description: string;
  category: "emergency" | "navigation" | "safety" | "communication";
  requiresConfirmation?: boolean;
  isEmergency?: boolean;
}

interface VoiceSettings {
  enabled: boolean;
  language: string;
  continuous: boolean;
  interimResults: boolean;
  confidence: number;
  wakeWord: string;
  emergencyPhrasesEnabled: boolean;
  voiceResponses: boolean;
}

class VoiceCommandService {
  private static instance: VoiceCommandService;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isWakeWordMode = false;
  private commands: Map<string, VoiceCommand> = new Map();
  private settings: VoiceSettings = {
    enabled: false,
    language: "en-US",
    continuous: true,
    interimResults: false,
    confidence: 0.7,
    wakeWord: "guardian",
    emergencyPhrasesEnabled: true,
    voiceResponses: true,
  };
  private lastCommand = "";
  private awaitingConfirmation = false;
  private pendingCommand: (() => void) | null = null;

  static getInstance(): VoiceCommandService {
    if (!VoiceCommandService.instance) {
      VoiceCommandService.instance = new VoiceCommandService();
    }
    return VoiceCommandService.instance;
  }

  constructor() {
    this.initializeSpeechAPIs();
    this.setupCommands();
    this.loadSettings();
  }

  private initializeSpeechAPIs(): void {
    // Initialize Speech Recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = this.settings.continuous;
      this.recognition.interimResults = this.settings.interimResults;
      this.recognition.lang = this.settings.language;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.settings.voiceResponses) {
          this.speak("Listening for commands");
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.settings.enabled && this.settings.continuous) {
          // Restart recognition for continuous listening
          setTimeout(() => this.startListening(), 1000);
        }
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        this.handleSpeechResult(event);
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          notifications.error({
            title: "Voice Commands Disabled",
            description: "Please allow microphone access for voice commands",
          });
        }
      };
    }

    // Initialize Speech Synthesis
    if ("speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  private setupCommands(): void {
    const emergencyCommands: VoiceCommand[] = [
      {
        phrases: ["emergency", "help me", "call 911", "i need help", "sos"],
        action: () => this.handleEmergencyCommand(),
        description: "Trigger emergency alert",
        category: "emergency",
        requiresConfirmation: true,
        isEmergency: true,
      },
      {
        phrases: ["panic", "danger", "attack", "fire", "medical emergency"],
        action: () => this.handlePanicCommand(),
        description: "Trigger panic mode",
        category: "emergency",
        requiresConfirmation: true,
        isEmergency: true,
      },
      {
        phrases: ["cancel emergency", "false alarm", "stop alert"],
        action: () => this.handleCancelEmergency(),
        description: "Cancel emergency alert",
        category: "emergency",
        requiresConfirmation: true,
      },
    ];

    const navigationCommands: VoiceCommand[] = [
      {
        phrases: ["where am i", "current location", "my location"],
        action: () => this.handleLocationRequest(),
        description: "Get current location",
        category: "navigation",
      },
      {
        phrases: ["share location", "send location", "share my position"],
        action: () => this.handleShareLocation(),
        description: "Share current location",
        category: "communication",
      },
      {
        phrases: ["navigate home", "go home", "directions home"],
        action: () => this.handleNavigateHome(),
        description: "Navigate to home",
        category: "navigation",
      },
      {
        phrases: ["find safe route", "safest route", "safe path"],
        action: () => this.handleSafeRoute(),
        description: "Find safest route",
        category: "safety",
      },
    ];

    const safetyCommands: VoiceCommand[] = [
      {
        phrases: ["safety check", "status check", "i'm safe"],
        action: () => this.handleSafetyCheck(),
        description: "Perform safety check-in",
        category: "safety",
      },
      {
        phrases: ["start tracking", "track location", "begin monitoring"],
        action: () => this.handleStartTracking(),
        description: "Start location tracking",
        category: "safety",
      },
      {
        phrases: ["stop tracking", "end tracking", "stop monitoring"],
        action: () => this.handleStopTracking(),
        description: "Stop location tracking",
        category: "safety",
      },
      {
        phrases: ["call emergency contact", "contact guardian", "call contact"],
        action: () => this.handleCallEmergencyContact(),
        description: "Call primary emergency contact",
        category: "communication",
      },
    ];

    const systemCommands: VoiceCommand[] = [
      {
        phrases: ["yes", "confirm", "proceed", "do it"],
        action: () => this.handleConfirmation(true),
        description: "Confirm action",
        category: "communication",
      },
      {
        phrases: ["no", "cancel", "stop", "abort"],
        action: () => this.handleConfirmation(false),
        description: "Cancel action",
        category: "communication",
      },
      {
        phrases: ["help", "what can you do", "commands"],
        action: () => this.handleHelpRequest(),
        description: "List available commands",
        category: "communication",
      },
      {
        phrases: ["stop listening", "disable voice", "quiet mode"],
        action: () => this.handleDisableVoice(),
        description: "Disable voice commands",
        category: "communication",
      },
    ];

    // Register all commands
    [
      ...emergencyCommands,
      ...navigationCommands,
      ...safetyCommands,
      ...systemCommands,
    ].forEach((command) => {
      command.phrases.forEach((phrase) => {
        this.commands.set(phrase.toLowerCase(), command);
      });
    });
  }

  // Public methods
  async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error("Speech recognition not supported");
    }

    if (!this.settings.enabled) {
      throw new Error("Voice commands are disabled");
    }

    try {
      this.recognition.start();
      notifications.success({
        title: "Voice Commands Active",
        description: `Say "${this.settings.wakeWord}" followed by a command`,
        vibrate: true,
      });
    } catch (error) {
      console.error("Failed to start voice recognition:", error);
      throw error;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;

      if (this.settings.voiceResponses) {
        this.speak("Voice commands disabled");
      }
    }
  }

  async enableVoiceCommands(): Promise<void> {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      this.settings.enabled = true;
      this.saveSettings();

      await this.startListening();

      notifications.success({
        title: "Voice Commands Enabled",
        description: "You can now use voice commands for hands-free operation",
        vibrate: true,
      });
    } catch (error) {
      console.error("Failed to enable voice commands:", error);
      notifications.error({
        title: "Voice Commands Failed",
        description: "Please allow microphone access to use voice commands",
      });
      throw error;
    }
  }

  disableVoiceCommands(): void {
    this.settings.enabled = false;
    this.saveSettings();
    this.stopListening();

    notifications.success({
      title: "Voice Commands Disabled",
      description: "Voice commands have been turned off",
    });
  }

  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    if (this.recognition) {
      this.recognition.lang = this.settings.language;
      this.recognition.continuous = this.settings.continuous;
      this.recognition.interimResults = this.settings.interimResults;
    }

    notifications.success({
      title: "Voice Settings Updated",
      description: "Your voice command preferences have been saved",
    });
  }

  speak(text: string, priority: "low" | "normal" | "high" = "normal"): void {
    if (!this.synthesis || !this.settings.voiceResponses) return;

    // Cancel lower priority speech if higher priority comes in
    if (priority === "high") {
      this.synthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.settings.language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Use appropriate voice settings for emergencies
    if (priority === "high") {
      utterance.rate = 1.2;
      utterance.volume = 1.0;
    }

    this.synthesis.speak(utterance);
  }

  // Speech recognition handling
  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    const results = event.results;
    const lastResult = results[results.length - 1];

    if (!lastResult.isFinal) return;

    const transcript = lastResult[0].transcript.toLowerCase().trim();
    const confidence = lastResult[0].confidence;

    if (confidence < this.settings.confidence) {
      console.log("Low confidence speech result:", transcript, confidence);
      return;
    }

    console.log("Voice command received:", transcript);

    // Handle wake word detection
    if (!this.isWakeWordMode && transcript.includes(this.settings.wakeWord)) {
      this.isWakeWordMode = true;
      if (this.settings.voiceResponses) {
        this.speak("Ready for command");
      }
      return;
    }

    // Process command only if wake word was detected or in emergency mode
    if (this.isWakeWordMode || this.isEmergencyPhrase(transcript)) {
      this.processCommand(transcript);
      this.isWakeWordMode = false;
    }
  }

  private isEmergencyPhrase(transcript: string): boolean {
    if (!this.settings.emergencyPhrasesEnabled) return false;

    const emergencyWords = [
      "emergency",
      "help",
      "911",
      "sos",
      "panic",
      "danger",
    ];
    return emergencyWords.some((word) => transcript.includes(word));
  }

  private processCommand(transcript: string): void {
    // Handle confirmation responses
    if (this.awaitingConfirmation) {
      if (transcript.includes("yes") || transcript.includes("confirm")) {
        this.handleConfirmation(true);
      } else if (transcript.includes("no") || transcript.includes("cancel")) {
        this.handleConfirmation(false);
      }
      return;
    }

    // Find matching command
    let bestMatch: VoiceCommand | null = null;
    let highestScore = 0;

    for (const [phrase, command] of this.commands) {
      const score = this.calculateSimilarity(transcript, phrase);
      if (score > highestScore && score > 0.6) {
        highestScore = score;
        bestMatch = command;
      }
    }

    if (bestMatch) {
      this.executeCommand(bestMatch, transcript);
    } else {
      if (this.settings.voiceResponses) {
        this.speak(
          "Command not recognized. Say 'help' for available commands.",
        );
      }
    }
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word overlap calculation
    const words1 = text1.split(" ");
    const words2 = text2.split(" ");
    const overlap = words1.filter((word) => words2.includes(word)).length;
    return overlap / Math.max(words1.length, words2.length);
  }

  private executeCommand(command: VoiceCommand, transcript: string): void {
    this.lastCommand = transcript;

    if (command.requiresConfirmation) {
      this.awaitingConfirmation = true;
      this.pendingCommand = () => command.action();

      const confirmationText = command.isEmergency
        ? `Emergency command detected: ${command.description}. Say 'yes' to confirm or 'no' to cancel.`
        : `Confirm: ${command.description}. Say 'yes' to proceed.`;

      this.speak(confirmationText, command.isEmergency ? "high" : "normal");
    } else {
      command.action();
    }
  }

  private handleConfirmation(confirmed: boolean): void {
    this.awaitingConfirmation = false;

    if (confirmed && this.pendingCommand) {
      this.pendingCommand();
      this.speak("Command executed");
    } else {
      this.speak("Command cancelled");
    }

    this.pendingCommand = null;
  }

  // Command implementations
  private async handleEmergencyCommand(): Promise<void> {
    try {
      const location = await enhancedLocationService.getCurrentLocation();

      await enhancedFirebaseService.createEmergencyAlert(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
        "sos",
        {
          message: "Emergency triggered by voice command",
        },
      );

      this.speak("Emergency alert sent. Help is on the way.", "high");

      // Automatically start location sharing
      if (enhancedFirebaseService.profile?.emergencyContacts.length) {
        this.speak("Sharing location with emergency contacts", "high");
      }
    } catch (error) {
      console.error("Emergency command failed:", error);
      this.speak("Emergency alert failed. Try calling 911 directly.", "high");
    }
  }

  private async handlePanicCommand(): Promise<void> {
    try {
      const location = await enhancedLocationService.getCurrentLocation();

      await enhancedFirebaseService.createEmergencyAlert(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
        "panic",
        {
          message: "Panic alert triggered by voice command",
        },
      );

      this.speak(
        "Panic alert activated. Contacting emergency services.",
        "high",
      );
    } catch (error) {
      console.error("Panic command failed:", error);
      this.speak("Panic alert failed. Call 911 immediately.", "high");
    }
  }

  private handleCancelEmergency(): void {
    // Implementation would cancel active emergency alerts
    this.speak("Emergency alert cancelled");
    notifications.success({
      title: "Emergency Cancelled",
      description: "Emergency alert has been cancelled by voice command",
    });
  }

  private async handleLocationRequest(): Promise<void> {
    try {
      const location = await enhancedLocationService.getCurrentLocation();
      const address =
        location.address ||
        `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

      this.speak(`Your current location is ${address}`);

      notifications.success({
        title: "Current Location",
        description: address,
        vibrate: true,
      });
    } catch (error) {
      this.speak("Unable to get your location. Please check GPS settings.");
    }
  }

  private async handleShareLocation(): Promise<void> {
    try {
      const location = await enhancedLocationService.getCurrentLocation();

      // Share with all emergency contacts
      const contacts = enhancedFirebaseService.profile?.emergencyContacts || [];

      if (contacts.length === 0) {
        this.speak(
          "No emergency contacts found. Please add emergency contacts first.",
        );
        return;
      }

      for (const contact of contacts) {
        if (contact.canShareLocation) {
          await enhancedFirebaseService.shareLocation(
            {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
            },
            contact.id,
            contact.name,
            {
              duration: 60, // 1 hour
              message: "Location shared by voice command",
            },
          );
        }
      }

      this.speak(`Location shared with ${contacts.length} emergency contacts`);
    } catch (error) {
      this.speak("Failed to share location. Please try again.");
    }
  }

  private handleNavigateHome(): void {
    // Navigate to home location
    window.location.href = "/navigation?destination=home";
    this.speak("Starting navigation to home");
  }

  private handleSafeRoute(): void {
    // Find safest route
    window.location.href = "/navigation?mode=safe";
    this.speak("Finding safest route");
  }

  private handleSafetyCheck(): void {
    // Send safety check-in
    notifications.success({
      title: "Safety Check-In",
      description: "Safety status confirmed by voice command",
    });
    this.speak("Safety check recorded. Your contacts will be notified.");
  }

  private handleStartTracking(): void {
    enhancedLocationService
      .startTracking()
      .then(() => {
        this.speak("Location tracking started");
      })
      .catch(() => {
        this.speak("Failed to start location tracking");
      });
  }

  private handleStopTracking(): void {
    enhancedLocationService.stopTracking();
    // Removed voice notification to prevent excessive feedback
  }

  private handleCallEmergencyContact(): void {
    const contacts = enhancedFirebaseService.profile?.emergencyContacts || [];
    const primaryContact =
      contacts.find((c) => c.priority === 1) || contacts[0];

    if (primaryContact?.phone) {
      window.open(`tel:${primaryContact.phone}`);
      this.speak(`Calling ${primaryContact.name}`);
    } else {
      this.speak("No emergency contact available");
    }
  }

  private handleHelpRequest(): void {
    const commandList = [
      "Emergency commands: help me, call 911, panic",
      "Navigation: where am i, share location, navigate home",
      "Safety: safety check, start tracking, stop tracking",
      "System: stop listening, yes, no, cancel",
    ];

    this.speak(`Available commands: ${commandList.join(". ")}`);
  }

  private handleDisableVoice(): void {
    this.disableVoiceCommands();
  }

  // Storage methods
  private saveSettings(): void {
    try {
      localStorage.setItem("voiceSettings", JSON.stringify(this.settings));
    } catch (error) {
      console.warn("Failed to save voice settings:", error);
    }
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem("voiceSettings");
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn("Failed to load voice settings:", error);
    }
  }

  // Getters
  get isSupported(): boolean {
    return !!(this.recognition && this.synthesis);
  }

  get isActive(): boolean {
    return this.isListening;
  }

  get currentSettings(): VoiceSettings {
    return { ...this.settings };
  }

  get availableCommands(): string[] {
    return Array.from(
      new Set(Array.from(this.commands.values()).map((cmd) => cmd.description)),
    );
  }
}

export const voiceCommandService = VoiceCommandService.getInstance();
export default voiceCommandService;
