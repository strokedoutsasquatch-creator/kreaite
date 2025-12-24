import { useEffect } from "react";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  GraduationCap, 
  Target, 
  Zap, 
  Users, 
  Award,
  Clock,
  Play,
  ArrowRight,
  Brain,
  Dumbbell,
  Footprints,
  Heart
} from "lucide-react";
import mirrorTherapyImage from "@assets/generated_images/mirror_therapy_exercise.png";
import baseballBatImage from "@assets/generated_images/baseball_bat_therapy_equipment.png";
import dropFootImage from "@assets/generated_images/drop_foot_recovery_protocol.png";

const books = [
  {
    id: 1,
    title: "The Stroked Out Sasquatch",
    author: "Nick Kremers",
    description: "Nick's raw, unfiltered personal journey from catastrophic stroke to 90% recovery. Learn the mindset of a warrior and the 'Sasquatch Method' that combines tough love with compassion.",
    topics: ["Personal Journey", "Mindset & Perseverance", "The Sasquatch Method", "Tough Love Recovery"],
    gradient: "from-orange-600 via-orange-500 to-amber-500",
    chapters: 12,
    duration: "6+ hours",
    status: "coming-soon" as const,
    progress: 0,
  },
  {
    id: 2,
    title: "The Ultimate Stroke Recovery Bible",
    author: "Nick Kremers",
    description: "The comprehensive guide to stroke recovery protocols and techniques. Evidence-based methods combined with patient-driven innovation from years of real-world recovery experience.",
    topics: ["Mirror Therapy", "Baseball Bat Therapy", "Drop Foot Protocol", "Neuroplasticity Exercises"],
    gradient: "from-primary via-orange-500 to-red-600",
    chapters: 24,
    duration: "12+ hours",
    status: "coming-soon" as const,
    progress: 0,
  },
  {
    id: 3,
    title: "Wheeled Out",
    author: "Nick Kremers",
    description: "Stories and insights from wheelchair to walking. A detailed mobility recovery journey with equipment recommendations and practical usage guides for regaining independence.",
    topics: ["Wheelchair to Walking", "Mobility Recovery", "Equipment Guides", "Independence Training"],
    gradient: "from-amber-500 via-orange-400 to-yellow-500",
    chapters: 16,
    duration: "8+ hours",
    status: "coming-soon" as const,
    progress: 0,
  },
];

const featuredModules = [
  {
    id: 1,
    title: "Mirror Therapy Fundamentals",
    description: "Rewire your brain's motor pathways using mirror box techniques proven to accelerate recovery.",
    image: mirrorTherapyImage,
    duration: "45 min",
    difficulty: "Beginner",
    category: "Neuroplasticity",
  },
  {
    id: 2,
    title: "Baseball Bat Therapy Protocol",
    description: "Build grip strength and arm coordination with Nick's signature bat therapy exercises.",
    image: baseballBatImage,
    duration: "30 min",
    difficulty: "Intermediate",
    category: "Upper Body",
  },
  {
    id: 3,
    title: "Drop Foot Recovery System",
    description: "Targeted exercises and techniques to overcome drop foot and restore natural walking patterns.",
    image: dropFootImage,
    duration: "60 min",
    difficulty: "All Levels",
    category: "Mobility",
  },
];

const benefits = [
  {
    icon: Brain,
    title: "Neuroplasticity-Based",
    description: "Science-backed protocols that leverage your brain's ability to rewire and heal itself.",
  },
  {
    icon: Target,
    title: "Proven Results",
    description: "Developed from Nick's journey from 0% to 90% recovery - methods that actually work.",
  },
  {
    icon: Dumbbell,
    title: "Practical Exercises",
    description: "Step-by-step video demonstrations and exercises you can do at home with minimal equipment.",
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Join 50,000+ stroke warriors sharing their journey and supporting each other.",
  },
  {
    icon: Clock,
    title: "Learn at Your Pace",
    description: "Self-paced courses designed for stroke survivors with built-in rest periods and modifications.",
  },
  {
    icon: Award,
    title: "Track Your Progress",
    description: "Built-in progress tracking to celebrate victories and maintain motivation throughout recovery.",
  },
];

