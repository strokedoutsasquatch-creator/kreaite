import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import {
  Zap,
  BookOpen,
  Music,
  GraduationCap,
  Image,
  Mic,
  Sparkles,
  ArrowRight,
  Loader2,
  Download,
  Play,
  Palette,
  FileText,
  Wand2,
} from "lucide-react";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: typeof Zap;
  category: string;
  placeholder: string;
  outputType: string;
}

const quickActions: QuickAction[] = [
  {
    id: "instant-cover",
    title: "1-Click Book Cover",
    description: "Enter your title, get 5 professional covers in 30 seconds",
    icon: Palette,
    category: "book",
    placeholder: "Enter your book title...",
    outputType: "images",
  },
  {
    id: "hum-to-song",
    title: "Hum to Song",
    description: "Record a melody, AI creates a full professional track",
    icon: Music,
    category: "music",
    placeholder: "Describe your melody or click record...",
    outputType: "audio",
  },
  {
    id: "instant-course",
    title: "Instant Course Outline",
    description: "Paste content, get structured course with quizzes",
    icon: GraduationCap,
    category: "course",
    placeholder: "Paste your book content or expertise...",
    outputType: "course",
  },
  {
    id: "remove-bg",
    title: "Remove Background",
    description: "Upload image, get transparent PNG instantly",
    icon: Image,
    category: "image",
    placeholder: "Drag & drop image or click to upload",
    outputType: "image",
  },
  {
    id: "voice-clone",
    title: "Clone Your Voice",
    description: "30 seconds of audio = your AI voice forever",
    icon: Mic,
    category: "audio",
    placeholder: "Record 30 seconds of speech...",
    outputType: "voice",
  },
  {
    id: "blog-to-book",
    title: "Blog to Book",
    description: "Turn blog posts into a formatted book instantly",
    icon: BookOpen,
    category: "book",
    placeholder: "Paste your blog URL or content...",
    outputType: "document",
  },
  {
    id: "ai-ghostwrite",
    title: "AI Ghostwriter",
    description: "Describe your book idea, get first chapter in 60 seconds",
    icon: FileText,
    category: "book",
    placeholder: "Describe your book idea, genre, and target audience...",
    outputType: "text",
  },
  {
    id: "social-clips",
    title: "Viral Clip Finder",
    description: "Upload video, AI finds the most shareable moments",
    icon: Sparkles,
    category: "video",
    placeholder: "Upload your video file...",
    outputType: "clips",
  },
];

