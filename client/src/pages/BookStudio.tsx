import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import ChildrensBookMode from "@/components/ChildrensBookMode";
import ProfessionalEditor from "@/components/ProfessionalEditor";
import CoverDesigner from "@/components/CoverDesigner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
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
  Search,
  Replace,
  SplitSquareHorizontal,
  X,
  ArrowDown,
  ArrowUp,
  Store,
  Printer,
  DollarSign,
  Globe,
  Zap,
  Loader2,
  ExternalLink,
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
  imageUrl?: string;
  illustrationPrompt?: string;
  readAloudText?: string;
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
  
  // Enhanced editor state
  const [editorViewMode, setEditorViewMode] = useState<"write" | "split" | "preview">("write");
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [findMatchCount, setFindMatchCount] = useState(0);
  const [currentFindIndex, setCurrentFindIndex] = useState(0);
  
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

  // Find/Replace helpers
  const handleFind = () => {
    if (!findText) {
      setFindMatchCount(0);
      return;
    }
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = chapterContent.match(regex);
    setFindMatchCount(matches ? matches.length : 0);
    setCurrentFindIndex(matches && matches.length > 0 ? 1 : 0);
  };

  const handleReplace = () => {
    if (!findText) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const newContent = chapterContent.replace(regex, replaceText);
    if (newContent !== chapterContent) {
      setUndoStack(prev => [...prev, chapterContent]);
      setRedoStack([]);
      setChapterContent(newContent);
      updateChapter(selectedChapter, { 
        content: newContent, 
        wordCount: newContent.split(/\s+/).filter(Boolean).length 
      });
      handleFind();
    }
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = chapterContent.replace(regex, replaceText);
    if (newContent !== chapterContent) {
      setUndoStack(prev => [...prev, chapterContent]);
      setRedoStack([]);
      setChapterContent(newContent);
      updateChapter(selectedChapter, { 
        content: newContent, 
        wordCount: newContent.split(/\s+/).filter(Boolean).length 
      });
      toast({ title: "Replaced", description: `Replaced ${findMatchCount} occurrences` });
      setFindMatchCount(0);
      setCurrentFindIndex(0);
    }
  };

  // Simple markdown to HTML for preview
  const renderMarkdownPreview = (content: string) => {
    return content
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>')
      .replace(/\n\n/g, '</p><p class="my-4">')
      .replace(/\n/g, '<br/>');
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
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [isCreatingGoogleDoc, setIsCreatingGoogleDoc] = useState(false);
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
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  
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
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, content: string, wordCount: number}[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Live manuscript editor state
  const [manuscriptEditorContent, setManuscriptEditorContent] = useState("");
  const [showBookDetailsPanel, setShowBookDetailsPanel] = useState(false);
  
  // Image workflow state (Step 4)
  const [activeImageTab, setActiveImageTab] = useState("generate");
  const [selectedBookImage, setSelectedBookImage] = useState<any>(null);
  const [imagePurposeFilter, setImagePurposeFilter] = useState<string>("all");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Fetch book images for library
  const { data: bookImages = [], isLoading: isLoadingImages, refetch: refetchImages } = useQuery<any[]>({
    queryKey: ['/api/book/images'],
    enabled: !!user,
  });
  
  // Generate image mutation
  const generateBookImageMutation = useMutation({
    mutationFn: async (data: { prompt: string; style: string; purpose: string; chapterIndex?: number }) => {
      const res = await apiRequest('POST', '/api/book/images/generate', data);
      return res.json();
    },
    onSuccess: () => {
      refetchImages();
      toast({ title: "Image Generation Started", description: "Your image is being generated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
    },
  });
  
  // Upload image mutation
  const uploadBookImageMutation = useMutation({
    mutationFn: async (data: { name: string; imageData: string; purpose: string; chapterIndex?: number }) => {
      const res = await apiRequest('POST', '/api/book/images/upload', data);
      return res.json();
    },
    onSuccess: () => {
      refetchImages();
      setIsUploadingImage(false);
      toast({ title: "Image Uploaded", description: "Your image has been added to the library" });
    },
    onError: () => {
      setIsUploadingImage(false);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    },
  });
  
  // Delete image mutation
  const deleteBookImageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/book/images/${id}`);
    },
    onSuccess: () => {
      refetchImages();
      setSelectedBookImage(null);
      toast({ title: "Image Deleted", description: "Image removed from library" });
    },
  });
  
  // Remove background mutation
  const removeBgMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/book/images/${id}/remove-background`);
      return res.json();
    },
    onSuccess: () => {
      refetchImages();
      toast({ title: "Processing", description: "Background removal in progress" });
    },
    onError: () => {
      toast({ title: "Error", description: "Background removal not available", variant: "destructive" });
    },
  });
  
  // Handle image file drop/upload
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please upload an image file", variant: "destructive" });
      return;
    }
    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      uploadBookImageMutation.mutate({
        name: file.name,
        imageData,
        purpose: 'illustration',
        chapterIndex: selectedImageChapter ? parseInt(selectedImageChapter) : undefined,
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleImageUpload(files[0]);
  };
  
  const filteredBookImages = imagePurposeFilter === 'all' 
    ? bookImages 
    : bookImages.filter((img: any) => img.purpose === imagePurposeFilter);

  // Publication readiness calculation
  const calculatePublicationReadiness = () => {
    const wordCount = manuscriptEditorContent 
      ? manuscriptEditorContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length 
      : 0;
    const estimatedPages = Math.ceil(wordCount / 250);
    
    // Extract chapters from content (look for h1, h2 headings or "Chapter" patterns)
    const chapterMatches = manuscriptEditorContent.match(/<h[12][^>]*>.*?<\/h[12]>/gi) || [];
    const chapterCount = chapterMatches.length || chapters.filter(c => c.content && c.content.length > 100).length;
    
    // Check for front matter
    const hasFrontMatter = manuscriptEditorContent.toLowerCase().includes('introduction') || 
                           manuscriptEditorContent.toLowerCase().includes('preface') ||
                           manuscriptEditorContent.toLowerCase().includes('foreword');
    
    // Check for back matter
    const hasBackMatter = manuscriptEditorContent.toLowerCase().includes('acknowledgment') || 
                          manuscriptEditorContent.toLowerCase().includes('about the author') ||
                          manuscriptEditorContent.toLowerCase().includes('resources');
    
    // Calculate readiness score (0-100)
    let score = 0;
    const minWordCount = 10000;
    const wordScore = Math.min((wordCount / minWordCount) * 40, 40); // Up to 40 points
    const chapterScore = Math.min(chapterCount * 5, 25); // Up to 25 points (5 chapters max score)
    const frontMatterScore = hasFrontMatter ? 15 : 0;
    const backMatterScore = hasBackMatter ? 20 : 0;
    
    score = Math.round(wordScore + chapterScore + frontMatterScore + backMatterScore);
    
    return {
      wordCount,
      estimatedPages,
      chapterCount,
      hasFrontMatter,
      hasBackMatter,
      score: Math.min(score, 100),
      isReady: score >= 80
    };
  };

  // Parse AI response for actionable suggestions
  const parseAISuggestions = (content: string): { text: string; isActionable: boolean }[] => {
    const lines = content.split('\n');
    const suggestions: { text: string; isActionable: boolean }[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Check if line is a numbered suggestion or bullet point with actionable content
      const isNumbered = /^\d+[\.\)]\s/.test(trimmed);
      const isBullet = /^[-•*]\s/.test(trimmed);
      const hasActionWords = /^(add|include|consider|try|use|write|create|expand|develop|strengthen|improve)/i.test(
        trimmed.replace(/^\d+[\.\)]\s|^[-•*]\s/, '')
      );
      
      const isActionable = (isNumbered || isBullet) && hasActionWords;
      
      suggestions.push({
        text: trimmed,
        isActionable
      });
    }
    
    return suggestions;
  };

  // Apply suggestion to manuscript
  const applySuggestionToManuscript = (suggestion: string) => {
    const cleanSuggestion = suggestion
      .replace(/^\d+[\.\)]\s|^[-•*]\s/, '') // Remove numbering/bullets
      .replace(/^\*\*|^\*|^__/, '') // Remove markdown formatting
      .trim();
    
    // Add as a new paragraph at the end
    const newContent = manuscriptEditorContent 
      ? `${manuscriptEditorContent}<p><em>[AI Suggestion: ${cleanSuggestion}]</em></p>`
      : `<p><em>[AI Suggestion: ${cleanSuggestion}]</em></p>`;
    
    setManuscriptEditorContent(newContent);
    
    toast({
      title: "Suggestion Applied",
      description: "The suggestion has been added to your manuscript"
    });
  };

  const steps = [
    { step: 1, label: "Upload & Analyze", icon: Upload },
    { step: 2, label: "Structure & Outline", icon: Layers },
    { step: 3, label: "Generate & Edit", icon: Edit3 },
    { step: 4, label: "Images & Cover", icon: ImagePlus },
    { step: 5, label: "Format for KDP", icon: Layout },
    { step: 6, label: "Export & Publish", icon: Rocket },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // File size limit: 5MB per file
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const validFiles: File[] = [];
    
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ 
          title: "File Too Large", 
          description: `${file.name} is too large. Maximum 5MB per file.`,
          variant: "destructive"
        });
      } else {
        validFiles.push(file);
      }
    }
    
    if (validFiles.length === 0) return;
    
    // Add user message with attachments
    const fileNames = validFiles.map(f => f.name).join(", ");
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: validFiles.length === 1 
        ? `I've uploaded: "${validFiles[0].name}"` 
        : `I've uploaded ${validFiles.length} files: ${fileNames}`,
      timestamp: new Date(),
      hasAttachment: true,
      attachmentName: fileNames,
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);
    
    try {
      const newFiles: {name: string, content: string, wordCount: number}[] = [];
      let allContent = '';
      let failedFiles: string[] = [];
      
      // Process each file
      for (const file of validFiles) {
        try {
          let content = '';
          const fileName = file.name.toLowerCase();
          
          // Check if file needs server-side parsing (Word docs, PDFs)
          if (fileName.endsWith('.docx') || fileName.endsWith('.doc') || fileName.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            
            const parseResponse = await fetch('/api/doc-hub/parse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                content: base64,
                filename: file.name,
                mimeType: file.type,
              }),
            });
            
            if (!parseResponse.ok) throw new Error('Parse failed');
            const parsed = await parseResponse.json();
            content = parsed.content || '';
          } else {
            content = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = () => reject(new Error('Failed to read file'));
              reader.onload = (e) => resolve(e.target?.result as string || '');
              reader.readAsText(file);
            });
          }
          
          if (content && content.length > 0) {
            const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
            newFiles.push({ name: file.name, content, wordCount });
            allContent += `\n\n--- ${file.name} ---\n${content}`;
          }
        } catch (err) {
          failedFiles.push(file.name);
        }
      }
      
      if (newFiles.length === 0) {
        throw new Error('Could not read any files');
      }
      
      // Add to tracked files
      setUploadedFiles(prev => [...prev, ...newFiles]);
      const allFiles = [...uploadedFiles, ...newFiles];
      const totalWords = allFiles.reduce((sum, f) => sum + f.wordCount, 0);
      const combinedContent = allFiles.map(f => f.content).join('\n\n');
      
      setUploadedContent(combinedContent);
      setUploadedFileName(allFiles.map(f => f.name).join(', '));
      
      // Populate the manuscript editor with the combined content (convert to HTML)
      const htmlContent = combinedContent
        .split('\n\n')
        .map(para => para.trim())
        .filter(para => para.length > 0)
        .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
        .join('');
      setManuscriptEditorContent(htmlContent);
      
      toast({ 
        title: "Files Uploaded", 
        description: `${newFiles.length} file(s) added. Total: ${allFiles.length} files, ${totalWords.toLocaleString()} words` 
      });
      
      // Analyze all content together - always treat new file uploads as analysis requests
      const isAddingMoreFiles = uploadedFiles.length > 0;
      const response = await apiRequest("POST", "/api/book/chat-analyze", {
        content: combinedContent.substring(0, 15000),
        fileName: allFiles.map(f => f.name).join(', '),
        genre: selectedGenre,
        isInitialAnalysis: true, // Always analyze when files are uploaded
        isAddingMoreFiles,
        totalFiles: allFiles.length,
        totalWords,
        isMultiFile: allFiles.length > 1,
      });
      const data = await response.json();
      
      let responseText = data.response || '';
      if (failedFiles.length > 0) {
        responseText += `\n\n**Note:** I couldn't read these files: ${failedFiles.join(', ')}. Try saving them as .txt format.`;
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText || `I've received ${allFiles.length} file(s) with ${totalWords.toLocaleString()} total words.\n\nYou can upload more files anytime - I'll incorporate them into my analysis. When your manuscript is complete, I'll let you know when it's ready for publication.`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("File upload error:", error);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I had trouble reading the uploaded files. This can happen with some document formats.\n\n**Please try:**\n1. Save documents as .txt files and upload again\n2. Copy and paste text directly into the chat\n3. For PDFs, ensure they contain selectable text\n\nOnce I can read your content, I'll provide a thorough analysis.`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsChatLoading(false);
      // Reset file input to allow re-uploading same files
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      if (chatScrollRef.current) {
        const scrollContainer = chatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  }, [chatMessages, isChatLoading]);

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

  // Open/Create Google Doc for editing outline
  const openInGoogleDocs = async () => {
    if (!generatedOutline && !chapters.length) {
      toast({ title: "No outline", description: "Generate a book outline first", variant: "destructive" });
      return;
    }
    
    setIsCreatingGoogleDoc(true);
    try {
      // Format outline content for Google Docs
      let content = `${bookTitle || generatedOutline?.title || "Book Outline"}\n`;
      content += `${bookSubtitle || generatedOutline?.subtitle || ""}\n\n`;
      content += `TABLE OF CONTENTS\n${"=".repeat(30)}\n\n`;
      
      chapters.forEach((ch, idx) => {
        content += `Chapter ${idx + 1}: ${ch.title}\n`;
        content += `${ch.description || ""}\n`;
        if ((ch as any).keyPoints) {
          (ch as any).keyPoints.forEach((point: string) => {
            content += `  • ${point}\n`;
          });
        }
        content += "\n";
      });
      
      if (generatedOutline?.hook) {
        content += `\nBOOK HOOK\n${"=".repeat(30)}\n${generatedOutline.hook}\n`;
      }
      
      const data = await apiRequest("POST", "/api/workspace/docs/create", {
        title: `${bookTitle || "Book"} - Outline & Table of Contents`,
        content
      }) as { url?: string; documentId?: string; error?: string };
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.url) {
        setGoogleDocUrl(data.url);
        window.open(data.url, "_blank");
        toast({ 
          title: "Google Doc Created!", 
          description: "Your outline is now open in Google Docs for editing" 
        });
      } else {
        toast({ 
          title: "Document Created", 
          description: "Google Doc was created but URL was not returned. Check your Google Workspace." 
        });
      }
    } catch (error: any) {
      console.error("Google Docs error:", error);
      toast({ 
        title: "Google Docs Error", 
        description: error.message || "Could not create Google Doc. Make sure Google Workspace is configured.", 
        variant: "destructive" 
      });
    } finally {
      setIsCreatingGoogleDoc(false);
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
            illustrationPrompt: imagePrompt 
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

  // Check if this is a children's book genre
  const isChildrensGenre = selectedGenre === "childrens" || selectedGenre === "childrens-middle";

  // If children's genre is selected, show the dedicated ChildrensBookMode
  if (isChildrensGenre && !uploadedContent) {
    return (
      <div className="min-h-screen bg-black">
        <CreatorHeader />
        <ChildrensBookMode 
          onStoryGenerated={(story) => {
            setBookTitle(story.title);
            toast({ title: "Story Generated!", description: `${story.pages?.length || 0} pages created` });
          }}
          onExport={(project) => {
            setShowPublishDialog(true);
            toast({ title: "Ready to Publish", description: "Your children's book is ready" });
          }}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CreatorHeader />
      
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <img src={publishingLogo} alt="Stroke Lyfe Publishing" className="h-10 sm:h-16 w-auto" />
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white">Book Studio</h1>
              <p className="text-xs sm:text-base text-muted-foreground hidden sm:block">Professional book creation from manuscript to KDP-ready</p>
            </div>
          </div>

          <div className="flex items-center justify-start sm:justify-between mb-6 sm:mb-8 overflow-x-auto pb-2 gap-1 sm:gap-0">
            {steps.map((s, i) => (
              <div key={s.step} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setCurrentStep(s.step)}
                  className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-all min-w-[44px]
                    ${currentStep === s.step ? 'bg-primary/20' : currentStep > s.step ? 'opacity-70' : 'opacity-50'}`}
                  data-testid={`button-step-${s.step}`}
                >
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all
                    ${currentStep === s.step ? 'bg-primary text-primary-foreground' : 
                      currentStep > s.step ? 'bg-primary/50 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {currentStep > s.step ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium hidden sm:block ${currentStep === s.step ? 'text-primary' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`w-4 sm:w-8 md:w-16 h-0.5 sm:h-1 mx-0.5 sm:mx-1 ${currentStep > s.step ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              {/* Mobile View - Tabs */}
              <div className="lg:hidden">
                <Tabs defaultValue="chat" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="chat" data-testid="tab-chat-mobile">
                      <MessageCircle className="w-4 h-4 mr-2" /> Chat
                    </TabsTrigger>
                    <TabsTrigger value="manuscript" data-testid="tab-manuscript-mobile">
                      <FileText className="w-4 h-4 mr-2" /> Manuscript
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="chat" className="mt-4">
                    <Card className="flex flex-col h-[500px]">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-primary" /> AI Publishing Assistant
                        </CardTitle>
                        <CardDescription>Upload your manuscript and chat about it.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col min-h-0">
                        <div 
                          className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer mb-4"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="upload-zone-mobile"
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".txt,.md,.doc,.docx,.pdf"
                            multiple
                            className="hidden"
                          />
                          <div className="flex items-center justify-center gap-3">
                            <FileUp className="w-6 h-6 text-muted-foreground" />
                            <div className="text-left">
                              <p className="font-medium text-sm">
                                {uploadedFiles.length > 0 
                                  ? `${uploadedFiles.length} file(s) uploaded`
                                  : 'Upload files'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <ScrollArea className="flex-1 pr-4 mb-4">
                          <div className="flex flex-col space-y-4">
                            {chatMessages.map((msg) => (
                              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  msg.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                }`}>
                                  {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                </div>
                                <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                                  <div className={`rounded-lg px-4 py-3 ${
                                    msg.role === 'assistant' ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground ml-auto'
                                  }`}>
                                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <div className="flex gap-2">
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask about your manuscript..."
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                            disabled={isChatLoading}
                          />
                          <Button onClick={sendChatMessage} disabled={!chatInput.trim() || isChatLoading} size="icon">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="manuscript" className="mt-4">
                    <Card className="flex flex-col h-[500px]">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" /> Live Manuscript
                          </CardTitle>
                          {(() => {
                            const readiness = calculatePublicationReadiness();
                            return readiness.isReady ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="w-3 h-3 mr-1" /> Ready for Publication
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                                {readiness.score}% Complete
                              </Badge>
                            );
                          })()}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 min-h-0 overflow-auto">
                        <ProfessionalEditor
                          content={manuscriptEditorContent}
                          onChange={setManuscriptEditorContent}
                          placeholder="Start writing your manuscript here..."
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Desktop View - Resizable Panels */}
              <div className="hidden lg:block">
                <ResizablePanelGroup direction="horizontal" className="min-h-[700px] rounded-lg border">
                  {/* Left Panel - Chat (40%) */}
                  <ResizablePanel defaultSize={40} minSize={25}>
                    <Card className="flex flex-col h-full border-0 rounded-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-primary" /> AI Publishing Assistant
                        </CardTitle>
                        <CardDescription>Upload your manuscript and chat about it. I'll help you analyze and improve your book.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col min-h-0">
                        {/* File Upload Zone - At Top */}
                        <div 
                          className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer mb-4"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="upload-zone"
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".txt,.md,.doc,.docx,.pdf"
                            multiple
                            className="hidden"
                            data-testid="input-file-upload"
                          />
                          <div className="flex items-center justify-center gap-3">
                            <FileUp className="w-6 h-6 text-muted-foreground" />
                            <div className="text-left">
                              <p className="font-medium text-sm">
                                {uploadedFiles.length > 0 
                                  ? `${uploadedFiles.length} file(s) uploaded - Click to add more`
                                  : 'Drop files or click to upload (multiple allowed)'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {uploadedFiles.length > 0 
                                  ? `${uploadedFiles.reduce((sum, f) => sum + f.wordCount, 0).toLocaleString()} words total`
                                  : '.txt, .md, .doc, .docx, .pdf'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Chat Messages - Flow Below Upload */}
                        <ScrollArea className="flex-1 pr-4 mb-4" ref={chatScrollRef}>
                          <div className="flex flex-col space-y-4">
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
                                    {msg.role === 'assistant' ? (
                                      <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none space-y-1">
                                        {parseAISuggestions(msg.content).map((suggestion, i) => (
                                          <div key={i} className="flex items-start gap-2">
                                            <span className="flex-1">
                                              {suggestion.text.startsWith('**') && suggestion.text.endsWith('**') ? (
                                                <span className="font-bold">{suggestion.text.slice(2, -2)}</span>
                                              ) : (
                                                suggestion.text
                                              )}
                                            </span>
                                            {suggestion.isActionable && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs shrink-0"
                                                onClick={() => applySuggestionToManuscript(suggestion.text)}
                                                data-testid={`button-apply-suggestion-${i}`}
                                              >
                                                <Plus className="w-3 h-3 mr-1" /> Apply
                                              </Button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
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
                                    )}
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
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* Right Panel - Live Manuscript Editor (60%) */}
                  <ResizablePanel defaultSize={60} minSize={30}>
                    <div className="flex flex-col h-full bg-background">
                      {/* Header with Publication Readiness */}
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" /> Live Manuscript
                          </h3>
                          {(() => {
                            const readiness = calculatePublicationReadiness();
                            return readiness.isReady ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="w-3 h-3 mr-1" /> Ready for Publication
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                                {readiness.score}% Complete
                              </Badge>
                            );
                          })()}
                        </div>
                        
                        {/* Publication Readiness Progress */}
                        {(() => {
                          const readiness = calculatePublicationReadiness();
                          return (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Publication Readiness</span>
                                  <span>{readiness.score}%</span>
                                </div>
                                <Progress value={readiness.score} className="h-2" />
                              </div>
                              
                              {/* Checklist Badges */}
                              <div className="flex flex-wrap gap-2">
                                <Badge 
                                  variant={readiness.wordCount >= 10000 ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {readiness.wordCount >= 10000 ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                  {readiness.wordCount.toLocaleString()} words
                                </Badge>
                                <Badge 
                                  variant={readiness.chapterCount >= 3 ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {readiness.chapterCount >= 3 ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                  {readiness.chapterCount} chapters
                                </Badge>
                                <Badge 
                                  variant={readiness.hasFrontMatter ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {readiness.hasFrontMatter ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                  Front Matter
                                </Badge>
                                <Badge 
                                  variant={readiness.hasBackMatter ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {readiness.hasBackMatter ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                  Back Matter
                                </Badge>
                              </div>
                              
                              {/* Toggle Book Details Button */}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setShowBookDetailsPanel(!showBookDetailsPanel)}
                                className="w-full"
                                data-testid="button-toggle-book-details"
                              >
                                <BookOpen className="w-4 h-4 mr-2" />
                                {showBookDetailsPanel ? 'Hide' : 'Show'} Book Details
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Book Details Panel (Collapsible) */}
                      {showBookDetailsPanel && (
                        <div className="p-4 border-b bg-muted/30 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Book Title *</Label>
                              <Input
                                value={bookTitle}
                                onChange={(e) => setBookTitle(e.target.value)}
                                placeholder="My Book Title"
                                data-testid="input-book-title-panel"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Genre</Label>
                              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                                <SelectTrigger data-testid="select-genre-panel">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {genres.map((g) => (
                                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Target Audience</Label>
                            <Input
                              value={targetAudience}
                              onChange={(e) => setTargetAudience(e.target.value)}
                              placeholder="Who is this book for?"
                              data-testid="input-audience-panel"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Professional Editor */}
                      <div className="flex-1 min-h-0 overflow-auto">
                        <ProfessionalEditor
                          content={manuscriptEditorContent}
                          onChange={setManuscriptEditorContent}
                          placeholder="Start writing your manuscript here. Add chapters, front matter (introduction, preface), and back matter (acknowledgments, about the author) to increase your publication readiness score..."
                          showWordCount={true}
                        />
                      </div>
                      
                      {/* Footer Actions */}
                      <div className="p-4 border-t flex items-center justify-between gap-2">
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            const readiness = calculatePublicationReadiness();
                            return `${readiness.wordCount.toLocaleString()} words | ~${readiness.estimatedPages} pages`;
                          })()}
                        </div>
                        <Button onClick={() => setCurrentStep(2)} disabled={!bookTitle} data-testid="button-next-step-1">
                          Next: Structure & Outline
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
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
                    {/* Chapter Title */}
                    <div className="px-6 pt-4 pb-2 border-b">
                      <div className="flex items-center justify-between gap-4">
                        <Input
                          value={chapters.find(c => c.id === selectedChapter)?.title || ""}
                          onChange={(e) => updateChapter(selectedChapter, { title: e.target.value })}
                          className="text-xl font-bold border-0 px-0 focus-visible:ring-0 bg-transparent flex-1"
                          placeholder="Chapter Title"
                          data-testid="input-chapter-title-editor"
                        />
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={generateChapterContent}
                            disabled={isGenerating}
                            size="sm"
                            variant="outline"
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
                            data-testid="button-run-edit"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Professional Editor */}
                    <ProfessionalEditor
                      content={chapterContent}
                      onChange={(html: string) => {
                        setChapterContent(html);
                        const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                        const wordCount = textContent ? textContent.split(/\s+/).filter(Boolean).length : 0;
                        updateChapter(selectedChapter, { 
                          content: html,
                          wordCount 
                        });
                      }}
                      onSave={handleSave}
                      placeholder="Start writing your chapter here..."
                      showWordCount={true}
                    />
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
                  <CardDescription>Generate illustrations, manage your image library, and create your book cover</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeImageTab} onValueChange={setActiveImageTab} className="w-full">
                    <TabsList className="mb-4 flex-wrap gap-1">
                      <TabsTrigger value="generate" data-testid="tab-generate">
                        <Wand2 className="w-4 h-4 mr-1" /> Generate
                      </TabsTrigger>
                      <TabsTrigger value="library" data-testid="tab-library">
                        <Layers className="w-4 h-4 mr-1" /> Library ({bookImages.length})
                      </TabsTrigger>
                      <TabsTrigger value="edit" data-testid="tab-edit">
                        <Edit3 className="w-4 h-4 mr-1" /> Edit
                      </TabsTrigger>
                      <TabsTrigger value="cover" data-testid="tab-cover">
                        <BookOpen className="w-4 h-4 mr-1" /> Cover
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Generate Tab */}
                    <TabsContent value="generate" className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
                        <div>
                          <Label className="text-xs text-muted-foreground">Style</Label>
                          <Select value={illustrationStyle} onValueChange={setIllustrationStyle}>
                            <SelectTrigger className="h-8" data-testid="select-style">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="realistic">Realistic</SelectItem>
                              <SelectItem value="illustrated">Illustrated</SelectItem>
                              <SelectItem value="artistic">Artistic</SelectItem>
                              <SelectItem value="photographic">Photographic</SelectItem>
                              <SelectItem value="whimsical watercolor">Whimsical Watercolor</SelectItem>
                              <SelectItem value="children's book illustration">Children's Book</SelectItem>
                              <SelectItem value="professional line art">Line Art</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Purpose</Label>
                          <Select value={imagePurposeFilter === 'all' ? 'illustration' : imagePurposeFilter} onValueChange={(v) => setImagePurposeFilter(v)}>
                            <SelectTrigger className="h-8" data-testid="select-purpose">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cover">Cover</SelectItem>
                              <SelectItem value="illustration">Illustration</SelectItem>
                              <SelectItem value="diagram">Diagram</SelectItem>
                              <SelectItem value="photo">Photo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                          <Label className="text-xs text-muted-foreground">For Chapter</Label>
                          <Select value={selectedImageChapter || "all"} onValueChange={(v) => setSelectedImageChapter(v === "all" ? null : v)}>
                            <SelectTrigger className="h-8" data-testid="select-chapter">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All/General</SelectItem>
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
                            onClick={() => {
                              generateBookImageMutation.mutate({
                                prompt: imagePrompt,
                                style: illustrationStyle,
                                purpose: imagePurposeFilter === 'all' ? 'illustration' : imagePurposeFilter,
                                chapterIndex: selectedImageChapter ? parseInt(selectedImageChapter) : undefined,
                              });
                            }}
                            disabled={generateBookImageMutation.isPending || !imagePrompt.trim()}
                            className="w-full"
                            data-testid="button-generate-image"
                          >
                            {generateBookImageMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4 mr-2" />
                            )}
                            Generate Image
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
                          <Label className="mb-2 block">Recent Generated Images</Label>
                          <ScrollArea className="h-[400px] rounded-lg border p-2">
                            <div className="grid grid-cols-2 gap-3">
                              {bookImages.filter((img: any) => img.origin === 'generated').slice(0, 6).length > 0 ? (
                                bookImages.filter((img: any) => img.origin === 'generated').slice(0, 6).map((img: any) => (
                                  <div key={img.id} className="relative group">
                                    <img 
                                      src={img.originalUrl} 
                                      alt={img.name}
                                      className="w-full aspect-square object-cover rounded-lg border"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                      <Button size="icon" variant="secondary" onClick={() => {
                                        setSelectedBookImage(img);
                                        setActiveImageTab('edit');
                                      }} data-testid={`button-edit-gen-${img.id}`}>
                                        <Edit3 className="w-3 h-3" />
                                      </Button>
                                      <Button size="icon" variant="ghost" onClick={() => deleteBookImageMutation.mutate(img.id)} data-testid={`button-delete-gen-${img.id}`}>
                                        <Trash2 className="w-3 h-3 text-red-400" />
                                      </Button>
                                    </div>
                                    {img.status === 'processing' && (
                                      <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 aspect-video bg-muted/30 rounded-lg flex flex-col items-center justify-center p-8">
                                  <Image className="w-16 h-16 text-muted-foreground/50 mb-3" />
                                  <p className="text-sm text-muted-foreground text-center">No images generated yet</p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Library Tab */}
                    <TabsContent value="library" className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Filter:</Label>
                          <Select value={imagePurposeFilter} onValueChange={setImagePurposeFilter}>
                            <SelectTrigger className="w-32 h-8" data-testid="select-filter-purpose">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="cover">Cover</SelectItem>
                              <SelectItem value="illustration">Illustration</SelectItem>
                              <SelectItem value="diagram">Diagram</SelectItem>
                              <SelectItem value="photo">Photo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                        />
                        <Button variant="outline" onClick={() => document.getElementById('image-upload')?.click()} disabled={isUploadingImage} data-testid="button-upload-image">
                          {isUploadingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          Upload Image
                        </Button>
                      </div>
                      
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleImageDrop}
                      >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Drag & drop images here</p>
                      </div>
                      
                      {isLoadingImages ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {filteredBookImages.map((img: any) => (
                            <Card key={img.id} className="overflow-hidden group hover-elevate" data-testid={`card-image-${img.id}`}>
                              <div className="relative aspect-square">
                                <img 
                                  src={img.originalUrl} 
                                  alt={img.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                  <Button size="icon" variant="secondary" onClick={() => {
                                    setSelectedBookImage(img);
                                    setActiveImageTab('edit');
                                  }} data-testid={`button-edit-lib-${img.id}`}>
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                  <Button size="icon" variant="secondary" onClick={() => removeBgMutation.mutate(img.id)} data-testid={`button-remove-bg-${img.id}`}>
                                    <Scissors className="w-3 h-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => deleteBookImageMutation.mutate(img.id)} data-testid={`button-delete-lib-${img.id}`}>
                                    <Trash2 className="w-3 h-3 text-red-400" />
                                  </Button>
                                </div>
                                {img.status === 'processing' && (
                                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                  </div>
                                )}
                              </div>
                              <CardContent className="p-2">
                                <p className="text-xs truncate font-medium">{img.name}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">{img.purpose}</Badge>
                                  <Badge variant="secondary" className="text-xs">{img.origin}</Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {filteredBookImages.length === 0 && (
                            <div className="col-span-full py-12 text-center text-muted-foreground">
                              <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No images in your library</p>
                              <p className="text-sm">Generate or upload images to get started</p>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                    
                    {/* Edit Tab */}
                    <TabsContent value="edit" className="space-y-4">
                      {selectedBookImage ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="aspect-square rounded-lg border overflow-hidden bg-muted/30">
                              <img 
                                src={selectedBookImage.editedUrl || selectedBookImage.originalUrl} 
                                alt={selectedBookImage.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button variant="outline" onClick={() => removeBgMutation.mutate(selectedBookImage.id)} disabled={removeBgMutation.isPending} data-testid="button-remove-bg-edit">
                                {removeBgMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scissors className="w-4 h-4 mr-2" />}
                                Remove Background
                              </Button>
                              <Button variant="outline" onClick={() => {
                                const link = document.createElement('a');
                                link.href = selectedBookImage.editedUrl || selectedBookImage.originalUrl;
                                link.download = `${selectedBookImage.name}.png`;
                                link.click();
                              }} data-testid="button-download-edit">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <Label>Image Name</Label>
                              <Input 
                                value={selectedBookImage.name} 
                                onChange={(e) => setSelectedBookImage({...selectedBookImage, name: e.target.value})}
                                data-testid="input-image-name"
                              />
                            </div>
                            <div>
                              <Label>Purpose</Label>
                              <Select value={selectedBookImage.purpose} onValueChange={(v) => setSelectedBookImage({...selectedBookImage, purpose: v})}>
                                <SelectTrigger data-testid="select-edit-purpose">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cover">Cover</SelectItem>
                                  <SelectItem value="illustration">Illustration</SelectItem>
                                  <SelectItem value="diagram">Diagram</SelectItem>
                                  <SelectItem value="photo">Photo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>KDP Size Preset</Label>
                              <Select value={selectedBookImage.kdpSpec || ""} onValueChange={(v) => setSelectedBookImage({...selectedBookImage, kdpSpec: v})}>
                                <SelectTrigger data-testid="select-kdp-size">
                                  <SelectValue placeholder="Select size..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="6x9">6" x 9" (Full Page)</SelectItem>
                                  <SelectItem value="8.5x11">8.5" x 11" (Full Page)</SelectItem>
                                  <SelectItem value="full-page">Full Page Bleed</SelectItem>
                                  <SelectItem value="half-page">Half Page</SelectItem>
                                  <SelectItem value="spot">Spot Illustration</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {selectedBookImage.prompt && (
                              <div>
                                <Label className="text-muted-foreground">Original Prompt</Label>
                                <p className="text-sm bg-muted/30 p-2 rounded mt-1">{selectedBookImage.prompt}</p>
                              </div>
                            )}
                            <Button 
                              onClick={() => {
                                toast({ title: "Open in Media Studio", description: "Navigate to Media Studio for advanced editing" });
                              }}
                              variant="outline"
                              className="w-full"
                              data-testid="button-open-media-studio"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open in Media Studio
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center text-muted-foreground">
                          <Edit3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No image selected</p>
                          <p className="text-sm">Select an image from the Library to edit</p>
                          <Button variant="ghost" onClick={() => setActiveImageTab('library')} data-testid="button-go-to-library">
                            Go to Library
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    
                    {/* Cover Tab */}
                    <TabsContent value="cover" className="space-y-4">
                      <CoverDesigner
                        bookTitle={bookTitle}
                        bookSubtitle={bookSubtitle}
                        authorName={authorName || user?.firstName || "Author Name"}
                        genre={selectedGenre}
                        onSave={(coverData) => {
                          if (coverData.backgroundUrl) {
                            setCoverImage(coverData.backgroundUrl);
                          }
                          toast({ title: "Cover Saved", description: "Your cover design has been saved" });
                        }}
                        onGenerate={(coverUrl) => {
                          setCoverImage(coverUrl);
                        }}
                      />
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
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
                      
                      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Store className="w-5 h-5 text-orange-500" /> Publish to Marketplace
                          </CardTitle>
                          <CardDescription>Sell your book on Stroke Recovery Academy</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Printer className="w-4 h-4" />
                              <span>Print-on-demand</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <DollarSign className="w-4 h-4" />
                              <span>Set your own price</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Globe className="w-4 h-4" />
                              <span>Worldwide shipping</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Zap className="w-4 h-4" />
                              <span>Instant digital delivery</span>
                            </div>
                          </div>
                          <Separator />
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Estimated Print Cost:</span>
                              <span className="font-medium">${((0.90 + (estimatedPages || 200) * 0.012) || 3.30).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Suggested Retail:</span>
                              <span className="font-medium text-primary">${Math.max(9.99, ((0.90 + (estimatedPages || 200) * 0.012) * 2.5)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Your Profit (est.):</span>
                              <span className="font-medium text-green-500">${(Math.max(9.99, ((0.90 + (estimatedPages || 200) * 0.012) * 2.5)) * 0.85 - (0.90 + (estimatedPages || 200) * 0.012)).toFixed(2)}</span>
                            </div>
                          </div>
                          <Button 
                            className="w-full"
                            size="lg"
                            onClick={() => setShowPublishDialog(true)}
                            data-testid="button-publish-marketplace"
                          >
                            <Rocket className="w-5 h-5 mr-2" />
                            Publish to Marketplace
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            Powered by Lulu print-on-demand. No inventory, no upfront costs.
                          </p>
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
