import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBookStudio, WorkflowStep } from "@/lib/contexts/BookStudioContext";
import {
  Lightbulb,
  FileText,
  Sparkles,
  Hammer,
  Rocket,
  ChevronRight,
  Check,
  Loader2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowTab {
  id: WorkflowStep;
  label: string;
  icon: typeof Lightbulb;
  description: string;
}

const workflowTabs: WorkflowTab[] = [
  { id: 'start', label: 'Start', icon: Lightbulb, description: 'Brainstorm or upload' },
  { id: 'plan', label: 'Plan', icon: FileText, description: 'Outline your book' },
  { id: 'generate', label: 'Generate', icon: Sparkles, description: 'AI writes chapters' },
  { id: 'build', label: 'Build', icon: Hammer, description: 'Edit & add images' },
  { id: 'publish', label: 'Publish', icon: Rocket, description: 'Export for KDP' },
];

function getStepStatus(step: WorkflowStep, currentStep: WorkflowStep, bookOutline: unknown, brainstormIdeas: unknown[]): 'completed' | 'current' | 'upcoming' {
  const stepOrder: WorkflowStep[] = ['start', 'plan', 'generate', 'build', 'publish'];
  const currentIndex = stepOrder.indexOf(currentStep);
  const stepIndex = stepOrder.indexOf(step);
  
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
}

export default function ToolPanel() {
  const { 
    currentStep, 
    setCurrentStep, 
    bookOutline,
    brainstormIdeas,
    isSaving,
    lastSaved,
    generationProgress
  } = useBookStudio();

  return (
    <div className="flex flex-col h-full bg-black/50 border-r border-orange-500/20">
      <div className="p-4 border-b border-orange-500/20">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          Workflow
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Follow the steps to create your book
        </p>
      </div>

      <nav className="flex-1 p-2 space-y-1" data-testid="workflow-nav">
        {workflowTabs.map((tab, index) => {
          const status = getStepStatus(tab.id, currentStep, bookOutline, brainstormIdeas);
          const isActive = currentStep === tab.id;
          const isGenerating = generationProgress.isGenerating && tab.id === 'generate';
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-auto py-3 px-3 text-left",
                isActive && "bg-orange-500/20 text-orange-400 border border-orange-500/30",
                status === 'completed' && !isActive && "text-green-400",
                status === 'upcoming' && !isActive && "text-muted-foreground opacity-60"
              )}
              onClick={() => setCurrentStep(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0",
                isActive && "border-orange-500 bg-orange-500/20",
                status === 'completed' && !isActive && "border-green-500 bg-green-500/20",
                status === 'upcoming' && !isActive && "border-muted-foreground/30"
              )}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : status === 'completed' && !isActive ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <tab.icon className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{tab.label}</div>
                <div className="text-xs text-muted-foreground truncate">{tab.description}</div>
              </div>
              {isActive && (
                <ChevronRight className="w-4 h-4 text-orange-500 shrink-0" />
              )}
            </Button>
          );
        })}
      </nav>

      <Separator className="bg-orange-500/20" />

      <div className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <Save className="w-3 h-3 text-green-500" />
              <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
            </>
          ) : (
            <span>Auto-save enabled</span>
          )}
        </div>

        {generationProgress.isGenerating && (
          <Badge className="mt-2 w-full justify-center bg-orange-500/20 text-orange-400 border-orange-500/30">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Generating {generationProgress.currentChapter}/{generationProgress.totalChapters}
          </Badge>
        )}
      </div>
    </div>
  );
}