export default function QuickCreate() {
  const { toast } = useToast();
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>("");

  const generateMutation = useMutation({
    mutationFn: async ({ actionId, input }: { actionId: string; input: string }) => {
      const response = await apiRequest('POST', '/api/quick-create', { actionId, input });
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results || []);
      setGeneratedContent(data.content || "");
      setIsGenerating(false);
      setProgress(100);
      toast({
        title: "Generation Complete!",
        description: data.message || "Your content is ready to download or use.",
      });
    },
    onError: () => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Please try again or check your input.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedAction || !inputValue.trim()) {
      toast({
        title: "Missing Input",
        description: "Please enter your content to generate.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    setProgress(0);
    setResults([]);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return p;
        }
        return p + 10;
      });
    }, 500);

    generateMutation.mutate({ actionId: selectedAction.id, input: inputValue });
  };

  const categories = [
    { id: "all", label: "All", icon: Zap },
    { id: "book", label: "Book", icon: BookOpen },
    { id: "music", label: "Music", icon: Music },
    { id: "image", label: "Image", icon: Image },
    { id: "course", label: "Course", icon: GraduationCap },
  ];

  const [activeCategory, setActiveCategory] = useState("all");
  const filteredActions = activeCategory === "all" 
    ? quickActions 
    : quickActions.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <CreatorHeader />
      
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 px-4">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-6xl mx-auto text-center mb-12">
            <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30" data-testid="badge-quick-create">
              <Zap className="w-3 h-3 mr-1" />
              Quick Create
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white" data-testid="heading-quick-create">
              1-Click
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"> Magic</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-quick-create-subtitle">
              Skip the learning curve. Professional results in seconds.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
              <TabsList className="bg-zinc-900 border border-orange-500/20 mx-auto w-fit">
                {categories.map(cat => (
                  <TabsTrigger 
                    key={cat.id} 
                    value={cat.id}
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-black gap-2"
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {filteredActions.map((action) => {
                const ActionIcon = action.icon;
                const isSelected = selectedAction?.id === action.id;
                
                return (
                  <Card 
                    key={action.id}
                    className={`cursor-pointer transition-all hover-elevate bg-zinc-900 border-zinc-800 ${
                      isSelected ? 'border-orange-500 ring-2 ring-orange-500/20' : ''
                    }`}
                    onClick={() => {
                      setSelectedAction(action);
                      setInputValue("");
                      setResults([]);
                    }}
                    data-testid={`card-action-${action.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3">
                        <ActionIcon className="w-6 h-6 text-orange-500" />
                      </div>
                      <CardTitle className="text-lg text-white">{action.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {action.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {selectedAction && (
              <Card className="bg-zinc-900 border-orange-500/30" data-testid="card-action-input">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <selectedAction.icon className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">{selectedAction.title}</CardTitle>
                      <CardDescription>{selectedAction.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedAction.id === "hum-to-song" || selectedAction.id === "voice-clone" ? (
                    <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-orange-500/30 rounded-lg">
                      <Mic className="w-12 h-12 text-orange-500" />
                      <Button className="bg-orange-500 hover:bg-orange-600 text-black gap-2">
                        <Mic className="w-4 h-4" />
                        Start Recording
                      </Button>
                      <p className="text-sm text-muted-foreground">Or describe what you want:</p>
                      <Textarea
                        placeholder={selectedAction.placeholder}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                        data-testid="textarea-quick-input"
                      />
                    </div>
                  ) : selectedAction.id === "remove-bg" ? (
                    <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-orange-500/30 rounded-lg">
                      <Image className="w-12 h-12 text-orange-500" />
                      <Button className="bg-orange-500 hover:bg-orange-600 text-black gap-2">
                        <Image className="w-4 h-4" />
                        Upload Image
                      </Button>
                      <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                    </div>
                  ) : (
                    <Textarea
                      placeholder={selectedAction.placeholder}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 min-h-[150px]"
                      data-testid="textarea-quick-input"
                    />
                  )}

                  {isGenerating && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Generating...</span>
                        <span className="text-orange-500">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {generatedContent && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-orange-500" />
                          Generated Content
                        </h3>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-orange-500/30 gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedContent);
                            toast({ title: "Copied!", description: "Content copied to clipboard" });
                          }}
                          data-testid="button-copy-content"
                        >
                          <Download className="w-3 h-3" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-zinc-900 border border-orange-500/20 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans" data-testid="text-generated-content">
                          {generatedContent}
                        </pre>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Saved to Asset Library
                        </Badge>
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          {selectedAction?.category?.toUpperCase()} Studio Ready
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      className="border-orange-500/30"
                      onClick={() => {
                        setSelectedAction(null);
                        setInputValue("");
                        setResults([]);
                        setGeneratedContent("");
                        setProgress(0);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-black gap-2"
                      onClick={handleGenerate}
                      disabled={isGenerating || !inputValue.trim()}
                      data-testid="button-generate"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Generate Now
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="py-16 px-4 bg-zinc-950">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Want More Control?
            </h2>
            <p className="text-muted-foreground mb-8">
              Quick Create is perfect for fast results. For full creative control, 
              visit our professional studios.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" className="border-orange-500/30 gap-2" asChild>
                <a href="/book-studio">
                  <BookOpen className="w-4 h-4" />
                  Book Studio
                </a>
              </Button>
              <Button variant="outline" className="border-orange-500/30 gap-2" asChild>
                <a href="/music-studio">
                  <Music className="w-4 h-4" />
                  Music Studio
                </a>
              </Button>
              <Button variant="outline" className="border-orange-500/30 gap-2" asChild>
                <a href="/course-studio">
                  <GraduationCap className="w-4 h-4" />
                  Course Studio
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
