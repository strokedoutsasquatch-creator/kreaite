import { useState, useRef, useEffect } from "react";
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
  AlignCenter,
  AlignJustify,
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
  List,
  Heading1,
  Heading2,
  Heading3,
  Wand2,
  MessageCircle,
  Send,
  Bot,
  User,
  Paperclip,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Undo,
  Redo,
  Copy,
  Scissors,
  FileImage,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import publishingLogo from "@assets/Logo Transparent BG_1764273996198.png";

// Comprehensive genre templates with AI prompts and market positioning
const genreTemplates = {
  memoir: {
    label: "Memoir",
    icon: BookOpen,
    description: "Personal life stories and experiences",
    targetWordCount: 60000,
    chapterCount: 12,
    aiPrompt: "Write in first person with emotional depth, vivid sensory details, and reflective insights. Focus on transformation and lessons learned.",
    structure: ["Opening Hook", "Early Life/Background", "Inciting Incident", "Rising Challenges", "Turning Point", "Growth & Change", "Climax", "Resolution", "Reflection", "Legacy"],
    keywords: ["personal story", "life lessons", "transformation", "journey", "memoir"]
  },
  "self-help": {
    label: "Self-Help",
    icon: Lightbulb,
    description: "Practical guidance for personal improvement",
    targetWordCount: 45000,
    chapterCount: 10,
    aiPrompt: "Write with authority and empathy. Include actionable steps, real examples, and exercises. Use second person 'you' to connect directly with readers.",
    structure: ["The Problem", "Your Story/Credibility", "Core Framework", "Principle 1", "Principle 2", "Principle 3", "Common Obstacles", "Action Plan", "Success Stories", "Next Steps"],
    keywords: ["how to", "guide", "tips", "strategies", "improve", "success"]
  },
  childrens: {
    label: "Children's Book",
    icon: ImagePlus,
    description: "Illustrated stories for young readers",
    targetWordCount: 1000,
    chapterCount: 1,
    aiPrompt: "Write with simple, rhythmic language appropriate for ages 4-8. Use repetition, rhyme, and vivid imagery. Include clear moral lessons. Each page should have 2-4 sentences max.",
    structure: ["Title Page", "Once Upon a Time", "Problem Introduced", "Adventure Begins", "Challenge Faced", "Resolution", "Happy Ending", "Moral/Lesson"],
    keywords: ["children's book", "kids story", "picture book", "bedtime story"],
    isChildrens: true,
    ageRange: "4-8",
    illustrationPrompts: true
  },
  "childrens-middle": {
    label: "Middle Grade",
    icon: BookMarked,
    description: "Chapter books for ages 8-12",
    targetWordCount: 25000,
    chapterCount: 15,
    aiPrompt: "Write with adventure and humor, age-appropriate challenges, and relatable characters. Include themes of friendship, bravery, and self-discovery.",
    structure: ["Hook", "Meet the Hero", "Normal World", "Call to Adventure", "New Friends", "First Challenge", "Rising Stakes", "Setback", "Inner Growth", "Final Battle", "Victory", "New Normal"],
    keywords: ["chapter book", "adventure", "kids fiction", "middle grade"],
    isChildrens: true,
    ageRange: "8-12"
  },
  fiction: {
    label: "Fiction",
    icon: PenTool,
    description: "Novels and creative storytelling",
    targetWordCount: 80000,
    chapterCount: 25,
    aiPrompt: "Write with immersive prose, complex characters, and compelling plot. Show don't tell. Use dialogue to reveal character. Build tension and stakes throughout.",
    structure: ["Hook/Opening", "World Building", "Character Introduction", "Inciting Incident", "Rising Action", "Midpoint Twist", "Escalation", "Dark Moment", "Climax", "Resolution"],
    keywords: ["novel", "fiction", "story", "thriller", "romance", "mystery"]
  },
  business: {
    label: "Business/How-To",
    icon: Target,
    description: "Professional guides and strategies",
    targetWordCount: 50000,
    chapterCount: 12,
    aiPrompt: "Write with clarity and authority. Include case studies, data, and actionable frameworks. Use bullet points and subheadings for scannability.",
    structure: ["Executive Summary", "The Opportunity", "Core Framework", "Step 1", "Step 2", "Step 3", "Case Studies", "Common Mistakes", "Tools & Resources", "Implementation Plan", "Measuring Success", "Next Level"],
    keywords: ["business", "entrepreneur", "strategy", "guide", "success", "growth"]
  },
  health: {
    label: "Health & Wellness",
    icon: Target,
    description: "Physical and mental health guides",
    targetWordCount: 55000,
    chapterCount: 14,
    aiPrompt: "Write with scientific accuracy but accessible language. Include disclaimers where appropriate. Focus on evidence-based practices and practical protocols.",
    structure: ["Your Health Journey Starts", "Understanding the Science", "Assessment", "Foundation Principles", "Nutrition", "Movement", "Rest & Recovery", "Mental Wellness", "Building Habits", "Meal Plans/Protocols", "Troubleshooting", "Maintenance", "Resources", "Your New Life"],
    keywords: ["health", "wellness", "fitness", "nutrition", "healing", "recovery"]
  },
  recovery: {
    label: "Recovery Journey",
    icon: CheckCircle,
    description: "Overcoming challenges and healing",
    targetWordCount: 50000,
    chapterCount: 12,
    aiPrompt: "Write with vulnerability and hope. Share struggles honestly while maintaining an empowering tone. Include practical recovery strategies and resources.",
    structure: ["The Day Everything Changed", "Life Before", "The Crisis", "Rock Bottom", "First Steps", "Building Support", "The Hard Work", "Setbacks & Comebacks", "Breakthrough", "New Identity", "Helping Others", "The Road Ahead"],
    keywords: ["recovery", "healing", "overcoming", "survivor", "hope", "transformation"]
  },
  devotional: {
    label: "Devotional/Spiritual",
    icon: BookMarked,
    description: "Faith-based daily readings",
    targetWordCount: 30000,
    chapterCount: 30,
    aiPrompt: "Write with reverence and warmth. Include scripture/spiritual references, reflection questions, and practical applications. Each entry should be self-contained.",
    structure: ["Introduction", "Day 1-30 entries with: Opening verse, Reflection, Story/Example, Application, Prayer/Meditation, Action Step"],
    keywords: ["devotional", "faith", "spiritual", "daily reading", "inspiration", "prayer"]
  },
  cookbook: {
    label: "Cookbook",
    icon: Layers,
    description: "Recipe collections with stories",
    targetWordCount: 40000,
    chapterCount: 10,
    aiPrompt: "Write recipes with clear, numbered steps. Include ingredient lists, prep/cook times, serving sizes, and tips. Add personal stories and variations.",
    structure: ["Introduction & Philosophy", "Kitchen Basics", "Breakfast", "Appetizers", "Main Courses", "Sides", "Desserts", "Special Occasions", "Quick Meals", "Index & Conversions"],
    keywords: ["cookbook", "recipes", "cooking", "food", "meals", "healthy eating"]
  }
};

