import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowRight, 
  ArrowLeft,
  Target, 
  Zap, 
  Calendar,
  Clock,
  CheckCircle2,
  Brain,
  Dumbbell,
  Footprints,
  HandMetal,
  MessageCircle,
  ShoppingBag,
  Timer,
  Trophy,
  Activity,
  LogIn,
  GraduationCap,
  Loader2
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FormData {
  strokeDate: string;
  strokeType: string;
  affectedSide: string;
  mobilityLevel: string;
  handFunction: string;
  speechAbility: string;
  goals: string[];
  dailyTime: string;
}

const initialFormData: FormData = {
  strokeDate: "",
  strokeType: "",
  affectedSide: "",
  mobilityLevel: "",
  handFunction: "",
  speechAbility: "",
  goals: [],
  dailyTime: "",
};

const sasquatchQuotes = [
  "Every warrior's journey starts with a single step. Let's map yours.",
  "Your stroke doesn't define you - your comeback does. Let's build it.",
  "The brain can rewire itself. Let me show you how to command it.",
  "From wheelchair to walking isn't luck - it's strategy. Let's create yours.",
  "You've survived the worst day. Now let's conquer every day after.",
];

const goalOptions = [
  { id: "walking", label: "Walk independently", icon: Footprints },
  { id: "hand-function", label: "Restore hand function", icon: HandMetal },
  { id: "independence", label: "Daily living independence", icon: Target },
  { id: "return-to-work", label: "Return to work", icon: Trophy },
  { id: "speech", label: "Improve speech", icon: MessageCircle },
  { id: "strength", label: "Build strength", icon: Dumbbell },
  { id: "cognitive", label: "Cognitive recovery", icon: Brain },
  { id: "endurance", label: "Increase endurance", icon: Activity },
];

const timeOptions = [
  { value: "15-30", label: "15-30 minutes", description: "Light daily practice" },
  { value: "30-60", label: "30-60 minutes", description: "Moderate commitment" },
  { value: "60-90", label: "1-2 hours", description: "Intensive recovery" },
  { value: "90+", label: "2+ hours", description: "Full warrior mode" },
];

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progressPercent = ((currentStep) / totalSteps) * 100;
  
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between mb-3">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center">
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm transition-all ${
                index + 1 < currentStep 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : index + 1 === currentStep 
                    ? "border-primary text-primary bg-primary/20" 
                    : "border-muted text-muted-foreground"
              }`}
              data-testid={`step-indicator-${index + 1}`}
              aria-current={index + 1 === currentStep ? "step" : undefined}
            >
              {index + 1 < currentStep ? (
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              ) : (
                index + 1
              )}
            </div>
            {index < totalSteps - 1 && (
              <div 
                className={`hidden sm:block w-16 md:w-24 lg:w-32 h-0.5 mx-2 ${
                  index + 1 < currentStep ? "bg-primary" : "bg-muted"
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
      <Progress value={progressPercent} className="h-2" aria-label={`Step ${currentStep} of ${totalSteps}`} />
      <p className="text-center text-sm text-muted-foreground mt-2">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
}

function SasquatchQuote({ quote }: { quote: string }) {
  return (
    <div className="bg-card/50 border border-border rounded-lg p-4 mb-8 max-w-2xl mx-auto">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-primary mb-1">Sasquatch Coach says:</p>
          <p className="text-foreground italic" data-testid="text-sasquatch-quote">"{quote}"</p>
        </div>
      </div>
    </div>
  );
}

