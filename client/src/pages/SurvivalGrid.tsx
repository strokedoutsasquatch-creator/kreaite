import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Grid3X3,
  Hand,
  Footprints,
  Brain,
  Home,
  Clock,
  ArrowRight,
  Target,
  Zap,
  Award,
  RotateCcw,
  GripHorizontal,
  Dumbbell,
  Move,
  Scale,
  Activity,
  Puzzle,
  Lightbulb,
  MessageCircle,
  Shirt,
  UtensilsCrossed,
  ShowerHead,
  ChefHat,
  CheckCircle2,
  Play,
  type LucideIcon
} from "lucide-react";
import { Link } from "wouter";

type Category = "all" | "upper-body" | "lower-body" | "cognitive" | "daily-living";
type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "All Levels";

interface Exercise {
  id: number;
  name: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  duration: string;
  repetitions?: string;
  icon: LucideIcon;
  tags: string[];
  progress: number;
}

const exercises: Exercise[] = [
  {
    id: 1,
    name: "Mirror Therapy",
    description: "Rewire your brain's motor pathways using mirror box techniques. Watch your healthy hand move while your brain reconnects with your affected side.",
    category: "upper-body",
    difficulty: "Beginner",
    duration: "15-20 min",
    repetitions: "3 sets of 10 movements",
    icon: RotateCcw,
    tags: ["Neuroplasticity", "Arm Recovery", "Nick's Essential"],
    progress: 0,
  },
  {
    id: 2,
    name: "Hand Grip Exercises",
    description: "Strengthen your grip using therapy putty, stress balls, or Nick's baseball bat technique. Build crushing strength one squeeze at a time.",
    category: "upper-body",
    difficulty: "All Levels",
    duration: "10-15 min",
    repetitions: "50-100 squeezes",
    icon: GripHorizontal,
    tags: ["Grip Strength", "Fine Motor", "Equipment Free"],
    progress: 0,
  },
  {
    id: 3,
    name: "Arm Strengthening Protocol",
    description: "Progressive resistance training for your affected arm. Start with gravity-assisted movements and build to full range of motion.",
    category: "upper-body",
    difficulty: "Intermediate",
    duration: "20-30 min",
    repetitions: "3 sets of 8-12 reps",
    icon: Dumbbell,
    tags: ["Strength", "Upper Body", "Progressive"],
    progress: 0,
  },
  {
    id: 4,
    name: "Fine Motor Skills Training",
    description: "Precision exercises for finger dexterity. Button practice, coin manipulation, and writing exercises to restore delicate movements.",
    category: "upper-body",
    difficulty: "Advanced",
    duration: "15-25 min",
    icon: Hand,
    tags: ["Dexterity", "Precision", "Daily Tasks"],
    progress: 0,
  },
  {
    id: 5,
    name: "Drop Foot Protocol",
    description: "Nick's proven system to overcome drop foot. Targeted ankle exercises, AFO usage guides, and gait pattern retraining.",
    category: "lower-body",
    difficulty: "All Levels",
    duration: "30-45 min",
    repetitions: "Daily practice",
    icon: Footprints,
    tags: ["Mobility", "Gait Training", "Sasquatch Method"],
    progress: 0,
  },
  {
    id: 6,
    name: "Walking Exercises",
    description: "From first steps with a walker to independent walking. Progressive walking protocols with distance and speed targets.",
    category: "lower-body",
    difficulty: "Beginner",
    duration: "20-40 min",
    repetitions: "Distance based",
    icon: Move,
    tags: ["Walking", "Independence", "Cardio"],
    progress: 0,
  },
  {
    id: 7,
    name: "Balance Training",
    description: "Static and dynamic balance exercises to prevent falls and build confidence. Progress from seated to standing to single-leg work.",
    category: "lower-body",
    difficulty: "Intermediate",
    duration: "15-20 min",
    repetitions: "Hold 30-60 seconds",
    icon: Scale,
    tags: ["Balance", "Fall Prevention", "Stability"],
    progress: 0,
  },
  {
    id: 8,
    name: "Leg Strengthening",
    description: "Build lower body power with squats, leg raises, and resistance exercises. Essential for standing, walking, and climbing stairs.",
    category: "lower-body",
    difficulty: "Intermediate",
    duration: "25-35 min",
    repetitions: "3 sets of 10 reps",
    icon: Activity,
    tags: ["Strength", "Lower Body", "Functional"],
    progress: 0,
  },
  {
    id: 9,
    name: "Brain Training Exercises",
    description: "Cognitive exercises to sharpen mental acuity. Pattern recognition, problem-solving challenges, and attention training.",
    category: "cognitive",
    difficulty: "All Levels",
    duration: "15-30 min",
    icon: Brain,
    tags: ["Cognition", "Mental Fitness", "Daily Practice"],
    progress: 0,
  },
  {
    id: 10,
    name: "Memory Games",
    description: "Fun memory exercises including card matching, sequence recall, and name-face association. Keep your brain sharp and active.",
    category: "cognitive",
    difficulty: "Beginner",
    duration: "10-20 min",
    icon: Puzzle,
    tags: ["Memory", "Fun", "Brain Games"],
    progress: 0,
  },
  {
    id: 11,
    name: "Focus Techniques",
    description: "Concentration and attention exercises. Mindfulness practices, sustained attention tasks, and distraction management strategies.",
    category: "cognitive",
    difficulty: "Intermediate",
    duration: "15-25 min",
    icon: Lightbulb,
    tags: ["Focus", "Attention", "Mindfulness"],
    progress: 0,
  },
  {
    id: 12,
    name: "Speech Therapy Tips",
    description: "Self-practice techniques for speech improvement. Tongue exercises, word articulation drills, and conversation strategies.",
    category: "cognitive",
    difficulty: "All Levels",
    duration: "20-30 min",
    icon: MessageCircle,
    tags: ["Speech", "Communication", "Articulation"],
    progress: 0,
  },
  {
    id: 13,
    name: "Dressing Techniques",
    description: "One-handed dressing strategies and adaptive techniques. Learn efficient methods for buttons, zippers, and shoe tying.",
    category: "daily-living",
    difficulty: "Beginner",
    duration: "Practice daily",
    icon: Shirt,
    tags: ["Independence", "Self-Care", "Adaptive"],
    progress: 0,
  },
  {
    id: 14,
    name: "Eating Adaptations",
    description: "Adaptive utensil techniques and eating strategies. One-handed cutting, plate guards, and safe swallowing practices.",
    category: "daily-living",
    difficulty: "All Levels",
    duration: "Every meal",
    icon: UtensilsCrossed,
    tags: ["Eating", "Independence", "Safety"],
    progress: 0,
  },
  {
    id: 15,
    name: "Bathroom Safety",
    description: "Safe bathroom navigation including grab bar usage, shower bench techniques, and toileting independence strategies.",
    category: "daily-living",
    difficulty: "Beginner",
    duration: "Practice daily",
    icon: ShowerHead,
    tags: ["Safety", "Bathroom", "Independence"],
    progress: 0,
  },
  {
    id: 16,
    name: "Kitchen Modifications",
    description: "Adaptive kitchen techniques for meal preparation. One-handed cooking, jar opening strategies, and safety modifications.",
    category: "daily-living",
    difficulty: "Intermediate",
    duration: "30-60 min",
    icon: ChefHat,
    tags: ["Cooking", "Independence", "Adaptive Equipment"],
    progress: 0,
  },
];

