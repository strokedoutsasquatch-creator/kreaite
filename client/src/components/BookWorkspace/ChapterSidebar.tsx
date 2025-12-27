import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Plus,
  ChevronRight,
  FileText,
  BookOpen,
  Heart,
  Users,
  Quote,
  Scroll,
  User,
  Library,
  Link2,
  GripVertical,
  Trash2,
  Edit3,
  Image,
  TableOfContents,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Chapter {
  id: string;
  title: string;
  type: "chapter" | "front-matter" | "back-matter";
  order: number;
  wordCount?: number;
  hasImages?: boolean;
}

interface ChapterSidebarProps {
  projectId?: number;
  activeChapterId: string | null;
  onChapterSelect: (id: string) => void;
}

const frontMatterItems = [
  { id: "toc", title: "Table of Contents", icon: TableOfContents },
  { id: "dedication", title: "Dedication", icon: Heart },
  { id: "acknowledgments", title: "Acknowledgments", icon: Users },
  { id: "foreword", title: "Foreword", icon: Quote },
  { id: "preface", title: "Preface", icon: Scroll },
];

const backMatterItems = [
  { id: "about-author", title: "About the Author", icon: User },
  { id: "other-books", title: "Other Books", icon: Library },
  { id: "resources", title: "Resources", icon: Link2 },
];

export default function ChapterSidebar({ 
  projectId, 
  activeChapterId, 
  onChapterSelect 
}: ChapterSidebarProps) {
  const [frontMatterOpen, setFrontMatterOpen] = useState(true);
  const [chaptersOpen, setChaptersOpen] = useState(true);
  const [backMatterOpen, setBackMatterOpen] = useState(true);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ['/api/book-projects', projectId, 'sections'],
    enabled: !!projectId,
  });

  const chapters = sections
    .filter((s: any) => s.sectionType === 'chapter')
    .sort((a: any, b: any) => a.sectionNumber - b.sectionNumber);

  const addChapterMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest('POST', `/api/book-projects/${projectId}/sections`, {
        title,
        sectionType: 'chapter',
        content: '',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/book-projects', projectId, 'sections'] });
      setNewChapterTitle("");
      setIsAddingChapter(false);
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      return apiRequest('DELETE', `/api/book-projects/${projectId}/sections/${sectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/book-projects', projectId, 'sections'] });
    },
  });

  const handleAddChapter = () => {
    if (newChapterTitle.trim()) {
      addChapterMutation.mutate(newChapterTitle.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddChapter();
    } else if (e.key === 'Escape') {
      setIsAddingChapter(false);
      setNewChapterTitle("");
    }
  };

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Manuscript</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setIsAddingChapter(true)}
            data-testid="button-add-chapter"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <Collapsible open={frontMatterOpen} onOpenChange={setFrontMatterOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 w-full p-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover-elevate">
              <ChevronRight className={`w-4 h-4 transition-transform ${frontMatterOpen ? 'rotate-90' : ''}`} />
              <span className="font-medium">Front Matter</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-0.5">
              {frontMatterItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChapterSelect(item.id)}
                  className={`flex items-center gap-2 w-full p-2 text-sm rounded-md hover-elevate ${
                    activeChapterId === item.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                  }`}
                  data-testid={`sidebar-item-${item.id}`}
                >
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <span>{item.title}</span>
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />

          <Collapsible open={chaptersOpen} onOpenChange={setChaptersOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 w-full p-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover-elevate">
              <ChevronRight className={`w-4 h-4 transition-transform ${chaptersOpen ? 'rotate-90' : ''}`} />
              <span className="font-medium">Chapters</span>
              <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                {chapters.length}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-2 space-y-0.5">
              {chapters.map((chapter: any, index: number) => (
                <ContextMenu key={chapter.id}>
                  <ContextMenuTrigger>
                    <button
                      onClick={() => onChapterSelect(String(chapter.id))}
                      className={`flex items-center gap-2 w-full p-2 text-sm rounded-md hover-elevate group ${
                        activeChapterId === String(chapter.id) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                      }`}
                      data-testid={`sidebar-chapter-${chapter.id}`}
                    >
                      <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate flex-1 text-left">
                        {chapter.title || `Chapter ${index + 1}`}
                      </span>
                      {chapter.wordCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(chapter.wordCount / 1000)}k
                        </span>
                      )}
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => {
                      setEditingChapterId(String(chapter.id));
                      setEditingTitle(chapter.title);
                    }}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => deleteChapterMutation.mutate(chapter.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              
              {isAddingChapter ? (
                <div className="flex items-center gap-2 p-1">
                  <Input
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                      if (!newChapterTitle.trim()) {
                        setIsAddingChapter(false);
                      }
                    }}
                    placeholder="Chapter title..."
                    className="h-8 text-sm"
                    autoFocus
                    data-testid="input-new-chapter-title"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingChapter(true)}
                  className="flex items-center gap-2 w-full p-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover-elevate"
                  data-testid="button-add-chapter-inline"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add chapter</span>
                </button>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />

          <Collapsible open={backMatterOpen} onOpenChange={setBackMatterOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 w-full p-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover-elevate">
              <ChevronRight className={`w-4 h-4 transition-transform ${backMatterOpen ? 'rotate-90' : ''}`} />
              <span className="font-medium">Back Matter</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-0.5">
              {backMatterItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onChapterSelect(item.id)}
                  className={`flex items-center gap-2 w-full p-2 text-sm rounded-md hover-elevate ${
                    activeChapterId === item.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                  }`}
                  data-testid={`sidebar-item-${item.id}`}
                >
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <span>{item.title}</span>
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />

          <button
            onClick={() => onChapterSelect("cover")}
            className={`flex items-center gap-2 w-full p-2 text-sm rounded-md hover-elevate ${
              activeChapterId === "cover" ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
            }`}
            data-testid="sidebar-item-cover"
          >
            <Image className="w-4 h-4 text-muted-foreground" />
            <span>Book Cover</span>
          </button>
        </div>
      </ScrollArea>

      <div className="p-3 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Total Words</span>
          <span className="font-medium">
            {chapters.reduce((sum: number, ch: any) => sum + (ch.wordCount || 0), 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
