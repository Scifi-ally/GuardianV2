import { unifiedNotifications } from "./unifiedNotificationService";
import { enhancedLocationService } from "./enhancedLocationService";
import { emergencyBatteryService } from "./emergencyBatteryService";

interface ReadinessCheck {
  category: string;
  status: "pass" | "warning" | "critical";
  message: string;
  action?: string;
  autoFix?: () => Promise<void>;
}

interface EmergencyReadinessReport {
  overallStatus: "ready" | "warning" | "critical";
  score: number; // 0-100
  checks: ReadinessCheck[];
  recommendations: string[];
}

class EmergencyReadinessService {
  private isRunning = false;

  async performComprehensiveCheck(): Promise<EmergencyReadinessReport> {
    const checks: ReadinessCheck[] = [];

    // 1. Location Services Check
    checks.push(...(await this.checkLocationServices()));

    // 2. Emergency Contacts Check
    checks.push(...this.checkEmergencyContacts());

    // 3. Notifications Check
    checks.push(...(await this.checkNotificationPermissions()));

    // 4. Battery Status Check
    checks.push(...this.checkBatteryStatus());

    // 5. Network Connectivity Check
    checks.push(...this.checkNetworkStatus());

    // 6. Browser Support Check
    checks.push(...this.checkBrowserSupport());

    // 7. Advanced Settings Check
    checks.push(...this.checkAdvancedSettings());

    // Calculate overall status and score
    const { overallStatus, score } = this.calculateOverallStatus(checks);

    // Generate recommendations
    const recommendations = this.generateRecommendations(checks);

    return {
      overallStatus,
      score,
      checks,
      recommendations,
    };
  }

  private async checkLocationServices(): Promise<ReadinessCheck[]> {
    const checks: ReadinessCheck[] = [];

    try {
      // Check if geolocation is supported
      if (!enhancedLocationService.isSupported()) {
        checks.push({
          category: "Location Services",
          status: "critical",
          message: "Geolocation is not supported by this browser",
          action: "Use a modern browser with location support",
        });
        return checks;
      }

      // Check permission status
      const permissionStatus =
        await enhancedLocationService.getPermissionStatus();

      if (permissionStatus === "granted") {
        // Try to get current location
        try {
          const location = await enhancedLocationService.getCurrentLocation();
          if (location.accuracy > 100) {
            checks.push({
              category: "Location Services",
              status: "warning",
              message: `Location accuracy is ${Math.round(location.accuracy)}m - may not be precise enough for emergencies`,
              action: "Move to an open area or enable high-accuracy GPS",
            });
          } else {
            checks.push({
              category: "Location Services",
              status: "pass",
              message: `Location services working with ${Math.round(location.accuracy)}m accuracy`,
            });
          }
        } catch (error) {
          checks.push({
            category: "Location Services",
            status: "critical",
            message: "Cannot get current location",
            action: "Check GPS settings and move to open area",
          });
        }
      } else if (permissionStatus === "denied") {
        checks.push({
          category: "Location Services",
          status: "critical",
          message: "Location permission denied",
          action: "Enable location permission in browser settings",
        });
      } else {
        checks.push({
          category: "Location Services",
          status: "warning",
          message: "Location permission not granted",
          action: "Grant location permission for emergency features",
          autoFix: async () => {
            try {
              await enhancedLocationService.getCurrentLocation();
            } catch (error) {
              console.error("Failed to request location permission:", error);
            }
          },
        });
      }
    } catch (error) {
      checks.push({
        category: "Location Services",
        status: "critical",
        message: "Location services check failed",
        action: "Refresh page and try again",
      });
    }

    return checks;
  }

  private checkEmergencyContacts(): ReadinessCheck[] {
    const checks: ReadinessCheck[] = [];

    try {
      const userProfile = JSON.parse(
        localStorage.getItem("guardian-user-profile") || "{}",
      );
      const emergencyContacts = userProfile.emergencyContacts || [];

      if (emergencyContacts.length === 0) {
        // Downgraded from critical to warning to reduce alert noise
        checks.push({
          category: "Emergency Contacts",
          status: "warning",
          message: "Emergency contacts can be configured for additional safety",
          action: "Add emergency contacts when ready",
        });
      } else if (emergencyContacts.length === 1) {
        checks.push({
          category: "Emergency Contacts",
          status: "warning",
          message: "Only 1 emergency contact configured",
          action: "Add at least 1 more emergency contact for backup",
        });
      } else {
        // Validate contact format
        const validContacts = emergencyContacts.filter(
          (contact: any) => contact.phone && contact.phone.length >= 10,
        );

        if (validContacts.length < emergencyContacts.length) {
          checks.push({
            category: "Emergency Contacts",
            status: "warning",
            message: "Some emergency contacts have invalid phone numbers",
            action: "Update contact phone numbers",
          });
        } else {
          checks.push({
            category: "Emergency Contacts",
            status: "pass",
            message: `${emergencyContacts.length} emergency contacts configured`,
          });
        }
      }
    } catch (error) {
      checks.push({
        category: "Emergency Contacts",
        status: "critical",
        message: "Cannot access emergency contacts",
        action: "Re-configure emergency contacts",
      });
    }

    return checks;
  }

