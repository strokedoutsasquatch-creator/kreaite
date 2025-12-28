import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  BookOpen,
  Calendar,
  Sparkles,
  Image,
  FileText,
  ExternalLink,
  X,
  Loader2,
  GraduationCap,
  Briefcase,
  Heart,
  Trophy,
  Mountain,
  Sprout,
  Baby,
  Edit3,
  Eye,
  Clock,
  ChevronRight,
} from "lucide-react";
import type { LifeStory } from "@shared/schema";

const milestoneTypes = [
  { value: "birth", label: "Birth", icon: Baby, color: "bg-pink-500/20 text-pink-400" },
  { value: "education", label: "Education", icon: GraduationCap, color: "bg-blue-500/20 text-blue-400" },
  { value: "career", label: "Career", icon: Briefcase, color: "bg-green-500/20 text-green-400" },
  { value: "relationship", label: "Relationship", icon: Heart, color: "bg-red-500/20 text-red-400" },
  { value: "achievement", label: "Achievement", icon: Trophy, color: "bg-yellow-500/20 text-yellow-400" },
  { value: "challenge", label: "Challenge", icon: Mountain, color: "bg-purple-500/20 text-purple-400" },
  { value: "growth", label: "Growth", icon: Sprout, color: "bg-emerald-500/20 text-emerald-400" },
];

interface Milestone {
  id: number;
  year: string;
  title: string;
  description: string;
  type: string;
}

