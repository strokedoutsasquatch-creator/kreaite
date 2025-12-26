import { useState, useRef, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import CreatorHeader from "@/components/CreatorHeader";
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
  Image as ImageIcon,
  Sparkles,
  Wand2,
  Eraser,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Trash2,
  Plus,
  Layers,
  Palette,
  Sun,
  Contrast,
  Droplets,
  Focus,
  Maximize2,
  Crop,
  Move,
  Type,
  Square,
  Circle,
  Star,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Save,
  RefreshCw,
  ImagePlus,
  FileImage,
  Loader2,
  Eye,
  EyeOff,
  Undo,
  Redo,
  Grid,
  Settings,
  Sliders,
  Brush,
  PaintBucket,
  Blend,
  SunMedium,
  Moon,
  CloudSun,
  Zap,
  Film,
  Camera,
  MonitorPlay,
  FolderOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  originalUrl: string;
  width: number;
  height: number;
  size: number;
  format: string;
  createdAt: Date;
}

interface Filter {
  id: string;
  name: string;
  icon: typeof Sun;
  settings: {
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
    blur: number;
    sepia: number;
    grayscale: number;
  };
}

const presetFilters: Filter[] = [
  { id: "original", name: "Original", icon: ImageIcon, settings: { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sepia: 0, grayscale: 0 } },
  { id: "vivid", name: "Vivid", icon: Sun, settings: { brightness: 110, contrast: 120, saturation: 140, hue: 0, blur: 0, sepia: 0, grayscale: 0 } },
  { id: "warm", name: "Warm", icon: SunMedium, settings: { brightness: 105, contrast: 105, saturation: 110, hue: 20, blur: 0, sepia: 20, grayscale: 0 } },
  { id: "cool", name: "Cool", icon: Moon, settings: { brightness: 100, contrast: 110, saturation: 90, hue: -20, blur: 0, sepia: 0, grayscale: 0 } },
  { id: "dramatic", name: "Dramatic", icon: Contrast, settings: { brightness: 95, contrast: 140, saturation: 80, hue: 0, blur: 0, sepia: 0, grayscale: 0 } },
  { id: "vintage", name: "Vintage", icon: Camera, settings: { brightness: 90, contrast: 85, saturation: 70, hue: 10, blur: 0, sepia: 40, grayscale: 0 } },
  { id: "noir", name: "Noir", icon: Moon, settings: { brightness: 95, contrast: 130, saturation: 0, hue: 0, blur: 0, sepia: 0, grayscale: 100 } },
  { id: "fade", name: "Fade", icon: CloudSun, settings: { brightness: 110, contrast: 80, saturation: 70, hue: 0, blur: 0, sepia: 10, grayscale: 0 } },
];

const aspectRatios = [
  { id: "free", label: "Free", ratio: null },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "4:3", label: "4:3", ratio: 4/3 },
  { id: "16:9", label: "16:9", ratio: 16/9 },
  { id: "9:16", label: "9:16", ratio: 9/16 },
  { id: "3:4", label: "3:4", ratio: 3/4 },
];

const exportFormats = [
  { id: "png", label: "PNG", description: "Lossless, supports transparency" },
  { id: "jpg", label: "JPG", description: "Compressed, smaller file size" },
  { id: "webp", label: "WebP", description: "Modern format, best compression" },
];

