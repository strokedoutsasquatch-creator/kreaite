import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wand2,
  Loader2,
  Plus,
  Scissors,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Lightbulb,
  FileText,
  Info,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

interface ImageEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageName: string;
  onInsert: (html: string) => void;
}

export default function ImageEditorModal({
  open,
  onOpenChange,
  imageUrl,
  imageName,
  onInsert,
}: ImageEditorModalProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [currentUrl, setCurrentUrl] = useState(imageUrl);
  const [hasBackground, setHasBackground] = useState(true);
  
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [imageSize, setImageSize] = useState<"small" | "medium" | "large" | "full">("medium");
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("center");
  const [zoom, setZoom] = useState([100]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      let imageBase64 = undefined;
      if (currentUrl.startsWith('blob:')) {
        const response = await fetch(currentUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const res = await apiRequest('POST', '/api/ai/analyze-image', {
        imageUrl: currentUrl.startsWith('blob:') ? undefined : currentUrl,
        imageBase64,
        bookContext: "Professional book publication",
        chapterTitles: ["Introduction", "Chapter 1", "Chapter 2", "Chapter 3", "Conclusion"],
      });
      const data = await res.json();

      if (data.analysis) {
        setAnalysis(data.analysis);
        setCaption(data.analysis.caption);
        setAltText(data.analysis.altText);
        toast({ title: "Analysis Complete", description: "AI recommendations ready" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to analyze image", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveBackground = async () => {
    setIsRemovingBg(true);
    try {
      const res = await apiRequest('POST', '/api/image/remove-background', { imageUrl: currentUrl });
      const response = await res.json();

      if (response.resultUrl) {
        setCurrentUrl(response.resultUrl);
        setHasBackground(false);
        toast({ title: "Background Removed", description: "Image updated" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove background", variant: "destructive" });
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleInsert = () => {
    const sizeStyles = {
      small: "max-width: 200px;",
      medium: "max-width: 400px;",
      large: "max-width: 600px;",
      full: "max-width: 100%;",
    };

    const alignStyles = {
      left: "margin-right: auto;",
      center: "margin-left: auto; margin-right: auto;",
      right: "margin-left: auto;",
    };

    const html = caption
      ? `<figure style="margin: 1.5rem 0; ${alignStyles[alignment]}">
          <img src="${currentUrl}" alt="${altText || imageName}" style="${sizeStyles[imageSize]} height: auto; display: block; ${alignStyles[alignment]}" />
          <figcaption style="text-align: ${alignment}; font-size: 0.875rem; color: #666; margin-top: 0.5rem; font-style: italic;">${caption}</figcaption>
        </figure>`
      : `<img src="${currentUrl}" alt="${altText || imageName}" style="${sizeStyles[imageSize]} height: auto; display: block; margin: 1.5rem 0; ${alignStyles[alignment]}" />`;

    onInsert(html);
    onOpenChange(false);
    toast({ title: "Image Inserted", description: "Image added to your document" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Image</span>
            <div className="flex gap-2">
              {analysis && (
                <Badge variant="default" className="bg-green-600">
                  Print Ready: {analysis.printReadiness.score}/10
                </Badge>
              )}
              {!hasBackground && (
                <Badge variant="secondary">Background Removed</Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="space-y-4">
            <div className="bg-zinc-100 rounded-lg p-4 flex items-center justify-center min-h-[300px]">
              <img
                src={currentUrl}
                alt={imageName}
                className="max-w-full max-h-[400px] object-contain rounded"
                style={{ transform: `scale(${zoom[0] / 100})` }}
              />
            </div>

            {/* Zoom Control */}
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-zinc-500" />
              <Slider
                value={zoom}
                onValueChange={setZoom}
                min={50}
                max={150}
                step={10}
                className="flex-1"
              />
              <ZoomIn className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-600 w-12">{zoom[0]}%</span>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1"
                data-testid="button-modal-analyze"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                Analyze with AI
              </Button>
              {hasBackground && (
                <Button
                  variant="outline"
                  onClick={handleRemoveBackground}
                  disabled={isRemovingBg}
                  data-testid="button-modal-remove-bg"
                >
                  {isRemovingBg ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Scissors className="w-4 h-4 mr-2" />
                  )}
                  Remove BG
                </Button>
              )}
            </div>
          </div>

          {/* Settings & Analysis */}
          <div className="space-y-4">
            {/* AI Analysis Results */}
            {analysis && (
              <div className="space-y-3">
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                  <p className="text-sm font-medium text-primary flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4" />
                    Placement Recommendation
                  </p>
                  <p className="text-sm text-primary/80">{analysis.placement.recommendation}</p>
                  <p className="text-xs text-primary mt-1">
                    Suggested: {analysis.placement.suggestedChapter} ({analysis.placement.position})
                  </p>
                </div>

                {analysis.printReadiness.suggestions.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800 flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Suggestions
                    </p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {analysis.printReadiness.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Image Settings */}
            <div className="space-y-4 bg-zinc-50 rounded-lg p-4">
              <h3 className="font-medium text-sm">Image Settings</h3>

              <div className="space-y-2">
                <Label className="text-xs">Size</Label>
                <Select value={imageSize} onValueChange={(v: any) => setImageSize(v)}>
                  <SelectTrigger data-testid="select-image-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (200px)</SelectItem>
                    <SelectItem value="medium">Medium (400px)</SelectItem>
                    <SelectItem value="large">Large (600px)</SelectItem>
                    <SelectItem value="full">Full Width</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Alignment</Label>
                <Select value={alignment} onValueChange={(v: any) => setAlignment(v)}>
                  <SelectTrigger data-testid="select-image-alignment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Alt Text (Accessibility)</Label>
                <Input
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image for screen readers..."
                  data-testid="input-alt-text"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Caption (Optional)</Label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption to display below the image..."
                  className="min-h-[60px]"
                  data-testid="input-caption"
                />
              </div>
            </div>

            {/* Insert Button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleInsert}
                className="flex-1"
                data-testid="button-insert-from-modal"
              >
                <Plus className="w-4 h-4 mr-2" />
                Insert to Document
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
