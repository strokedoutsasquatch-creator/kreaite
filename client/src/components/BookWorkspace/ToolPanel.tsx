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
  Plus,
  QrCode,
  FolderOpen,
  HelpCircle,
  BookText,
  ClipboardList,
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

interface Source {
  id: string;
  type: "book" | "website" | "article" | "journal";
  title: string;
  author: string;
  url?: string;
  year: string;
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

const appendixTemplates = {
  glossary: {
    icon: BookText,
    label: "Glossary",
    description: "Alphabetized definitions of key terms",
    html: `<div class="appendix-glossary my-6">
  <h2 class="text-2xl font-bold mb-6 text-foreground border-b pb-2">Glossary of Terms</h2>
  <dl class="space-y-4">
    <div class="glossary-entry">
      <dt class="font-semibold text-primary">Term A</dt>
      <dd class="pl-4 text-muted-foreground">Definition of Term A. Provide a clear, concise explanation of the term as used in your book.</dd>
    </div>
    <div class="glossary-entry">
      <dt class="font-semibold text-primary">Term B</dt>
      <dd class="pl-4 text-muted-foreground">Definition of Term B. Include any relevant context or examples.</dd>
    </div>
    <div class="glossary-entry">
      <dt class="font-semibold text-primary">Term C</dt>
      <dd class="pl-4 text-muted-foreground">Definition of Term C. Technical terms should be explained in accessible language.</dd>
    </div>
  </dl>
</div>`,
  },
  resources: {
    icon: FolderOpen,
    label: "Resources",
    description: "Helpful links, books, and tools",
    html: `<div class="appendix-resources my-6">
  <h2 class="text-2xl font-bold mb-6 text-foreground border-b pb-2">Additional Resources</h2>
  
  <h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">Recommended Reading</h3>
  <ul class="list-disc pl-6 space-y-2 text-foreground">
    <li><em>Book Title</em> by Author Name - Brief description of why this resource is valuable.</li>
    <li><em>Book Title</em> by Author Name - Brief description of why this resource is valuable.</li>
  </ul>
  
  <h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">Helpful Websites</h3>
  <ul class="list-disc pl-6 space-y-2 text-foreground">
    <li><strong>Website Name</strong> (www.example.com) - Description of the resource.</li>
    <li><strong>Website Name</strong> (www.example.com) - Description of the resource.</li>
  </ul>
  
  <h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">Tools & Apps</h3>
  <ul class="list-disc pl-6 space-y-2 text-foreground">
    <li><strong>Tool Name</strong> - What it does and how it can help the reader.</li>
    <li><strong>Tool Name</strong> - What it does and how it can help the reader.</li>
  </ul>
</div>`,
  },
  worksheet: {
    icon: ClipboardList,
    label: "Worksheet",
    description: "Fillable exercise or planning template",
    html: `<div class="appendix-worksheet my-6 p-6 border-2 border-dashed border-primary/30 rounded-lg">
  <h2 class="text-2xl font-bold mb-2 text-foreground">Worksheet: [Title]</h2>
  <p class="text-muted-foreground mb-6">Instructions: Complete the following sections to apply what you've learned.</p>
  
  <div class="worksheet-section mb-6">
    <h3 class="font-semibold text-foreground mb-2">Section 1: Self-Assessment</h3>
    <div class="space-y-3">
      <div class="border-b border-border pb-2">
        <p class="text-sm text-muted-foreground">Question 1:</p>
        <p class="min-h-[2rem] text-foreground">_________________________________________________</p>
      </div>
      <div class="border-b border-border pb-2">
        <p class="text-sm text-muted-foreground">Question 2:</p>
        <p class="min-h-[2rem] text-foreground">_________________________________________________</p>
      </div>
    </div>
  </div>
  
  <div class="worksheet-section mb-6">
    <h3 class="font-semibold text-foreground mb-2">Section 2: Action Items</h3>
    <ul class="space-y-2">
      <li class="flex items-start gap-2">
        <span class="text-muted-foreground">[ ]</span>
        <span class="text-foreground">Action item 1: ____________________________</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-muted-foreground">[ ]</span>
        <span class="text-foreground">Action item 2: ____________________________</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-muted-foreground">[ ]</span>
        <span class="text-foreground">Action item 3: ____________________________</span>
      </li>
    </ul>
  </div>
  
  <div class="worksheet-section">
    <h3 class="font-semibold text-foreground mb-2">Notes</h3>
    <div class="min-h-[4rem] border border-border rounded p-2 text-foreground">
      (Space for reader notes)
    </div>
  </div>
</div>`,
  },
  faq: {
    icon: HelpCircle,
    label: "FAQ",
    description: "Frequently asked questions and answers",
    html: `<div class="appendix-faq my-6">
  <h2 class="text-2xl font-bold mb-6 text-foreground border-b pb-2">Frequently Asked Questions</h2>
  
  <div class="faq-item mb-6">
    <h3 class="font-semibold text-primary mb-2">Q: First common question readers might ask?</h3>
    <p class="text-foreground pl-4">A: Provide a clear, helpful answer to this question. Include any relevant details or examples that would help the reader understand.</p>
  </div>
  
  <div class="faq-item mb-6">
    <h3 class="font-semibold text-primary mb-2">Q: Second common question readers might ask?</h3>
    <p class="text-foreground pl-4">A: Provide a clear, helpful answer to this question. Reference specific chapters or sections if applicable.</p>
  </div>
  
  <div class="faq-item mb-6">
    <h3 class="font-semibold text-primary mb-2">Q: Third common question readers might ask?</h3>
    <p class="text-foreground pl-4">A: Provide a clear, helpful answer to this question. Address any common misconceptions.</p>
  </div>
  
  <div class="faq-item mb-6">
    <h3 class="font-semibold text-primary mb-2">Q: Fourth common question readers might ask?</h3>
    <p class="text-foreground pl-4">A: Provide a clear, helpful answer to this question. Include next steps or resources if helpful.</p>
  </div>
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

  const [chartType, setChartType] = useState<"bar" | "pie" | "line">("bar");
  const [chartLabels, setChartLabels] = useState("Label 1, Label 2, Label 3");
  const [chartValues, setChartValues] = useState("25, 50, 75");
  const [chartTitle, setChartTitle] = useState("My Chart");

  const [qrCodeText, setQrCodeText] = useState("");
  const [qrCodeSize, setQrCodeSize] = useState<"100" | "150" | "200">("150");
  const [showQrPreview, setShowQrPreview] = useState(false);

  const [sources, setSources] = useState<Source[]>([]);
  const [newSource, setNewSource] = useState<{ type: "book" | "website" | "article" | "journal"; title: string; author: string; url: string; year: string }>({ type: "book", title: "", author: "", url: "", year: "" });

  const generateBarChart = (labels: string[], values: number[], title: string): string => {
    if (values.length === 0 || labels.length === 0) return '';
    const maxValue = Math.max(...values);
    if (maxValue === 0) return '';
    const barWidth = 40;
    const gap = 20;
    const height = 200;
    const chartWidth = (barWidth + gap) * values.length;
    
    const bars = values.map((v, i) => {
      const barHeight = (v / maxValue) * 150;
      const x = i * (barWidth + gap) + 20;
      const y = height - barHeight - 30;
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#FF6B35"/>
              <text x="${x + barWidth/2}" y="${height - 10}" text-anchor="middle" font-size="10" fill="currentColor">${labels[i] || ''}</text>
              <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="currentColor">${v}</text>`;
    }).join('');
    
