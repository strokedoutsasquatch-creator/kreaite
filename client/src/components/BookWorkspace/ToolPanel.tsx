import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
  Calculator,
  FlaskConical,
  Binary,
  Sigma,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ToolPanelProps {
  projectId?: number;
  onInsertContent?: (html: string) => void;
  manuscriptContent?: string;
  onReplaceContent?: (html: string) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestedEdit?: string;
}

interface ImageAnalysis {
  description: string;
  altText: string;
  caption: string;
  placement: {
    recommendation: string;
    suggestedChapter: string;
    position: string;
  };
  style: {
    description: string;
    isConsistent: boolean;
    notes: string;
  };
  printReadiness: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  hasBackground: boolean;
  analysis?: ImageAnalysis;
  isAnalyzing?: boolean;
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

const visualTemplates = {
  exerciseWithImage: {
    icon: Dumbbell,
    label: "Exercise + Image",
    description: "Exercise with visual demonstration",
    html: `<div class="exercise-visual my-6 p-5 bg-primary/5 dark:bg-primary/10 border border-primary/30 rounded-lg">
  <div class="flex flex-col md:flex-row gap-4">
    <div class="flex-1">
      <p class="font-bold text-primary text-lg mb-3">[EXERCISE] Exercise Name</p>
      <div class="space-y-2 text-foreground">
        <p><strong>Target Area:</strong> [Muscle group or body part]</p>
        <p><strong>Difficulty:</strong> Beginner / Intermediate / Advanced</p>
        <p><strong>Duration:</strong> [Time] | <strong>Reps:</strong> [Number]</p>
      </div>
      <div class="mt-4">
        <p class="font-semibold text-foreground mb-2">Instructions:</p>
        <ol class="list-decimal pl-5 text-foreground space-y-1">
          <li>Starting position: Describe the initial posture...</li>
          <li>Movement: Describe the action to perform...</li>
          <li>Hold or repeat: Duration or repetitions...</li>
          <li>Return: How to complete the movement...</li>
        </ol>
      </div>
      <div class="mt-4 p-3 bg-yellow-500/10 rounded text-sm">
        <p class="font-semibold text-yellow-600 dark:text-yellow-400">[CAUTION]</p>
        <p class="text-muted-foreground">Stop if you feel pain. Consult your therapist before attempting.</p>
      </div>
    </div>
    <div class="w-full md:w-48 flex-shrink-0">
      <div class="border-2 border-dashed border-primary/50 rounded-lg p-4 text-center bg-background h-48 flex items-center justify-center">
        <div>
          <p class="text-primary font-medium">[IMAGE]</p>
          <p class="text-xs text-muted-foreground mt-1">Exercise demonstration</p>
        </div>
      </div>
    </div>
  </div>
</div>`,
  },
  stepByStepVisual: {
    icon: LayoutGrid,
    label: "Visual Steps",
    description: "Step-by-step guide with images",
    html: `<div class="visual-steps my-6">
  <p class="font-bold text-xl text-foreground mb-4">[VISUAL GUIDE] Process Name</p>
  <div class="space-y-4">
    <div class="step-item flex gap-4 p-4 bg-card border rounded-lg">
      <div class="step-number w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</div>
      <div class="flex-1">
        <p class="font-semibold text-foreground mb-1">Step 1: Title</p>
        <p class="text-muted-foreground text-sm">Description of what to do in this step...</p>
      </div>
      <div class="w-24 h-24 border-2 border-dashed border-muted rounded flex items-center justify-center shrink-0">
        <p class="text-xs text-muted-foreground">[Image]</p>
      </div>
    </div>
    <div class="step-item flex gap-4 p-4 bg-card border rounded-lg">
      <div class="step-number w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</div>
      <div class="flex-1">
        <p class="font-semibold text-foreground mb-1">Step 2: Title</p>
        <p class="text-muted-foreground text-sm">Description of what to do in this step...</p>
      </div>
      <div class="w-24 h-24 border-2 border-dashed border-muted rounded flex items-center justify-center shrink-0">
        <p class="text-xs text-muted-foreground">[Image]</p>
      </div>
    </div>
    <div class="step-item flex gap-4 p-4 bg-card border rounded-lg">
      <div class="step-number w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">3</div>
      <div class="flex-1">
        <p class="font-semibold text-foreground mb-1">Step 3: Title</p>
        <p class="text-muted-foreground text-sm">Description of what to do in this step...</p>
      </div>
      <div class="w-24 h-24 border-2 border-dashed border-muted rounded flex items-center justify-center shrink-0">
        <p class="text-xs text-muted-foreground">[Image]</p>
      </div>
    </div>
  </div>
</div>`,
  },
  beforeAfter: {
    icon: Layers,
    label: "Before/After",
    description: "Comparison view with images",
    html: `<div class="before-after my-6 p-5 border rounded-lg">
  <p class="font-bold text-lg text-foreground mb-4 text-center">[COMPARISON] Title</p>
  <div class="grid grid-cols-2 gap-4">
    <div class="before-section">
      <div class="border-2 border-dashed border-red-500/50 rounded-lg p-4 h-40 flex items-center justify-center bg-red-500/5">
        <div class="text-center">
          <p class="text-red-500 font-medium">[BEFORE]</p>
          <p class="text-xs text-muted-foreground mt-1">Image placeholder</p>
        </div>
      </div>
      <div class="mt-3 p-3 bg-red-500/10 rounded">
        <p class="font-semibold text-red-600 dark:text-red-400 text-sm">Before:</p>
        <ul class="text-sm text-muted-foreground mt-1 space-y-1">
          <li>- Point about initial state</li>
          <li>- Another observation</li>
        </ul>
      </div>
    </div>
    <div class="after-section">
      <div class="border-2 border-dashed border-green-500/50 rounded-lg p-4 h-40 flex items-center justify-center bg-green-500/5">
        <div class="text-center">
          <p class="text-green-500 font-medium">[AFTER]</p>
          <p class="text-xs text-muted-foreground mt-1">Image placeholder</p>
        </div>
      </div>
      <div class="mt-3 p-3 bg-green-500/10 rounded">
        <p class="font-semibold text-green-600 dark:text-green-400 text-sm">After:</p>
        <ul class="text-sm text-muted-foreground mt-1 space-y-1">
          <li>- Improvement or change</li>
          <li>- Another result</li>
        </ul>
      </div>
    </div>
  </div>
</div>`,
  },
  caseStudy: {
    icon: UserCircle,
    label: "Case Study",
    description: "Real-world example with story",
    html: `<div class="case-study my-6 p-5 bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/30 rounded-lg">
  <div class="flex items-start gap-4">
    <div class="w-16 h-16 rounded-full border-2 border-dashed border-blue-500/50 flex items-center justify-center bg-background shrink-0">
      <p class="text-xs text-muted-foreground">[Photo]</p>
    </div>
    <div class="flex-1">
      <p class="text-xs uppercase tracking-wider text-blue-500 mb-1">Case Study</p>
      <p class="font-bold text-lg text-foreground">[Patient/Client Name], Age [X]</p>
      <p class="text-sm text-muted-foreground">[Brief background: occupation, condition, etc.]</p>
    </div>
  </div>
  <div class="mt-4 space-y-4">
    <div class="challenge p-3 bg-red-500/10 rounded">
      <p class="font-semibold text-red-600 dark:text-red-400 text-sm mb-1">The Challenge:</p>
      <p class="text-foreground text-sm">Describe the initial problem, symptoms, or situation...</p>
    </div>
    <div class="approach p-3 bg-blue-500/10 rounded">
      <p class="font-semibold text-blue-600 dark:text-blue-400 text-sm mb-1">The Approach:</p>
      <p class="text-foreground text-sm">Describe the treatment plan, intervention, or solution...</p>
    </div>
    <div class="outcome p-3 bg-green-500/10 rounded">
      <p class="font-semibold text-green-600 dark:text-green-400 text-sm mb-1">The Outcome:</p>
      <p class="text-foreground text-sm">Describe the results, improvements, or lessons learned...</p>
    </div>
  </div>
  <div class="mt-4 p-3 border-l-4 border-primary bg-primary/5 rounded-r">
    <p class="text-sm italic text-foreground">"Quote from the patient or key takeaway from this case..."</p>
  </div>
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
      <span class="absolute left-0">-></span>
      First important point to remember
    </li>
    <li class="pl-6 relative">
      <span class="absolute left-0">-></span>
      Second important point to remember
    </li>
    <li class="pl-6 relative">
      <span class="absolute left-0">-></span>
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
  <p class="text-2xl tracking-[1rem] text-muted-foreground/50">* * *</p>
</div>`,
  },
  pullQuote: {
    icon: Quote,
    label: "Pull Quote",
    description: "Highlighted quote with attribution",
    html: `<blockquote class="pull-quote my-8 px-8 py-6 border-l-4 border-primary bg-primary/5 dark:bg-primary/10 text-xl italic leading-relaxed">
  <p class="mb-3 text-foreground">"Insert your compelling quote here. This should be a powerful statement that captures the essence of your message."</p>
  <footer class="text-sm not-italic text-muted-foreground">
    -- <cite class="font-semibold">Author Name</cite>, <span class="italic">Source Title</span>
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
    This is supplementary information that provides additional context, background details, or interesting facts related to the main content.
  </p>
</aside>`,
  },
  proTip: {
    icon: Star,
    label: "Pro Tip",
    description: "Expert advice and insider tips",
    html: `<aside class="pro-tip my-6 p-5 bg-gradient-to-r from-primary/10 to-yellow-500/10 border-l-4 border-primary rounded-r-lg">
  <p class="font-bold text-base mb-2 text-primary flex items-center gap-2">
    [PRO TIP]
  </p>
  <p class="text-foreground leading-relaxed">
    Share expert advice, insider knowledge, or a professional recommendation that gives readers an edge.
  </p>
</aside>`,
  },
  didYouKnow: {
    icon: Lightbulb,
    label: "Did You Know",
    description: "Interesting facts and trivia",
    html: `<aside class="did-you-know my-6 p-5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
  <p class="font-bold text-base mb-2 text-purple-600 dark:text-purple-400 flex items-center gap-2">
    [DID YOU KNOW?]
  </p>
  <p class="text-foreground leading-relaxed">
    Share a surprising fact, interesting statistic, or piece of trivia that enhances the reader's understanding.
  </p>
</aside>`,
  },
  quickTrick: {
    icon: Feather,
    label: "Quick Trick",
    description: "Shortcuts and hacks",
    html: `<aside class="quick-trick my-6 p-5 bg-green-500/10 border border-green-500/30 rounded-lg">
  <p class="font-bold text-base mb-2 text-green-600 dark:text-green-400 flex items-center gap-2">
    [QUICK TRICK]
  </p>
  <p class="text-foreground leading-relaxed mb-3">
    A simple shortcut, hack, or workaround that saves time or makes something easier.
  </p>
  <p class="text-sm text-muted-foreground italic">
    Time saved: approximately [X] minutes
  </p>
</aside>`,
  },
  knowledgeBox: {
    icon: BookOpen,
    label: "Knowledge Box",
    description: "Deep dive into a concept",
    html: `<aside class="knowledge-box my-6 p-5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
  <p class="font-bold text-base mb-3 text-blue-600 dark:text-blue-400 flex items-center gap-2">
    [KNOWLEDGE] Topic Title
  </p>
  <p class="text-foreground leading-relaxed mb-3">
    Provide a deeper explanation of a concept, term, or process mentioned in the main text.
  </p>
  <div class="mt-3 pt-3 border-t border-blue-500/20">
    <p class="text-sm text-muted-foreground">
      <strong>Key Points:</strong>
    </p>
    <ul class="text-sm text-muted-foreground mt-1 list-disc pl-5">
      <li>First important point</li>
      <li>Second important point</li>
      <li>Third important point</li>
    </ul>
  </div>
</aside>`,
  },
  realTalk: {
    icon: Heart,
    label: "Real Talk",
    description: "Honest advice and truth bombs",
    html: `<aside class="real-talk my-6 p-5 bg-red-500/10 border-l-4 border-red-500 rounded-r-lg">
  <p class="font-bold text-base mb-2 text-red-600 dark:text-red-400 flex items-center gap-2">
    [REAL TALK]
  </p>
  <p class="text-foreground leading-relaxed">
    Be honest with your readers here. Share the hard truths, common mistakes to avoid, or the reality that many books gloss over.
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
      <span class="absolute left-0">></span>
      <strong>Book Title</strong> by Author Name
    </li>
    <li class="pl-5 relative">
      <span class="absolute left-0">></span>
      <strong>Website:</strong> www.example.com
    </li>
    <li class="pl-5 relative">
      <span class="absolute left-0">></span>
      <strong>Video:</strong> Tutorial or documentary title
    </li>
  </ul>
</div>`,
  },
};

const technicalTemplates = {
  equation: {
    icon: Calculator,
    label: "Equation Box",
    description: "Mathematical formula or equation",
    html: `<div class="equation-box my-6 p-5 bg-slate-500/10 border border-slate-500/30 rounded-lg text-center">
  <p class="font-mono text-lg text-foreground mb-2">[EQUATION]</p>
  <p class="font-mono text-xl text-primary">E = mc<sup>2</sup></p>
  <p class="text-sm text-muted-foreground mt-3 italic">Where E is energy, m is mass, and c is the speed of light</p>
</div>`,
  },
  codeBlock: {
    icon: Code,
    label: "Code Block",
    description: "Code snippet with syntax highlighting",
    html: `<div class="code-block my-6 rounded-lg overflow-hidden border border-slate-500/30">
  <div class="bg-slate-800 text-slate-200 px-4 py-2 text-xs font-mono flex justify-between items-center">
    <span>example.js</span>
    <span class="text-slate-400">JavaScript</span>
  </div>
  <pre class="bg-slate-900 text-slate-100 p-4 text-sm font-mono overflow-x-auto"><code>// Your code here
function example() {
  return "Hello, World!";
}</code></pre>
</div>`,
  },
  table: {
    icon: LayoutGrid,
    label: "Data Table",
    description: "Structured data in table format",
    html: `<div class="data-table my-6 overflow-x-auto">
  <table class="w-full border-collapse">
    <thead>
      <tr class="bg-muted">
        <th class="border border-border px-4 py-2 text-left font-semibold">Column 1</th>
        <th class="border border-border px-4 py-2 text-left font-semibold">Column 2</th>
        <th class="border border-border px-4 py-2 text-left font-semibold">Column 3</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="border border-border px-4 py-2">Data 1</td>
        <td class="border border-border px-4 py-2">Data 2</td>
        <td class="border border-border px-4 py-2">Data 3</td>
      </tr>
      <tr class="bg-muted/50">
        <td class="border border-border px-4 py-2">Data 4</td>
        <td class="border border-border px-4 py-2">Data 5</td>
        <td class="border border-border px-4 py-2">Data 6</td>
      </tr>
    </tbody>
  </table>
</div>`,
  },
  formula: {
    icon: FlaskConical,
    label: "Formula Card",
    description: "Scientific or technical formula",
    html: `<div class="formula-card my-6 p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
  <p class="font-bold text-base mb-3 text-blue-600 dark:text-blue-400">[FORMULA] Name</p>
  <div class="bg-white dark:bg-slate-800 rounded p-4 text-center font-mono text-lg mb-3">
    A = &pi;r<sup>2</sup>
  </div>
  <div class="text-sm text-muted-foreground">
    <p class="mb-1"><strong>Variables:</strong></p>
    <ul class="list-disc pl-5">
      <li>A = Area</li>
      <li>&pi; = Pi (approximately 3.14159)</li>
      <li>r = Radius</li>
    </ul>
  </div>
</div>`,
  },
  definition: {
    icon: BookText,
    label: "Definition",
    description: "Term definition with explanation",
    html: `<div class="definition my-6 p-5 border-l-4 border-primary bg-primary/5 rounded-r-lg">
  <p class="font-bold text-lg text-primary mb-1">[TERM]</p>
  <p class="text-sm text-muted-foreground italic mb-3">/pronunciation/</p>
  <p class="text-foreground leading-relaxed">
    The definition of the term goes here. Provide a clear, concise explanation that helps readers understand the concept.
  </p>
  <p class="text-sm text-muted-foreground mt-3">
    <strong>Example:</strong> "The term is used when..."
  </p>
</div>`,
  },
};

export default function ToolPanel({ projectId, onInsertContent, manuscriptContent, onReplaceContent }: ToolPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create");
  
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "I'm your professional editor. I can see your manuscript and will provide specific feedback, suggest edits with before/after examples, and help strengthen your writing. What would you like me to focus on?",
      timestamp: new Date(),
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isRemovingBg, setIsRemovingBg] = useState<string | null>(null);
  const [imagePlacementMode, setImagePlacementMode] = useState<"auto" | "hybrid" | "manual">("hybrid");
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
  const [imageSettings, setImageSettings] = useState<Record<string, { size: string; align: string; caption: string; altText: string }>>({});

