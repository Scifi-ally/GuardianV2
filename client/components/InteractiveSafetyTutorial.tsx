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
  X,
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
      title: "Welcome to Guardian",
      description: "Your emergency safety guide",
      icon: Shield,
      type: "info",
    },
    {
      id: "sos-demo",
      title: "Emergency SOS",
      description: "Learn emergency alert system",
      icon: AlertTriangle,
      type: "interactive",
      component: SOSDemo,
      completionCriteria: "Try SOS button",
    },
    {
      id: "guardian-key",
      title: "Guardian Key",
      description: "Share your emergency key",
      icon: Key,
      type: "practice",
      component: GuardianKeyPractice,
      completionCriteria: "Copy your key",
    },
    {
      id: "emergency-contacts",
      title: "Emergency Contacts",
      description: "Understand priority system",
      icon: Users,
      type: "interactive",
      component: EmergencyContactsDemo,
      completionCriteria: "Learn priorities",
    },
    {
      id: "location-services",
      title: "Location Services",
      description: "Test location permissions",
      icon: MapPin,
      type: "practice",
      component: LocationServicesDemo,
      completionCriteria: "Enable location",
    },
    {
      id: "completion",
      title: "Ready to Stay Safe!",
      description: "You've mastered Guardian safety",
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
    }, 800);
  };

  const handleStepSkip = () => {
    nextStep();
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setIsStepCompleted(false);
    } else {
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
      <DialogContent className="w-[96vw] max-w-md h-[92vh] overflow-hidden p-0 bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex flex-col h-full"
        >
          {/* Compact Header */}
          <DialogHeader className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-green-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-black">
                    Guardian Safety
                  </DialogTitle>
                  <p className="text-xs text-gray-600">
                    {currentStep + 1}/{tutorialSteps.length}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={onClose}
                className="p-1 h-auto"
                size="sm"
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            </div>

            {/* Compact Progress */}
            <div className="mt-2">
              <Progress value={progress} className="h-1.5" />
            </div>
          </DialogHeader>

          {/* Compact Content */}
          <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 pb-3"
              >
                {/* Compact Step Header */}
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <div
                      className={`p-2 rounded-full ${
                        isStepCompleted ? "bg-green-100" : "bg-gray-100"
                      } transition-colors duration-300`}
                    >
                      {isStepCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <currentStepData.icon className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-black mb-1">
                      {currentStepData.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {currentStepData.description}
                    </p>
                  </div>

                  {currentStepData.completionCriteria && (
                    <Badge variant="outline" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      {currentStepData.completionCriteria}
                    </Badge>
                  )}
                </div>

                {/* Step Content */}
                <div>
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

          {/* Compact Footer */}
          <div className="px-3 py-2 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              size="sm"
              className="text-xs px-2 py-1 h-7"
            >
              Back
            </Button>

            <div className="flex space-x-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
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
                className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-2 py-1 h-7"
                size="sm"
              >
                {currentStep === tutorialSteps.length - 1 ? "Done" : "Next"}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}

            {isStepCompleted && (
              <Button
                onClick={nextStep}
                className="bg-green-600 text-white hover:bg-green-700 text-xs px-2 py-1 h-7"
                size="sm"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Continue
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// Compact default step content
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
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
      <CardContent className="p-4 text-center">
        <div className="space-y-3">
          <step.icon className="h-8 w-8 text-blue-600 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-black">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact SOS Demo Component
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
          setTimeout(onComplete, 1000);
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
    <div className="space-y-3">
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-3">
          <div className="text-center space-y-2">
            <AlertTriangle className="h-6 w-6 text-red-600 mx-auto" />
            <div>
              <h3 className="text-sm font-semibold text-black mb-1">
                Emergency SOS
              </h3>
              <p className="text-xs text-gray-600">
                Press and hold for 3 seconds to alert emergency contacts with
                your location.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-3">
        <p className="text-black font-medium text-sm">Try the SOS demo:</p>

        <div className="relative">
          <Button
            onMouseDown={startSOSDemo}
            onMouseUp={cancelDemo}
            onMouseLeave={cancelDemo}
            onTouchStart={startSOSDemo}
            onTouchEnd={cancelDemo}
            disabled={demoCompleted}
            className={`h-16 w-16 rounded-full text-white font-bold text-lg transition-all ${
              isPressed
                ? "bg-red-700 scale-110 animate-pulse"
                : demoCompleted
                  ? "bg-green-600"
                  : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {demoCompleted ? (
              <CheckCircle className="h-6 w-6" />
            ) : isPressed ? (
              countdown
            ) : (
              "SOS"
            )}
          </Button>

          {isPressed && (
            <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping" />
          )}
        </div>

        <div className="space-y-2">
          {!demoCompleted ? (
            <>
              <p className="text-xs text-gray-600">
                {isPressed
                  ? `Hold for ${countdown} more seconds...`
                  : "Press and hold the SOS button"}
              </p>
              <Button
                variant="outline"
                onClick={onSkip}
                size="sm"
                className="text-xs"
              >
                Skip Demo
              </Button>
            </>
          ) : (
            <p className="text-green-600 font-medium text-sm">
              ✓ Demo completed!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact Guardian Key Practice Component
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
        toast.success("Guardian Key copied!");
        setTimeout(onComplete, 1000);
      } else {
        toast.error("Failed to copy key");
      }
    } else {
      toast.error("No Guardian Key found");
    }
  };

  return (
    <div className="space-y-3">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3">
          <div className="text-center space-y-2">
            <Key className="h-6 w-6 text-blue-600 mx-auto" />
            <div>
              <h3 className="text-sm font-semibold text-black mb-1">
                Your Guardian Key
              </h3>
              <p className="text-xs text-gray-600">
                Share this key with trusted contacts to join their emergency
                network.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-3">
        <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
          <div className="font-mono text-sm font-bold text-black tracking-wide break-all">
            {userProfile?.guardianKey || "NO-KEY-AVAILABLE"}
          </div>
          <p className="text-xs text-gray-600 mt-1">Your Guardian Key</p>
        </div>

        <Button
          onClick={handleCopyKey}
          disabled={copied || !userProfile?.guardianKey}
          className={`${copied ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white px-4 py-2 text-sm w-full`}
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy Key
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={onSkip}
          size="sm"
          className="text-xs"
        >
          Skip
        </Button>
      </div>
    </div>
  );
}

// Compact Emergency Contacts Demo Component
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
      description: "Called immediately",
      color: "bg-red-500",
    },
    {
      level: 2,
      name: "Secondary",
      description: "Called if first doesn't respond",
      color: "bg-yellow-500",
    },
    {
      level: 3,
      name: "Backup",
      description: "Additional notification",
      color: "bg-green-500",
    },
  ];

  const handlePrioritySelect = (level: number) => {
    setSelectedPriority(level);
    setTimeout(() => {
      setUnderstood(true);
      setTimeout(onComplete, 800);
    }, 800);
  };

  return (
    <div className="space-y-3">
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-3">
          <div className="text-center space-y-2">
            <Users className="h-6 w-6 text-green-600 mx-auto" />
            <div>
              <h3 className="text-sm font-semibold text-black mb-1">
                Contact Priority
              </h3>
              <p className="text-xs text-gray-600">
                Learn how contacts are called during emergencies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-black font-medium text-center text-sm">
          Tap a priority level:
        </p>

        <div className="space-y-2">
          {priorities.map((priority) => (
            <motion.div
              key={priority.level}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  selectedPriority === priority.level
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handlePrioritySelect(priority.level)}
              >
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${priority.color}`} />
                    <div className="flex-1">
                      <div className="font-medium text-black text-sm">
                        {priority.level}. {priority.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {priority.description}
                      </div>
                    </div>
                    {selectedPriority === priority.level && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {understood && (
          <div className="text-center">
            <Badge className="bg-green-100 text-green-800 px-2 py-1 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Understood!
            </Badge>
          </div>
        )}

        <div className="text-center">
          <Button
            variant="outline"
            onClick={onSkip}
            size="sm"
            className="text-xs"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}

// Compact Location Services Demo Component
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
        throw new Error("Geolocation not supported");
      }

      // Request permission properly
      const permissionResult = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permissionResult.state === "denied") {
        throw new Error("Location permission denied");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        },
      );

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setLocationTested(true);
      toast.success("Location access granted!");
      setTimeout(onComplete, 1500);
    } catch (error) {
      console.error("Location error:", error);
      toast.error(
        "Location access denied. Please enable location permissions in your browser settings.",
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-3">
          <div className="text-center space-y-2">
            <MapPin className="h-6 w-6 text-purple-600 mx-auto" />
            <div>
              <h3 className="text-sm font-semibold text-black mb-1">
                Location Services
              </h3>
              <p className="text-xs text-gray-600">
                Essential for emergency responders to find you quickly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-3">
        <Button
          onClick={testLocation}
          disabled={locationTested || testing}
          className={`px-4 py-2 text-sm w-full ${
            locationTested
              ? "bg-green-600 hover:bg-green-700"
              : "bg-purple-600 hover:bg-purple-700"
          } text-white`}
        >
          {testing ? (
            <>
              <Clock className="h-4 w-4 mr-1 animate-spin" />
              Testing...
            </>
          ) : locationTested ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Location Verified!
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-1" />
              Test Location
            </>
          )}
        </Button>

        {location && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-2">
              <div className="text-center">
                <p className="font-medium text-green-800 mb-1 text-xs">
                  📍 Location Found!
                </p>
                <p className="text-green-600 font-mono text-xs break-all">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
                <p className="text-green-600 text-xs mt-1">
                  ✓ Will be shared during emergencies
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          variant="outline"
          onClick={onSkip}
          size="sm"
          className="text-xs"
        >
          Skip Test
        </Button>
      </div>
    </div>
  );
}