    return `<svg viewBox="0 0 ${chartWidth + 40} ${height + 20}" class="w-full max-w-md mx-auto my-4">
      <text x="${(chartWidth + 40)/2}" y="15" text-anchor="middle" font-weight="bold" fill="currentColor">${title}</text>
      ${bars}
    </svg>`;
  };

  const generatePieChart = (labels: string[], values: number[], title: string): string => {
    if (values.length === 0 || labels.length === 0) return '';
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0) return '';
    const size = 200;
    const cx = size / 2;
    const cy = size / 2 + 20;
    const r = 70;
    const colors = ['#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    
    let currentAngle = -90;
    const slices = values.map((v, i) => {
      const angle = (v / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      const largeArc = angle > 180 ? 1 : 0;
      
      const midAngle = ((startAngle + endAngle) / 2 * Math.PI) / 180;
      const labelX = cx + (r + 20) * Math.cos(midAngle);
      const labelY = cy + (r + 20) * Math.sin(midAngle);
      
      return `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}"/>
              <text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="9" fill="currentColor">${labels[i] || ''} (${Math.round((v/total)*100)}%)</text>`;
    }).join('');
    
    return `<svg viewBox="0 0 ${size} ${size + 40}" class="w-full max-w-xs mx-auto my-4">
      <text x="${size/2}" y="15" text-anchor="middle" font-weight="bold" fill="currentColor">${title}</text>
      ${slices}
    </svg>`;
  };

  const generateLineChart = (labels: string[], values: number[], title: string): string => {
    if (values.length === 0 || labels.length === 0) return '';
    const maxValue = Math.max(...values);
    if (maxValue === 0) return '';
    const width = 300;
    const height = 200;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    const points = values.map((v, i) => {
      const x = padding + (i / (values.length - 1 || 1)) * graphWidth;
      const y = height - padding - (v / maxValue) * graphHeight;
      return `${x},${y}`;
    }).join(' ');
    
    const circles = values.map((v, i) => {
      const x = padding + (i / (values.length - 1 || 1)) * graphWidth;
      const y = height - padding - (v / maxValue) * graphHeight;
      return `<circle cx="${x}" cy="${y}" r="4" fill="#FF6B35"/>
              <text x="${x}" y="${y - 10}" text-anchor="middle" font-size="9" fill="currentColor">${v}</text>`;
    }).join('');
    
    const labelTexts = labels.map((label, i) => {
      const x = padding + (i / (values.length - 1 || 1)) * graphWidth;
      return `<text x="${x}" y="${height - 10}" text-anchor="middle" font-size="9" fill="currentColor">${label}</text>`;
    }).join('');
    
    return `<svg viewBox="0 0 ${width} ${height + 20}" class="w-full max-w-md mx-auto my-4">
      <text x="${width/2}" y="15" text-anchor="middle" font-weight="bold" fill="currentColor">${title}</text>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="currentColor" stroke-opacity="0.3"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="currentColor" stroke-opacity="0.3"/>
      <polyline points="${points}" fill="none" stroke="#FF6B35" stroke-width="2"/>
      ${circles}
      ${labelTexts}
    </svg>`;
  };

  const getChartPreview = (): string => {
    const labels = chartLabels.split(',').map(l => l.trim()).filter(l => l);
    const values = chartValues.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    
    if (labels.length === 0 || values.length === 0) return '';
    
    switch (chartType) {
      case 'bar': return generateBarChart(labels, values, chartTitle);
      case 'pie': return generatePieChart(labels, values, chartTitle);
      case 'line': return generateLineChart(labels, values, chartTitle);
      default: return '';
    }
  };

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
            <TabsTrigger value="research" className="gap-1 data-[state=active]:bg-sidebar-accent" data-testid="tab-research">
              <BookMarked className="w-4 h-4" />
              Research
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
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div
                      className={`rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'assistant' && msg.id !== 'welcome' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="self-start h-6 px-2 text-xs gap-1"
                        onClick={() => {
                          handleInsertContent(`<p>${msg.content}</p>`);
                        }}
                        data-testid={`button-insert-ai-response-${msg.id}`}
                      >
                        <Plus className="w-3 h-3" />
                        Insert into Editor
                      </Button>
                    )}
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

              <AccordionItem value="chart-builder" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    Smart Chart Builder
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-3">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Chart Type</Label>
                      <Select value={chartType} onValueChange={(v) => setChartType(v as "bar" | "pie" | "line")}>
                        <SelectTrigger data-testid="chart-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-3 h-3" />
                              Bar Chart
                            </div>
                          </SelectItem>
                          <SelectItem value="pie">
                            <div className="flex items-center gap-2">
                              <PieChart className="w-3 h-3" />
                              Pie Chart
                            </div>
                          </SelectItem>
                          <SelectItem value="line">
                            <div className="flex items-center gap-2">
                              <LineChart className="w-3 h-3" />
                              Line Chart
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Chart Title</Label>
                      <Input
                        value={chartTitle}
                        onChange={(e) => setChartTitle(e.target.value)}
                        placeholder="Enter chart title"
                        data-testid="chart-title-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Labels (comma-separated)</Label>
                      <Input
                        value={chartLabels}
                        onChange={(e) => setChartLabels(e.target.value)}
                        placeholder="Label 1, Label 2, Label 3"
                        data-testid="chart-labels-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Values (comma-separated)</Label>
                      <Input
                        value={chartValues}
                        onChange={(e) => setChartValues(e.target.value)}
                        placeholder="25, 50, 75"
                        data-testid="chart-values-input"
                      />
                    </div>

                    {getChartPreview() && (
                      <div className="space-y-2">
                        <Label className="text-xs">Preview</Label>
                        <div 
                          className="border rounded-lg p-4 bg-muted/50"
                          dangerouslySetInnerHTML={{ __html: getChartPreview() }}
                        />
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => {
                        const svg = getChartPreview();
                        if (svg) {
                          handleInsertContent(`<div class="chart-container my-4">${svg}</div>`);
                        } else {
                          toast({ 
                            title: "Invalid Data", 
                            description: "Please enter valid labels and values", 
                            variant: "destructive" 
                          });
                        }
                      }}
                      disabled={!getChartPreview()}
                      data-testid="button-insert-chart"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Insert Chart
                    </Button>
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

              <AccordionItem value="qr-code" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    QR Code Generator
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-3">
                  <div className="space-y-2">
                    <Label className="text-xs">URL or Text</Label>
                    <Input
                      value={qrCodeText}
                      onChange={(e) => {
                        setQrCodeText(e.target.value);
                        setShowQrPreview(false);
                      }}
                      placeholder="Enter URL or text to encode"
                      data-testid="qr-url-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Size</Label>
                    <Select value={qrCodeSize} onValueChange={(v) => {
                      setQrCodeSize(v as "100" | "150" | "200");
                      setShowQrPreview(false);
                    }}>
                      <SelectTrigger data-testid="qr-size-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">Small (100px)</SelectItem>
                        <SelectItem value="150">Medium (150px)</SelectItem>
                        <SelectItem value="200">Large (200px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowQrPreview(true)}
                    disabled={!qrCodeText.trim()}
                    data-testid="button-generate-qr"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </Button>

                  {showQrPreview && qrCodeText.trim() && (
                    <div className="space-y-3">
                      <Label className="text-xs">Preview</Label>
                      <div className="border rounded-lg p-4 bg-white flex justify-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrCodeSize}x${qrCodeSize}&data=${encodeURIComponent(qrCodeText)}`}
                          alt="QR Code Preview"
                          className="rounded"
                          style={{ width: `${qrCodeSize}px`, height: `${qrCodeSize}px` }}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          const qrHtml = `<figure class="qr-code my-4 text-center">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrCodeSize}x${qrCodeSize}&data=${encodeURIComponent(qrCodeText)}" alt="QR Code" class="mx-auto rounded" />
  <figcaption class="text-sm text-muted-foreground mt-2">Scan to visit: ${qrCodeText}</figcaption>
</figure>`;
                          handleInsertContent(qrHtml);
                        }}
                        data-testid="button-insert-qr"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Insert QR Code
                      </Button>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="appendix" className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Appendix Templates
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    One-click starters for common appendix sections
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(appendixTemplates).map(([key, template]) => {
                      const IconComponent = template.icon;
                      return (
                        <Tooltip key={key}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-xs gap-2"
                              onClick={() => handleInsertContent(template.html)}
                              data-testid={`button-insert-appendix-${key}`}
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

        <TabsContent value="research" className="flex-1 flex flex-col m-0 overflow-hidden" data-testid="tab-content-research">
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Source
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Source Type</Label>
                    <Select 
                      value={newSource.type} 
                      onValueChange={(v) => setNewSource(prev => ({ ...prev, type: v as "book" | "website" | "article" | "journal" }))}
                    >
                      <SelectTrigger data-testid="select-source-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="book">Book</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="journal">Journal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={newSource.title}
                      onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter source title"
                      data-testid="input-source-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Author</Label>
                    <Input
                      value={newSource.author}
                      onChange={(e) => setNewSource(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Enter author name"
                      data-testid="input-source-author"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">URL (optional)</Label>
                    <Input
                      value={newSource.url}
                      onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://..."
                      data-testid="input-source-url"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Year</Label>
                    <Input
                      value={newSource.year}
                      onChange={(e) => setNewSource(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="2024"
                      data-testid="input-source-year"
                    />
                  </div>

                  <Button
                    onClick={() => {
                      if (!newSource.title.trim() || !newSource.author.trim()) {
                        toast({ title: "Missing Fields", description: "Title and Author are required", variant: "destructive" });
                        return;
                      }
                      const source: Source = {
                        id: Date.now().toString(),
                        type: newSource.type,
                        title: newSource.title.trim(),
                        author: newSource.author.trim(),
                        url: newSource.url.trim() || undefined,
                        year: newSource.year.trim(),
                      };
                      setSources(prev => [...prev, source]);
                      setNewSource({ type: "book", title: "", author: "", url: "", year: "" });
                      toast({ title: "Source Added", description: "The source has been added to your list" });
                    }}
                    className="w-full"
                    data-testid="button-add-source"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Source
                  </Button>
                </CardContent>
              </Card>

              {sources.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Library className="w-4 h-4" />
                      Sources ({sources.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {sources.map((source, index) => (
                      <div 
                        key={source.id} 
                        className="p-3 border rounded-lg space-y-2"
                        data-testid={`source-item-${source.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" data-testid={`text-source-title-${source.id}`}>
                              {source.title}
                            </p>
                            <p className="text-xs text-muted-foreground" data-testid={`text-source-author-${source.id}`}>
                              {source.author}
                              {source.year && ` (${source.year})`}
                            </p>
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-xs" data-testid={`badge-source-type-${source.id}`}>
                            {source.type}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => {
                              const citationNumber = index + 1;
                              const citationHtml = `<span class="citation text-primary cursor-pointer" data-source-id="${source.id}">[${citationNumber}]</span>`;
                              handleInsertContent(citationHtml);
                            }}
                            data-testid={`button-insert-citation-${source.id}`}
                          >
                            Insert Citation
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSources(prev => prev.filter(s => s.id !== source.id));
                              toast({ title: "Source Deleted", description: "The source has been removed" });
                            }}
                            data-testid={`button-delete-source-${source.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {sources.length > 0 && (
                <Button
                  onClick={() => {
                    const formatSource = (source: Source, index: number): string => {
                      const author = source.author;
                      const year = source.year || "n.d.";
                      const title = source.title;
                      
                      switch (source.type) {
                        case "book":
                          return `<li>${author} (${year}). <em>${title}</em>.</li>`;
                        case "journal":
                          return `<li>${author}. "${title}." <em>Journal</em>, ${year}.</li>`;
                        case "article":
                          return `<li>${author}. "${title}." ${year}.</li>`;
                        case "website":
                          return `<li>${author}. "${title}." ${source.url ? `<a href="${source.url}">${source.url}</a>. ` : ""}${year}.</li>`;
                        default:
                          return `<li>${author} (${year}). ${title}.</li>`;
                      }
                    };

                    const bibliographyItems = sources.map((source, index) => formatSource(source, index)).join('\n      ');
                    const bibliographyHtml = `<div class="bibliography my-6 p-4 border rounded">
  <h3 class="font-bold mb-4">References</h3>
  <ol class="list-decimal pl-6 space-y-2">
      ${bibliographyItems}
  </ol>
</div>`;
                    handleInsertContent(bibliographyHtml);
                  }}
                  className="w-full"
                  data-testid="button-generate-bibliography"
                >
                  <BookCopy className="w-4 h-4 mr-2" />
                  Generate Bibliography
                </Button>
              )}

              {sources.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No sources added yet</p>
                  <p className="text-xs mt-1">Add sources to manage citations</p>
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