interface Chapter {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

function StoryListSidebar({
  stories,
  isLoading,
  selectedId,
  onSelect,
  onCreateNew,
}: {
  stories: LifeStory[];
  isLoading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreateNew: () => void;
}) {
  return (
    <div className="w-72 border-r border-gray-800 bg-gray-950 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-foreground mb-3">Life Stories</h2>
        <Button
          onClick={onCreateNew}
          className="w-full bg-orange-500 hover:bg-orange-600 text-foreground"
          data-testid="button-create-story"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Story
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-gray-800" />
            ))
          ) : stories.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No stories yet. Create your first life story!
            </p>
          ) : (
            stories.map((story) => (
              <button
                key={story.id}
                onClick={() => onSelect(story.id)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedId === story.id
                    ? "bg-primary/20 border border"
                    : "hover-elevate"
                }`}
                data-testid={`button-story-${story.id}`}
              >
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-foreground font-medium truncate text-sm">
                      {story.title}
                    </p>
                    <p className="text-gray-500 text-xs truncate">
                      {story.subtitle || "No subtitle"}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function StoryHeader({
  story,
  onUpdate,
  isUpdating,
}: {
  story: LifeStory;
  onUpdate: (updates: Partial<LifeStory>) => void;
  isUpdating: boolean;
}) {
  const [title, setTitle] = useState(story.title);
  const [subtitle, setSubtitle] = useState(story.subtitle || "");
  const [themeInput, setThemeInput] = useState("");
  const themes = (story.themes as string[]) || [];

  const handleAddTheme = () => {
    if (themeInput.trim() && !themes.includes(themeInput.trim())) {
      onUpdate({ themes: [...themes, themeInput.trim()] });
      setThemeInput("");
    }
  };

  const handleRemoveTheme = (theme: string) => {
    onUpdate({ themes: themes.filter((t) => t !== theme) });
  };

  const handleTitleBlur = () => {
    if (title !== story.title) {
      onUpdate({ title });
    }
  };

  const handleSubtitleBlur = () => {
    if (subtitle !== story.subtitle) {
      onUpdate({ subtitle });
    }
  };

  return (
    <Card className="bg-gray-950 border-gray-800">
      <CardHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="story-title" className="text-gray-400 text-sm">
              Story Title
            </Label>
            <Input
              id="story-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="My Life Story"
              className="mt-1 bg-gray-900 border-gray-700 text-foreground text-xl font-semibold"
              data-testid="input-story-title"
            />
          </div>
          <div>
            <Label htmlFor="story-subtitle" className="text-gray-400 text-sm">
              Subtitle
            </Label>
            <Input
              id="story-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              onBlur={handleSubtitleBlur}
              placeholder="A journey of growth and discovery..."
              className="mt-1 bg-gray-900 border-gray-700 text-foreground"
              data-testid="input-story-subtitle"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-sm">Themes</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {themes.map((theme) => (
                <Badge
                  key={theme}
                  variant="outline"
                  className="bg-primary/10 border text-primary"
                >
                  {theme}
                  <button
                    onClick={() => handleRemoveTheme(theme)}
                    className="ml-1 hover:text-orange-300"
                    data-testid={`button-remove-theme-${theme}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTheme()}
                placeholder="Add theme (e.g., triumph, love, growth)"
                className="bg-gray-900 border-gray-700 text-foreground"
                data-testid="input-theme"
              />
              <Button
                onClick={handleAddTheme}
                variant="outline"
                className="border-gray-700"
                data-testid="button-add-theme"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function TimelineSection({
  milestones,
  onAddMilestone,
  isAdding,
}: {
  milestones: Milestone[];
  onAddMilestone: (milestone: Omit<Milestone, "id">) => void;
  isAdding: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    year: "",
    title: "",
    description: "",
    type: "achievement",
  });

  const handleAdd = () => {
    if (newMilestone.year && newMilestone.title) {
      onAddMilestone(newMilestone);
      setNewMilestone({ year: "", title: "", description: "", type: "achievement" });
      setIsDialogOpen(false);
    }
  };

  const sortedMilestones = [...milestones].sort((a, b) => 
    a.year.localeCompare(b.year)
  );

  return (
    <Card className="bg-gray-950 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-foreground text-lg">Life Timeline</CardTitle>
          <CardDescription className="text-gray-400">
            Key milestones and events in your journey
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-add-milestone"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-950 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Life Milestone</DialogTitle>
              <DialogDescription className="text-gray-400">
                Document a significant moment in your life story.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="milestone-year" className="text-gray-400">
                    Year/Date
                  </Label>
                  <Input
                    id="milestone-year"
                    value={newMilestone.year}
                    onChange={(e) =>
                      setNewMilestone({ ...newMilestone, year: e.target.value })
                    }
                    placeholder="1990 or June 2020"
                    className="mt-1 bg-gray-900 border-gray-700 text-foreground"
                    data-testid="input-milestone-year"
                  />
                </div>
                <div>
                  <Label htmlFor="milestone-type" className="text-gray-400">
                    Type
                  </Label>
                  <Select
                    value={newMilestone.type}
                    onValueChange={(value) =>
                      setNewMilestone({ ...newMilestone, type: value })
                    }
                  >
                    <SelectTrigger
                      id="milestone-type"
                      className="mt-1 bg-gray-900 border-gray-700 text-foreground"
                      data-testid="select-milestone-type"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {milestoneTypes.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="text-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="milestone-title" className="text-gray-400">
                  Title
                </Label>
                <Input
                  id="milestone-title"
                  value={newMilestone.title}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, title: e.target.value })
                  }
                  placeholder="What happened?"
                  className="mt-1 bg-gray-900 border-gray-700 text-foreground"
                  data-testid="input-milestone-title"
                />
              </div>
              <div>
                <Label htmlFor="milestone-description" className="text-gray-400">
                  Description
                </Label>
                <Textarea
                  id="milestone-description"
                  value={newMilestone.description}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, description: e.target.value })
                  }
                  placeholder="Tell the story of this moment..."
                  className="mt-1 bg-gray-900 border-gray-700 text-foreground min-h-[100px]"
                  data-testid="input-milestone-description"
                />
              </div>
              <Button
                onClick={handleAdd}
                disabled={!newMilestone.year || !newMilestone.title || isAdding}
                className="w-full bg-orange-500 hover:bg-orange-600"
                data-testid="button-save-milestone"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Milestone
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No milestones yet. Start documenting your journey!</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-800" />
            <div className="space-y-4">
              {sortedMilestones.map((milestone, index) => {
                const typeInfo = milestoneTypes.find(
                  (t) => t.value === milestone.type
                ) || milestoneTypes[4];
                const Icon = typeInfo.icon;
                return (
                  <div
                    key={milestone.id}
                    className="relative pl-10"
                    data-testid={`milestone-card-${milestone.id}`}
                  >
                    <div
                      className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${typeInfo.color}`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>
                    <Card className="bg-gray-900/50 border-gray-800 hover-elevate">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={typeInfo.color}
                              >
                                {typeInfo.label}
                              </Badge>
                              <span className="text-gray-500 text-sm">
                                {milestone.year}
                              </span>
                            </div>
                            <h4 className="text-foreground font-medium">
                              {milestone.title}
                            </h4>
                            {milestone.description && (
                              <p className="text-gray-400 text-sm mt-1">
                                {milestone.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChapterGenerator({
  story,
  onChapterGenerated,
}: {
  story: LifeStory;
  onChapterGenerated: (chapter: Chapter) => void;
}) {
  const { toast } = useToast();
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContext, setChapterContext] = useState("");
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  const chapters = (story.chapters as Chapter[]) || [];

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/life-story/${story.id}/generate-chapter`,
        { chapterTitle, chapterContext }
      );
      return res.json();
    },
    onSuccess: (data) => {
      const newChapter: Chapter = {
        id: Date.now(),
        title: chapterTitle || "Untitled Chapter",
        content: data.chapter || data.generatedContent || "",
        createdAt: new Date().toISOString(),
      };
      onChapterGenerated(newChapter);
      setChapterTitle("");
      setChapterContext("");
      toast({
        title: "Chapter Generated",
        description: "Your new chapter has been created using AI.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="bg-gray-950 border-gray-800">
      <CardHeader>
        <CardTitle className="text-foreground text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Chapter Generator
        </CardTitle>
        <CardDescription className="text-gray-400">
          Use AI to help write compelling chapters of your life story
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="chapter-title" className="text-gray-400">
            Chapter Title
          </Label>
          <Input
            id="chapter-title"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            placeholder="e.g., The Day Everything Changed"
            className="mt-1 bg-gray-900 border-gray-700 text-foreground"
            data-testid="input-chapter-title"
          />
        </div>
        <div>
          <Label htmlFor="chapter-context" className="text-gray-400">
            Context & Focus
          </Label>
          <Textarea
            id="chapter-context"
            value={chapterContext}
            onChange={(e) => setChapterContext(e.target.value)}
            placeholder="Describe what this chapter should cover, the emotions, events, and lessons..."
            className="mt-1 bg-gray-900 border-gray-700 text-foreground min-h-[120px]"
            data-testid="input-chapter-context"
          />
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="w-full bg-orange-500 hover:bg-orange-600"
          data-testid="button-generate-chapter"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Chapter
            </>
          )}
        </Button>

        {chapters.length > 0 && (
          <>
            <Separator className="bg-gray-800 my-4" />
            <div>
              <h4 className="text-foreground font-medium mb-3">Generated Chapters</h4>
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-3 bg-gray-900/50 rounded-md border border-gray-800"
                    data-testid={`chapter-item-${chapter.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-medium truncate">
                          {chapter.title}
                        </p>
                        <p className="text-gray-500 text-xs">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(chapter.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedChapter(chapter)}
                        data-testid={`button-view-chapter-${chapter.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Dialog
          open={!!selectedChapter}
          onOpenChange={(open) => !open && setSelectedChapter(null)}
        >
          <DialogContent className="bg-gray-950 border-gray-800 max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {selectedChapter?.title}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">
                  {selectedChapter?.content}
                </p>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function AttachmentsSection({
  attachments,
  onAddAttachment,
}: {
  attachments: any[];
  onAddAttachment: (type: string) => void;
}) {
  return (
    <Card className="bg-gray-950 border-gray-800">
      <CardHeader>
        <CardTitle className="text-foreground text-lg">Attachments</CardTitle>
        <CardDescription className="text-gray-400">
          Add photos and documents to enrich your story
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onAddAttachment("photo")}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-lg hover:border-orange-500/50 transition-colors"
            data-testid="button-add-photo"
          >
            <Image className="w-8 h-8 text-gray-500 mb-2" />
            <span className="text-gray-400 text-sm">Add Photos</span>
            <span className="text-gray-600 text-xs">Coming Soon</span>
          </button>
          <button
            onClick={() => onAddAttachment("document")}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 rounded-lg hover:border-orange-500/50 transition-colors"
            data-testid="button-add-document"
          >
            <FileText className="w-8 h-8 text-gray-500 mb-2" />
            <span className="text-gray-400 text-sm">Add Documents</span>
            <span className="text-gray-600 text-xs">Coming Soon</span>
          </button>
        </div>
        {attachments.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="aspect-square bg-gray-900 rounded-md flex items-center justify-center"
              >
                {attachment.type === "photo" ? (
                  <Image className="w-6 h-6 text-gray-600" />
                ) : (
                  <FileText className="w-6 h-6 text-gray-600" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LifeStoryEngine() {
  const { toast } = useToast();
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);

  const { data: stories = [], isLoading } = useQuery<LifeStory[]>({
    queryKey: ["/api/life-story"],
  });

  const selectedStory = stories.find((s) => s.id === selectedStoryId);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/life-story", {
        title: "My Life Story",
      });
      return res.json();
    },
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/life-story"] });
      setSelectedStoryId(newStory.id);
      toast({
        title: "Story Created",
        description: "Your new life story has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<LifeStory>) => {
      if (!selectedStoryId) return;
      const res = await apiRequest(
        "PATCH",
        `/api/life-story/${selectedStoryId}`,
        updates
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/life-story"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addMilestoneMutation = useMutation({
    mutationFn: async (milestone: Omit<Milestone, "id">) => {
      if (!selectedStoryId) return;
      const res = await apiRequest(
        "POST",
        `/api/life-story/${selectedStoryId}/milestones`,
        { milestone }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/life-story"] });
      toast({
        title: "Milestone Added",
        description: "Your life milestone has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Milestone",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChapterGenerated = (chapter: Chapter) => {
    if (!selectedStory) return;
    const existingChapters = (selectedStory.chapters as Chapter[]) || [];
    updateMutation.mutate({ chapters: [...existingChapters, chapter] });
  };

  const handleAddAttachment = (type: string) => {
    toast({
      title: "Coming Soon",
      description: `${type === "photo" ? "Photo" : "Document"} uploads will be available soon.`,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="life-story-engine-page">
      <CreatorHeader />
      <div className="flex-1 flex">
        <StoryListSidebar
          stories={stories}
          isLoading={isLoading}
          selectedId={selectedStoryId}
          onSelect={setSelectedStoryId}
          onCreateNew={() => createMutation.mutate()}
        />

        <div className="flex-1 overflow-auto">
          {!selectedStory ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h2 className="text-2xl font-serif text-foreground mb-2">
                  Life Story Engine
                </h2>
                <p className="text-gray-400 mb-6">
                  Document your journey, capture milestones, and transform your
                  life experiences into a compelling memoir.
                </p>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="button-create-first-story"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Your First Story
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-serif text-foreground">
                  {selectedStory.title}
                </h1>
                <Link href="/book-studio">
                  <Button
                    variant="outline"
                    className="border text-primary hover:bg-primary/10"
                    data-testid="button-export-to-book"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Export to Book Studio
                  </Button>
                </Link>
              </div>

              <StoryHeader
                story={selectedStory}
                onUpdate={(updates) => updateMutation.mutate(updates)}
                isUpdating={updateMutation.isPending}
              />

              <TimelineSection
                milestones={(selectedStory.milestones as Milestone[]) || []}
                onAddMilestone={(milestone) =>
                  addMilestoneMutation.mutate(milestone)
                }
                isAdding={addMilestoneMutation.isPending}
              />

              <ChapterGenerator
                story={selectedStory}
                onChapterGenerated={handleChapterGenerated}
              />

              <AttachmentsSection
                attachments={(selectedStory.attachments as any[]) || []}
                onAddAttachment={handleAddAttachment}
              />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
