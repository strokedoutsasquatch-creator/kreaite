import { useState, useRef, useCallback } from "react";
import CreatorHeader from "@/components/CreatorHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Upload,
  Video,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Scissors,
  Type,
  Sparkles,
  Wand2,
  Image,
  Music,
  Layers,
  Download,
  FileVideo,
  Film,
  Clapperboard,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Plus,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Settings,
  Palette,
  SlidersHorizontal,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Crop,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  Droplets,
  Thermometer,
  Loader2,
  Check,
  X,
  FolderOpen,
  Save,
  Share2,
  Instagram,
  Youtube,
  Smartphone,
  Monitor,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Captions,
  Mic,
  Brain,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Heart,
  Bookmark,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react";
import { SiTiktok } from "react-icons/si";

interface VideoProject {
  id: string;
  name: string;
  thumbnail: string;
  duration: string;
  lastEdited: string;
  format: string;
}

interface VideoTemplate {
  id: string;
  name: string;
  category: string;
  aspectRatio: string;
  duration: string;
  thumbnail: string;
  popular: boolean;
}

interface TimelineTrack {
  id: string;
  name: string;
  type: "video" | "audio" | "text" | "effect";
  color: string;
  clips: TimelineClip[];
  visible: boolean;
  locked: boolean;
}

interface TimelineClip {
  id: string;
  name: string;
  start: number;
  duration: number;
  color: string;
}

const templates: VideoTemplate[] = [
  { id: "1", name: "TikTok Vertical", category: "social", aspectRatio: "9:16", duration: "60s", thumbnail: "", popular: true },
  { id: "2", name: "YouTube Shorts", category: "social", aspectRatio: "9:16", duration: "60s", thumbnail: "", popular: true },
  { id: "3", name: "Instagram Reels", category: "social", aspectRatio: "9:16", duration: "90s", thumbnail: "", popular: true },
  { id: "4", name: "Instagram Story", category: "social", aspectRatio: "9:16", duration: "15s", thumbnail: "", popular: false },
  { id: "5", name: "YouTube Standard", category: "youtube", aspectRatio: "16:9", duration: "10min", thumbnail: "", popular: true },
  { id: "6", name: "YouTube Thumbnail", category: "youtube", aspectRatio: "16:9", duration: "image", thumbnail: "", popular: false },
  { id: "7", name: "Instagram Post", category: "social", aspectRatio: "1:1", duration: "60s", thumbnail: "", popular: false },
  { id: "8", name: "Facebook Cover", category: "social", aspectRatio: "16:9", duration: "20s", thumbnail: "", popular: false },
  { id: "9", name: "Cinematic", category: "film", aspectRatio: "21:9", duration: "unlimited", thumbnail: "", popular: false },
  { id: "10", name: "Podcast Video", category: "podcast", aspectRatio: "16:9", duration: "unlimited", thumbnail: "", popular: false },
];

const aiTools = [
  { id: "auto-captions", name: "Auto Captions", icon: Captions, description: "AI-powered subtitle generation", badge: "Popular" },
  { id: "background-removal", name: "Background Removal", icon: Layers, description: "Remove or replace backgrounds", badge: "AI" },
  { id: "scene-detection", name: "Scene Detection", icon: Scissors, description: "Auto-detect scene changes", badge: "AI" },
  { id: "voice-enhance", name: "Voice Enhance", icon: Mic, description: "Improve audio clarity", badge: "Pro" },
  { id: "noise-removal", name: "Noise Removal", icon: Volume2, description: "Remove background noise", badge: "AI" },
  { id: "auto-reframe", name: "Auto Reframe", icon: Crop, description: "Smart aspect ratio conversion", badge: "AI" },
  { id: "color-match", name: "Color Match", icon: Palette, description: "Match colors across clips", badge: "Pro" },
  { id: "smart-cut", name: "Smart Cut", icon: Zap, description: "Remove silences automatically", badge: "AI" },
];

