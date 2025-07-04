interface CompanionMessage {
  id: string;
  timestamp: number;
  type: "guidance" | "alert" | "comfort" | "navigation" | "emergency";
  priority: "low" | "medium" | "high" | "critical";
  message: string;
  actionable: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
  context?: {
    location?: { lat: number; lng: number };
    safetyScore?: number;
    timeOfDay?: string;
    userState?: string;
  };
}

interface UserContext {
  currentLocation?: { lat: number; lng: number };
  safetyScore: number;
  isMoving: boolean;
  timeInArea: number;
  previousLocations: Array<{ lat: number; lng: number; timestamp: number }>;
  stressLevel: "low" | "medium" | "high";
  preferredCommunicationStyle: "brief" | "detailed" | "encouraging";
}

interface CompanionPersonality {
  name: string;
  style: "professional" | "friendly" | "caring" | "assertive";
  responsePatterns: {
    lowRisk: string[];
    mediumRisk: string[];
    highRisk: string[];
    emergency: string[];
  };
}

export class AICompanionService {
  private static instance: AICompanionService;
  private isActive = false;
  private userContext: UserContext = {
    safetyScore: 85,
    isMoving: false,
    timeInArea: 0,
    previousLocations: [],
    stressLevel: "low",
    preferredCommunicationStyle: "friendly",
  };
  private messages: CompanionMessage[] = [];
  private callbacks: Set<(messages: CompanionMessage[]) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private lastInteraction = 0;
  private personality: CompanionPersonality = {
    name: "Guardian AI",
    style: "caring",
    responsePatterns: {
      lowRisk: [
        "Everything looks good! You're in a safe area.",
        "Nice choice of route - this area has excellent safety ratings.",
        "Your journey is going smoothly. Stay aware and keep it up!",
        "Good visibility and foot traffic here. Perfect conditions!",
      ],
      mediumRisk: [
        "I'm keeping an eye on things. This area requires standard caution.",
        "Stay alert - moderate activity detected in this area.",
        "Consider staying on main paths here. I'll guide you if needed.",
        "Conditions are okay, but let's be extra observant.",
      ],
      highRisk: [
        "I'm concerned about this area. Let's find a safer route.",
        "High caution advised. Would you like me to find alternatives?",
        "This doesn't feel right. Trust your instincts and consider moving.",
        "I recommend avoiding this area if possible. Want me to help?",
      ],
      emergency: [
        "This is serious. I'm activating emergency protocols now.",
        "Immediate action needed. Following emergency procedures.",
        "Priority alert: Taking protective measures immediately.",
        "Emergency detected. All safety systems are now active.",
      ],
    },
  };

  static getInstance(): AICompanionService {
    if (!AICompanionService.instance) {
      AICompanionService.instance = new AICompanionService();
    }
    return AICompanionService.instance;
  }

  // Activate the AI companion
  activate(): void {
    if (this.isActive) return;

    console.log("🤖 Activating Guardian AI Companion...");
    this.isActive = true;

    // Send welcome message
    this.addMessage({
      type: "guidance",
      priority: "low",
      message:
        "Hello! I'm your Guardian AI. I'll be monitoring your safety and providing guidance. Feel free to interact with me anytime!",
      actionable: true,
      action: {
        label: "Customize Settings",
        callback: () => this.openSettings(),
      },
      context: {
        userState: "onboarding",
      },
    });

    // Start periodic check-ins
    this.checkInterval = setInterval(() => {
      this.performPeriodicCheck();
    }, 45000); // Every 45 seconds

    // Initial context assessment
    setTimeout(() => this.assessCurrentSituation(), 2000);
  }

  // Deactivate the companion
  deactivate(): void {
    console.log("🛑 Deactivating Guardian AI Companion...");
    this.isActive = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.addMessage({
      type: "guidance",
      priority: "low",
      message:
        "Guardian AI going offline. Stay safe! You can reactivate me anytime.",
      actionable: false,
    });
  }

  // Update user context
  updateContext(updates: Partial<UserContext>): void {
    this.userContext = { ...this.userContext, ...updates };

    // Track location history
    if (updates.currentLocation) {
      this.userContext.previousLocations.push({
        ...updates.currentLocation,
        timestamp: Date.now(),
      });

      // Keep only last 20 locations
      if (this.userContext.previousLocations.length > 20) {
        this.userContext.previousLocations =
          this.userContext.previousLocations.slice(-20);
      }
    }

    // Trigger reactive responses based on context changes
    this.reactToContextChanges(updates);
  }

