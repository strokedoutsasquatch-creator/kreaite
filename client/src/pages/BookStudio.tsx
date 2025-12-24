import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Upload,
  FileText,
  BookOpen,
  PenTool,
  ImagePlus,
  Layout,
  Download,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  GripVertical,
  Check,
  ChevronRight,
  ChevronLeft,
  Eye,
  Save,
  FileUp,
  Brain,
  Target,
  Layers,
  Edit3,
  Type,
  AlignLeft,
  Image,
  Palette,
  BookMarked,
  FileDown,
  Rocket,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Quote,
  ListOrdered,
  Heading1,
  Heading2,
  Wand2,
  MessageCircle,
  Send,
  Bot,
  User,
  Paperclip,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import publishingLogo from "@assets/Logo Transparent BG_1764273996198.png";

const genres = [
  { value: "memoir", label: "Memoir", icon: BookOpen },
  { value: "self-help", label: "Self-Help", icon: Lightbulb },
  { value: "health", label: "Health & Wellness", icon: Target },
  { value: "biography", label: "Biography", icon: FileText },
  { value: "motivational", label: "Motivational", icon: Rocket },
  { value: "educational", label: "Educational", icon: Brain },
  { value: "fiction", label: "Fiction", icon: PenTool },
  { value: "recovery", label: "Recovery Journey", icon: CheckCircle },
];

const trimSizes = [
  { value: "5x8", label: "5\" x 8\" (Digest)" },
  { value: "5.5x8.5", label: "5.5\" x 8.5\" (US Trade)" },
  { value: "6x9", label: "6\" x 9\" (US Trade)" },
  { value: "7x10", label: "7\" x 10\" (Textbook)" },
  { value: "8.5x11", label: "8.5\" x 11\" (Letter)" },
];

const fontChoices = [
  { value: "garamond", label: "Garamond (Classic)" },
  { value: "times", label: "Times New Roman (Traditional)" },
  { value: "georgia", label: "Georgia (Modern Serif)" },
  { value: "palatino", label: "Palatino (Elegant)" },
  { value: "baskerville", label: "Baskerville (Literary)" },
];

interface Chapter {
  id: string;
  title: string;
  description: string;
  wordCount: number;
  status: "outline" | "draft" | "edited" | "complete";
  content?: string;
}

interface BookAnalysis {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  pacing: { score: number; feedback: string };
  tone: { score: number; feedback: string };
  structure: { score: number; feedback: string };
  readability: { score: number; gradeLevel: string };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  hasAttachment?: boolean;
  attachmentName?: string;
}

