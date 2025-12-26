import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Baby,
  BookOpen,
  Sparkles,
  Palette,
  Users,
  Heart,
  Star,
  Zap,
  Wand2,
  Eye,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Image,
  RefreshCw,
  Check,
  Loader2,
  BookMarked,
  GraduationCap,
  Music,
  Volume2,
  VolumeX,
  Edit3,
  Save,
  Layout,
  FileText,
  Download,
  Printer,
  FileImage,
  Square,
  RectangleHorizontal,
  RectangleVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { 
  AgeBand, 
  ChildBookTheme, 
  IllustrationStyle, 
  EducationalTag,
  ChildBookCharacter,
  ChildBookSpread,
} from "@shared/schema";

// Age band configurations with detailed info
const ageBandOptions: { value: AgeBand; label: string; icon: any; description: string; wordRange: string; pageCount: string }[] = [
  { value: "board-book", label: "Board Book", icon: Baby, description: "Ages 0-3: Simple concepts, few words", wordRange: "50-200 words", pageCount: "12 pages" },
  { value: "picture-book", label: "Picture Book", icon: BookOpen, description: "Ages 4-8: Illustrated stories", wordRange: "500-1000 words", pageCount: "32 pages" },
  { value: "early-reader", label: "Early Reader", icon: Star, description: "Ages 5-7: Learning to read", wordRange: "200-1500 words", pageCount: "24 pages" },
  { value: "chapter-book", label: "Chapter Book", icon: BookMarked, description: "Ages 7-10: Short chapters", wordRange: "4000-15000 words", pageCount: "80 pages" },
  { value: "middle-grade", label: "Middle Grade", icon: GraduationCap, description: "Ages 8-12: Complex stories", wordRange: "20000-50000 words", pageCount: "200 pages" },
];

// Theme options
const themeOptions: { value: ChildBookTheme; label: string; icon: any }[] = [
  { value: "friendship", label: "Friendship", icon: Users },
  { value: "kindness", label: "Kindness", icon: Heart },
  { value: "courage", label: "Courage", icon: Zap },
  { value: "honesty", label: "Honesty", icon: Check },
  { value: "sharing", label: "Sharing", icon: Users },
  { value: "perseverance", label: "Perseverance", icon: Star },
  { value: "self-confidence", label: "Self-Confidence", icon: Sparkles },
  { value: "empathy", label: "Empathy", icon: Heart },
  { value: "family-love", label: "Family Love", icon: Heart },
  { value: "accepting-differences", label: "Accepting Differences", icon: Users },
  { value: "handling-emotions", label: "Handling Emotions", icon: Heart },
  { value: "trying-new-things", label: "Trying New Things", icon: Star },
  { value: "problem-solving", label: "Problem Solving", icon: Zap },
  { value: "environmental-care", label: "Environmental Care", icon: Star },
  { value: "gratitude", label: "Gratitude", icon: Heart },
  { value: "patience", label: "Patience", icon: Check },
  { value: "teamwork", label: "Teamwork", icon: Users },
  { value: "creativity", label: "Creativity", icon: Palette },
  { value: "dealing-with-loss", label: "Dealing with Loss", icon: Heart },
  { value: "overcoming-fear", label: "Overcoming Fear", icon: Zap },
];

// Illustration style options
const illustrationStyleOptions: { value: IllustrationStyle; label: string; description: string }[] = [
  { value: "whimsical-watercolor", label: "Whimsical Watercolor", description: "Soft, dreamy, flowing colors" },
  { value: "bold-cartoon", label: "Bold Cartoon", description: "Bright, fun, exaggerated features" },
  { value: "soft-pastel", label: "Soft Pastel", description: "Gentle, soothing colors" },
  { value: "digital-modern", label: "Digital Modern", description: "Clean, contemporary style" },
  { value: "classic-storybook", label: "Classic Storybook", description: "Traditional illustration feel" },
  { value: "collage-mixed-media", label: "Collage/Mixed Media", description: "Textured, layered look" },
  { value: "minimalist-nordic", label: "Minimalist Nordic", description: "Simple, clean Scandinavian style" },
  { value: "vibrant-tropical", label: "Vibrant Tropical", description: "Rich, colorful, exotic feel" },
  { value: "cozy-handdrawn", label: "Cozy Hand-drawn", description: "Warm, sketchy, personal feel" },
  { value: "retro-vintage", label: "Retro Vintage", description: "Mid-century modern aesthetic" },
  { value: "anime-influenced", label: "Anime-Influenced", description: "Japanese animation inspired" },
  { value: "realistic-detailed", label: "Realistic Detailed", description: "Lifelike illustrations" },
];

