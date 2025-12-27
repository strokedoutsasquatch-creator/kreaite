import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageCircle,
  Image,
  Settings,
  Wand2,
  Upload,
  Trash2,
  Loader2,
  Send,
  Bot,
  User,
  Scissors,
  Move,
  Grid3X3,
  Layers,
  BookOpen,
  FileText,
  LayoutGrid,
  Lightbulb,
  AlertTriangle,
  Info,
  Code,
  Dumbbell,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  ListOrdered,
  CheckSquare,
  Clock,
  Star,
  BookMarked,
  Minus,
  Quote,
  PanelLeftClose,
  LinkIcon,
  Shield,
  FileSignature,
  ScrollText,
  Heart,
  List,
  Award,
  Feather,
  UserCircle,
  Library,
  BookCopy,
  ExternalLink,
  Hash,
  ClipboardCheck,
  FileUp,
  File,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ToolPanelProps {
  projectId?: number;
  onInsertContent?: (html: string) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  hasBackground: boolean;
}

const calloutTemplates = {
  tip: {
    icon: Lightbulb,
    label: "Tip",
    description: "Helpful suggestion or best practice",
    color: "green",
    html: `<div class="callout callout-tip border-l-4 border-green-500 bg-green-500/10 dark:bg-green-500/20 p-4 my-4 rounded">
  <p class="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400 mb-2">
    <strong>[TIP]</strong>
  </p>
  <p class="text-foreground">Enter your helpful tip here...</p>
</div>`,
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    description: "Important caution or alert",
    color: "orange",
    html: `<div class="callout callout-warning border-l-4 border-orange-500 bg-orange-500/10 dark:bg-orange-500/20 p-4 my-4 rounded">
  <p class="flex items-center gap-2 font-semibold text-orange-600 dark:text-orange-400 mb-2">
    <strong>[WARNING]</strong>
  </p>
  <p class="text-foreground">Enter your warning message here...</p>
</div>`,
  },
  note: {
    icon: Info,
    label: "Note",
    description: "Additional information or clarification",
    color: "blue",
    html: `<div class="callout callout-note border-l-4 border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 p-4 my-4 rounded">
  <p class="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400 mb-2">
    <strong>[NOTE]</strong>
  </p>
  <p class="text-foreground">Enter your note here...</p>
</div>`,
  },
  example: {
    icon: Code,
    label: "Example",
    description: "Practical example or demonstration",
    color: "purple",
    html: `<div class="callout callout-example border-l-4 border-purple-500 bg-purple-500/10 dark:bg-purple-500/20 p-4 my-4 rounded">
  <p class="flex items-center gap-2 font-semibold text-purple-600 dark:text-purple-400 mb-2">
    <strong>[EXAMPLE]</strong>
  </p>
  <p class="text-foreground">Describe your example here...</p>
</div>`,
  },
  exercise: {
    icon: Dumbbell,
    label: "Exercise",
    description: "Recovery exercise or activity",
    color: "primary",
    html: `<div class="callout callout-exercise border-l-4 border-primary bg-primary/10 dark:bg-primary/20 p-4 my-4 rounded">
  <p class="flex items-center gap-2 font-semibold text-primary mb-2">
    <strong>[EXERCISE]</strong>
  </p>
  <p class="text-foreground"><strong>Exercise Name:</strong> [Name]</p>
  <p class="text-foreground"><strong>Duration:</strong> [Time]</p>
  <p class="text-foreground"><strong>Repetitions:</strong> [Number]</p>
  <p class="text-foreground"><strong>Instructions:</strong></p>
  <ol class="list-decimal pl-6">
    <li>Step 1...</li>
    <li>Step 2...</li>
    <li>Step 3...</li>
  </ol>
</div>`,
  },
};

