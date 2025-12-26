import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BookOpen,
  Music,
  Video,
  GraduationCap,
  FileText,
  Image,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Lightbulb,
  Rocket,
  Camera,
  User,
} from "lucide-react";
import { useLocation } from "wouter";

const ONBOARDING_COMPLETE_KEY = "kreAIte_onboarding_complete";
const ONBOARDING_DATA_KEY = "kreAIte_onboarding_data";

interface OnboardingData {
  contentType: string | null;
  creatorName: string;
  bio: string;
  photoUrl: string;
}

const contentTypes = [
  {
    id: "book",
    icon: BookOpen,
    title: "Books",
    description: "Write and publish books, guides, and ebooks",
    studioPath: "/book-studio",
  },
  {
    id: "music",
    icon: Music,
    title: "Music",
    description: "Create AI-powered music and audio content",
    studioPath: "/music-studio",
  },
  {
    id: "video",
    icon: Video,
    title: "Videos",
    description: "Edit and produce professional video content",
    studioPath: "/video-studio",
  },
  {
    id: "course",
    icon: GraduationCap,
    title: "Courses",
    description: "Build and sell online courses and curricula",
    studioPath: "/course-studio",
  },
  {
    id: "image",
    icon: Image,
    title: "Images",
    description: "Design and generate stunning visuals",
    studioPath: "/image-studio",
  },
  {
    id: "doctrine",
    icon: FileText,
    title: "Doctrine",
    description: "Create frameworks, manuals, and guides",
    studioPath: "/publishing",
  },
];