  private async checkNotificationPermissions(): Promise<ReadinessCheck[]> {
    const checks: ReadinessCheck[] = [];

    if (!("Notification" in window)) {
      checks.push({
        category: "Notifications",
        status: "warning",
        message: "Browser notifications not supported",
        action: "Update to a modern browser for better emergency alerts",
      });
      return checks;
    }

    const permission = Notification.permission;

    if (permission === "granted") {
      checks.push({
        category: "Notifications",
        status: "pass",
        message: "Notification permissions granted",
      });
    } else if (permission === "denied") {
      checks.push({
        category: "Notifications",
        status: "warning",
        message: "Notification permission denied",
        action: "Enable notifications in browser settings for emergency alerts",
      });
    } else {
      checks.push({
        category: "Notifications",
        status: "warning",
        message: "Notification permission not requested",
        action: "Grant notification permission",
        autoFix: async () => {
          try {
            await Notification.requestPermission();
          } catch (error) {
            console.error("Failed to request notification permission:", error);
          }
        },
      });
    }

    return checks;
  }

  private checkBatteryStatus(): ReadinessCheck[] {
    const checks: ReadinessCheck[] = [];

    const batteryInfo = emergencyBatteryService.getBatteryInfo();

    if (!batteryInfo) {
      checks.push({
        category: "Battery",
        status: "warning",
        message: "Battery status unavailable",
        action: "Battery monitoring not supported on this device",
      });
      return checks;
    }

    const percentage = Math.round(batteryInfo.level * 100);

    if (percentage <= 15) {
      checks.push({
        category: "Battery",
        status: "critical",
        message: `Battery critically low (${percentage}%)`,
        action: "Charge device immediately before emergency",
        autoFix: async () => {
          emergencyBatteryService.activateEmergencyPowerMode();
        },
      });
    } else if (percentage <= 25) {
      checks.push({
        category: "Battery",
        status: "warning",
        message: `Battery low (${percentage}%)`,
        action: "Consider charging device",
      });
    } else {
      checks.push({
        category: "Battery",
        status: "pass",
        message: `Battery level good (${percentage}%)`,
      });
    }

    if (!batteryInfo.charging && percentage <= 50) {
      checks.push({
        category: "Battery",
        status: "warning",
        message: "Device not charging",
        action: "Connect charger for extended emergency use",
      });
    }

    return checks;
  }

  private checkNetworkStatus(): ReadinessCheck[] {
    const checks: ReadinessCheck[] = [];

    if (!navigator.onLine) {
      checks.push({
        category: "Network",
        status: "critical",
        message: "No internet connection",
        action: "Emergency features may be limited without internet",
      });
    } else {
      // Check connection quality (if possible)
      const connection = (navigator as any).connection;
      if (connection) {
        if (
          connection.effectiveType === "slow-2g" ||
          connection.effectiveType === "2g"
        ) {
          checks.push({
            category: "Network",
            status: "warning",
            message: "Slow internet connection",
            action: "Emergency alerts may be delayed",
          });
        } else {
          checks.push({
            category: "Network",
            status: "pass",
            message: `Internet connection active (${connection.effectiveType})`,
          });
        }
      } else {
        checks.push({
          category: "Network",
          status: "pass",
          message: "Internet connection active",
        });
      }
    }

    return checks;
  }

  private checkBrowserSupport(): ReadinessCheck[] {
    const checks: ReadinessCheck[] = [];

    const features = {
      "Service Workers": "serviceWorker" in navigator,
      "Wake Lock API": "wakeLock" in navigator,
      "Vibration API": "vibrate" in navigator,
      "Camera Access": "mediaDevices" in navigator,
      "Clipboard API": "clipboard" in navigator,
    };

    const supportedFeatures = Object.entries(features).filter(
      ([, supported]) => supported,
    );
    const unsupportedFeatures = Object.entries(features).filter(
      ([, supported]) => !supported,
    );

    if (unsupportedFeatures.length === 0) {
      checks.push({
        category: "Browser Support",
        status: "pass",
        message: "All emergency features supported",
      });
    } else if (unsupportedFeatures.length <= 2) {
      checks.push({
        category: "Browser Support",
        status: "warning",
        message: `${supportedFeatures.length}/${Object.keys(features).length} emergency features supported`,
        action: `Missing: ${unsupportedFeatures.map(([name]) => name).join(", ")}`,
      });
    } else {
      checks.push({
        category: "Browser Support",
        status: "critical",
        message: "Many emergency features not supported",
        action: "Update to a modern browser for full emergency capabilities",
      });
    }

    return checks;
  }