  // Process real-time events
  processEvent(event: {
    type:
      | "location_change"
      | "safety_score_change"
      | "threat_detected"
      | "route_deviation"
      | "emergency";
    data: any;
  }): void {
    if (!this.isActive) return;

    switch (event.type) {
      case "location_change":
        this.handleLocationChange(event.data);
        break;
      case "safety_score_change":
        this.handleSafetyScoreChange(event.data);
        break;
      case "threat_detected":
        this.handleThreatDetected(event.data);
        break;
      case "route_deviation":
        this.handleRouteDeviation(event.data);
        break;
      case "emergency":
        this.handleEmergency(event.data);
        break;
    }
  }

  // Smart response generation
  private generateSmartResponse(context: {
    safetyScore: number;
    timeOfDay: string;
    isMoving: boolean;
    stressLevel: string;
  }): string {
    const { safetyScore, timeOfDay, isMoving, stressLevel } = context;

    // Select response pattern based on safety score
    let responsePool: string[];
    if (safetyScore >= 80) {
      responsePool = this.personality.responsePatterns.lowRisk;
    } else if (safetyScore >= 60) {
      responsePool = this.personality.responsePatterns.mediumRisk;
    } else if (safetyScore >= 40) {
      responsePool = this.personality.responsePatterns.highRisk;
    } else {
      responsePool = this.personality.responsePatterns.emergency;
    }

    // Add contextual modifications
    let baseResponse =
      responsePool[Math.floor(Math.random() * responsePool.length)];

    // Time-based modifications
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 5) {
      baseResponse += " Since it's late, I'm being extra vigilant.";
    } else if (hour >= 7 && hour <= 9) {
      baseResponse += " Morning commute time - generally safer.";
    }

    // Movement-based modifications
    if (!isMoving && safetyScore < 70) {
      baseResponse += " Consider moving to a more populated area.";
    }

    // Stress-level modifications
    if (stressLevel === "high") {
      baseResponse =
        "I understand you might be feeling anxious. " + baseResponse;
    }

