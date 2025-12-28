import { useState } from "react";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Plus,
  ChevronRight,
  ChevronLeft,
  Wand2,
  Edit3,
  RefreshCw,
  Loader2,
  BookOpen,
  Image,
  ImagePlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function GenerateStep() {
  const { toast } = useToast();
  const {
    bookOutline,
    setBookOutline,
    setCurrentStep,
    generateChapter,
    generateAllChapters,
    generationProgress,
    manuscriptHtml,
    setManuscriptHtml,
    imagePrompts,
    recommendations,
    polishProgress,
    qualityPolish,
    editChapter,
  } = useBookStudio();

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    bookOutline?.chapters[0]?.id || null
  );
  const [editingPass, setEditingPass] = useState<'developmental' | 'line' | 'copy' | 'proofread'>('developmental');

  const chapters = bookOutline?.chapters || [];
  const selectedChapter = chapters.find(ch => ch.id === selectedChapterId);
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

  const handleGenerateChapter = async () => {
    if (!selectedChapterId) return;
    const chapterIndex = chapters.findIndex(ch => ch.id === selectedChapterId);
    if (chapterIndex === -1) return;

    try {
      await generateChapter(chapterIndex);
      toast({ title: "Chapter Generated", description: `Chapter ${chapterIndex + 1} is ready` });
    } catch (error) {
      toast({ 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleGenerateAll = async () => {
    try {
      await generateAllChapters();
    } catch (error) {
      toast({ 
        title: "Generation Failed", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  const updateChapterContent = (content: string) => {
    if (!bookOutline || !selectedChapterId) return;
    
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const updatedChapters = chapters.map(ch =>
      ch.id === selectedChapterId
        ? { ...ch, content, wordCount, status: 'draft' as const }
        : ch
    );
    
    setBookOutline({
      ...bookOutline,
      chapters: updatedChapters,
    });
  };

  const addChapter = () => {
    if (!bookOutline) return;
    
    const newChapter = {
      id: `chapter-${Date.now()}`,
      number: chapters.length + 1,
      title: `Chapter ${chapters.length + 1}`,
      description: "",
      targetWordCount: 3000,
      status: 'outline' as const,
    };
    
    setBookOutline({
      ...bookOutline,
      chapters: [...chapters, newChapter],
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="bg-card border h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between text-foreground">
              Chapters
              <Button
                size="sm"
                variant="ghost"
                onClick={addChapter}
                className="text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 pr-2">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapterId(chapter.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all
                      ${selectedChapterId === chapter.id 
                        ? 'bg-primary/20 border-primary border' 
                        : 'bg-card/80 hover:bg-card border border-transparent'
                      }`}
                    data-testid={`button-select-chapter-${chapter.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground font-medium">
                        Ch. {index + 1}
                      </span>
                      <Badge
                        variant={chapter.status === "complete" ? "default" : "secondary"}
                        className={`text-[10px] px-1.5 py-0 ${
                          chapter.status === "complete"
                            ? "bg-green-500/20 text-green-400"
                            : chapter.status === "generating"
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {chapter.status === "generating" && (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        )}
                        {chapter.status}
                      </Badge>
                    </div>
                    <div className="font-medium text-sm truncate text-foreground">
                      {chapter.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {(chapter.wordCount || 0).toLocaleString()} words
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 p-3 bg-card/80 rounded-lg border border">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Total chapters:</span>
                  <span className="font-medium text-foreground">{chapters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total words:</span>
                  <span className="font-medium text-foreground">{totalWords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. pages:</span>
                  <span className="font-medium text-foreground">~{Math.ceil(totalWords / 250)}</span>
                </div>
              </div>
            </div>

            {chapters.length > 0 && (
              <div className="space-y-2 mt-4">
                <Button
                  onClick={handleGenerateAll}
                  disabled={generationProgress.isGenerating || polishProgress.isPolishing}
                  className="w-full bg-primary hover:bg-primary/80"
                  data-testid="button-generate-all"
                >
                  {generationProgress.isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating {generationProgress.currentChapter}/{generationProgress.totalChapters}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate All Chapters
                    </>
                  )}
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      toast({ title: "Quality Polish", description: "Running multi-pass editing on all chapters..." });
                      await qualityPolish();
                    } catch (error) {
                      toast({ 
                        title: "Polish Failed", 
                        description: error instanceof Error ? error.message : "Please try again",
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={generationProgress.isGenerating || polishProgress.isPolishing || !chapters.some(ch => ch.content)}
                  variant="outline"
                  className="w-full border text-primary hover:bg-primary/10"
                  data-testid="button-polish-all"
                >
                  {polishProgress.isPolishing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {polishProgress.status || 'Polishing...'}
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Polish All Chapters
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Card className="bg-card border shadow-lg">
            {selectedChapter ? (
              <>
                <div className="px-6 pt-4 pb-2 border-b border">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <Input
                      value={selectedChapter.title}
                      onChange={(e) => {
                        if (!bookOutline) return;
                        const updatedChapters = chapters.map(ch =>
                          ch.id === selectedChapterId
                            ? { ...ch, title: e.target.value }
                            : ch
                        );
                        setBookOutline({ ...bookOutline, chapters: updatedChapters });
                      }}
                      className="text-xl font-bold border-0 px-0 focus-visible:ring-0 bg-transparent flex-1 text-foreground"
                      placeholder="Chapter Title"
                      data-testid="input-chapter-title-editor"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        onClick={handleGenerateChapter}
                        disabled={generationProgress.isGenerating}
                        size="sm"
                        variant="outline"
                        className="border text-primary hover:bg-primary/10"
                        data-testid="button-generate-chapter"
                      >
                        {selectedChapter.status === "generating" ? (
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Wand2 className="w-3 h-3 mr-1" />
                        )}
                        AI Write
                      </Button>
                      <Select value={editingPass} onValueChange={(v: any) => setEditingPass(v)}>
                        <SelectTrigger
                          className="w-[130px] h-8 text-xs bg-transparent border text-foreground"
                          data-testid="select-editing-pass"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="developmental">Developmental</SelectItem>
                          <SelectItem value="line">Line Edit</SelectItem>
                          <SelectItem value="copy">Copy Edit</SelectItem>
                          <SelectItem value="proofread">Proofread</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={async () => {
                          const chapterIndex = chapters.findIndex(ch => ch.id === selectedChapterId);
                          if (chapterIndex === -1) return;
                          try {
                            toast({ title: `Running ${editingPass} edit`, description: "Processing..." });
                            await editChapter(chapterIndex, editingPass);
                          } catch (error) {
                            toast({ 
                              title: "Edit Failed", 
                              description: error instanceof Error ? error.message : "Please try again",
                              variant: "destructive"
                            });
                          }
                        }}
                        disabled={!selectedChapter.content || polishProgress.isPolishing}
                        size="sm"
                        className="bg-primary hover:bg-primary/80"
                        data-testid="button-run-edit"
                      >
                        {polishProgress.isPolishing ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Edit3 className="w-3 h-3 mr-1" />
                        )}
                        {polishProgress.isPolishing ? polishProgress.currentPass : 'Edit'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <Textarea
                    value={selectedChapter.content || ""}
                    onChange={(e) => updateChapterContent(e.target.value)}
                    placeholder="Start writing your chapter here, or click 'AI Write' to generate content..."
                    className="min-h-[400px] bg-card/80 border text-gray-200 text-base leading-relaxed"
                    data-testid="textarea-chapter-content"
                  />
                  <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                    <span>
                      {(selectedChapter.wordCount || 0).toLocaleString()} words |
                      ~{Math.ceil((selectedChapter.wordCount || 0) / 250)} pages
                    </span>
                    <span>
                      Target: {selectedChapter.targetWordCount.toLocaleString()} words
                    </span>
                  </div>

                  {selectedChapter.content && selectedChapter.content.length > 100 && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-lg border">
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-foreground">
                        <ImagePlus className="w-4 h-4 text-primary" />
                        Suggested Images for This Chapter
                      </h4>
                      
                      {(() => {
                        const chapterIndex = chapters.findIndex(ch => ch.id === selectedChapterId);
                        const chapterPrompts = imagePrompts.filter(p => p.chapterNumber === chapterIndex + 1);
                        const chapterImagePrompt = selectedChapter.imagePrompt;
                        
                        if (chapterPrompts.length === 0 && !chapterImagePrompt) {
                          return (
                            <p className="text-sm text-muted-foreground">
                              No image suggestions yet. Generate images from the Build step.
                            </p>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            {chapterImagePrompt && (
                              <div className="p-3 bg-card rounded border">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-foreground mb-1">Chapter Illustration</p>
                                    <p className="text-xs text-muted-foreground">{chapterImagePrompt.substring(0, 120)}...</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-shrink-0 text-primary border-primary/30"
                                    onClick={() => {
                                      setCurrentStep('build');
                                      toast({ title: "Go to Build", description: "Generate this image in the Build step" });
                                    }}
                                    data-testid="button-goto-build"
                                  >
                                    <Image className="w-3 h-3 mr-1" />
                                    Generate
                                  </Button>
                                </div>
                              </div>
                            )}
                            {chapterPrompts.map((prompt) => (
                              <div key={prompt.id} className="p-3 bg-card rounded border">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-foreground mb-1">{prompt.title}</p>
                                    <p className="text-xs text-muted-foreground">{prompt.prompt.substring(0, 100)}...</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-shrink-0 text-primary border-primary/30"
                                    onClick={() => {
                                      setCurrentStep('build');
                                    }}
                                    data-testid={`button-generate-${prompt.id}`}
                                  >
                                    <Image className="w-3 h-3 mr-1" />
                                    Generate
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {recommendations?.content && recommendations.content.length > 0 && (
                    <div className="mt-4 p-4 bg-card/80 rounded-lg border">
                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-foreground">
                        <Wand2 className="w-4 h-4 text-primary" />
                        Content Recommendations
                      </h4>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        {recommendations.content.slice(0, 3).map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Sparkles className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
                <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Select a chapter to start writing</p>
                <p className="text-sm">Or click "Generate All Chapters" to create content</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('plan')}
          className="border text-primary hover:bg-primary/10"
          data-testid="button-back-step-generate"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={() => setCurrentStep('build')}
          className="bg-primary hover:bg-primary/80"
          data-testid="button-next-step-generate"
        >
          Next: Build & Images
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
