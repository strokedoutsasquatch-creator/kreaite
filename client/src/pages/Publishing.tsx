import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  PenTool, 
  BookOpen, 
  ImagePlus, 
  Layout, 
  GraduationCap, 
  DollarSign,
  ArrowRight,
  Plus,
  FileText,
  Calendar,
  Sparkles,
  Edit3,
  Rocket,
  Lightbulb
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PublishingProject } from "@shared/schema";
import { format } from "date-fns";
import publishingLogo from "@assets/Logo Transparent BG_1764273996198.png";

const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  subtitle: z.string().max(300, "Subtitle too long").optional(),
  description: z.string().max(2000, "Description too long").optional(),
  genre: z.string().optional(),
  targetAudience: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

const genres = [
  { value: "memoir", label: "Memoir" },
  { value: "self-help", label: "Self-Help" },
  { value: "health", label: "Health & Wellness" },
  { value: "biography", label: "Biography" },
  { value: "motivational", label: "Motivational" },
  { value: "educational", label: "Educational" },
  { value: "fiction", label: "Fiction" },
  { value: "other", label: "Other" },
];

const audiences = [
  { value: "stroke-survivors", label: "Stroke Survivors" },
  { value: "caregivers", label: "Caregivers & Family" },
  { value: "healthcare", label: "Healthcare Professionals" },
  { value: "general", label: "General Audience" },
  { value: "patients", label: "Patients & Families" },
  { value: "researchers", label: "Researchers" },
];

const features = [
  {
    icon: PenTool,
    title: "AI Ghostwriting",
    description: "Let AI help draft chapters",
  },
  {
    icon: BookOpen,
    title: "Chapter Organizer",
    description: "Structure your book visually",
  },
  {
    icon: ImagePlus,
    title: "Image Generation",
    description: "Create illustrations with AI",
  },
  {
    icon: Layout,
    title: "Auto-Formatting",
    description: "Professional layouts automatically",
  },
  {
    icon: GraduationCap,
    title: "Course Builder",
    description: "Turn chapters into courses",
  },
  {
    icon: DollarSign,
    title: "Marketplace Sales",
    description: "Sell and earn revenue",
  },
];

const steps = [
  {
    step: 1,
    title: "Write",
    description: "AI helps you draft and refine",
    icon: Edit3,
  },
  {
    step: 2,
    title: "Build",
    description: "Convert content to courses",
    icon: Rocket,
  },
  {
    step: 3,
    title: "Sell",
    description: "Publish to marketplace and earn",
    icon: DollarSign,
  },
];

function getStatusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "draft":
      return "secondary";
    case "writing":
      return "default";
    case "editing":
      return "outline";
    case "review":
      return "outline";
    case "published":
      return "default";
    default:
      return "secondary";
  }
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function ProjectCard({ project }: { project: PublishingProject }) {
  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all"
      data-testid={`card-project-${project.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate" data-testid={`text-project-title-${project.id}`}>
              {project.title}
            </CardTitle>
            {project.subtitle && (
              <CardDescription className="mt-1 truncate">
                {project.subtitle}
              </CardDescription>
            )}
          </div>
          <Badge variant={getStatusBadgeVariant(project.status)} data-testid={`badge-status-${project.id}`}>
            {formatStatus(project.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5" data-testid={`text-wordcount-${project.id}`}>
            <FileText className="h-4 w-4" />
            <span>{project.wordCount.toLocaleString()} words</span>
          </div>
          <div className="flex items-center gap-1.5" data-testid={`text-chapters-${project.id}`}>
            <BookOpen className="h-4 w-4" />
            <span>{project.chapterCount} chapters</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground" data-testid={`text-lastEdited-${project.id}`}>
          <Calendar className="h-3.5 w-3.5" />
          <span>Last edited {format(new Date(project.updatedAt), "MMM d, yyyy")}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateProjectDialog({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  
  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      genre: "",
      targetAudience: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      const response = await apiRequest("POST", "/api/publishing/projects", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publishing/projects"] });
      toast({
        title: "Project created",
        description: "Your new book project has been created successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create project",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateProjectForm) => {
    createProjectMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-create-project">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Start your book writing journey. Fill in the details to begin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="My Recovery Story" 
                      data-testid="input-project-title"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="A Journey of Hope and Healing" 
                      data-testid="input-project-subtitle"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what your book is about..."
                      className="resize-none"
                      rows={3}
                      data-testid="input-project-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-genre">
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {genres.map((genre) => (
                          <SelectItem key={genre.value} value={genre.value}>
                            {genre.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-audience">
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {audiences.map((audience) => (
                          <SelectItem key={audience.value} value={audience.value}>
                            {audience.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-project"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createProjectMutation.isPending}
                data-testid="button-submit-project"
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function MyProjectsSection() {
  const { isAuthenticated } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: projects, isLoading } = useQuery<PublishingProject[]>({
    queryKey: ["/api/publishing/projects"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" data-testid="section-my-projects">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">My Projects</h2>
            <p className="text-muted-foreground mt-1">Your book writing projects</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-create-project">
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3 mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12" data-testid="empty-projects-state">
            <CardContent className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Your recovery story deserves to be told. Start your first book project and let AI help you write your legacy.
              </p>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-start-first-project">
                <Plus className="h-4 w-4 mr-2" />
                Start Your First Project
              </Button>
            </CardContent>
          </Card>
        )}

        <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </section>
  );
}

function HeroSection() {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features-section");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="flex justify-center mb-8">
          <img 
            src={publishingLogo} 
            alt="Stroke Lyfe Publishing" 
            className="h-32 md:h-40 w-auto"
            data-testid="img-publishing-logo"
          />
        </div>
        
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight"
          data-testid="text-hero-headline"
        >
          Turn Your Recovery Story Into a Legacy
        </h1>
        
        <p 
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          data-testid="text-hero-subheadline"
        >
          AI-powered book writing studio with ghostwriting assistance and course builder
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="min-w-[160px]" data-testid="button-start-writing">
            <Sparkles className="h-5 w-5 mr-2" />
            Start Writing
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="min-w-[160px]"
            onClick={scrollToFeatures}
            data-testid="button-learn-more"
          >
            Learn More
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30" data-testid="section-features">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need to Publish
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful tools to help you write, format, and sell your story
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="hover-elevate transition-all"
              data-testid={`card-feature-${index}`}
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" data-testid="section-how-it-works">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three simple steps to publish your story and build income
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center" data-testid={`step-${step.step}`}>
              <div className="relative inline-flex">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-6 mx-auto">
                  <step.icon className="h-10 w-10 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                  {step.step}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                  <ArrowRight className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Publishing() {
  useEffect(() => {
    document.title = "Publishing Studio - Stroke Lyfe Publishing | StrokeRecoveryAcademy.com";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Turn your recovery story into a legacy with Stroke Lyfe Publishing. AI-powered book writing studio with ghostwriting assistance and course builder for stroke survivors.");
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = "Turn your recovery story into a legacy with Stroke Lyfe Publishing. AI-powered book writing studio with ghostwriting assistance and course builder for stroke survivors.";
      document.head.appendChild(meta);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:title");
      meta.content = "Publishing Studio - Stroke Lyfe Publishing";
      document.head.appendChild(meta);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "og:description");
      meta.content = "AI-powered book writing studio with ghostwriting assistance and course builder for stroke survivors.";
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <CreatorHeader />
      <main>
        <HeroSection />
        <MyProjectsSection />
        <FeaturesSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}