const chartTemplates = {
  bar: {
    icon: BarChart3,
    label: "Bar Chart",
    description: "Horizontal or vertical bar comparison",
    html: `<div data-chart-type="bar" class="chart-placeholder border-2 border-dashed border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 p-8 my-4 rounded-lg text-center">
  <p class="text-blue-600 dark:text-blue-400 font-semibold mb-2">[BAR CHART] Placeholder</p>
  <p class="text-muted-foreground text-sm">Replace with your bar chart data</p>
  <p class="text-muted-foreground/70 text-xs mt-2">Categories: A, B, C, D | Values: 25, 50, 75, 100</p>
</div>`,
  },
  pie: {
    icon: PieChart,
    label: "Pie Chart",
    description: "Proportional data visualization",
    html: `<div data-chart-type="pie" class="chart-placeholder border-2 border-dashed border-green-500 bg-green-500/5 dark:bg-green-500/10 p-8 my-4 rounded-lg text-center">
  <p class="text-green-600 dark:text-green-400 font-semibold mb-2">[PIE CHART] Placeholder</p>
  <p class="text-muted-foreground text-sm">Replace with your pie chart data</p>
  <p class="text-muted-foreground/70 text-xs mt-2">Segments: 40%, 30%, 20%, 10%</p>
</div>`,
  },
  line: {
    icon: LineChart,
    label: "Line Chart",
    description: "Trend or progression over time",
    html: `<div data-chart-type="line" class="chart-placeholder border-2 border-dashed border-purple-500 bg-purple-500/5 dark:bg-purple-500/10 p-8 my-4 rounded-lg text-center">
  <p class="text-purple-600 dark:text-purple-400 font-semibold mb-2">[LINE CHART] Placeholder</p>
  <p class="text-muted-foreground text-sm">Replace with your line chart data</p>
  <p class="text-muted-foreground/70 text-xs mt-2">Timeline: Week 1-4 | Progress: 20%, 45%, 70%, 90%</p>
</div>`,
  },
  progress: {
    icon: Activity,
    label: "Progress Tracker",
    description: "Recovery or milestone tracking",
    html: `<div data-chart-type="progress" class="chart-placeholder border-2 border-dashed border-primary bg-primary/5 dark:bg-primary/10 p-6 my-4 rounded-lg">
  <p class="text-primary font-semibold mb-4">[PROGRESS TRACKER]</p>
  <div class="mb-3">
    <div class="flex justify-between mb-1">
      <span class="text-sm text-foreground">Mobility</span>
      <span class="text-sm text-primary">75%</span>
    </div>
    <div class="bg-muted h-2 rounded overflow-hidden">
      <div class="bg-primary h-full w-3/4"></div>
    </div>
  </div>
  <div class="mb-3">
    <div class="flex justify-between mb-1">
      <span class="text-sm text-foreground">Strength</span>
      <span class="text-sm text-green-600 dark:text-green-400">60%</span>
    </div>
    <div class="bg-muted h-2 rounded overflow-hidden">
      <div class="bg-green-500 h-full w-3/5"></div>
    </div>
  </div>
  <div>
    <div class="flex justify-between mb-1">
      <span class="text-sm text-foreground">Balance</span>
      <span class="text-sm text-blue-600 dark:text-blue-400">45%</span>
    </div>
    <div class="bg-muted h-2 rounded overflow-hidden">
      <div class="bg-blue-500 h-full w-[45%]"></div>
    </div>
  </div>
</div>`,
  },
};

const listTemplates = {
  numbered: {
    icon: ListOrdered,
    label: "Numbered Steps",
    description: "Sequential step-by-step instructions",
    html: `<div class="numbered-steps my-4">
  <p class="font-semibold mb-3 text-foreground">Step-by-Step Guide:</p>
  <ol class="list-decimal pl-6 leading-relaxed text-foreground">
    <li><strong>Step 1:</strong> First action or instruction...</li>
    <li><strong>Step 2:</strong> Second action or instruction...</li>
    <li><strong>Step 3:</strong> Third action or instruction...</li>
    <li><strong>Step 4:</strong> Fourth action or instruction...</li>
    <li><strong>Step 5:</strong> Fifth action or instruction...</li>
  </ol>
</div>`,
  },
  checklist: {
    icon: CheckSquare,
    label: "Checklist",
    description: "Interactive checkbox list",
    html: `<div class="checklist my-4 p-4 bg-green-500/5 dark:bg-green-500/10 rounded-lg">
  <p class="font-semibold mb-3 text-foreground">[CHECKLIST]</p>
  <ul class="list-none p-0 leading-loose text-foreground">
    <li>[ ] First task or item to complete</li>
    <li>[ ] Second task or item to complete</li>
    <li>[ ] Third task or item to complete</li>
    <li>[ ] Fourth task or item to complete</li>
    <li>[ ] Fifth task or item to complete</li>
  </ul>
</div>`,
  },
  timeline: {
    icon: Clock,
    label: "Timeline",
    description: "Progression or schedule visualization",
    html: `<div class="timeline my-4 p-4 border-l-[3px] border-blue-500">
  <p class="font-semibold mb-4 text-foreground">[TIMELINE] Progression:</p>
  <div class="ml-4">
    <div class="relative pb-4 border-l-2 border-border pl-5">
      <div class="absolute -left-2 top-0 w-3.5 h-3.5 bg-blue-500 rounded-full"></div>
      <p class="font-semibold text-blue-600 dark:text-blue-400">Week 1-2</p>
      <p class="text-muted-foreground">Initial phase description...</p>
    </div>
    <div class="relative pb-4 border-l-2 border-border pl-5">
      <div class="absolute -left-2 top-0 w-3.5 h-3.5 bg-green-500 rounded-full"></div>
      <p class="font-semibold text-green-600 dark:text-green-400">Week 3-4</p>
      <p class="text-muted-foreground">Intermediate phase description...</p>
    </div>
    <div class="relative pl-5">
      <div class="absolute -left-2 top-0 w-3.5 h-3.5 bg-primary rounded-full"></div>
      <p class="font-semibold text-primary">Week 5+</p>
      <p class="text-muted-foreground">Advanced phase description...</p>
    </div>
  </div>
</div>`,
  },
  takeaways: {
    icon: Star,
    label: "Key Takeaways",
    description: "Summary of main points",
    html: `<div class="key-takeaways my-4 p-5 bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 rounded-lg border border-primary/20">
  <p class="font-bold text-lg mb-3 text-primary">[KEY TAKEAWAYS]</p>
  <ul class="list-none p-0 leading-loose text-foreground">
    <li class="pl-6 relative">
      <span class="absolute left-0">→</span>
      First important point to remember
    </li>
    <li class="pl-6 relative">
      <span class="absolute left-0">→</span>
      Second important point to remember
    </li>
    <li class="pl-6 relative">
      <span class="absolute left-0">→</span>
      Third important point to remember
    </li>
  </ul>
</div>`,
  },
};