  const [trimSize, setTrimSize] = useState("6x9");
  const [marginInside, setMarginInside] = useState(0.75);
  const [marginOutside, setMarginOutside] = useState(0.5);
  const [fontFamily, setFontFamily] = useState("garamond");
  const [fontSize, setFontSize] = useState(11);
  const [lineSpacing, setLineSpacing] = useState(1.5);
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

  const [sources, setSources] = useState<Source[]>([]);
  const [newSource, setNewSource] = useState<{ type: "book" | "website" | "article" | "journal"; title: string; author: string; url: string; year: string }>({ type: "book", title: "", author: "", url: "", year: "" });

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
      // Build conversation history for context (last 12 messages for better memory)
      const conversationHistory = chatMessages.slice(-12).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await apiRequest('POST', '/api/ai/chat', {
        message: chatInput,
        projectId,
        context: "book-writing",
        manuscriptContent: manuscriptContent?.slice(0, 8000), // Send first 8k chars for context
        conversationHistory,
      });
      const response = await res.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response || "I apologize, I couldn't generate a response.",
        timestamp: new Date(),
        suggestedEdit: response.suggestedEdit,
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI chat error:", error);
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

  const handleAnalyzeImage = async (imageId: string, imageUrl: string) => {
    setGeneratedImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, isAnalyzing: true } : img
    ));

    try {
      let imageBase64 = undefined;
      if (imageUrl.startsWith('blob:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const res = await apiRequest('POST', '/api/ai/analyze-image', {
        imageUrl: imageUrl.startsWith('blob:') ? undefined : imageUrl,
        imageBase64,
        bookContext: "Professional book publication",
        chapterTitles: ["Introduction", "Chapter 1", "Chapter 2", "Chapter 3", "Conclusion"],
      });
      const data = await res.json();

      if (data.analysis) {
        setGeneratedImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, analysis: data.analysis, isAnalyzing: false }
            : img
        ));
        toast({ title: "Analysis Complete", description: "AI recommendations ready" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to analyze image", variant: "destructive" });
      setGeneratedImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, isAnalyzing: false } : img
      ));
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="border-b border-zinc-700 p-3 shrink-0 bg-zinc-800">
          <TabsList className="grid grid-cols-3 h-auto bg-zinc-700 p-1 rounded-lg w-full">
            <TabsTrigger 
              value="create" 
              className="flex items-center justify-center gap-2 py-3 px-2 text-white data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-zinc-600 text-sm font-medium"
              data-testid="tab-create"
            >
              <Wand2 className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger 
              value="library" 
              className="flex items-center justify-center gap-2 py-3 px-2 text-white data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-zinc-600 text-sm font-medium"
              data-testid="tab-library"
            >
              <FolderOpen className="w-4 h-4" />
              Library
            </TabsTrigger>
            <TabsTrigger 
              value="format" 
              className="flex items-center justify-center gap-2 py-3 px-2 text-white data-[state=active]:bg-primary data-[state=active]:text-white hover:bg-zinc-600 text-sm font-medium"
              data-testid="tab-format"
            >
              <Settings className="w-4 h-4" />
              Format
            </TabsTrigger>
          </TabsList>
        </div>

        {/* CREATE TAB - AI, Images, Content, Import */}
        <TabsContent value="create" className="flex-1 m-0 overflow-hidden bg-white">
          <ScrollArea className="h-full">
            <div className="p-3">
              <Accordion type="multiple" defaultValue={["ai-chat", "images"]} className="space-y-2">
                {/* AI Chat/Writing */}
                <AccordionItem value="ai-chat" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">AI Writing Assistant</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      <div className="bg-zinc-50 rounded-lg p-3 max-h-48 overflow-y-auto border border-zinc-200">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-2 mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
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
                                    ? 'bg-primary text-white'
                                    : 'bg-white border border-zinc-200 text-zinc-900'
                                }`}
                              >
                                {msg.content}
                              </div>
                              {msg.role === 'assistant' && msg.id !== 'welcome' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="self-start h-6 px-2 text-xs gap-1"
                                  onClick={() => handleInsertContent(`<p>${msg.content}</p>`)}
                                  data-testid={`button-insert-ai-response-${msg.id}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  Insert
                                </Button>
                              )}
                            </div>
                            {msg.role === 'user' && (
                              <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
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
                            <div className="bg-white border rounded-lg px-3 py-2 text-sm">Thinking...</div>
                          </div>
                        )}
                      </div>
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
                  </AccordionContent>
                </AccordionItem>

                {/* Image Generation & Upload */}
                <AccordionItem value="images" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">Images</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Upload */}
                      <div>
                        <Label className="text-xs font-medium text-zinc-900 mb-2 block">Upload Image</Label>
                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-zinc-400" />
                            <p className="text-xs text-zinc-500">Drop or click to upload</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                const newImage: GeneratedImage = {
                                  id: Date.now().toString(),
                                  url,
                                  prompt: file.name,
                                  hasBackground: true,
                                };
                                setGeneratedImages(prev => [newImage, ...prev]);
                                toast({ title: "Image Uploaded", description: file.name });
                              }
                            }}
                            data-testid="input-upload-image"
                          />
                        </label>
                      </div>
                      
                      {/* Generate */}
                      <div>
                        <Label className="text-xs font-medium text-zinc-900 mb-2 block">Generate with AI</Label>
                        <Textarea
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          placeholder="Describe the image..."
                          className="min-h-[60px] text-sm mb-2"
                          data-testid="textarea-image-prompt"
                        />
                        <Button
                          onClick={handleGenerateImage}
                          disabled={isGeneratingImage || !imagePrompt.trim()}
                          className="w-full"
                          size="sm"
                          data-testid="button-generate-image"
                        >
                          {isGeneratingImage ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Wand2 className="w-4 h-4 mr-2" />
                          )}
                          Generate
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Content Blocks */}
                <AccordionItem value="content" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">Content Blocks</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <Accordion type="multiple" className="space-y-2">
                      {/* Callouts */}
                      <AccordionItem value="callouts" className="border rounded px-2">
                        <AccordionTrigger className="text-xs py-2">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-3 h-3" />
                            Callouts
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(calloutTemplates).map(([key, template]) => {
                              const IconComponent = template.icon;
                              return (
                                <Button
                                  key={key}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-xs gap-1 h-8"
                                  onClick={() => handleInsertContent(template.html)}
                                  data-testid={`button-insert-callout-${key}`}
                                >
                                  <IconComponent className="w-3 h-3 shrink-0" />
                                  {template.label}
                                </Button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Charts */}
                      <AccordionItem value="charts" className="border rounded px-2">
                        <AccordionTrigger className="text-xs py-2">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-3 h-3" />
                            Charts
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(chartTemplates).map(([key, template]) => {
                              const IconComponent = template.icon;
                              return (
                                <Button
                                  key={key}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-xs gap-1 h-8"
                                  onClick={() => handleInsertContent(template.html)}
                                  data-testid={`button-insert-chart-${key}`}
                                >
                                  <IconComponent className="w-3 h-3 shrink-0" />
                                  {template.label}
                                </Button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Lists */}
                      <AccordionItem value="lists" className="border rounded px-2">
                        <AccordionTrigger className="text-xs py-2">
                          <div className="flex items-center gap-2">
                            <ListOrdered className="w-3 h-3" />
                            Lists & Timelines
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(listTemplates).map(([key, template]) => {
                              const IconComponent = template.icon;
                              return (
                                <Button
                                  key={key}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-xs gap-1 h-8"
                                  onClick={() => handleInsertContent(template.html)}
                                  data-testid={`button-insert-list-${key}`}
                                >
                                  <IconComponent className="w-3 h-3 shrink-0" />
                                  {template.label}
                                </Button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Visual Templates */}
                      <AccordionItem value="visual" className="border rounded px-2">
                        <AccordionTrigger className="text-xs py-2">
                          <div className="flex items-center gap-2">
                            <Layers className="w-3 h-3" />
                            Visual Templates
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(visualTemplates).map(([key, template]) => {
                              const IconComponent = template.icon;
                              return (
                                <Button
                                  key={key}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-xs gap-1 h-8"
                                  onClick={() => handleInsertContent(template.html)}
                                  data-testid={`button-insert-visual-${key}`}
                                >
                                  <IconComponent className="w-3 h-3 shrink-0" />
                                  {template.label}
                                </Button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Book Elements */}
                      <AccordionItem value="book-elements" className="border rounded px-2">
                        <AccordionTrigger className="text-xs py-2">
                          <div className="flex items-center gap-2">
                            <BookMarked className="w-3 h-3" />
                            Book Elements
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(bookElementTemplates).map(([key, template]) => {
                              const IconComponent = template.icon;
                              return (
                                <Button
                                  key={key}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-xs gap-1 h-8"
                                  onClick={() => handleInsertContent(template.html)}
                                  data-testid={`button-insert-book-${key}`}
                                >
                                  <IconComponent className="w-3 h-3 shrink-0" />
                                  {template.label}
                                </Button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Technical */}
                      <AccordionItem value="technical" className="border rounded px-2">
                        <AccordionTrigger className="text-xs py-2">
                          <div className="flex items-center gap-2">
                            <Code className="w-3 h-3" />
                            Technical
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(technicalTemplates).map(([key, template]) => {
                              const IconComponent = template.icon;
                              return (
                                <Button
                                  key={key}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start text-xs gap-1 h-8"
                                  onClick={() => handleInsertContent(template.html)}
                                  data-testid={`button-insert-technical-${key}`}
                                >
                                  <IconComponent className="w-3 h-3 shrink-0" />
                                  {template.label}
                                </Button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>

                {/* Import Document */}
                <AccordionItem value="import" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">Import Document</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-3">
                      Import from Word, PDF, text, or Markdown files.
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
                          <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
                          <p className="text-xs text-muted-foreground">
                            Importing {importedFile?.name}...
                          </p>
                        </div>
                      ) : (
                        <label htmlFor="document-import-input" className="cursor-pointer">
                          <FileUp className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                          <p className="text-sm font-medium">Drop file or click to upload</p>
                          <p className="text-xs text-muted-foreground">.docx, .pdf, .txt, .md</p>
                        </label>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* LIBRARY TAB - Generated Images, Sources/Citations */}
        <TabsContent value="library" className="flex-1 m-0 overflow-hidden bg-white">
          <ScrollArea className="h-full">
            <div className="p-3">
              <Accordion type="multiple" defaultValue={["images-gallery", "sources"]} className="space-y-2">
                {/* Images Gallery */}
                <AccordionItem value="images-gallery" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">Images ({generatedImages.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {generatedImages.length > 0 ? (
                      <div className="space-y-3">
                        {/* Placement Mode */}
                        <div className="flex gap-1 p-2 bg-zinc-100 rounded-lg">
                          <Button
                            variant={imagePlacementMode === "auto" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setImagePlacementMode("auto")}
                            className="flex-1 text-xs h-7"
                            data-testid="button-placement-auto"
                          >
                            <Grid3X3 className="w-3 h-3 mr-1" />
                            Auto
                          </Button>
                          <Button
                            variant={imagePlacementMode === "hybrid" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setImagePlacementMode("hybrid")}
                            className="flex-1 text-xs h-7"
                            data-testid="button-placement-hybrid"
                          >
                            <Layers className="w-3 h-3 mr-1" />
                            Hybrid
                          </Button>
                          <Button
                            variant={imagePlacementMode === "manual" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setImagePlacementMode("manual")}
                            className="flex-1 text-xs h-7"
                            data-testid="button-placement-manual"
                          >
                            <Move className="w-3 h-3 mr-1" />
                            Manual
                          </Button>
                        </div>

                        {generatedImages.map((img) => {
                          const isExpanded = expandedImageId === img.id;
                          const settings = imageSettings[img.id] || { size: "medium", align: "center", caption: "", altText: "" };
                          
                          return (
                            <Card key={img.id} className="overflow-hidden">
                              <div 
                                className="relative aspect-video bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setExpandedImageId(isExpanded ? null : img.id)}
                              >
                                <img
                                  src={img.url}
                                  alt={img.analysis?.altText || img.prompt}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2 flex gap-1">
                                  {img.hasBackground && (
                                    <Badge variant="secondary" className="text-xs">BG</Badge>
                                  )}
                                  {img.analysis && (
                                    <Badge variant="default" className="bg-green-600 text-xs">
                                      {img.analysis.printReadiness.score}/10
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {isExpanded && (
                                <CardContent className="p-3 space-y-3 border-t-2 border-primary">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAnalyzeImage(img.id, img.url)}
                                      disabled={img.isAnalyzing}
                                      className="flex-1 text-xs"
                                      data-testid={`button-analyze-${img.id}`}
                                    >
                                      {img.isAnalyzing ? (
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      ) : (
                                        <Wand2 className="w-3 h-3 mr-1" />
                                      )}
                                      Analyze
                                    </Button>
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
                                  </div>

                                  {img.analysis && (
                                    <div className="bg-orange-50 border border-orange-200 rounded p-2">
                                      <p className="text-xs font-medium text-orange-800 flex items-center gap-1 mb-1">
                                        <Lightbulb className="w-3 h-3" />
                                        AI Recommendation
                                      </p>
                                      <p className="text-xs text-orange-700">{img.analysis.placement.recommendation}</p>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-xs text-zinc-900">Size</Label>
                                      <Select 
                                        value={settings.size} 
                                        onValueChange={(v) => setImageSettings(prev => ({
                                          ...prev,
                                          [img.id]: { ...settings, size: v }
                                        }))}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="small">Small</SelectItem>
                                          <SelectItem value="medium">Medium</SelectItem>
                                          <SelectItem value="large">Large</SelectItem>
                                          <SelectItem value="full">Full Width</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-zinc-900">Align</Label>
                                      <Select 
                                        value={settings.align} 
                                        onValueChange={(v) => setImageSettings(prev => ({
                                          ...prev,
                                          [img.id]: { ...settings, align: v }
                                        }))}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="left">Left</SelectItem>
                                          <SelectItem value="center">Center</SelectItem>
                                          <SelectItem value="right">Right</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <Label className="text-xs text-zinc-900">Caption</Label>
                                    <Input
                                      value={settings.caption || img.analysis?.caption || ""}
                                      onChange={(e) => setImageSettings(prev => ({
                                        ...prev,
                                        [img.id]: { ...settings, caption: e.target.value }
                                      }))}
                                      placeholder="Add caption..."
                                      className="h-8 text-xs"
                                    />
                                  </div>

                                  <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => {
                                        if (onInsertContent) {
                                          const sizeStyles: Record<string, string> = {
                                            small: "max-width: 200px;",
                                            medium: "max-width: 400px;",
                                            large: "max-width: 600px;",
                                            full: "max-width: 100%;",
                                          };
                                          const alignStyles: Record<string, string> = {
                                            left: "margin-right: auto;",
                                            center: "margin-left: auto; margin-right: auto;",
                                            right: "margin-left: auto;",
                                          };
                                          const altText = settings.altText || img.analysis?.altText || img.prompt;
                                          const caption = settings.caption || img.analysis?.caption || "";
                                          const html = caption
                                            ? `<figure style="margin: 1.5rem 0; ${alignStyles[settings.align]}"><img src="${img.url}" alt="${altText}" style="${sizeStyles[settings.size]} height: auto; display: block; ${alignStyles[settings.align]}" /><figcaption style="text-align: ${settings.align}; font-size: 0.875rem; color: #666; margin-top: 0.5rem; font-style: italic;">${caption}</figcaption></figure>`
                                            : `<img src="${img.url}" alt="${altText}" style="${sizeStyles[settings.size]} height: auto; display: block; margin: 1.5rem 0; ${alignStyles[settings.align]}" />`;
                                          onInsertContent(html);
                                          toast({ title: "Image Inserted", description: "Added to document" });
                                          setExpandedImageId(null);
                                        }
                                      }}
                                      className="flex-1 text-xs"
                                      data-testid={`button-insert-image-${img.id}`}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Insert
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        handleDeleteImage(img.id);
                                        setExpandedImageId(null);
                                      }}
                                      className="text-xs text-red-600 hover:text-red-700"
                                      data-testid={`button-delete-image-${img.id}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </CardContent>
                              )}

                              {!isExpanded && (
                                <CardContent className="p-2">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      if (onInsertContent) {
                                        const altText = img.analysis?.altText || img.prompt;
                                        onInsertContent(`<img src="${img.url}" alt="${altText}" style="max-width: 100%; height: auto; margin: 1rem 0;" />`);
                                        toast({ title: "Image Inserted" });
                                      }
                                    }}
                                    className="w-full text-xs"
                                    data-testid={`button-quick-insert-${img.id}`}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Quick Insert
                                  </Button>
                                </CardContent>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Image className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No images yet</p>
                        <p className="text-xs">Generate or upload images in the Create tab</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Sources & Citations */}
                <AccordionItem value="sources" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">Sources ({sources.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      {/* Add Source Form */}
                      <div className="p-3 bg-zinc-100 rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Select 
                            value={newSource.type} 
                            onValueChange={(v) => setNewSource(prev => ({ ...prev, type: v as "book" | "website" | "article" | "journal" }))}
                          >
                            <SelectTrigger className="h-8 text-xs" data-testid="select-source-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="book">Book</SelectItem>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="journal">Journal</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={newSource.year}
                            onChange={(e) => setNewSource(prev => ({ ...prev, year: e.target.value }))}
                            placeholder="Year"
                            className="h-8 text-xs"
                            data-testid="input-source-year"
                          />
                        </div>
                        <Input
                          value={newSource.title}
                          onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Title"
                          className="h-8 text-xs"
                          data-testid="input-source-title"
                        />
                        <Input
                          value={newSource.author}
                          onChange={(e) => setNewSource(prev => ({ ...prev, author: e.target.value }))}
                          placeholder="Author"
                          className="h-8 text-xs"
                          data-testid="input-source-author"
                        />
                        <Input
                          value={newSource.url}
                          onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="URL (optional)"
                          className="h-8 text-xs"
                          data-testid="input-source-url"
                        />
                        <Button
                          size="sm"
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
                            toast({ title: "Source Added" });
                          }}
                          className="w-full h-8 text-xs"
                          data-testid="button-add-source"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Source
                        </Button>
                      </div>

                      {/* Sources List */}
                      {sources.length > 0 ? (
                        <div className="space-y-2">
                          {sources.map((source, index) => (
                            <div 
                              key={source.id} 
                              className="p-2 border rounded bg-zinc-50"
                              data-testid={`source-item-${source.id}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate" data-testid={`text-source-title-${source.id}`}>
                                    {source.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground" data-testid={`text-source-author-${source.id}`}>
                                    {source.author}{source.year && ` (${source.year})`}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="text-xs shrink-0" data-testid={`badge-source-type-${source.id}`}>
                                  {source.type}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs h-7"
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
                                  className="h-7 px-2"
                                  onClick={() => {
                                    setSources(prev => prev.filter(s => s.id !== source.id));
                                    toast({ title: "Source Deleted" });
                                  }}
                                  data-testid={`button-delete-source-${source.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          <Button
                            onClick={() => {
                              const formatSource = (source: Source): string => {
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

                              const bibliographyItems = sources.map((source) => formatSource(source)).join('\n      ');
                              const bibliographyHtml = `<div class="bibliography my-6 p-4 border rounded">
  <h3 class="font-bold mb-4">References</h3>
  <ol class="list-decimal pl-6 space-y-2">
      ${bibliographyItems}
  </ol>
</div>`;
                              handleInsertContent(bibliographyHtml);
                            }}
                            className="w-full"
                            size="sm"
                            data-testid="button-generate-bibliography"
                          >
                            <BookCopy className="w-4 h-4 mr-2" />
                            Generate Bibliography
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <BookMarked className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No sources added yet</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* FORMAT TAB - KDP Settings, Compliance, Export */}
        <TabsContent value="format" className="flex-1 m-0 overflow-hidden bg-white">
          <ScrollArea className="h-full">
            <div className="p-3">
              <Accordion type="multiple" defaultValue={["page-setup", "front-matter"]} className="space-y-2">
                {/* Page Setup / KDP Settings */}
                <AccordionItem value="page-setup" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">Page Setup</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
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
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Typography */}
                <AccordionItem value="typography" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">Typography</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
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
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Layout Options */}
                <AccordionItem value="layout" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">Layout Options</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
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
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Front Matter Templates */}
                <AccordionItem value="front-matter" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm" data-testid="accordion-front-matter">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">Front Matter</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs gap-2 h-8"
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

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs gap-2 h-8"
                        onClick={() => handleInsertContent(`<div class="copyright-page text-xs leading-relaxed break-after-page py-16 px-10 text-foreground">
  <p class="mb-4"><strong>[Book Title]</strong></p>
  <p>Copyright @ ${new Date().getFullYear()} [Author Name]</p>
  <p>All rights reserved.</p>
  <p class="mt-4">ISBN: [Enter ISBN]</p>
  <p class="mt-4">Published by [Publisher Name]</p>
  <p class="mt-4">No part of this publication may be reproduced without written permission.</p>
  <p class="mt-4">First Edition: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
</div>`)}
                        data-testid="button-insert-copyright-page"
                      >
                        <FileText className="w-3 h-3 shrink-0" />
                        Copyright
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs gap-2 h-8"
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

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs gap-2 h-8"
                        onClick={() => handleInsertContent(`<div class="table-of-contents break-after-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-center text-foreground">Table of Contents</h2>
  <div class="leading-loose text-foreground">
    <p><strong>Chapter 1:</strong> [Title] ...................... 1</p>
    <p><strong>Chapter 2:</strong> [Title] ...................... 15</p>
    <p><strong>Chapter 3:</strong> [Title] ...................... 30</p>
  </div>
</div>`)}
                        data-testid="button-insert-toc-template"
                      >
                        <List className="w-3 h-3 shrink-0" />
                        TOC Template
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs gap-2 h-8"
                        onClick={() => handleInsertContent(`<div class="acknowledgments break-after-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-foreground">Acknowledgments</h2>
  <p class="text-foreground leading-relaxed">
    I would like to express my sincere gratitude to [names and organizations]...
  </p>
</div>`)}
                        data-testid="button-insert-acknowledgments"
                      >
                        <Award className="w-3 h-3 shrink-0" />
                        Acknowledgments
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs gap-2 h-8"
                        onClick={() => handleInsertContent(`<div class="foreword break-after-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-foreground">Foreword</h2>
  <p class="text-foreground leading-relaxed mb-4">
    [Foreword content written by a guest contributor...]
  </p>
  <p class="text-foreground mt-6 italic">
    -- [Foreword Author Name]<br/>
    [Title/Credentials]
  </p>
</div>`)}
                        data-testid="button-insert-foreword"
                      >
                        <Quote className="w-3 h-3 shrink-0" />
                        Foreword
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Back Matter */}
                <AccordionItem value="back-matter" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookCopy className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">Back Matter</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs gap-2 h-8"
                        onClick={() => handleInsertContent(`<div class="about-author break-after-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-foreground">About the Author</h2>
  <div class="flex gap-6 items-start">
    <div class="w-32 h-32 rounded-full bg-muted flex items-center justify-center shrink-0">
      <p class="text-xs text-muted-foreground">[Photo]</p>
    </div>
    <div class="flex-1">
      <p class="text-foreground leading-relaxed">
        [Author Name] is a [profession/background]. With [X] years of experience...
      </p>
      <p class="text-foreground leading-relaxed mt-4">
        Connect with [Author Name]:<br/>
        Website: [URL]<br/>
        Email: [Email]
      </p>
    </div>
  </div>
</div>`)}
                        data-testid="button-insert-about-author"
                      >
                        <UserCircle className="w-3 h-3 shrink-0" />
                        About Author
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs gap-2 h-8"
                        onClick={() => handleInsertContent(`<div class="index break-after-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-foreground">Index</h2>
  <div class="columns-2 gap-8 text-sm text-foreground">
    <p class="mb-1"><strong>A</strong></p>
    <p class="pl-4">Term 1, 12, 45, 78</p>
    <p class="pl-4">Term 2, 23, 56</p>
    <p class="mb-1 mt-3"><strong>B</strong></p>
    <p class="pl-4">Term 3, 34, 67, 89</p>
  </div>
</div>`)}
                        data-testid="button-insert-index"
                      >
                        <Hash className="w-3 h-3 shrink-0" />
                        Index
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs gap-2 h-8"
                        onClick={() => handleInsertContent(`<div class="glossary break-after-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-foreground">Glossary</h2>
  <dl class="space-y-4 text-foreground">
    <div>
      <dt class="font-semibold text-primary">Term 1</dt>
      <dd class="pl-4 text-muted-foreground">Definition of term 1...</dd>
    </div>
    <div>
      <dt class="font-semibold text-primary">Term 2</dt>
      <dd class="pl-4 text-muted-foreground">Definition of term 2...</dd>
    </div>
  </dl>
</div>`)}
                        data-testid="button-insert-glossary"
                      >
                        <BookText className="w-3 h-3 shrink-0" />
                        Glossary
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs gap-2 h-8"
                        onClick={() => handleInsertContent(`<div class="resources break-after-page p-10">
  <h2 class="text-2xl font-bold mb-6 text-foreground">Resources</h2>
  <h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">Recommended Reading</h3>
  <ul class="list-disc pl-6 space-y-2 text-foreground">
    <li><em>Book Title</em> by Author Name</li>
  </ul>
  <h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">Helpful Websites</h3>
  <ul class="list-disc pl-6 space-y-2 text-foreground">
    <li><strong>Website Name</strong> - www.example.com</li>
  </ul>
</div>`)}
                        data-testid="button-insert-resources"
                      >
                        <FolderOpen className="w-3 h-3 shrink-0" />
                        Resources
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ISBN & Compliance */}
                <AccordionItem value="isbn" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">ISBN & Compliance</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">ISBN Number</Label>
                        <Input
                          value={isbnInput}
                          onChange={(e) => {
                            setIsbnInput(e.target.value);
                            const cleaned = e.target.value.replace(/[-\s]/g, '');
                            if (cleaned.length > 0 && !/^\d{10}$|^\d{13}$/.test(cleaned)) {
                              setIsbnError("ISBN must be 10 or 13 digits");
                            } else {
                              setIsbnError("");
                            }
                          }}
                          placeholder="978-0-123456-78-9"
                          className={isbnError ? "border-red-500" : ""}
                          data-testid="input-isbn"
                        />
                        {isbnError && <p className="text-xs text-red-500">{isbnError}</p>}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          if (isbnInput && !isbnError) {
                            handleInsertContent(`<div class="qr-code my-4 text-center">
  <p class="text-xs text-muted-foreground mb-2">Scan for more information</p>
  <div class="inline-block p-4 bg-white border rounded">
    <p class="text-sm font-mono">[QR Code: ${isbnInput}]</p>
  </div>
</div>`);
                          }
                        }}
                        disabled={!isbnInput || !!isbnError}
                        data-testid="button-insert-qr"
                      >
                        <QrCode className="w-3 h-3 mr-2" />
                        Insert QR Code
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* KDP Checklist */}
                <AccordionItem value="kdp-checklist" className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-primary" />
                      <span className="font-medium text-zinc-900">KDP Checklist</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {Object.entries(kdpChecklist).map(([key, value]) => {
                        const labels: Record<string, string> = {
                          trimSizeSelected: "Trim size selected",
                          marginsCompliant: "Margins KDP compliant",
                          fontsEmbedded: "Fonts embedded",
                          imagesHighRes: "Images 300+ DPI",
                          noBleedIssues: "No bleed issues",
                          tocLinksWorking: "TOC links working",
                          copyrightComplete: "Copyright page complete",
                          pageCountMet: "Page count requirements met",
                        };
                        return (
                          <div key={key} className="flex items-center justify-between py-1">
                            <Label className="text-xs">{labels[key]}</Label>
                            <Switch
                              checked={value}
                              onCheckedChange={(checked) => 
                                setKdpChecklist(prev => ({ ...prev, [key]: checked }))
                              }
                              data-testid={`switch-kdp-${key}`}
                            />
                          </div>
                        );
                      })}
                      <div className="pt-3 border-t mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Completion</span>
                          <span className="text-sm font-medium text-primary">
                            {Math.round((Object.values(kdpChecklist).filter(Boolean).length / Object.keys(kdpChecklist).length) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all"
                            style={{ 
                              width: `${(Object.values(kdpChecklist).filter(Boolean).length / Object.keys(kdpChecklist).length) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