const effects = [
  { id: "blur", name: "Blur", category: "basic" },
  { id: "sharpen", name: "Sharpen", category: "basic" },
  { id: "vignette", name: "Vignette", category: "basic" },
  { id: "glitch", name: "Glitch", category: "trendy" },
  { id: "retro", name: "Retro VHS", category: "trendy" },
  { id: "film-grain", name: "Film Grain", category: "cinematic" },
  { id: "letterbox", name: "Letterbox", category: "cinematic" },
  { id: "color-grade", name: "Color Grade", category: "cinematic" },
];

const initialTracks: TimelineTrack[] = [
  {
    id: "video-1",
    name: "Video 1",
    type: "video",
    color: "bg-orange-500",
    visible: true,
    locked: false,
    clips: [
      { id: "clip-1", name: "Intro", start: 0, duration: 5, color: "bg-orange-500" },
      { id: "clip-2", name: "Main Content", start: 5, duration: 15, color: "bg-orange-600" },
    ],
  },
  {
    id: "audio-1",
    name: "Audio 1",
    type: "audio",
    color: "bg-blue-500",
    visible: true,
    locked: false,
    clips: [
      { id: "audio-clip-1", name: "Background Music", start: 0, duration: 20, color: "bg-blue-500" },
    ],
  },
  {
    id: "text-1",
    name: "Text",
    type: "text",
    color: "bg-green-500",
    visible: true,
    locked: false,
    clips: [
      { id: "text-clip-1", name: "Title", start: 0, duration: 3, color: "bg-green-500" },
    ],
  },
];