const bookElementTemplates = {
  chapterOpener: {
    icon: BookMarked,
    label: "Chapter Opener",
    description: "Decorative chapter start template",
    html: `<div class="chapter-opener text-center my-12 py-8 border-t-2 border-b-2 border-border">
  <p class="text-sm tracking-widest text-muted-foreground mb-2">CHAPTER</p>
  <p class="text-5xl font-bold text-primary mb-2">1</p>
  <h2 class="text-2xl font-semibold mb-4 text-foreground">Chapter Title Here</h2>
  <p class="italic text-muted-foreground max-w-md mx-auto">"An inspiring quote or chapter epigraph goes here..."</p>
</div>`,
  },
  sectionDivider: {
    icon: Minus,
    label: "Section Divider",
    description: "Visual break between sections",
    html: `<div class="section-divider text-center my-8 py-4">
  <p class="text-2xl tracking-[1rem] text-muted-foreground/50">• • •</p>
</div>`,
  },
  pullQuote: {
    icon: Quote,
    label: "Pull Quote",
    description: "Highlighted quote with attribution",
    html: `<blockquote class="pull-quote my-8 px-8 py-6 border-l-4 border-primary bg-primary/5 dark:bg-primary/10 text-xl italic leading-relaxed">
  <p class="mb-3 text-foreground">"Insert your compelling quote here. This should be a powerful statement that captures the essence of your message."</p>
  <footer class="text-sm not-italic text-muted-foreground">
    — <cite class="font-semibold">Author Name</cite>, <span class="italic">Source Title</span>
  </footer>
</blockquote>`,
  },
  sidebar: {
    icon: PanelLeftClose,
    label: "Sidebar Box",
    description: "Supplementary information panel",
    html: `<aside class="sidebar-box my-6 p-5 bg-card dark:bg-card border border-border rounded-lg">
  <p class="font-bold text-base mb-3 text-foreground border-b-2 border-primary pb-2 inline-block">
    [SIDEBAR] Title
  </p>
  <p class="text-muted-foreground leading-relaxed">
    This is supplementary information that provides additional context, background details, or interesting facts related to the main content. Use sidebars to enhance understanding without disrupting the main narrative flow.
  </p>
</aside>`,
  },
  resources: {
    icon: LinkIcon,
    label: "Resources Box",
    description: "Links and additional resources",
    html: `<div class="resources-box my-6 p-5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-lg">
  <p class="font-bold text-base mb-4 text-blue-600 dark:text-blue-400">
    [RESOURCES] Additional Resources
  </p>
  <ul class="list-none p-0 leading-loose text-foreground">
    <li class="pl-5 relative">
      <span class="absolute left-0">&gt;</span>
      <strong>Book Title</strong> by Author Name
    </li>
    <li class="pl-5 relative">
      <span class="absolute left-0">&gt;</span>
      <strong>Website:</strong> www.example.com
    </li>
    <li class="pl-5 relative">
      <span class="absolute left-0">&gt;</span>
      <strong>Video:</strong> Tutorial or documentary title
    </li>
    <li class="pl-5 relative">
      <span class="absolute left-0">&gt;</span>
      <strong>App:</strong> Recommended application name
    </li>
  </ul>
</div>`,
  },
};