const categories = [
  { id: "all" as const, label: "All Protocols", icon: Grid3X3, count: exercises.length },
  { id: "upper-body" as const, label: "Upper Body", icon: Hand, count: exercises.filter(e => e.category === "upper-body").length },
  { id: "lower-body" as const, label: "Lower Body", icon: Footprints, count: exercises.filter(e => e.category === "lower-body").length },
  { id: "cognitive" as const, label: "Cognitive", icon: Brain, count: exercises.filter(e => e.category === "cognitive").length },
  { id: "daily-living" as const, label: "Daily Living", icon: Home, count: exercises.filter(e => e.category === "daily-living").length },
];

const stats = [
  { label: "Battle-Tested Protocols", value: "16+", icon: Target },
  { label: "Categories Covered", value: "4", icon: Grid3X3 },
  { label: "Years of Experience", value: "6+", icon: Award },
  { label: "Recovery Rate", value: "90%", icon: Zap },
];

function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case "Beginner":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "Intermediate":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "Advanced":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "All Levels":
      return "bg-primary/20 text-primary border-primary/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const Icon = exercise.icon;
  
  return (
    <article data-testid={`card-exercise-${exercise.id}`}>
      <Card className="h-full flex flex-col hover-elevate overflow-visible group">
        <CardContent className="flex flex-col h-full pt-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs flex-shrink-0 ${getDifficultyColor(exercise.difficulty)}`}
            >
              {exercise.difficulty}
            </Badge>
          </div>
          
          <h3 
            className="font-semibold text-lg text-foreground mb-2"
            data-testid={`text-exercise-name-${exercise.id}`}
          >
            {exercise.name}
          </h3>
          
          <p 
            className="text-sm text-muted-foreground mb-4 flex-1"
            data-testid={`text-exercise-description-${exercise.id}`}
          >
            {exercise.description}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-4">
            {exercise.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 gap-2">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
              {exercise.duration}
            </span>
            {exercise.repetitions && (
              <span className="text-xs truncate">{exercise.repetitions}</span>
            )}
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Your Progress</span>
              <span className="font-medium text-foreground">{exercise.progress}%</span>
            </div>
            <Progress 
              value={exercise.progress} 
              className="h-2" 
              aria-label={`Progress: ${exercise.progress}%`} 
            />
          </div>
          
          <Link href="/academy">
            <Button 
              className="w-full gap-2" 
              variant="secondary"
              data-testid={`button-learn-more-${exercise.id}`}
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Learn More
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </article>
  );
}