function BookCard({ book }: { book: typeof books[0] }) {
  return (
    <article data-testid={`card-book-${book.id}`}>
      <Card className="h-full flex flex-col hover-elevate overflow-visible">
        <CardHeader className="pb-0">
          <div 
            className={`relative aspect-[3/4] rounded-lg bg-gradient-to-br ${book.gradient} flex items-center justify-center p-6 mb-4`}
            role="img"
            aria-label={`Book cover for ${book.title}`}
          >
            <div className="absolute inset-0 bg-black/20 rounded-lg" />
            <div className="relative text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-white/90" aria-hidden="true" />
              <h3 className="text-xl font-black text-white uppercase tracking-wide leading-tight">
                {book.title}
              </h3>
              <p className="text-sm text-white/80 mt-2">by {book.author}</p>
            </div>
            {book.status === "coming-soon" && (
              <Badge className="absolute top-3 right-3 bg-black/60 text-white border-none">
                Coming Soon
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 space-y-4">
          <div>
            <h4 className="font-semibold text-lg text-foreground mb-2" data-testid={`text-book-title-${book.id}`}>
              {book.title}
            </h4>
            <p className="text-sm text-muted-foreground" data-testid={`text-book-description-${book.id}`}>
              {book.description}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {book.topics.map((topic, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {book.chapters} Chapters
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {book.duration}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Course Progress</span>
              <span className="font-medium text-foreground">{book.progress}%</span>
            </div>
            <Progress value={book.progress} className="h-2" aria-label={`Progress: ${book.progress}%`} />
          </div>
        </CardContent>
        
        <CardFooter className="pt-0">
          <Button 
            className="w-full gap-2" 
            variant={book.status === "coming-soon" ? "secondary" : "default"}
            disabled={book.status === "coming-soon"}
            data-testid={`button-book-${book.id}`}
          >
            {book.status === "coming-soon" ? (
              <>
                <Clock className="h-4 w-4" aria-hidden="true" />
                Coming Soon
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden="true" />
                View Course
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </article>
  );
}

function ModuleCard({ module }: { module: typeof featuredModules[0] }) {
  return (
    <article data-testid={`card-module-${module.id}`}>
      <Card className="h-full hover-elevate overflow-hidden">
        <div className="relative aspect-video">
          <img 
            src={module.image} 
            alt={module.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <Badge className="mb-2">{module.category}</Badge>
            <h4 className="text-white font-semibold">{module.title}</h4>
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
              {module.duration}
            </Badge>
          </div>
        </div>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant="outline">{module.difficulty}</Badge>
            <Button size="sm" variant="ghost" className="gap-1" data-testid={`button-module-preview-${module.id}`}>
              Preview
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

export default function Academy() {
  useEffect(() => {
    document.title = "Stroke Recovery Academy - Learn from Nick Kremers | StrokeRecoveryAcademy.com";
    
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
      "Master stroke recovery with Nick Kremers' comprehensive courses. Learn the Sasquatch Method, Mirror Therapy, Baseball Bat Therapy, and evidence-based protocols that took Nick from 0% to 90% recovery."
    );

    updateOrCreateLink("canonical", "https://strokerecoveryacademy.com/academy");

    updateOrCreateMeta(
      "og:title",
      "Stroke Recovery Academy - Master Recovery with Nick Kremers",
      true
    );
    updateOrCreateMeta(
      "og:description",
      "Comprehensive stroke recovery courses from The Stroked Out Sasquatch. Learn proven protocols, exercises, and mindset techniques from a survivor who achieved 90% recovery.",
      true
    );
    updateOrCreateMeta("og:type", "website", true);
    updateOrCreateMeta("og:url", "https://strokerecoveryacademy.com/academy", true);
    updateOrCreateMeta("og:site_name", "StrokeRecoveryAcademy.com", true);

    updateOrCreateMeta("twitter:card", "summary_large_image");
    updateOrCreateMeta(
      "twitter:title",
      "Stroke Recovery Academy - Learn from Nick Kremers"
    );
    updateOrCreateMeta(
      "twitter:description",
      "Master stroke recovery with comprehensive courses covering the Sasquatch Method, neuroplasticity exercises, and proven recovery protocols."
    );

    updateOrCreateMeta(
      "keywords",
      "stroke recovery courses, stroke rehabilitation, Nick Kremers, Sasquatch Method, mirror therapy, neuroplasticity, stroke survivor, recovery training, stroke education"
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <CreatorHeader />
      
      <main>
        <section 
          className="relative py-20 overflow-hidden"
          aria-labelledby="academy-hero-title"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 text-primary border-primary">
                <GraduationCap className="h-3 w-3 mr-1" aria-hidden="true" />
                The Sasquatch Learning System
              </Badge>
              
              <h1 
                id="academy-hero-title"
                className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 uppercase tracking-tight"
                data-testid="text-academy-title"
              >
                Stroke Recovery{" "}
                <span className="text-primary">Academy</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Master the art of recovery with comprehensive courses developed by Nick Kremers - 
                The Stroked Out Sasquatch. From 0% to 90% recovery, these are the exact methods 
                that changed everything.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <Button size="lg" className="gap-2" data-testid="button-browse-courses">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                  Browse Courses
                </Button>
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-free-preview">
                  <Play className="h-5 w-5" aria-hidden="true" />
                  Free Preview
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>50,000+ Warriors</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>3 Comprehensive Courses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Proven 90% Recovery</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section 
          className="py-16 bg-card/30"
          aria-labelledby="courses-title"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 
                id="courses-title" 
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                data-testid="text-courses-section-title"
              >
                Recovery Courses by Nick Kremers
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Each course is packed with real-world experience, practical exercises, 
                and the mindset shifts you need to write your own comeback story.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>

        <section 
          className="py-16"
          aria-labelledby="modules-title"
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
              <div>
                <h2 
                  id="modules-title"
                  className="text-3xl font-bold text-foreground mb-2"
                  data-testid="text-modules-section-title"
                >
                  Featured Recovery Modules
                </h2>
                <p className="text-muted-foreground">
                  Preview key techniques from our comprehensive courses
                </p>
              </div>
              <Button variant="outline" className="gap-2" data-testid="button-view-all-modules">
                View All Modules
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredModules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </div>
        </section>

        <section 
          className="py-16 bg-card/30"
          aria-labelledby="benefits-title"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Zap className="h-3 w-3 mr-1" aria-hidden="true" />
                Why Warriors Choose Us
              </Badge>
              <h2 
                id="benefits-title"
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                data-testid="text-benefits-section-title"
              >
                Why Choose Our Academy
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built by a stroke survivor, for stroke survivors. Every lesson is battle-tested 
                and designed for real-world recovery success.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card key={index} className="hover-elevate">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                      <benefit.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section 
          className="py-20"
          aria-labelledby="cta-title"
        >
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardContent className="py-12 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <h2 
                  id="cta-title"
                  className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                >
                  Ready to Start Your Recovery Journey?
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                  Join thousands of stroke warriors who are proving the impossible, one rep at a time. 
                  Get notified when our courses launch and receive exclusive early-bird pricing.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="gap-2" data-testid="button-join-waitlist">
                    <Zap className="h-5 w-5" aria-hidden="true" />
                    Join the Waitlist
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2" data-testid="button-learn-more">
                    Learn More About Nick
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
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
