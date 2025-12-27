import { useState, useCallback, useRef, useEffect } from "react";
import ProfessionalEditor from "@/components/ProfessionalEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Wand2,
  Expand,
  RefreshCw,
  ArrowRight,
  Target,
  Loader2,
  Palette,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditorPaneProps {
  content: string;
  onChange: (content: string) => void;
  projectId?: number;
  distractionFree?: boolean;
}

interface WordGoal {
  daily: number;
  session: number;
}

export default function EditorPane({ 
  content, 
  onChange, 
  projectId,
  distractionFree = false 
}: EditorPaneProps) {
  const { toast } = useToast();
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiAction, setAiAction] = useState<string | null>(null);
  const [wordGoal, setWordGoal] = useState<WordGoal>({ daily: 1000, session: 500 });
  const [sessionStartWords, setSessionStartWords] = useState(0);
  const editorRef = useRef<any>(null);

  const wordCount = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const sessionWords = wordCount - sessionStartWords;
  const dailyProgress = Math.min((wordCount / wordGoal.daily) * 100, 100);
  const sessionProgress = Math.min((sessionWords / wordGoal.session) * 100, 100);

  useEffect(() => {
    setSessionStartWords(wordCount);
  }, [projectId]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString());
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    } else {
      setSelectedText("");
      setSelectionPosition(null);
    }
  }, []);

  const handleAiAction = async (action: "expand" | "rewrite" | "continue") => {
    if (!selectedText && action !== "continue") return;
    
    setIsAiProcessing(true);
    setAiAction(action);

    try {
      const res = await apiRequest('POST', '/api/ai/quick-action', {
        action,
        text: selectedText || content.slice(-500),
        projectId,
      });
      const response = await res.json();

      if (response.result) {
        if (action === "continue") {
          onChange(content + "\n\n" + response.result);
        } else {
          const newContent = content.replace(selectedText, response.result);
          onChange(newContent);
        }
        toast({ title: "AI Complete", description: `Text ${action}ed successfully` });
      }
    } catch (error) {
      toast({ title: "Error", description: "AI action failed", variant: "destructive" });
    } finally {
      setIsAiProcessing(false);
      setAiAction(null);
      setSelectedText("");
      setSelectionPosition(null);
    }
  };

  const handleToneRewrite = async (tone: string) => {
    if (!selectedText) return;
    
    setIsAiProcessing(true);
    setAiAction(tone);

    try {
      const res = await apiRequest('POST', '/api/ai/tone-rewrite', {
        text: selectedText,
        tone,
      });
      const response = await res.json();

      if (response.success && response.rewrittenText) {
        const newContent = content.replace(selectedText, response.rewrittenText);
        onChange(newContent);
        toast({ title: "Tone Updated", description: `Text rewritten in ${tone} style` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Tone rewrite failed", variant: "destructive" });
    } finally {
      setIsAiProcessing(false);
      setAiAction(null);
      setSelectedText("");
      setSelectionPosition(null);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'e':
          e.preventDefault();
          if (selectedText) handleAiAction("expand");
          break;
        case 'r':
          if (e.shiftKey) {
            e.preventDefault();
            if (selectedText) handleAiAction("rewrite");
          }
          break;
        case '/':
          e.preventDefault();
          handleAiAction("continue");
          break;
      }
    }
  }, [selectedText, content]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (distractionFree) {
    return (
      <div className="h-full flex flex-col" onMouseUp={handleTextSelection}>
        <ProfessionalEditor
          content={content}
          onChange={onChange}
          placeholder="Start writing..."
          className="flex-1 prose prose-lg dark:prose-invert max-w-none"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-10 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {wordCount.toLocaleString()} words
            </Badge>
            <span className="text-xs text-muted-foreground">
              ~{Math.ceil(wordCount / 250)} pages
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-word-goals">
                <Target className="w-4 h-4" />
                Goals
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Daily Goal</span>
                    <span>{wordCount.toLocaleString()} / {wordGoal.daily.toLocaleString()}</span>
                  </div>
                  <Progress value={dailyProgress} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Session</span>
                    <span>{sessionWords.toLocaleString()} / {wordGoal.session.toLocaleString()}</span>
                  </div>
                  <Progress value={sessionProgress} className="h-2" />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Ctrl+E Expand</span>
            <span className="mx-1">|</span>
            <span>Ctrl+Shift+R Rewrite</span>
            <span className="mx-1">|</span>
            <span>Ctrl+/ Continue</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" onMouseUp={handleTextSelection}>
        <ProfessionalEditor
          content={content}
          onChange={onChange}
          placeholder="Start writing your masterpiece..."
          className="h-full"
        />

        {selectedText && selectionPosition && (
          <div 
            className="fixed z-50 bg-popover border rounded-lg shadow-lg p-1 flex gap-1"
            style={{
              left: selectionPosition.x,
              top: selectionPosition.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAiAction("expand")}
              disabled={isAiProcessing}
              className="gap-1"
              data-testid="button-ai-expand"
            >
              {isAiProcessing && aiAction === "expand" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Expand className="w-3 h-3" />
              )}
              Expand
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAiAction("rewrite")}
              disabled={isAiProcessing}
              className="gap-1"
              data-testid="button-ai-rewrite"
            >
              {isAiProcessing && aiAction === "rewrite" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Rewrite
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isAiProcessing}
                  className="gap-1"
                  data-testid="button-tone-menu"
                >
                  {isAiProcessing && !["expand", "rewrite", "continue"].includes(aiAction || "") ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Palette className="w-3 h-3" />
                  )}
                  Tone
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => handleToneRewrite("professional")} data-testid="tone-professional">
                  Professional
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToneRewrite("conversational")} data-testid="tone-conversational">
                  Conversational
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToneRewrite("academic")} data-testid="tone-academic">
                  Academic
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToneRewrite("friendly")} data-testid="tone-friendly">
                  Friendly
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToneRewrite("simplified")} data-testid="tone-simplified">
                  Simplified
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="h-8 border-t flex items-center justify-center px-4 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAiAction("continue")}
          disabled={isAiProcessing}
          className="gap-2 text-muted-foreground hover:text-foreground"
          data-testid="button-ai-continue"
        >
          {isAiProcessing && aiAction === "continue" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          Continue Writing with AI
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
