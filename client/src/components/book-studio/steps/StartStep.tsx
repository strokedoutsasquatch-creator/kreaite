import { useState, useRef, useEffect, useCallback } from "react";
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
  FileUp,
  MessageCircle,
  Send,
  Bot,
  User,
  Lightbulb,
  Plus,
  Trash2,
  Wand2,
  ChevronRight,
  Loader2,
  Sparkles,
  BookOpen,
  Target,
  Users,
  Palette,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ideaTypes = [
  { value: 'theme', label: 'Theme', icon: Palette },
  { value: 'character', label: 'Character', icon: Users },
  { value: 'plot', label: 'Plot Point', icon: Target },
  { value: 'goal', label: 'Goal', icon: Lightbulb },
  { value: 'note', label: 'Note', icon: BookOpen },
] as const;

const genreOptions = [
  { value: "memoir", label: "Memoir" },
  { value: "self-help", label: "Self-Help" },
  { value: "fiction", label: "Fiction" },
  { value: "business", label: "Business/How-To" },
  { value: "health", label: "Health & Wellness" },
  { value: "recovery", label: "Recovery Journey" },
  { value: "childrens", label: "Children's Book" },
  { value: "devotional", label: "Devotional/Spiritual" },
];

export default function StartStep() {
  const { toast } = useToast();
  const {
    brainstormIdeas,
    addBrainstormIdea,
    removeBrainstormIdea,
    bookOutline,
    setBookOutline,
    setCurrentStep,
    generateFullBook,
    generationProgress,
    documentImports,
    importDocument,
    analyzeContent,
    isAnalyzingContent,
    contentAnalysis,
    recommendations,
    applyFixes,
    isApplyingFixes,
  } = useBookStudio();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'brainstorm' | 'upload'>('brainstorm');
  const [newIdeaContent, setNewIdeaContent] = useState("");
  const [newIdeaType, setNewIdeaType] = useState<typeof ideaTypes[number]['value']>('theme');
  const [bookDescription, setBookDescription] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("memoir");
  const [bookTitle, setBookTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const isInitializedRef = useRef(false);

  // Initialize local state from context's bookOutline if it exists (only once)
  useEffect(() => {
    if (bookOutline && !isInitializedRef.current) {
      isInitializedRef.current = true;
      setBookTitle(bookOutline.title || "");
      setSelectedGenre(bookOutline.genre || "memoir");
      setBookDescription(bookOutline.hook || "");
    }
  }, [bookOutline]);

  // Auto-sync local state to context with debouncing when user makes changes
  useEffect(() => {
    // Skip initial render and wait for user to start typing
    if (!isInitializedRef.current && !bookTitle && !bookDescription && selectedGenre === 'memoir') {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (bookOutline) {
        // Only update if values actually changed
        if (bookTitle !== bookOutline.title || selectedGenre !== bookOutline.genre || bookDescription !== bookOutline.hook) {
          setBookOutline({
            ...bookOutline,
            title: bookTitle || bookOutline.title,
            genre: selectedGenre || bookOutline.genre,
            hook: bookDescription || bookOutline.hook,
          });
        }
      } else if (bookTitle || bookDescription || selectedGenre !== 'memoir') {
        // Create a draft outline to persist user's metadata
        setBookOutline({
          title: bookTitle || 'Untitled Book',
          genre: selectedGenre,
          hook: bookDescription,
          targetWordCount: 50000,
          chapters: [],
        });
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [bookTitle, selectedGenre, bookDescription, bookOutline, setBookOutline]);

  // Sync local state to context before navigation (immediate sync)
  const syncStateToContext = useCallback(() => {
    if (bookOutline) {
      setBookOutline({
        ...bookOutline,
        title: bookTitle || bookOutline.title,
        genre: selectedGenre || bookOutline.genre,
        hook: bookDescription || bookOutline.hook,
      });
    } else if (bookTitle || bookDescription || selectedGenre !== 'memoir') {
      setBookOutline({
        title: bookTitle || 'Untitled Book',
        genre: selectedGenre,
        hook: bookDescription,
        targetWordCount: 50000,
        chapters: [],
      });
    }
  }, [bookOutline, bookTitle, selectedGenre, bookDescription, setBookOutline]);

  const handleAddIdea = () => {
    if (!newIdeaContent.trim()) return;
    addBrainstormIdea({
      content: newIdeaContent.trim(),
      type: newIdeaType,
    });
    setNewIdeaContent("");
    toast({ title: "Idea Added", description: "Your idea has been saved" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const needsServerParsing = file.name.endsWith('.docx') || 
                                  file.name.endsWith('.pdf') || 
                                  file.name.endsWith('.doc');
      
      if (needsServerParsing) {
        // Send binary files to server for proper parsing
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          
          try {
            toast({ title: "Parsing Document...", description: "Extracting text from your file" });
            const response = await fetch('/api/documents/parse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                content: base64,
                filename: file.name,
                mimeType: file.type
              })
            });
            
            if (!response.ok) throw new Error('Failed to parse document');
            
            const { content, metadata } = await response.json();
            const wordCount = metadata?.wordCount || content.split(/\s+/).filter(Boolean).length;
            
            importDocument({
              fileName: file.name,
              fileType: file.type,
              content,
              wordCount,
            });
            toast({ 
              title: "Document Imported", 
              description: `${file.name} (${wordCount.toLocaleString()} words)` 
            });
            
            if (content.length >= 50) {
              toast({ title: "Analyzing Content...", description: "AI is reviewing your manuscript" });
              try {
                await analyzeContent(content, 'manuscript', selectedGenre);
              } catch {
                console.log("Content analysis failed, but document was imported successfully");
              }
            }
          } catch (err) {
            toast({ 
              title: "Parse Failed", 
              description: "Could not extract text from document. Try a different format.", 
              variant: "destructive" 
            });
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Plain text files can be read directly
        const reader = new FileReader();
        reader.onload = async (event) => {
          const content = event.target?.result as string;
          const wordCount = content.split(/\s+/).filter(Boolean).length;
          importDocument({
            fileName: file.name,
            fileType: file.type,
            content,
            wordCount,
          });
          toast({ 
            title: "Document Imported", 
            description: `${file.name} (${wordCount.toLocaleString()} words)` 
          });
          
          if (content.length >= 50) {
            toast({ title: "Analyzing Content...", description: "AI is reviewing your manuscript" });
            try {
              await analyzeContent(content, 'manuscript', selectedGenre);
            } catch {
              console.log("Content analysis failed, but document was imported successfully");
            }
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const handleGenerateOutline = async () => {
    if (!bookDescription.trim() && brainstormIdeas.length === 0) {
      toast({ 
        title: "Need More Information", 
        description: "Add some brainstorm ideas or describe your book", 
        variant: "destructive" 
      });
      return;
    }

    // Sync state to context immediately before generation
    syncStateToContext();

    setIsGenerating(true);
    try {
      // Pass title along with genre and description
      await generateFullBook(
        selectedGenre, 
        bookDescription || "Generate based on brainstorm ideas",
        undefined, // chapterCount
        bookTitle || undefined // title
      );
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

  const groupedIdeas = brainstormIdeas.reduce((acc, idea) => {
    if (!acc[idea.type]) acc[idea.type] = [];
    acc[idea.type].push(idea);
    return acc;
  }, {} as Record<string, typeof brainstormIdeas>);

  return (
    <div className="space-y-6">
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Lightbulb className="w-5 h-5 text-primary" />
            Step 1: Start Your Book
          </CardTitle>
          <CardDescription>
            Brainstorm ideas, upload existing content, or describe your book concept
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-6 bg-card/80">
              <TabsTrigger value="brainstorm" data-testid="tab-brainstorm">
                <Lightbulb className="w-4 h-4 mr-2" /> Brainstorm
              </TabsTrigger>
              <TabsTrigger value="upload" data-testid="tab-upload">
                <FileUp className="w-4 h-4 mr-2" /> Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="brainstorm" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Book Title (optional)</Label>
                    <Input
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="Enter your book title..."
                      className="bg-card/80 border text-foreground"
                      data-testid="input-book-title"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Genre</Label>
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger className="bg-card/80 border text-foreground" data-testid="select-genre">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {genreOptions.map((genre) => (
                          <SelectItem key={genre.value} value={genre.value}>
                            {genre.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-foreground">Book Description</Label>
                    <Textarea
                      value={bookDescription}
                      onChange={(e) => setBookDescription(e.target.value)}
                      placeholder="Describe what your book is about, who it's for, and what readers will learn..."
                      className="min-h-[120px] bg-card/80 border text-foreground"
                      data-testid="textarea-book-description"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-foreground">Add Brainstorm Ideas</Label>
                    <div className="flex gap-2">
                      <Select value={newIdeaType} onValueChange={(v) => setNewIdeaType(v as typeof newIdeaType)}>
                        <SelectTrigger className="w-[140px] bg-card/80 border text-foreground" data-testid="select-idea-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ideaTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={newIdeaContent}
                        onChange={(e) => setNewIdeaContent(e.target.value)}
                        placeholder="Enter your idea..."
                        className="flex-1 bg-card/80 border text-foreground"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddIdea()}
                        data-testid="input-new-idea"
                      />
                      <Button 
                        onClick={handleAddIdea} 
                        size="icon"
                        className="bg-primary hover:bg-primary/80"
                        data-testid="button-add-idea"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-foreground mb-3 block">Your Ideas ({brainstormIdeas.length})</Label>
                  <ScrollArea className="h-[350px] rounded-lg border border bg-card/80 p-3">
                    {brainstormIdeas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Lightbulb className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">No ideas yet</p>
                        <p className="text-xs">Add themes, characters, or plot points</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(groupedIdeas).map(([type, ideas]) => (
                          <div key={type}>
                            <h4 className="text-xs font-semibold text-primary uppercase mb-2">
                              {ideaTypes.find(t => t.value === type)?.label || type}
                            </h4>
                            <div className="space-y-2">
                              {ideas.map((idea) => (
                                <div
                                  key={idea.id}
                                  className="flex items-start gap-2 p-2 rounded bg-card border border-primary/10 group"
                                  data-testid={`idea-${idea.id}`}
                                >
                                  <p className="flex-1 text-sm text-foreground">{idea.content}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                                    onClick={() => removeBrainstormIdea(idea.id)}
                                    data-testid={`button-remove-idea-${idea.id}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border">
                <Button
                  onClick={handleGenerateOutline}
                  disabled={isGenerating || generationProgress.isGenerating}
                  className="bg-primary hover:bg-primary/80"
                  data-testid="button-generate-outline"
                >
                  {isGenerating || generationProgress.isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Generate Book Outline
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <div
                className="border-2 border-dashed border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-card/80"
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
                <FileUp className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Upload Your Manuscript
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: .txt, .md, .doc, .docx, .pdf
                </p>
              </div>

              {documentImports.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-foreground">Imported Documents</Label>
                  <div className="space-y-2">
                    {documentImports.map((doc) => (
                      <Card key={doc.id} className="bg-card/80 border">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.wordCount?.toLocaleString()} words
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-primary/20 text-primary">
                            {doc.fileType.split('/')[1] || 'document'}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {isAnalyzingContent && (
                <Card className="bg-primary/5 border animate-pulse">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-foreground">AI is analyzing your manuscript...</span>
                  </CardContent>
                </Card>
              )}

              {contentAnalysis && !isAnalyzingContent && (
                <Card className="bg-primary/5 border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Manuscript Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contentAnalysis.summary && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Summary</Label>
                        <p className="text-sm text-foreground">{contentAnalysis.summary}</p>
                      </div>
                    )}
                    
                    {contentAnalysis.themes && contentAnalysis.themes.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Key Themes</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {contentAnalysis.themes.map((theme, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-primary/20 text-primary">
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {contentAnalysis.strengths && contentAnalysis.strengths.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Strengths</Label>
                        <ul className="text-sm text-foreground space-y-1 mt-1">
                          {contentAnalysis.strengths.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-500">+</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {contentAnalysis.areasForImprovement && contentAnalysis.areasForImprovement.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Areas to Improve</Label>
                        <ul className="text-sm text-foreground space-y-1 mt-1">
                          {contentAnalysis.areasForImprovement.map((a, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-yellow-500">!</span> {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {contentAnalysis.targetAudience && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">Target Audience:</span>
                        <span className="text-foreground">{contentAnalysis.targetAudience}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {recommendations && (recommendations.immediate?.length || recommendations.nextSteps?.length) && (
                <Card className="bg-card border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                      <Wand2 className="w-4 h-4 text-primary" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 text-muted-foreground mb-4">
                      {(recommendations.immediate || recommendations.nextSteps || []).slice(0, 3).map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={async () => {
                        try {
                          await applyFixes(undefined, true);
                        } catch (error: any) {
                          toast({ title: "Apply Failed", description: error?.message || "Please try again", variant: "destructive" });
                        }
                      }}
                      disabled={isApplyingFixes || !documentImports.some(doc => doc.content?.trim())}
                      data-testid="button-apply-fixes-start"
                    >
                      {isApplyingFixes ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Apply Improvements
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end pt-4 border-t border">
                <Button
                  onClick={() => {
                    syncStateToContext();
                    setCurrentStep('plan');
                  }}
                  disabled={documentImports.length === 0}
                  className="bg-primary hover:bg-primary/80"
                  data-testid="button-continue-to-plan"
                >
                  Continue to Outline
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