function CategoryFilter({ 
  selectedCategory, 
  onSelectCategory 
}: { 
  selectedCategory: Category; 
  onSelectCategory: (category: Category) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center" role="tablist" aria-label="Exercise categories">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selectedCategory === cat.id;
        
        return (
          <Button
            key={cat.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectCategory(cat.id)}
            className={`gap-2 ${isSelected ? "" : "text-muted-foreground"}`}
            role="tab"
            aria-selected={isSelected}
            data-testid={`button-category-${cat.id}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{cat.label}</span>
            <Badge 
              variant="secondary" 
              className={`text-xs ${isSelected ? "bg-primary-foreground/20 text-primary-foreground" : ""}`}
            >
              {cat.count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}

export default function SurvivalGrid() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  
  const filteredExercises = selectedCategory === "all" 
    ? exercises 
    : exercises.filter(e => e.category === selectedCategory);
  
  const completedCount = exercises.filter(e => e.progress === 100).length;
  const totalProgress = Math.round(exercises.reduce((acc, e) => acc + e.progress, 0) / exercises.length);

  useEffect(() => {
    document.title = "Survival Grid - Your Arsenal of Recovery Tools | StrokeRecoveryAcademy.com";
    
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
      "Access battle-tested stroke recovery exercises and protocols from Nick Kremers. Upper body, lower body, cognitive, and daily living skills training - your complete survival kit for stroke recovery."
    );

    updateOrCreateLink("canonical", "https://strokerecoveryacademy.com/survival-grid");

    updateOrCreateMeta(
      "og:title",
      "Survival Grid - Battle-Tested Recovery Protocols | Stroke Recovery OS",
      true
    );
    updateOrCreateMeta(
      "og:description",
      "Your arsenal of recovery tools. Access proven exercises for upper body, lower body, cognitive function, and daily living skills from The Stroked Out Sasquatch.",
      true
    );
    updateOrCreateMeta("og:type", "website", true);
    updateOrCreateMeta("og:url", "https://strokerecoveryacademy.com/survival-grid", true);
    updateOrCreateMeta("og:site_name", "StrokeRecoveryAcademy.com", true);

    updateOrCreateMeta("twitter:card", "summary_large_image");
    updateOrCreateMeta(
      "twitter:title",
      "Survival Grid - Your Arsenal of Recovery Tools"
    );
    updateOrCreateMeta(
      "twitter:description",
      "Battle-tested stroke recovery protocols covering upper body, lower body, cognitive function, and daily living skills."
    );

    updateOrCreateMeta(
      "keywords",
      "stroke recovery exercises, stroke rehabilitation protocols, mirror therapy, drop foot protocol, stroke survivor exercises, physical therapy, cognitive recovery, daily living skills, Nick Kremers"
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <section 
          className="relative py-20 overflow-hidden"
          aria-labelledby="survival-grid-hero-title"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-primary border-primary">
                <Grid3X3 className="h-3 w-3 mr-1" aria-hidden="true" />
                The Sasquatch Survival System
              </Badge>
              
              <h1 
                id="survival-grid-hero-title"
                className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 uppercase tracking-tight"
                data-testid="text-survival-grid-title"
              >
                Survival{" "}
                <span className="text-primary">Grid</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Your Arsenal of Recovery Tools — Battle-tested exercises and protocols 
                that took Nick from wheelchair to walking. Every technique proven in the 
                trenches of real recovery.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <Button size="lg" className="gap-2" data-testid="button-start-training">
                  <Zap className="h-5 w-5" aria-hidden="true" />
                  Start Training
                </Button>
                <Link href="/builder">
                  <Button size="lg" variant="outline" className="gap-2" data-testid="button-build-routine">
                    <Target className="h-5 w-5" aria-hidden="true" />
                    Build Your Routine
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <stat.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>
                      <strong className="text-foreground">{stat.value}</strong> {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 border-b border-border" aria-label="Progress overview">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Arsenal Progress</p>
                  <p className="text-2xl font-bold text-foreground">
                    {completedCount} / {exercises.length} Protocols Mastered
                  </p>
                </div>
              </div>
              
              <div className="w-full md:w-64">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-semibold text-primary">{totalProgress}%</span>
                </div>
                <Progress 
                  value={totalProgress} 
                  className="h-3" 
                  aria-label={`Overall progress: ${totalProgress}%`} 
                />
              </div>
            </div>
          </div>
        </section>

        <section 
          className="py-12"
          aria-labelledby="exercises-section-title"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 
                id="exercises-section-title"
                className="text-3xl font-bold text-foreground mb-4"
                data-testid="text-exercises-section-title"
              >
                Recovery Protocols
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Filter by category to find the exercises that match your recovery goals. 
                Each protocol is designed to be practiced regularly for maximum results.
              </p>
              
              <CategoryFilter 
                selectedCategory={selectedCategory} 
                onSelectCategory={setSelectedCategory} 
              />
            </div>
            
            <div 
              className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8"
              role="tabpanel"
              aria-label={`${categories.find(c => c.id === selectedCategory)?.label} exercises`}
            >
              {filteredExercises.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
            
            {filteredExercises.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No exercises found in this category.</p>
              </div>
            )}
          </div>
        </section>

        <section 
          className="py-16 bg-card/30"
          aria-labelledby="cta-title"
        >
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardContent className="py-12 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <h2 
                  id="cta-title"
                  className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                >
                  Ready to Build Your Custom Routine?
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                  Use our Mission Builder to create a personalized recovery plan combining 
                  your favorite protocols from the Survival Grid. Train like a warrior.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/builder">
                    <Button size="lg" className="gap-2" data-testid="button-mission-builder">
                      <Zap className="h-5 w-5" aria-hidden="true" />
                      Mission Builder
                    </Button>
                  </Link>
                  <Link href="/academy">
                    <Button size="lg" variant="outline" className="gap-2" data-testid="button-explore-academy">
                      Explore Academy
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
