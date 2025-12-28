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
        <Card className="bg-black/50 border-orange-500/20 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between text-white">
              Chapters
              <Button
                size="sm"
                variant="ghost"
                onClick={addChapter}
                className="text-orange-400 hover:bg-orange-500/10"
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
                        ? 'bg-orange-500/20 border-orange-500 border' 
                        : 'bg-black/30 hover:bg-black/50 border border-transparent'
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
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {chapter.status === "generating" && (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        )}
                        {chapter.status}
                      </Badge>
                    </div>
                    <div className="font-medium text-sm truncate text-white">
                      {chapter.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {(chapter.wordCount || 0).toLocaleString()} words
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 p-3 bg-black/30 rounded-lg border border-orange-500/20">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Total chapters:</span>
                  <span className="font-medium text-white">{chapters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total words:</span>
                  <span className="font-medium text-white">{totalWords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. pages:</span>
                  <span className="font-medium text-white">~{Math.ceil(totalWords / 250)}</span>
                </div>
              </div>
            </div>

            {chapters.length > 0 && (
              <Button
                onClick={handleGenerateAll}
                disabled={generationProgress.isGenerating}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600"
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
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Card className="bg-black/50 border-orange-500/20 shadow-lg">
            {selectedChapter ? (
              <>
                <div className="px-6 pt-4 pb-2 border-b border-orange-500/20">
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
                      className="text-xl font-bold border-0 px-0 focus-visible:ring-0 bg-transparent flex-1 text-white"
                      placeholder="Chapter Title"
                      data-testid="input-chapter-title-editor"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        onClick={handleGenerateChapter}
                        disabled={generationProgress.isGenerating}
                        size="sm"
                        variant="outline"
                        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
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
                          className="w-[130px] h-8 text-xs bg-transparent border-orange-500/20 text-white"
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
                        onClick={() => toast({ title: "Edit feature", description: "Coming soon!" })}
                        disabled={!selectedChapter.content}
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600"
                        data-testid="button-run-edit"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <Textarea
                    value={selectedChapter.content || ""}
                    onChange={(e) => updateChapterContent(e.target.value)}
                    placeholder="Start writing your chapter here, or click 'AI Write' to generate content..."
                    className="min-h-[500px] bg-black/30 border-orange-500/20 text-gray-200 text-base leading-relaxed"
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
          className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
          data-testid="button-back-step-generate"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={() => setCurrentStep('build')}
          className="bg-orange-500 hover:bg-orange-600"
          data-testid="button-next-step-generate"
        >
          Next: Build & Images
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
