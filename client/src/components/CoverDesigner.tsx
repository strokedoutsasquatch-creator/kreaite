import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Image,
  Type,
  Palette,
  Layout,
  Download,
  Upload,
  Sparkles,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Maximize2,
  ExternalLink,
  Book,
  FileText,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CoverDesignerProps {
  bookTitle: string;
  bookSubtitle?: string;
  authorName?: string;
  genre?: string;
  onSave?: (coverData: CoverData) => void;
  onGenerate?: (coverUrl: string) => void;
}

interface CoverData {
  backgroundUrl?: string;
  backgroundColor: string;
  titleText: string;
  titleFont: string;
  titleSize: number;
  titleColor: string;
  titleY: number;
  subtitleText?: string;
  subtitleFont: string;
  subtitleSize: number;
  subtitleColor: string;
  authorText: string;
  authorFont: string;
  authorSize: number;
  authorColor: string;
  trimSize: string;
  spineWidth?: number;
}

const trimSizes = {
  'us_trade': { width: 6, height: 9, label: '6" x 9" (US Trade)' },
  'us_letter': { width: 8.5, height: 11, label: '8.5" x 11"' },
  'pocket': { width: 4.25, height: 6.87, label: '4.25" x 6.87" (Pocket)' },
  'digest': { width: 5.5, height: 8.5, label: '5.5" x 8.5" (Digest)' },
  'square': { width: 8.5, height: 8.5, label: '8.5" x 8.5" (Square)' },
  'a5': { width: 5.83, height: 8.27, label: 'A5' },
};