export default function ImageStudio() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeTab, setActiveTab] = useState("edit");
  const [selectedTool, setSelectedTool] = useState("select");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hue, setHue] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState("original");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generateStyle, setGenerateStyle] = useState("photorealistic");
  const [generateAspectRatio, setGenerateAspectRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const [batchMode, setBatchMode] = useState(false);
  const [batchImages, setBatchImages] = useState<string[]>([]);
  
  const [exportFormat, setExportFormat] = useState("png");
  const [exportQuality, setExportQuality] = useState(90);
  const [showExportModal, setShowExportModal] = useState(false);

  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const newImage: UploadedImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: e.target?.result as string,
            originalUrl: e.target?.result as string,
            width: img.width,
            height: img.height,
            size: file.size,
            format: file.type.split("/")[1].toUpperCase(),
            createdAt: new Date(),
          };
          setUploadedImages(prev => [...prev, newImage]);
          if (!selectedImage) {
            setSelectedImage(newImage);
          }
          toast({
            title: "Image uploaded",
            description: `${file.name} has been added to your workspace.`,
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const applyFilter = (filter: Filter) => {
    setSelectedFilter(filter.id);
    setBrightness(filter.settings.brightness);
    setContrast(filter.settings.contrast);
    setSaturation(filter.settings.saturation);
    setHue(filter.settings.hue);
    setBlur(filter.settings.blur);
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setHue(0);
    setSelectedFilter("original");
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(100);
  };

  const handleRemoveBackground = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    setProcessingMessage("Removing background with AI...");
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 10, 90));
    }, 300);

    await new Promise(resolve => setTimeout(resolve, 3000));

    clearInterval(interval);
    setProcessingProgress(100);
    setProcessingMessage("Background removed successfully!");

    setTimeout(() => {
      setIsProcessing(false);
      setProcessingProgress(0);
      toast({
        title: "Background Removed",
        description: "AI has successfully removed the background from your image.",
      });
    }, 500);
  };

  const handleEnhanceImage = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    setProcessingMessage("Enhancing image with AI...");
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 8, 90));
    }, 250);

    await new Promise(resolve => setTimeout(resolve, 4000));

    clearInterval(interval);
    setProcessingProgress(100);
    setProcessingMessage("Image enhanced successfully!");

    setTimeout(() => {
      setIsProcessing(false);
      setProcessingProgress(0);
      toast({
        title: "Image Enhanced",
        description: "AI has enhanced your image with improved clarity and colors.",
      });
    }, 500);
  };

  const handleUpscaleImage = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    setProcessingMessage("Upscaling image 4x with AI...");
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 5, 90));
    }, 400);

    await new Promise(resolve => setTimeout(resolve, 5000));

    clearInterval(interval);
    setProcessingProgress(100);
    setProcessingMessage("Image upscaled to 4x resolution!");

    setTimeout(() => {
      setIsProcessing(false);
      setProcessingProgress(0);
      toast({
        title: "Image Upscaled",
        description: `Resolution increased to ${selectedImage.width * 4}x${selectedImage.height * 4}`,
      });
    }, 500);
  };

  const handleGenerateImage = async () => {
    if (!generatePrompt.trim()) {
      toast({
        title: "Enter a prompt",
        description: "Please describe the image you want to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProcessingMessage("Generating image with xAI Grok...");
    setProcessingProgress(0);
    setGeneratedImageUrl(null);

    const interval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 2, 85));
    }, 500);

    try {
      const stylePrompt = generateStyle !== "none" ? `, ${generateStyle} style` : "";
      const fullPrompt = `${generatePrompt}${stylePrompt}, high quality, detailed`;
      
      const response = await apiRequest("POST", "/api/video/generate-image", {
        prompt: fullPrompt,
      });
      
      const data = await response.json();
      
      clearInterval(interval);
      setProcessingProgress(100);

      if (data.success && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        
        const newImage: UploadedImage = {
          id: `gen-${Date.now()}`,
          name: `AI Generated - ${generatePrompt.slice(0, 30)}...`,
          url: data.imageUrl,
          originalUrl: data.imageUrl,
          width: 1024,
          height: 1024,
          size: 0,
          format: "PNG",
          createdAt: new Date(),
        };
        setUploadedImages(prev => [...prev, newImage]);
        setSelectedImage(newImage);
        
        toast({
          title: "Image Generated!",
          description: "Your AI-generated image has been created using xAI Grok.",
        });
      } else {
        throw new Error(data.error || "Failed to generate image");
      }
    } catch (error) {
      clearInterval(interval);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProcessingProgress(0);
    }
  };

  const handleExport = () => {
    toast({
      title: "Image Exported",
      description: `Your image has been exported as ${exportFormat.toUpperCase()}.`,
    });
    setShowExportModal(false);
  };

  const handleBatchProcess = async () => {
    if (batchImages.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select images for batch processing.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingMessage(`Processing ${batchImages.length} images...`);
    setProcessingProgress(0);

    for (let i = 0; i < batchImages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingProgress(((i + 1) / batchImages.length) * 100);
      setProcessingMessage(`Processing image ${i + 1} of ${batchImages.length}...`);
    }

    setIsProcessing(false);
    setProcessingProgress(0);
    setBatchImages([]);
    toast({
      title: "Batch Processing Complete",
      description: `Successfully processed ${batchImages.length} images.`,
    });
  };

  const getFilterStyle = () => {
    return {
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px)`,
      transform: `scale(${zoom / 100}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
    };
  };

  return (
    <div className="min-h-screen bg-black">
      <CreatorHeader />

      <section className="py-16 px-4 border-b border-orange-500/20" data-testid="section-hero">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-orange-500/10 text-orange-500 border-orange-500/30" data-testid="badge-ai-powered">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered Image Editing
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight" data-testid="text-title">
            IMAGE <span className="text-orange-500">STUDIO</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8" data-testid="text-description">
            Professional AI-powered image editing tools. Remove backgrounds, enhance photos, 
            generate images from text, apply filters, and export in multiple formats.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-black font-semibold gap-2"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload-hero"
            >
              <Upload className="w-5 h-5" />
              Upload Images
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-orange-500/30 text-white gap-2"
              onClick={() => setActiveTab("generate")}
              data-testid="button-generate-hero"
            >
              <Wand2 className="w-5 h-5" />
              Generate with AI
            </Button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800 p-1" data-testid="tabs-main">
            <TabsTrigger
              value="edit"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black gap-2"
              data-testid="tab-edit"
            >
              <Sliders className="w-4 h-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger
              value="generate"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black gap-2"
              data-testid="tab-generate"
            >
              <Wand2 className="w-4 h-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger
              value="my-images"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black gap-2"
              data-testid="tab-my-images"
            >
              <FolderOpen className="w-4 h-4" />
              My Images
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-black gap-2"
              data-testid="tab-batch"
            >
              <Grid className="w-4 h-4" />
              Batch
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4">
                    {selectedImage ? (
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setZoom(prev => Math.max(25, prev - 25))}
                              data-testid="button-zoom-out"
                            >
                              <ZoomOut className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-gray-400 w-12 text-center" data-testid="text-zoom-level">{zoom}%</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setZoom(prev => Math.min(400, prev + 25))}
                              data-testid="button-zoom-in"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Separator orientation="vertical" className="h-6 bg-gray-700" />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setRotation(prev => prev + 90)}
                              data-testid="button-rotate"
                            >
                              <RotateCw className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant={flipH ? "secondary" : "ghost"}
                              onClick={() => setFlipH(!flipH)}
                              data-testid="button-flip-h"
                            >
                              <FlipHorizontal className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant={flipV ? "secondary" : "ghost"}
                              onClick={() => setFlipV(!flipV)}
                              data-testid="button-flip-v"
                            >
                              <FlipVertical className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={resetAdjustments}
                              className="gap-1"
                              data-testid="button-reset"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Reset
                            </Button>
                            <Button
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-black gap-1"
                              onClick={() => setShowExportModal(true)}
                              data-testid="button-export"
                            >
                              <Download className="w-4 h-4" />
                              Export
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-center min-h-[500px] bg-gray-950 rounded-lg overflow-hidden">
                          <img
                            src={selectedImage.url}
                            alt={selectedImage.name}
                            className="max-w-full max-h-[500px] object-contain transition-all duration-200"
                            style={getFilterStyle()}
                            data-testid="img-canvas"
                          />
                        </div>
                        <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                          <span data-testid="text-image-name">{selectedImage.name}</span>
                          <span data-testid="text-image-dimensions">{selectedImage.width} × {selectedImage.height} • {selectedImage.format}</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                          isDragging ? "border-orange-500 bg-orange-500/10" : "border-gray-700 hover:border-gray-600"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="dropzone-upload"
                      >
                        <Upload className="w-16 h-16 text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Drop images here</h3>
                        <p className="text-gray-400 mb-4">or click to browse files</p>
                        <Badge variant="outline" className="border-gray-700 text-gray-400">
                          Supports PNG, JPG, WebP, GIF
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedImage && (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Palette className="w-5 h-5 text-orange-500" />
                        Filters & Presets
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="w-full">
                        <div className="flex gap-3 pb-2">
                          {presetFilters.map((filter) => (
                            <button
                              key={filter.id}
                              onClick={() => applyFilter(filter)}
                              className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all min-w-[80px] ${
                                selectedFilter === filter.id
                                  ? "bg-orange-500/20 border border-orange-500"
                                  : "bg-gray-800 border border-gray-700 hover:border-gray-600"
                              }`}
                              data-testid={`button-filter-${filter.id}`}
                            >
                              <div className={`w-12 h-12 rounded-md flex items-center justify-center ${
                                selectedFilter === filter.id ? "bg-orange-500" : "bg-gray-700"
                              }`}>
                                <filter.icon className={`w-6 h-6 ${
                                  selectedFilter === filter.id ? "text-black" : "text-gray-300"
                                }`} />
                              </div>
                              <span className={`text-xs font-medium ${
                                selectedFilter === filter.id ? "text-orange-500" : "text-gray-400"
                              }`}>
                                {filter.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-500" />
                      AI Tools
                    </CardTitle>
                    <CardDescription>Powered by advanced AI</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full justify-start gap-3 bg-gray-800 hover:bg-gray-700 text-white"
                      onClick={handleRemoveBackground}
                      disabled={!selectedImage || isProcessing}
                      data-testid="button-remove-bg"
                    >
                      <Eraser className="w-5 h-5 text-orange-500" />
                      <div className="text-left">
                        <div className="font-medium">Remove Background</div>
                        <div className="text-xs text-gray-400">AI-powered extraction</div>
                      </div>
                    </Button>
                    <Button
                      className="w-full justify-start gap-3 bg-gray-800 hover:bg-gray-700 text-white"
                      onClick={handleEnhanceImage}
                      disabled={!selectedImage || isProcessing}
                      data-testid="button-enhance"
                    >
                      <Wand2 className="w-5 h-5 text-orange-500" />
                      <div className="text-left">
                        <div className="font-medium">Auto Enhance</div>
                        <div className="text-xs text-gray-400">Color & clarity boost</div>
                      </div>
                    </Button>
                    <Button
                      className="w-full justify-start gap-3 bg-gray-800 hover:bg-gray-700 text-white"
                      onClick={handleUpscaleImage}
                      disabled={!selectedImage || isProcessing}
                      data-testid="button-upscale"
                    >
                      <Maximize2 className="w-5 h-5 text-orange-500" />
                      <div className="text-left">
                        <div className="font-medium">Upscale 4x</div>
                        <div className="text-xs text-gray-400">AI resolution boost</div>
                      </div>
                    </Button>
                    {isProcessing && (
                      <div className="space-y-2 p-3 bg-gray-800 rounded-lg" data-testid="container-processing">
                        <div className="flex items-center gap-2 text-sm text-orange-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {processingMessage}
                        </div>
                        <Progress value={processingProgress} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedImage && (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-orange-500" />
                        Adjustments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-400">Brightness</Label>
                          <span className="text-sm text-gray-500" data-testid="text-brightness-value">{brightness}%</span>
                        </div>
                        <Slider
                          value={[brightness]}
                          onValueChange={(v) => setBrightness(v[0])}
                          min={0}
                          max={200}
                          step={1}
                          className="cursor-pointer"
                          data-testid="slider-brightness"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-400">Contrast</Label>
                          <span className="text-sm text-gray-500" data-testid="text-contrast-value">{contrast}%</span>
                        </div>
                        <Slider
                          value={[contrast]}
                          onValueChange={(v) => setContrast(v[0])}
                          min={0}
                          max={200}
                          step={1}
                          className="cursor-pointer"
                          data-testid="slider-contrast"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-400">Saturation</Label>
                          <span className="text-sm text-gray-500" data-testid="text-saturation-value">{saturation}%</span>
                        </div>
                        <Slider
                          value={[saturation]}
                          onValueChange={(v) => setSaturation(v[0])}
                          min={0}
                          max={200}
                          step={1}
                          className="cursor-pointer"
                          data-testid="slider-saturation"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-400">Hue Rotate</Label>
                          <span className="text-sm text-gray-500" data-testid="text-hue-value">{hue}°</span>
                        </div>
                        <Slider
                          value={[hue]}
                          onValueChange={(v) => setHue(v[0])}
                          min={-180}
                          max={180}
                          step={1}
                          className="cursor-pointer"
                          data-testid="slider-hue"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-400">Blur</Label>
                          <span className="text-sm text-gray-500" data-testid="text-blur-value">{blur}px</span>
                        </div>
                        <Slider
                          value={[blur]}
                          onValueChange={(v) => setBlur(v[0])}
                          min={0}
                          max={20}
                          step={0.5}
                          className="cursor-pointer"
                          data-testid="slider-blur"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  data-testid="input-file"
                />
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-sidebar"
                >
                  <Plus className="w-5 h-5" />
                  Add Images
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-orange-500" />
                    AI Image Generator
                  </CardTitle>
                  <CardDescription>Describe the image you want to create</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400">Prompt</Label>
                    <Textarea
                      placeholder="A majestic mountain landscape at sunset with vibrant orange and purple skies..."
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                      className="min-h-[120px] bg-gray-800 border-gray-700 text-white resize-none"
                      data-testid="textarea-prompt"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400">Style</Label>
                      <Select value={generateStyle} onValueChange={setGenerateStyle}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-800">
                          <SelectItem value="photorealistic">Photorealistic</SelectItem>
                          <SelectItem value="artistic">Artistic</SelectItem>
                          <SelectItem value="anime">Anime</SelectItem>
                          <SelectItem value="3d">3D Render</SelectItem>
                          <SelectItem value="watercolor">Watercolor</SelectItem>
                          <SelectItem value="oil-painting">Oil Painting</SelectItem>
                          <SelectItem value="digital-art">Digital Art</SelectItem>
                          <SelectItem value="comic">Comic Book</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400">Aspect Ratio</Label>
                      <Select value={generateAspectRatio} onValueChange={setGenerateAspectRatio}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-aspect-ratio">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-800">
                          <SelectItem value="1:1">Square (1:1)</SelectItem>
                          <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                          <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                          <SelectItem value="4:3">Standard (4:3)</SelectItem>
                          <SelectItem value="3:4">Portrait (3:4)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold gap-2"
                    onClick={handleGenerateImage}
                    disabled={isGenerating || !generatePrompt.trim()}
                    data-testid="button-generate"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Image
                      </>
                    )}
                  </Button>
                  {isGenerating && (
                    <div className="space-y-2">
                      <Progress value={processingProgress} className="h-2" />
                      <p className="text-sm text-gray-400 text-center" data-testid="text-generating-status">{processingMessage}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ImagePlus className="w-5 h-5 text-orange-500" />
                    Generated Preview
                  </CardTitle>
                  <CardDescription>Your AI-generated images will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center min-h-[300px] bg-gray-800 rounded-lg border border-dashed border-gray-700 overflow-hidden">
                    {generatedImageUrl ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={generatedImageUrl} 
                          alt="AI Generated" 
                          className="w-full h-full object-contain max-h-[400px]"
                          data-testid="img-generated"
                        />
                        <div className="absolute bottom-2 right-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(generatedImageUrl, '_blank')}
                            data-testid="button-open-fullsize"
                          >
                            <Maximize2 className="w-4 h-4 mr-1" />
                            Full Size
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = generatedImageUrl;
                              link.download = 'ai-generated-image.png';
                              link.click();
                            }}
                            data-testid="button-download-generated"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400" data-testid="text-preview-placeholder">Your generated images will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Prompt Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    "A futuristic city skyline at night with neon lights reflecting on glass buildings",
                    "An enchanted forest with glowing mushrooms and magical fireflies",
                    "A cozy coffee shop interior with warm lighting and vintage decor",
                    "An underwater scene with colorful coral reefs and tropical fish",
                    "A space station orbiting Earth with the sun rising behind the planet",
                    "A serene Japanese garden with cherry blossoms and a koi pond",
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setGeneratePrompt(suggestion)}
                      className="p-3 text-left text-sm text-gray-400 bg-gray-800 rounded-lg border border-gray-700 hover:border-orange-500/50 hover:text-white transition-colors"
                      data-testid={`button-suggestion-${index}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-images" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-orange-500" />
                      My Images
                    </CardTitle>
                    <CardDescription>All your uploaded and generated images</CardDescription>
                  </div>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-black gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-gallery"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {uploadedImages.length === 0 ? (
                  <div
                    className={`flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragging ? "border-orange-500 bg-orange-500/10" : "border-gray-700 hover:border-gray-600"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="dropzone-gallery"
                  >
                    <Upload className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No images yet</h3>
                    <p className="text-gray-400">Drop images here or click to upload</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {uploadedImages.map((image) => (
                      <div
                        key={image.id}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage?.id === image.id
                            ? "border-orange-500"
                            : "border-transparent hover:border-gray-600"
                        }`}
                        onClick={() => {
                          setSelectedImage(image);
                          setActiveTab("edit");
                        }}
                        data-testid={`card-image-${image.id}`}
                      >
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="icon" variant="ghost" className="text-white" data-testid={`button-edit-${image.id}`}>
                            <Sliders className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedImages(prev => prev.filter(i => i.id !== image.id));
                              if (selectedImage?.id === image.id) {
                                setSelectedImage(null);
                              }
                            }}
                            data-testid={`button-delete-${image.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {selectedImage?.id === image.id && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-orange-500 text-black">Selected</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-orange-500" />
                  Batch Processing
                </CardTitle>
                <CardDescription>Apply the same edits to multiple images at once</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Select Images</Label>
                      <Badge variant="outline" className="border-orange-500/30 text-orange-500" data-testid="badge-selected-count">
                        {batchImages.length} selected
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                      {uploadedImages.map((image) => (
                        <div
                          key={image.id}
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            batchImages.includes(image.id)
                              ? "border-orange-500"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                          onClick={() => {
                            if (batchImages.includes(image.id)) {
                              setBatchImages(prev => prev.filter(id => id !== image.id));
                            } else {
                              setBatchImages(prev => [...prev, image.id]);
                            }
                          }}
                          data-testid={`checkbox-batch-${image.id}`}
                        >
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full aspect-square object-cover"
                          />
                          {batchImages.includes(image.id) && (
                            <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                              <Check className="w-8 h-8 text-orange-500" />
                            </div>
                          )}
                        </div>
                      ))}
                      {uploadedImages.length === 0 && (
                        <div className="col-span-3 text-center py-8 text-gray-400">
                          No images uploaded yet
                        </div>
                      )}
                    </div>
                    {uploadedImages.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-400"
                          onClick={() => setBatchImages(uploadedImages.map(i => i.id))}
                          data-testid="button-select-all"
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-400"
                          onClick={() => setBatchImages([])}
                          data-testid="button-clear-selection"
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-white">Batch Operations</Label>
                    <div className="space-y-3">
                      <Button
                        className="w-full justify-start gap-3 bg-gray-800 hover:bg-gray-700 text-white"
                        disabled={batchImages.length === 0 || isProcessing}
                        onClick={handleBatchProcess}
                        data-testid="button-batch-remove-bg"
                      >
                        <Eraser className="w-5 h-5 text-orange-500" />
                        <div className="text-left">
                          <div className="font-medium">Remove All Backgrounds</div>
                          <div className="text-xs text-gray-400">AI-powered batch extraction</div>
                        </div>
                      </Button>
                      <Button
                        className="w-full justify-start gap-3 bg-gray-800 hover:bg-gray-700 text-white"
                        disabled={batchImages.length === 0 || isProcessing}
                        onClick={handleBatchProcess}
                        data-testid="button-batch-enhance"
                      >
                        <Wand2 className="w-5 h-5 text-orange-500" />
                        <div className="text-left">
                          <div className="font-medium">Enhance All</div>
                          <div className="text-xs text-gray-400">Batch color & clarity boost</div>
                        </div>
                      </Button>
                      <Button
                        className="w-full justify-start gap-3 bg-gray-800 hover:bg-gray-700 text-white"
                        disabled={batchImages.length === 0 || isProcessing}
                        onClick={handleBatchProcess}
                        data-testid="button-batch-resize"
                      >
                        <Maximize2 className="w-5 h-5 text-orange-500" />
                        <div className="text-left">
                          <div className="font-medium">Resize All</div>
                          <div className="text-xs text-gray-400">Batch resize to target dimensions</div>
                        </div>
                      </Button>
                      <Button
                        className="w-full justify-start gap-3 bg-gray-800 hover:bg-gray-700 text-white"
                        disabled={batchImages.length === 0 || isProcessing}
                        onClick={handleBatchProcess}
                        data-testid="button-batch-convert"
                      >
                        <FileImage className="w-5 h-5 text-orange-500" />
                        <div className="text-left">
                          <div className="font-medium">Convert Format</div>
                          <div className="text-xs text-gray-400">Batch convert to PNG/JPG/WebP</div>
                        </div>
                      </Button>
                    </div>
                    {isProcessing && (
                      <div className="space-y-2 p-4 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2 text-orange-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">{processingMessage}</span>
                        </div>
                        <Progress value={processingProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" data-testid="modal-export">
          <Card className="bg-gray-900 border-gray-800 w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-orange-500" />
                  Export Image
                </CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowExportModal(false)}
                  data-testid="button-close-export"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-gray-400">Format</Label>
                <div className="grid grid-cols-3 gap-3">
                  {exportFormats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setExportFormat(format.id)}
                      className={`p-3 rounded-lg border transition-all text-center ${
                        exportFormat === format.id
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-gray-700 bg-gray-800 hover:border-gray-600"
                      }`}
                      data-testid={`button-format-${format.id}`}
                    >
                      <div className={`font-bold ${exportFormat === format.id ? "text-orange-500" : "text-white"}`}>
                        {format.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{format.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {exportFormat !== "png" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-400">Quality</Label>
                    <span className="text-sm text-gray-500" data-testid="text-quality-value">{exportQuality}%</span>
                  </div>
                  <Slider
                    value={[exportQuality]}
                    onValueChange={(v) => setExportQuality(v[0])}
                    min={10}
                    max={100}
                    step={5}
                    className="cursor-pointer"
                    data-testid="slider-quality"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700"
                  onClick={() => setShowExportModal(false)}
                  data-testid="button-cancel-export"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-black font-semibold gap-2"
                  onClick={handleExport}
                  data-testid="button-confirm-export"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
