import { geminiNewsAnalysisService } from "./geminiNewsAnalysisService";

interface ThreatLevel {
  level: "low" | "medium" | "high" | "critical";
  score: number;
  confidence: number;
}

interface ThreatAlert {
  id: string;
  timestamp: number;
  location: { lat: number; lng: number };
  type: "environmental" | "behavioral" | "social" | "infrastructure";
  threat: string;
  level: ThreatLevel;
  recommendation: string;
  aiAnalysis: string;
  dismissed: boolean;
}

interface MovementPattern {
  timestamp: number;
  location: { lat: number; lng: number };
  speed: number; // km/h
  direction: number; // degrees
  accuracy: number;
}

interface BehaviorAnalysis {
  isStationary: boolean;
  averageSpeed: number;
  routeDeviation: number;
  timeInArea: number;
  patternAnomalies: string[];
}

export class AIThreatDetectionService {
  private static instance: AIThreatDetectionService;
  private isActive = false;
  private movementHistory: MovementPattern[] = [];
  private activeThreats: Map<string, ThreatAlert> = new Map();
  private callbacks: Set<(threats: ThreatAlert[]) => void> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastAnalysis: number = 0;
  private readonly ANALYSIS_COOLDOWN = 60000; // 1 minute between analyses

  static getInstance(): AIThreatDetectionService {
    if (!AIThreatDetectionService.instance) {
      AIThreatDetectionService.instance = new AIThreatDetectionService();
    }
    return AIThreatDetectionService.instance;
  }