function Step1BasicInfo({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
          Basic Information
        </CardTitle>
        <CardDescription>
          Tell us about your stroke experience so we can personalize your recovery plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="stroke-date">When did your stroke occur?</Label>
          <Input
            id="stroke-date"
            type="date"
            value={formData.strokeDate}
            onChange={(e) => setFormData({ ...formData, strokeDate: e.target.value })}
            className="max-w-xs"
            data-testid="input-stroke-date"
          />
          <p className="text-xs text-muted-foreground">This helps us understand your recovery timeline</p>
        </div>

        <div className="space-y-3">
          <Label>What type of stroke did you have?</Label>
          <RadioGroup
            value={formData.strokeType}
            onValueChange={(value) => setFormData({ ...formData, strokeType: value })}
            className="grid gap-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover-elevate">
              <RadioGroupItem value="ischemic" id="ischemic" data-testid="radio-ischemic" />
              <Label htmlFor="ischemic" className="cursor-pointer flex-1">
                <span className="font-medium">Ischemic Stroke</span>
                <span className="block text-xs text-muted-foreground">Caused by a blood clot blocking blood flow</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover-elevate">
              <RadioGroupItem value="hemorrhagic" id="hemorrhagic" data-testid="radio-hemorrhagic" />
              <Label htmlFor="hemorrhagic" className="cursor-pointer flex-1">
                <span className="font-medium">Hemorrhagic Stroke</span>
                <span className="block text-xs text-muted-foreground">Caused by bleeding in or around the brain</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover-elevate">
              <RadioGroupItem value="tia" id="tia" data-testid="radio-tia" />
              <Label htmlFor="tia" className="cursor-pointer flex-1">
                <span className="font-medium">TIA (Mini-Stroke)</span>
                <span className="block text-xs text-muted-foreground">Temporary blockage with symptoms lasting less than 24 hours</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover-elevate">
              <RadioGroupItem value="unknown" id="unknown" data-testid="radio-unknown" />
              <Label htmlFor="unknown" className="cursor-pointer flex-1">
                <span className="font-medium">Not Sure / Unknown</span>
                <span className="block text-xs text-muted-foreground">We'll still create a great plan for you</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>Which side of your body was affected?</Label>
          <RadioGroup
            value={formData.affectedSide}
            onValueChange={(value) => setFormData({ ...formData, affectedSide: value })}
            className="grid sm:grid-cols-3 gap-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover-elevate">
              <RadioGroupItem value="left" id="left-side" data-testid="radio-left-side" />
              <Label htmlFor="left-side" className="cursor-pointer font-medium">Left Side</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover-elevate">
              <RadioGroupItem value="right" id="right-side" data-testid="radio-right-side" />
              <Label htmlFor="right-side" className="cursor-pointer font-medium">Right Side</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover-elevate">
              <RadioGroupItem value="both" id="both-sides" data-testid="radio-both-sides" />
              <Label htmlFor="both-sides" className="cursor-pointer font-medium">Both Sides</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}

function Step2Abilities({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
          Current Abilities
        </CardTitle>
        <CardDescription>
          Help us understand your current function levels so we can match exercises to your abilities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Mobility Level</Label>
          <Select
            value={formData.mobilityLevel}
            onValueChange={(value) => setFormData({ ...formData, mobilityLevel: value })}
          >
            <SelectTrigger data-testid="select-mobility">
              <SelectValue placeholder="Select your current mobility level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wheelchair">Wheelchair / Bed-bound</SelectItem>
              <SelectItem value="walker">Using walker or heavy assistance</SelectItem>
              <SelectItem value="cane">Using cane or light assistance</SelectItem>
              <SelectItem value="independent-limited">Walking independently with limitations</SelectItem>
              <SelectItem value="independent">Walking independently</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Affected Hand Function</Label>
          <Select
            value={formData.handFunction}
            onValueChange={(value) => setFormData({ ...formData, handFunction: value })}
          >
            <SelectTrigger data-testid="select-hand-function">
              <SelectValue placeholder="Select your hand function level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No movement or sensation</SelectItem>
              <SelectItem value="minimal">Minimal movement, can't grasp objects</SelectItem>
              <SelectItem value="limited">Can grasp but limited fine motor control</SelectItem>
              <SelectItem value="moderate">Moderate function, some difficulty with tasks</SelectItem>
              <SelectItem value="good">Good function with minor limitations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Speech & Communication</Label>
          <Select
            value={formData.speechAbility}
            onValueChange={(value) => setFormData({ ...formData, speechAbility: value })}
          >
            <SelectTrigger data-testid="select-speech">
              <SelectValue placeholder="Select your speech ability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severe">Severe difficulty speaking or understanding</SelectItem>
              <SelectItem value="moderate">Moderate difficulty, can communicate basic needs</SelectItem>
              <SelectItem value="mild">Mild difficulty, occasional word-finding issues</SelectItem>
              <SelectItem value="normal">No speech difficulties</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function Step3Goals({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  const toggleGoal = (goalId: string) => {
    const currentGoals = formData.goals;
    if (currentGoals.includes(goalId)) {
      setFormData({ ...formData, goals: currentGoals.filter((g) => g !== goalId) });
    } else {
      setFormData({ ...formData, goals: [...currentGoals, goalId] });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Target className="h-5 w-5 text-primary" aria-hidden="true" />
          Your Recovery Goals
        </CardTitle>
        <CardDescription>
          Select all the goals that matter most to you. We'll prioritize your plan accordingly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-3">
          {goalOptions.map((goal) => {
            const isSelected = formData.goals.includes(goal.id);
            const IconComponent = goal.icon;
            return (
              <div
                key={goal.id}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer hover-elevate ${
                  isSelected 
                    ? "border-primary bg-primary/10" 
                    : "border-border"
                }`}
                onClick={() => toggleGoal(goal.id)}
                data-testid={`goal-${goal.id}`}
              >
                <Checkbox
                  id={goal.id}
                  checked={isSelected}
                  onCheckedChange={() => toggleGoal(goal.id)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <IconComponent 
                    className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} 
                    aria-hidden="true" 
                  />
                  <Label htmlFor={goal.id} className="cursor-pointer font-medium">
                    {goal.label}
                  </Label>
                </div>
              </div>
            );
          })}
        </div>
        {formData.goals.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4" data-testid="text-goals-selected">
            {formData.goals.length} goal{formData.goals.length !== 1 ? "s" : ""} selected
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Step4Time({ formData, setFormData }: { formData: FormData; setFormData: (data: FormData) => void }) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
          Daily Time Commitment
        </CardTitle>
        <CardDescription>
          How much time can you dedicate to your recovery exercises each day? Be realistic - consistency beats intensity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={formData.dailyTime}
          onValueChange={(value) => setFormData({ ...formData, dailyTime: value })}
          className="grid gap-3"
        >
          {timeOptions.map((option) => (
            <div 
              key={option.value}
              className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors hover-elevate ${
                formData.dailyTime === option.value 
                  ? "border-primary bg-primary/10" 
                  : "border-border"
              }`}
            >
              <RadioGroupItem value={option.value} id={option.value} data-testid={`radio-time-${option.value}`} />
              <Label htmlFor={option.value} className="cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <Timer className={`h-4 w-4 ${formData.dailyTime === option.value ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                  <span className="font-medium">{option.label}</span>
                </div>
                <span className="block text-xs text-muted-foreground mt-1">{option.description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

interface EnrollmentData {
  enrollment: any;
  tier: string;
  programName: string;
}

function ResultsSection({ formData, enrollmentData }: { formData: FormData; enrollmentData?: EnrollmentData }) {
  const getExerciseRecommendations = () => {
    const exercises = [];
    
    if (formData.mobilityLevel === "wheelchair" || formData.mobilityLevel === "walker") {
      exercises.push({
        name: "Bed Mobility Exercises",
        description: "Core strengthening and basic movement patterns",
        duration: "15-20 min",
        difficulty: "Beginner",
      });
      exercises.push({
        name: "Seated Balance Training",
        description: "Build trunk control for eventual standing",
        duration: "10-15 min",
        difficulty: "Beginner",
      });
    }
    
    if (formData.goals.includes("walking") || formData.goals.includes("strength")) {
      exercises.push({
        name: "Drop Foot Recovery Protocol",
        description: "Nick's proven method for restoring ankle function",
        duration: "20-30 min",
        difficulty: "Intermediate",
      });
      exercises.push({
        name: "Standing Balance Progressions",
        description: "Build confidence and stability on your feet",
        duration: "15-25 min",
        difficulty: "Intermediate",
      });
    }
    
    if (formData.goals.includes("hand-function")) {
      exercises.push({
        name: "Mirror Therapy Sessions",
        description: "Rewire your brain's motor pathways",
        duration: "20-30 min",
        difficulty: "All Levels",
      });
      exercises.push({
        name: "Baseball Bat Therapy",
        description: "Nick's signature grip and arm coordination exercises",
        duration: "15-20 min",
        difficulty: "Intermediate",
      });
    }
    
    if (formData.goals.includes("cognitive") || formData.goals.includes("speech")) {
      exercises.push({
        name: "Cognitive Recovery Games",
        description: "Memory, attention, and processing speed training",
        duration: "20-30 min",
        difficulty: "Varies",
      });
    }
    
    if (exercises.length < 3) {
      exercises.push({
        name: "Daily Stretch Routine",
        description: "Full-body flexibility and range of motion",
        duration: "10-15 min",
        difficulty: "All Levels",
      });
    }
    
    return exercises;
  };

  const getEquipmentRecommendations = () => {
    const equipment = [];
    
    if (formData.goals.includes("hand-function")) {
      equipment.push({
        name: "Mirror Therapy Box",
        price: "$45-75",
        priority: "Essential",
      });
      equipment.push({
        name: "Hand Therapy Putty Set",
        price: "$15-25",
        priority: "Recommended",
      });
    }
    
    if (formData.goals.includes("walking") || formData.mobilityLevel !== "independent") {
      equipment.push({
        name: "AFO Brace (Drop Foot)",
        price: "$50-150",
        priority: "Essential",
      });
      equipment.push({
        name: "Resistance Bands Set",
        price: "$20-35",
        priority: "Recommended",
      });
    }
    
    if (formData.goals.includes("strength") || formData.goals.includes("endurance")) {
      equipment.push({
        name: "Adjustable Dumbbells",
        price: "$40-80",
        priority: "Recommended",
      });
    }
    
    equipment.push({
      name: "Exercise Mat",
      price: "$20-40",
      priority: "Essential",
    });
    
    return equipment;
  };

  const getTimelineEstimate = () => {
    let baseWeeks = 12;
    
    if (formData.mobilityLevel === "wheelchair" || formData.mobilityLevel === "walker") {
      baseWeeks += 8;
    }
    
    if (formData.dailyTime === "15-30") {
      baseWeeks *= 1.5;
    } else if (formData.dailyTime === "90+") {
      baseWeeks *= 0.75;
    }
    
    const strokeDate = new Date(formData.strokeDate);
    const now = new Date();
    const monthsSinceStroke = Math.floor((now.getTime() - strokeDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (monthsSinceStroke < 6) {
      baseWeeks *= 0.8;
    } else if (monthsSinceStroke > 24) {
      baseWeeks *= 1.2;
    }
    
    return Math.round(baseWeeks);
  };

  const exercises = getExerciseRecommendations();
  const equipment = getEquipmentRecommendations();
  const timelineWeeks = getTimelineEstimate();

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'champion': return 'default';
      case 'warrior': return 'secondary';
      default: return 'outline';
    }
  };

  const getTierDescription = (tier: string) => {
    switch (tier) {
      case 'champion': return "You're ready for intensive recovery with 60+ minutes daily. Maximum results incoming!";
      case 'warrior': return "With moderate commitment and mobility, you'll make steady, strong progress.";
      default: return "Start where you are. Every step forward builds momentum for your recovery.";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {enrollmentData && (
        <Card className="border-primary bg-primary/10">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <div>
                <Badge variant={getTierBadgeVariant(enrollmentData.tier)} className="mb-2 text-sm">
                  {enrollmentData.tier.charAt(0).toUpperCase() + enrollmentData.tier.slice(1)} Tier
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="text-enrollment-success">
                  You're Enrolled in Recovery University!
                </h2>
                <p className="text-muted-foreground max-w-xl">
                  {getTierDescription(enrollmentData.tier)}
                </p>
              </div>
              <Link href="/recovery">
                <Button size="lg" className="gap-2 mt-2" data-testid="button-go-to-dashboard">
                  Go to Recovery Dashboard
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center mb-12">
        <Badge className="mb-4">Protocol Generated</Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-results-title">
          Your Personalized Recovery Protocol
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Based on your assessment, here's your customized battle plan. Remember: consistency beats intensity.
        </p>
      </div>

      <SasquatchQuote quote="You've got your mission. Now it's time to execute. One day at a time, one rep at a time." />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" aria-hidden="true" />
              Recommended Exercises
            </CardTitle>
            <CardDescription>Your personalized exercise arsenal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border"
                  data-testid={`exercise-recommendation-${index}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{exercise.name}</h4>
                    <p className="text-sm text-muted-foreground">{exercise.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                        {exercise.duration}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{exercise.difficulty}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Timer className="h-5 w-5 text-primary" aria-hidden="true" />
                Estimated Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-black text-primary mb-2" data-testid="text-timeline-weeks">
                  {timelineWeeks}
                </div>
                <p className="text-muted-foreground">weeks to significant improvement</p>
                <p className="text-xs text-muted-foreground mt-3">
                  *Timeline varies based on consistency and individual factors
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="h-5 w-5 text-primary" aria-hidden="true" />
                Recommended Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {equipment.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    data-testid={`equipment-recommendation-${index}`}
                  >
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.price}</p>
                    </div>
                    <Badge 
                      variant={item.priority === "Essential" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>
              <Link href="/marketplace">
                <Button className="w-full mt-4 gap-2" data-testid="button-view-marketplace">
                  Browse Equipment
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">Ready to Start Your Recovery Journey?</h3>
              <p className="text-muted-foreground">
                Access the full Academy with video tutorials, progress tracking, and community support. 
                Your protocol is waiting.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/academy">
                <Button size="lg" className="gap-2" data-testid="button-access-academy">
                  Access Academy
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/community">
                <Button size="lg" variant="outline" data-testid="button-join-community">
                  Join Community
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Builder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showResults, setShowResults] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | undefined>(undefined);
  const totalSteps = 4;
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const enrollmentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('/api/recovery/enrollment', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: (data) => {
      setEnrollmentData(data);
      setShowResults(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error) => {
      console.error("Enrollment error:", error);
      setShowResults(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  useEffect(() => {
    document.title = "Build Your Recovery Plan - Personalized Stroke Recovery | StrokeRecoveryAcademy.com";
    
    const updateOrCreateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    const updateOrCreateLink = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", rel);
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    };

    updateOrCreateMeta(
      "description",
      "Create your personalized stroke recovery plan with Nick Kremers' proven methods. Answer a few questions and get customized exercises, equipment recommendations, and an estimated timeline for your recovery journey."
    );

    updateOrCreateLink("canonical", "https://strokerecoveryacademy.com/builder");

    updateOrCreateMeta(
      "og:title",
      "Build Your Recovery Plan - Stroke Recovery OS",
      true
    );
    updateOrCreateMeta(
      "og:description",
      "Get a personalized stroke recovery protocol based on your specific situation, goals, and available time. Built on Nick Kremers' journey from 0% to 90% recovery.",
      true
    );
    updateOrCreateMeta("og:type", "website", true);
    updateOrCreateMeta("og:url", "https://strokerecoveryacademy.com/builder", true);

    updateOrCreateMeta("twitter:card", "summary_large_image");
    updateOrCreateMeta("twitter:title", "Build Your Recovery Plan - Stroke Recovery OS");
    updateOrCreateMeta(
      "twitter:description",
      "Create your personalized stroke recovery protocol. Answer a few questions and get customized exercises and recommendations."
    );
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.strokeType && formData.affectedSide;
      case 2:
        return formData.mobilityLevel && formData.handFunction && formData.speechAbility;
      case 3:
        return formData.goals.length > 0;
      case 4:
        return formData.dailyTime;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (isAuthenticated) {
        enrollmentMutation.mutate(formData);
      } else {
        setShowResults(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStartOver = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setShowResults(false);
    setEnrollmentData(undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <section className="relative py-16 md:py-20 overflow-hidden" aria-labelledby="builder-heading">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" aria-hidden="true" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <Badge variant="outline" className="mb-6 text-primary border-primary">
                Mission Builder
              </Badge>
              <h1 
                id="builder-heading"
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
                data-testid="text-builder-title"
              >
                Build Your{" "}
                <span className="text-primary">Recovery Plan</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Answer a few questions about your situation and goals. 
                We'll create a personalized protocol based on Nick Kremers' proven recovery methods.
              </p>
            </div>

            {!isAuthenticated && !authLoading && (
              <Card className="max-w-2xl mx-auto mb-8 border-amber-500/50 bg-amber-500/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <LogIn className="h-6 w-6 text-amber-500" aria-hidden="true" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-semibold text-foreground mb-1">Sign in to save your progress</h3>
                      <p className="text-sm text-muted-foreground">
                        Log in to enroll in Recovery University and save your assessment data. You can still complete the assessment without logging in.
                      </p>
                    </div>
                    <Button asChild className="gap-2" data-testid="button-login-prompt">
                      <a href="/api/login">
                        <LogIn className="h-4 w-4" aria-hidden="true" />
                        Sign In
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!showResults ? (
              <>
                <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
                
                <SasquatchQuote quote={sasquatchQuotes[currentStep - 1]} />

                {currentStep === 1 && (
                  <Step1BasicInfo formData={formData} setFormData={setFormData} />
                )}
                {currentStep === 2 && (
                  <Step2Abilities formData={formData} setFormData={setFormData} />
                )}
                {currentStep === 3 && (
                  <Step3Goals formData={formData} setFormData={setFormData} />
                )}
                {currentStep === 4 && (
                  <Step4Time formData={formData} setFormData={setFormData} />
                )}

                <div className="flex justify-center gap-4 mt-8 max-w-2xl mx-auto">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="gap-2"
                      data-testid="button-back"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed() || enrollmentMutation.isPending}
                    className="gap-2 min-w-[140px]"
                    data-testid="button-next"
                  >
                    {enrollmentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        {currentStep === totalSteps ? "Generate Protocol" : "Continue"}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <ResultsSection formData={formData} enrollmentData={enrollmentData} />
                
                <div className="flex justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={handleStartOver}
                    className="gap-2"
                    data-testid="button-start-over"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Start Over
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
