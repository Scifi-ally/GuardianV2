import { useState, useEffect } from "react";
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
  AlertTriangle,
  Key,
  Users,
  MapPin,
  Phone,
  Camera,
  Mic,
  Bell,
  Lock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Pause,
  RotateCcw,
  Star,
  Heart,
  Zap,
  Eye,
  Target,
  Award,
  BookOpen,
  Lightbulb,
  Clock,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SafeMotion from "@/components/SafeMotion";

interface SafetyGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideSection {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Shield;
  color: string;
  gradient: string;
  content: GuideStep[];
  estimatedTime: number; // in minutes
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
}

interface GuideStep {
  id: string;
  title: string;
  description: string;
  type: "explanation" | "demo" | "practice" | "quiz";
  content: React.ReactNode;
  points?: number;
}

export function SafetyGuide({ isOpen, onClose }: SafetyGuideProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [userPoints, setUserPoints] = useState(0);
  const [isInteractive, setIsInteractive] = useState(false);
  const { currentUser, userProfile } = useAuth();

  const guideSections: GuideSection[] = [
    {
      id: "emergency-basics",
      title: "Emergency Basics",
      subtitle: "Master the fundamentals of emergency response",
      icon: AlertTriangle,
      color: "text-red-600",
      gradient: "from-red-50 to-orange-50",
      estimatedTime: 5,
      difficulty: "beginner",
      tags: ["SOS", "Emergency", "Basics"],
      content: [
        {
          id: "sos-intro",
          title: "Understanding SOS",
          description: "Learn when and how to use the SOS system",
          type: "explanation",
          points: 10,
          content: (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">
                    When to Use SOS
                  </h3>
                </div>
                <ul className="space-y-2 text-red-700">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Immediate physical danger
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Medical emergency
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Threatening situation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Lost in unsafe area
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">
                        DO Use SOS When
                      </h4>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• You feel genuinely unsafe</li>
                      <li>• Someone needs medical help</li>
                      <li>• You're being followed</li>
                      <li>• Natural disaster strikes</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <X className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-orange-800">
                        Avoid Using SOS For
                      </h4>
                    </div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Minor inconveniences</li>
                      <li>• Testing the system</li>
                      <li>• Non-urgent situations</li>
                      <li>• When help isn't actually needed</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          ),
        },
        {
          id: "sos-practice",
          title: "SOS Button Practice",
          description: "Practice the SOS activation sequence safely",
          type: "practice",
          points: 20,
          content: (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full mb-4">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 font-medium">
                    Practice Mode - Safe to Try
                  </span>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300">
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-24 h-24 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
                        onClick={() => {
                          // This is a safe practice mode - no real SOS triggered
                          setUserPoints((prev) => prev + 20);
                        }}
                      >
                        <span className="text-white font-bold text-sm">
                          SOS
                        </span>
                      </motion.button>
                      <motion.div
                        className="absolute inset-0 bg-red-400 rounded-full"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.7, 0, 0.7],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold">
                      Practice SOS Button
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      In a real emergency, press and hold this button for 3
                      seconds. Try it now - this is safe practice mode!
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      No Real Alert Sent
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Quick Tip</h4>
                </div>
                <p className="text-blue-700 text-sm">
                  The SOS button has a 3-second delay to prevent accidental
                  activation. In a real emergency, hold it firmly until you see
                  the confirmation.
                </p>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: "emergency-network",
      title: "Emergency Network",
      subtitle: "Build your safety network with trusted contacts",
      icon: Users,
      color: "text-blue-600",
      gradient: "from-blue-50 to-indigo-50",
      estimatedTime: 8,
      difficulty: "beginner",
      tags: ["Contacts", "Network", "Family"],
      content: [
        {
          id: "contact-types",
          title: "Understanding Contact Types",
          description: "Learn about different types of emergency contacts",
          type: "explanation",
          points: 15,
          content: (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <Heart className="h-8 w-8 text-red-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-red-800 mb-2">
                      Primary Contacts
                    </h3>
                    <p className="text-sm text-red-700">
                      Family members, spouse, or closest friends who can respond
                      immediately
                    </p>
                    <Badge className="mt-2 bg-red-600 text-white">
                      Priority 1
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-blue-800 mb-2">
                      Secondary Contacts
                    </h3>
                    <p className="text-sm text-blue-700">
                      Friends, colleagues, or neighbors who can provide backup
                      support
                    </p>
                    <Badge className="mt-2 bg-blue-600 text-white">
                      Priority 2
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-green-800 mb-2">
                      Professional Contacts
                    </h3>
                    <p className="text-sm text-green-700">
                      Healthcare providers, security, or other professional
                      helpers
                    </p>
                    <Badge className="mt-2 bg-green-600 text-white">
                      Priority 3
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">
                      Best Practice
                    </h4>
                    <p className="text-yellow-700 text-sm">
                      Have at least 3 contacts: one family member, one friend,
                      and one neighbor. Make sure they know they're your
                      emergency contact and have Guardian installed too.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "guardian-key",
          title: "Your Guardian Key",
          description: "Share your unique key to build your safety network",
          type: "practice",
          points: 25,
          content: (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-4">
                  <Key className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-700 font-medium">
                    Your Unique Guardian Key
                  </span>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Key className="h-8 w-8 text-purple-600" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {userProfile?.guardianKey || "GUARDIAN-DEMO-KEY"}
                      </h3>
                      <p className="text-gray-600">
                        Share this key with trusted contacts so they can add you
                        to their emergency network
                      </p>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (userProfile?.guardianKey) {
                            navigator.clipboard.writeText(
                              userProfile.guardianKey,
                            );
                            setUserPoints((prev) => prev + 25);
                          }
                        }}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Copy Key
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">
                    How to Share Your Key
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">
                          1
                        </span>
                      </div>
                      <span>Copy your Guardian Key</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">
                          2
                        </span>
                      </div>
                      <span>Send it to your trusted contacts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">
                          3
                        </span>
                      </div>
                      <span>Ask them to add you as an emergency contact</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Adding Others</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">
                          1
                        </span>
                      </div>
                      <span>Ask contacts for their Guardian Key</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">
                          2
                        </span>
                      </div>
                      <span>Go to Emergency Contacts in settings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">
                          3
                        </span>
                      </div>
                      <span>Add contact with their Guardian Key</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: "safety-scenarios",
      title: "Safety Scenarios",
      subtitle: "Practice decision-making in realistic situations",
      icon: Target,
      color: "text-green-600",
      gradient: "from-green-50 to-emerald-50",
      estimatedTime: 12,
      difficulty: "intermediate",
      tags: ["Scenarios", "Practice", "Decision Making"],
      content: [
        {
          id: "walking-alone",
          title: "Walking Alone at Night",
          description: "Learn how to stay safe when walking alone",
          type: "quiz",
          points: 30,
          content: (
            <ScenarioQuiz
              scenario={{
                title: "Walking Alone at Night",
                description:
                  "You're walking home alone at 11 PM. You notice someone has been following you for the past 3 blocks. What should you do?",
                options: [
                  {
                    id: "ignore",
                    text: "Ignore them and keep walking",
                    correct: false,
                  },
                  {
                    id: "confront",
                    text: "Turn around and confront them",
                    correct: false,
                  },
                  {
                    id: "safe-place",
                    text: "Go to a well-lit public place and call someone",
                    correct: true,
                  },
                  {
                    id: "run",
                    text: "Start running home as fast as possible",
                    correct: false,
                  },
                ],
                explanation:
                  "Going to a well-lit, public place gives you safety and allows you to assess the situation. Confronting someone or running can escalate the danger.",
                tips: [
                  "Trust your instincts - if something feels wrong, it probably is",
                  "Well-lit public places like stores or restaurants are safe havens",
                  "Calling someone lets others know your situation",
                  "Consider using Guardian's live location sharing feature",
                ],
              }}
              onComplete={() => setUserPoints((prev) => prev + 30)}
            />
          ),
        },
      ],
    },
  ];

  const currentSectionData = guideSections[currentSection];
  const currentStepData = currentSectionData.content[currentStep];
  const totalSteps = currentSectionData.content.length;
  const sectionProgress = ((currentStep + 1) / totalSteps) * 100;

  const handleStepComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStepData.id]));
    if (currentStepData.points) {
      setUserPoints((prev) => prev + currentStepData.points);
    }

    setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else if (currentSection < guideSections.length - 1) {
        setCurrentSection(currentSection + 1);
        setCurrentStep(0);
      } else {
        // Guide completed
        localStorage.setItem("guardian-safety-guide-completed", "true");
        onClose();
      }
    }, 1000);
  };

  const handleSectionSelect = (sectionIndex: number) => {
    setCurrentSection(sectionIndex);
    setCurrentStep(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden p-0 bg-white">
        <SafeMotion
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex h-[90vh] max-h-[90vh]"
        >
          {/* Sidebar - Section Navigation */}
          <div className="w-80 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">
                    Safety Guide
                  </h2>
                  <p className="text-sm text-gray-600">
                    Interactive learning experience
                  </p>
                </div>
              </div>

              {/* User Progress */}
              <Card className="bg-white/50 border-0">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Your Progress
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-bold text-gray-900">
                        {userPoints}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={(completedSteps.size / 6) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {completedSteps.size} of 6 steps completed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Section List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {guideSections.map((section, index) => (
                <Card
                  key={section.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    currentSection === index
                      ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                      : "hover:bg-white/70 border-gray-200"
                  }`}
                  onClick={() => handleSectionSelect(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-br ${section.gradient}`}
                      >
                        <section.icon className={`h-5 w-5 ${section.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">
                          {section.title}
                        </h3>
                        <p className="text-xs text-gray-600 mb-2">
                          {section.subtitle}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {section.estimatedTime}m
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              section.difficulty === "beginner"
                                ? "text-green-600"
                                : section.difficulty === "intermediate"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {section.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-gray-600 hover:text-gray-800"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Close Guide
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Content Header */}
            <div
              className={`p-6 border-b border-gray-200 bg-gradient-to-r ${currentSectionData.gradient}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/80`}>
                    <currentSectionData.icon
                      className={`h-6 w-6 ${currentSectionData.color}`}
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {currentStepData.title}
                    </h1>
                    <p className="text-gray-600">
                      {currentStepData.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentStepData.points && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Star className="h-3 w-3 mr-1" />
                      {currentStepData.points} pts
                    </Badge>
                  )}
                  <Badge variant="outline">
                    Step {currentStep + 1} of {totalSteps}
                  </Badge>
                </div>
              </div>

              <Progress value={sectionProgress} className="h-2" />
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <SafeMotion
                  key={`${currentSection}-${currentStep}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStepData.content}
                </SafeMotion>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep > 0) {
                      setCurrentStep(currentStep - 1);
                    } else if (currentSection > 0) {
                      setCurrentSection(currentSection - 1);
                      setCurrentStep(
                        guideSections[currentSection - 1].content.length - 1,
                      );
                    }
                  }}
                  disabled={currentSection === 0 && currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {currentSectionData.content.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                        index === currentStep
                          ? "bg-blue-500"
                          : index < currentStep
                            ? "bg-green-500"
                            : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleStepComplete}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {currentStep === totalSteps - 1 &&
                  currentSection === guideSections.length - 1
                    ? "Complete Guide"
                    : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </SafeMotion>
      </DialogContent>
    </Dialog>
  );
}

// Scenario Quiz Component
function ScenarioQuiz({
  scenario,
  onComplete,
}: {
  scenario: {
    title: string;
    description: string;
    options: Array<{ id: string; text: string; correct: boolean }>;
    explanation: string;
    tips: string[];
  };
  onComplete: () => void;
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    if (!selectedOption) return;
    setShowResult(true);
    setTimeout(() => {
      onComplete();
    }, 3000);
  };

  const selectedAnswer = scenario.options.find(
    (opt) => opt.id === selectedOption,
  );
  const isCorrect = selectedAnswer?.correct;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            {scenario.title}
          </h3>
          <p className="text-blue-800 leading-relaxed">
            {scenario.description}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">What would you do?</h4>
        {scenario.options.map((option) => (
          <Card
            key={option.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedOption === option.id
                ? showResult
                  ? option.correct
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : "border-blue-500 bg-blue-50"
                : "hover:bg-gray-50"
            }`}
            onClick={() => !showResult && setSelectedOption(option.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === option.id
                      ? showResult
                        ? option.correct
                          ? "border-green-500 bg-green-500"
                          : "border-red-500 bg-red-500"
                        : "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedOption === option.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-gray-900">{option.text}</span>
                {showResult && option.correct && (
                  <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!showResult && (
        <Button
          onClick={handleSubmit}
          disabled={!selectedOption}
          className="w-full"
        >
          Submit Answer
        </Button>
      )}

      {showResult && (
        <SafeMotion
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card
            className={`border-2 ${isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <X className="h-5 w-5 text-red-600" />
                )}
                <h4
                  className={`font-semibold ${isCorrect ? "text-green-800" : "text-red-800"}`}
                >
                  {isCorrect ? "Correct!" : "Not quite right"}
                </h4>
              </div>
              <p
                className={`text-sm ${isCorrect ? "text-green-700" : "text-red-700"}`}
              >
                {scenario.explanation}
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Safety Tips</h4>
              <ul className="space-y-1">
                {scenario.tips.map((tip, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-blue-700"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </SafeMotion>
      )}
    </div>
  );
}

export default SafetyGuide;
