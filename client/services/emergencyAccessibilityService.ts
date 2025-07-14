import { unifiedNotifications } from "./unifiedNotificationService";

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  voiceControl: boolean;
  reducedMotion: boolean;
  emergencyMode: boolean;
  colorBlindFriendly: boolean;
  oneHandedMode: boolean;
}

class EmergencyAccessibilityService {
  private settings: AccessibilitySettings = {
    highContrast: false,
    largeText: false,
    screenReader: false,
    voiceControl: false,
    reducedMotion: false,
    emergencyMode: false,
    colorBlindFriendly: false,
    oneHandedMode: false,
  };

  private speechSynthesis: SpeechSynthesis | null = null;
  private speechRecognition: any = null;
  private isListening = false;

  constructor() {
    this.initializeAccessibility();
    this.detectUserPreferences();
    this.setupVoiceCommands();
    this.setupEmergencyAnnouncements();
  }

  private initializeAccessibility() {
    // Check for system accessibility preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.enableReducedMotion();
    }

    if (window.matchMedia("(prefers-contrast: high)").matches) {
      this.enableHighContrast();
    }

    // Initialize speech synthesis
    if ("speechSynthesis" in window) {
      this.speechSynthesis = window.speechSynthesis;
    }

    // Initialize speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      this.setupSpeechRecognition();
    }

    // Load saved settings
    this.loadSettings();
  }

  private detectUserPreferences() {
    // Detect if user might need accessibility features
    const userAgent = navigator.userAgent.toLowerCase();

    // Check for screen reader indicators
    if (
      userAgent.includes("nvda") ||
      userAgent.includes("jaws") ||
      userAgent.includes("voiceover")
    ) {
      this.enableScreenReaderMode();
    }

    // Check for mobile devices (might need larger touch targets)
    if (
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      )
    ) {
      this.optimizeForTouch();
    }
  }

  private setupSpeechRecognition() {
    if (!this.speechRecognition) return;

    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = false;
    this.speechRecognition.lang = "en-US";

    this.speechRecognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();

      this.processVoiceCommand(command);
    };

    this.speechRecognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        this.speak("I didn't hear anything. Please try again.");
      }
    };
  }

  private setupVoiceCommands() {
    // Emergency voice commands
    const commands = {
      emergency: () => this.triggerEmergencyProtocol(),
      help: () => this.announceHelpOptions(),
      location: () => this.announceLocation(),
      contacts: () => this.announceEmergencyContacts(),
      "call 911": () => window.open("tel:911", "_self"),
      "send sos": () => this.sendVoiceEmergencySOS(),
      repeat: () => this.repeatLastAnnouncement(),
      louder: () => this.increaseSpeechVolume(),
      quieter: () => this.decreaseSpeechVolume(),
      stop: () => this.stopSpeech(),
      "navigate home": () => this.navigateToLocation("home"),
      "where am i": () => this.announceCurrentLocation(),
    };

    // Store commands for processing
    (this as any).voiceCommands = commands;
  }

  private setupEmergencyAnnouncements() {
    // Listen for emergency events
    window.addEventListener("emergency-activated", () => {
      this.announceEmergency();
    });

    window.addEventListener("location-found", (event: any) => {
      this.announceLocationFound(event.detail);
    });

    window.addEventListener("sos-sent", () => {
      this.announceSOS();
    });
  }

  public enableEmergencyAccessibilityMode() {
    this.settings.emergencyMode = true;

    // Enable all accessibility features for emergency
    this.enableHighContrast();
    this.enableLargeText();
    this.enableVoiceControl();
    this.enableScreenReaderMode();

    // Apply emergency accessibility styles
    document.body.classList.add("emergency-accessibility-mode");

    // Make all clickable elements larger and more accessible
    this.enhanceEmergencyInteraction();

    // Start voice announcements
    this.speak(
      "Emergency accessibility mode activated. You can use voice commands like 'call 911', 'send SOS', or 'help' for assistance.",
    );

    unifiedNotifications.success("🔊 Voice Control Active", {
      message: "Say 'help' for voice commands",
    });
  }

  private enhanceEmergencyInteraction() {
    // Add emergency focus indicators
    const style = document.createElement("style");
    style.textContent = `
      .emergency-accessibility-mode *:focus {
        outline: 4px solid #ff0000 !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 0 8px rgba(255, 0, 0, 0.3) !important;
      }

      .emergency-accessibility-mode button,
      .emergency-accessibility-mode [role="button"] {
        min-height: 48px !important;
        min-width: 48px !important;
        font-size: 18px !important;
        padding: 12px !important;
        border: 3px solid currentColor !important;
      }

      .emergency-accessibility-mode .sos-button,
      .emergency-accessibility-mode [data-emergency="true"] {
        font-size: 24px !important;
        min-height: 60px !important;
        font-weight: bold !important;
        animation: emergency-pulse 1s infinite !important;
      }

      @keyframes emergency-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);
  }

  public enableHighContrast() {
    this.settings.highContrast = true;
    document.body.classList.add("high-contrast-mode");

    const style = document.createElement("style");
    style.textContent = `
      .high-contrast-mode {
        filter: contrast(150%) !important;
      }
      .high-contrast-mode * {
        border-color: currentColor !important;
      }
    `;
    document.head.appendChild(style);
  }

  public enableLargeText() {
    this.settings.largeText = true;
    document.body.classList.add("large-text-mode");

    const style = document.createElement("style");
    style.textContent = `
      .large-text-mode {
        font-size: 120% !important;
      }
      .large-text-mode h1 { font-size: 2.5rem !important; }
      .large-text-mode h2 { font-size: 2rem !important; }
      .large-text-mode h3 { font-size: 1.75rem !important; }
      .large-text-mode button { font-size: 1.25rem !important; }
    `;
    document.head.appendChild(style);
  }

  public enableScreenReaderMode() {
    this.settings.screenReader = true;

    // Add ARIA labels to important elements
    this.enhanceARIALabels();

    // Announce page changes
    this.announcePageContext();
  }

  private enhanceARIALabels() {
    // Add comprehensive ARIA labels for emergency features
    const sosButtons = document.querySelectorAll(
      '[data-emergency="true"], .sos-button',
    );
    sosButtons.forEach((button) => {
      button.setAttribute(
        "aria-label",
        "Emergency SOS button - activates emergency protocols",
      );
      button.setAttribute("role", "button");
    });

    const navButtons = document.querySelectorAll(
      "nav button, [role='navigation'] button",
    );
    navButtons.forEach((button, index) => {
      if (!button.getAttribute("aria-label")) {
        button.setAttribute("aria-label", `Navigation button ${index + 1}`);
      }
    });

    // Add landmarks
    const main = document.querySelector("main");
    if (main) {
      main.setAttribute("role", "main");
      main.setAttribute("aria-label", "Main application content");
    }
  }

  public enableVoiceControl() {
    this.settings.voiceControl = true;

    if (this.speechRecognition) {
      this.startVoiceRecognition();
    } else {
      this.speak("Voice recognition is not available on this device.");
    }
  }

  public enableReducedMotion() {
    this.settings.reducedMotion = true;
    document.body.classList.add("reduced-motion-mode");

    const style = document.createElement("style");
    style.textContent = `
      .reduced-motion-mode *,
      .reduced-motion-mode *::before,
      .reduced-motion-mode *::after {
        animation-duration: 0.1s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.1s !important;
      }
    `;
    document.head.appendChild(style);
  }

  private startVoiceRecognition() {
    if (!this.speechRecognition || this.isListening) return;

    try {
      this.speechRecognition.start();
      this.isListening = true;

      // Visual indicator
      const indicator = document.createElement("div");
      indicator.id = "voice-indicator";
      indicator.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #16a34a; color: white; padding: 8px 12px;
        border-radius: 20px; font-size: 12px; font-weight: bold;
        animation: pulse 1s infinite;
      `;
      indicator.textContent = "🎤 Listening...";
      document.body.appendChild(indicator);

      this.speak(
        "Voice control is now active. Say 'help' for available commands.",
      );
    } catch (error) {
      console.error("Failed to start voice recognition:", error);
      this.speak("Voice control is not available.");
    }
  }

  private processVoiceCommand(command: string) {
    console.log("Voice command received:", command);

    const commands = (this as any).voiceCommands;

    // Check for exact matches first
    if (commands[command]) {
      commands[command]();
      return;
    }

    // Check for partial matches
    for (const [key, action] of Object.entries(commands)) {
      if (command.includes(key)) {
        (action as Function)();
        return;
      }
    }

    // No command found
    this.speak(
      `I didn't recognize the command "${command}". Say "help" for available commands.`,
    );
  }

  private triggerEmergencyProtocol() {
    this.speak("Emergency protocol activated. Calling emergency services.");
    window.dispatchEvent(new CustomEvent("emergency-voice-activated"));
    window.open("tel:911", "_self");
  }

  private announceHelpOptions() {
    const helpText = `
      Available voice commands:
      Say "emergency" to call 911.
      Say "help" to hear this again.
      Say "location" to hear your current location.
      Say "send SOS" to alert emergency contacts.
      Say "where am I" to announce your location.
      Say "louder" or "quieter" to adjust volume.
      Say "stop" to stop speaking.
    `;

    this.speak(helpText);
  }

  private announceLocation() {
    const location = localStorage.getItem("lastKnownLocation");
    if (location) {
      try {
        const loc = JSON.parse(location);
        this.speak(
          `Your current location is latitude ${loc.latitude.toFixed(4)}, longitude ${loc.longitude.toFixed(4)}.`,
        );
      } catch (e) {
        this.speak("Location information is not available.");
      }
    } else {
      this.speak("Your location is not currently available.");
    }
  }

  private announceEmergencyContacts() {
    const contacts = localStorage.getItem("emergencyContacts");
    if (contacts) {
      try {
        const contactList = JSON.parse(contacts);
        if (contactList.length > 0) {
          this.speak(
            `You have ${contactList.length} emergency contacts configured.`,
          );
        } else {
          this.speak(
            "No emergency contacts are configured. Please add contacts in settings.",
          );
        }
      } catch (e) {
        this.speak("Emergency contact information is not available.");
      }
    } else {
      this.speak("No emergency contacts are configured.");
    }
  }

  private sendVoiceEmergencySOS() {
    this.speak("Sending emergency SOS message to your contacts.");
    window.dispatchEvent(new CustomEvent("voice-sos-activated"));
  }

  private announceEmergency() {
    this.speak("Emergency mode activated. Help is on the way. Stay calm.");
  }

  private announceLocationFound(location: any) {
    this.speak(
      `Location found. You are at ${location.address || "your current position"}.`,
    );
  }

  private announceSOS() {
    this.speak("Emergency SOS sent to your contacts. Help has been notified.");
  }

  private announceCurrentLocation() {
    this.announceLocation();
  }

  private announcePageContext() {
    const title = document.title;
    if (title) {
      this.speak(`You are on the ${title} page.`);
    }
  }

  public speak(text: string, urgent = false) {
    if (!this.speechSynthesis) {
      console.log("Speech synthesis not available:", text);
      return;
    }

    // Stop current speech if urgent
    if (urgent) {
      this.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = urgent ? 1.2 : 1.0;
    utterance.pitch = urgent ? 1.2 : 1.0;
    utterance.volume = urgent ? 1.0 : 0.8;

    // Store last announcement for repeat function
    (this as any).lastAnnouncement = text;

    this.speechSynthesis.speak(utterance);
  }

  private repeatLastAnnouncement() {
    const lastAnnouncement = (this as any).lastAnnouncement;
    if (lastAnnouncement) {
      this.speak(lastAnnouncement);
    } else {
      this.speak("No previous announcement to repeat.");
    }
  }

  private increaseSpeechVolume() {
    // This would adjust speech volume if supported
    this.speak("Volume increased.", true);
  }

  private decreaseSpeechVolume() {
    this.speak("Volume decreased.");
  }

  private stopSpeech() {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }

  private optimizeForTouch() {
    document.body.classList.add("touch-optimized");

    const style = document.createElement("style");
    style.textContent = `
      .touch-optimized button,
      .touch-optimized [role="button"],
      .touch-optimized a {
        min-height: 44px !important;
        min-width: 44px !important;
        padding: 12px !important;
      }
      
      .touch-optimized .sos-button,
      .touch-optimized [data-emergency="true"] {
        min-height: 60px !important;
        min-width: 60px !important;
        padding: 16px !important;
      }
    `;
    document.head.appendChild(style);
  }

  private navigateToLocation(location: string) {
    this.speak(`Navigating to ${location}.`);
    // This would trigger navigation to a saved location
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem("accessibilitySettings");
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
        this.applySettings();
      }
    } catch (e) {
      console.error("Failed to load accessibility settings:", e);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(
        "accessibilitySettings",
        JSON.stringify(this.settings),
      );
    } catch (e) {
      console.error("Failed to save accessibility settings:", e);
    }
  }

  private applySettings() {
    if (this.settings.highContrast) this.enableHighContrast();
    if (this.settings.largeText) this.enableLargeText();
    if (this.settings.reducedMotion) this.enableReducedMotion();
    if (this.settings.voiceControl) this.enableVoiceControl();
    if (this.settings.screenReader) this.enableScreenReaderMode();
    if (this.settings.emergencyMode) this.enableEmergencyAccessibilityMode();
  }

  public getSettings() {
    return { ...this.settings };
  }

  public updateSetting(key: keyof AccessibilitySettings, value: boolean) {
    this.settings[key] = value;
    this.saveSettings();
    this.applySettings();
  }

  public disableAllFeatures() {
    Object.keys(this.settings).forEach((key) => {
      (this.settings as any)[key] = false;
    });

    document.body.classList.remove(
      "emergency-accessibility-mode",
      "high-contrast-mode",
      "large-text-mode",
      "reduced-motion-mode",
      "touch-optimized",
    );

    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop();
      this.isListening = false;
    }

    const indicator = document.getElementById("voice-indicator");
    if (indicator) {
      indicator.remove();
    }

    this.saveSettings();
  }
}

export const emergencyAccessibilityService =
  new EmergencyAccessibilityService();