const getQuickStartTips = (contentType: string | null) => {
  const tips: Record<string, { title: string; description: string }[]> = {
    book: [
      { title: "Start with an outline", description: "Let AI help you structure your ideas into chapters" },
      { title: "Use voice-to-text", description: "Speak your thoughts and let AI transcribe them" },
      { title: "One-click publishing", description: "Export directly to Amazon KDP or PDF" },
    ],
    music: [
      { title: "Describe your vision", description: "Tell AI the mood, genre, and style you want" },
      { title: "Clone your voice", description: "Create a digital version of your voice for narration" },
      { title: "Remix and iterate", description: "Generate variations until it's perfect" },
    ],
    video: [
      { title: "Auto-captions first", description: "Add engaging captions to boost engagement" },
      { title: "Use templates", description: "Start with proven viral formats" },
      { title: "Batch process", description: "Create multiple versions for different platforms" },
    ],
    course: [
      { title: "AI curriculum builder", description: "Generate your course structure in minutes" },
      { title: "Add quizzes automatically", description: "AI creates assessments for each lesson" },
      { title: "Track student progress", description: "Built-in analytics for your students" },
    ],
    image: [
      { title: "Start with a prompt", description: "Describe what you want to create" },
      { title: "Use reference images", description: "Upload images to guide the AI" },
      { title: "Batch generation", description: "Create multiple variations at once" },
    ],
    doctrine: [
      { title: "Define your expertise", description: "AI helps structure your knowledge" },
      { title: "Use your voice", description: "Maintain your unique brand tone" },
      { title: "Multi-format export", description: "Create PDFs, web pages, and more" },
    ],
  };
  return tips[contentType || "book"] || tips.book;
};

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    contentType: null,
    creatorName: "",
    bio: "",
    photoUrl: "",
  });

  const totalSteps = 5;
  const progressValue = (step / totalSteps) * 100;

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    onComplete();
    navigate("/dashboard");
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSelectContentType = (typeId: string) => {
    setData({ ...data, contentType: typeId });
  };

  const handleStartCreating = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    localStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
    onComplete();
    const selectedType = contentTypes.find((t) => t.id === data.contentType);
    navigate(selectedType?.studioPath || "/dashboard");
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(1);

  const goToStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  useEffect(() => {
    setDirection(1);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "#000000" }}
      data-testid="onboarding-container"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF6B35]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FF6B35]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#FF6B35]" />
            <span className="text-white font-bold text-xl">KreAIte</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-gray-400 hover:text-white"
            data-testid="button-skip-onboarding"
          >
            <X className="w-4 h-4 mr-1" />
            Skip
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? "bg-[#FF6B35]" : "bg-gray-800"
                }`}
                data-testid={`progress-step-${i + 1}`}
              />
            ))}
          </div>
          <div className="text-gray-500 text-sm" data-testid="text-step-indicator">
            Step {step} of {totalSteps}
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === 1 && (
              <div className="text-center" data-testid="step-welcome">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-[#FF6B35]" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4" data-testid="text-welcome-title">
                  Welcome to KreAIte
                </h1>
                <p className="text-xl text-gray-400 mb-8 max-w-md mx-auto" data-testid="text-welcome-subtitle">
                  Your AI-powered creative studio. Let's set up your experience in just a few steps.
                </p>
                <Button
                  size="lg"
                  onClick={handleNext}
                  className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white px-8"
                  data-testid="button-get-started"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div data-testid="step-content-type">
                <h2 className="text-3xl font-bold text-white mb-2 text-center" data-testid="text-content-type-title">
                  What do you want to create?
                </h2>
                <p className="text-gray-400 mb-8 text-center" data-testid="text-content-type-subtitle">
                  Choose your primary content type. You can always explore others later.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {contentTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = data.contentType === type.id;
                    return (
                      <Card
                        key={type.id}
                        className={`p-4 cursor-pointer transition-all border-2 ${
                          isSelected
                            ? "border-[#FF6B35] bg-[#FF6B35]/10"
                            : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                        }`}
                        onClick={() => handleSelectContentType(type.id)}
                        data-testid={`card-content-type-${type.id}`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                              isSelected ? "bg-[#FF6B35]/20" : "bg-gray-800"
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 ${isSelected ? "text-[#FF6B35]" : "text-gray-400"}`}
                            />
                          </div>
                          <h3 className="font-semibold text-white mb-1">{type.title}</h3>
                          <p className="text-xs text-gray-500">{type.description}</p>
                          {isSelected && (
                            <div className="mt-2">
                              <Check className="w-5 h-5 text-[#FF6B35]" />
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="text-gray-400 hover:text-white"
                    data-testid="button-back-step-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!data.contentType}
                    className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
                    data-testid="button-next-step-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div data-testid="step-profile">
                <h2 className="text-3xl font-bold text-white mb-2 text-center" data-testid="text-profile-title">
                  Set up your creator profile
                </h2>
                <p className="text-gray-400 mb-8 text-center" data-testid="text-profile-subtitle">
                  Tell us a bit about yourself. This helps personalize your experience.
                </p>
                <div className="space-y-6">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-2 border-gray-700">
                        <AvatarImage src={data.photoUrl} />
                        <AvatarFallback className="bg-gray-800 text-gray-400">
                          <User className="w-10 h-10" />
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="photo-upload"
                        className="absolute bottom-0 right-0 w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#FF6B35]/90 transition-colors"
                        data-testid="button-upload-photo"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setData({ ...data, photoUrl: url });
                          }
                        }}
                        data-testid="input-photo-upload"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Creator Name
                    </label>
                    <Input
                      placeholder="How should we call you?"
                      value={data.creatorName}
                      onChange={(e) => setData({ ...data, creatorName: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                      data-testid="input-creator-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Bio (optional)
                    </label>
                    <Textarea
                      placeholder="Tell us about yourself and what you create..."
                      value={data.bio}
                      onChange={(e) => setData({ ...data, bio: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
                      data-testid="input-creator-bio"
                    />
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="text-gray-400 hover:text-white"
                    data-testid="button-back-step-3"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
                    data-testid="button-next-step-3"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div data-testid="step-tips">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
                    <Lightbulb className="w-8 h-8 text-[#FF6B35]" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2" data-testid="text-tips-title">
                    Quick Start Tips
                  </h2>
                  <p className="text-gray-400" data-testid="text-tips-subtitle">
                    Here's how to get the most out of your{" "}
                    {contentTypes.find((t) => t.id === data.contentType)?.title || "creative"} studio
                  </p>
                </div>
                <div className="space-y-4">
                  {getQuickStartTips(data.contentType).map((tip, index) => (
                    <Card
                      key={index}
                      className="p-4 bg-gray-900/50 border-gray-800"
                      data-testid={`card-tip-${index + 1}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#FF6B35]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#FF6B35] font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-1">{tip.title}</h3>
                          <p className="text-sm text-gray-400">{tip.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-between mt-8">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="text-gray-400 hover:text-white"
                    data-testid="button-back-step-4"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
                    data-testid="button-next-step-4"
                  >
                    Almost Done
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="text-center" data-testid="step-final">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
                  <Rocket className="w-10 h-10 text-[#FF6B35]" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4" data-testid="text-final-title">
                  You're All Set!
                </h1>
                <p className="text-xl text-gray-400 mb-2" data-testid="text-final-subtitle">
                  {data.creatorName ? `Welcome, ${data.creatorName}!` : "Welcome to KreAIte!"}
                </p>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Your{" "}
                  {contentTypes.find((t) => t.id === data.contentType)?.title || "creative"} studio
                  is ready. Let's start creating something amazing.
                </p>
                <Button
                  size="lg"
                  onClick={handleStartCreating}
                  className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white px-8"
                  data-testid="button-start-creating"
                >
                  Start Creating
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="text-gray-500 hover:text-gray-300"
                    data-testid="button-back-step-5"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Go Back
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function useOnboardingComplete() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const complete = localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true";
    setIsComplete(complete);
  }, []);

  const markComplete = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    setIsComplete(true);
  };

  const reset = () => {
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    localStorage.removeItem(ONBOARDING_DATA_KEY);
    setIsComplete(false);
  };

  return { isComplete, markComplete, reset };
}