  private checkAdvancedSettings(): ReadinessCheck[] {
    const checks: ReadinessCheck[] = [];

    try {
      const settings = JSON.parse(
        localStorage.getItem("guardian-advanced-settings") || "{}",
      );

      const criticalSettings = {
        locationTracking: settings.locationTracking !== false,
        emergencyAlerts: settings.emergencyAlerts !== false,
        autoShareLocation: settings.autoShareLocation !== false,
      };

      const disabledCritical = Object.entries(criticalSettings)
        .filter(([, enabled]) => !enabled)
        .map(([setting]) => setting);

      if (disabledCritical.length > 0) {
        checks.push({
          category: "Advanced Settings",
          status: "warning",
          message: `Critical settings disabled: ${disabledCritical.join(", ")}`,
          action: "Review advanced settings for emergency readiness",
        });
      } else {
        checks.push({
          category: "Advanced Settings",
          status: "pass",
          message: "Emergency settings configured correctly",
        });
      }
    } catch (error) {
      checks.push({
        category: "Advanced Settings",
        status: "warning",
        message: "Cannot verify advanced settings",
        action: "Check advanced settings configuration",
      });
    }

    return checks;
  }

  private calculateOverallStatus(checks: ReadinessCheck[]): {
    overallStatus: "ready" | "warning" | "critical";
    score: number;
  } {
    const criticalIssues = checks.filter(
      (check) => check.status === "critical",
    ).length;
    const warnings = checks.filter(
      (check) => check.status === "warning",
    ).length;
    const passes = checks.filter((check) => check.status === "pass").length;

    let overallStatus: "ready" | "warning" | "critical";

    if (criticalIssues > 0) {
      overallStatus = "critical";
    } else if (warnings > 0) {
      overallStatus = "warning";
    } else {
      overallStatus = "ready";
    }

    // Calculate score (0-100)
    const totalChecks = checks.length;
    const score = Math.round(
      (passes * 100 + warnings * 50 + criticalIssues * 0) / totalChecks,
    );

    return { overallStatus, score };
  }

  private generateRecommendations(checks: ReadinessCheck[]): string[] {
    const recommendations: string[] = [];

    const criticalIssues = checks.filter(
      (check) => check.status === "critical",
    );
    const warnings = checks.filter((check) => check.status === "warning");

    if (criticalIssues.length > 0) {
      recommendations.push(
        "🚨 Address critical issues immediately before relying on emergency features",
      );
      criticalIssues.forEach((issue) => {
        if (issue.action) {
          recommendations.push(`• ${issue.category}: ${issue.action}`);
        }
      });
    }

    if (warnings.length > 0) {
      recommendations.push(
        "⚠️ Consider addressing these warnings for optimal emergency readiness:",
      );
      warnings.forEach((warning) => {
        if (warning.action) {
          recommendations.push(`• ${warning.category}: ${warning.action}`);
        }
      });
    }

    // General recommendations
    recommendations.push(
      "🔧 Regular emergency readiness checks are recommended",
    );
    recommendations.push(
      "📱 Keep device charged and test emergency features periodically",
    );
    recommendations.push("👥 Verify emergency contacts can be reached");

    return recommendations;
  }

  async performAutoFixes(): Promise<void> {
    const report = await this.performComprehensiveCheck();

    const fixableIssues = report.checks.filter((check) => check.autoFix);

    if (fixableIssues.length === 0) {
      unifiedNotifications.success("No auto-fixable issues found");
      return;
    }

    unifiedNotifications.success(
      `Attempting to fix ${fixableIssues.length} issues automatically...`,
    );

    for (const issue of fixableIssues) {
      try {
        await issue.autoFix!();
        unifiedNotifications.success(`Fixed: ${issue.message}`);
      } catch (error) {
        unifiedNotifications.warning(`Could not fix: ${issue.message}`);
      }
    }
  }

  async displayReadinessReport(): Promise<void> {
    const report = await this.performComprehensiveCheck();

    const statusEmoji = {
      ready: "✅",
      warning: "⚠️",
      critical: "🚨",
    };

    unifiedNotifications.success(
      `${statusEmoji[report.overallStatus]} Emergency Readiness: ${report.score}/100`,
      {
        message: `${report.checks.filter((c) => c.status === "pass").length} checks passed, ${report.checks.filter((c) => c.status === "warning").length} warnings, ${report.checks.filter((c) => c.status === "critical").length} critical issues`,
        persistent: report.overallStatus === "critical",
      },
    );

    // Show critical issues as separate notifications
    const criticalIssues = report.checks.filter(
      (check) => check.status === "critical",
    );
    criticalIssues.forEach((issue) => {
      unifiedNotifications.critical(`🚨 Critical: ${issue.category}`, {
        message: issue.message,
        action: issue.action
          ? {
              label: "Fix",
              onClick: async () => {
                if (issue.autoFix) {
                  await issue.autoFix();
                }
              },
            }
          : undefined,
      });
    });
  }

  startPeriodicChecks(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    // Initial check
    this.performComprehensiveCheck();

    // Check every 5 minutes
    setInterval(
      () => {
        this.performComprehensiveCheck();
      },
      5 * 60 * 1000,
    );
  }

  stopPeriodicChecks(): void {
    this.isRunning = false;
  }
}

export const emergencyReadinessService = new EmergencyReadinessService();
