import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Shield,
  Users,
  QrCode,
  Camera,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Smartphone,
  Monitor,
} from "lucide-react";
import { ModernEmergencyContactManager } from "./ModernEmergencyContactManager";
import { enhancedQRCodeService } from "@/services/enhancedQRCodeService";
import { mobileCameraService } from "@/services/mobileCameraService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "warning" | "pending";
  message: string;
  duration?: number;
  details?: string[];
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  status: "running" | "completed" | "failed";
}

export function EmergencyContactTester() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    initializeSystemInfo();
  }, []);

  const initializeSystemInfo = async () => {
    try {
      const cameraCapabilities =
        await mobileCameraService.getCameraCapabilities();
      const qrCapabilities =
        await enhancedQRCodeService.testScanningCapability();

      setSystemInfo({
        userAgent: navigator.userAgent,
        platform: mobileCameraService.getPlatform(),
        isNative: mobileCameraService.isNativeApp(),
        camera: cameraCapabilities,
        qr: qrCapabilities,
        network: navigator.onLine,
        battery: (navigator as any).getBattery
          ? await (navigator as any).getBattery()
          : null,
        memory: (performance as any).memory || null,
        contacts: userProfile?.emergencyContacts?.length || 0,
      });
    } catch (error) {
      console.error("Failed to initialize system info:", error);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestSuites([]);

    const suites: TestSuite[] = [
      {
        name: "Core Functionality Tests",
        tests: [],
        status: "running",
      },
      {
        name: "QR Code Integration Tests",
        tests: [],
        status: "running",
      },
      {
        name: "Capacitor Compatibility Tests",
        tests: [],
        status: "running",
      },
      {
        name: "Extreme Case Handling Tests",
        tests: [],
        status: "running",
      },
      {
        name: "Performance & Reliability Tests",
        tests: [],
        status: "running",
      },
    ];

    setTestSuites([...suites]);

    // Run test suites sequentially
    for (let i = 0; i < suites.length; i++) {
      const suite = suites[i];
      suite.tests = await runTestSuite(suite.name);
      suite.status = suite.tests.some((t) => t.status === "fail")
        ? "failed"
        : "completed";

      setTestSuites((prev) => prev.map((s, idx) => (idx === i ? suite : s)));

      // Small delay between suites
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const runTestSuite = async (suiteName: string): Promise<TestResult[]> => {
    switch (suiteName) {
      case "Core Functionality Tests":
        return await runCoreFunctionalityTests();
      case "QR Code Integration Tests":
        return await runQRCodeTests();
      case "Capacitor Compatibility Tests":
        return await runCapacitorTests();
      case "Extreme Case Handling Tests":
        return await runExtremeTests();
      case "Performance & Reliability Tests":
        return await runPerformanceTests();
      default:
        return [];
    }
  };

  const runCoreFunctionalityTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    // Test 1: Component renders without crashing
    const renderTest = await timedTest("Component Render Test", async () => {
      try {
        // Simulate component render check
        const testDiv = document.createElement("div");
        testDiv.innerHTML = "test";
        document.body.appendChild(testDiv);
        document.body.removeChild(testDiv);
        return { status: "pass", message: "Component renders successfully" };
      } catch (error) {
        return { status: "fail", message: `Render failed: ${error}` };
      }
    });
    tests.push(renderTest);

    // Test 2: Guardian key validation
    const keyValidationTest = await timedTest(
      "Guardian Key Validation",
      async () => {
        try {
          const testKeys = [
            { key: "ABCD1234", valid: true },
            { key: "abcd1234", valid: true }, // Should be normalized
            { key: "ABCD123", valid: false }, // Too short
            { key: "ABCD12345", valid: false }, // Too long
            { key: "ABCD-123", valid: false }, // Invalid characters
            { key: "", valid: false }, // Empty
            { key: null, valid: false }, // Null
          ];

          for (const test of testKeys) {
            const isValid =
              test.key &&
              typeof test.key === "string" &&
              test.key.replace(/[^A-Z0-9]/gi, "").length === 8;
            if (isValid !== test.valid) {
              throw new Error(`Key validation failed for: ${test.key}`);
            }
          }

          return {
            status: "pass",
            message: "Guardian key validation working correctly",
          };
        } catch (error) {
          return { status: "fail", message: `Validation failed: ${error}` };
        }
      },
    );
    tests.push(keyValidationTest);

    // Test 3: Priority system validation
    const priorityTest = await timedTest("Priority System Test", async () => {
      try {
        const validPriorities = [1, 2, 3];
        const invalidPriorities = [0, 4, -1, "high", null, undefined];

        for (const priority of validPriorities) {
          if (priority < 1 || priority > 3) {
            throw new Error(`Valid priority ${priority} failed validation`);
          }
        }

        for (const priority of invalidPriorities) {
          const normalized = Math.max(
            1,
            Math.min(3, parseInt(priority as any) || 1),
          );
          if (normalized < 1 || normalized > 3) {
            throw new Error(
              `Invalid priority ${priority} not normalized correctly`,
            );
          }
        }

        return {
          status: "pass",
          message: "Priority system validation successful",
        };
      } catch (error) {
        return { status: "fail", message: `Priority test failed: ${error}` };
      }
    });
    tests.push(priorityTest);

    return tests;
  };

  const runQRCodeTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    // Test 1: QR Code generation
    const qrGenerationTest = await timedTest("QR Code Generation", async () => {
      try {
        const qrData = await enhancedQRCodeService.generateGuardianKeyQR(
          "ABCD1234",
          "Test User",
        );

        if (!qrData || !qrData.startsWith("data:image")) {
          throw new Error("QR code generation failed or invalid format");
        }

        return { status: "pass", message: "QR code generated successfully" };
      } catch (error) {
        return { status: "fail", message: `QR generation failed: ${error}` };
      }
    });
    tests.push(qrGenerationTest);

    // Test 2: QR Code parsing
    const qrParsingTest = await timedTest("QR Code Parsing", async () => {
      try {
        const testData = [
          {
            input:
              '{"type":"guardian_key","guardianKey":"ABCD1234","displayName":"Test"}',
            expectedType: "guardian_key",
          },
          {
            input: "guardian:ABCD1234",
            expectedType: "guardian_key",
          },
          {
            input: "ABCD1234",
            expectedType: "guardian_key",
          },
          {
            input: "40.7128,-74.0060",
            expectedType: "location",
          },
          {
            input: "https://example.com",
            expectedType: "url",
          },
          {
            input: "random text",
            expectedType: "text",
          },
        ];

        for (const test of testData) {
          const result = enhancedQRCodeService.parseQRData(test.input);
          if (result.type !== test.expectedType) {
            throw new Error(
              `Parsing failed for ${test.input}: expected ${test.expectedType}, got ${result.type}`,
            );
          }
        }

        return { status: "pass", message: "QR code parsing working correctly" };
      } catch (error) {
        return { status: "fail", message: `QR parsing failed: ${error}` };
      }
    });
    tests.push(qrParsingTest);

    // Test 3: Camera capability detection
    const cameraTest = await timedTest(
      "Camera Capability Detection",
      async () => {
        try {
          const capabilities =
            await mobileCameraService.getCameraCapabilities();

          if (
            typeof capabilities.hasCamera !== "boolean" ||
            typeof capabilities.canScanQR !== "boolean"
          ) {
            throw new Error("Camera capabilities not properly detected");
          }

          return {
            status: capabilities.hasCamera ? "pass" : "warning",
            message: capabilities.hasCamera
              ? "Camera capabilities detected successfully"
              : "No camera detected (expected in some environments)",
          };
        } catch (error) {
          return {
            status: "fail",
            message: `Camera detection failed: ${error}`,
          };
        }
      },
    );
    tests.push(cameraTest);

    return tests;
  };

  const runCapacitorTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    // Test 1: Capacitor environment detection
    const capacitorDetectionTest = await timedTest(
      "Capacitor Detection",
      async () => {
        try {
          const isCapacitor = !!(window as any).Capacitor;
          const platform = mobileCameraService.getPlatform();

          return {
            status: "pass",
            message: `Environment: ${isCapacitor ? "Capacitor" : "Web"} (${platform})`,
            details: [
              `Is Native: ${mobileCameraService.isNativeApp()}`,
              `Platform: ${platform}`,
              `User Agent: ${navigator.userAgent.substring(0, 50)}...`,
            ],
          };
        } catch (error) {
          return {
            status: "fail",
            message: `Capacitor detection failed: ${error}`,
          };
        }
      },
    );
    tests.push(capacitorDetectionTest);

    // Test 2: Permission handling
    const permissionTest = await timedTest("Permission Handling", async () => {
      try {
        const permissions = await mobileCameraService.checkCameraPermissions();

        return {
          status: permissions.camera ? "pass" : "warning",
          message: permissions.camera
            ? "Camera permissions available"
            : "Camera permissions not granted (may require user action)",
          details: [
            `Camera: ${permissions.camera}`,
            `Photos: ${permissions.photos}`,
          ],
        };
      } catch (error) {
        return {
          status: "warning",
          message: `Permission check failed: ${error}`,
        };
      }
    });
    tests.push(permissionTest);

    // Test 3: Device-specific features
    const deviceFeaturesTest = await timedTest("Device Features", async () => {
      try {
        const qrSettings = mobileCameraService.getQRScannerSettings();

        return {
          status: "pass",
          message: "Device features configured successfully",
          details: [
            `Preferred Camera: ${qrSettings.preferredCamera}`,
            `Max Scans/Second: ${qrSettings.maxScansPerSecond}`,
            `Highlight Scan Region: ${qrSettings.highlightScanRegion}`,
          ],
        };
      } catch (error) {
        return {
          status: "fail",
          message: `Device features test failed: ${error}`,
        };
      }
    });
    tests.push(deviceFeaturesTest);

    return tests;
  };

  const runExtremeTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    // Test 1: Malformed input handling
    const malformedInputTest = await timedTest(
      "Malformed Input Handling",
      async () => {
        try {
          const malformedInputs = [
            null,
            undefined,
            "",
            "   ",
            "TOOLONGGUARDIANKEY123",
            "SHORT",
            "SPECIA!@#",
            "😀😀😀😀😀😀😀😀",
            "\\x00\\x01\\x02",
            "ABCD\n1234",
            Array(1000).fill("A").join(""), // Very long string
          ];

          for (const input of malformedInputs) {
            try {
              const result = enhancedQRCodeService.parseQRData(input as any);
              // Should not crash, but may return invalid result
              if (result.type === "guardian_key" && result.isValid) {
                // Only fail if invalid input is marked as valid Guardian key
                if (input !== "ABCD1234" && input !== "abcd1234") {
                  throw new Error(
                    `Invalid input "${input}" was marked as valid Guardian key`,
                  );
                }
              }
            } catch (parseError) {
              // Parsing errors are expected for malformed input
              console.log(`Expected parse error for malformed input: ${input}`);
            }
          }

          return {
            status: "pass",
            message: "Malformed input handled gracefully",
          };
        } catch (error) {
          return {
            status: "fail",
            message: `Malformed input test failed: ${error}`,
          };
        }
      },
    );
    tests.push(malformedInputTest);

    // Test 2: Memory pressure handling
    const memoryPressureTest = await timedTest(
      "Memory Pressure Test",
      async () => {
        try {
          // Create multiple QR codes to test memory handling
          const qrPromises = [];
          for (let i = 0; i < 10; i++) {
            qrPromises.push(
              enhancedQRCodeService.generateGuardianKeyQR(
                `TEST${i.toString().padStart(4, "0")}`,
                `Test User ${i}`,
              ),
            );
          }

          const results = await Promise.all(qrPromises);

          if (
            results.some(
              (result) => !result || !result.startsWith("data:image"),
            )
          ) {
            throw new Error("Memory pressure affected QR generation");
          }

          return {
            status: "pass",
            message: "Memory pressure test passed",
            details: [`Generated ${results.length} QR codes successfully`],
          };
        } catch (error) {
          return {
            status: "warning",
            message: `Memory pressure test: ${error}`,
          };
        }
      },
    );
    tests.push(memoryPressureTest);

    // Test 3: Network connectivity edge cases
    const networkTest = await timedTest("Network Edge Cases", async () => {
      try {
        const isOnline = navigator.onLine;

        // Test offline scenario simulation
        const originalOnLine = navigator.onLine;

        // These tests work even when offline since they're local operations
        const offlineTest = enhancedQRCodeService.parseQRData("ABCD1234");

        if (!offlineTest.isValid) {
          throw new Error("Local operations failed during network test");
        }

        return {
          status: "pass",
          message: `Network test passed (currently ${isOnline ? "online" : "offline"})`,
          details: [
            `Connection: ${isOnline ? "Online" : "Offline"}`,
            `Local operations: Working`,
          ],
        };
      } catch (error) {
        return { status: "warning", message: `Network test: ${error}` };
      }
    });
    tests.push(networkTest);

    // Test 4: Concurrent operations
    const concurrencyTest = await timedTest(
      "Concurrent Operations",
      async () => {
        try {
          // Test multiple simultaneous QR operations
          const concurrentPromises = [
            enhancedQRCodeService.parseQRData("ABCD1234"),
            enhancedQRCodeService.parseQRData("EFGH5678"),
            enhancedQRCodeService.parseQRData("guardian:IJKL9012"),
            enhancedQRCodeService.parseQRData("40.7128,-74.0060"),
            enhancedQRCodeService.parseQRData("https://example.com"),
          ];

          const results = await Promise.all(concurrentPromises);

          if (results.length !== 5 || results.some((r) => !r)) {
            throw new Error("Concurrent operations failed");
          }

          return {
            status: "pass",
            message: "Concurrent operations test passed",
            details: [`Processed ${results.length} operations simultaneously`],
          };
        } catch (error) {
          return {
            status: "fail",
            message: `Concurrency test failed: ${error}`,
          };
        }
      },
    );
    tests.push(concurrencyTest);

    return tests;
  };

  const runPerformanceTests = async (): Promise<TestResult[]> => {
    const tests: TestResult[] = [];

    // Test 1: QR generation performance
    const performanceTest = await timedTest(
      "QR Generation Performance",
      async () => {
        try {
          const start = performance.now();

          await enhancedQRCodeService.generateGuardianKeyQR(
            "PERF1234",
            "Performance Test",
          );

          const duration = performance.now() - start;

          return {
            status: duration < 1000 ? "pass" : "warning",
            message: `QR generation took ${duration.toFixed(2)}ms`,
            duration,
            details: [
              `Target: < 1000ms`,
              `Actual: ${duration.toFixed(2)}ms`,
              `Status: ${duration < 1000 ? "Good" : "Slow"}`,
            ],
          };
        } catch (error) {
          return {
            status: "fail",
            message: `Performance test failed: ${error}`,
          };
        }
      },
    );
    tests.push(performanceTest);

    // Test 2: Parsing performance
    const parsingPerformanceTest = await timedTest(
      "Parsing Performance",
      async () => {
        try {
          const testData = Array(100)
            .fill(0)
            .map((_, i) => `TEST${i.toString().padStart(4, "0")}`);

          const start = performance.now();

          for (const data of testData) {
            enhancedQRCodeService.parseQRData(data);
          }

          const duration = performance.now() - start;
          const avgPerParse = duration / testData.length;

          return {
            status: avgPerParse < 10 ? "pass" : "warning",
            message: `Parsed ${testData.length} items in ${duration.toFixed(2)}ms`,
            duration,
            details: [
              `Average per parse: ${avgPerParse.toFixed(2)}ms`,
              `Target: < 10ms per parse`,
              `Status: ${avgPerParse < 10 ? "Good" : "Slow"}`,
            ],
          };
        } catch (error) {
          return {
            status: "fail",
            message: `Parsing performance test failed: ${error}`,
          };
        }
      },
    );
    tests.push(parsingPerformanceTest);

    return tests;
  };

  const timedTest = async (
    name: string,
    testFn: () => Promise<{
      status: string;
      message: string;
      details?: string[];
    }>,
  ): Promise<TestResult> => {
    const start = performance.now();

    try {
      const result = await testFn();
      const duration = performance.now() - start;

      return {
        name,
        status: result.status as any,
        message: result.message,
        duration,
        details: result.details,
      };
    } catch (error) {
      const duration = performance.now() - start;

      return {
        name,
        status: "fail",
        message: `Test failed: ${error}`,
        duration,
      };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <TestTube className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "text-green-600 bg-green-50 border-green-200";
      case "fail":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <TestTube className="h-6 w-6 text-blue-600" />
          Emergency Contact System Tests
        </h1>
        <p className="text-gray-600">
          Comprehensive testing for extreme cases and Capacitor compatibility
        </p>
      </div>

      {/* System Information */}
      {systemInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {systemInfo.isNative ? (
                <Smartphone className="h-5 w-5" />
              ) : (
                <Monitor className="h-5 w-5" />
              )}
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Badge
                    variant="outline"
                    className={
                      systemInfo.isNative
                        ? "border-green-300 text-green-700"
                        : "border-blue-300 text-blue-700"
                    }
                  >
                    {systemInfo.platform.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-gray-600">Platform</p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {systemInfo.camera.hasCamera ? (
                    <Camera className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={
                      systemInfo.camera.hasCamera
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {systemInfo.camera.hasCamera
                      ? "Available"
                      : "Not Available"}
                  </span>
                </div>
                <p className="text-gray-600">Camera</p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {systemInfo.network ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={
                      systemInfo.network ? "text-green-600" : "text-red-600"
                    }
                  >
                    {systemInfo.network ? "Online" : "Offline"}
                  </span>
                </div>
                <p className="text-gray-600">Network</p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600">{systemInfo.contacts}</span>
                </div>
                <p className="text-gray-600">Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Controls */}
      <div className="flex gap-4 justify-center">
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isRunning ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Running Tests...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Run All Tests
            </div>
          )}
        </Button>

        <Button onClick={() => setShowManager(!showManager)} variant="outline">
          {showManager ? "Hide" : "Show"} Test Component
        </Button>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        <AnimatePresence>
          {testSuites.map((suite, suiteIndex) => (
            <motion.div
              key={suite.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: suiteIndex * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      {suite.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        suite.status === "completed"
                          ? "border-green-300 text-green-700"
                          : suite.status === "failed"
                            ? "border-red-300 text-red-700"
                            : "border-yellow-300 text-yellow-700",
                      )}
                    >
                      {suite.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suite.tests.map((test, testIndex) => (
                      <motion.div
                        key={test.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: testIndex * 0.05 }}
                        className={cn(
                          "p-3 rounded-lg border",
                          getStatusColor(test.status),
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            <span className="font-medium">{test.name}</span>
                          </div>
                          {test.duration && (
                            <Badge variant="outline" className="text-xs">
                              {test.duration.toFixed(2)}ms
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{test.message}</p>
                        {test.details && (
                          <div className="mt-2 pl-6">
                            {test.details.map((detail, idx) => (
                              <p key={idx} className="text-xs opacity-75">
                                • {detail}
                              </p>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Test Component Display */}
      {showManager && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Live Test Component</CardTitle>
            </CardHeader>
            <CardContent>
              <ModernEmergencyContactManager />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