  // Start real-time threat monitoring
  startMonitoring(): void {
    if (this.isActive) return;

    console.log("🤖 Starting AI threat detection monitoring...");
    this.isActive = true;

    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performThreatAnalysis();
    }, 30000);

    // Initial analysis
    setTimeout(() => this.performThreatAnalysis(), 1000);
  }

  // Stop monitoring
  stopMonitoring(): void {
    console.log("🛑 Stopping AI threat detection monitoring...");
    this.isActive = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Add location data for pattern analysis
  addLocationData(location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }): void {
    if (!this.isActive) return;

    const now = Date.now();
    const newPattern: MovementPattern = {
      timestamp: now,
      location: { lat: location.latitude, lng: location.longitude },
      speed: this.calculateSpeed(location),
      direction: this.calculateDirection(location),
      accuracy: location.accuracy || 10,
    };

    this.movementHistory.push(newPattern);

    // Keep only last 50 entries (roughly 25 minutes of data)
    if (this.movementHistory.length > 50) {
      this.movementHistory = this.movementHistory.slice(-50);
    }

    // Trigger immediate analysis if movement is unusual
    if (this.isUnusualMovement(newPattern)) {
      this.performThreatAnalysis();
    }
  }

  // Perform comprehensive threat analysis
  private async performThreatAnalysis(): Promise<void> {
    const now = Date.now();

    // Respect cooldown to avoid overwhelming the system
    if (now - this.lastAnalysis < this.ANALYSIS_COOLDOWN) {
      return;
    }

    this.lastAnalysis = now;

    if (this.movementHistory.length === 0) return;

    const currentLocation =
      this.movementHistory[this.movementHistory.length - 1];

    try {
      console.log("🔍 Performing AI threat analysis...");

      // Parallel analysis for efficiency
      const [
        environmentalThreats,
        behaviorThreats,
        socialThreats,
        infrastructureThreats,
      ] = await Promise.allSettled([
        this.analyzeEnvironmentalThreats(currentLocation.location),
        this.analyzeBehaviorPatterns(),
        this.analyzeSocialFactors(currentLocation.location),
        this.analyzeInfrastructureRisks(currentLocation.location),
      ]);

      // Process results and create threat alerts
      const newThreats: ThreatAlert[] = [];

      if (environmentalThreats.status === "fulfilled") {
        newThreats.push(...environmentalThreats.value);
      }
      if (behaviorThreats.status === "fulfilled") {
        newThreats.push(...behaviorThreats.value);
      }
      if (socialThreats.status === "fulfilled") {
        newThreats.push(...socialThreats.value);
      }
      if (infrastructureThreats.status === "fulfilled") {
        newThreats.push(...infrastructureThreats.value);
      }

      // Update active threats
      this.updateActiveThreats(newThreats);

      // Notify subscribers
      this.notifyCallbacks();

      console.log(
        `🎯 AI analysis complete. Found ${newThreats.length} new threats`,
      );
    } catch (error) {
      console.error("❌ Threat analysis failed:", error);
    }
  }

  // Analyze environmental threats using AI
  private async analyzeEnvironmentalThreats(location: {
    lat: number;
    lng: number;
  }): Promise<ThreatAlert[]> {
    const threats: ThreatAlert[] = [];

    try {
      const analysis = await geminiNewsAnalysisService.analyzeAreaSafety(
        location.lat,
        location.lng,
      );

      if (analysis.score < 60) {
        const threatLevel = this.scoreToThreatLevel(analysis.score);

        threats.push({
          id: `env_${Date.now()}`,
          timestamp: Date.now(),
          location,
          type: "environmental",
          threat: "Area Safety Concern",
          level: threatLevel,
          recommendation:
            analysis.factors.length > 0
              ? `Consider: ${analysis.factors[0]}`
              : "Exercise caution in this area",
          aiAnalysis: analysis.reasoning,
          dismissed: false,
        });
      }

      // Check for specific environmental factors
      if (analysis.newsEvents.some((event) => event.impact === "negative")) {
        const negativeEvent = analysis.newsEvents.find(
          (event) => event.impact === "negative",
        );
        if (negativeEvent) {
          threats.push({
            id: `news_${Date.now()}`,
            timestamp: Date.now(),
            location,
            type: "environmental",
            threat: "Recent Incident Reported",
            level: { level: "medium", score: 50, confidence: 70 },
            recommendation: "Stay informed about local conditions",
            aiAnalysis: `Recent news: ${negativeEvent.title}`,
            dismissed: false,
          });
        }
      }
    } catch (error) {
      console.warn("Environmental analysis failed:", error);
    }

    return threats;
  }

  // Analyze behavior patterns for anomalies
  private async analyzeBehaviorPatterns(): Promise<ThreatAlert[]> {
    const threats: ThreatAlert[] = [];

    if (this.movementHistory.length < 5) return threats;

    const behavior = this.calculateBehaviorAnalysis();

    // Detect concerning patterns
    if (behavior.routeDeviation > 0.8) {
      threats.push({
        id: `behavior_deviation_${Date.now()}`,
        timestamp: Date.now(),
        location:
          this.movementHistory[this.movementHistory.length - 1].location,
        type: "behavioral",
        threat: "Unusual Route Pattern",
        level: { level: "medium", score: 45, confidence: 80 },
        recommendation: "Verify you're on your intended route",
        aiAnalysis:
          "Movement pattern shows significant deviation from typical routes",
        dismissed: false,
      });
    }

    if (behavior.isStationary && behavior.timeInArea > 1800000) {
      // 30 minutes
      threats.push({
        id: `behavior_stationary_${Date.now()}`,
        timestamp: Date.now(),
        location:
          this.movementHistory[this.movementHistory.length - 1].location,
        type: "behavioral",
        threat: "Extended Stationary Period",
        level: { level: "low", score: 25, confidence: 90 },
        recommendation: "Regular check-ins recommended",
        aiAnalysis:
          "Stationary for extended period - may indicate distress or location concern",
        dismissed: false,
      });
    }

    return threats;
  }

  // Analyze social factors and crowd dynamics
  private async analyzeSocialFactors(location: {
    lat: number;
    lng: number;
  }): Promise<ThreatAlert[]> {
    const threats: ThreatAlert[] = [];
    const hour = new Date().getHours();

    // Time-based social risk analysis
    if (hour >= 22 || hour <= 5) {
      const riskScore = this.calculateNightRisk(location);

      if (riskScore > 60) {
        threats.push({
          id: `social_night_${Date.now()}`,
          timestamp: Date.now(),
          location,
          type: "social",
          threat: "Late Night High-Risk Period",
          level: { level: "high", score: riskScore, confidence: 85 },
          recommendation:
            "Stay in well-lit areas, consider alternative transport",
          aiAnalysis:
            "Reduced social activity and visibility increases risk during late hours",
          dismissed: false,
        });
      }
    }

    // Weekend evening risk
    const dayOfWeek = new Date().getDay();
    if ((dayOfWeek === 5 || dayOfWeek === 6) && hour >= 20 && hour <= 2) {
      threats.push({
        id: `social_weekend_${Date.now()}`,
        timestamp: Date.now(),
        location,
        type: "social",
        threat: "Weekend Evening Activity",
        level: { level: "medium", score: 40, confidence: 75 },
        recommendation:
          "Increased social activity - stay aware of surroundings",
        aiAnalysis:
          "Weekend evening periods show increased social dynamics and potential conflicts",
        dismissed: false,
      });
    }

    return threats;
  }

  // Analyze infrastructure and accessibility risks
  private async analyzeInfrastructureRisks(location: {
    lat: number;
    lng: number;
  }): Promise<ThreatAlert[]> {
    const threats: ThreatAlert[] = [];

    // Simulate infrastructure analysis based on location patterns
    const infraScore = this.calculateInfrastructureScore(location);

    if (infraScore < 40) {
      threats.push({
        id: `infra_${Date.now()}`,
        timestamp: Date.now(),
        location,
        type: "infrastructure",
        threat: "Poor Infrastructure Area",
        level: { level: "medium", score: 60 - infraScore, confidence: 70 },
        recommendation:
          "Limited emergency services access, poor lighting detected",
        aiAnalysis:
          "Area shows signs of inadequate infrastructure for safe navigation",
        dismissed: false,
      });
    }

    return threats;
  }

  // Helper methods
  private calculateSpeed(currentLocation: {
    latitude: number;
    longitude: number;
  }): number {
    if (this.movementHistory.length === 0) return 0;

    const lastLocation = this.movementHistory[this.movementHistory.length - 1];
    const distance = this.calculateDistance(
      lastLocation.location,
      currentLocation,
    );
    const timeElapsed = (Date.now() - lastLocation.timestamp) / 1000 / 3600; // hours

    return timeElapsed > 0 ? distance / timeElapsed : 0;
  }

  private calculateDirection(currentLocation: {
    latitude: number;
    longitude: number;
  }): number {
    if (this.movementHistory.length === 0) return 0;

    const lastLocation = this.movementHistory[this.movementHistory.length - 1];
    const lat1 = (lastLocation.location.lat * Math.PI) / 180;
    const lat2 = (currentLocation.latitude * Math.PI) / 180;
    const deltaLng =
      ((currentLocation.longitude - lastLocation.location.lng) * Math.PI) / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { latitude: number; longitude: number },
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((point2.latitude - point1.lat) * Math.PI) / 180;
    const dLng = ((point2.longitude - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private isUnusualMovement(pattern: MovementPattern): boolean {
    if (this.movementHistory.length < 3) return false;

    const recent = this.movementHistory.slice(-3);
    const avgSpeed =
      recent.reduce((sum, p) => sum + p.speed, 0) / recent.length;

    // Unusual if speed suddenly changes by more than 200%
    return (
      pattern.speed > avgSpeed * 3 ||
      (avgSpeed > 5 && pattern.speed < avgSpeed * 0.3)
    );
  }

  private calculateBehaviorAnalysis(): BehaviorAnalysis {
    if (this.movementHistory.length === 0) {
      return {
        isStationary: true,
        averageSpeed: 0,
        routeDeviation: 0,
        timeInArea: 0,
        patternAnomalies: [],
      };
    }

    const recent = this.movementHistory.slice(-10);
    const averageSpeed =
      recent.reduce((sum, p) => sum + p.speed, 0) / recent.length;
    const isStationary = averageSpeed < 1; // Less than 1 km/h

    // Calculate route deviation (simplified)
    const routeDeviation = this.calculateRouteDeviation(recent);

    // Time in current area
    const currentLocation = recent[recent.length - 1].location;
    const timeInArea = this.calculateTimeInArea(currentLocation);

    return {
      isStationary,
      averageSpeed,
      routeDeviation,
      timeInArea,
      patternAnomalies: [],
    };
  }

  private calculateRouteDeviation(points: MovementPattern[]): number {
    if (points.length < 3) return 0;

    // Simplified deviation calculation
    const directions = points.map((p) => p.direction);
    const avgDirection =
      directions.reduce((sum, d) => sum + d, 0) / directions.length;
    const deviation =
      directions.reduce((sum, d) => sum + Math.abs(d - avgDirection), 0) /
      directions.length;

    return Math.min(deviation / 180, 1); // Normalize to 0-1
  }

  private calculateTimeInArea(location: { lat: number; lng: number }): number {
    const radius = 0.001; // Roughly 100m
    let timeInArea = 0;

    for (let i = this.movementHistory.length - 1; i >= 0; i--) {
      const point = this.movementHistory[i];
      const distance = this.calculateDistance(location, {
        latitude: point.location.lat,
        longitude: point.location.lng,
      });

      if (distance <= radius) {
        timeInArea = Date.now() - point.timestamp;
      } else {
        break;
      }
    }

    return timeInArea;
  }

  private calculateNightRisk(location: { lat: number; lng: number }): number {
    // Simulate night risk based on location hash
    const hash =
      Math.abs((location.lat * 1000 + location.lng * 1000) * 789) % 100;
    return Math.min(30 + hash * 0.7, 95); // Base night risk + location factor
  }

  private calculateInfrastructureScore(location: {
    lat: number;
    lng: number;
  }): number {
    // Simulate infrastructure score
    const hash =
      Math.abs((location.lat * 500 + location.lng * 500) * 456) % 100;
    return Math.max(hash * 0.8 + 20, 5); // Generally good infrastructure with some variation
  }

  private scoreToThreatLevel(score: number): ThreatLevel {
    if (score >= 80)
      return { level: "low", score: 100 - score, confidence: 90 };
    if (score >= 60)
      return { level: "medium", score: 100 - score, confidence: 85 };
    if (score >= 40)
      return { level: "high", score: 100 - score, confidence: 80 };
    return { level: "critical", score: 100 - score, confidence: 75 };
  }

  private updateActiveThreats(newThreats: ThreatAlert[]): void {
    // Add new threats
    newThreats.forEach((threat) => {
      this.activeThreats.set(threat.id, threat);
    });

    // Remove old threats (older than 1 hour)
    const oneHourAgo = Date.now() - 3600000;
    for (const [id, threat] of this.activeThreats) {
      if (threat.timestamp < oneHourAgo || threat.dismissed) {
        this.activeThreats.delete(id);
      }
    }
  }

  // Public methods
  getActiveThreats(): ThreatAlert[] {
    return Array.from(this.activeThreats.values()).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }

  dismissThreat(threatId: string): void {
    const threat = this.activeThreats.get(threatId);
    if (threat) {
      threat.dismissed = true;
      this.activeThreats.set(threatId, threat);
      this.notifyCallbacks();
    }
  }

  subscribe(callback: (threats: ThreatAlert[]) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyCallbacks(): void {
    const threats = this.getActiveThreats();
    this.callbacks.forEach((callback) => callback(threats));
  }

  // Get monitoring status
  isMonitoring(): boolean {
    return this.isActive;
  }

  // Get analytics
  getAnalytics() {
    return {
      totalThreats: this.activeThreats.size,
      movementDataPoints: this.movementHistory.length,
      isActive: this.isActive,
      lastAnalysis: this.lastAnalysis,
      threatsByType: this.groupThreatsByType(),
    };
  }

  private groupThreatsByType() {
    const threats = this.getActiveThreats();
    return threats.reduce(
      (acc, threat) => {
        acc[threat.type] = (acc[threat.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}

export const aiThreatDetection = AIThreatDetectionService.getInstance();
export type { ThreatAlert, ThreatLevel, BehaviorAnalysis };