export default function VideoStudio() {
  const [activeTab, setActiveTab] = useState("upload");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TimelineTrack[]>(initialTracks);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState("mp4");
  const [exportQuality, setExportQuality] = useState("1080p");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [processingAI, setProcessingAI] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith("video/") || file.type.startsWith("audio/") || file.type.startsWith("image/")
    );
    setUploadedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...files]);
    }
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setExportProgress(i);
    }
    setIsExporting(false);
  };

  const handleAITool = async (toolId: string) => {
    setProcessingAI(toolId);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setProcessingAI(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black">
      <CreatorHeader />

      <section className="relative py-12 px-4 sm:px-6 lg:px-8 border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Video className="w-8 h-8 text-orange-500" />
                </div>
                <Badge variant="outline" className="border-orange-500/50 text-orange-500" data-testid="badge-ai-powered">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight" data-testid="text-hero-title">
                VIDEO STUDIO
              </h1>
              <p className="text-gray-400 text-lg mt-2 max-w-xl" data-testid="text-hero-description">
                Professional video editing with AI-powered tools. Create TikToks, Reels, 
                and YouTube content with auto-captions, background removal, and smart editing.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-orange-500/30 text-white"
                data-testid="button-open-project"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Open Project
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-black font-semibold"
                data-testid="button-new-project"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800 p-1">
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black"
              data-testid="tab-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black"
              data-testid="tab-templates"
            >
              <Clapperboard className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black"
              data-testid="tab-projects"
            >
              <Film className="w-4 h-4 mr-2" />
              My Projects
            </TabsTrigger>
            <TabsTrigger
              value="editor"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black"
              data-testid="tab-editor"
            >
              <Scissors className="w-4 h-4 mr-2" />
              Editor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-gray-700 hover:border-orange-500/50 bg-gray-900/50"
              }`}
              data-testid="dropzone-upload"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*,image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-orange-500/20 rounded-full">
                  <Upload className="w-12 h-12 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Drop your videos here
                  </h3>
                  <p className="text-gray-400">
                    or click to browse • Supports MP4, MOV, AVI, WebM
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    Video
                  </span>
                  <span className="flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    Audio
                  </span>
                  <span className="flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    Images
                  </span>
                </div>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileVideo className="w-5 h-5 text-orange-500" />
                    Uploaded Files ({uploadedFiles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative group bg-gray-800 rounded-lg p-3 hover-elevate"
                        data-testid={`uploaded-file-${index}`}
                      >
                        <div className="aspect-video bg-gray-700 rounded flex items-center justify-center mb-2">
                          <Video className="w-8 h-8 text-gray-500" />
                        </div>
                        <p className="text-sm text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
                          }}
                          data-testid={`button-remove-file-${index}`}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-black font-semibold"
                      onClick={() => setActiveTab("editor")}
                      data-testid="button-start-editing"
                    >
                      <Scissors className="w-4 h-4 mr-2" />
                      Start Editing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-800 hover-elevate">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Zap className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Quick Start</CardTitle>
                      <CardDescription>Use a template</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full border-orange-500/30 text-white"
                    onClick={() => setActiveTab("templates")}
                    data-testid="button-browse-templates"
                  >
                    Browse Templates
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800 hover-elevate">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Brain className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-white">AI Magic</CardTitle>
                      <CardDescription>Auto-edit with AI</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full border-blue-500/30 text-white"
                    data-testid="button-ai-auto-edit"
                  >
                    Let AI Edit
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800 hover-elevate">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Film className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Recent Projects</CardTitle>
                      <CardDescription>Continue editing</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full border-purple-500/30 text-white"
                    onClick={() => setActiveTab("projects")}
                    data-testid="button-view-projects"
                  >
                    View Projects
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Video Templates</h2>
                <p className="text-gray-400">Start with a template optimized for your platform</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search templates..."
                    className="pl-10 bg-gray-900 border-gray-700 text-white w-64"
                    data-testid="input-search-templates"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white" data-testid="select-template-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="film">Cinematic</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`bg-gray-900 border-gray-800 cursor-pointer transition-all hover-elevate ${
                    selectedTemplate === template.id ? "ring-2 ring-orange-500" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                  data-testid={`template-${template.id}`}
                >
                  <CardContent className="p-4">
                    <div className="relative aspect-[9/16] bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                      {template.aspectRatio === "16:9" ? (
                        <RectangleHorizontal className="w-12 h-12 text-gray-600" />
                      ) : template.aspectRatio === "9:16" ? (
                        <RectangleVertical className="w-12 h-12 text-gray-600" />
                      ) : template.aspectRatio === "1:1" ? (
                        <Square className="w-12 h-12 text-gray-600" />
                      ) : (
                        <Monitor className="w-12 h-12 text-gray-600" />
                      )}
                      {template.popular && (
                        <Badge className="absolute top-2 right-2 bg-orange-500 text-black text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-white text-sm">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{template.aspectRatio}</span>
                      <span>•</span>
                      <span>{template.duration}</span>
                    </div>
                    {template.category === "social" && (
                      <div className="flex items-center gap-1 mt-2">
                        {template.name.includes("TikTok") && <SiTiktok className="w-3 h-3 text-gray-400" />}
                        {template.name.includes("YouTube") && <Youtube className="w-3 h-3 text-gray-400" />}
                        {template.name.includes("Instagram") && <Instagram className="w-3 h-3 text-gray-400" />}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedTemplate && (
              <div className="flex justify-center">
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-black font-semibold"
                  onClick={() => setActiveTab("editor")}
                  data-testid="button-use-template"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use This Template
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">My Projects</h2>
                <p className="text-gray-400">Continue working on your video projects</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="border-gray-700" data-testid="button-view-grid">
                  <Grid className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-gray-700" data-testid="button-view-list">
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((project) => (
                <Card
                  key={project}
                  className="bg-gray-900 border-gray-800 hover-elevate cursor-pointer"
                  data-testid={`project-${project}`}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video bg-gray-800 rounded-t-lg flex items-center justify-center">
                      <Video className="w-12 h-12 text-gray-600" />
                      <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                        02:45
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-gray-400 hover:text-white"
                        data-testid={`button-project-menu-${project}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white">Project {project}</h3>
                      <p className="text-sm text-gray-500 mt-1">Edited 2 hours ago</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs">
                          TikTok
                        </Badge>
                        <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs">
                          Draft
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center text-gray-500 py-8">
              <Film className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>Create your first video project to see it here</p>
            </div>
          </TabsContent>

          <TabsContent value="editor" className="space-y-4">
            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-300px)] min-h-[600px]">
              {showAIPanel && (
                <div className="col-span-2 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                  <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-orange-500" />
                      AI Tools
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowAIPanel(false)}
                      data-testid="button-close-ai-panel"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[calc(100%-48px)]">
                    <div className="p-2 space-y-1">
                      {aiTools.map((tool) => (
                        <Button
                          key={tool.id}
                          variant="ghost"
                          className={`w-full justify-start h-auto py-2 px-3 ${
                            selectedTool === tool.id ? "bg-orange-500/20 text-orange-500" : "text-gray-300"
                          }`}
                          onClick={() => {
                            setSelectedTool(tool.id);
                            handleAITool(tool.id);
                          }}
                          disabled={processingAI !== null}
                          data-testid={`button-ai-tool-${tool.id}`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            {processingAI === tool.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <tool.icon className="w-4 h-4" />
                            )}
                            <div className="flex-1 text-left">
                              <div className="text-sm font-medium">{tool.name}</div>
                              <div className="text-xs text-gray-500">{tool.description}</div>
                            </div>
                            <Badge className="text-[10px] bg-gray-800 text-gray-400">{tool.badge}</Badge>
                          </div>
                        </Button>
                      ))}
                    </div>
                    <Separator className="bg-gray-800 my-2" />
                    <div className="p-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">Effects</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {effects.map((effect) => (
                          <Button
                            key={effect.id}
                            variant="ghost"
                            size="sm"
                            className="justify-start text-gray-400 text-xs"
                            data-testid={`button-effect-${effect.id}`}
                          >
                            {effect.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className={`${showAIPanel ? "col-span-7" : "col-span-9"} flex flex-col gap-4`}>
                <Card className="bg-gray-900 border-gray-800 flex-1">
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="flex-1 bg-black rounded-t-lg flex items-center justify-center relative">
                      <div className="aspect-video w-full max-w-3xl bg-gray-800 rounded flex items-center justify-center">
                        <Video className="w-24 h-24 text-gray-600" />
                      </div>
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <Badge variant="outline" className="border-gray-700 text-gray-400">
                          16:9
                        </Badge>
                        <Badge variant="outline" className="border-gray-700 text-gray-400">
                          1080p
                        </Badge>
                      </div>
                      <div className="absolute top-4 right-4 flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="text-gray-400" data-testid="button-zoom-in">
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-400" data-testid="button-zoom-out">
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400"
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          data-testid="button-fullscreen"
                        >
                          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-900 border-t border-gray-800">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="text-gray-400" data-testid="button-skip-back">
                            <SkipBack className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white"
                            onClick={() => setIsPlaying(!isPlaying)}
                            data-testid="button-play-pause"
                          >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gray-400" data-testid="button-skip-forward">
                            <SkipForward className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                          <span className="text-xs text-gray-400 font-mono w-12">{formatTime(currentTime)}</span>
                          <Slider
                            value={[currentTime]}
                            max={duration}
                            step={0.1}
                            onValueChange={([v]) => setCurrentTime(v)}
                            className="flex-1"
                            data-testid="slider-timeline"
                          />
                          <span className="text-xs text-gray-400 font-mono w-12">{formatTime(duration)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400"
                            onClick={() => setIsMuted(!isMuted)}
                            data-testid="button-mute"
                          >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </Button>
                          <Slider
                            value={[isMuted ? 0 : volume]}
                            max={100}
                            onValueChange={([v]) => {
                              setVolume(v);
                              setIsMuted(v === 0);
                            }}
                            className="w-20"
                            data-testid="slider-volume"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800 h-48">
                  <CardContent className="p-0 h-full">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" data-testid="button-add-track">
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" data-testid="button-undo">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" data-testid="button-redo">
                          <RotateCw className="w-4 h-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-5 bg-gray-700" />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" data-testid="button-split">
                          <Scissors className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400" data-testid="button-delete-clip">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Zoom:</span>
                        <Slider
                          value={[zoom]}
                          min={50}
                          max={200}
                          onValueChange={([v]) => setZoom(v)}
                          className="w-24"
                          data-testid="slider-zoom"
                        />
                        <span className="text-xs text-gray-400 w-10">{zoom}%</span>
                      </div>
                    </div>

                    <ScrollArea className="h-[calc(100%-40px)]">
                      <div className="p-2 space-y-1">
                        {tracks.map((track) => (
                          <div key={track.id} className="flex items-center gap-2" data-testid={`track-${track.id}`}>
                            <div className="w-24 flex items-center gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500">
                                <GripVertical className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  setTracks((prev) =>
                                    prev.map((t) => (t.id === track.id ? { ...t, visible: !t.visible } : t))
                                  )
                                }
                                data-testid={`button-track-visibility-${track.id}`}
                              >
                                {track.visible ? (
                                  <Eye className="w-3 h-3 text-gray-400" />
                                ) : (
                                  <EyeOff className="w-3 h-3 text-gray-600" />
                                )}
                              </Button>
                              <span className="text-xs text-gray-400 truncate">{track.name}</span>
                            </div>
                            <div className="flex-1 h-8 bg-gray-800 rounded relative">
                              {track.clips.map((clip) => (
                                <div
                                  key={clip.id}
                                  className={`absolute top-0 h-full ${clip.color} rounded cursor-pointer transition-all ${
                                    selectedClip === clip.id ? "ring-2 ring-white" : ""
                                  }`}
                                  style={{
                                    left: `${(clip.start / duration) * 100}%`,
                                    width: `${(clip.duration / duration) * 100}%`,
                                  }}
                                  onClick={() => setSelectedClip(clip.id)}
                                  data-testid={`clip-${clip.id}`}
                                >
                                  <span className="text-[10px] text-white px-1 truncate block">{clip.name}</span>
                                </div>
                              ))}
                              <div
                                className="absolute top-0 w-0.5 h-full bg-white z-10"
                                style={{ left: `${(currentTime / duration) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-3 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <Tabs defaultValue="properties" className="h-full flex flex-col">
                  <TabsList className="bg-gray-800 rounded-none border-b border-gray-700 justify-start p-0">
                    <TabsTrigger
                      value="properties"
                      className="rounded-none data-[state=active]:bg-gray-900"
                      data-testid="tab-properties"
                    >
                      <SlidersHorizontal className="w-4 h-4 mr-1" />
                      Properties
                    </TabsTrigger>
                    <TabsTrigger
                      value="export"
                      className="rounded-none data-[state=active]:bg-gray-900"
                      data-testid="tab-export"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="properties" className="flex-1 p-4 space-y-4 overflow-auto m-0">
                    <div>
                      <Label className="text-gray-400 text-xs uppercase">Transform</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label className="text-gray-500 text-xs">Position X</Label>
                          <Input
                            type="number"
                            defaultValue="0"
                            className="bg-gray-800 border-gray-700 text-white h-8"
                            data-testid="input-position-x"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-500 text-xs">Position Y</Label>
                          <Input
                            type="number"
                            defaultValue="0"
                            className="bg-gray-800 border-gray-700 text-white h-8"
                            data-testid="input-position-y"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-500 text-xs">Scale</Label>
                          <Input
                            type="number"
                            defaultValue="100"
                            className="bg-gray-800 border-gray-700 text-white h-8"
                            data-testid="input-scale"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-500 text-xs">Rotation</Label>
                          <Input
                            type="number"
                            defaultValue="0"
                            className="bg-gray-800 border-gray-700 text-white h-8"
                            data-testid="input-rotation"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div>
                      <Label className="text-gray-400 text-xs uppercase">Color Correction</Label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center gap-3">
                          <Sun className="w-4 h-4 text-gray-500" />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Brightness</span>
                              <span>0</span>
                            </div>
                            <Slider defaultValue={[0]} min={-100} max={100} data-testid="slider-brightness" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Contrast className="w-4 h-4 text-gray-500" />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Contrast</span>
                              <span>0</span>
                            </div>
                            <Slider defaultValue={[0]} min={-100} max={100} data-testid="slider-contrast" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Droplets className="w-4 h-4 text-gray-500" />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Saturation</span>
                              <span>0</span>
                            </div>
                            <Slider defaultValue={[0]} min={-100} max={100} data-testid="slider-saturation" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Thermometer className="w-4 h-4 text-gray-500" />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Temperature</span>
                              <span>0</span>
                            </div>
                            <Slider defaultValue={[0]} min={-100} max={100} data-testid="slider-temperature" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div>
                      <Label className="text-gray-400 text-xs uppercase">Quick Actions</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <Button variant="outline" size="icon" className="border-gray-700" data-testid="button-flip-h">
                          <FlipHorizontal className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="border-gray-700" data-testid="button-flip-v">
                          <FlipVertical className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="border-gray-700" data-testid="button-crop">
                          <Crop className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="border-gray-700" data-testid="button-move">
                          <Move className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="export" className="flex-1 p-4 space-y-4 overflow-auto m-0">
                    <div>
                      <Label className="text-gray-400 text-xs uppercase mb-2 block">Export Format</Label>
                      <Select value={exportFormat} onValueChange={setExportFormat}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-export-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                          <SelectItem value="webm">WebM (VP9)</SelectItem>
                          <SelectItem value="gif">GIF (Animated)</SelectItem>
                          <SelectItem value="mov">MOV (ProRes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs uppercase mb-2 block">Quality</Label>
                      <Select value={exportQuality} onValueChange={setExportQuality}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-export-quality">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="4k">4K (2160p)</SelectItem>
                          <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                          <SelectItem value="720p">HD (720p)</SelectItem>
                          <SelectItem value="480p">SD (480p)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs uppercase mb-2 block">Preset</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="outline"
                          className="justify-start border-gray-700 text-white"
                          data-testid="button-preset-tiktok"
                        >
                          <SiTiktok className="w-4 h-4 mr-2" />
                          TikTok (9:16, 60s max)
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start border-gray-700 text-white"
                          data-testid="button-preset-youtube"
                        >
                          <Youtube className="w-4 h-4 mr-2" />
                          YouTube Shorts (9:16, 60s)
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start border-gray-700 text-white"
                          data-testid="button-preset-instagram"
                        >
                          <Instagram className="w-4 h-4 mr-2" />
                          Instagram Reels (9:16, 90s)
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="flex items-center justify-between">
                      <Label className="text-gray-400 text-sm">Include Captions</Label>
                      <Switch data-testid="switch-include-captions" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-400 text-sm">Optimize for Web</Label>
                      <Switch defaultChecked data-testid="switch-optimize-web" />
                    </div>

                    {isExporting && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Exporting...</span>
                          <span className="text-orange-500">{exportProgress}%</span>
                        </div>
                        <Progress value={exportProgress} className="h-2" />
                      </div>
                    )}

                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold"
                      onClick={handleExport}
                      disabled={isExporting}
                      data-testid="button-export"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export Video
                        </>
                      )}
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-700 text-white"
                        data-testid="button-save-project"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-700 text-white"
                        data-testid="button-share"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {!showAIPanel && (
              <Button
                variant="outline"
                size="sm"
                className="fixed left-4 top-1/2 -translate-y-1/2 border-orange-500/30 text-orange-500"
                onClick={() => setShowAIPanel(true)}
                data-testid="button-show-ai-panel"
              >
                <Wand2 className="w-4 h-4 mr-1" />
                AI Tools
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
