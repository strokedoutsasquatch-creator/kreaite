import { useState } from "react";
import { useBookStudio } from "@/lib/contexts/BookStudioContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Layers,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  Wand2,
  Edit3,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ChapterOutline } from "@/lib/contexts/BookStudioContext";

export default function PlanStep() {
  const { toast } = useToast();
  const {
    bookOutline,
    setBookOutline,
    setCurrentStep,
  } = useBookStudio();

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const chapters = bookOutline?.chapters || [];
  const totalWordCount = chapters.reduce((sum, ch) => sum + (ch.wordCount || ch.targetWordCount), 0);
  const estimatedPages = Math.ceil(totalWordCount / 250);
  const completedChapters = chapters.filter(ch => ch.status === 'complete').length;

  const addChapter = () => {
    if (!bookOutline) {
      setBookOutline({
        title: "Untitled Book",
        genre: "fiction",
        targetWordCount: 50000,
        chapters: [],
      });
    }
    
    const newChapter: ChapterOutline = {
      id: `chapter-${Date.now()}`,
      number: chapters.length + 1,
      title: `Chapter ${chapters.length + 1}`,
      description: "",
      targetWordCount: 3000,
      status: 'outline',
    };
    
    setBookOutline({
      ...bookOutline!,
      chapters: [...chapters, newChapter],
    });
    
    toast({ title: "Chapter Added" });
  };

  const updateChapter = (id: string, updates: Partial<ChapterOutline>) => {
    if (!bookOutline) return;
    
    const updatedChapters = chapters.map((ch) =>
      ch.id === id ? { ...ch, ...updates } : ch
    );
    
    setBookOutline({
      ...bookOutline,
      chapters: updatedChapters,
    });
  };

  const removeChapter = (id: string) => {
    if (!bookOutline) return;
    
    const updatedChapters = chapters
      .filter((ch) => ch.id !== id)
      .map((ch, idx) => ({ ...ch, number: idx + 1 }));
    
    setBookOutline({
      ...bookOutline,
      chapters: updatedChapters,
    });
    
    toast({ title: "Chapter Removed" });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/50 border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Layers className="w-5 h-5 text-orange-500" />
            Step 2: Structure & Outline
          </CardTitle>
          <CardDescription>
            Organize your chapters and plan your book's structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white">Chapter Outline</h3>
                  {bookOutline?.title && (
                    <p className="text-sm text-muted-foreground">{bookOutline.title}</p>
                  )}
                </div>
                <Button
                  onClick={addChapter}
                  variant="outline"
                  size="sm"
                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  data-testid="button-add-chapter"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Chapter
                </Button>
              </div>

              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {chapters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <BookOpen className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-sm">No chapters yet</p>
                      <p className="text-xs">Add chapters to start building your outline</p>
                      <Button
                        onClick={addChapter}
                        variant="outline"
                        size="sm"
                        className="mt-4 border-orange-500/30 text-orange-400"
                        data-testid="button-add-first-chapter"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add First Chapter
                      </Button>
                    </div>
                  ) : (
                    chapters.map((chapter, index) => (
                      <Card
                        key={chapter.id}
                        className={`cursor-pointer transition-all bg-black/40 border-orange-500/20 hover:border-orange-500/40 ${
                          selectedChapterId === chapter.id ? 'border-orange-500 ring-1 ring-orange-500/50' : ''
                        }`}
                        onClick={() => setSelectedChapterId(chapter.id)}
                        data-testid={`card-chapter-${chapter.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1 cursor-move" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">
                                  Ch. {index + 1}
                                </Badge>
                                <Input
                                  value={chapter.title}
                                  onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
                                  className="h-8 font-semibold bg-transparent border-orange-500/20 text-white flex-1"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`input-chapter-title-${chapter.id}`}
                                />
                                <Badge
                                  variant={chapter.status === "complete" ? "default" : "secondary"}
                                  className={`text-xs ${
                                    chapter.status === "complete"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {chapter.status}
                                </Badge>
                              </div>
                              <Textarea
                                value={chapter.description}
                                onChange={(e) => updateChapter(chapter.id, { description: e.target.value })}
                                placeholder="Brief description of this chapter..."
                                className="min-h-[60px] text-sm bg-transparent border-orange-500/20 text-gray-200"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`textarea-chapter-desc-${chapter.id}`}
                              />
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{(chapter.wordCount || chapter.targetWordCount).toLocaleString()} words</span>
                                <span>~{Math.ceil((chapter.wordCount || chapter.targetWordCount) / 250)} pages</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeChapter(chapter.id);
                              }}
                              data-testid={`button-delete-chapter-${chapter.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-4">
              <Card className="bg-black/40 border-orange-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white">Book Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-gray-200">
                    <span className="text-muted-foreground">Chapters</span>
                    <span className="font-bold">{chapters.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-200">
                    <span className="text-muted-foreground">Total Words</span>
                    <span className="font-bold">{totalWordCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-200">
                    <span className="text-muted-foreground">Est. Pages</span>
                    <span className="font-bold">{estimatedPages}</span>
                  </div>
                  <Separator className="bg-orange-500/20" />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Progress</div>
                    <Progress
                      value={chapters.length > 0 ? (completedChapters / chapters.length) * 100 : 0}
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {completedChapters} of {chapters.length} chapters complete
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-500/5 border-orange-500/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-2 text-white">
                    <Wand2 className="w-4 h-4 text-orange-500" /> AI Suggestions
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Consider adding an "Introduction" chapter</li>
                    <li>• A "Lessons Learned" chapter works well for memoirs</li>
                    <li>• End with a "Call to Action" for your readers</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t border-orange-500/20">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('start')}
              className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
              data-testid="button-back-step-plan"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button
              onClick={() => setCurrentStep('generate')}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-next-step-plan"
            >
              Next: Generate Content
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