// Educational tags
const educationalTagOptions: { value: EducationalTag; label: string }[] = [
  { value: "social-emotional-learning", label: "Social-Emotional Learning" },
  { value: "early-literacy", label: "Early Literacy" },
  { value: "counting-numbers", label: "Counting & Numbers" },
  { value: "colors-shapes", label: "Colors & Shapes" },
  { value: "alphabet-phonics", label: "Alphabet & Phonics" },
  { value: "rhyming-patterns", label: "Rhyming & Patterns" },
  { value: "vocabulary-building", label: "Vocabulary Building" },
  { value: "science-nature", label: "Science & Nature" },
  { value: "cultural-awareness", label: "Cultural Awareness" },
  { value: "problem-solving-skills", label: "Problem-Solving Skills" },
  { value: "motor-skills", label: "Motor Skills" },
  { value: "sensory-exploration", label: "Sensory Exploration" },
];

// Page layout options
const pageLayoutOptions = [
  { value: "full-bleed-illustration", label: "Full Page Illustration" },
  { value: "illustration-left-text-right", label: "Image Left, Text Right" },
  { value: "illustration-right-text-left", label: "Text Left, Image Right" },
  { value: "text-over-illustration", label: "Text Over Image" },
  { value: "illustration-top-text-bottom", label: "Image Top, Text Bottom" },
  { value: "text-top-illustration-bottom", label: "Text Top, Image Bottom" },
  { value: "centered-vignette", label: "Centered Vignette" },
  { value: "spread-illustration", label: "Two-Page Spread" },
  { value: "text-only", label: "Text Only" },
];

// Print-ready export size options for children's books
const printSizeOptions = [
  { value: "8x8", label: "8\" x 8\"", description: "Square - Most Popular", dimensions: "8 × 8 inches", icon: Square, aspectRatio: "1:1" },
  { value: "8x10", label: "8\" x 10\"", description: "Portrait Standard", dimensions: "8 × 10 inches", icon: RectangleVertical, aspectRatio: "4:5" },
  { value: "8.5x8.5", label: "8.5\" x 8.5\"", description: "Square Large", dimensions: "8.5 × 8.5 inches", icon: Square, aspectRatio: "1:1" },
  { value: "8.5x11", label: "8.5\" x 11\"", description: "Letter Size", dimensions: "8.5 × 11 inches", icon: RectangleVertical, aspectRatio: "17:22" },
  { value: "6x9", label: "6\" x 9\"", description: "Chapter Book", dimensions: "6 × 9 inches", icon: RectangleVertical, aspectRatio: "2:3" },
  { value: "7x10", label: "7\" x 10\"", description: "Large Format", dimensions: "7 × 10 inches", icon: RectangleVertical, aspectRatio: "7:10" },
  { value: "10x8", label: "10\" x 8\"", description: "Landscape Wide", dimensions: "10 × 8 inches", icon: RectangleHorizontal, aspectRatio: "5:4" },
  { value: "11x8.5", label: "11\" x 8.5\"", description: "Landscape Letter", dimensions: "11 × 8.5 inches", icon: RectangleHorizontal, aspectRatio: "22:17" },
];

// Map illustration style to prompt modifiers
const stylePromptMap: Record<IllustrationStyle, string> = {
  "whimsical-watercolor": "whimsical watercolor illustration style, soft flowing colors, dreamy atmosphere, gentle brush strokes",
  "bold-cartoon": "bold cartoon illustration, bright vibrant colors, thick outlines, fun exaggerated features, playful style",
  "soft-pastel": "soft pastel illustration, gentle soothing colors, delicate and calming, sweet aesthetic",
  "digital-modern": "clean modern digital illustration, contemporary style, smooth gradients, polished look",
  "classic-storybook": "classic storybook illustration, traditional picture book art, timeless quality, warm and inviting",
  "collage-mixed-media": "collage mixed media illustration, textured paper elements, layered artistic look, creative composition",
  "minimalist-nordic": "minimalist Scandinavian illustration, simple clean lines, muted palette, understated elegance",
  "vibrant-tropical": "vibrant tropical illustration, rich saturated colors, exotic feel, lush and colorful",
  "cozy-handdrawn": "cozy hand-drawn illustration, warm sketchy lines, personal feel, charming imperfections",
  "retro-vintage": "retro vintage illustration, mid-century modern aesthetic, nostalgic color palette, classic charm",
  "anime-influenced": "anime-influenced illustration, large expressive eyes, dynamic style, Japanese animation inspired",
  "realistic-detailed": "realistic detailed illustration, lifelike rendering, fine details, naturalistic style",
};