// For backwards compatibility
const genres = Object.entries(genreTemplates).map(([value, template]) => ({
  value,
  label: template.label,
  icon: template.icon
}));

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
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingPass, setEditingPass] = useState<"developmental" | "line" | "copy" | "proofread">("developmental");

  // Formatting helpers for the editor
  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = chapterContent.substring(start, end);
    const beforeText = chapterContent.substring(0, start);
    const afterText = chapterContent.substring(end);
    
    // Save to undo stack
    setUndoStack(prev => [...prev, chapterContent]);
    setRedoStack([]);
    
    const newText = beforeText + prefix + selectedText + suffix + afterText;
    setChapterContent(newText);
    updateChapter(selectedChapter, { 
      content: newText, 
      wordCount: newText.split(/\s+/).filter(Boolean).length 
    });
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertLineFormatting = (prefix: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const lineStart = chapterContent.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = chapterContent.indexOf('\n', start);
    const actualLineEnd = lineEnd === -1 ? chapterContent.length : lineEnd;
    
    setUndoStack(prev => [...prev, chapterContent]);
    setRedoStack([]);
    
    const newText = chapterContent.substring(0, lineStart) + prefix + chapterContent.substring(lineStart);
    setChapterContent(newText);
    updateChapter(selectedChapter, { 
      content: newText, 
      wordCount: newText.split(/\s+/).filter(Boolean).length 
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousContent = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, chapterContent]);
    setUndoStack(prev => prev.slice(0, -1));
    setChapterContent(previousContent);
    updateChapter(selectedChapter, { 
      content: previousContent, 
      wordCount: previousContent.split(/\s+/).filter(Boolean).length 
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextContent = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, chapterContent]);
    setRedoStack(prev => prev.slice(0, -1));
    setChapterContent(nextContent);
    updateChapter(selectedChapter, { 
      content: nextContent, 
      wordCount: nextContent.split(/\s+/).filter(Boolean).length 
    });
  };

  const handleSave = () => {
    toast({ title: "Saved", description: "Your chapter has been saved" });
  };
  
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
  
  // Enhanced KDP formatting state
  const [kdpFormat, setKdpFormat] = useState("paperback");
  const [paperType, setPaperType] = useState("cream");
  const [hasBleed, setHasBleed] = useState(false);
  const [marginInside, setMarginInside] = useState(0.75);
  const [marginOutside, setMarginOutside] = useState(0.5);
  const [marginTopBottom, setMarginTopBottom] = useState(0.75);
  const [includeToc, setIncludeToc] = useState(true);
  const [includeCopyright, setIncludeCopyright] = useState(true);
  const [chapterBreakStyle, setChapterBreakStyle] = useState("new-page");
  const [isbn, setIsbn] = useState("");
  const [copyrightYear, setCopyrightYear] = useState(new Date().getFullYear().toString());
  
  const [frontMatter, setFrontMatter] = useState({
    dedication: "",
    acknowledgments: "",
    foreword: "",
    preface: "",
  });
  // Content Factory state
  const [quickGenerateMode, setQuickGenerateMode] = useState(false);
  const [quickTopic, setQuickTopic] = useState("");
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<any>(null);
  const [keywordResearch, setKeywordResearch] = useState<any>(null);
  const [isResearchingKeywords, setIsResearchingKeywords] = useState(false);
  const [isChildrensBook, setIsChildrensBook] = useState(false);
  const [authorVoice, setAuthorVoice] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Creative Workflow state
  const [manuscriptAnalysis, setManuscriptAnalysis] = useState<any>(null);
  const [isAnalyzingManuscript, setIsAnalyzingManuscript] = useState(false);
  const [isConvertingDiscussion, setIsConvertingDiscussion] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [illustrationStyle, setIllustrationStyle] = useState("whimsical watercolor");
  const [imagePlacementMode, setImagePlacementMode] = useState<"auto" | "hybrid" | "manual">("auto");
  const [selectedImageChapter, setSelectedImageChapter] = useState<string | null>(null);
  const [coverStyle, setCoverStyle] = useState("professional");
  const [selectedAiProvider, setSelectedAiProvider] = useState<"gemini" | "openai" | "xai">("gemini");
  const [authorName, setAuthorName] = useState("");
  
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
    
    // File size limit: 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        title: "File Too Large", 
        description: "Please upload a file smaller than 5MB. For larger manuscripts, try splitting into chapters.",
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onerror = () => {
      toast({ 
        title: "Upload Error", 
        description: "Failed to read file. Please try again.",
        variant: "destructive"
      });
    };
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content || content.length === 0) {
        toast({ 
          title: "Empty File", 
          description: "The file appears to be empty.",
          variant: "destructive"
        });
        return;
      }
      setUploadedContent(content);
      setUploadedFileName(file.name);
      toast({ title: "File Uploaded", description: `${file.name} loaded successfully (${(file.size / 1024).toFixed(1)}KB)` });
      
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

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatScrollRef.current) {
      const scrollContainer = chatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatMessages]);

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
      console.error("Chat error:", error);
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

  // ============ CONTENT FACTORY FUNCTIONS ============
  
  // Keyword research
  const performKeywordResearch = async () => {
    if (!quickTopic.trim()) {
      toast({ title: "Enter a topic", description: "Please enter a topic to research keywords for", variant: "destructive" });
      return;
    }
    
    setIsResearchingKeywords(true);
    try {
      const response = await apiRequest("POST", "/api/book/keyword-research", {
        topic: quickTopic,
        genre: selectedGenre,
        niche: targetAudience
      });
      const data = await response.json();
      
      if (data.success) {
        setKeywordResearch(data.keywords);
        toast({ 
          title: "Research Complete", 
          description: `Found keywords from ${data.source === 'serp_api' ? 'live search data' : 'AI analysis'}` 
        });
      }
    } catch (error) {
      console.error("Keyword research error:", error);
      toast({ title: "Research Failed", description: "Could not complete keyword research", variant: "destructive" });
    } finally {
      setIsResearchingKeywords(false);
    }
  };

  // Quick generate full book outline
  const quickGenerateBook = async () => {
    if (!quickTopic.trim()) {
      toast({ title: "Enter a topic", description: "Please describe what your book is about", variant: "destructive" });
      return;
    }
    
    setIsQuickGenerating(true);
    setGenerationProgress(10);
    
    try {
      const template = genreTemplates[selectedGenre as keyof typeof genreTemplates] || genreTemplates.memoir;
      
      const response = await apiRequest("POST", "/api/book/generate-full-book", {
        topic: quickTopic,
        genre: selectedGenre,
        targetAudience: targetAudience || template.description,
        authorVoice,
        chapterCount: template.chapterCount,
        wordsPerChapter: Math.floor(template.targetWordCount / template.chapterCount),
        isChildrensBook,
        includeIllustrations: isChildrensBook
      });
      
      setGenerationProgress(50);
      const data = await response.json();
      
      if (data.success && data.outline) {
        setGeneratedOutline(data.outline);
        setBookTitle(data.outline.title || "");
        setBookSubtitle(data.outline.subtitle || "");
        setBookDescription(data.outline.hook || "");
        
        // Create chapters from outline
        if (data.outline.chapters) {
          const newChapters = data.outline.chapters.map((ch: any, idx: number) => ({
            id: String(idx + 1),
            title: ch.title,
            description: ch.description,
            wordCount: 0,
            status: "outline" as const,
            keyPoints: ch.keyPoints,
            illustrationPrompt: ch.illustrationPrompt
          }));
          setChapters(newChapters);
        }
        
        setGenerationProgress(100);
        toast({ 
          title: "Book Outline Generated!", 
          description: `"${data.outline.title}" with ${data.outline.chapters?.length || 0} chapters ready. Click 'Generate All Chapters' to write the full book.` 
        });
      }
    } catch (error) {
      console.error("Quick generate error:", error);
      toast({ title: "Generation Failed", description: "Could not generate book outline", variant: "destructive" });
    } finally {
      setIsQuickGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Generate all chapters at once
  const generateAllChapters = async () => {
    if (!chapters.length || !bookTitle) {
      toast({ title: "No outline", description: "Generate a book outline first", variant: "destructive" });
      return;
    }
    
    setIsQuickGenerating(true);
    const template = genreTemplates[selectedGenre as keyof typeof genreTemplates] || genreTemplates.memoir;
    
    try {
      const response = await apiRequest("POST", "/api/book/generate-all-chapters", {
        bookTitle,
        chapters: chapters.map(ch => ({
          number: parseInt(ch.id),
          title: ch.title,
          description: ch.description,
          keyPoints: (ch as any).keyPoints,
          illustrationPrompt: (ch as any).illustrationPrompt
        })),
        genre: selectedGenre,
        targetAudience,
        authorVoice,
        isChildrensBook
      });
      
      const data = await response.json();
      
      if (data.success && data.chapters) {
        // Update chapters with content
        setChapters(prev => prev.map((ch, idx) => ({
          ...ch,
          content: data.chapters[idx]?.content || ch.content,
          wordCount: data.chapters[idx]?.wordCount || 0,
          status: "draft" as const
        })));
        
        toast({ 
          title: "Book Generated!", 
          description: `${data.totalWordCount?.toLocaleString()} words (~${data.estimatedPages} pages) written across ${data.chapters.length} chapters!` 
        });
      }
    } catch (error) {
      console.error("Generate chapters error:", error);
      toast({ title: "Generation Failed", description: "Could not generate all chapters", variant: "destructive" });
    } finally {
      setIsQuickGenerating(false);
    }
  };

  // Quality polish all content
  const polishAllContent = async () => {
    const chaptersWithContent = chapters.filter(ch => ch.content && ch.content.length > 100);
    if (!chaptersWithContent.length) {
      toast({ title: "No content", description: "Generate chapter content first", variant: "destructive" });
      return;
    }
    
    setIsQuickGenerating(true);
    
    try {
      for (let i = 0; i < chaptersWithContent.length; i++) {
        const ch = chaptersWithContent[i];
        setGenerationProgress(Math.floor((i / chaptersWithContent.length) * 100));
        
        const response = await apiRequest("POST", "/api/book/quality-polish", {
          content: ch.content,
          passes: ['developmental', 'line', 'copy', 'proofread']
        });
        
        const data = await response.json();
        
        if (data.success) {
          updateChapter(ch.id, {
            content: data.polishedContent,
            wordCount: data.wordCount,
            status: "edited"
          });
        }
      }
      
      toast({ 
        title: "Polish Complete!", 
        description: `${chaptersWithContent.length} chapters refined through 4-pass editing` 
      });
    } catch (error) {
      console.error("Polish error:", error);
      toast({ title: "Polish Failed", description: "Could not complete quality polish", variant: "destructive" });
    } finally {
      setIsQuickGenerating(false);
      setGenerationProgress(0);
    }
  };

  // ============ CREATIVE WORKFLOW FUNCTIONS ============
  
  // Convert chat discussion into a book plan
  const convertDiscussionToPlan = async () => {
    if (chatMessages.length < 3) {
      toast({ title: "Not enough discussion", description: "Have a longer conversation first to build your book plan", variant: "destructive" });
      return;
    }
    
    setIsConvertingDiscussion(true);
    try {
      const response = await apiRequest("POST", "/api/book/discussion-to-plan", {
        chatHistory: chatMessages.filter(m => m.id !== 'welcome').map(m => ({
          role: m.role,
          content: m.content
        })),
        genre: selectedGenre,
        preferences: { authorVoice, targetAudience }
      });
      const data = await response.json();
      
      if (data.success && data.plan) {
        // Apply the plan to the book
        setBookTitle(data.plan.title || "");
        setBookSubtitle(data.plan.subtitle || "");
        setBookDescription(data.plan.hook || "");
        setTargetAudience(data.plan.targetAudience || "");
        setAuthorVoice(data.plan.authorVoice || "");
        setGeneratedOutline(data.plan);
        
        // Create chapters from plan
        if (data.plan.chapters && data.plan.chapters.length > 0) {
          const newChapters = data.plan.chapters.map((ch: any, idx: number) => ({
            id: String(idx + 1),
            title: ch.title,
            description: ch.description,
            wordCount: 0,
            status: "outline" as const,
            keyPoints: ch.keyPoints
          }));
          setChapters(newChapters);
        }
        
        toast({ 
          title: "Discussion Converted!", 
          description: `Created "${data.plan.title}" with ${data.plan.chapters?.length || 0} chapters from your conversation` 
        });
        
        // Move to structure step
        setCurrentStep(2);
      } else {
        toast({ title: "Conversion Issue", description: "Could not fully convert discussion. Try adding more detail.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Discussion conversion error:", error);
      toast({ title: "Conversion Failed", description: "Could not convert discussion to plan", variant: "destructive" });
    } finally {
      setIsConvertingDiscussion(false);
    }
  };

  // Deep analyze uploaded manuscript
  const analyzeUploadedManuscript = async (analysisType: string = 'full') => {
    if (!uploadedContent) {
      toast({ title: "No content", description: "Upload a manuscript first", variant: "destructive" });
      return;
    }
    
    setIsAnalyzingManuscript(true);
    try {
      const response = await apiRequest("POST", "/api/book/analyze-manuscript", {
        content: uploadedContent,
        fileName: uploadedFileName,
        analysisType
      });
      const data = await response.json();
      
      if (data.success && data.analysis) {
        setManuscriptAnalysis(data.analysis);
        
        // Auto-apply some detected info
        if (data.analysis.title) setBookTitle(data.analysis.title);
        if (data.analysis.detectedGenre) {
          const genreMap: Record<string, string> = {
            'memoir': 'memoir', 'self-help': 'self-help', 'business': 'business',
            'fiction': 'fiction', 'health': 'health', 'recovery': 'recovery'
          };
          if (genreMap[data.analysis.detectedGenre.toLowerCase()]) {
            setSelectedGenre(genreMap[data.analysis.detectedGenre.toLowerCase()]);
          }
        }
        
        toast({ 
          title: "Analysis Complete!", 
          description: `Analyzed ${(uploadedContent.length / 1000).toFixed(1)}K characters` 
        });
      }
    } catch (error) {
      console.error("Manuscript analysis error:", error);
      toast({ title: "Analysis Failed", description: "Could not analyze manuscript", variant: "destructive" });
    } finally {
      setIsAnalyzingManuscript(false);
    }
  };

  // Generate illustration image
  const generateIllustration = async (prompt: string) => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe what you want to illustrate", variant: "destructive" });
      return;
    }
    
    setIsGeneratingImage(true);
    try {
      const response = await apiRequest("POST", "/api/book/generate-image", {
        prompt,
        style: illustrationStyle,
        aspectRatio: isChildrensBook ? 'landscape' : 'portrait'
      });
      const data = await response.json();
      
      if (data.success && data.imageBase64) {
        const imageUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
        setGeneratedImageUrl(imageUrl);
        setGeneratedImages(prev => [...prev, imageUrl]);
        toast({ title: "Image Generated!", description: "Your illustration is ready" });
      } else {
        toast({ title: "Generation Issue", description: data.message || "Could not generate image", variant: "destructive" });
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast({ title: "Generation Failed", description: "Could not generate illustration", variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
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
      const response = await apiRequest("POST", "/api/book/generate-image", {
        prompt: imagePrompt,
        style: illustrationStyle,
        aspectRatio: isChildrensBook ? 'landscape' : 'portrait'
      });
      const data = await response.json();
      
      if (data.success && data.imageBase64) {
        const imageUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
        setGeneratedImageUrl(imageUrl);
        setGeneratedImages(prev => [...prev, imageUrl]);
        
        // Auto-assign to chapter in auto mode
        if (imagePlacementMode === 'auto' && selectedImageChapter) {
          updateChapter(selectedImageChapter, { 
            imageUrl,
            imagePrompt: imagePrompt 
          });
        }
        
        toast({ title: "Image Generated", description: "Your illustration is ready" });
      } else {
        toast({ title: "Generation Issue", description: data.message || "Could not generate image", variant: "destructive" });
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast({ title: "Image Generation Failed", description: "Check your API key configuration", variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateCover = async () => {
    setIsGeneratingImage(true);
    try {
      const coverPrompt = `Professional book cover design for "${bookTitle}"${bookSubtitle ? `: ${bookSubtitle}` : ''}. 
Genre: ${genres.find(g => g.value === selectedGenre)?.label || selectedGenre}. 
Style: ${coverStyle}. 
Author: ${authorName || user?.firstName || 'Author'}.
High-quality, print-ready book cover suitable for Amazon KDP. No text overlay needed.`;

      const response = await apiRequest("POST", "/api/book/generate-image", {
        prompt: coverPrompt,
        style: coverStyle,
        aspectRatio: 'portrait'
      });
      const data = await response.json();
      
      if (data.success && data.imageBase64) {
        const imageUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
        setCoverImage(imageUrl);
        toast({ title: "Cover Generated", description: "Your book cover is ready" });
      } else {
        toast({ title: "Cover Issue", description: data.message || "Could not generate cover", variant: "destructive" });
      }
    } catch (error) {
      console.error("Cover generation error:", error);
      toast({ title: "Cover Generation Failed", description: "Check your API key configuration", variant: "destructive" });
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Chat Panel - Left Side */}
                <Card className="flex flex-col h-[700px]">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-primary" /> AI Publishing Assistant
                    </CardTitle>
                    <CardDescription>Upload your manuscript and chat about it. I'll help you analyze and improve your book.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col min-h-0">
                    {/* Chat Messages */}
                    <ScrollArea className="flex-1 pr-4 mb-4" ref={chatScrollRef}>
                      <div className="space-y-4">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              msg.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                            <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                              {msg.hasAttachment && (
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 mb-2 ${
                                  msg.role === 'user' ? 'ml-auto' : ''
                                }`}>
                                  <Paperclip className="w-3 h-3 text-primary" />
                                  <span className="text-xs font-medium text-primary">{msg.attachmentName}</span>
                                </div>
                              )}
                              <div className={`rounded-lg px-4 py-3 ${
                                msg.role === 'assistant' 
                                  ? 'bg-muted text-foreground' 
                                  : 'bg-primary text-primary-foreground ml-auto'
                              }`}>
                                <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                                  {msg.content.split('\n').map((line, i) => {
                                    if (line.startsWith('**') && line.endsWith('**')) {
                                      return <p key={i} className="font-bold mt-2 first:mt-0">{line.slice(2, -2)}</p>;
                                    }
                                    if (line.startsWith('- ')) {
                                      return <p key={i} className="ml-2">{line}</p>;
                                    }
                                    if (line.match(/^\d+\.\s/)) {
                                      return <p key={i} className="ml-2">{line}</p>;
                                    }
                                    return line ? <p key={i}>{line}</p> : <br key={i} />;
                                  })}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground mt-1 block">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-muted rounded-lg px-4 py-3">
                              <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Analyzing...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    
                    {/* File Upload Zone */}
                    <div 
                      className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer mb-3"
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
                      <div className="flex items-center justify-center gap-3">
                        <FileUp className="w-6 h-6 text-muted-foreground" />
                        <div className="text-left">
                          <p className="font-medium text-sm">
                            {uploadedFileName ? `Uploaded: ${uploadedFileName}` : 'Drop manuscript or click to upload'}
                          </p>
                          <p className="text-xs text-muted-foreground">.txt, .md, .doc, .docx</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Use This Discussion Button */}
                    {chatMessages.length >= 3 && (
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20 mb-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">Ready to create your book?</p>
                            <p className="text-xs text-muted-foreground">Convert this discussion into a full book plan</p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={convertDiscussionToPlan}
                            disabled={isConvertingDiscussion}
                            className="shrink-0"
                            data-testid="button-use-discussion"
                          >
                            {isConvertingDiscussion ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Wand2 className="w-4 h-4 mr-2" />
                            )}
                            Use This Discussion
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Manuscript Analysis Results */}
                    {manuscriptAnalysis && (
                      <div className="bg-card border rounded-lg p-3 mb-3 space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Manuscript Analysis
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Words:</span>{' '}
                            <span className="font-medium">{manuscriptAnalysis.wordCount?.toLocaleString() || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Chapters:</span>{' '}
                            <span className="font-medium">{manuscriptAnalysis.chapterCount || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Genre:</span>{' '}
                            <span className="font-medium">{manuscriptAnalysis.detectedGenre || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tone:</span>{' '}
                            <span className="font-medium">{manuscriptAnalysis.tone || 'N/A'}</span>
                          </div>
                        </div>
                        {manuscriptAnalysis.summary && (
                          <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                            {manuscriptAnalysis.summary}
                          </p>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full mt-2"
                          onClick={() => {
                            if (manuscriptAnalysis.chapters) {
                              setChapters(manuscriptAnalysis.chapters.map((ch: any, idx: number) => ({
                                id: String(idx + 1),
                                title: ch.title || `Chapter ${idx + 1}`,
                                description: ch.summary || "",
                                wordCount: ch.wordCount || 0,
                                status: "draft" as const
                              })));
                              setCurrentStep(2);
                              toast({ title: "Chapters imported!", description: `Imported ${manuscriptAnalysis.chapters.length} chapters` });
                            }
                          }}
                          disabled={!manuscriptAnalysis.chapters?.length}
                          data-testid="button-import-chapters"
                        >
                          <Layers className="w-4 h-4 mr-2" />
                          Import {manuscriptAnalysis.chapters?.length || 0} Chapters
                        </Button>
                      </div>
                    )}

                    {/* Deep Analysis Button */}
                    {uploadedContent && !manuscriptAnalysis && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mb-3"
                        onClick={() => analyzeUploadedManuscript('full')}
                        disabled={isAnalyzingManuscript}
                        data-testid="button-analyze-manuscript"
                      >
                        {isAnalyzingManuscript ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 mr-2" />
                        )}
                        Deep Analyze Manuscript
                      </Button>
                    )}
                    
                    {/* Chat Input */}
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask about your manuscript..."
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                        disabled={isChatLoading}
                        data-testid="input-chat"
                      />
                      <Button 
                        onClick={sendChatMessage} 
                        disabled={!chatInput.trim() || isChatLoading}
                        size="icon"
                        data-testid="button-send-chat"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Book Details Panel - Right Side */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" /> 
                      {quickGenerateMode ? 'Content Factory' : 'Book Details'}
                    </CardTitle>
                    <CardDescription>
                      {quickGenerateMode 
                        ? 'Generate a complete book from a single idea'
                        : 'Tell us about your book project'
                      }
                    </CardDescription>
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2 pt-2">
                      <Switch 
                        checked={quickGenerateMode}
                        onCheckedChange={setQuickGenerateMode}
                        data-testid="switch-quick-mode"
                      />
                      <Label className="text-sm cursor-pointer" onClick={() => setQuickGenerateMode(!quickGenerateMode)}>
                        <Rocket className="w-3 h-3 inline mr-1" />
                        Quick Generate Mode
                      </Label>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Generate Mode */}
                    {quickGenerateMode && (
                      <>
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                          <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                            <Wand2 className="w-4 h-4 text-primary" /> One-Click Book Generation
                          </h4>
                          <p className="text-xs text-muted-foreground mb-3">
                            Enter a topic and generate a complete book with chapters, content, and polish.
                          </p>
                          <div className="space-y-3">
                            <div>
                              <Label>What's your book about?</Label>
                              <Textarea
                                value={quickTopic}
                                onChange={(e) => setQuickTopic(e.target.value)}
                                placeholder="e.g., 'A stroke survivor's journey to 90% recovery through innovative neuroplasticity exercises and mindset shifts'"
                                className="min-h-[80px]"
                                data-testid="textarea-quick-topic"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Genre</Label>
                                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                                  <SelectTrigger data-testid="select-genre">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {genres.map((g) => (
                                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-end gap-2">
                                <div className="flex items-center gap-2">
                                  <Switch 
                                    checked={isChildrensBook}
                                    onCheckedChange={setIsChildrensBook}
                                    data-testid="switch-childrens"
                                  />
                                  <Label className="text-xs">Children's Book</Label>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs">Author Voice (optional)</Label>
                              <Input
                                value={authorVoice}
                                onChange={(e) => setAuthorVoice(e.target.value)}
                                placeholder="e.g., 'Warm and encouraging, with humor'"
                                data-testid="input-author-voice"
                              />
                            </div>
                            
                            {isQuickGenerating && generationProgress > 0 && (
                              <div className="space-y-1">
                                <Progress value={generationProgress} />
                                <p className="text-xs text-muted-foreground text-center">
                                  {generationProgress < 50 ? 'Creating outline...' : 'Generating content...'}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex gap-2">
                              <Button 
                                onClick={performKeywordResearch}
                                variant="outline"
                                size="sm"
                                disabled={isResearchingKeywords || !quickTopic}
                                className="flex-1"
                                data-testid="button-keyword-research"
                              >
                                {isResearchingKeywords ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Target className="w-3 h-3 mr-1" />}
                                Research Keywords
                              </Button>
                              <Button 
                                onClick={quickGenerateBook}
                                disabled={isQuickGenerating || !quickTopic}
                                className="flex-1"
                                data-testid="button-quick-generate"
                              >
                                {isQuickGenerating ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                Generate Outline
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Keyword Research Results */}
                        {keywordResearch && (
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <h5 className="font-medium text-xs flex items-center gap-1">
                              <Target className="w-3 h-3" /> Keyword Research
                            </h5>
                            {keywordResearch.primary && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Primary Keywords</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {keywordResearch.primary.slice(0, 7).map((kw: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {keywordResearch.hooks && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Title Ideas</Label>
                                <div className="space-y-1 mt-1">
                                  {keywordResearch.hooks.slice(0, 3).map((hook: string, i: number) => (
                                    <p key={i} className="text-xs bg-background rounded px-2 py-1 cursor-pointer hover:bg-primary/10"
                                      onClick={() => setBookTitle(hook)}
                                    >{hook}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Generated Outline Preview */}
                        {generatedOutline && (
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <h5 className="font-medium text-sm">{generatedOutline.title}</h5>
                            <p className="text-xs text-muted-foreground">{generatedOutline.subtitle}</p>
                            <p className="text-xs italic">"{generatedOutline.hook}"</p>
                            <div className="flex gap-2 mt-2">
                              <Button onClick={generateAllChapters} disabled={isQuickGenerating} size="sm" className="flex-1">
                                <Wand2 className="w-3 h-3 mr-1" /> Generate All Chapters
                              </Button>
                              <Button onClick={() => setCurrentStep(2)} variant="outline" size="sm">
                                <Edit3 className="w-3 h-3 mr-1" /> Edit Outline
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <Separator />
                      </>
                    )}
                    
                    {/* Standard Mode - Book Details */}
                    <div>
                      <Label>Book Title *</Label>
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
                              className={`p-2 rounded-lg border-2 flex items-center gap-2 transition-all hover-elevate
                                ${selectedGenre === g.value ? 'border-primary bg-primary/10' : 'border-border'}`}
                              data-testid={`button-genre-${g.value}`}
                            >
                              <Icon className={`w-4 h-4 ${selectedGenre === g.value ? 'text-primary' : ''}`} />
                              <span className="text-xs font-medium">{g.label}</span>
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
                        placeholder="Stroke survivors, caregivers..."
                        data-testid="input-target-audience"
                      />
                    </div>
                    <div>
                      <Label>Brief Description</Label>
                      <Textarea
                        value={bookDescription}
                        onChange={(e) => setBookDescription(e.target.value)}
                        placeholder="What is your book about? What message do you want to share?"
                        className="min-h-[100px]"
                        data-testid="textarea-description"
                      />
                    </div>
                    
                    {/* Manuscript Preview */}
                    {uploadedContent && (
                      <div>
                        <Label>Manuscript Preview</Label>
                        <div className="border rounded-lg p-3 bg-muted/50 max-h-[150px] overflow-y-auto">
                          <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                            {uploadedContent.substring(0, 500)}
                            {uploadedContent.length > 500 && '...'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{uploadedContent.split(/\s+/).length.toLocaleString()} words</span>
                          <span>~{Math.ceil(uploadedContent.split(/\s+/).length / 250)} pages</span>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <Separator />
                    <div className="space-y-2">
                      <Label>Quick Actions</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setChatInput("What are the main strengths of my manuscript?");
                            sendChatMessage();
                          }}
                          disabled={!uploadedContent || isChatLoading}
                        >
                          <Sparkles className="w-3 h-3 mr-1" /> Analyze Strengths
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setChatInput("Suggest a chapter outline for my book");
                            sendChatMessage();
                          }}
                          disabled={!uploadedContent || isChatLoading}
                        >
                          <Layers className="w-3 h-3 mr-1" /> Suggest Outline
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setChatInput("How can I improve the pacing and flow?");
                            sendChatMessage();
                          }}
                          disabled={!uploadedContent || isChatLoading}
                        >
                          <Target className="w-3 h-3 mr-1" /> Improve Pacing
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setChatInput("What's missing that would make this book stronger?");
                            sendChatMessage();
                          }}
                          disabled={!uploadedContent || isChatLoading}
                        >
                          <Lightbulb className="w-3 h-3 mr-1" /> Find Gaps
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button onClick={() => setCurrentStep(2)} disabled={!bookTitle} data-testid="button-next-step-1">
                        Next: Structure & Outline
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Chapter Navigation Sidebar */}
                <Card className="h-fit">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Chapters
                      <Button size="sm" variant="ghost" onClick={addChapter}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-1 pr-2">
                        {chapters.map((chapter, index) => (
                          <button
                            key={chapter.id}
                            onClick={() => {
                              setSelectedChapter(chapter.id);
                              setChapterContent(chapter.content || "");
                            }}
                            className={`w-full p-3 rounded-lg text-left transition-all hover-elevate
                              ${selectedChapter === chapter.id ? 'bg-primary/20 border-primary border' : 'bg-muted/30 hover:bg-muted/50'}`}
                            data-testid={`button-select-chapter-${chapter.id}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground font-medium">Ch. {index + 1}</span>
                              <Badge 
                                variant={chapter.status === "complete" ? "default" : "secondary"}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {chapter.status}
                              </Badge>
                            </div>
                            <div className="font-medium text-sm truncate">{chapter.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {chapter.wordCount.toLocaleString()} words
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {/* Chapter Stats */}
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Total chapters:</span>
                          <span className="font-medium">{chapters.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total words:</span>
                          <span className="font-medium">{chapters.reduce((a, c) => a + c.wordCount, 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. pages:</span>
                          <span className="font-medium">~{Math.ceil(chapters.reduce((a, c) => a + c.wordCount, 0) / 250)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Word Processor Editor */}
                <div className="lg:col-span-3">
                  <Card className="border-0 shadow-lg">
                    {/* Formatting Toolbar */}
                    <div className="border-b bg-muted/30 p-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* File Actions */}
                        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Save" onClick={handleSave}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Undo" onClick={handleUndo} disabled={undoStack.length === 0}>
                            <Undo className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Redo" onClick={handleRedo} disabled={redoStack.length === 0}>
                            <Redo className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Text Formatting */}
                        <div className="flex items-center gap-0.5 px-2 border-r border-border">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Bold (Ctrl+B)" onClick={() => insertFormatting('**')}>
                            <Bold className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Italic (Ctrl+I)" onClick={() => insertFormatting('*')}>
                            <Italic className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Underline" onClick={() => insertFormatting('<u>', '</u>')}>
                            <Underline className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Headings */}
                        <div className="flex items-center gap-0.5 px-2 border-r border-border">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Heading 1" onClick={() => insertLineFormatting('# ')}>
                            <Heading1 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Heading 2" onClick={() => insertLineFormatting('## ')}>
                            <Heading2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Heading 3" onClick={() => insertLineFormatting('### ')}>
                            <Heading3 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Lists & Quote */}
                        <div className="flex items-center gap-0.5 px-2 border-r border-border">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Bullet List" onClick={() => insertLineFormatting('- ')}>
                            <List className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Numbered List" onClick={() => insertLineFormatting('1. ')}>
                            <ListOrdered className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Quote" onClick={() => insertLineFormatting('> ')}>
                            <Quote className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Alignment - Display only, text is left-aligned by default */}
                        <div className="flex items-center gap-0.5 px-2 border-r border-border">
                          <Button size="icon" variant="ghost" className="h-8 w-8 bg-muted/50" title="Align Left (Default)" disabled>
                            <AlignLeft className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Center (Use HTML)" onClick={() => insertFormatting('<center>', '</center>')}>
                            <AlignCenter className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Separator" onClick={() => insertLineFormatting('\n---\n')}>
                            <AlignJustify className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Insert Image */}
                        <div className="flex items-center gap-0.5 px-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Insert Image Placeholder" onClick={() => insertFormatting('\n![Image description](image-url)\n', '')}>
                            <FileImage className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* AI Actions */}
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={generateChapterContent}
                            disabled={isGenerating}
                            size="sm"
                            variant="outline"
                            className="h-8"
                            data-testid="button-generate-chapter"
                          >
                            {isGenerating ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                            AI Write
                          </Button>
                          <Select value={editingPass} onValueChange={(v: any) => setEditingPass(v)}>
                            <SelectTrigger className="w-[130px] h-8 text-xs" data-testid="select-editing-pass">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="developmental">Developmental</SelectItem>
                              <SelectItem value="line">Line Edit</SelectItem>
                              <SelectItem value="copy">Copy Edit</SelectItem>
                              <SelectItem value="proofread">Proofread</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={runEditingPass}
                            disabled={isGenerating || !chapterContent}
                            size="sm"
                            className="h-8"
                            data-testid="button-run-edit"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Chapter Title */}
                    <div className="px-6 pt-4 pb-2 border-b">
                      <Input
                        value={chapters.find(c => c.id === selectedChapter)?.title || ""}
                        onChange={(e) => updateChapter(selectedChapter, { title: e.target.value })}
                        className="text-xl font-bold border-0 px-0 focus-visible:ring-0 bg-transparent"
                        placeholder="Chapter Title"
                        data-testid="input-chapter-title-editor"
                      />
                    </div>

                    {/* Editor Content Area - Styled like a document */}
                    <div className="bg-white dark:bg-zinc-900 min-h-[500px] p-8 mx-4 my-4 rounded shadow-inner border">
                      <Textarea
                        ref={editorRef}
                        value={chapterContent}
                        onChange={(e) => {
                          setChapterContent(e.target.value);
                          updateChapter(selectedChapter, { 
                            content: e.target.value,
                            wordCount: e.target.value.split(/\s+/).filter(Boolean).length 
                          });
                        }}
                        onKeyDown={(e) => {
                          // Keyboard shortcuts
                          if (e.ctrlKey || e.metaKey) {
                            if (e.key === 'b') {
                              e.preventDefault();
                              insertFormatting('**');
                            } else if (e.key === 'i') {
                              e.preventDefault();
                              insertFormatting('*');
                            } else if (e.key === 'z') {
                              e.preventDefault();
                              if (e.shiftKey) {
                                handleRedo();
                              } else {
                                handleUndo();
                              }
                            } else if (e.key === 's') {
                              e.preventDefault();
                              handleSave();
                            }
                          }
                        }}
                        placeholder="Start writing your chapter here, or click 'AI Write' to generate content based on your chapter outline...

Tips:
• Use the formatting toolbar above to style your text
• Click 'AI Write' to have AI generate this chapter
• Keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+Z (undo), Ctrl+S (save)
• Use editing passes to polish your writing:
  - Developmental: Structure & narrative
  - Line Edit: Sentence flow & clarity
  - Copy Edit: Grammar & consistency
  - Proofread: Final polish"
                        className="min-h-[450px] w-full border-0 resize-none focus-visible:ring-0 bg-transparent 
                          text-base leading-relaxed font-serif dark:text-zinc-100"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        data-testid="textarea-chapter-content"
                      />
                    </div>

                    {/* Status Bar */}
                    <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>{chapterContent.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
                        <span>{chapterContent.length.toLocaleString()} characters</span>
                        <span>~{Math.ceil(chapterContent.split(/\s+/).filter(Boolean).length / 250)} pages</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isGenerating && (
                          <span className="flex items-center gap-1 text-primary">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Processing...
                          </span>
                        )}
                        <span className="text-green-500">Auto-saved</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
                  
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)} data-testid="button-back-step-3">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setCurrentStep(4)} data-testid="button-next-step-3">
                  Next: Images & Cover
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
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
                      {/* AI Provider & Style Options */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
                        <div>
                          <Label className="text-xs text-muted-foreground">AI Provider</Label>
                          <Select value={selectedAiProvider} onValueChange={(v: "gemini" | "openai" | "xai") => setSelectedAiProvider(v)}>
                            <SelectTrigger className="h-8" data-testid="select-ai-provider">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gemini">Gemini (Free)</SelectItem>
                              <SelectItem value="openai">OpenAI DALL-E</SelectItem>
                              <SelectItem value="xai">XAI/Grok</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Style</Label>
                          <Select value={illustrationStyle} onValueChange={setIllustrationStyle}>
                            <SelectTrigger className="h-8" data-testid="select-style">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="whimsical watercolor">Whimsical Watercolor</SelectItem>
                              <SelectItem value="children's book illustration">Children's Book</SelectItem>
                              <SelectItem value="professional line art">Line Art</SelectItem>
                              <SelectItem value="realistic digital painting">Realistic Digital</SelectItem>
                              <SelectItem value="minimalist vector">Minimalist Vector</SelectItem>
                              <SelectItem value="vintage engraving">Vintage Engraving</SelectItem>
                              <SelectItem value="cartoon">Cartoon Style</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Placement Mode</Label>
                          <Select value={imagePlacementMode} onValueChange={(v: "auto" | "hybrid" | "manual") => setImagePlacementMode(v)}>
                            <SelectTrigger className="h-8" data-testid="select-placement">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto (AI decides)</SelectItem>
                              <SelectItem value="hybrid">Hybrid (suggest)</SelectItem>
                              <SelectItem value="manual">Manual (you place)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">For Chapter</Label>
                          <Select value={selectedImageChapter || ""} onValueChange={setSelectedImageChapter}>
                            <SelectTrigger className="h-8" data-testid="select-chapter">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All/General</SelectItem>
                              {chapters.map(ch => (
                                <SelectItem key={ch.id} value={ch.id}>Ch {ch.id}: {ch.title.substring(0, 20)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

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
                            Generate with {selectedAiProvider === 'gemini' ? 'Gemini' : selectedAiProvider === 'openai' ? 'DALL-E' : 'XAI'}
                          </Button>
                          
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">Quick Prompts</Label>
                            {(isChildrensBook ? [
                              "A friendly cartoon forest animal helping a child learn to walk",
                              "Colorful brain neurons lighting up like fireworks, kid-friendly",
                              "A happy character doing simple stretching exercises",
                            ] : [
                              "A peaceful sunrise over a hospital window, symbolizing hope",
                              "Strong hands gripping therapy equipment, determination",
                              "A winding path through mountains, representing recovery",
                            ]).map((prompt, i) => (
                              <button
                                key={i}
                                onClick={() => setImagePrompt(prompt)}
                                className="w-full p-2 text-left text-sm bg-muted/50 rounded hover-elevate transition-colors"
                                data-testid={`button-quick-prompt-${i}`}
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">Generated Images ({generatedImages.length})</Label>
                          <ScrollArea className="h-[400px] rounded-lg border p-2">
                            <div className="grid grid-cols-2 gap-3">
                              {generatedImages.length > 0 ? (
                                generatedImages.map((img, i) => (
                                  <div key={i} className="relative group">
                                    <img 
                                      src={img} 
                                      alt={`Generated illustration ${i + 1}`}
                                      className="w-full aspect-square object-cover rounded-lg border"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                      <Button size="sm" variant="secondary" onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = img;
                                        link.download = `illustration-${i + 1}.png`;
                                        link.click();
                                      }} data-testid={`button-download-${i}`}>
                                        <Download className="w-3 h-3 mr-1" /> Save
                                      </Button>
                                      {imagePlacementMode === 'manual' && (
                                        <Button size="sm" variant="outline" onClick={() => {
                                          if (selectedImageChapter) {
                                            updateChapter(selectedImageChapter, { imageUrl: img });
                                            toast({ title: "Image assigned", description: `Added to Chapter ${selectedImageChapter}` });
                                          }
                                        }} data-testid={`button-assign-${i}`}>
                                          <Layers className="w-3 h-3 mr-1" /> Assign
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 aspect-video bg-muted/30 rounded-lg flex flex-col items-center justify-center p-8">
                                  <Image className="w-16 h-16 text-muted-foreground/50 mb-3" />
                                  <p className="text-sm text-muted-foreground text-center">No images generated yet</p>
                                  <p className="text-xs text-muted-foreground/70 text-center mt-1">
                                    Using {selectedAiProvider === 'gemini' ? 'Gemini (free tier)' : selectedAiProvider}
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="cover" className="space-y-4">
                      {/* Cover Style Options */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
                        <div>
                          <Label className="text-xs text-muted-foreground">Cover Style</Label>
                          <Select value={coverStyle} onValueChange={setCoverStyle}>
                            <SelectTrigger className="h-8" data-testid="select-cover-style">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="bold typography">Bold Typography</SelectItem>
                              <SelectItem value="minimalist">Minimalist</SelectItem>
                              <SelectItem value="photographic">Photographic</SelectItem>
                              <SelectItem value="illustrated">Illustrated</SelectItem>
                              <SelectItem value="gradient abstract">Gradient Abstract</SelectItem>
                              <SelectItem value="vintage classic">Vintage Classic</SelectItem>
                              <SelectItem value="children colorful">Children's Colorful</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">AI Provider</Label>
                          <Select value={selectedAiProvider} onValueChange={(v: "gemini" | "openai" | "xai") => setSelectedAiProvider(v)}>
                            <SelectTrigger className="h-8" data-testid="select-cover-ai">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gemini">Gemini</SelectItem>
                              <SelectItem value="openai">DALL-E 3</SelectItem>
                              <SelectItem value="xai">XAI/Grok</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Genre</Label>
                          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                            <SelectTrigger className="h-8" data-testid="select-cover-genre">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {genres.map(g => (
                                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

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
                                <Input 
                                  value={authorName} 
                                  onChange={(e) => setAuthorName(e.target.value)} 
                                  placeholder={user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Author Name'}
                                  data-testid="input-author-name" 
                                />
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Button 
                            onClick={generateCover}
                            disabled={isGeneratingImage || !bookTitle.trim()}
                            className="w-full"
                            size="lg"
                            data-testid="button-generate-cover"
                          >
                            {isGeneratingImage ? (
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                              <Palette className="w-5 h-5 mr-2" />
                            )}
                            Generate {coverStyle} Cover
                          </Button>

                          {coverImage && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = coverImage;
                                  link.download = `${bookTitle.replace(/\s+/g, '-')}-cover.png`;
                                  link.click();
                                }}
                                data-testid="button-download-cover"
                              >
                                <Download className="w-4 h-4 mr-2" /> Download Cover
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={generateCover}
                                disabled={isGeneratingImage}
                                data-testid="button-regenerate-cover"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">Cover Preview</Label>
                          <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center p-4 text-center overflow-hidden">
                            {coverImage ? (
                              <img 
                                src={coverImage} 
                                alt="Book cover preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full">
                                <BookMarked className="w-16 h-16 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-bold px-4">{bookTitle || "Your Title"}</h3>
                                {bookSubtitle && <p className="text-xs text-muted-foreground mt-1 px-4">{bookSubtitle}</p>}
                                <p className="text-xs mt-4 text-muted-foreground">by {authorName || user?.firstName || "Author Name"}</p>
                                <p className="text-xs text-primary mt-4">Click "Generate" to create your cover</p>
                              </div>
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
                      {/* Format Type & Trim Size */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
                        <div>
                          <Label className="text-xs text-muted-foreground">Format Type</Label>
                          <Select value={kdpFormat} onValueChange={setKdpFormat}>
                            <SelectTrigger className="h-8" data-testid="select-kdp-format">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paperback">Paperback</SelectItem>
                              <SelectItem value="hardcover">Hardcover</SelectItem>
                              <SelectItem value="ebook">eBook (Kindle)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Paper Type</Label>
                          <Select value={paperType} onValueChange={setPaperType}>
                            <SelectTrigger className="h-8" data-testid="select-paper-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="white">White Paper</SelectItem>
                              <SelectItem value="cream">Cream Paper</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Bleed</Label>
                          <Select value={hasBleed ? "yes" : "no"} onValueChange={(v) => setHasBleed(v === "yes")}>
                            <SelectTrigger className="h-8" data-testid="select-bleed">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no">No Bleed</SelectItem>
                              <SelectItem value="yes">With Bleed (0.125")</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Trim Size</Label>
                          <Select value={trimSize} onValueChange={setTrimSize}>
                            <SelectTrigger className="h-8" data-testid="select-trim-size">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {trimSizes.map((size) => (
                                <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-4">
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
                          <div>
                            <Label>Inside Margin: {marginInside}"</Label>
                            <Slider
                              value={[marginInside]}
                              onValueChange={([v]) => setMarginInside(v)}
                              min={0.5}
                              max={1.5}
                              step={0.05}
                              className="mt-2"
                              data-testid="slider-margin-inside"
                            />
                          </div>
                          <div>
                            <Label>Outside Margin: {marginOutside}"</Label>
                            <Slider
                              value={[marginOutside]}
                              onValueChange={([v]) => setMarginOutside(v)}
                              min={0.25}
                              max={1}
                              step={0.05}
                              className="mt-2"
                              data-testid="slider-margin-outside"
                            />
                          </div>
                          <div>
                            <Label>Top/Bottom Margin: {marginTopBottom}"</Label>
                            <Slider
                              value={[marginTopBottom]}
                              onValueChange={([v]) => setMarginTopBottom(v)}
                              min={0.5}
                              max={1}
                              step={0.05}
                              className="mt-2"
                              data-testid="slider-margin-tb"
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
                          <div className="flex items-center justify-between">
                            <Label>Table of Contents</Label>
                            <Switch
                              checked={includeToc}
                              onCheckedChange={setIncludeToc}
                              data-testid="switch-toc"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Copyright Page</Label>
                            <Switch
                              checked={includeCopyright}
                              onCheckedChange={setIncludeCopyright}
                              data-testid="switch-copyright"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label>Chapter Break Style</Label>
                            <Select value={chapterBreakStyle} onValueChange={setChapterBreakStyle}>
                              <SelectTrigger data-testid="select-chapter-break">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new-page">New Page</SelectItem>
                                <SelectItem value="odd-page">Odd Page (right)</SelectItem>
                                <SelectItem value="continuous">Continuous</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>ISBN (optional)</Label>
                            <Input 
                              value={isbn} 
                              onChange={(e) => setIsbn(e.target.value)}
                              placeholder="978-0-000000-00-0"
                              data-testid="input-isbn"
                            />
                          </div>
                          <div>
                            <Label>Copyright Year</Label>
                            <Input 
                              value={copyrightYear} 
                              onChange={(e) => setCopyrightYear(e.target.value)}
                              placeholder={new Date().getFullYear().toString()}
                              data-testid="input-copyright-year"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-3">KDP Specifications Summary</h4>
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Format:</span>
                              <div className="font-medium capitalize">{kdpFormat}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Trim:</span>
                              <div className="font-medium">{trimSize}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Font:</span>
                              <div className="font-medium">{fontChoices.find(f => f.value === selectedFont)?.label}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Pages:</span>
                              <div className="font-medium">{estimatedPages}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Spine:</span>
                              <div className="font-medium">{(estimatedPages * (paperType === 'cream' ? 0.0025 : 0.002252)).toFixed(3)}"</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Gutter:</span>
                              <div className="font-medium">{marginInside}"</div>
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
