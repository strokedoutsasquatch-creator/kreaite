import { useState, useCallback } from "react";
import { useBookProject } from "@/lib/hooks/useBookProject";
import { Button } from "@/components/ui/button";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  Plus, 
  Save, 
  Download, 
  Rocket, 
  PanelLeftClose,
  PanelRightClose,
  Maximize2,
  Minimize2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChapterSidebar from "./ChapterSidebar";
import ToolPanel from "./ToolPanel";
import EditorPane from "./EditorPane";

interface WorkspaceShellProps {
  onExport?: (format: string) => void;
  onPublish?: () => void;
}

export default function WorkspaceShell({ onExport, onPublish }: WorkspaceShellProps) {
  const { toast } = useToast();
  const {
    project,
    projects,
    isLoadingProjects,
    loadProject,
    createProject,
    updateProject,
    isSaving,
    lastSaved,
  } = useBookProject();

  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [distractionFree, setDistractionFree] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");

  const handleProjectSelect = (projectId: number) => {
    loadProject(projectId);
    toast({ title: "Project Loaded", description: "Your book has been loaded" });
  };

  const handleCreateProject = async () => {
    try {
      await createProject({ title: "Untitled Book", genre: "fiction" });
      toast({ title: "New Project", description: "Created a new book project" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    }
  };

  const handleSave = useCallback(() => {
    if (project) {
      updateProject({ manuscriptHtml: editorContent });
      toast({ title: "Saved", description: "Your changes have been saved" });
    }
  }, [project, editorContent, updateProject, toast]);

  const formatLastSaved = (date: Date | null) => {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString();
  };

  if (distractionFree) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <div className="absolute top-4 right-4 z-50 opacity-0 hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDistractionFree(false)}
            data-testid="button-exit-distraction-free"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 max-w-4xl mx-auto w-full p-8">
          <EditorPane
            content={editorContent}
            onChange={setEditorContent}
            distractionFree={true}
            projectId={project?.id}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            data-testid="button-toggle-left-panel"
          >
            <PanelLeftClose className={`w-4 h-4 transition-transform ${leftPanelCollapsed ? 'rotate-180' : ''}`} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="dropdown-project-selector">
                {project?.title || "Select Project"}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {projects.map((p) => (
                <DropdownMenuItem 
                  key={p.id} 
                  onClick={() => handleProjectSelect(p.id)}
                  data-testid={`menu-item-project-${p.id}`}
                >
                  <span className="truncate">{p.title}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCreateProject} data-testid="menu-item-new-project">
                <Plus className="w-4 h-4 mr-2" />
                New Book Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isSaving && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </div>
          )}
          {!isSaving && lastSaved && (
            <span className="text-muted-foreground text-sm">
              Saved {formatLastSaved(lastSaved)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleSave} data-testid="button-save">
            <Save className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDistractionFree(true)}
            data-testid="button-distraction-free"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="dropdown-export">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport?.("kdp-pdf")} data-testid="menu-item-export-kdp">
                Amazon KDP (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.("kindle")} data-testid="menu-item-export-kindle">
                Kindle (EPUB/MOBI)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.("apple")} data-testid="menu-item-export-apple">
                Apple Books (EPUB)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.("ingram")} data-testid="menu-item-export-ingram">
                IngramSpark (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.("bn")} data-testid="menu-item-export-bn">
                Barnes & Noble
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.("kobo")} data-testid="menu-item-export-kobo">
                Kobo Writing Life
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.("google")} data-testid="menu-item-export-google">
                Google Play Books
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.("d2d")} data-testid="menu-item-export-d2d">
                Draft2Digital
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={onPublish} className="gap-2" data-testid="button-publish">
            <Rocket className="w-4 h-4" />
            Publish
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            data-testid="button-toggle-right-panel"
          >
            <PanelRightClose className={`w-4 h-4 transition-transform ${rightPanelCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </header>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {!leftPanelCollapsed && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <ChapterSidebar
                projectId={project?.id}
                activeChapterId={activeChapterId}
                onChapterSelect={setActiveChapterId}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        <ResizablePanel defaultSize={leftPanelCollapsed && rightPanelCollapsed ? 100 : 55}>
          <EditorPane
            content={editorContent}
            onChange={setEditorContent}
            projectId={project?.id}
          />
        </ResizablePanel>

        {!rightPanelCollapsed && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <ToolPanel projectId={project?.id} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