interface ChildrensBookModeProps {
  onStoryGenerated?: (story: any) => void;
  onExport?: (project: any) => void;
}

export default function ChildrensBookMode({ onStoryGenerated, onExport }: ChildrensBookModeProps) {
  const { toast } = useToast();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  
  // Book configuration
  const [ageBand, setAgeBand] = useState<AgeBand>("picture-book");
  const [selectedThemes, setSelectedThemes] = useState<ChildBookTheme[]>([]);
  const [selectedEducationalTags, setSelectedEducationalTags] = useState<EducationalTag[]>([]);
  const [illustrationStyle, setIllustrationStyle] = useState<IllustrationStyle>("whimsical-watercolor");
  const [rhymingMode, setRhymingMode] = useState(false);
  const [targetPageCount, setTargetPageCount] = useState(32);
  
  // Story details
  const [storyPremise, setStoryPremise] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  
  // Character state
  const [characters, setCharacters] = useState<Partial<ChildBookCharacter>[]>([{
    id: "1",
    name: "",
    description: "",
    visualTraits: {
      species: "human",
      age: "child",
      height: "average",
      bodyType: "normal",
      clothingStyle: "casual",
      distinctiveFeatures: [],
    },
    personalityTraits: [],
    role: "protagonist",
    illustrationPrompt: "",
    colorPalette: [],
  }]);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>("1");
  
  // Generated story
  const [generatedStory, setGeneratedStory] = useState<any>(null);
  const [spreads, setSpreads] = useState<Partial<ChildBookSpread>[]>([]);
  
  // Preview state
  const [currentPreviewPage, setCurrentPreviewPage] = useState(0);
  const [isReadAloudMode, setIsReadAloudMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Read-aloud analysis
  const [readAloudAnalysis, setReadAloudAnalysis] = useState<any>(null);
  
  // Export options
  const [selectedPrintSize, setSelectedPrintSize] = useState("8x8");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Illustration generation tracking
  const [generatingSpreadId, setGeneratingSpreadId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Story generation mutation
  const generateStoryMutation = useMutation({
    mutationFn: async () => {
      const mainChar = characters[0];
      if (!mainChar?.name || !storyPremise) {
        throw new Error("Please fill in character name and story premise");
      }
      
      const response = await apiRequest("POST", "/api/books/childrens/generate-story", {
        ageBand,
        themes: selectedThemes,
        educationalTags: selectedEducationalTags.length > 0 ? selectedEducationalTags : undefined,
        mainCharacter: {
          name: mainChar.name,
          species: mainChar.visualTraits?.species || "human",
          traits: mainChar.personalityTraits || ["friendly"],
        },
        storyPremise,
        rhymingMode,
        targetPageCount,
        illustrationStyle,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.story) {
        setGeneratedStory(data.story);
        setBookTitle(data.story.title || bookTitle);
        
        // Convert pages to spreads
        const newSpreads: Partial<ChildBookSpread>[] = data.story.pages?.map((page: any, index: number) => ({
          id: String(index + 1),
          pageNumber: page.pageNumber || index + 1,
          layout: "illustration-left-text-right" as const,
          text: page.text,
          readAloudText: page.readAloudHints,
          illustrationPrompt: page.illustrationDescription,
          characterIds: page.charactersPresent || [],
          emotionalTone: page.emotionalTone,
        })) || [];
        
        setSpreads(newSpreads);
        onStoryGenerated?.(data.story);
        toast({ title: "Story Generated!", description: `Created ${newSpreads.length} pages` });
        setCurrentStep(3);
      }
    },
    onError: (error: any) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    },
  });

  // Character prompt generation
  const generateCharacterPromptMutation = useMutation({
    mutationFn: async (characterId: string) => {
      const character = characters.find(c => c.id === characterId);
      if (!character) throw new Error("Character not found");
      
      const response = await apiRequest("POST", "/api/books/childrens/character-prompt", {
        character,
        illustrationStyle,
      });
      return { characterId, data: await response.json() };
    },
    onSuccess: ({ characterId, data }) => {
      if (data.success && data.characterPrompt) {
        setCharacters(prev => prev.map(c => 
          c.id === characterId 
            ? { 
                ...c, 
                illustrationPrompt: data.characterPrompt.basePrompt,
                colorPalette: data.characterPrompt.colorPalette || [],
              }
            : c
        ));
        toast({ title: "Character Ready", description: "Illustration prompt generated" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  // Read-aloud analysis
  const analyzeReadAloudMutation = useMutation({
    mutationFn: async () => {
      const fullText = spreads.map(s => s.text).join(" ");
      const response = await apiRequest("POST", "/api/books/childrens/read-aloud-analyze", {
        text: fullText,
        ageBand,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setReadAloudAnalysis(data.analysis);
      }
    },
  });

  // Rhyme conversion
  const convertToRhymeMutation = useMutation({
    mutationFn: async (spreadId: string) => {
      const spread = spreads.find(s => s.id === spreadId);
      if (!spread?.text) throw new Error("No text to convert");
      
      const response = await apiRequest("POST", "/api/books/childrens/rhyme-convert", {
        text: spread.text,
        rhymeScheme: "AABB",
        ageBand,
      });
      return { spreadId, data: await response.json() };
    },
    onSuccess: ({ spreadId, data }) => {
      if (data.success && data.rhymingText) {
        setSpreads(prev => prev.map(s => 
          s.id === spreadId ? { ...s, text: data.rhymingText } : s
        ));
        toast({ title: "Converted to Rhyme!" });
      }
    },
  });

  const toggleTheme = (theme: ChildBookTheme) => {
    setSelectedThemes(prev => 
      prev.includes(theme) 
        ? prev.filter(t => t !== theme)
        : prev.length < 3 ? [...prev, theme] : prev
    );
  };

  const toggleEducationalTag = (tag: EducationalTag) => {
    setSelectedEducationalTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCharacter = () => {
    const newId = String(characters.length + 1);
    setCharacters(prev => [...prev, {
      id: newId,
      name: "",
      description: "",
      visualTraits: {
        species: "human",
        age: "child",
        height: "average",
        bodyType: "normal",
        clothingStyle: "casual",
        distinctiveFeatures: [],
      },
      personalityTraits: [],
      role: "supporting",
      illustrationPrompt: "",
      colorPalette: [],
    }]);
    setEditingCharacterId(newId);
  };

  const updateCharacter = (id: string, updates: Partial<ChildBookCharacter>) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updateSpread = (id: string, updates: Partial<ChildBookSpread>) => {
    setSpreads(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const steps = [
    { step: 1, label: "Book Setup", icon: BookOpen },
    { step: 2, label: "Characters", icon: Users },
    { step: 3, label: "Story & Pages", icon: FileText },
    { step: 4, label: "Illustrations", icon: Image },
    { step: 5, label: "Preview & Export", icon: Eye },
  ];

  const editingCharacter = characters.find(c => c.id === editingCharacterId);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Progress Steps */}
      <div className="border-b border-orange-500/20 bg-black/50 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {steps.map((s, i) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  currentStep === s.step 
                    ? "bg-orange-500 text-black" 
                    : currentStep > s.step
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
                data-testid={`step-${s.step}`}
              >
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
                {currentStep > s.step && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Step 1: Book Setup */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Create Your Children's Book</h1>
              <p className="text-muted-foreground">Let's set up your book's foundation</p>
            </div>

            {/* Age Band Selection */}
            <Card className="bg-black border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="w-5 h-5 text-orange-500" />
                  Target Age Group
                </CardTitle>
                <CardDescription>Choose who your book is for</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {ageBandOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setAgeBand(option.value);
                        // Auto-set page count based on age band
                        const pageCountMap = { "board-book": 12, "picture-book": 32, "early-reader": 24, "chapter-book": 80, "middle-grade": 200 };
                        setTargetPageCount(pageCountMap[option.value]);
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        ageBand === option.value
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-border hover:border-orange-500/50"
                      }`}
                      data-testid={`age-band-${option.value}`}
                    >
                      <option.icon className={`w-8 h-8 mb-2 ${ageBand === option.value ? "text-orange-500" : "text-muted-foreground"}`} />
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                      <div className="text-xs text-orange-500 mt-2">{option.wordRange}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Theme Selection */}
            <Card className="bg-black border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-orange-500" />
                  Story Themes & Morals
                </CardTitle>
                <CardDescription>Select up to 3 themes for your story</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {themeOptions.map((theme) => (
                    <Badge
                      key={theme.value}
                      onClick={() => toggleTheme(theme.value)}
                      className={`cursor-pointer py-2 px-3 ${
                        selectedThemes.includes(theme.value)
                          ? "bg-orange-500 text-black hover:bg-orange-600"
                          : "bg-white/5 text-muted-foreground hover:bg-white/10"
                      }`}
                      data-testid={`theme-${theme.value}`}
                    >
                      <theme.icon className="w-3 h-3 mr-1" />
                      {theme.label}
                    </Badge>
                  ))}
                </div>
                {selectedThemes.length > 0 && (
                  <div className="mt-4 p-3 bg-orange-500/10 rounded-lg">
                    <span className="text-sm text-orange-400">Selected: </span>
                    <span className="text-sm">{selectedThemes.map(t => themeOptions.find(o => o.value === t)?.label).join(", ")}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Illustration Style */}
            <Card className="bg-black border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-orange-500" />
                  Illustration Style
                </CardTitle>
                <CardDescription>Choose the visual style for your book</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {illustrationStyleOptions.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setIllustrationStyle(style.value)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        illustrationStyle === style.value
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-border hover:border-orange-500/50"
                      }`}
                      data-testid={`style-${style.value}`}
                    >
                      <div className="font-medium text-sm">{style.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Educational Tags (Optional) */}
            <Card className="bg-black border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-orange-500" />
                  Educational Focus (Optional)
                </CardTitle>
                <CardDescription>Add educational elements to your story</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {educationalTagOptions.map((tag) => (
                    <Badge
                      key={tag.value}
                      onClick={() => toggleEducationalTag(tag.value)}
                      className={`cursor-pointer ${
                        selectedEducationalTags.includes(tag.value)
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-white/5 text-muted-foreground hover:bg-white/10"
                      }`}
                      data-testid={`edu-tag-${tag.value}`}
                    >
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Writing Style */}
            <Card className="bg-black border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-orange-500" />
                  Writing Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Rhyming Text</Label>
                    <p className="text-sm text-muted-foreground">Write the story in rhyming verse</p>
                  </div>
                  <Switch
                    checked={rhymingMode}
                    onCheckedChange={setRhymingMode}
                    data-testid="switch-rhyming"
                  />
                </div>
                
                <div>
                  <Label>Target Page Count: {targetPageCount}</Label>
                  <Slider
                    value={[targetPageCount]}
                    onValueChange={(v) => setTargetPageCount(v[0])}
                    min={8}
                    max={ageBand === "middle-grade" ? 250 : ageBand === "chapter-book" ? 100 : 40}
                    step={2}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={() => setCurrentStep(2)}
                className="bg-orange-500 hover:bg-orange-600 text-black"
                disabled={selectedThemes.length === 0}
                data-testid="button-next-step-1"
              >
                Continue to Characters
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Characters */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Create Your Characters</h1>
                <p className="text-muted-foreground">Design the characters in your story</p>
              </div>
              <Button onClick={addCharacter} variant="outline" data-testid="button-add-character">
                <Plus className="w-4 h-4 mr-2" />
                Add Character
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Character List */}
              <Card className="bg-black border-orange-500/20">
                <CardHeader>
                  <CardTitle>Characters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {characters.map((char, index) => (
                    <button
                      key={char.id}
                      onClick={() => setEditingCharacterId(char.id || null)}
                      className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                        editingCharacterId === char.id
                          ? "bg-orange-500/20 border border-orange-500"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                      data-testid={`character-${char.id}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                        index === 0 ? "bg-orange-500 text-black" : "bg-blue-500 text-white"
                      }`}>
                        {char.name?.[0] || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{char.name || "Unnamed Character"}</div>
                        <div className="text-xs text-muted-foreground capitalize">{char.role}</div>
                      </div>
                      {char.illustrationPrompt && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Character Editor */}
              <Card className="bg-black border-orange-500/20 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Character Details</CardTitle>
                  <CardDescription>Define your character's appearance and personality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingCharacter ? (
                    <>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Character Name</Label>
                          <Input
                            value={editingCharacter.name || ""}
                            onChange={(e) => updateCharacter(editingCharacter.id!, { name: e.target.value })}
                            placeholder="e.g., Luna the Bunny"
                            data-testid="input-character-name"
                          />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Select
                            value={editingCharacter.role}
                            onValueChange={(v: any) => updateCharacter(editingCharacter.id!, { role: v })}
                          >
                            <SelectTrigger data-testid="select-character-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="protagonist">Main Character</SelectItem>
                              <SelectItem value="sidekick">Sidekick/Friend</SelectItem>
                              <SelectItem value="mentor">Mentor/Guide</SelectItem>
                              <SelectItem value="antagonist">Antagonist</SelectItem>
                              <SelectItem value="supporting">Supporting</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Character Description</Label>
                        <Textarea
                          value={editingCharacter.description || ""}
                          onChange={(e) => updateCharacter(editingCharacter.id!, { description: e.target.value })}
                          placeholder="Describe your character's personality, background, and role in the story..."
                          rows={3}
                          data-testid="input-character-description"
                        />
                      </div>

                      {/* Visual Traits */}
                      <div className="border border-border rounded-lg p-4 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Visual Appearance
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <Label>Species</Label>
                            <Select
                              value={editingCharacter.visualTraits?.species || "human"}
                              onValueChange={(v) => updateCharacter(editingCharacter.id!, {
                                visualTraits: { ...editingCharacter.visualTraits, species: v } as any
                              })}
                            >
                              <SelectTrigger data-testid="select-species">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="human">Human</SelectItem>
                                <SelectItem value="bunny">Bunny</SelectItem>
                                <SelectItem value="bear">Bear</SelectItem>
                                <SelectItem value="cat">Cat</SelectItem>
                                <SelectItem value="dog">Dog</SelectItem>
                                <SelectItem value="fox">Fox</SelectItem>
                                <SelectItem value="owl">Owl</SelectItem>
                                <SelectItem value="mouse">Mouse</SelectItem>
                                <SelectItem value="dragon">Dragon</SelectItem>
                                <SelectItem value="unicorn">Unicorn</SelectItem>
                                <SelectItem value="monster">Friendly Monster</SelectItem>
                                <SelectItem value="robot">Robot</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Age</Label>
                            <Select
                              value={editingCharacter.visualTraits?.age || "child"}
                              onValueChange={(v) => updateCharacter(editingCharacter.id!, {
                                visualTraits: { ...editingCharacter.visualTraits, age: v } as any
                              })}
                            >
                              <SelectTrigger data-testid="select-age">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="baby">Baby</SelectItem>
                                <SelectItem value="toddler">Toddler</SelectItem>
                                <SelectItem value="child">Child</SelectItem>
                                <SelectItem value="teen">Teenager</SelectItem>
                                <SelectItem value="adult">Adult</SelectItem>
                                <SelectItem value="elderly">Elderly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Clothing Style</Label>
                            <Input
                              value={editingCharacter.visualTraits?.clothingStyle || ""}
                              onChange={(e) => updateCharacter(editingCharacter.id!, {
                                visualTraits: { ...editingCharacter.visualTraits, clothingStyle: e.target.value } as any
                              })}
                              placeholder="e.g., overalls and a red bow"
                              data-testid="input-clothing"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Distinctive Features</Label>
                          <Input
                            value={editingCharacter.visualTraits?.distinctiveFeatures?.join(", ") || ""}
                            onChange={(e) => updateCharacter(editingCharacter.id!, {
                              visualTraits: { 
                                ...editingCharacter.visualTraits, 
                                distinctiveFeatures: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                              } as any
                            })}
                            placeholder="e.g., big floppy ears, sparkly eyes, missing tooth"
                            data-testid="input-distinctive-features"
                          />
                        </div>
                      </div>

                      {/* Personality Traits */}
                      <div>
                        <Label>Personality Traits (comma-separated)</Label>
                        <Input
                          value={editingCharacter.personalityTraits?.join(", ") || ""}
                          onChange={(e) => updateCharacter(editingCharacter.id!, {
                            personalityTraits: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                          })}
                          placeholder="e.g., curious, brave, kind, a little shy"
                          data-testid="input-personality"
                        />
                      </div>

                      {/* Generate Illustration Prompt */}
                      <Button
                        onClick={() => generateCharacterPromptMutation.mutate(editingCharacter.id!)}
                        disabled={!editingCharacter.name || generateCharacterPromptMutation.isPending}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-black"
                        data-testid="button-generate-character-prompt"
                      >
                        {generateCharacterPromptMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                        ) : (
                          <><Wand2 className="w-4 h-4 mr-2" /> Generate Illustration Prompt</>
                        )}
                      </Button>

                      {editingCharacter.illustrationPrompt && (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="text-sm text-green-400 font-medium mb-1">Illustration Prompt Generated</div>
                          <p className="text-xs text-muted-foreground line-clamp-3">{editingCharacter.illustrationPrompt}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a character to edit
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Story Premise */}
            <Card className="bg-black border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Story Premise
                </CardTitle>
                <CardDescription>What's your story about?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={storyPremise}
                  onChange={(e) => setStoryPremise(e.target.value)}
                  placeholder="Describe your story idea... e.g., 'A shy little bunny named Luna discovers that her unique big ears actually make her special when she uses them to help her friends'"
                  rows={4}
                  data-testid="input-story-premise"
                />
                
                <Button
                  onClick={() => generateStoryMutation.mutate()}
                  disabled={!storyPremise || !characters[0]?.name || generateStoryMutation.isPending}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black"
                  size="lg"
                  data-testid="button-generate-story"
                >
                  {generateStoryMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Your Story...</>
                  ) : (
                    <><Wand2 className="w-5 h-5 mr-2" /> Generate Complete Story</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)} data-testid="button-back-step-2">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={spreads.length === 0}
                className="bg-orange-500 hover:bg-orange-600 text-black"
                data-testid="button-next-step-2"
              >
                Continue to Pages
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Story & Pages */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{bookTitle || "Your Story"}</h1>
                <p className="text-muted-foreground">{spreads.length} pages</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => analyzeReadAloudMutation.mutate()}
                  disabled={analyzeReadAloudMutation.isPending}
                  data-testid="button-analyze-readability"
                >
                  {analyzeReadAloudMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4 mr-2" />}
                  Analyze
                </Button>
              </div>
            </div>

            {/* Read-aloud Analysis */}
            {readAloudAnalysis && (
              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{readAloudAnalysis.wordCount}</div>
                      <div className="text-xs text-muted-foreground">Words</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{readAloudAnalysis.readingTimeFormatted}</div>
                      <div className="text-xs text-muted-foreground">Read Time</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{readAloudAnalysis.avgWordsPerSentence}</div>
                      <div className="text-xs text-muted-foreground">Words/Sentence</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{readAloudAnalysis.syllableCount}</div>
                      <div className="text-xs text-muted-foreground">Syllables</div>
                    </div>
                  </div>
                  {readAloudAnalysis.suggestions?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-500/30">
                      <div className="text-sm text-muted-foreground">
                        {readAloudAnalysis.suggestions.map((s: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-yellow-500">*</span> {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Page Editor */}
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {spreads.map((spread, index) => (
                  <Card key={spread.id} className="bg-black border-border">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Page {spread.pageNumber || index + 1}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Select
                            value={spread.layout || "illustration-left-text-right"}
                            onValueChange={(v: any) => updateSpread(spread.id!, { layout: v })}
                          >
                            <SelectTrigger className="w-48" data-testid={`select-layout-${spread.id}`}>
                              <Layout className="w-4 h-4 mr-2" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {pageLayoutOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!rhymingMode && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => convertToRhymeMutation.mutate(spread.id!)}
                              disabled={convertToRhymeMutation.isPending}
                              data-testid={`button-rhyme-${spread.id}`}
                            >
                              <Music className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Page Text</Label>
                        <Textarea
                          value={spread.text || ""}
                          onChange={(e) => updateSpread(spread.id!, { text: e.target.value })}
                          rows={3}
                          className="mt-1"
                          data-testid={`textarea-page-${spread.id}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Illustration Description</Label>
                        <Textarea
                          value={spread.illustrationPrompt || ""}
                          onChange={(e) => updateSpread(spread.id!, { illustrationPrompt: e.target.value })}
                          rows={2}
                          className="mt-1 text-sm"
                          placeholder="Describe what should be illustrated on this page..."
                          data-testid={`textarea-illustration-${spread.id}`}
                        />
                      </div>
                      {spread.emotionalTone && (
                        <Badge variant="secondary" className="text-xs">
                          Mood: {spread.emotionalTone}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="button-back-step-3">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-orange-500 hover:bg-orange-600 text-black"
                data-testid="button-next-step-3"
              >
                Continue to Illustrations
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Illustrations */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">Generate Illustrations</h1>
              <p className="text-muted-foreground">Create beautiful artwork for each page</p>
            </div>

            <Card className="bg-black border-orange-500/20">
              <CardHeader>
                <CardTitle>Illustration Queue</CardTitle>
                <CardDescription>
                  Style: {illustrationStyleOptions.find(s => s.value === illustrationStyle)?.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {spreads.map((spread, index) => (
                    <Card key={spread.id} className="bg-white/5 border-border">
                      <CardContent className="p-4">
                        <div className="aspect-[4/3] bg-black/50 rounded-lg mb-3 flex items-center justify-center border border-dashed border-border">
                          {spread.illustrationUrl ? (
                            <img src={spread.illustrationUrl} alt={`Page ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <div className="text-center text-muted-foreground">
                              <Image className="w-8 h-8 mx-auto mb-2" />
                              <div className="text-xs">Page {index + 1}</div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {spread.illustrationPrompt || "No description"}
                        </p>
                        <Button
                          size="sm"
                          className="w-full"
                          variant={spread.illustrationUrl ? "outline" : "default"}
                          data-testid={`button-generate-illustration-${spread.id}`}
                        >
                          {spread.illustrationUrl ? (
                            <><RefreshCw className="w-3 h-3 mr-1" /> Regenerate</>
                          ) : (
                            <><Wand2 className="w-3 h-3 mr-1" /> Generate</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)} data-testid="button-back-step-4">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(5)}
                className="bg-orange-500 hover:bg-orange-600 text-black"
                data-testid="button-next-step-4"
              >
                Preview & Export
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Preview & Export */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold">Preview Your Book</h1>
              <p className="text-muted-foreground">{bookTitle}</p>
            </div>

            {/* Flipbook Preview */}
            <Card className="bg-black border-orange-500/20">
              <CardContent className="p-8">
                <div className="max-w-2xl mx-auto">
                  {/* Page Display */}
                  <div className="aspect-[4/3] bg-white rounded-lg shadow-2xl mb-6 p-8 relative overflow-hidden">
                    {spreads[currentPreviewPage] && (
                      <div className="h-full flex flex-col justify-center">
                        <div className="text-center">
                          {spreads[currentPreviewPage].illustrationUrl ? (
                            <img 
                              src={spreads[currentPreviewPage].illustrationUrl} 
                              alt="" 
                              className="max-h-48 mx-auto mb-4 rounded"
                            />
                          ) : (
                            <div className="h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">[Illustration placeholder]</span>
                            </div>
                          )}
                          <p className="text-black text-lg leading-relaxed font-serif">
                            {spreads[currentPreviewPage].text}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-4 right-4 text-gray-400 text-sm">
                      Page {currentPreviewPage + 1} of {spreads.length}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPreviewPage(p => Math.max(0, p - 1))}
                      disabled={currentPreviewPage === 0}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    
                    <div className="flex gap-1">
                      {spreads.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPreviewPage(i)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            currentPreviewPage === i ? "bg-orange-500 w-4" : "bg-white/30"
                          }`}
                        />
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPreviewPage(p => Math.min(spreads.length - 1, p + 1))}
                      disabled={currentPreviewPage === spreads.length - 1}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card className="bg-black border-orange-500/20">
              <CardHeader>
                <CardTitle>Export Your Book</CardTitle>
                <CardDescription>Choose your format and publish</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto py-4 flex-col" data-testid="button-export-pdf">
                    <FileText className="w-8 h-8 mb-2" />
                    <span>Download PDF</span>
                    <span className="text-xs text-muted-foreground">Print-ready file</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col" data-testid="button-export-kdp">
                    <BookOpen className="w-8 h-8 mb-2" />
                    <span>KDP Ready</span>
                    <span className="text-xs text-muted-foreground">Amazon publishing</span>
                  </Button>
                  <Button 
                    className="h-auto py-4 flex-col bg-orange-500 hover:bg-orange-600 text-black" 
                    onClick={() => onExport?.({
                      title: bookTitle,
                      ageBand,
                      themes: selectedThemes,
                      illustrationStyle,
                      characters,
                      spreads,
                      rhymingMode,
                    })}
                    data-testid="button-publish-marketplace"
                  >
                    <Star className="w-8 h-8 mb-2" />
                    <span>Publish to Marketplace</span>
                    <span className="text-xs">Start selling!</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(4)} data-testid="button-back-step-5">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