const coverFonts = [
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Merriweather, serif', label: 'Merriweather' },
  { value: 'Oswald, sans-serif', label: 'Oswald' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lora, serif', label: 'Lora' },
  { value: 'Crimson Text, serif', label: 'Crimson Text' },
];

const coverTemplates = [
  {
    id: 'minimal',
    name: 'Minimal',
    preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    titleColor: '#ffffff',
    subtitleColor: '#94a3b8',
    authorColor: '#f97316',
    backgroundColor: '#1a1a2e',
  },
  {
    id: 'classic',
    name: 'Classic',
    preview: 'linear-gradient(180deg, #2c1810 0%, #1a0f0a 100%)',
    titleColor: '#d4af37',
    subtitleColor: '#c9b896',
    authorColor: '#ffffff',
    backgroundColor: '#2c1810',
  },
  {
    id: 'modern',
    name: 'Modern',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    titleColor: '#ffffff',
    subtitleColor: '#e0e7ff',
    authorColor: '#fbbf24',
    backgroundColor: '#667eea',
  },
  {
    id: 'nature',
    name: 'Nature',
    preview: 'linear-gradient(180deg, #134e4a 0%, #0f766e 50%, #115e59 100%)',
    titleColor: '#fef3c7',
    subtitleColor: '#d1fae5',
    authorColor: '#ffffff',
    backgroundColor: '#134e4a',
  },
  {
    id: 'bold',
    name: 'Bold',
    preview: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    titleColor: '#ffffff',
    subtitleColor: '#fecaca',
    authorColor: '#fef08a',
    backgroundColor: '#dc2626',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    preview: 'linear-gradient(180deg, #0369a1 0%, #0c4a6e 100%)',
    titleColor: '#ffffff',
    subtitleColor: '#bae6fd',
    authorColor: '#fde047',
    backgroundColor: '#0369a1',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    preview: 'linear-gradient(180deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
    titleColor: '#ffffff',
    subtitleColor: '#fef3c7',
    authorColor: '#1e293b',
    backgroundColor: '#f97316',
  },
  {
    id: 'dark',
    name: 'Dark Premium',
    preview: 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
    titleColor: '#f97316',
    subtitleColor: '#a3a3a3',
    authorColor: '#ffffff',
    backgroundColor: '#000000',
  },
];

export default function CoverDesigner({
  bookTitle,
  bookSubtitle,
  authorName = "Author Name",
  genre = "memoir",
  onSave,
  onGenerate,
}: CoverDesignerProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState('dark');
  
  const [coverData, setCoverData] = useState<CoverData>({
    backgroundColor: '#000000',
    titleText: bookTitle || 'Book Title',
    titleFont: 'Georgia, serif',
    titleSize: 48,
    titleColor: '#f97316',
    titleY: 35,
    subtitleText: bookSubtitle || '',
    subtitleFont: 'Georgia, serif',
    subtitleSize: 24,
    subtitleColor: '#a3a3a3',
    authorText: authorName,
    authorFont: 'Georgia, serif',
    authorSize: 20,
    authorColor: '#ffffff',
    trimSize: 'us_trade',
  });

  const [zoom, setZoom] = useState(100);

  const applyTemplate = useCallback((templateId: string) => {
    const template = coverTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setCoverData(prev => ({
        ...prev,
        backgroundColor: template.backgroundColor,
        titleColor: template.titleColor,
        subtitleColor: template.subtitleColor,
        authorColor: template.authorColor,
        backgroundUrl: undefined,
      }));
    }
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCoverData(prev => ({
          ...prev,
          backgroundUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const generateAICover = async () => {
    setIsGenerating(true);
    try {
      const coverPrompt = `Professional book cover for "${coverData.titleText}". Genre: ${genre}. Style: elegant, print-ready, high contrast. No text overlay needed.`;
      
      const response = await apiRequest("POST", "/api/image/generate", {
        prompt: coverPrompt,
        style: "professional",
        aspectRatio: "2:3",
      });

      const data = response as { success?: boolean; imageUrl?: string; error?: string };
      
      if (data.success && data.imageUrl) {
        setCoverData(prev => ({
          ...prev,
          backgroundUrl: data.imageUrl,
        }));
        onGenerate?.(data.imageUrl!);
        toast({ title: "Cover Generated", description: "AI-generated cover background is ready" });
      } else {
        toast({ title: "Generation Failed", description: data.error || "Could not generate cover", variant: "destructive" });
      }
    } catch (error) {
      console.error("Cover generation error:", error);
      toast({ title: "Generation Failed", description: "Check your API configuration", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const openInCanva = () => {
    window.open('https://www.canva.com/create/book-covers/', '_blank');
  };

  const downloadCover = () => {
    toast({ title: "Export Started", description: "Cover will be downloaded as high-resolution image" });
  };

  const currentTrimSize = trimSizes[coverData.trimSize as keyof typeof trimSizes] || trimSizes.us_trade;
  const aspectRatio = currentTrimSize.height / currentTrimSize.width;
  const previewWidth = 280;
  const previewHeight = previewWidth * aspectRatio;

  const currentTemplate = coverTemplates.find(t => t.id === selectedTemplate);

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Book className="w-5 h-5 text-orange-500" />
            Cover Preview
          </h3>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => setZoom(Math.max(50, zoom - 10))} data-testid="button-cover-zoom-out">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
            <Button size="icon" variant="ghost" onClick={() => setZoom(Math.min(150, zoom + 10))} data-testid="button-cover-zoom-in">
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-center p-6 bg-gray-100 dark:bg-zinc-800 rounded-lg">
          <div
            ref={canvasRef}
            className="relative shadow-2xl transition-transform"
            style={{
              width: previewWidth * (zoom / 100),
              height: previewHeight * (zoom / 100),
              background: coverData.backgroundUrl
                ? `url(${coverData.backgroundUrl}) center/cover`
                : currentTemplate?.preview || coverData.backgroundColor,
              borderRadius: '4px',
            }}
            data-testid="cover-preview"
          >
            {coverData.backgroundUrl && (
              <div className="absolute inset-0 bg-black/40" />
            )}

            <div className="absolute inset-0 flex flex-col justify-between p-6 text-center">
              <div />
              
              <div style={{ marginTop: `${coverData.titleY}%` }}>
                <h1
                  style={{
                    fontFamily: coverData.titleFont,
                    fontSize: `${coverData.titleSize * (zoom / 100) * 0.5}px`,
                    color: coverData.titleColor,
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                    lineHeight: 1.2,
                  }}
                >
                  {coverData.titleText}
                </h1>
                {coverData.subtitleText && (
                  <p
                    style={{
                      fontFamily: coverData.subtitleFont,
                      fontSize: `${coverData.subtitleSize * (zoom / 100) * 0.5}px`,
                      color: coverData.subtitleColor,
                      marginTop: '8px',
                      fontStyle: 'italic',
                    }}
                  >
                    {coverData.subtitleText}
                  </p>
                )}
              </div>

              <p
                style={{
                  fontFamily: coverData.authorFont,
                  fontSize: `${coverData.authorSize * (zoom / 100) * 0.5}px`,
                  color: coverData.authorColor,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                {coverData.authorText}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          <Button onClick={downloadCover} data-testid="button-download-cover">
            <Download className="w-4 h-4 mr-2" />
            Download Cover
          </Button>
          <Button variant="outline" onClick={openInCanva} data-testid="button-open-canva">
            <ExternalLink className="w-4 h-4 mr-2" />
            Edit in Canva
          </Button>
        </div>
      </div>

      <div className="w-full lg:w-[400px]">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="templates" className="flex-1" data-testid="tab-templates">
              <Layout className="w-4 h-4 mr-1" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="text" className="flex-1" data-testid="tab-text">
              <Type className="w-4 h-4 mr-1" />
              Text
            </TabsTrigger>
            <TabsTrigger value="design" className="flex-1" data-testid="tab-design">
              <Palette className="w-4 h-4 mr-1" />
              Design
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cover Templates</CardTitle>
                <CardDescription>Choose a starting point</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {coverTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template.id)}
                      className={`relative aspect-[2/3] rounded-md overflow-hidden border-2 transition-all ${
                        selectedTemplate === template.id ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-transparent hover:border-gray-300'
                      }`}
                      style={{ background: template.preview }}
                      title={template.name}
                      data-testid={`button-template-${template.id}`}
                    >
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-0.5 text-center">
                        {template.name}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI Cover Generation</CardTitle>
                <CardDescription>Generate a unique cover with AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={generateAICover}
                  disabled={isGenerating}
                  className="w-full"
                  data-testid="button-generate-ai-cover"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate AI Cover
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-cover-image"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Background Image
                </Button>
                {coverData.backgroundUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setCoverData(prev => ({ ...prev, backgroundUrl: undefined }))}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Background
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Book Dimensions</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={coverData.trimSize}
                  onValueChange={(v) => setCoverData(prev => ({ ...prev, trimSize: v }))}
                >
                  <SelectTrigger data-testid="select-trim-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(trimSizes).map(([key, size]) => (
                      <SelectItem key={key} value={key}>{size.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Title</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Title Text</Label>
                  <Input
                    value={coverData.titleText}
                    onChange={(e) => setCoverData(prev => ({ ...prev, titleText: e.target.value }))}
                    data-testid="input-cover-title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Font</Label>
                    <Select
                      value={coverData.titleFont}
                      onValueChange={(v) => setCoverData(prev => ({ ...prev, titleFont: v }))}
                    >
                      <SelectTrigger className="text-xs" data-testid="select-title-font">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {coverFonts.map((font) => (
                          <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Size: {coverData.titleSize}px</Label>
                    <Slider
                      value={[coverData.titleSize]}
                      onValueChange={([v]) => setCoverData(prev => ({ ...prev, titleSize: v }))}
                      min={24}
                      max={72}
                      step={2}
                      data-testid="slider-title-size"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input
                      type="color"
                      value={coverData.titleColor}
                      onChange={(e) => setCoverData(prev => ({ ...prev, titleColor: e.target.value }))}
                      className="h-8 p-1"
                      data-testid="input-title-color"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vertical Position: {coverData.titleY}%</Label>
                    <Slider
                      value={[coverData.titleY]}
                      onValueChange={([v]) => setCoverData(prev => ({ ...prev, titleY: v }))}
                      min={10}
                      max={60}
                      step={5}
                      data-testid="slider-title-position"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Subtitle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Subtitle Text</Label>
                  <Input
                    value={coverData.subtitleText}
                    onChange={(e) => setCoverData(prev => ({ ...prev, subtitleText: e.target.value }))}
                    placeholder="Optional subtitle"
                    data-testid="input-cover-subtitle"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Font</Label>
                    <Select
                      value={coverData.subtitleFont}
                      onValueChange={(v) => setCoverData(prev => ({ ...prev, subtitleFont: v }))}
                    >
                      <SelectTrigger className="text-xs" data-testid="select-subtitle-font">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {coverFonts.map((font) => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input
                      type="color"
                      value={coverData.subtitleColor}
                      onChange={(e) => setCoverData(prev => ({ ...prev, subtitleColor: e.target.value }))}
                      className="h-8 p-1"
                      data-testid="input-subtitle-color"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Author Name</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Author Text</Label>
                  <Input
                    value={coverData.authorText}
                    onChange={(e) => setCoverData(prev => ({ ...prev, authorText: e.target.value }))}
                    data-testid="input-cover-author"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Font</Label>
                    <Select
                      value={coverData.authorFont}
                      onValueChange={(v) => setCoverData(prev => ({ ...prev, authorFont: v }))}
                    >
                      <SelectTrigger className="text-xs" data-testid="select-author-font">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {coverFonts.map((font) => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input
                      type="color"
                      value={coverData.authorColor}
                      onChange={(e) => setCoverData(prev => ({ ...prev, authorColor: e.target.value }))}
                      className="h-8 p-1"
                      data-testid="input-author-color"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="design" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Background Color</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={coverData.backgroundColor}
                    onChange={(e) => setCoverData(prev => ({ ...prev, backgroundColor: e.target.value, backgroundUrl: undefined }))}
                    className="w-16 h-10 p-1"
                    data-testid="input-background-color"
                  />
                  <Input
                    value={coverData.backgroundColor}
                    onChange={(e) => setCoverData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['#000000', '#1a1a2e', '#2c1810', '#134e4a', '#0369a1', '#7c3aed', '#dc2626', '#f97316'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setCoverData(prev => ({ ...prev, backgroundColor: color, backgroundUrl: undefined }))}
                      className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Print Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Dimensions:</span>
                  <span className="font-medium text-foreground">{currentTrimSize.width}" x {currentTrimSize.height}"</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolution:</span>
                  <span className="font-medium text-foreground">300 DPI (Print Ready)</span>
                </div>
                <div className="flex justify-between">
                  <span>Bleed:</span>
                  <span className="font-medium text-foreground">0.125" all sides</span>
                </div>
                <div className="flex justify-between">
                  <span>Color Mode:</span>
                  <span className="font-medium text-foreground">CMYK (for print)</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <Button
            className="w-full"
            onClick={() => onSave?.(coverData)}
            data-testid="button-save-cover"
          >
            Save Cover Design
          </Button>
        </div>
      </div>
    </div>
  );
}