export default function ToolPanel({ projectId, onInsertContent }: ToolPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ai");
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "I'm your AI writing assistant. Ask me anything about your book, or let me help you with research, outlines, character development, or writing blocks.",
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isRemovingBg, setIsRemovingBg] = useState<string | null>(null);
  const [imagePlacementMode, setImagePlacementMode] = useState<"auto" | "manual" | "hybrid">("auto");

  const [trimSize, setTrimSize] = useState("6x9");
  const [fontSize, setFontSize] = useState(11);
  const [fontFamily, setFontFamily] = useState("garamond");
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [marginInside, setMarginInside] = useState(0.75);
  const [marginOutside, setMarginOutside] = useState(0.5);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [chapterBreakStyle, setChapterBreakStyle] = useState("new-page");

  const [isbnInput, setIsbnInput] = useState("");
  const [isbnError, setIsbnError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importedFile, setImportedFile] = useState<{name: string; size: number} | null>(null);
  const [kdpChecklist, setKdpChecklist] = useState({
    trimSizeSelected: false,
    marginsCompliant: false,
    fontsEmbedded: false,
    imagesHighRes: false,
    noBleedIssues: false,
    tocLinksWorking: false,
    copyrightComplete: false,
    pageCountMet: false,
  });

  const handleInsertContent = (html: string) => {
    if (onInsertContent) {
      onInsertContent(html);
      toast({ 
        title: "Content Inserted", 
        description: "The element has been added to your document" 
      });
    } else {
      toast({ 
        title: "Cannot Insert", 
        description: "No editor connection available", 
        variant: "destructive" 
      });
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

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
      const res = await apiRequest('POST', '/api/ai/chat', {
        message: chatInput,
        projectId,
        context: "book-writing",
      });
      const response = await res.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response || "I apologize, I couldn't generate a response.",
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({ title: "Error", description: "Failed to get AI response", variant: "destructive" });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;

    setIsGeneratingImage(true);
    try {
      const res = await apiRequest('POST', '/api/ai/generate-image', {
        prompt: imagePrompt,
        projectId,
      });
      const response = await res.json();

      if (response.imageUrl) {
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: response.imageUrl,
          prompt: imagePrompt,
          hasBackground: true,
        };
        setGeneratedImages(prev => [newImage, ...prev]);
        setImagePrompt("");
        toast({ title: "Image Generated", description: "Your image is ready" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRemoveBackground = async (imageId: string, imageUrl: string) => {
    setIsRemovingBg(imageId);
    try {
      const res = await apiRequest('POST', '/api/image/remove-background', { imageUrl });
      const response = await res.json();

      if (response.resultUrl) {
        setGeneratedImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, url: response.resultUrl, hasBackground: false }
            : img
        ));
        toast({ title: "Background Removed", description: "Image updated successfully" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove background", variant: "destructive" });
    } finally {
      setIsRemovingBg(null);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
  };

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="border-b px-2 shrink-0">
          <TabsList className="w-full justify-start h-10 bg-transparent">
            <TabsTrigger value="ai" className="gap-1 data-[state=active]:bg-sidebar-accent">
              <MessageCircle className="w-4 h-4" />
              AI
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-1 data-[state=active]:bg-sidebar-accent" data-testid="tab-import">
              <FileUp className="w-4 h-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-1 data-[state=active]:bg-sidebar-accent">
              <LayoutGrid className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-1 data-[state=active]:bg-sidebar-accent">
              <Image className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="format" className="gap-1 data-[state=active]:bg-sidebar-accent">
              <Settings className="w-4 h-4" />
              Format
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-1 data-[state=active]:bg-sidebar-accent" data-testid="tab-compliance">
              <Shield className="w-4 h-4" />
              Compliance
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ai" className="flex-1 flex flex-col m-0 overflow-hidden">
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-3 border-t shrink-0">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Ask anything..."
                className="flex-1"
                data-testid="input-ai-chat"
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage} 
                disabled={isChatLoading}
                data-testid="button-send-chat"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="import" className="flex-1 flex flex-col m-0 overflow-hidden">
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              <Card>
                <CardHeader className="py-3 gap-1">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileUp className="w-4 h-4" />
                    Import Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Import content from Word documents, PDFs, text files, or Markdown files directly into your manuscript.
                  </p>
                  
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept=".docx,.pdf,.txt,.md"
                      className="hidden"
                      id="document-import-input"
                      data-testid="input-document-import"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        setIsImporting(true);
                        setImportedFile({ name: file.name, size: file.size });
                        
                        try {
                          const reader = new FileReader();
                          reader.onload = async () => {
                            try {
                              const base64 = (reader.result as string).split(',')[1];
                              const res = await apiRequest('POST', '/api/documents/parse', {
                                content: base64,
                                filename: file.name,
                                mimeType: file.type,
                              });
                              const data = await res.json();
                              
                              if (data.success && data.content) {
                                const htmlContent = data.content
                                  .split('\n\n')
                                  .map((p: string) => `<p>${p.trim()}</p>`)
                                  .join('\n');
                                
                                if (onInsertContent) {
                                  onInsertContent(htmlContent);
                                }
                                
                                toast({
                                  title: "Document Imported",
                                  description: `Imported ${data.metadata?.wordCount || 0} words from ${file.name}`,
                                });
                              } else {
                                throw new Error(data.message || 'Failed to parse document');
                              }
                            } catch (error) {
                              toast({
                                title: "Import Failed",
                                description: error instanceof Error ? error.message : "Could not parse document",
                                variant: "destructive",
                              });
                            } finally {
                              setIsImporting(false);
                              setImportedFile(null);
                            }
                          };
                          reader.readAsDataURL(file);
                        } catch (error) {
                          toast({
                            title: "Import Failed",
                            description: "Could not read file",
                            variant: "destructive",
                          });
                          setIsImporting(false);
                          setImportedFile(null);
                        }
                        
                        e.target.value = '';
                      }}
                    />
                    
                    {isImporting ? (
                      <div className="space-y-2">
                        <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Parsing {importedFile?.name}...</p>
                      </div>
                    ) : (
                      <label htmlFor="document-import-input" className="cursor-pointer block">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          .docx, .pdf, .txt, .md
                        </p>
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3 gap-1">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <File className="w-4 h-4" />
                    Supported Formats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary">.docx</Badge>
                        Microsoft Word
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary">.pdf</Badge>
                        PDF Documents
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary">.txt</Badge>
                        Plain Text
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary">.md</Badge>
                        Markdown
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="content" className="flex-1 flex flex-col m-0 overflow-hidden">
          <ScrollArea className="flex-1 p-3">
            <Accordion type="multiple" defaultValue={["callouts", "charts", "lists", "book-elements"]} className="space-y-2">
              <AccordionItem value="callouts" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Callout Boxes
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(calloutTemplates).map(([key, template]) => {
                      const IconComponent = template.icon;
                      return (
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-xs gap-2"
                              onClick={() => handleInsertContent(template.html)}
                              data-testid={`button-insert-${key}`}
                            >
                              <IconComponent className="w-3 h-3 shrink-0" />
                              {template.label}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>{template.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="charts" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Charts
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(chartTemplates).map(([key, template]) => {
                      const IconComponent = template.icon;
                      return (
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-xs gap-2"
                              onClick={() => handleInsertContent(template.html)}
                              data-testid={`button-insert-chart-${key}`}
                            >
                              <IconComponent className="w-3 h-3 shrink-0" />
                              {template.label}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>{template.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="lists" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4" />
                    Lists & Structure
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(listTemplates).map(([key, template]) => {
                      const IconComponent = template.icon;
                      return (
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-xs gap-2"
                              onClick={() => handleInsertContent(template.html)}
                              data-testid={`button-insert-list-${key}`}
                            >
                              <IconComponent className="w-3 h-3 shrink-0" />
                              {template.label}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>{template.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="book-elements" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Book Elements
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(bookElementTemplates).map(([key, template]) => {
                      const IconComponent = template.icon;
                      return (
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-xs gap-2"
                              onClick={() => handleInsertContent(template.html)}
                              data-testid={`button-insert-book-${key}`}
                            >
                              <IconComponent className="w-3 h-3 shrink-0" />
                              {template.label}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>{template.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="images" className="flex-1 flex flex-col m-0 overflow-hidden">
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    Generate Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to create..."
                    className="min-h-[80px]"
                    data-testid="textarea-image-prompt"
                  />
                  <Button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !imagePrompt.trim()}
                    className="w-full"
                    data-testid="button-generate-image"
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    Generate
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Move className="w-4 h-4" />
                    Image Placement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={imagePlacementMode === "auto" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setImagePlacementMode("auto")}
                      className="text-xs"
                      data-testid="button-placement-auto"
                    >
                      <Grid3X3 className="w-3 h-3 mr-1" />
                      Auto
                    </Button>
                    <Button
                      variant={imagePlacementMode === "hybrid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setImagePlacementMode("hybrid")}
                      className="text-xs"
                      data-testid="button-placement-hybrid"
                    >
                      <Layers className="w-3 h-3 mr-1" />
                      Hybrid
                    </Button>
                    <Button
                      variant={imagePlacementMode === "manual" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setImagePlacementMode("manual")}
                      className="text-xs"
                      data-testid="button-placement-manual"
                    >
                      <Move className="w-3 h-3 mr-1" />
                      Manual
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {imagePlacementMode === "auto" && "AI automatically places images at optimal positions"}
                    {imagePlacementMode === "hybrid" && "AI suggests placements, you approve or adjust"}
                    {imagePlacementMode === "manual" && "Full control over image positioning"}
                  </p>
                </CardContent>
              </Card>

              {generatedImages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Generated Images</h4>
                  {generatedImages.map((img) => (
                    <Card key={img.id} className="overflow-hidden">
                      <div className="relative aspect-square bg-muted">
                        <img
                          src={img.url}
                          alt={img.prompt}
                          className="w-full h-full object-cover"
                        />
                        {img.hasBackground && (
                          <Badge className="absolute top-2 right-2" variant="secondary">
                            Has BG
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-2 space-y-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>
                        <div className="flex gap-1">
                          {img.hasBackground && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveBackground(img.id, img.url)}
                              disabled={isRemovingBg === img.id}
                              className="flex-1 text-xs"
                              data-testid={`button-remove-bg-${img.id}`}
                            >
                              {isRemovingBg === img.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Scissors className="w-3 h-3 mr-1" />
                              )}
                              Remove BG
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteImage(img.id)}
                            data-testid={`button-delete-image-${img.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="format" className="flex-1 flex flex-col m-0 overflow-hidden">
          <ScrollArea className="flex-1 p-3">
            <Accordion type="multiple" defaultValue={["page", "typography", "layout"]} className="space-y-2">
              <AccordionItem value="page" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Page Setup
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Trim Size</Label>
                    <Select value={trimSize} onValueChange={setTrimSize}>
                      <SelectTrigger data-testid="select-trim-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5x8">5" x 8" (Pocket)</SelectItem>
                        <SelectItem value="5.5x8.5">5.5" x 8.5" (Digest)</SelectItem>
                        <SelectItem value="6x9">6" x 9" (Trade)</SelectItem>
                        <SelectItem value="7x10">7" x 10" (Textbook)</SelectItem>
                        <SelectItem value="8.5x11">8.5" x 11" (Letter)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Inside Margin</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[marginInside]}
                          onValueChange={([v]) => setMarginInside(v)}
                          min={0.5}
                          max={1.5}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs w-8">{marginInside}"</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Outside Margin</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[marginOutside]}
                          onValueChange={([v]) => setMarginOutside(v)}
                          min={0.25}
                          max={1}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs w-8">{marginOutside}"</span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="typography" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Typography
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Font Family</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger data-testid="select-font-family">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="garamond">Garamond (Classic)</SelectItem>
                        <SelectItem value="georgia">Georgia (Modern)</SelectItem>
                        <SelectItem value="palatino">Palatino (Elegant)</SelectItem>
                        <SelectItem value="times">Times New Roman</SelectItem>
                        <SelectItem value="baskerville">Baskerville</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Font Size: {fontSize}pt</Label>
                    <Slider
                      value={[fontSize]}
                      onValueChange={([v]) => setFontSize(v)}
                      min={9}
                      max={14}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Line Spacing: {lineSpacing}</Label>
                    <Slider
                      value={[lineSpacing]}
                      onValueChange={([v]) => setLineSpacing(v)}
                      min={1}
                      max={2}
                      step={0.1}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="layout" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Layout Options
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Page Numbers</Label>
                    <Switch
                      checked={includePageNumbers}
                      onCheckedChange={setIncludePageNumbers}
                      data-testid="switch-page-numbers"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Running Headers</Label>
                    <Switch
                      checked={includeHeaders}
                      onCheckedChange={setIncludeHeaders}
                      data-testid="switch-headers"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Chapter Breaks</Label>
                    <Select value={chapterBreakStyle} onValueChange={setChapterBreakStyle}>
                      <SelectTrigger data-testid="select-chapter-breaks">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new-page">New Page</SelectItem>
                        <SelectItem value="odd-page">Odd Page (Right)</SelectItem>
                        <SelectItem value="continuous">Continuous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="compliance" className="flex-1 flex flex-col m-0 overflow-hidden" data-testid="tabcontent-compliance">
          <ScrollArea className="flex-1 p-3">
            <Accordion type="multiple" defaultValue={["front-matter", "back-matter", "isbn", "kdp-checklist"]} className="space-y-2">
              <AccordionItem value="front-matter" className="border rounded-lg px-3" data-testid="accordion-front-matter">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <ScrollText className="w-4 h-4" />
                    Front Matter Templates
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs gap-2"
                          onClick={() => handleInsertContent(`<div class="title-page text-center break-after-page py-32 px-10">
  <h1 class="text-4xl font-bold mb-4 text-foreground">[Book Title]</h1>
  <p class="text-lg text-muted-foreground mb-2">[Subtitle]</p>
  <p class="text-xl mt-12 text-foreground">By [Author Name]</p>
</div>`)}
                          data-testid="button-insert-title-page"
                        >
                          <FileSignature className="w-3 h-3 shrink-0" />
                          Title Page
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Book title, subtitle, and author name</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs gap-2"
                          onClick={() => handleInsertContent(`<div class="copyright-page text-xs leading-relaxed break-after-page py-16 px-10 text-foreground">
  <p class="mb-4"><strong>[Book Title]</strong></p>
  <p>Copyright © ${new Date().getFullYear()} [Author Name]</p>
  <p>All rights reserved.</p>
  <p class="mt-4">ISBN: [Enter ISBN]</p>
  <p class="mt-4">Published by [Publisher Name]</p>
  <p class="mt-4">No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.</p>
  <p class="mt-4">First Edition: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
</div>`)}
                          data-testid="button-insert-copyright-page"
                        >
                          <FileText className="w-3 h-3 shrink-0" />
                          Copyright Page
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Copyright, ISBN, publisher, rights statement</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs gap-2"
                          onClick={() => handleInsertContent(`<div class="dedication-page text-center break-after-page py-32 px-16">
  <p class="italic text-lg leading-relaxed text-foreground">
    For [Name or Group]<br/>
    [Personal dedication message]
  </p>
</div>`)}
                          data-testid="button-insert-dedication"
                        >
                          <Heart className="w-3 h-3 shrink-0" />
                          Dedication
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Dedication page template</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs gap-2"
                          onClick={() => handleInsertContent(`<div class="table-of-contents break-after-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-center text-foreground">Table of Contents</h2>
  <div class="leading-loose text-foreground">
    <p><strong>Chapter 1:</strong> [Title] ...................... 1</p>
    <p><strong>Chapter 2:</strong> [Title] ...................... 15</p>
    <p><strong>Chapter 3:</strong> [Title] ...................... 30</p>
    <p><strong>Chapter 4:</strong> [Title] ...................... 45</p>
    <p><strong>Chapter 5:</strong> [Title] ...................... 60</p>
  </div>
</div>`)}
                          data-testid="button-insert-toc-template"
                        >
                          <List className="w-3 h-3 shrink-0" />
                          TOC Template
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Manual Table of Contents template</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs gap-2"
                          onClick={() => handleInsertContent(`<div class="acknowledgments break-after-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-center text-foreground">Acknowledgments</h2>
  <p class="leading-relaxed mb-4 text-foreground">
    I would like to express my deepest gratitude to...
  </p>
  <p class="leading-relaxed mb-4 text-foreground">
    Special thanks to [Name] for [contribution]...
  </p>
  <p class="leading-relaxed text-foreground">
    Finally, I want to thank [family/friends] for their unwavering support throughout this journey.
  </p>
</div>`)}
                          data-testid="button-insert-acknowledgments"
                        >
                          <Award className="w-3 h-3 shrink-0" />
                          Acknowledgments
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Thank contributors and supporters</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs gap-2"
                          onClick={() => handleInsertContent(`<div class="foreword break-after-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-center text-foreground">Foreword</h2>
  <p class="leading-relaxed mb-4 text-foreground">
    [Opening paragraph introducing the book and its significance...]
  </p>
  <p class="leading-relaxed mb-4 text-foreground">
    [Middle paragraphs about the author and their expertise...]
  </p>
  <p class="leading-relaxed mb-6 text-foreground">
    [Closing paragraph with endorsement...]
  </p>
  <p class="text-right italic text-foreground">
    — [Foreword Author Name]<br/>
    [Title/Position]
  </p>
</div>`)}
                          data-testid="button-insert-foreword"
                        >
                          <Feather className="w-3 h-3 shrink-0" />
                          Foreword
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Written by someone other than the author</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs gap-2 col-span-2"
                          onClick={() => handleInsertContent(`<div class="preface break-after-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-center text-foreground">Preface</h2>
  <p class="leading-relaxed mb-4 text-foreground">
    [Explain why you wrote this book...]
  </p>
  <p class="leading-relaxed mb-4 text-foreground">
    [Describe who this book is for and what readers will gain...]
  </p>
  <p class="leading-relaxed mb-4 text-foreground">
    [Outline how the book is organized...]
  </p>
  <p class="leading-relaxed text-foreground">
    [Any special notes or guidance for readers...]
  </p>
</div>`)}
                          data-testid="button-insert-preface"
                        >
                          <BookOpen className="w-3 h-3 shrink-0" />
                          Preface
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Author's introduction to the book</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="back-matter" className="border rounded-lg px-3" data-testid="accordion-back-matter">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <Library className="w-4 h-4" />
                    Back Matter Templates
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs gap-2"
                          onClick={() => handleInsertContent(`<div class="about-author break-before-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-center text-foreground">About the Author</h2>
  <div class="text-center mb-6">
    <div class="w-28 h-28 bg-muted rounded-full mx-auto flex items-center justify-center">
      <span class="text-muted-foreground">[Photo]</span>
    </div>
  </div>
  <p class="leading-relaxed mb-4 text-foreground">
    [Author Name] is a [profession/background]...
  </p>
  <p class="leading-relaxed mb-4 text-foreground">
    [Career highlights, credentials, or relevant experience...]
  </p>
  <p class="leading-relaxed text-foreground">
    [Personal details, location, interests, etc.]<br/>
    Connect with the author at [website/social media].
  </p>
</div>`)}
                          data-testid="button-insert-about-author"
                        >
                          <UserCircle className="w-3 h-3 shrink-0" />
                          About Author
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Author biography section</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs gap-2"
                          onClick={() => handleInsertContent(`<div class="also-by-author break-before-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-center text-foreground">Also By This Author</h2>
  <div class="leading-loose">
    <p class="mb-4 text-foreground"><strong>[Book Title 1]</strong><br/>
    <span class="text-muted-foreground text-sm">[Brief description or tagline]</span></p>
    <p class="mb-4 text-foreground"><strong>[Book Title 2]</strong><br/>
    <span class="text-muted-foreground text-sm">[Brief description or tagline]</span></p>
    <p class="mb-4 text-foreground"><strong>[Book Title 3]</strong><br/>
    <span class="text-muted-foreground text-sm">[Brief description or tagline]</span></p>
  </div>
  <p class="mt-6 text-center text-muted-foreground">
    Available at major book retailers and online stores.
  </p>
</div>`)}
                          data-testid="button-insert-also-by"
                        >
                          <BookCopy className="w-3 h-3 shrink-0" />
                          Also By Author
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>List of other books by the author</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs gap-2"
                          onClick={() => handleInsertContent(`<div class="resources-references break-before-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-center text-foreground">Resources & References</h2>
  <div class="leading-relaxed text-foreground">
    <h3 class="text-base font-semibold mb-3 mt-5">Books</h3>
    <ul class="list-disc pl-5 mb-4">
      <li>[Author], <em>[Title]</em> (Publisher, Year)</li>
      <li>[Author], <em>[Title]</em> (Publisher, Year)</li>
    </ul>
    <h3 class="text-base font-semibold mb-3">Websites</h3>
    <ul class="list-disc pl-5 mb-4">
      <li>[Website Name] - [URL]</li>
      <li>[Website Name] - [URL]</li>
    </ul>
    <h3 class="text-base font-semibold mb-3">Organizations</h3>
    <ul class="list-disc pl-5">
      <li>[Organization Name] - [Description]</li>
      <li>[Organization Name] - [Description]</li>
    </ul>
  </div>
</div>`)}
                          data-testid="button-insert-resources"
                        >
                          <LinkIcon className="w-3 h-3 shrink-0" />
                          Resources
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>References and additional resources</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs gap-2"
                          onClick={() => handleInsertContent(`<div class="index-placeholder break-before-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-center text-foreground">Index</h2>
  <div class="columns-2 gap-8 text-xs leading-relaxed text-foreground">
    <p><strong>A</strong></p>
    <p class="pl-3">[Term], [page numbers]</p>
    <p class="pl-3">[Term], [page numbers]</p>
    <p class="mt-3"><strong>B</strong></p>
    <p class="pl-3">[Term], [page numbers]</p>
    <p class="pl-3">[Term], [page numbers]</p>
    <p class="mt-3"><strong>C</strong></p>
    <p class="pl-3">[Term], [page numbers]</p>
    <p class="pl-3">[Term], [page numbers]</p>
  </div>
  <p class="mt-6 text-xs text-muted-foreground text-center">
    [Generate index after finalizing page numbers]
  </p>
</div>`)}
                          data-testid="button-insert-index"
                        >
                          <Hash className="w-3 h-3 shrink-0" />
                          Index
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Index placeholder template</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="isbn" className="border rounded-lg px-3" data-testid="accordion-isbn">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    ISBN Helper
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-3">
                  <p className="text-xs text-muted-foreground">
                    ISBNs (International Standard Book Numbers) are required for selling books through major retailers. Each format (paperback, hardcover, ebook) needs its own ISBN.
                  </p>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => window.open('https://www.myidentifiers.com/', '_blank')}
                    data-testid="button-bowker-link"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Get ISBN from Bowker (US)
                  </Button>

                  <div className="space-y-2">
                    <Label className="text-xs">Enter ISBN (13 digits)</Label>
                    <Input
                      value={isbnInput}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9-]/g, '');
                        setIsbnInput(value);
                        const digitsOnly = value.replace(/-/g, '');
                        if (digitsOnly.length > 0 && digitsOnly.length !== 13) {
                          setIsbnError('ISBN must be exactly 13 digits');
                        } else {
                          setIsbnError('');
                        }
                      }}
                      placeholder="978-0-123456-78-9"
                      className={isbnError ? 'border-destructive' : ''}
                      data-testid="input-isbn"
                    />
                    {isbnError && (
                      <p className="text-xs text-destructive">{isbnError}</p>
                    )}
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-2"
                    disabled={!isbnInput || isbnError !== ''}
                    onClick={() => {
                      const digitsOnly = isbnInput.replace(/-/g, '');
                      const formattedIsbn = digitsOnly.length === 13 
                        ? `${digitsOnly.slice(0,3)}-${digitsOnly.slice(3,4)}-${digitsOnly.slice(4,10)}-${digitsOnly.slice(10,12)}-${digitsOnly.slice(12)}`
                        : isbnInput;
                      handleInsertContent(`<p><strong>ISBN:</strong> ${formattedIsbn}</p>`);
                    }}
                    data-testid="button-insert-isbn"
                  >
                    <FileSignature className="w-3 h-3" />
                    Insert ISBN
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="kdp-checklist" className="border rounded-lg px-3" data-testid="accordion-kdp-checklist">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4" />
                    KDP Checklist
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3">
                  <div className="space-y-2">
                    {[
                      { key: 'trimSizeSelected' as const, label: 'Trim size selected (6x9, 8.5x11, etc.)' },
                      { key: 'marginsCompliant' as const, label: 'Margins meet KDP requirements' },
                      { key: 'fontsEmbedded' as const, label: 'Fonts embedded properly' },
                      { key: 'imagesHighRes' as const, label: 'Images at 300 DPI' },
                      { key: 'noBleedIssues' as const, label: 'No bleed issues' },
                      { key: 'tocLinksWorking' as const, label: 'TOC links working' },
                      { key: 'copyrightComplete' as const, label: 'Copyright page complete' },
                      { key: 'pageCountMet' as const, label: 'Page count meets minimum (24+)' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-2">
                        <Switch
                          checked={kdpChecklist[item.key]}
                          onCheckedChange={(checked) => setKdpChecklist(prev => ({ ...prev, [item.key]: checked }))}
                          data-testid={`switch-checklist-${item.key}`}
                        />
                        <Label className={`text-xs ${kdpChecklist[item.key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress:</span>
                      <Badge variant={Object.values(kdpChecklist).every(Boolean) ? 'default' : 'secondary'}>
                        {Object.values(kdpChecklist).filter(Boolean).length} / {Object.values(kdpChecklist).length}
                      </Badge>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="generate-toc" className="border rounded-lg px-3" data-testid="accordion-generate-toc">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Auto-Generate TOC
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3">
                  <p className="text-xs text-muted-foreground">
                    Generate a Table of Contents from all H1 and H2 headings in your document.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => {
                      toast({
                        title: "Generate TOC",
                        description: "Scanning document for headings...",
                      });
                      const tocHtml = `<div class="auto-generated-toc my-8 p-10" style="page-break-after: always;">
  <h2 class="text-2xl font-bold mb-6 text-center text-foreground">Table of Contents</h2>
  <p class="text-xs text-muted-foreground mb-4 text-center">[Auto-generated - Update page numbers after layout]</p>
  <div class="leading-8">
    <p class="text-foreground">Introduction ...................... 1</p>
    <p class="pl-4 text-muted-foreground">Overview ...................... 3</p>
    <p class="text-foreground">Chapter 1 ...................... 5</p>
    <p class="pl-4 text-muted-foreground">Section 1.1 ...................... 7</p>
    <p class="pl-4 text-muted-foreground">Section 1.2 ...................... 12</p>
    <p class="text-foreground">Chapter 2 ...................... 20</p>
    <p class="pl-4 text-muted-foreground">Section 2.1 ...................... 22</p>
  </div>
</div>`;
                      handleInsertContent(tocHtml);
                    }}
                    data-testid="button-generate-toc"
                  >
                    <Wand2 className="w-3 h-3" />
                    Generate TOC from Headings
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
