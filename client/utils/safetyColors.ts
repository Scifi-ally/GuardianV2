// Centralized safety color system to ensure consistency across all components

export interface SafetyColorScheme {
  score: number;
  color: string;
  bgColor: string;
  textColor: string;
  label: string;
  description: string;
}

// Standardized safety color thresholds
export const SAFETY_THRESHOLDS = {
  EXCELLENT: 85, // 85-100: Excellent safety
  GOOD: 70, // 70-84: Good safety
  MODERATE: 55, // 55-69: Moderate safety
  CAUTION: 40, // 40-54: Use caution
  DANGEROUS: 25, // 25-39: Dangerous
  CRITICAL: 0, // 0-24: Critical danger
} as const;

export const SAFETY_COLOR_SCHEME: SafetyColorScheme[] = [
  {
    score: SAFETY_THRESHOLDS.EXCELLENT,
    color: "#10b981", // emerald-500
    bgColor: "#d1fae5", // emerald-100
    textColor: "#047857", // emerald-700
    label: "Excellent",
    description: "Very safe area with excellent conditions",
  },
  {
    score: SAFETY_THRESHOLDS.GOOD,
    color: "#22c55e", // green-500
    bgColor: "#dcfce7", // green-100
    textColor: "#166534", // green-700
    label: "Good",
    description: "Safe area with good conditions",
  },
  {
    score: SAFETY_THRESHOLDS.MODERATE,
    color: "#eab308", // yellow-500
    bgColor: "#fef3c7", // yellow-100
    textColor: "#a16207", // yellow-700
    label: "Moderate",
    description: "Generally safe, stay alert",
  },
  {
    score: SAFETY_THRESHOLDS.CAUTION,
    color: "#f59e0b", // amber-500
    bgColor: "#fef3c7", // amber-100
    textColor: "#d97706", // amber-600
    label: "Caution",
    description: "Use caution in this area",
  },
  {
    score: SAFETY_THRESHOLDS.DANGEROUS,
    color: "#f97316", // orange-500
    bgColor: "#fed7aa", // orange-100
    textColor: "#ea580c", // orange-600
    label: "Dangerous",
    description: "High risk area, avoid if possible",
  },
  {
    score: SAFETY_THRESHOLDS.CRITICAL,
    color: "#ef4444", // red-500
    bgColor: "#fecaca", // red-100
    textColor: "#dc2626", // red-600
    label: "Critical",
    description: "Critical danger, immediate alternate route recommended",
  },
];

// Get safety level for a score
export function getSafetyLevel(score: number): SafetyColorScheme {
  for (let i = 0; i < SAFETY_COLOR_SCHEME.length; i++) {
    if (score >= SAFETY_COLOR_SCHEME[i].score) {
      return SAFETY_COLOR_SCHEME[i];
    }
  }
  // Default to most dangerous if score is below all thresholds
  return SAFETY_COLOR_SCHEME[SAFETY_COLOR_SCHEME.length - 1];
}

// Standardized color functions
export function getSafetyColor(score: number): string {
  return getSafetyLevel(score).color;
}

export function getSafetyBgColor(score: number): string {
  return getSafetyLevel(score).bgColor;
}

export function getSafetyTextColor(score: number): string {
  return getSafetyLevel(score).textColor;
}

export function getSafetyLabel(score: number): string {
  return getSafetyLevel(score).label;
}

export function getSafetyDescription(score: number): string {
  return getSafetyLevel(score).description;
}

// CSS class helpers for Tailwind
export function getSafetyCssClass(score: number): string {
  const level = getSafetyLevel(score);

  if (score >= SAFETY_THRESHOLDS.EXCELLENT)
    return "text-emerald-700 bg-emerald-100 border-emerald-200";
  if (score >= SAFETY_THRESHOLDS.GOOD)
    return "text-green-700 bg-green-100 border-green-200";
  if (score >= SAFETY_THRESHOLDS.MODERATE)
    return "text-yellow-700 bg-yellow-100 border-yellow-200";
  if (score >= SAFETY_THRESHOLDS.CAUTION)
    return "text-amber-600 bg-amber-100 border-amber-200";
  if (score >= SAFETY_THRESHOLDS.DANGEROUS)
    return "text-orange-600 bg-orange-100 border-orange-200";
  return "text-red-600 bg-red-100 border-red-200";
}

// Opacity for map overlays (more dangerous = more visible)
export function getSafetyOpacity(score: number): number {
  if (score >= SAFETY_THRESHOLDS.EXCELLENT) return 0.1; // Barely visible
  if (score >= SAFETY_THRESHOLDS.GOOD) return 0.15; // Light
  if (score >= SAFETY_THRESHOLDS.MODERATE) return 0.2; // Moderate
  if (score >= SAFETY_THRESHOLDS.CAUTION) return 0.3; // More visible
  if (score >= SAFETY_THRESHOLDS.DANGEROUS) return 0.4; // Quite visible
  return 0.5; // Most visible for critical areas
}

// Validate if a score indicates unsafe area
export function isUnsafeArea(score: number): boolean {
  return score < SAFETY_THRESHOLDS.MODERATE; // Below 55 is considered unsafe
}

// Get safety trend indicator
export function getSafetyTrend(
  currentScore: number,
  previousScore?: number,
): "improving" | "declining" | "stable" {
  if (!previousScore) return "stable";

  const difference = currentScore - previousScore;
  if (difference > 5) return "improving";
  if (difference < -5) return "declining";
  return "stable";
}

// Debug function to show color scheme
export function debugColorScheme(): void {
  console.group("🎨 Safety Color Scheme");
  console.table(
    SAFETY_COLOR_SCHEME.map((scheme) => ({
      threshold: `${scheme.score}+`,
      label: scheme.label,
      color: scheme.color,
      bgColor: scheme.bgColor,
      textColor: scheme.textColor,
      description: scheme.description,
    })),
  );
  console.groupEnd();
}
