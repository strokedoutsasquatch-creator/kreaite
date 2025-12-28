import { useState, useRef } from "react";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ImagePlus,
  Wand2,
  Layers,
  Edit3,
  BookOpen,
  Upload,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Image,
  Download,
  Scissors,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BuildStep() {
  const { toast } = useToast();
  const {
    bookOutline,
    images,
    addImage,
    removeImage,
    analyzeImage,
    imagePlacements,
    setCurrentStep,
    manuscriptHtml,
    setManuscriptHtml,
  } = useBookStudio();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [imagePrompt, setImagePrompt] = useState("");
  const [illustrationStyle, setIllustrationStyle] = useState("realistic");
  const [imagePurpose, setImagePurpose] = useState("illustration");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const selectedImage = images.find(img => img.id === selectedImageId);

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      addImage({
        url: '/placeholder-image.jpg',
        prompt: imagePrompt,
        origin: 'generated',
        hasBackground: true,
      });
      toast({ title: "Image Generation Started", description: "This may take a moment..." });
      setImagePrompt("");
    } catch (error) {
      toast({ 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        addImage({
          url,
          origin: 'uploaded',
          hasBackground: true,
        });
        toast({ title: "Image Uploaded", description: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          addImage({
            url,
            origin: 'uploaded',
            hasBackground: true,
          });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const quickPrompts = [
    "A peaceful sunrise over a hospital window, symbolizing hope",
    "Strong hands gripping therapy equipment, determination",
    "A winding path through mountains, representing recovery",
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ImagePlus className="w-5 h-5 text-primary" />
            Step 4: Images & Cover Design
          </CardTitle>
          <CardDescription>
            Generate illustrations, manage your image library, and create your book cover
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 bg-card/80 flex-wrap gap-1">
              <TabsTrigger value="generate" data-testid="tab-generate">
                <Wand2 className="w-4 h-4 mr-1" /> Generate
              </TabsTrigger>
              <TabsTrigger value="library" data-testid="tab-library">
                <Layers className="w-4 h-4 mr-1" /> Library ({images.length})
              </TabsTrigger>
              <TabsTrigger value="edit" data-testid="tab-edit">
                <Edit3 className="w-4 h-4 mr-1" /> Edit
              </TabsTrigger>
              <TabsTrigger value="cover" data-testid="tab-cover">
                <BookOpen className="w-4 h-4 mr-1" /> Cover
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-card/80 rounded-lg border border">
                <div>
                  <Label className="text-xs text-muted-foreground">Style</Label>
                  <Select value={illustrationStyle} onValueChange={setIllustrationStyle}>
                    <SelectTrigger className="h-8 bg-transparent border text-foreground" data-testid="select-style">
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
                  <Select value={imagePurpose} onValueChange={setImagePurpose}>
                    <SelectTrigger className="h-8 bg-transparent border text-foreground" data-testid="select-purpose">
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
                  <Label className="text-xs text-muted-foreground">For Chapter</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="h-8 bg-transparent border text-foreground" data-testid="select-chapter">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All/General</SelectItem>
                      {bookOutline?.chapters.map((ch, idx) => (
                        <SelectItem key={ch.id} value={ch.id}>
                          Ch {idx + 1}: {ch.title.substring(0, 20)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Image Description</Label>
                    <Textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the illustration you want to generate..."
                      className="min-h-[100px] bg-card/80 border text-foreground"
                      data-testid="textarea-image-prompt"
                    />
                  </div>
                  <Button
                    onClick={handleGenerateImage}
                    disabled={isGenerating || !imagePrompt.trim()}
                    className="w-full bg-primary hover:bg-primary/80"
                    data-testid="button-generate-image"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate Image
                  </Button>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Quick Prompts</Label>
                    {quickPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setImagePrompt(prompt)}
                        className="w-full p-2 text-left text-sm bg-card rounded border border-primary/10 hover:border transition-colors text-gray-300"
                        data-testid={`button-quick-prompt-${i}`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-foreground">Recent Generated Images</Label>
                  <ScrollArea className="h-[400px] rounded-lg border border p-2 bg-card/80">
                    <div className="grid grid-cols-2 gap-3">
                      {images.filter(img => img.origin === 'generated').length > 0 ? (
                        images.filter(img => img.origin === 'generated').slice(0, 6).map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.url}
                              alt="Generated"
                              className="w-full aspect-square object-cover rounded-lg border border"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={() => {
                                  setSelectedImageId(img.id);
                                  setActiveTab('edit');
                                }}
                                data-testid={`button-edit-gen-${img.id}`}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeImage(img.id)}
                                data-testid={`button-delete-gen-${img.id}`}
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </Button>
                            </div>
                            {img.isAnalyzing && (
                              <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 aspect-video bg-card rounded-lg flex flex-col items-center justify-center p-8">
                          <Image className="w-16 h-16 text-muted-foreground/50 mb-3" />
                          <p className="text-sm text-muted-foreground text-center">No images generated yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="library" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-foreground">Filter:</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32 h-8 bg-transparent border text-foreground" data-testid="select-filter-purpose">
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
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border text-primary hover:bg-primary/10"
                  data-testid="button-upload-image"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag & drop images here</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img) => (
                  <Card key={img.id} className="overflow-hidden group bg-card border" data-testid={`card-image-${img.id}`}>
                    <div className="relative aspect-square">
                      <img
                        src={img.url}
                        alt="Library image"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => {
                            setSelectedImageId(img.id);
                            setActiveTab('edit');
                          }}
                          data-testid={`button-edit-lib-${img.id}`}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeImage(img.id)}
                          data-testid={`button-delete-lib-${img.id}`}
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-2">
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs border text-primary">
                          {img.origin}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {images.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No images in your library</p>
                    <p className="text-sm">Generate or upload images to get started</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              {selectedImage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="aspect-square rounded-lg border border overflow-hidden bg-card">
                      <img
                        src={selectedImage.url}
                        alt="Selected"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => analyzeImage(selectedImage.id)}
                        disabled={selectedImage.isAnalyzing}
                        className="border text-primary hover:bg-primary/10"
                        data-testid="button-analyze-image"
                      >
                        {selectedImage.isAnalyzing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Scissors className="w-4 h-4 mr-2" />
                        )}
                        Analyze Image
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedImage.url;
                          link.download = 'image.png';
                          link.click();
                        }}
                        className="border text-primary hover:bg-primary/10"
                        data-testid="button-download-edit"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {selectedImage.analysis && (
                      <Card className="bg-card border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-foreground">Image Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-300 space-y-2">
                          <p><strong>Description:</strong> {selectedImage.analysis.description}</p>
                          <p><strong>Alt Text:</strong> {selectedImage.analysis.altText}</p>
                          {selectedImage.analysis.placement && (
                            <p><strong>Suggested Placement:</strong> {selectedImage.analysis.placement.recommendation}</p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    {selectedImage.prompt && (
                      <div>
                        <Label className="text-muted-foreground">Original Prompt</Label>
                        <p className="text-sm bg-card p-2 rounded mt-1 border border text-gray-300">
                          {selectedImage.prompt}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <Image className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg">Select an image to edit</p>
                  <p className="text-sm">Choose from your library or generate a new one</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cover" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="aspect-[2/3] bg-gradient-to-br from-primary/50 to-black rounded-lg border border flex flex-col items-center justify-center p-8">
                    <BookOpen className="w-24 h-24 text-primary/50 mb-4" />
                    <h2 className="text-2xl font-bold text-foreground text-center">
                      {bookOutline?.title || "Your Book Title"}
                    </h2>
                    {bookOutline?.subtitle && (
                      <p className="text-lg text-gray-400 text-center mt-2">
                        {bookOutline.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <Card className="bg-card border">
                    <CardHeader>
                      <CardTitle className="text-sm text-foreground">Cover Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        className="w-full bg-primary hover:bg-primary/80"
                        data-testid="button-generate-cover"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate AI Cover
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border text-primary hover:bg-primary/10"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-upload-cover"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Cover Image
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-6 pt-4 border-t border">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('generate')}
              className="border text-primary hover:bg-primary/10"
              data-testid="button-back-step-build"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button
              onClick={() => setCurrentStep('publish')}
              className="bg-primary hover:bg-primary/80"
              data-testid="button-next-step-build"
            >
              Next: Format & Publish
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