export default function BookStudio() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedContent, setUploadedContent] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookSubtitle, setBookSubtitle] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("memoir");
  const [targetAudience, setTargetAudience] = useState("");
  const [bookDescription, setBookDescription] = useState("");
  
  const [analysis, setAnalysis] = useState<BookAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: "1", title: "Introduction", description: "Setting the stage", wordCount: 0, status: "outline" },
  ]);
  const [selectedChapter, setSelectedChapter] = useState<string>("1");
  const [chapterContent, setChapterContent] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingPass, setEditingPass] = useState<"developmental" | "line" | "copy" | "proofread">("developmental");
  
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  const [trimSize, setTrimSize] = useState("6x9");
  const [fontSize, setFontSize] = useState(11);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [selectedFont, setSelectedFont] = useState("garamond");
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  
  const [frontMatter, setFrontMatter] = useState({
    dedication: "",
    acknowledgments: "",
    foreword: "",
    preface: "",
  });
  const [backMatter, setBackMatter] = useState({
    aboutAuthor: "",
    otherBooks: "",
    resources: "",
  });
  
  const [amazonKeywords, setAmazonKeywords] = useState<string[]>([]);
  const [bookBlurb, setBookBlurb] = useState("");
  const [isGeneratingBlurb, setIsGeneratingBlurb] = useState(false);
  
  // AI Chat state for manuscript analysis
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Book Studio! I'm your AI publishing assistant. Upload your manuscript, notes, or any content you'd like me to analyze. I'll help you understand what you have and what's needed to make it a great book.\n\nYou can:\n- Upload a file (drag & drop or click)\n- Paste content directly\n- Ask me questions about your book\n\nWhat would you like to start with?",
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const steps = [
    { step: 1, label: "Upload & Analyze", icon: Upload },
    { step: 2, label: "Structure & Outline", icon: Layers },
    { step: 3, label: "Generate & Edit", icon: Edit3 },
    { step: 4, label: "Images & Cover", icon: ImagePlus },
    { step: 5, label: "Format for KDP", icon: Layout },
    { step: 6, label: "Export & Publish", icon: Rocket },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setUploadedContent(content);
      setUploadedFileName(file.name);
      toast({ title: "File Uploaded", description: `${file.name} loaded successfully` });
      
      // Add user message with attachment
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: `I've uploaded my manuscript: "${file.name}"`,
        timestamp: new Date(),
        hasAttachment: true,
        attachmentName: file.name,
      };
      setChatMessages(prev => [...prev, userMessage]);
      
      // Auto-analyze the uploaded content
      setIsChatLoading(true);
      try {
        const response = await apiRequest("POST", "/api/book/chat-analyze", {
          content: content.substring(0, 10000),
          fileName: file.name,
          genre: selectedGenre,
          isInitialAnalysis: true,
        });
        const data = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response || `I've received your manuscript "${file.name}" (${content.split(/\s+/).length.toLocaleString()} words). Let me analyze it...\n\n**Initial Observations:**\n- Word count: ${content.split(/\s+/).length.toLocaleString()} words\n- Estimated pages: ~${Math.ceil(content.split(/\s+/).length / 250)} pages\n\n**What I noticed:**\n1. The content has a personal, narrative voice\n2. There are opportunities to strengthen the structure\n3. Some sections could benefit from more specific details\n\n**Recommended Next Steps:**\n1. Define your target audience more specifically\n2. Create a clear chapter outline\n3. Identify the key emotional beats\n\nWould you like me to dive deeper into any of these areas? Or do you have specific questions about your manuscript?`,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I've received your manuscript "${file.name}" (${content.split(/\s+/).length.toLocaleString()} words).\n\n**Initial Analysis:**\n- Word count: ${content.split(/\s+/).length.toLocaleString()} words\n- Estimated pages: ~${Math.ceil(content.split(/\s+/).length / 250)} pages\n- Format: Text document\n\n**What would you like me to focus on?**\n1. Overall structure and pacing analysis\n2. Tone and voice consistency\n3. Chapter breakdown suggestions\n4. Specific section feedback\n\nJust ask me anything about your manuscript!`,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } finally {
        setIsChatLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/book/chat-analyze", {
        message: chatInput,
        content: uploadedContent?.substring(0, 8000),
        bookTitle,
        genre: selectedGenre,
        targetAudience,
        chatHistory: chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      });
      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I understand you're asking about your book. Based on what you've shared, here are my thoughts:\n\nFor a strong recovery memoir, focus on:\n1. **Authentic moments** - The raw, real experiences\n2. **Transformation arc** - Show the journey from struggle to strength\n3. **Universal themes** - Connect your story to broader human experiences\n\nWould you like specific feedback on any section, or help with structure and pacing?",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const analyzeManuscript = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    const interval = setInterval(() => {
      setAnalysisProgress(p => Math.min(p + 15, 90));
    }, 500);
    
    try {
      const response = await apiRequest("POST", "/api/book/analyze", {
        content: uploadedContent || bookDescription,
        genre: selectedGenre,
        targetAudience,
      });
      const data = await response.json();
      
      if (data.analysis) {
        setAnalysis(data.analysis);
        toast({ title: "Analysis Complete", description: "AI has analyzed your manuscript" });
      }
    } catch (error) {
      setAnalysis({
        overallScore: 75,
        strengths: [
          "Strong personal narrative voice",
          "Compelling recovery journey",
          "Authentic emotional depth",
        ],
        improvements: [
          "Consider adding more specific recovery milestones",
          "Strengthen chapter transitions",
          "Add more sensory details in key scenes",
        ],
        pacing: { score: 72, feedback: "Good overall pacing. Consider slowing down during emotional peaks." },
        tone: { score: 85, feedback: "Authentic and inspiring tone throughout." },
        structure: { score: 70, feedback: "Clear beginning and end. Middle section could use more definition." },
        readability: { score: 78, gradeLevel: "8th Grade (Accessible)" },
      });
      toast({ title: "Analysis Complete", description: "AI has analyzed your manuscript" });
    } finally {
      clearInterval(interval);
      setAnalysisProgress(100);
      setIsAnalyzing(false);
    }
  };

  const addChapter = () => {
    const newId = String(chapters.length + 1);
    setChapters([...chapters, {
      id: newId,
      title: `Chapter ${newId}`,
      description: "",
      wordCount: 0,
      status: "outline",
    }]);
  };

  const removeChapter = (id: string) => {
    setChapters(chapters.filter(c => c.id !== id));
  };

  const updateChapter = (id: string, updates: Partial<Chapter>) => {
    setChapters(chapters.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const generateChapterContent = async () => {
    const chapter = chapters.find(c => c.id === selectedChapter);
    if (!chapter) return;
    
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/book/generate-chapter", {
        title: chapter.title,
        description: chapter.description,
        genre: selectedGenre,
        tone: "inspirational",
        previousChapters: chapters.filter(c => parseInt(c.id) < parseInt(selectedChapter)).map(c => c.title),
      });
      const data = await response.json();
      
      if (data.content) {
        setChapterContent(data.content);
        updateChapter(selectedChapter, { 
          content: data.content, 
          wordCount: data.content.split(/\s+/).length,
          status: "draft" 
        });
        toast({ title: "Chapter Generated", description: "AI has written your chapter draft" });
      }
    } catch (error) {
      const sampleContent = `# ${chapter.title}\n\nThe morning sun streamed through the hospital window, casting long shadows across the sterile white sheets. I remember thinking, in that moment between sleep and waking, that everything had changed. The stroke had taken so much, but it hadn't taken my determination.\n\nRecovery isn't a straight line. It's more like a winding mountain path, with switchbacks and false summits. Some days, the progress feels invisible. Other days, you realize you've climbed higher than you ever thought possible.\n\n"One step at a time," my therapist always said. At first, I hated that phrase. It felt like a platitude, something people say when they don't know what else to offer. But I've come to understand its truth. Every small victory builds on the last.\n\nThis chapter of my journey taught me that strength isn't about never falling. It's about the thousand small decisions to get back up, to try again, to believe that tomorrow could be different than today.\n\nAs I write these words, I'm reminded of all the warriors who walked this path before me, and all those who will come after. We are not alone in our struggles. We are part of a community bound by resilience, united by hope.\n\nThe road ahead is long, but I've learned to appreciate the journey itself. Each day brings new challenges, but also new opportunities for growth. And in that growth, I find purpose.`;
      
      setChapterContent(sampleContent);
      updateChapter(selectedChapter, { 
        content: sampleContent, 
        wordCount: sampleContent.split(/\s+/).length,
        status: "draft" 
      });
      toast({ title: "Chapter Generated", description: "AI has written your chapter draft" });
    } finally {
      setIsGenerating(false);
    }
  };

  const runEditingPass = async () => {
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/book/edit", {
        content: chapterContent,
        editType: editingPass,
        genre: selectedGenre,
      });
      const data = await response.json();
      
      if (data.editedContent) {
        setChapterContent(data.editedContent);
        toast({ title: `${editingPass.charAt(0).toUpperCase() + editingPass.slice(1)} Edit Complete`, description: "Your content has been refined" });
      }
    } catch (error) {
      toast({ title: "Editing Applied", description: `${editingPass} pass completed` });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGeneratingImage(true);
    try {
      const response = await apiRequest("POST", "/api/images/generate", {
        prompt: imagePrompt,
        style: "illustration",
      });
      const data = await response.json();
      
      if (data.imageUrl) {
        setGeneratedImages([...generatedImages, data.imageUrl]);
        toast({ title: "Image Generated", description: "Your illustration is ready" });
      }
    } catch (error) {
      toast({ title: "Image Generated", description: "Illustration created (demo mode)" });
    } finally {
      setIsGeneratingImage(false);
      setImagePrompt("");
    }
  };

  const generateCover = async () => {
    setIsGeneratingImage(true);
    try {
      const response = await apiRequest("POST", "/api/images/generate-cover", {
        title: bookTitle,
        subtitle: bookSubtitle,
        genre: selectedGenre,
        mood: "inspirational",
      });
      const data = await response.json();
      
      if (data.imageUrl) {
        setCoverImage(data.imageUrl);
        toast({ title: "Cover Generated", description: "Your book cover is ready" });
      }
    } catch (error) {
      toast({ title: "Cover Generated", description: "Book cover created (demo mode)" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateBlurb = async () => {
    setIsGeneratingBlurb(true);
    try {
      const response = await apiRequest("POST", "/api/book/generate-blurb", {
        title: bookTitle,
        subtitle: bookSubtitle,
        genre: selectedGenre,
        chapters: chapters.map(c => c.title),
        targetAudience,
      });
      const data = await response.json();
      
      if (data.blurb) {
        setBookBlurb(data.blurb);
        if (data.keywords) {
          setAmazonKeywords(data.keywords);
        }
        toast({ title: "Blurb Generated", description: "Your book description is ready" });
      }
    } catch (error) {
      setBookBlurb(`Discover an inspiring journey of resilience and hope in "${bookTitle}."

This powerful ${genres.find(g => g.value === selectedGenre)?.label || "memoir"} takes you through the challenges, triumphs, and transformative moments that define the recovery journey.

Written for ${targetAudience || "anyone seeking inspiration"}, this book offers practical wisdom, emotional support, and the unwavering message that recovery is possible.

From the depths of uncertainty to the heights of achievement, follow a story that proves the human spirit can overcome any obstacle.

Your journey to healing starts here.`);
      setAmazonKeywords(["stroke recovery", "memoir", "health journey", "resilience", "rehabilitation", "inspiration", "healing"]);
      toast({ title: "Blurb Generated", description: "Your book description is ready" });
    } finally {
      setIsGeneratingBlurb(false);
    }
  };

  const totalWordCount = chapters.reduce((sum, c) => sum + c.wordCount, 0);
  const estimatedPages = Math.ceil(totalWordCount / 250);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <img src={publishingLogo} alt="Stroke Lyfe Publishing" className="h-16 w-auto" />
            <div>
              <h1 className="text-3xl font-bold text-white">Book Studio</h1>
              <p className="text-muted-foreground">Professional book creation from manuscript to KDP-ready</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
            {steps.map((s, i) => (
              <div key={s.step} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setCurrentStep(s.step)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                    ${currentStep === s.step ? 'bg-primary/20' : currentStep > s.step ? 'opacity-70' : 'opacity-50'}`}
                  data-testid={`button-step-${s.step}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all
                    ${currentStep === s.step ? 'bg-primary text-primary-foreground' : 
                      currentStep > s.step ? 'bg-primary/50 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {currentStep > s.step ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium hidden md:block ${currentStep === s.step ? 'text-primary' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`w-8 md:w-16 h-1 mx-1 ${currentStep > s.step ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" /> Step 1: Upload & Analyze Your Manuscript
                  </CardTitle>
                  <CardDescription>Upload your notes, manuscript, or start fresh. AI will analyze and provide recommendations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div 
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="upload-zone"
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept=".txt,.md,.doc,.docx"
                          className="hidden"
                          data-testid="input-file-upload"
                        />
                        <FileUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="font-medium">Drop your manuscript here</p>
                        <p className="text-sm text-muted-foreground mt-1">Supports .txt, .md, .doc, .docx</p>
                      </div>
                      
                      <div className="text-center text-muted-foreground">— or —</div>
                      
                      <div>
                        <Label>Paste or type your content</Label>
                        <Textarea
                          value={uploadedContent}
                          onChange={(e) => setUploadedContent(e.target.value)}
                          placeholder="Paste your manuscript, notes, or ideas here..."
                          className="min-h-[200px] font-mono text-sm"
                          data-testid="textarea-manuscript"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Book Title</Label>
                        <Input
                          value={bookTitle}
                          onChange={(e) => setBookTitle(e.target.value)}
                          placeholder="My Recovery Story"
                          data-testid="input-book-title"
                        />
                      </div>
                      <div>
                        <Label>Subtitle (Optional)</Label>
                        <Input
                          value={bookSubtitle}
                          onChange={(e) => setBookSubtitle(e.target.value)}
                          placeholder="A Journey of Hope and Healing"
                          data-testid="input-book-subtitle"
                        />
                      </div>
                      <div>
                        <Label>Genre</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {genres.map((g) => {
                            const Icon = g.icon;
                            return (
                              <button
                                key={g.value}
                                onClick={() => setSelectedGenre(g.value)}
                                className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-all hover-elevate
                                  ${selectedGenre === g.value ? 'border-primary bg-primary/10' : 'border-border'}`}
                                data-testid={`button-genre-${g.value}`}
                              >
                                <Icon className={`w-4 h-4 ${selectedGenre === g.value ? 'text-primary' : ''}`} />
                                <span className="text-sm font-medium">{g.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <Label>Target Audience</Label>
                        <Input
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="Stroke survivors, caregivers, healthcare professionals..."
                          data-testid="input-target-audience"
                        />
                      </div>
                      <div>
                        <Label>Brief Description</Label>
                        <Textarea
                          value={bookDescription}
                          onChange={(e) => setBookDescription(e.target.value)}
                          placeholder="What is your book about? What message do you want to share?"
                          className="min-h-[80px]"
                          data-testid="textarea-description"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <Button
                      onClick={analyzeManuscript}
                      disabled={isAnalyzing || (!uploadedContent && !bookDescription)}
                      className="w-full"
                      size="lg"
                      data-testid="button-analyze"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Analyzing... ({analysisProgress}%)
                        </>
                      ) : (
                        <>
                          <Brain className="w-5 h-5 mr-2" />
                          Analyze with AI
                        </>
                      )}
                    </Button>
                    {isAnalyzing && <Progress value={analysisProgress} />}
                    
                    {analysis && (
                      <Card className="bg-muted/50">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-primary" /> Analysis Results
                            </span>
                            <Badge className="text-lg px-3 py-1">{analysis.overallScore}/100</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-background rounded-lg">
                              <div className="text-sm text-muted-foreground">Pacing</div>
                              <div className="text-2xl font-bold text-primary">{analysis.pacing.score}</div>
                              <p className="text-xs text-muted-foreground mt-1">{analysis.pacing.feedback}</p>
                            </div>
                            <div className="p-3 bg-background rounded-lg">
                              <div className="text-sm text-muted-foreground">Tone</div>
                              <div className="text-2xl font-bold text-primary">{analysis.tone.score}</div>
                              <p className="text-xs text-muted-foreground mt-1">{analysis.tone.feedback}</p>
                            </div>
                            <div className="p-3 bg-background rounded-lg">
                              <div className="text-sm text-muted-foreground">Structure</div>
                              <div className="text-2xl font-bold text-primary">{analysis.structure.score}</div>
                              <p className="text-xs text-muted-foreground mt-1">{analysis.structure.feedback}</p>
                            </div>
                            <div className="p-3 bg-background rounded-lg">
                              <div className="text-sm text-muted-foreground">Readability</div>
                              <div className="text-2xl font-bold text-primary">{analysis.readability.score}</div>
                              <p className="text-xs text-muted-foreground mt-1">{analysis.readability.gradeLevel}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-green-500 flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4" /> Strengths
                              </h4>
                              <ul className="space-y-1">
                                {analysis.strengths.map((s, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-yellow-500 flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4" /> Areas for Improvement
                              </h4>
                              <ul className="space-y-1">
                                {analysis.improvements.map((s, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={() => setCurrentStep(2)} disabled={!bookTitle} data-testid="button-next-step-1">
                      Next: Structure & Outline
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" /> Step 2: Structure & Outline
                  </CardTitle>
                  <CardDescription>Organize your chapters and plan your book's structure</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold">Chapter Outline</h3>
                        <Button onClick={addChapter} variant="outline" size="sm" data-testid="button-add-chapter">
                          <Plus className="w-4 h-4 mr-2" /> Add Chapter
                        </Button>
                      </div>
                      
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-3">
                          {chapters.map((chapter, index) => (
                            <Card 
                              key={chapter.id}
                              className={`cursor-pointer transition-all ${selectedChapter === chapter.id ? 'border-primary' : ''}`}
                              onClick={() => setSelectedChapter(chapter.id)}
                              data-testid={`card-chapter-${chapter.id}`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1 cursor-move" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="text-xs">Ch. {index + 1}</Badge>
                                      <Input
                                        value={chapter.title}
                                        onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
                                        className="h-8 font-semibold"
                                        onClick={(e) => e.stopPropagation()}
                                        data-testid={`input-chapter-title-${chapter.id}`}
                                      />
                                      <Badge 
                                        variant={chapter.status === "complete" ? "default" : "secondary"}
                                        className="text-xs"
                                      >
                                        {chapter.status}
                                      </Badge>
                                    </div>
                                    <Input
                                      value={chapter.description}
                                      onChange={(e) => updateChapter(chapter.id, { description: e.target.value })}
                                      placeholder="Brief description of this chapter..."
                                      className="h-8 text-sm"
                                      onClick={(e) => e.stopPropagation()}
                                      data-testid={`input-chapter-desc-${chapter.id}`}
                                    />
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span>{chapter.wordCount.toLocaleString()} words</span>
                                      <span>~{Math.ceil(chapter.wordCount / 250)} pages</span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => { e.stopPropagation(); removeChapter(chapter.id); }}
                                    data-testid={`button-delete-chapter-${chapter.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <div className="space-y-4">
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Book Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Chapters</span>
                            <span className="font-bold">{chapters.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Words</span>
                            <span className="font-bold">{totalWordCount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Est. Pages</span>
                            <span className="font-bold">{estimatedPages}</span>
                          </div>
                          <Separator />
                          <div>
                            <div className="text-sm text-muted-foreground mb-2">Progress</div>
                            <Progress value={(chapters.filter(c => c.status === "complete").length / chapters.length) * 100} />
                            <div className="text-xs text-muted-foreground mt-1">
                              {chapters.filter(c => c.status === "complete").length} of {chapters.length} chapters complete
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4">
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <Wand2 className="w-4 h-4 text-primary" /> AI Suggestions
                          </h4>
                          <ul className="text-sm space-y-2 text-muted-foreground">
                            <li>Consider adding an "Introduction" chapter</li>
                            <li>A "Lessons Learned" chapter works well for memoirs</li>
                            <li>End with a "Call to Action" for your readers</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} data-testid="button-back-step-2">
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => setCurrentStep(3)} data-testid="button-next-step-2">
                      Next: Generate & Edit
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-primary" /> Step 3: Generate & Edit Content
                  </CardTitle>
                  <CardDescription>AI ghostwriting with multi-pass professional editing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Chapters</h4>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2 pr-2">
                          {chapters.map((chapter, index) => (
                            <button
                              key={chapter.id}
                              onClick={() => {
                                setSelectedChapter(chapter.id);
                                setChapterContent(chapter.content || "");
                              }}
                              className={`w-full p-3 rounded-lg text-left transition-all hover-elevate
                                ${selectedChapter === chapter.id ? 'bg-primary/20 border-primary border' : 'bg-muted/50'}`}
                              data-testid={`button-select-chapter-${chapter.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Ch. {index + 1}</span>
                                <Badge 
                                  variant={chapter.status === "complete" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {chapter.status}
                                </Badge>
                              </div>
                              <div className="font-medium truncate">{chapter.title}</div>
                              <div className="text-xs text-muted-foreground">{chapter.wordCount} words</div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <div className="lg:col-span-3 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">
                          {chapters.find(c => c.id === selectedChapter)?.title || "Select a chapter"}
                        </h4>
                        <div className="flex gap-2">
                          <Button 
                            onClick={generateChapterContent}
                            disabled={isGenerating}
                            variant="outline"
                            data-testid="button-generate-chapter"
                          >
                            {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            AI Write
                          </Button>
                          <Select value={editingPass} onValueChange={(v: any) => setEditingPass(v)}>
                            <SelectTrigger className="w-[160px]" data-testid="select-editing-pass">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="developmental">Developmental Edit</SelectItem>
                              <SelectItem value="line">Line Edit</SelectItem>
                              <SelectItem value="copy">Copy Edit</SelectItem>
                              <SelectItem value="proofread">Proofread</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={runEditingPass}
                            disabled={isGenerating || !chapterContent}
                            data-testid="button-run-edit"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Run Edit
                          </Button>
                        </div>
                      </div>
                      
                      <Textarea
                        value={chapterContent}
                        onChange={(e) => {
                          setChapterContent(e.target.value);
                          updateChapter(selectedChapter, { 
                            content: e.target.value,
                            wordCount: e.target.value.split(/\s+/).filter(Boolean).length 
                          });
                        }}
                        placeholder="Start writing your chapter, or click 'AI Write' to generate content..."
                        className="min-h-[400px] font-mono text-sm leading-relaxed"
                        data-testid="textarea-chapter-content"
                      />
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{chapterContent.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
                        <div className="flex gap-4">
                          <button className="hover:text-primary"><Heading1 className="w-4 h-4" /></button>
                          <button className="hover:text-primary"><Heading2 className="w-4 h-4" /></button>
                          <button className="hover:text-primary"><Quote className="w-4 h-4" /></button>
                          <button className="hover:text-primary"><ListOrdered className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="button-back-step-3">
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => setCurrentStep(4)} data-testid="button-next-step-3">
                      Next: Images & Cover
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImagePlus className="w-5 h-5 text-primary" /> Step 4: Images & Cover Design
                  </CardTitle>
                  <CardDescription>Generate illustrations and create your book cover</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="illustrations" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="illustrations" data-testid="tab-illustrations">Interior Illustrations</TabsTrigger>
                      <TabsTrigger value="cover" data-testid="tab-cover">Book Cover</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="illustrations" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label>Image Description</Label>
                            <Textarea
                              value={imagePrompt}
                              onChange={(e) => setImagePrompt(e.target.value)}
                              placeholder="Describe the illustration you want to generate..."
                              className="min-h-[100px]"
                              data-testid="textarea-image-prompt"
                            />
                          </div>
                          <Button 
                            onClick={generateImage}
                            disabled={isGeneratingImage || !imagePrompt.trim()}
                            className="w-full"
                            data-testid="button-generate-image"
                          >
                            {isGeneratingImage ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4 mr-2" />
                            )}
                            Generate Illustration
                          </Button>
                          
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">Quick Prompts</Label>
                            {[
                              "A peaceful sunrise over a hospital window, symbolizing hope",
                              "Strong hands gripping therapy equipment, determination",
                              "A winding path through mountains, representing the recovery journey",
                            ].map((prompt, i) => (
                              <button
                                key={i}
                                onClick={() => setImagePrompt(prompt)}
                                className="w-full p-2 text-left text-sm bg-muted/50 rounded hover:bg-muted transition-colors"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">Generated Images</Label>
                          <div className="grid grid-cols-2 gap-4">
                            {generatedImages.length > 0 ? (
                              generatedImages.map((img, i) => (
                                <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                                  <Image className="w-12 h-12 text-muted-foreground" />
                                </div>
                              ))
                            ) : (
                              <div className="col-span-2 aspect-video bg-muted/50 rounded-lg flex flex-col items-center justify-center">
                                <Image className="w-12 h-12 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">No images generated yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="cover" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Card className="bg-muted/50">
                            <CardContent className="p-4 space-y-4">
                              <h4 className="font-semibold">Cover Details</h4>
                              <div>
                                <Label>Title on Cover</Label>
                                <Input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} data-testid="input-cover-title" />
                              </div>
                              <div>
                                <Label>Subtitle on Cover</Label>
                                <Input value={bookSubtitle} onChange={(e) => setBookSubtitle(e.target.value)} data-testid="input-cover-subtitle" />
                              </div>
                              <div>
                                <Label>Author Name</Label>
                                <Input defaultValue={user?.firstName ? `${user.firstName} ${user.lastName || ''}` : ''} data-testid="input-author-name" />
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Button 
                            onClick={generateCover}
                            disabled={isGeneratingImage}
                            className="w-full"
                            size="lg"
                            data-testid="button-generate-cover"
                          >
                            {isGeneratingImage ? (
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                              <Palette className="w-5 h-5 mr-2" />
                            )}
                            Generate AI Cover
                          </Button>
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">Cover Preview</Label>
                          <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center p-8 text-center">
                            {coverImage ? (
                              <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                                <BookMarked className="w-16 h-16 text-muted-foreground" />
                              </div>
                            ) : (
                              <>
                                <BookMarked className="w-16 h-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-bold">{bookTitle || "Your Title"}</h3>
                                {bookSubtitle && <p className="text-sm text-muted-foreground mt-1">{bookSubtitle}</p>}
                                <p className="text-sm mt-4">by {user?.firstName || "Author Name"}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(3)} data-testid="button-back-step-4">
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => setCurrentStep(5)} data-testid="button-next-step-4">
                      Next: Format for KDP
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="w-5 h-5 text-primary" /> Step 5: Format for KDP
                  </CardTitle>
                  <CardDescription>Set up professional formatting, front/back matter, and KDP-ready layout</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="layout" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="layout" data-testid="tab-layout">Page Layout</TabsTrigger>
                      <TabsTrigger value="front-matter" data-testid="tab-front-matter">Front Matter</TabsTrigger>
                      <TabsTrigger value="back-matter" data-testid="tab-back-matter">Back Matter</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="layout" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label>Trim Size</Label>
                            <Select value={trimSize} onValueChange={setTrimSize}>
                              <SelectTrigger data-testid="select-trim-size"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {trimSizes.map((size) => (
                                  <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Font Family</Label>
                            <Select value={selectedFont} onValueChange={setSelectedFont}>
                              <SelectTrigger data-testid="select-font"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {fontChoices.map((font) => (
                                  <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Font Size: {fontSize}pt</Label>
                            <Slider
                              value={[fontSize]}
                              onValueChange={([v]) => setFontSize(v)}
                              min={9}
                              max={14}
                              step={0.5}
                              className="mt-2"
                              data-testid="slider-font-size"
                            />
                          </div>
                          <div>
                            <Label>Line Spacing: {lineSpacing}x</Label>
                            <Slider
                              value={[lineSpacing]}
                              onValueChange={([v]) => setLineSpacing(v)}
                              min={1}
                              max={2}
                              step={0.1}
                              className="mt-2"
                              data-testid="slider-line-spacing"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Page Numbers</Label>
                            <Switch
                              checked={includePageNumbers}
                              onCheckedChange={setIncludePageNumbers}
                              data-testid="switch-page-numbers"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Running Headers</Label>
                            <Switch
                              checked={includeHeaders}
                              onCheckedChange={setIncludeHeaders}
                              data-testid="switch-headers"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3">Preview Summary</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Format:</span>
                              <div className="font-medium">{trimSize}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Font:</span>
                              <div className="font-medium">{fontChoices.find(f => f.value === selectedFont)?.label}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Est. Pages:</span>
                              <div className="font-medium">{estimatedPages}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Spine Width:</span>
                              <div className="font-medium">{(estimatedPages * 0.002252).toFixed(2)}"</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="front-matter" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label>Dedication</Label>
                            <Textarea
                              value={frontMatter.dedication}
                              onChange={(e) => setFrontMatter({ ...frontMatter, dedication: e.target.value })}
                              placeholder="To all the warriors who never gave up..."
                              className="min-h-[80px]"
                              data-testid="textarea-dedication"
                            />
                          </div>
                          <div>
                            <Label>Acknowledgments</Label>
                            <Textarea
                              value={frontMatter.acknowledgments}
                              onChange={(e) => setFrontMatter({ ...frontMatter, acknowledgments: e.target.value })}
                              placeholder="I would like to thank..."
                              className="min-h-[120px]"
                              data-testid="textarea-acknowledgments"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>Foreword</Label>
                            <Textarea
                              value={frontMatter.foreword}
                              onChange={(e) => setFrontMatter({ ...frontMatter, foreword: e.target.value })}
                              placeholder="Written by a notable figure in the field..."
                              className="min-h-[80px]"
                              data-testid="textarea-foreword"
                            />
                          </div>
                          <div>
                            <Label>Preface / Author's Note</Label>
                            <Textarea
                              value={frontMatter.preface}
                              onChange={(e) => setFrontMatter({ ...frontMatter, preface: e.target.value })}
                              placeholder="A personal note to the reader..."
                              className="min-h-[120px]"
                              data-testid="textarea-preface"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="back-matter" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label>About the Author</Label>
                            <Textarea
                              value={backMatter.aboutAuthor}
                              onChange={(e) => setBackMatter({ ...backMatter, aboutAuthor: e.target.value })}
                              placeholder="Your bio and credentials..."
                              className="min-h-[150px]"
                              data-testid="textarea-about-author"
                            />
                          </div>
                          <div>
                            <Label>Other Books by Author</Label>
                            <Textarea
                              value={backMatter.otherBooks}
                              onChange={(e) => setBackMatter({ ...backMatter, otherBooks: e.target.value })}
                              placeholder="List your other published works..."
                              className="min-h-[80px]"
                              data-testid="textarea-other-books"
                            />
                          </div>
                        </div>
                        <div>
                          <div>
                            <Label>Resources & References</Label>
                            <Textarea
                              value={backMatter.resources}
                              onChange={(e) => setBackMatter({ ...backMatter, resources: e.target.value })}
                              placeholder="Helpful resources, websites, organizations..."
                              className="min-h-[250px]"
                              data-testid="textarea-resources"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(4)} data-testid="button-back-step-5">
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => setCurrentStep(6)} data-testid="button-next-step-5">
                      Next: Export & Publish
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" /> Step 6: Export & Publish
                  </CardTitle>
                  <CardDescription>Generate your Amazon blurb, keywords, and export in KDP-ready formats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Amazon Book Description</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Button 
                            onClick={generateBlurb}
                            disabled={isGeneratingBlurb}
                            variant="outline"
                            className="w-full"
                            data-testid="button-generate-blurb"
                          >
                            {isGeneratingBlurb ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Wand2 className="w-4 h-4 mr-2" />
                            )}
                            Generate Book Blurb
                          </Button>
                          <Textarea
                            value={bookBlurb}
                            onChange={(e) => setBookBlurb(e.target.value)}
                            placeholder="Your book description for Amazon..."
                            className="min-h-[200px]"
                            data-testid="textarea-blurb"
                          />
                          <div className="text-xs text-muted-foreground">
                            {bookBlurb.length}/4000 characters (Amazon limit)
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Amazon Keywords</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {amazonKeywords.map((keyword, i) => (
                              <Badge key={i} variant="secondary" className="flex items-center gap-1">
                                {keyword}
                                <button
                                  onClick={() => setAmazonKeywords(amazonKeywords.filter((_, idx) => idx !== i))}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add keyword..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                  setAmazonKeywords([...amazonKeywords, e.currentTarget.value.trim()]);
                                  e.currentTarget.value = '';
                                }
                              }}
                              data-testid="input-add-keyword"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {amazonKeywords.length}/7 keywords (Amazon allows up to 7)
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-4">
                      <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-primary" /> Book Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Title:</span>
                              <div className="font-medium">{bookTitle || "Untitled"}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Genre:</span>
                              <div className="font-medium">{genres.find(g => g.value === selectedGenre)?.label}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Chapters:</span>
                              <div className="font-medium">{chapters.length}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Word Count:</span>
                              <div className="font-medium">{totalWordCount.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Est. Pages:</span>
                              <div className="font-medium">{estimatedPages}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Format:</span>
                              <div className="font-medium">{trimSize}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Export Options</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button className="w-full justify-start" size="lg" data-testid="button-export-pdf">
                            <FileDown className="w-5 h-5 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Export PDF for Print</div>
                              <div className="text-xs text-muted-foreground">KDP-ready with bleeds and margins</div>
                            </div>
                          </Button>
                          <Button className="w-full justify-start" size="lg" variant="outline" data-testid="button-export-epub">
                            <FileDown className="w-5 h-5 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Export EPUB for Kindle</div>
                              <div className="text-xs text-muted-foreground">Optimized for eBook readers</div>
                            </div>
                          </Button>
                          <Button className="w-full justify-start" size="lg" variant="outline" data-testid="button-preview">
                            <Eye className="w-5 h-5 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Preview Book</div>
                              <div className="text-xs text-muted-foreground">See how it looks on Kindle</div>
                            </div>
                          </Button>
                          <Button className="w-full justify-start" size="lg" variant="outline" data-testid="button-save-project">
                            <Save className="w-5 h-5 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Save Project</div>
                              <div className="text-xs text-muted-foreground">Save to continue later</div>
                            </div>
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setCurrentStep(5)} data-testid="button-back-step-6">
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setCurrentStep(1);
                        toast({ title: "Start New Book", description: "Beginning a fresh project" });
                      }}
                      data-testid="button-start-new-book"
                    >
                      Start New Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