    return baseResponse;
  }

  // Handle specific events
  private handleLocationChange(data: {
    location: { lat: number; lng: number };
    safetyScore: number;
  }): void {
    this.updateContext({
      currentLocation: data.location,
      safetyScore: data.safetyScore,
    });

    // Provide location-specific guidance
    if (data.safetyScore < 50) {
      this.addMessage({
        type: "alert",
        priority: "high",
        message: this.generateSmartResponse({
          safetyScore: data.safetyScore,
          timeOfDay: new Date().toTimeString(),
          isMoving: this.userContext.isMoving,
          stressLevel: this.userContext.stressLevel,
        }),
        actionable: true,
        action: {
          label: "Find Safer Route",
          callback: () => this.suggestSaferRoute(),
        },
        context: {
          location: data.location,
          safetyScore: data.safetyScore,
        },
      });
    }
  }

  private handleSafetyScoreChange(data: {
    oldScore: number;
    newScore: number;
  }): void {
    const { oldScore, newScore } = data;
    const improvement = newScore - oldScore;

    if (improvement > 20) {
      this.addMessage({
        type: "guidance",
        priority: "low",
        message:
          "Great improvement! You've moved to a much safer area. Well done!",
        actionable: false,
        context: { safetyScore: newScore },
      });
    } else if (improvement < -20) {
      this.addMessage({
        type: "alert",
        priority: "medium",
        message:
          "Safety conditions have declined. I recommend finding a better area or route.",
        actionable: true,
        action: {
          label: "Get Suggestions",
          callback: () => this.provideSafetyTips(),
        },
        context: { safetyScore: newScore },
      });
    }
  }

  private handleThreatDetected(data: { threat: any }): void {
    const { threat } = data;

    this.addMessage({
      type: "alert",
      priority: threat.level.level === "critical" ? "critical" : "high",
      message: `⚠️ ${threat.threat} detected. ${threat.recommendation}`,
      actionable: true,
      action: {
        label: "View Details",
        callback: () => this.showThreatDetails(threat),
      },
      context: {
        location: threat.location,
      },
    });
  }

  private handleRouteDeviation(data: { deviation: number }): void {
    if (data.deviation > 0.7) {
      this.addMessage({
        type: "navigation",
        priority: "medium",
        message:
          "I notice you've deviated from your usual route. Everything okay? I can help guide you back if needed.",
        actionable: true,
        action: {
          label: "Get Directions",
          callback: () => this.provideDirections(),
        },
      });
    }
  }

  private handleEmergency(data: any): void {
    this.addMessage({
      type: "emergency",
      priority: "critical",
      message:
        "🚨 Emergency protocols activated. I'm here to help. Stay calm and follow the guidance.",
      actionable: true,
      action: {
        label: "Emergency Options",
        callback: () => this.showEmergencyOptions(),
      },
    });
  }

  // Reactive responses to context changes
  private reactToContextChanges(updates: Partial<UserContext>): void {
    // React to stress level changes
    if (
      updates.stressLevel === "high" &&
      this.userContext.stressLevel !== "high"
    ) {
      this.addMessage({
        type: "comfort",
        priority: "medium",
        message:
          "I sense you might be feeling stressed. Remember, I'm here with you. Take a deep breath and let me help.",
        actionable: true,
        action: {
          label: "Calming Exercises",
          callback: () => this.provideCalmingGuidance(),
        },
      });
    }

    // React to prolonged stationary periods
    if (!updates.isMoving && this.userContext.timeInArea > 1800000) {
      // 30 minutes
      this.addMessage({
        type: "guidance",
        priority: "low",
        message:
          "You've been in this area for a while. Just checking in - everything alright?",
        actionable: true,
        action: {
          label: "I'm Fine",
          callback: () => this.confirmWellbeing(),
        },
      });
    }
  }

  // Periodic checks and proactive guidance
  private performPeriodicCheck(): void {
    const now = Date.now();

    // Avoid too frequent messages
    if (now - this.lastInteraction < 120000) return; // 2 minutes cooldown

    const currentHour = new Date().getHours();
    const { safetyScore, isMoving, stressLevel } = this.userContext;

    // Proactive safety checks
    if (safetyScore < 60 && isMoving) {
      this.addMessage({
        type: "guidance",
        priority: "medium",
        message:
          "I'm monitoring your route carefully. Consider well-lit, populated areas. Want me to suggest some?",
        actionable: true,
        action: {
          label: "Show Safe Areas",
          callback: () => this.showNearestSafeAreas(),
        },
      });
    }

    // Night-time extra care
    if ((currentHour >= 22 || currentHour <= 5) && safetyScore < 70) {
      this.addMessage({
        type: "guidance",
        priority: "medium",
        message:
          "It's getting late and I want to make sure you're extra safe. Stick to main roads and well-lit areas.",
        actionable: true,
        action: {
          label: "Night Safety Tips",
          callback: () => this.provideNightSafetyTips(),
        },
      });
    }

    // Positive reinforcement
    if (safetyScore >= 85 && Math.random() > 0.7) {
      this.addMessage({
        type: "guidance",
        priority: "low",
        message:
          "You're doing great! Excellent route choices. I'm proud of how safety-conscious you're being.",
        actionable: false,
      });
    }
  }

  // Assess current situation
  private assessCurrentSituation(): void {
    const { safetyScore, currentLocation } = this.userContext;
    const currentHour = new Date().getHours();

    let situationAssessment = "Analyzing your current situation... ";

    if (safetyScore >= 80) {
      situationAssessment += "You're in a very safe area! ";
    } else if (safetyScore >= 60) {
      situationAssessment += "Conditions are decent, staying alert. ";
    } else {
      situationAssessment += "I have some concerns about this area. ";
    }

    if (currentHour >= 6 && currentHour <= 18) {
      situationAssessment += "Daytime provides good visibility and activity.";
    } else {
      situationAssessment += "Evening/night requires extra caution.";
    }

    this.addMessage({
      type: "guidance",
      priority: "low",
      message: situationAssessment,
      actionable: true,
      action: {
        label: "Full Assessment",
        callback: () => this.provideFullAssessment(),
      },
    });
  }

  // Helper methods for actions
  private openSettings(): void {
    console.log("Opening AI companion settings...");
    // This would open a settings panel
  }

  private suggestSaferRoute(): void {
    console.log("Suggesting safer routes...");
    // This would integrate with navigation service
  }

  private provideSafetyTips(): void {
    this.addMessage({
      type: "guidance",
      priority: "low",
      message:
        "💡 Safety Tips: Stay in well-lit areas, trust your instincts, keep phone charged, let someone know your route, stay alert to surroundings.",
      actionable: false,
    });
  }

  private showThreatDetails(threat: any): void {
    console.log("Showing threat details:", threat);
    // This would display detailed threat information
  }

  private provideDirections(): void {
    console.log("Providing navigation directions...");
    // This would integrate with mapping service
  }

  private showEmergencyOptions(): void {
    console.log("Showing emergency options...");
    // This would display emergency contact options
  }

  private provideCalmingGuidance(): void {
    this.addMessage({
      type: "comfort",
      priority: "low",
      message:
        "🧘‍♀️ Take slow, deep breaths. Inhale for 4, hold for 4, exhale for 4. You're safe, I'm watching out for you. Focus on your surroundings and stay present.",
      actionable: true,
      action: {
        label: "More Techniques",
        callback: () => this.showMoreCalmingTechniques(),
      },
    });
  }

  private confirmWellbeing(): void {
    this.addMessage({
      type: "guidance",
      priority: "low",
      message:
        "Great to hear! I'll continue monitoring in the background. Feel free to reach out if you need anything.",
      actionable: false,
    });
  }

  private showNearestSafeAreas(): void {
    console.log("Showing nearest safe areas...");
    // This would display safe locations on map
  }

  private provideNightSafetyTips(): void {
    this.addMessage({
      type: "guidance",
      priority: "low",
      message:
        "🌙 Night Safety: Stay on main roads, avoid shortcuts, trust your instincts, have emergency contacts ready, use well-lit transport stops.",
      actionable: false,
    });
  }

  private provideFullAssessment(): void {
    const { safetyScore, currentLocation, isMoving, timeInArea } =
      this.userContext;

    const assessment = `
📊 Current Assessment:
🛡️ Safety Score: ${safetyScore}/100
📍 Location: ${currentLocation ? "Tracked" : "Unknown"}
🚶 Movement: ${isMoving ? "In transit" : "Stationary"}
⏱️ Time in area: ${Math.round(timeInArea / 60000)} minutes
🎯 AI Status: Active & monitoring
    `;

    this.addMessage({
      type: "guidance",
      priority: "low",
      message: assessment.trim(),
      actionable: false,
    });
  }

  private showMoreCalmingTechniques(): void {
    this.addMessage({
      type: "comfort",
      priority: "low",
      message:
        "🌟 Additional techniques: Ground yourself (5 things you see, 4 you hear, 3 you touch), progressive muscle relaxation, positive affirmations. Remember: you are strong and capable.",
      actionable: false,
    });
  }

  // Helper method to add messages
  private addMessage(
    messageData: Omit<CompanionMessage, "id" | "timestamp">,
  ): void {
    const message: CompanionMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...messageData,
    };

    this.messages.push(message);
    this.lastInteraction = Date.now();

    // Keep only last 50 messages
    if (this.messages.length > 50) {
      this.messages = this.messages.slice(-50);
    }

    // Notify subscribers
    this.notifyCallbacks();

    console.log(`🤖 Guardian AI: ${message.message}`);
  }

  // Public methods
  getMessages(): CompanionMessage[] {
    return [...this.messages].reverse(); // Most recent first
  }

  clearMessages(): void {
    this.messages = [];
    this.notifyCallbacks();
  }

  isActiveCompanion(): boolean {
    return this.isActive;
  }

  customizePersonality(updates: Partial<CompanionPersonality>): void {
    this.personality = { ...this.personality, ...updates };
  }

  subscribe(callback: (messages: CompanionMessage[]) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach((callback) => callback(this.getMessages()));
  }

  // User interaction methods
  askQuestion(question: string): void {
    // Simulate AI response to user questions
    setTimeout(() => {
      const responses = [
        "I'm here to help! What specific safety concerns do you have?",
        "Based on your current location and conditions, I'd recommend staying alert and following main paths.",
        "That's a great question! Let me analyze your situation and provide personalized guidance.",
        "I understand your concern. Safety is my top priority, and I'm continuously monitoring for you.",
      ];

      this.addMessage({
        type: "guidance",
        priority: "low",
        message: responses[Math.floor(Math.random() * responses.length)],
        actionable: true,
        action: {
          label: "Ask Another",
          callback: () => this.showQuestionPrompts(),
        },
      });
    }, 1500);
  }

  private showQuestionPrompts(): void {
    const prompts = [
      "What should I do if I feel unsafe?",
      "How do you calculate safety scores?",
      "What are the best routes in this area?",
      "How can I improve my safety habits?",
    ];

    console.log("Available questions:", prompts);
  }

  // Get analytics and status
  getAnalytics() {
    return {
      isActive: this.isActive,
      messageCount: this.messages.length,
      lastInteraction: this.lastInteraction,
      userContext: this.userContext,
      personality: this.personality.name,
    };
  }
}

export const aiCompanion = AICompanionService.getInstance();
export type { CompanionMessage, UserContext, CompanionPersonality };
