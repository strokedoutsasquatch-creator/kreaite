import { useState, useCallback, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronDown, 
  Plus, 
  Save, 
  Download, 
  Rocket, 
  PanelLeftClose,
  PanelRightClose,
  PanelBottomClose,
  Maximize2,
  Minimize2,
  Loader2,
  HelpCircle,
  Keyboard,
  Settings2,
  GripVertical,
  FileText,
  List,
  Wand2,
  Menu,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChapterSidebar from "./ChapterSidebar";
import ToolPanel from "./ToolPanel";
import EditorPane from "./EditorPane";

interface ExportData {
  format: string;
  content: string;
  title: string;
  author?: string;
}

interface WorkspaceShellProps {
  onExport?: (data: ExportData) => void;
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
  const [toolPanelDock, setToolPanelDock] = useState<"right" | "bottom">("right");
  const [distractionFree, setDistractionFree] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "chapters" | "tools">("editor");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          setShowShortcuts(true);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInsertContent = useCallback((html: string) => {
    setEditorContent(prev => prev + html);
    toast({ title: "Content Inserted", description: "Content added to your manuscript" });
  }, [toast]);

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
      <header className="h-12 md:h-14 border-b flex items-center justify-between px-2 md:px-4 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Desktop only: panel toggle */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              data-testid="button-toggle-left-panel"
            >
              <PanelLeftClose className={`w-4 h-4 transition-transform ${leftPanelCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1 md:gap-2 text-sm md:text-base max-w-[140px] md:max-w-none" data-testid="dropdown-project-selector">
                <span className="truncate">{project?.title || "Select Project"}</span>
                <ChevronDown className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
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

          {/* Desktop only: save status */}
          {!isMobile && isSaving && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </div>
          )}
          {!isMobile && !isSaving && lastSaved && (
            <span className="text-muted-foreground text-sm">
              Saved {formatLastSaved(lastSaved)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="outline" onClick={handleSave} size={isMobile ? "sm" : "default"} className="gap-1 md:gap-2" data-testid="button-save">
            <Save className="w-4 h-4" />
            <span className="hidden md:inline">Save</span>
          </Button>
          
          {/* Desktop only: keyboard shortcuts */}
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowShortcuts(true)}
              title="Keyboard Shortcuts (?)"
              data-testid="button-keyboard-shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </Button>
          )}

          {/* Desktop only: distraction free */}
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setDistractionFree(true)}
              data-testid="button-distraction-free"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size={isMobile ? "sm" : "default"} className="gap-1 md:gap-2" data-testid="dropdown-export">
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport?.({ format: "kdp-pdf", content: editorContent, title: project?.title || "Untitled Book" })} data-testid="menu-item-export-kdp">
                Amazon KDP (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.({ format: "kindle", content: editorContent, title: project?.title || "Untitled Book" })} data-testid="menu-item-export-kindle">
                Kindle (EPUB/MOBI)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.({ format: "apple", content: editorContent, title: project?.title || "Untitled Book" })} data-testid="menu-item-export-apple">
                Apple Books (EPUB)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.({ format: "ingram", content: editorContent, title: project?.title || "Untitled Book" })} data-testid="menu-item-export-ingram">
                IngramSpark (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.({ format: "bn", content: editorContent, title: project?.title || "Untitled Book" })} data-testid="menu-item-export-bn">
                Barnes & Noble
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.({ format: "kobo", content: editorContent, title: project?.title || "Untitled Book" })} data-testid="menu-item-export-kobo">
                Kobo Writing Life
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.({ format: "google", content: editorContent, title: project?.title || "Untitled Book" })} data-testid="menu-item-export-google">
                Google Play Books
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.({ format: "d2d", content: editorContent, title: project?.title || "Untitled Book" })} data-testid="menu-item-export-d2d">
                Draft2Digital
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={onPublish} size={isMobile ? "sm" : "default"} className="gap-1 md:gap-2" data-testid="button-publish">
            <Rocket className="w-4 h-4" />
            <span className="hidden md:inline">Publish</span>
          </Button>

          {/* Desktop only: panel toggle */}
          {!isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="button-toggle-right-panel"
                >
                  {rightPanelCollapsed ? (
                    <PanelRightClose className="w-4 h-4 rotate-180" />
                  ) : toolPanelDock === "right" ? (
                    <PanelRightClose className="w-4 h-4" />
                  ) : (
                    <PanelBottomClose className="w-4 h-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => { setRightPanelCollapsed(false); setToolPanelDock("right"); }}
                  data-testid="menu-dock-right"
                >
                  <PanelRightClose className="w-4 h-4 mr-2" />
                  Dock Right
                  {!rightPanelCollapsed && toolPanelDock === "right" && " (Active)"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => { setRightPanelCollapsed(false); setToolPanelDock("bottom"); }}
                  data-testid="menu-dock-bottom"
                >
                  <PanelBottomClose className="w-4 h-4 mr-2" />
                  Dock Bottom
                  {!rightPanelCollapsed && toolPanelDock === "bottom" && " (Active)"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                  data-testid="menu-collapse-panel"
                >
                  <Minimize2 className="w-4 h-4 mr-2" />
                  {rightPanelCollapsed ? "Show Panel" : "Hide Panel"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* MOBILE LAYOUT */}
      {isMobile ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as any)} className="flex-1 flex flex-col">
            <TabsContent value="editor" className="flex-1 m-0 overflow-hidden">
              <EditorPane
                content={editorContent}
                onChange={setEditorContent}
                projectId={project?.id}
              />
            </TabsContent>
            <TabsContent value="chapters" className="flex-1 m-0 overflow-hidden">
              <ChapterSidebar
                projectId={project?.id}
                activeChapterId={activeChapterId}
                onChapterSelect={(id) => {
                  setActiveChapterId(id);
                  setMobileTab("editor");
                }}
              />
            </TabsContent>
            <TabsContent value="tools" className="flex-1 m-0 overflow-hidden">
              <ToolPanel projectId={project?.id} onInsertContent={handleInsertContent} manuscriptContent={editorContent} />
            </TabsContent>
            
            {/* Mobile Bottom Nav */}
            <div className="border-t bg-zinc-900 p-2 shrink-0">
              <TabsList className="grid grid-cols-3 w-full bg-zinc-800">
                <TabsTrigger value="chapters" className="flex items-center gap-2 text-foreground data-[state=active]:bg-primary" data-testid="mobile-tab-chapters">
                  <List className="w-4 h-4" />
                  <span className="text-xs">Chapters</span>
                </TabsTrigger>
                <TabsTrigger value="editor" className="flex items-center gap-2 text-foreground data-[state=active]:bg-primary" data-testid="mobile-tab-editor">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Write</span>
                </TabsTrigger>
                <TabsTrigger value="tools" className="flex items-center gap-2 text-foreground data-[state=active]:bg-primary" data-testid="mobile-tab-tools">
                  <Wand2 className="w-4 h-4" />
                  <span className="text-xs">AI Tools</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>
      ) : toolPanelDock === "bottom" ? (
        /* DESKTOP: Bottom dock layout */
        <ResizablePanelGroup direction="vertical" className="flex-1">
          <ResizablePanel defaultSize={rightPanelCollapsed ? 100 : 60} minSize={30}>
            <ResizablePanelGroup direction="horizontal" className="h-full">
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
              <ResizablePanel defaultSize={leftPanelCollapsed ? 100 : 80}>
                <EditorPane
                  content={editorContent}
                  onChange={setEditorContent}
                  projectId={project?.id}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          {!rightPanelCollapsed && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
                <ToolPanel projectId={project?.id} onInsertContent={handleInsertContent} manuscriptContent={editorContent} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      ) : (
        /* DESKTOP: Right dock layout (default) */
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

          <ResizablePanel defaultSize={leftPanelCollapsed && rightPanelCollapsed ? 100 : 40}>
            <EditorPane
              content={editorContent}
              onChange={setEditorContent}
              projectId={project?.id}
            />
          </ResizablePanel>

          {!rightPanelCollapsed && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
                <ToolPanel projectId={project?.id} onInsertContent={handleInsertContent} manuscriptContent={editorContent} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      )}

      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">AI Actions</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Expand selected text</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+E</kbd>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rewrite selected text</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+Shift+R</kbd>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Continue writing</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+/</kbd>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Editing</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Save document</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+S</kbd>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bold text</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+B</kbd>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Italic text</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+I</kbd>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Underline text</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+U</kbd>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Navigation</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Show this help</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">?</kbd>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Exit distraction-free mode</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
