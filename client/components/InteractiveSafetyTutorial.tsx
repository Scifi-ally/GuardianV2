import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Key,
  Users,
  MapPin,
  Heart,
  Play,
  CheckCircle,
  AlertTriangle,
  Copy,
  Target,
  Award,
  ArrowRight,
  Info,
  Zap,
  Bell,
  Lock,
  Smartphone,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";

interface SafetyTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Shield;
  type: "info" | "interactive" | "practice" | "completion";
  component?: React.ComponentType<{
    onComplete: () => void;
    onSkip: () => void;
  }>;
  completionCriteria?: string;
}

export function InteractiveSafetyTutorial({
  isOpen,
  onClose,
}: SafetyTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isStepCompleted, setIsStepCompleted] = useState(false);
  const { currentUser, userProfile } = useAuth();

  const tutorialSteps: TutorialStep[] = [
    {
      id: "welcome",
      title: "Welcome to Guardian Safety",
      description:
        "Your complete guide to staying safe with Guardian's emergency features",
      icon: Shield,
      type: "info",
    },
    {
      id: "sos-demo",
      title: "Emergency SOS System",
      description:
        "Learn how to trigger emergency alerts that could save your life",
      icon: AlertTriangle,
      type: "interactive",
      component: SOSDemo,
      completionCriteria: "Practice the SOS button sequence",
    },
    {
      id: "guardian-key",
      title: "Your Guardian Key",
      description:
        "Share your unique key with trusted people for emergency network",
      icon: Key,
      type: "practice",
      component: GuardianKeyPractice,
      completionCriteria: "Copy your Guardian Key",
    },
    {
      id: "emergency-contacts",
      title: "Emergency Contact Network",
      description: "Build your safety network with trusted contacts",
      icon: Users,
      type: "interactive",
      component: EmergencyContactsDemo,
      completionCriteria: "Understand contact priority system",
    },
    {
      id: "location-services",
      title: "Location & Navigation",
      description: "Enable location services for accurate emergency response",
      icon: MapPin,
      type: "practice",
      component: LocationServicesDemo,
      completionCriteria: "Test location permissions",
    },
    {
      id: "safety-scenarios",
      title: "Real-World Safety Scenarios",
      description: "Practice what to do in different emergency situations",
      icon: Target,
      type: "interactive",
      component: SafetyScenarios,
      completionCriteria: "Complete 3 safety scenarios",
    },
    {
      id: "completion",
      title: "You're Ready to Stay Safe!",
      description:
        "Congratulations! You've mastered Guardian's safety features",
      icon: Award,
      type: "completion",
    },
  ];

  const currentStepData = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  const handleStepComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setIsStepCompleted(true);

    setTimeout(() => {
      nextStep();
    }, 1000);
  };

  const handleStepSkip = () => {
    nextStep();
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setIsStepCompleted(false);
    } else {
      // Tutorial completed
      toast.success(
        "🎉 Safety tutorial completed! You're now ready to use Guardian safely.",
      );
      localStorage.setItem("guardian-tutorial-completed", "true");
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsStepCompleted(false);
    }
  };

  const skipTutorial = () => {
    localStorage.setItem("guardian-tutorial-skipped", "true");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-hidden p-0 bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col h-[90vh] max-h-[90vh]"
        >
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-green-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-black">
                    Guardian Safety Tutorial
                  </DialogTitle>
                  <p className="text-sm text-gray-600">
                    Step {currentStep + 1} of {tutorialSteps.length}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={skipTutorial}
                className="text-gray-500 hover:text-gray-700 text-sm"
                size="sm"
              >
                Skip Tutorial
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 pb-6"
              >
                {/* Step Header */}
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div
                      className={`p-4 rounded-full ${
                        isStepCompleted ? "bg-green-100" : "bg-gray-100"
                      } transition-colors duration-300`}
                    >
                      {isStepCompleted ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      ) : (
                        <currentStepData.icon className="h-8 w-8 text-gray-600" />
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-black mb-2">
                      {currentStepData.title}
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      {currentStepData.description}
                    </p>
                  </div>

                  {currentStepData.completionCriteria && (
                    <Badge variant="outline" className="text-sm">
                      <Target className="h-4 w-4 mr-2" />
                      Goal: {currentStepData.completionCriteria}
                    </Badge>
                  )}
                </div>

                {/* Step Content */}
                <div className="max-w-2xl mx-auto">
                  {currentStepData.component ? (
                    <currentStepData.component
                      onComplete={handleStepComplete}
                      onSkip={handleStepSkip}
                    />
                  ) : (
                    <DefaultStepContent
                      step={currentStepData}
                      onComplete={handleStepComplete}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              size="sm"
            >
              Previous
            </Button>

            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-blue-600"
                      : completedSteps.has(index)
                        ? "bg-green-500"
                        : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {!isStepCompleted && !currentStepData.component && (
              <Button
                onClick={nextStep}
                className="bg-blue-600 text-white hover:bg-blue-700"
                size="sm"
              >
                {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {isStepCompleted && (
              <Button
                onClick={nextStep}
                className="bg-green-600 text-white hover:bg-green-700"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Continue
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// Default step content for info steps
function DefaultStepContent({
  step,
  onComplete,
}: {
  step: TutorialStep;
  onComplete: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
      <CardContent className="p-8 text-center">
        <div className="space-y-4">
          <step.icon className="h-16 w-16 text-blue-600 mx-auto" />
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-black">{step.title}</h3>
            <p className="text-gray-600">{step.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// SOS Demo Component
function SOSDemo({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const startSOSDemo = () => {
    setIsPressed(true);
    setCountdown(3);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsPressed(false);
          setDemoCompleted(true);
          toast.success("🎉 Great! You've mastered the SOS button!");
          setTimeout(onComplete, 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelDemo = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsPressed(false);
    setCountdown(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Emergency SOS Button
              </h3>
              <p className="text-gray-600">
                In a real emergency, press and hold the SOS button for 3
                seconds. This will alert all your emergency contacts with your
                location.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-6">
        <p className="text-black font-medium text-lg">
          Try the SOS button demo:
        </p>

        <div className="relative">
          <Button
            onMouseDown={startSOSDemo}
            onMouseUp={cancelDemo}
            onMouseLeave={cancelDemo}
            onTouchStart={startSOSDemo}
            onTouchEnd={cancelDemo}
            disabled={demoCompleted}
            className={`h-24 w-24 rounded-full text-white font-bold text-xl transition-all ${
              isPressed
                ? "bg-red-700 scale-110 animate-pulse"
                : demoCompleted
                  ? "bg-green-600"
                  : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {demoCompleted ? (
              <CheckCircle className="h-10 w-10" />
            ) : isPressed ? (
              countdown
            ) : (
              "SOS"
            )}
          </Button>

          {isPressed && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
          )}
        </div>

        <div className="space-y-3">
          {!demoCompleted ? (
            <>
              <p className="text-gray-600">
                {isPressed
                  ? `Hold for ${countdown} more seconds...`
                  : "Press and hold the SOS button for 3 seconds"}
              </p>
              <Button variant="outline" onClick={onSkip}>
                Skip Demo
              </Button>
            </>
          ) : (
            <p className="text-green-600 font-medium text-lg">
              ✓ Demo completed! You know how to use the SOS button.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Guardian Key Practice Component
function GuardianKeyPractice({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const { userProfile } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyKey = async () => {
    if (userProfile?.guardianKey) {
      const success = await copyToClipboard(userProfile.guardianKey);
      if (success) {
        setCopied(true);
        toast.success(
          "🎉 Guardian Key copied! You can now share it with trusted contacts.",
        );
        setTimeout(onComplete, 1500);
      } else {
        toast.error("Failed to copy key. Please try again.");
      }
    } else {
      toast.error(
        "No Guardian Key found. Please generate one in your profile.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Key className="h-12 w-12 text-blue-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Your Guardian Key
              </h3>
              <p className="text-gray-600">
                This unique key allows trusted contacts to add you to their
                emergency network. When you share this key, they'll receive your
                emergency alerts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
          <div className="font-mono text-2xl font-bold text-black tracking-widest mb-2">
            {userProfile?.guardianKey || "NO-KEY-AVAILABLE"}
          </div>
          <p className="text-sm text-gray-600">Your unique Guardian Key</p>
        </div>

        <Button
          onClick={handleCopyKey}
          disabled={copied || !userProfile?.guardianKey}
          className={`${copied ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white px-8 py-3 text-lg`}
        >
          {copied ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Copied Successfully!
            </>
          ) : (
            <>
              <Copy className="h-5 w-5 mr-2" />
              Copy Guardian Key
            </>
          )}
        </Button>

        <div className="text-gray-600 space-y-2">
          <p>Share this key with family and close friends</p>
          <Button variant="outline" onClick={onSkip}>
            Skip Practice
          </Button>
        </div>
      </div>
    </div>
  );
}

// Emergency Contacts Demo Component
function EmergencyContactsDemo({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null);
  const [understood, setUnderstood] = useState(false);

  const priorities = [
    {
      level: 1,
      name: "First Contact",
      description: "Called immediately during emergency",
      color: "bg-red-500",
      textColor: "text-red-700",
    },
    {
      level: 2,
      name: "Secondary Contact",
      description: "Called if first contact doesn't respond",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
    },
    {
      level: 3,
      name: "Backup Contact",
      description: "Additional support and notification",
      color: "bg-green-500",
      textColor: "text-green-700",
    },
  ];

  const handlePrioritySelect = (level: number) => {
    setSelectedPriority(level);
    setTimeout(() => {
      setUnderstood(true);
      toast.success("🎉 Great! You understand the priority system.");
      setTimeout(onComplete, 1000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Users className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Emergency Contact Priority
              </h3>
              <p className="text-gray-600">
                Learn how the priority system works to ensure the right people
                are contacted first during emergencies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <p className="text-black font-medium text-center text-lg">
          Click on a priority level to learn more:
        </p>

        <div className="grid gap-4">
          {priorities.map((priority) => (
            <motion.div
              key={priority.level}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  selectedPriority === priority.level
                    ? "border-blue-500 bg-blue-50 shadow-lg"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                onClick={() => handlePrioritySelect(priority.level)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full ${priority.color}`} />
                    <div className="flex-1">
                      <div className="font-medium text-black text-lg">
                        Priority {priority.level} - {priority.name}
                      </div>
                      <div className="text-gray-600">
                        {priority.description}
                      </div>
                    </div>
                    {selectedPriority === priority.level && (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {understood && (
          <div className="text-center">
            <Badge className="bg-green-100 text-green-800 px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              Priority system understood!
            </Badge>
          </div>
        )}

        <div className="text-center">
          <Button variant="outline" onClick={onSkip}>
            Skip Demo
          </Button>
        </div>
      </div>
    </div>
  );
}

// Location Services Demo Component
function LocationServicesDemo({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [locationTested, setLocationTested] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [testing, setTesting] = useState(false);

  const testLocation = async () => {
    setTesting(true);

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        },
      );

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setLocationTested(true);
      toast.success(
        "🎉 Location services are working! Your location will be shared during emergencies.",
      );
      setTimeout(onComplete, 2000);
    } catch (error) {
      console.error("Location error:", error);
      toast.error(
        "Location access denied. Please enable location permissions for emergency features.",
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <MapPin className="h-12 w-12 text-purple-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Location Services
              </h3>
              <p className="text-gray-600">
                Your location is crucial for emergency responders to find you
                quickly. Test your location services to ensure they work when
                needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-6">
        <Button
          onClick={testLocation}
          disabled={locationTested || testing}
          className={`px-8 py-3 text-lg ${
            locationTested
              ? "bg-green-600 hover:bg-green-700"
              : "bg-purple-600 hover:bg-purple-700"
          } text-white`}
        >
          {testing ? (
            <>
              <Clock className="h-5 w-5 mr-2 animate-spin" />
              Testing Location...
            </>
          ) : locationTested ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Location Verified!
            </>
          ) : (
            <>
              <MapPin className="h-5 w-5 mr-2" />
              Test Location Services
            </>
          )}
        </Button>

        {location && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="font-medium text-green-800 mb-2">
                  📍 Location Found Successfully!
                </p>
                <p className="text-green-600 font-mono text-sm">
                  Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                </p>
                <p className="text-green-600 text-sm mt-2">
                  ✓ Your location will be automatically shared during
                  emergencies
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-gray-600">
          <Button variant="outline" onClick={onSkip}>
            Skip Test
          </Button>
        </div>
      </div>
    </div>
  );
}

// Safety Scenarios Component
function SafetyScenarios({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [completedScenarios, setCompletedScenarios] = useState<Set<number>>(
    new Set(),
  );
  const [currentScenario, setCurrentScenario] = useState<number | null>(null);

  const scenarios = [
    {
      id: 1,
      title: "🌙 Walking Alone at Night",
      description: "You're walking home alone and feel unsafe",
      correctAction: "Use SOS button and share location with trusted contacts",
      options: [
        "Ignore the feeling and keep walking",
        "Call 911 immediately",
        "Use Guardian SOS to alert trusted contacts",
        "Run to the nearest building",
      ],
      correctIndex: 2,
      explanation:
        "Guardian SOS alerts your trusted network immediately while keeping you connected to help.",
    },
    {
      id: 2,
      title: "🚗 Car Breakdown",
      description: "Your car breaks down on a highway",
      correctAction: "Send location to emergency contacts and call for help",
      options: [
        "Wait for someone to stop and help",
        "Start walking to find help",
        "Use Guardian to share location and call roadside assistance",
        "Try to fix the car yourself",
      ],
      correctIndex: 2,
      explanation:
        "Sharing your location ensures help can find you quickly and safely.",
    },
    {
      id: 3,
      title: "🚑 Medical Emergency",
      description: "Someone near you is having a medical emergency",
      correctAction: "Call 911 and use Guardian to notify your network",
      options: [
        "Try to help them yourself",
        "Call 911 and alert your Guardian network",
        "Ask other people for help",
        "Take them to the hospital yourself",
      ],
      correctIndex: 1,
      explanation:
        "Professional medical help is essential, and notifying your network keeps you safe too.",
    },
  ];

  const handleAnswerSelect = (scenarioId: number, selectedIndex: number) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (scenario && selectedIndex === scenario.correctIndex) {
      setCompletedScenarios((prev) => new Set([...prev, scenarioId]));
      toast.success("🎉 Correct! " + scenario.explanation);

      if (completedScenarios.size + 1 >= 3) {
        setTimeout(onComplete, 1500);
      }
    } else {
      toast.error(
        "Not the best choice. Think about the safest option and try again!",
      );
    }
    setCurrentScenario(null);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Target className="h-12 w-12 text-orange-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Safety Scenarios
              </h3>
              <p className="text-gray-600">
                Practice making the right decisions in emergency situations.
                Complete all scenarios to master safety protocols.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mb-4">
        <Badge variant="outline" className="px-4 py-2">
          {completedScenarios.size} / 3 scenarios completed
        </Badge>
      </div>

      <div className="grid gap-4">
        {scenarios.map((scenario) => (
          <Card
            key={scenario.id}
            className={`transition-all ${
              completedScenarios.has(scenario.id)
                ? "border-green-500 bg-green-50 shadow-lg"
                : currentScenario === scenario.id
                  ? "border-blue-500 bg-blue-50 shadow-lg"
                  : "border-gray-200 hover:shadow-md"
            }`}
          >
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-black text-lg">
                      {scenario.title}
                    </h4>
                    <p className="text-gray-600 mt-1">{scenario.description}</p>
                  </div>
                  {completedScenarios.has(scenario.id) && (
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 ml-2" />
                  )}
                </div>

                {currentScenario === scenario.id ? (
                  <div className="space-y-3">
                    <p className="font-medium text-black">
                      What should you do?
                    </p>
                    {scenario.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => handleAnswerSelect(scenario.id, index)}
                        className="w-full text-left justify-start p-3 h-auto text-sm"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                ) : !completedScenarios.has(scenario.id) ? (
                  <Button
                    onClick={() => setCurrentScenario(scenario.id)}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Practice This Scenario
                  </Button>
                ) : (
                  <div className="text-green-600 font-medium bg-green-100 p-3 rounded-lg">
                    ✓ Completed: {scenario.correctAction}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {completedScenarios.size < 3 && (
        <div className="text-center">
          <Button variant="outline" onClick={onSkip}>
            Skip Scenarios
          </Button>
        </div>
      )}
    </div>
  );
}
