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
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ToolPanelProps {
  projectId?: number;
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

export default function ToolPanel({ projectId }: ToolPanelProps) {
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
            <TabsTrigger value="images" className="gap-1 data-[state=active]:bg-sidebar-accent">
              <Image className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="format" className="gap-1 data-[state=active]:bg-sidebar-accent">
              <Settings className="w-4 h-4" />
              Format
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
      </Tabs>
    </div>
  );
}
